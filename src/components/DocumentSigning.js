import React, { useState, useRef } from 'react';
import { storage, db } from '../config/firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { doc, updateDoc, arrayUnion, setDoc } from 'firebase/firestore';
import SignatureCanvas from 'react-signature-canvas';
import { PDFDocument } from 'pdf-lib';
import { PenTool, Save, RotateCcw, Check, X, Send, Eye, Copy } from 'lucide-react';
import toast from 'react-hot-toast';
import { v4 as uuidv4 } from 'uuid';

const DocumentSigning = ({ document, clientId, clientName, onClose, onSigned }) => {
  const [signatureData, setSignatureData] = useState(null);
  const [isSigning, setIsSigning] = useState(false);
  const [signingLinkGenerated, setSigningLinkGenerated] = useState(null);
  
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
      // Create a unique signing session
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
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() // 7 days
      };

      // Save to Firestore
      await setDoc(doc(db, 'signingSessions', sessionId), signingData);
      
      // Generate the signing link
      const signingLink = `${window.location.origin}/sign/${sessionId}`;
      setSigningLinkGenerated(signingLink);
      
      // Copy to clipboard
      navigator.clipboard.writeText(signingLink);
      toast.success('Signing link copied to clipboard!');
      
      return signingLink;
    } catch (error) {
      console.error('Error creating signing session:', error);
      toast.error('Failed to create signing link');
    }
  };

  const embedSignatureAndSave = async () => {
    if (!signatureData) {
      toast.error('Please provide a signature first');
      return;
    }

    setIsSigning(true);
    
    try {
      // Fetch the PDF
      const response = await fetch(document.url);
      if (!response.ok) throw new Error('Failed to fetch PDF');
      
      const pdfBytes = await response.arrayBuffer();
      const pdfDoc = await PDFDocument.load(pdfBytes);
      
      // Get first page (you can modify this to handle multiple pages)
      const pages = pdfDoc.getPages();
      const firstPage = pages[0];
      const { width, height } = firstPage.getSize();
      
      // Convert signature to bytes
      const signatureImageBytes = signatureData.split(',')[1];
      const signatureImageBuffer = Uint8Array.from(atob(signatureImageBytes), c => c.charCodeAt(0));
      
      // Embed signature
      const signatureImage = await pdfDoc.embedPng(signatureImageBuffer);
      
      // Place signature at bottom of page (adjust position as needed)
      const sigWidth = 200;
      const sigHeight = 60;
      const sigX = width - sigWidth - 50; // Right side
      const sigY = 50; // Bottom
      
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
      });
      
      firstPage.drawText(`Signed: ${new Date().toLocaleDateString()}`, {
        x: sigX,
        y: sigY - 25,
        size: 8,
      });
      
      // Save the signed PDF
      const signedPdfBytes = await pdfDoc.save();
      const signedBlob = new Blob([signedPdfBytes], { type: 'application/pdf' });
      
      // Upload to Firebase
      const timestamp = Date.now();
      const signedFileName = `${clientId}/${timestamp}-signed-${document.name}`;
      const storageRef = ref(storage, `client-documents/${signedFileName}`);
      
      const snapshot = await uploadBytes(storageRef, signedBlob);
      const downloadURL = await getDownloadURL(snapshot.ref);
      
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
        signedAt: new Date().toISOString()
      };
      
      // Update client documents
      const clientRef = doc(db, 'clients', clientId);
      await updateDoc(clientRef, {
        documents: arrayUnion(signedDocData)
      });
      
      toast.success('Document signed and saved!');
      
      // Open signed document in new tab
      window.open(downloadURL, '_blank');
      
      if (onSigned) {
        onSigned(signedDocData);
      }
      
      setTimeout(() => onClose(), 2000);
    } catch (error) {
      console.error('Error signing document:', error);
      toast.error('Failed to sign document. Please try again.');
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
            <h4>Option 1: View Document First</h4>
            <p>Open the document to see where to sign, then come back here to add your signature.</p>
            <button 
              className="btn-secondary"
              onClick={() => window.open(document.url, '_blank')}
            >
              <Eye size={18} />
              View Document in New Tab
            </button>
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
              <div className="signing-link-display">
                <input 
                  type="text" 
                  value={signingLinkGenerated} 
                  readOnly 
                  className="link-input"
                />
                <button 
                  onClick={() => {
                    navigator.clipboard.writeText(signingLinkGenerated);
                    toast.success('Copied!');
                  }}
                  className="btn-icon"
                >
                  <Copy size={16} />
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
                height: 150
              }}
              backgroundColor="white"
              onEnd={saveSignature}
            />
          </div>
          
          <div className="signature-actions">
            <button className="btn-secondary" onClick={clearSignature}>
              <RotateCcw size={18} />
              Clear
            </button>
            <button 
              className="btn-primary"
              onClick={embedSignatureAndSave}
              disabled={!signatureData || isSigning}
            >
              <Save size={18} />
              {isSigning ? 'Signing...' : 'Sign & Save Document'}
            </button>
          </div>

          {signatureData && (
            <div className="signature-preview">
              <p>Signature Preview:</p>
              <img src={signatureData} alt="Your signature" />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DocumentSigning;
