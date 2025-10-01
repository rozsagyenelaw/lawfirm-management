import React, { useState, useRef } from 'react';
import { storage, db } from '../config/firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { doc, updateDoc, arrayUnion, setDoc } from 'firebase/firestore';
import SignatureCanvas from 'react-signature-canvas';
import { PDFDocument, rgb } from 'pdf-lib';
import { Save, RotateCcw, X, Send, Eye, Copy } from 'lucide-react';
import toast from 'react-hot-toast';
import { v4 as uuidv4 } from 'uuid';

const DocumentSigning = ({ document, clientId, clientName, onClose, onSigned }) => {
  const [signatureData, setSignatureData] = useState(null);
  const [isSigning, setIsSigning] = useState(false);
  const [signingLinkGenerated, setSigningLinkGenerated] = useState(null);
  const [signaturePosition, setSignaturePosition] = useState('bottom-right'); // Default position
  
  const signaturePadRef = useRef(null);

  const clearSignature = () => {
    if (signaturePadRef.current) {
      signaturePadRef.current.clear();
      setSignatureData(null);
    }
  };

  const saveSignature = () => {
    if (signaturePadRef.current && !signaturePadRef.current.isEmpty()) {
      const data = signaturePadRef.current.toDataURL();
      setSignatureData(data);
      toast.success('Signature captured');
    } else {
      toast.error('Please provide a signature');
    }
  };

  const createSigningSession = async () => {
    try {
      const sessionId = uuidv4();
      const signingData = {
        sessionId,
        documentId: document.id,
        documentName: document.name,
        documentUrl: document.url,
        clientId,
        clientName,
        status: 'pending',
        createdAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
      };

      await setDoc(doc(db, 'signingSessions', sessionId), signingData);
      
      const signingLink = `${window.location.origin}/sign/${sessionId}`;
      setSigningLinkGenerated(signingLink);
      
      navigator.clipboard.writeText(signingLink);
      toast.success('Signing link copied to clipboard!');
      
      return signingLink;
    } catch (error) {
      console.error('Error creating signing session:', error);
      toast.error('Failed to create signing link');
    }
  };

  const getPositionCoordinates = (position, pageWidth, pageHeight) => {
    const sigWidth = 150;
    const sigHeight = 50;
    const margin = 50;

    switch(position) {
      case 'top-left':
        return { x: margin, y: pageHeight - margin - sigHeight };
      case 'top-right':
        return { x: pageWidth - sigWidth - margin, y: pageHeight - margin - sigHeight };
      case 'bottom-left':
        return { x: margin, y: margin };
      case 'bottom-right':
        return { x: pageWidth - sigWidth - margin, y: margin };
      case 'center':
        return { x: (pageWidth - sigWidth) / 2, y: (pageHeight - sigHeight) / 2 };
      default:
        return { x: pageWidth - sigWidth - margin, y: margin };
    }
  };

  const embedSignatureAndSave = async () => {
    if (!signatureData) {
      toast.error('Please provide a signature first');
      return;
    }

    setIsSigning(true);
    
    try {
      console.log('Fetching PDF from:', document.url);
      
      // Try to fetch the PDF with proper error handling
      let pdfBytes;
      
      try {
        const response = await fetch(document.url);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        pdfBytes = await response.arrayBuffer();
        console.log('PDF fetched successfully, size:', pdfBytes.byteLength);
      } catch (fetchError) {
        console.error('Fetch failed:', fetchError);
        toast.error('Failed to load PDF. Check if the document URL is accessible.');
        throw fetchError;
      }
      
      // Load the PDF
      const pdfDoc = await PDFDocument.load(pdfBytes);
      console.log('PDF loaded successfully');
      
      // Get first page
      const pages = pdfDoc.getPages();
      const firstPage = pages[0];
      const { width, height } = firstPage.getSize();
      console.log('Page size:', width, 'x', height);
      
      // Convert signature to bytes
      const signatureImageBytes = signatureData.split(',')[1];
      const signatureImageBuffer = Uint8Array.from(atob(signatureImageBytes), c => c.charCodeAt(0));
      
      // Embed signature
      const signatureImage = await pdfDoc.embedPng(signatureImageBuffer);
      console.log('Signature image embedded');
      
      // Get position coordinates
      const { x: sigX, y: sigY } = getPositionCoordinates(signaturePosition, width, height);
      const sigWidth = 150;
      const sigHeight = 50;
      
      // Draw signature
      firstPage.drawImage(signatureImage, {
        x: sigX,
        y: sigY,
        width: sigWidth,
        height: sigHeight,
      });
      
      // Add text below signature
      firstPage.drawText(`${clientName}`, {
        x: sigX,
        y: sigY - 15,
        size: 10,
        color: rgb(0, 0, 0),
      });
      
      firstPage.drawText(`Signed: ${new Date().toLocaleDateString()}`, {
        x: sigX,
        y: sigY - 30,
        size: 8,
        color: rgb(0.3, 0.3, 0.3),
      });
      
      console.log('Signature drawn at position:', signaturePosition);
      
      // Save the signed PDF
      const signedPdfBytes = await pdfDoc.save();
      const signedBlob = new Blob([signedPdfBytes], { type: 'application/pdf' });
      console.log('Signed PDF created, size:', signedBlob.size);
      
      // Upload to Firebase
      const timestamp = Date.now();
      const signedFileName = `${clientId}/signed/${timestamp}-${document.name}`;
      const storageRef = ref(storage, `client-documents/${signedFileName}`);
      
      console.log('Uploading to Firebase Storage...');
      const snapshot = await uploadBytes(storageRef, signedBlob);
      const downloadURL = await getDownloadURL(snapshot.ref);
      console.log('Upload complete, URL:', downloadURL);
      
      // Save metadata
      const signedDocData = {
        id: timestamp.toString(),
        name: `SIGNED-${document.name}`,
        url: downloadURL,
        path: signedFileName,
        size: signedBlob.size,
        uploadedAt: new Date().toISOString(),
        type: 'pdf',
        clientId,
        clientName,
        originalDocId: document.id,
        signedBy: clientName,
        signedAt: new Date().toISOString(),
        signaturePosition: signaturePosition
      };
      
      // Update client documents
      const clientRef = doc(db, 'clients', clientId);
      await updateDoc(clientRef, {
        documents: arrayUnion(signedDocData)
      });
      
      console.log('Metadata saved to Firestore');
      toast.success('Document signed and saved!');
      
      // Open signed document in new tab
      window.open(downloadURL, '_blank');
      
      if (onSigned) {
        onSigned(signedDocData);
      }
      
      setTimeout(() => onClose(), 2000);
    } catch (error) {
      console.error('Error signing document:', error);
      console.error('Error stack:', error.stack);
      toast.error(`Failed to sign document: ${error.message}`);
    } finally {
      setIsSigning(false);
    }
  };

  return (
    <div className="document-signing-modal">
      <div className="signing-header">
        <h2>Sign Document: {document.name}</h2>
        <button className="btn-text" onClick={onClose}>
          <X size={20} />
        </button>
      </div>

      <div className="signing-content-simple">
        <div className="signing-instructions">
          <h3>Document Signing Options</h3>
          
          <div className="signing-option">
            <h4>Option 1: View Document & Choose Signature Position</h4>
            <p>Open the document to see where to sign, then select the position below.</p>
            <button 
              className="btn-secondary"
              onClick={() => window.open(document.url, '_blank')}
            >
              <Eye size={18} />
              View Document in New Tab
            </button>

            <div style={{ marginTop: '15px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
                Select Signature Position:
              </label>
              <select 
                value={signaturePosition}
                onChange={(e) => {
                  setSignaturePosition(e.target.value);
                  toast.success(`Position set to ${e.target.value}`);
                }}
                style={{
                  width: '100%',
                  padding: '10px',
                  borderRadius: '4px',
                  border: '1px solid #ddd',
                  fontSize: '14px'
                }}
              >
                <option value="bottom-right">Bottom Right (Default)</option>
                <option value="bottom-left">Bottom Left</option>
                <option value="top-right">Top Right</option>
                <option value="top-left">Top Left</option>
                <option value="center">Center</option>
              </select>
              <p style={{ 
                marginTop: '8px', 
                fontSize: '12px', 
                color: '#666',
                padding: '8px',
                background: '#f0f0f0',
                borderRadius: '4px'
              }}>
                ✓ Signature will be placed at: <strong>{signaturePosition}</strong>
              </p>
            </div>
          </div>

          <div className="signing-option">
            <h4>Option 2: Send to Client</h4>
            <p>Generate a link to send to your client for signing.</p>
            <button 
              className="btn-secondary"
              onClick={createSigningSession}
            >
              <Send size={18} />
              Generate Signing Link
            </button>
            
            {signingLinkGenerated && (
              <div className="signing-link-display" style={{ marginTop: '10px' }}>
                <input 
                  type="text" 
                  value={signingLinkGenerated} 
                  readOnly 
                  style={{
                    width: '100%',
                    padding: '8px',
                    borderRadius: '4px',
                    border: '1px solid #ddd',
                    marginBottom: '8px'
                  }}
                />
                <button 
                  onClick={() => {
                    navigator.clipboard.writeText(signingLinkGenerated);
                    toast.success('Copied!');
                  }}
                  className="btn-secondary"
                  style={{ width: '100%' }}
                >
                  <Copy size={16} />
                  Copy Link
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="signature-section">
          <h3>Draw Your Signature</h3>
          <div className="signature-pad-wrapper">
            <SignatureCanvas
              ref={signaturePadRef}
              canvasProps={{
                className: 'signature-canvas',
                width: 500,
                height: 150,
                style: { border: '1px solid #ddd', borderRadius: '4px' }
              }}
              backgroundColor="white"
              onEnd={saveSignature}
            />
          </div>
          
          <div className="signature-actions" style={{ marginTop: '15px', display: 'flex', gap: '10px' }}>
            <button className="btn-secondary" onClick={clearSignature}>
              <RotateCcw size={18} />
              Clear
            </button>
            <button 
              className="btn-primary"
              onClick={embedSignatureAndSave}
              disabled={!signatureData || isSigning}
              style={{ flex: 1 }}
            >
              <Save size={18} />
              {isSigning ? 'Signing...' : 'Sign & Save Document'}
            </button>
          </div>

          {signatureData && (
            <div className="signature-preview" style={{ marginTop: '15px' }}>
              <p style={{ fontWeight: '500', marginBottom: '8px' }}>Signature Preview:</p>
              <img 
                src={signatureData} 
                alt="Your signature" 
                style={{ 
                  border: '1px solid #ddd', 
                  borderRadius: '4px',
                  maxWidth: '300px',
                  background: 'white',
                  padding: '10px'
                }}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DocumentSigning;
