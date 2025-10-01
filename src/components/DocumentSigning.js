import React, { useState, useRef, useEffect } from 'react';
import { storage, db } from '../config/firebase';
import { ref, uploadBytes, getDownloadURL, getBlob } from 'firebase/storage';
import { doc, updateDoc, arrayUnion, setDoc } from 'firebase/firestore';
import SignatureCanvas from 'react-signature-canvas';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import { Save, RotateCcw, X, Send, Eye, Copy, MapPin, Tag } from 'lucide-react';
import toast from 'react-hot-toast';
import { v4 as uuidv4 } from 'uuid';
import * as pdfjsLib from 'pdfjs-dist/webpack';

const DocumentSigning = ({ document, clientId, clientName, onClose, onSigned }) => {
  const [signatureData, setSignatureData] = useState(null);
  const [isSigning, setIsSigning] = useState(false);
  const [signingLinkGenerated, setSigningLinkGenerated] = useState(null);
  const [signaturePosition, setSignaturePosition] = useState(null);
  const [clickMode, setClickMode] = useState(false);
  const [markMode, setMarkMode] = useState(false);
  const [pdfPages, setPdfPages] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [pdfDoc, setPdfDoc] = useState(null);
  const [markers, setMarkers] = useState([]);
  
  const signaturePadRef = useRef(null);
  const canvasRef = useRef(null);

  useEffect(() => {
    loadPDF();
  }, [document.url]);

  useEffect(() => {
    if (pdfDoc && currentPage) {
      renderPage(currentPage);
    }
  }, [currentPage, pdfDoc, markers]);

  const loadPDF = async () => {
    try {
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
      
      // Draw markers on current page
      markers.filter(m => m.page === pageNum).forEach(marker => {
        const rect = canvas.getBoundingClientRect();
        const x = (marker.x / 612) * canvas.width;
        const y = canvas.height - ((marker.y / 792) * canvas.height);
        
        context.fillStyle = 'rgba(255, 235, 59, 0.3)';
        context.fillRect(x, y - 30, 150, 50);
        context.strokeStyle = '#FFC107';
        context.lineWidth = 2;
        context.strokeRect(x, y - 30, 150, 50);
        
        context.fillStyle = '#000';
        context.font = '12px Arial';
        context.fillText('Sign Here >', x + 5, y - 10);
      });
      
    } catch (error) {
      console.error('Error rendering page:', error);
    }
  };

  const handleCanvasClick = (e) => {
    if (!canvasRef.current) return;
    
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    // Convert to PDF coordinates
    const pdfX = (x / canvas.width) * 612;
    const pdfY = 792 - ((y / canvas.height) * 792);
    
    if (markMode) {
      // Add marker for client
      const newMarker = {
        x: Math.round(pdfX),
        y: Math.round(pdfY),
        page: currentPage,
        id: Date.now()
      };
      setMarkers([...markers, newMarker]);
      setMarkMode(false);
      toast.success('Signature field marked for client');
      renderPage(currentPage);
    } else if (clickMode) {
      // Set position for your signature
      setSignaturePosition({
        x: Math.round(pdfX),
        y: Math.round(pdfY),
        page: currentPage
      });
      setClickMode(false);
      toast.success(`Your signature position set on page ${currentPage}`);
      
      // Draw a marker
      const ctx = canvas.getContext('2d');
      const markerX = x;
      const markerY = y;
      ctx.fillStyle = 'rgba(0, 123, 255, 0.3)';
      ctx.fillRect(markerX, markerY - 30, 150, 50);
      ctx.strokeStyle = '#007bff';
      ctx.lineWidth = 2;
      ctx.strokeRect(markerX, markerY - 30, 150, 50);
    }
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

  const createMarkedDocumentForClient = async () => {
    if (markers.length === 0) {
      toast.error('Please mark at least one signature location first');
      return;
    }

    try {
      toast.info('Creating marked document for client...');
      
      // Get PDF
      const url = document.url;
      const pathMatch = url.match(/\/o\/(.+?)\?/);
      const encodedPath = pathMatch[1];
      const decodedPath = decodeURIComponent(encodedPath);
      
      const storageRef = ref(storage, decodedPath);
      const blob = await getBlob(storageRef);
      const pdfBytes = await blob.arrayBuffer();
      
      const pdfDoc = await PDFDocument.load(pdfBytes);
      const helveticaFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
      
      // Add markers to PDF
      markers.forEach(marker => {
        const page = pdfDoc.getPages()[marker.page - 1];
        
        // Draw yellow box
        page.drawRectangle({
          x: marker.x,
          y: marker.y - 50,
          width: 150,
          height: 50,
          borderColor: rgb(1, 0.76, 0.03),
          borderWidth: 2,
          color: rgb(1, 0.92, 0.23),
          opacity: 0.3,
        });
        
        // Add text
        page.drawText('Sign Here >', {
          x: marker.x + 5,
          y: marker.y - 30,
          size: 12,
          font: helveticaFont,
          color: rgb(0, 0, 0),
        });
      });
      
      const markedPdfBytes = await pdfDoc.save();
      const markedBlob = new Blob([markedPdfBytes], { type: 'application/pdf' });
      
      // Upload marked PDF
      const timestamp = Date.now();
      const markedFileName = `${clientId}/marked/${timestamp}-${document.name}`;
      const markedStorageRef = ref(storage, `client-documents/${markedFileName}`);
      
      await uploadBytes(markedStorageRef, markedBlob);
      const markedURL = await getDownloadURL(markedStorageRef);
      
      // Create signing session with marked document
      const sessionId = uuidv4();
      const signingData = {
        sessionId,
        documentId: document.id,
        documentName: document.name,
        documentUrl: markedURL,
        originalUrl: document.url,
        clientId,
        clientName,
        status: 'pending',
        markers: markers,
        createdAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
      };

      await setDoc(doc(db, 'signingSessions', sessionId), signingData);
      
      const signingLink = `${window.location.origin}/sign/${sessionId}`;
      setSigningLinkGenerated(signingLink);
      
      navigator.clipboard.writeText(signingLink);
      toast.success('Marked document created! Signing link copied to clipboard');
      
      return signingLink;
    } catch (error) {
      console.error('Error creating marked document:', error);
      toast.error('Failed to create marked document');
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
      const url = document.url;
      const pathMatch = url.match(/\/o\/(.+?)\?/);
      const encodedPath = pathMatch[1];
      const decodedPath = decodeURIComponent(encodedPath);
      
      const storageRef = ref(storage, decodedPath);
      const blob = await getBlob(storageRef);
      const pdfBytes = await blob.arrayBuffer();
      
      const pdfDoc = await PDFDocument.load(pdfBytes);
      const pages = pdfDoc.getPages();
      
      const pageIndex = signaturePosition.page - 1;
      const targetPage = pages[pageIndex];
      
      // Convert signature to bytes
      const signatureImageBytes = signatureData.split(',')[1];
      const signatureImageBuffer = Uint8Array.from(atob(signatureImageBytes), c => c.charCodeAt(0));
      
      const signatureImage = await pdfDoc.embedPng(signatureImageBuffer);
      
      const sigWidth = 150;
      const sigHeight = 50;
      
      // Adjusted: Place signature AT the Y coordinate, not below it
      const sigX = signaturePosition.x;
      const sigY = signaturePosition.y - sigHeight; // Signature box starts here
      
      targetPage.drawImage(signatureImage, {
        x: sigX,
        y: sigY,
        width: sigWidth,
        height: sigHeight,
      });
      
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
      
      const signedPdfBytes = await pdfDoc.save();
      const signedBlob = new Blob([signedPdfBytes], { type: 'application/pdf' });
      
      const timestamp = Date.now();
      const signedFileName = `${clientId}/signed/${timestamp}-${document.name}`;
      const storageRef2 = ref(storage, `client-documents/${signedFileName}`);
      
      const snapshot = await uploadBytes(storageRef2, signedBlob);
      const downloadURL = await getDownloadURL(snapshot.ref);
      
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
      
      const clientRef = doc(db, 'clients', clientId);
      await updateDoc(clientRef, {
        documents: arrayUnion(signedDocData)
      });
      
      toast.success('Document signed and saved!');
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
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '10px' }}>
                <button 
                  onClick={() => {
                    setClickMode(!clickMode);
                    setMarkMode(false);
                    if (!clickMode) {
                      renderPage(currentPage);
                    }
                    toast.info(clickMode ? 'Click mode disabled' : 'Click where YOU want to sign');
                  }}
                  style={{
                    padding: '10px',
                    background: clickMode ? '#dc3545' : '#007bff',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '12px'
                  }}
                >
                  <MapPin size={16} style={{ display: 'inline', marginRight: '5px' }} />
                  {clickMode ? 'Cancel' : 'Sign Here (You)'}
                </button>

                <button 
                  onClick={() => {
                    setMarkMode(!markMode);
                    setClickMode(false);
                    toast.info(markMode ? 'Mark mode disabled' : 'Click where CLIENT should sign');
                  }}
                  style={{
                    padding: '10px',
                    background: markMode ? '#dc3545' : '#FFC107',
                    color: markMode ? 'white' : '#000',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '12px'
                  }}
                >
                  <Tag size={16} style={{ display: 'inline', marginRight: '5px' }} />
                  {markMode ? 'Cancel' : 'Mark for Client'}
                </button>
              </div>

              {signaturePosition && (
                <div style={{
                  padding: '8px',
                  background: '#d4edda',
                  border: '1px solid #c3e6cb',
                  borderRadius: '4px',
                  fontSize: '12px',
                  marginBottom: '5px'
                }}>
                  ✓ Your signature position set (page {signaturePosition.page})
                </div>
              )}

              {markers.length > 0 && (
                <div style={{
                  padding: '8px',
                  background: '#fff3cd',
                  border: '1px solid #ffc107',
                  borderRadius: '4px',
                  fontSize: '12px'
                }}>
                  {markers.length} signature field(s) marked for client
                </div>
              )}
            </div>
            
            <div style={{
              border: (clickMode || markMode) ? '3px solid ' + (clickMode ? '#007bff' : '#FFC107') : '2px solid #ddd',
              borderRadius: '8px',
              overflow: 'auto',
              maxHeight: '500px',
              background: '#f5f5f5',
              cursor: (clickMode || markMode) ? 'crosshair' : 'default'
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
                width: '100%',
                padding: '8px 15px',
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
                gap: '8px',
                marginBottom: '10px'
              }}
            >
              <Save size={20} />
              {isSigning ? 'Signing...' : 'Sign & Save (You)'}
            </button>

            <div style={{ padding: '15px', background: '#f8f9fa', borderRadius: '4px' }}>
              <h4 style={{ marginTop: 0, marginBottom: '10px' }}>Send to Client</h4>
              
              {markers.length > 0 ? (
                <button 
                  onClick={createMarkedDocumentForClient}
                  style={{
                    width: '100%',
                    padding: '10px',
                    background: '#FFC107',
                    color: '#000',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    marginBottom: '10px',
                    fontWeight: '500'
                  }}
                >
                  <Send size={16} />
                  Send Marked Document to Client
                </button>
              ) : (
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
                  Send Unmarked Document
                </button>
              )}
              
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
