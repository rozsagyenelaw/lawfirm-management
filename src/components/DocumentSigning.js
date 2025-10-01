import React, { useState, useRef } from 'react';
import { storage, db } from '../config/firebase';
import { ref, uploadBytes, getDownloadURL, getBlob } from 'firebase/storage';
import { doc, updateDoc, arrayUnion, setDoc } from 'firebase/firestore';
import SignatureCanvas from 'react-signature-canvas';
import { PDFDocument, rgb } from 'pdf-lib';
import { Save, RotateCcw, X, Send, Eye, Copy, MapPin } from 'lucide-react';
import toast from 'react-hot-toast';
import { v4 as uuidv4 } from 'uuid';

const DocumentSigning = ({ document, clientId, clientName, onClose, onSigned }) => {
  const [signatureData, setSignatureData] = useState(null);
  const [isSigning, setIsSigning] = useState(false);
  const [signingLinkGenerated, setSigningLinkGenerated] = useState(null);
  const [signaturePosition, setSignaturePosition] = useState(null);
  const [selectedPage, setSelectedPage] = useState(1);
  const [manualCoords, setManualCoords] = useState({ x: '', y: '' });
  
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

  const handleManualCoords = () => {
    const x = parseInt(manualCoords.x);
    const y = parseInt(manualCoords.y);
    
    if (isNaN(x) || isNaN(y)) {
      toast.error('Please enter valid numbers for X and Y coordinates');
      return;
    }
    
    setSignaturePosition({ x, y, page: selectedPage });
    toast.success(`Position set to X=${x}, Y=${y} on page ${selectedPage}`);
  };

  const embedSignatureAndSave = async () => {
    if (!signatureData) {
      toast.error('Please provide a signature first');
      return;
    }

    if (!signaturePosition) {
      toast.error('Please enter coordinates to place the signature');
      return;
    }

    setIsSigning(true);
    
    try {
      console.log('Starting signature process...');
      console.log('Selected page:', signaturePosition.page);
      console.log('Coordinates:', signaturePosition.x, signaturePosition.y);
      
      // Extract path from URL
      let pdfBytes;
      const url = document.url;
      const pathMatch = url.match(/\/o\/(.+?)\?/);
      
      if (pathMatch) {
        const encodedPath = pathMatch[1];
        const decodedPath = decodeURIComponent(encodedPath);
        console.log('Extracted path:', decodedPath);
        
        const storageRef = ref(storage, decodedPath);
        const blob = await getBlob(storageRef);
        pdfBytes = await blob.arrayBuffer();
        console.log('PDF fetched successfully');
      } else {
        throw new Error('Could not extract storage path from URL');
      }
      
      const pdfDoc = await PDFDocument.load(pdfBytes);
      const pages = pdfDoc.getPages();
      
      // Get the selected page (convert to 0-indexed)
      const pageIndex = (signaturePosition.page || 1) - 1;
      
      if (pageIndex < 0 || pageIndex >= pages.length) {
        throw new Error(`Invalid page number. Document has ${pages.length} pages.`);
      }
      
      const targetPage = pages[pageIndex];
      const { width, height } = targetPage.getSize();
      
      console.log(`Page ${signaturePosition.page} size:`, width, 'x', height);
      
      // Convert signature to bytes
      const signatureImageBytes = signatureData.split(',')[1];
      const signatureImageBuffer = Uint8Array.from(atob(signatureImageBytes), c => c.charCodeAt(0));
      
      // Embed signature
      const signatureImage = await pdfDoc.embedPng(signatureImageBuffer);
      
      // Signature dimensions
      const sigWidth = 150;
      const sigHeight = 50;
      
      // Use exact coordinates provided by user
      const sigX = signaturePosition.x;
      const sigY = signaturePosition.y;
      
      console.log('Placing signature at:', sigX, sigY);
      
      targetPage.drawImage(signatureImage, {
        x: sigX,
        y: sigY,
        width: sigWidth,
        height: sigHeight,
      });
      
      // Add text below signature
      targetPage.drawText(`${clientName}`, {
        x: sigX,
        y: sigY - 15,
        size: 10,
        color: rgb(0, 0, 0),
      });
      
      targetPage.drawText(`Signed: ${new Date().toLocaleDateString()}`, {
        x: sigX,
        y: sigY - 30,
        size: 8,
        color: rgb(0.3, 0.3, 0.3),
      });
      
      console.log('Signature embedded');
      
      // Save the signed PDF
      const signedPdfBytes = await pdfDoc.save();
      const signedBlob = new Blob([signedPdfBytes], { type: 'application/pdf' });
      
      console.log('Signed PDF created, uploading to Firebase...');
      
      // Upload to Firebase
      const timestamp = Date.now();
      const signedFileName = `${clientId}/signed/${timestamp}-${document.name}`;
      const storageRef = ref(storage, `client-documents/${signedFileName}`);
      
      const snapshot = await uploadBytes(storageRef, signedBlob);
      const downloadURL = await getDownloadURL(snapshot.ref);
      
      console.log('Upload complete');
      
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
    <div style={{ 
      position: 'fixed', 
      top: 0, 
      left: 0, 
      right: 0, 
      bottom: 0, 
      background: 'rgba(0,0,0,0.5)', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center',
      zIndex: 1000,
      padding: '20px',
      overflow: 'auto'
    }}>
      <div style={{
        background: 'white',
        borderRadius: '8px',
        maxWidth: '1200px',
        width: '100%',
        maxHeight: '90vh',
        overflow: 'auto',
        padding: '20px'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h2 style={{ margin: 0 }}>Sign Document: {document.name}</h2>
          <button onClick={onClose} style={{ 
            background: 'none', 
            border: 'none', 
            cursor: 'pointer',
            padding: '5px'
          }}>
            <X size={24} />
          </button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
          {/* Left side - PDF Preview & Position Selection */}
          <div>
            <h3>Document Preview & Signature Position</h3>
            
            <div style={{ marginBottom: '15px', padding: '15px', background: '#f8f9fa', borderRadius: '4px' }}>
              <h4 style={{ marginTop: 0 }}>Set Signature Position</h4>
              <p style={{ fontSize: '14px', color: '#666', marginBottom: '10px' }}>
                PDF coordinates: X goes from left (0) to right (612 for standard page). Y goes from bottom (0) to top (792 for standard page).
              </p>
              
              <div style={{ marginBottom: '10px' }}>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>
                  Page Number:
                </label>
                <input
                  type="number"
                  min="1"
                  value={selectedPage}
                  onChange={(e) => setSelectedPage(parseInt(e.target.value) || 1)}
                  style={{
                    width: '100%',
                    padding: '8px',
                    borderRadius: '4px',
                    border: '1px solid #ddd'
                  }}
                />
              </div>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '10px' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>
                    X Coordinate:
                  </label>
                  <input
                    type="number"
                    value={manualCoords.x}
                    onChange={(e) => setManualCoords({ ...manualCoords, x: e.target.value })}
                    placeholder="e.g. 400"
                    style={{
                      width: '100%',
                      padding: '8px',
                      borderRadius: '4px',
                      border: '1px solid #ddd'
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>
                    Y Coordinate:
                  </label>
                  <input
                    type="number"
                    value={manualCoords.y}
                    onChange={(e) => setManualCoords({ ...manualCoords, y: e.target.value })}
                    placeholder="e.g. 100"
                    style={{
                      width: '100%',
                      padding: '8px',
                      borderRadius: '4px',
                      border: '1px solid #ddd'
                    }}
                  />
                </div>
              </div>
              
              <button
                onClick={handleManualCoords}
                style={{
                  width: '100%',
                  padding: '10px',
                  background: '#007bff',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px'
                }}
              >
                <MapPin size={18} />
                Set Position
              </button>
              
              {signaturePosition && (
                <div style={{
                  marginTop: '10px',
                  padding: '10px',
                  background: '#d4edda',
                  border: '1px solid #c3e6cb',
                  borderRadius: '4px',
                  fontSize: '14px'
                }}>
                  ✓ Position set: Page {signaturePosition.page}, X={signaturePosition.x}, Y={signaturePosition.y}
                </div>
              )}
              
              <div style={{ marginTop: '10px', fontSize: '12px', color: '#666' }}>
                <strong>Common positions:</strong><br />
                • Bottom right: X=400, Y=50<br />
                • Bottom left: X=50, Y=50<br />
                • Top right: X=400, Y=700<br />
                • Center: X=230, Y=370
              </div>
            </div>
            
            <div style={{
              border: '2px solid #ddd',
              borderRadius: '8px',
              overflow: 'hidden',
              height: '400px',
              background: '#f5f5f5'
            }}>
              <iframe
                src={`${document.url}#toolbar=0&page=${selectedPage}`}
                style={{
                  width: '100%',
                  height: '100%',
                  border: 'none'
                }}
                title="PDF Preview"
              />
            </div>

            <button 
              onClick={() => window.open(document.url, '_blank')}
              style={{
                marginTop: '10px',
                padding: '8px 15px',
                background: '#6c757d',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              <Eye size={16} />
              Open Full Document
            </button>
          </div>

          {/* Right side - Signature */}
          <div>
            <h3>Your Signature</h3>
            
            <div style={{ marginBottom: '20px' }}>
              <p style={{ fontSize: '14px', marginBottom: '10px' }}>Draw your signature below:</p>
              <div style={{ border: '2px solid #ddd', borderRadius: '4px', overflow: 'hidden' }}>
                <SignatureCanvas
                  ref={signaturePadRef}
                  canvasProps={{
                    width: 500,
                    height: 150,
                    style: { width: '100%', height: '150px' }
                  }}
                  backgroundColor="white"
                  onEnd={saveSignature}
                />
              </div>
              
              <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                <button 
                  onClick={clearSignature}
                  style={{
                    padding: '8px 15px',
                    background: '#6c757d',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}
                >
                  <RotateCcw size={16} />
                  Clear
                </button>
              </div>

              {signatureData && (
                <div style={{ marginTop: '15px' }}>
                  <p style={{ fontSize: '14px', fontWeight: '500', marginBottom: '8px' }}>Preview:</p>
                  <img 
                    src={signatureData} 
                    alt="Signature preview" 
                    style={{ 
                      border: '1px solid #ddd', 
                      borderRadius: '4px',
                      padding: '10px',
                      background: 'white',
                      maxWidth: '100%'
                    }}
                  />
                </div>
              )}
            </div>

            <button 
              onClick={embedSignatureAndSave}
              disabled={!signatureData || !signaturePosition || isSigning}
              style={{
                width: '100%',
                padding: '12px',
                background: (!signatureData || !signaturePosition || isSigning) ? '#ccc' : '#28a745',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: (!signatureData || !signaturePosition || isSigning) ? 'not-allowed' : 'pointer',
                fontSize: '16px',
                fontWeight: '500',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px'
              }}
            >
              <Save size={20} />
              {isSigning ? 'Signing Document...' : 'Sign & Save Document'}
            </button>

            <div style={{ marginTop: '30px', padding: '15px', background: '#f8f9fa', borderRadius: '4px' }}>
              <h4 style={{ marginTop: 0 }}>Send to Client</h4>
              <p style={{ fontSize: '14px', color: '#666' }}>Generate a signing link for your client:</p>
              <button 
                onClick={createSigningSession}
                style={{
                  width: '100%',
                  padding: '10px',
                  background: '#17a2b8',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  marginBottom: '10px'
                }}
              >
                <Send size={16} />
                Generate Signing Link
              </button>
              
              {signingLinkGenerated && (
                <div>
                  <input 
                    type="text" 
                    value={signingLinkGenerated} 
                    readOnly 
                    style={{
                      width: '100%',
                      padding: '8px',
                      borderRadius: '4px',
                      border: '1px solid #ddd',
                      marginBottom: '8px',
                      fontSize: '12px'
                    }}
                  />
                  <button 
                    onClick={() => {
                      navigator.clipboard.writeText(signingLinkGenerated);
                      toast.success('Link copied!');
                    }}
                    style={{
                      width: '100%',
                      padding: '8px',
                      background: '#6c757d',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px'
                    }}
                  >
                    <Copy size={14} />
                    Copy Link
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DocumentSigning;
