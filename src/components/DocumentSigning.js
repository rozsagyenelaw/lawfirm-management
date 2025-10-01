import React, { useState, useRef, useEffect } from 'react';
import { storage, db } from '../config/firebase';
import { ref, uploadBytes, getDownloadURL, getBlob } from 'firebase/storage';
import { doc, updateDoc, arrayUnion, setDoc } from 'firebase/firestore';
import SignatureCanvas from 'react-signature-canvas';
import { PDFDocument, rgb } from 'pdf-lib';
import { Save, RotateCcw, X, Send, Eye, Copy, MapPin } from 'lucide-react';
import toast from 'react-hot-toast';
import { v4 as uuidv4 } from 'uuid';
import * as pdfjsLib from 'pdfjs-dist/webpack';

const DocumentSigning = ({ document, clientId, clientName, onClose, onSigned }) => {
  const [signatureData, setSignatureData] = useState(null);
  const [isSigning, setIsSigning] = useState(false);
  const [signingLinkGenerated, setSigningLinkGenerated] = useState(null);
  const [signaturePosition, setSignaturePosition] = useState(null);
  const [clickMode, setClickMode] = useState(false);
  const [pdfPages, setPdfPages] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [pdfDoc, setPdfDoc] = useState(null);
  
  const signaturePadRef = useRef(null);
  const canvasRef = useRef(null);

  useEffect(() => {
    loadPDF();
  }, [document.url]);

  useEffect(() => {
    if (pdfDoc && currentPage) {
      renderPage(currentPage);
    }
  }, [currentPage, pdfDoc]);

  const loadPDF = async () => {
    try {
      // Extract path and get blob
      const url = document.url;
      const pathMatch = url.match(/\/o\/(.+?)\?/);
      
      if (!pathMatch) {
        throw new Error('Could not extract path from URL');
      }
      
      const encodedPath = pathMatch[1];
      const decodedPath = decodeURIComponent(encodedPath);
      
      const storageRef = ref(storage, decodedPath);
      const blob = await getBlob(storageRef);
      const arrayBuffer = await blob.arrayBuffer();
      
      const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
      const pdf = await loadingTask.promise;
      setPdfDoc(pdf);
      
      const pages = [];
      for (let i = 1; i <= pdf.numPages; i++) {
        pages.push(i);
      }
      setPdfPages(pages);
      
    } catch (error) {
      console.error('Error loading PDF:', error);
      toast.error('Failed to load PDF preview');
    }
  };

  const renderPage = async (pageNum) => {
    if (!pdfDoc || !canvasRef.current) return;
    
    try {
      const page = await pdfDoc.getPage(pageNum);
      const canvas = canvasRef.current;
      const context = canvas.getContext('2d');
      
      const viewport = page.getViewport({ scale: 1.5 });
      canvas.height = viewport.height;
      canvas.width = viewport.width;
      
      const renderContext = {
        canvasContext: context,
        viewport: viewport
      };
      
      await page.render(renderContext).promise;
    } catch (error) {
      console.error('Error rendering page:', error);
    }
  };

  const handleCanvasClick = (e) => {
    if (!clickMode || !canvasRef.current) return;
    
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    
    // Get click position relative to canvas
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    // Get canvas dimensions
    const canvasWidth = canvas.width;
    const canvasHeight = canvas.height;
    
    // Convert to PDF coordinates (standard letter: 612 x 792)
    const pdfX = (x / rect.width) * 612;
    const pdfY = 792 - ((y / rect.height) * 792); // Invert Y axis
    
    setSignaturePosition({
      x: Math.round(pdfX),
      y: Math.round(pdfY),
      page: currentPage
    });
    
    setClickMode(false);
    toast.success(`Signature position set on page ${currentPage}`);
    
    // Draw a marker on canvas
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = 'rgba(0, 123, 255, 0.3)';
    ctx.fillRect(x, y, 100, 30);
    ctx.strokeStyle = '#007bff';
    ctx.lineWidth = 2;
    ctx.strokeRect(x, y, 100, 30);
  };

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

  const embedSignatureAndSave = async () => {
    if (!signatureData) {
      toast.error('Please provide a signature first');
      return;
    }

    if (!signaturePosition) {
      toast.error('Please click on the document to select where to place the signature');
      return;
    }

    setIsSigning(true);
    
    try {
      console.log('Starting signature process...');
      
      // Extract path from URL
      const url = document.url;
      const pathMatch = url.match(/\/o\/(.+?)\?/);
      
      if (!pathMatch) {
        throw new Error('Could not extract storage path from URL');
      }
      
      const encodedPath = pathMatch[1];
      const decodedPath = decodeURIComponent(encodedPath);
      
      const storageRef = ref(storage, decodedPath);
      const blob = await getBlob(storageRef);
      const pdfBytes = await blob.arrayBuffer();
      
      const pdfDoc = await PDFDocument.load(pdfBytes);
      const pages = pdfDoc.getPages();
      
      // Get the selected page
      const pageIndex = signaturePosition.page - 1;
      
      if (pageIndex < 0 || pageIndex >= pages.length) {
        throw new Error(`Invalid page number`);
      }
      
      const targetPage = pages[pageIndex];
      const { width, height } = targetPage.getSize();
      
      console.log(`Signing page ${signaturePosition.page}, size: ${width}x${height}`);
      console.log(`Position: X=${signaturePosition.x}, Y=${signaturePosition.y}`);
      
      // Convert signature to bytes
      const signatureImageBytes = signatureData.split(',')[1];
      const signatureImageBuffer = Uint8Array.from(atob(signatureImageBytes), c => c.charCodeAt(0));
      
      // Embed signature
      const signatureImage = await pdfDoc.embedPng(signatureImageBuffer);
      
      // Signature dimensions
      const sigWidth = 150;
      const sigHeight = 50;
      
      // Use exact coordinates
      const sigX = signaturePosition.x;
      const sigY = signaturePosition.y - sigHeight; // Adjust for signature height
      
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
      
      // Save the signed PDF
      const signedPdfBytes = await pdfDoc.save();
      const signedBlob = new Blob([signedPdfBytes], { type: 'application/pdf' });
      
      // Upload to Firebase
      const timestamp = Date.now();
      const signedFileName = `${clientId}/signed/${timestamp}-${document.name}`;
      const storageRef2 = ref(storage, `client-documents/${signedFileName}`);
      
      const snapshot = await uploadBytes(storageRef2, signedBlob);
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
          {/* Left side - PDF Preview */}
          <div>
            <h3>Document Preview</h3>
            
            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>
                Page: {currentPage} of {pdfPages.length}
              </label>
              <div style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
                <button
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  style={{
                    padding: '8px 15px',
                    background: currentPage === 1 ? '#ccc' : '#6c757d',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: currentPage === 1 ? 'not-allowed' : 'pointer'
                  }}
                >
                  Previous
                </button>
                <button
                  onClick={() => setCurrentPage(Math.min(pdfPages.length, currentPage + 1))}
                  disabled={currentPage === pdfPages.length}
                  style={{
                    padding: '8px 15px',
                    background: currentPage === pdfPages.length ? '#ccc' : '#6c757d',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: currentPage === pdfPages.length ? 'not-allowed' : 'pointer'
                  }}
                >
                  Next
                </button>
              </div>
              
              <button 
                onClick={() => {
                  setClickMode(!clickMode);
                  if (!clickMode) {
                    renderPage(currentPage); // Re-render to clear markers
                  }
                  toast.info(clickMode ? 'Click mode disabled' : 'Click on the document where you want to place the signature');
                }}
                style={{
                  width: '100%',
                  padding: '10px 15px',
                  background: clickMode ? '#dc3545' : '#007bff',
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
                <MapPin size={18} />
                {clickMode ? 'Cancel Selection' : 'Click to Select Position'}
              </button>

              {signaturePosition && (
                <div style={{
                  padding: '10px',
                  background: '#d4edda',
                  border: '1px solid #c3e6cb',
                  borderRadius: '4px',
                  fontSize: '14px',
                  marginBottom: '10px'
                }}>
                  ✓ Signature position set on page {signaturePosition.page}
                </div>
              )}
            </div>
            
            <div style={{
              border: clickMode ? '3px solid #007bff' : '2px solid #ddd',
              borderRadius: '8px',
              overflow: 'auto',
              maxHeight: '500px',
              background: '#f5f5f5',
              cursor: clickMode ? 'crosshair' : 'default'
            }}>
              <canvas
                ref={canvasRef}
                onClick={handleCanvasClick}
                style={{
                  width: '100%',
                  height: 'auto',
                  display: 'block'
                }}
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
