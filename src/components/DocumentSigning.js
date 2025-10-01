import React, { useState, useRef } from 'react';
import { storage, db } from '../config/firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { doc, updateDoc, arrayUnion, setDoc } from 'firebase/firestore';
import SignatureCanvas from 'react-signature-canvas';
import { PDFDocument, rgb } from 'pdf-lib';
import { PenTool, Save, RotateCcw, Check, X, Send, Eye, Copy, MousePointer } from 'lucide-react';
import toast from 'react-hot-toast';
import { v4 as uuidv4 } from 'uuid';

const DocumentSigning = ({ document, clientId, clientName, onClose, onSigned }) => {
  const [signatureData, setSignatureData] = useState(null);
  const [isSigning, setIsSigning] = useState(false);
  const [signingLinkGenerated, setSigningLinkGenerated] = useState(null);
  const [pdfDoc, setPdfDoc] = useState(null);
  const [signaturePosition, setSignaturePosition] = useState(null);
  const [showPositionSelector, setShowPositionSelector] = useState(false);
  
  const signaturePadRef = useRef(null);
  const pdfViewerRef = useRef(null);

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

  const handlePdfClick = (e) => {
    if (!showPositionSelector) return;
    
    const rect = e.target.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    // Convert screen coordinates to PDF coordinates
    const pdfX = (x / rect.width) * 612; // Standard page width
    const pdfY = 792 - (y / rect.height) * 792; // Standard page height, inverted Y
    
    setSignaturePosition({ x: pdfX, y: pdfY });
    toast.success('Signature position selected!');
    setShowPositionSelector(false);
  };

  const embedSignatureAndSave = async () => {
    if (!signatureData) {
      toast.error('Please provide a signature first');
      return;
    }

    if (!signaturePosition) {
      toast.error('Please select where to place the signature on the document');
      return;
    }

    setIsSigning(true);
    
    try {
      // Create a CORS proxy URL for Firebase Storage
      // This fixes the CORS issue
      let pdfBytes;
      
      try {
        // Try direct fetch first
        const response = await fetch(document.url, {
          mode: 'cors',
          credentials: 'omit'
        });
        
        if (!response.ok) {
          throw new Error('Direct fetch failed');
        }
        
        pdfBytes = await response.arrayBuffer();
      } catch (fetchError) {
        console.log('Direct fetch failed, trying alternative method...');
        
        // Alternative: Download via XMLHttpRequest
        pdfBytes = await new Promise((resolve, reject) => {
          const xhr = new XMLHttpRequest();
          xhr.open('GET', document.url, true);
          xhr.responseType = 'arraybuffer';
          
          xhr.onload = () => {
            if (xhr.status === 200) {
              resolve(xhr.response);
            } else {
              reject(new Error('XHR failed'));
            }
          };
          
          xhr.onerror = () => reject(new Error('XHR error'));
          xhr.send();
        });
      }
      
      const pdfDoc = await PDFDocument.load(pdfBytes);
      
      // Get first page
      const pages = pdfDoc.getPages();
      const firstPage = pages[0];
      const { width, height } = firstPage.getSize();
      
      // Convert signature to bytes
      const signatureImageBytes = signatureData.split(',')[1];
      const signatureImageBuffer = Uint8Array.from(atob(signatureImageBytes), c => c.charCodeAt(0));
      
      // Embed signature
      const signatureImage = await pdfDoc.embedPng(signatureImageBuffer);
      
      // Use selected position or default
      const sigWidth = 150;
      const sigHeight = 50;
      const sigX = signaturePosition ? signaturePosition.x : width - sigWidth - 50;
      const sigY = signaturePosition ? signaturePosition.y : 100;
      
      firstPage.drawImage(signatureImage, {
        x: sigX,
        y: sigY - sigHeight, // Adjust for image height
        width: sigWidth,
        height: sigHeight,
      });
      
      // Add text below signature
      firstPage.drawText(`${clientName}`, {
        x: sigX,
        y: sigY - sigHeight - 15,
        size: 10,
        color: rgb(0, 0, 0),
      });
      
      firstPage.drawText(`Signed: ${new Date().toLocaleDateString()}`, {
        x: sigX,
        y: sigY - sigHeight - 30,
        size: 8,
        color: rgb(0.3, 0.3, 0.3),
      });
      
      // Save the signed PDF
      const signedPdfBytes = await pdfDoc.save();
      const signedBlob = new Blob([signedPdfBytes], { type: 'application/pdf' });
      
      // Upload to Firebase with proper metadata
      const timestamp = Date.now();
      const signedFileName = `${clientId}/signed/${timestamp}-${document.name}`;
      const storageRef = ref(storage, `client-documents/${signedFileName}`);
      
      // Set proper metadata for CORS
      const metadata = {
        contentType: 'application/pdf',
        cacheControl: 'public, max-age=31536000',
        customMetadata: {
          'Access-Control-Allow-Origin': '*'
        }
      };
      
      const snapshot = await uploadBytes(storageRef, signedBlob, metadata);
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
        signedAt: new Date().toISOString(),
        signaturePosition: signaturePosition
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
      console.error('Error details:', error.message);
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
            <h4>Option 1: View & Select Signature Position</h4>
            <p>Open the document and click where you want to place the signature.</p>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button 
                className="btn-secondary"
                onClick={() => window.open(document.url, '_blank')}
              >
                <Eye size={18} />
                View Document
              </button>
              <button 
                className={`btn-secondary ${showPositionSelector ? 'active' : ''}`}
                onClick={() => {
                  setShowPositionSelector(!showPositionSelector);
                  toast.info(showPositionSelector ? 'Position selector disabled' : 'Click on the PDF preview below to select signature position');
                }}
              >
                <MousePointer size={18} />
                {showPositionSelector ? 'Cancel Selection' : 'Select Position'}
              </button>
            </div>
            
            {signaturePosition && (
              <div style={{ marginTop: '10px', padding: '10px', background: '#e8f5e9', borderRadius: '4px' }}>
                ✓ Signature position selected (x: {Math.round(signaturePosition.x)}, y: {Math.round(signaturePosition.y)})
              </div>
            )}
            
            {/* PDF Preview for position selection */}
            <div 
              ref={pdfViewerRef}
              style={{
                marginTop: '15px',
                border: '2px solid #ddd',
                borderRadius: '8px',
                overflow: 'hidden',
                cursor: showPositionSelector ? 'crosshair' : 'default',
                position: 'relative'
              }}
              onClick={handlePdfClick}
            >
              <iframe
                src={`${document.url}#toolbar=0&navpanes=0`}
                width="100%"
                height="400px"
                style={{ border: 'none', pointerEvents: showPositionSelector ? 'none' : 'auto' }}
                title="PDF Preview"
              />
              {showPositionSelector && (
                <div style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  background: 'rgba(33, 150, 243, 0.1)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '18px',
                  fontWeight: 'bold',
                  color: '#1976d2'
                }}>
                  Click where you want to place the signature
                </div>
              )}
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
              disabled={!signatureData || !signaturePosition || isSigning}
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
