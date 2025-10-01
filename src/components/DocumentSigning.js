import React, { useState, useRef, useEffect } from 'react';
import { storage, db } from '../config/firebase';
import { ref, uploadBytes, getDownloadURL, getBlob } from 'firebase/storage';
import { doc, updateDoc, arrayUnion, setDoc } from 'firebase/firestore';
import SignatureCanvas from 'react-signature-canvas';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import { Save, RotateCcw, X, Send, Eye, Copy, MapPin, Tag, Move } from 'lucide-react';
import toast from 'react-hot-toast';
import { v4 as uuidv4 } from 'uuid';

const DocumentSigning = ({ document, clientId, clientName, onClose, onSigned }) => {
  const [signatureData, setSignatureData] = useState(null);
  const [isSigning, setIsSigning] = useState(false);
  const [signingLinkGenerated, setSigningLinkGenerated] = useState(null);
  const [signatureBox, setSignatureBox] = useState(null); // {x, y, width, height, page}
  const [clientBoxes, setClientBoxes] = useState([]); // Array of boxes for clients
  const [draggedBox, setDraggedBox] = useState(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [pageImageUrl, setPageImageUrl] = useState(null);
  const [isLoadingPage, setIsLoadingPage] = useState(false);
  
  const signaturePadRef = useRef(null);
  const pdfContainerRef = useRef(null);
  const pdfDocRef = useRef(null);

  // Detect total pages from PDF URL
  useEffect(() => {
    const loadPdfInfo = async () => {
      try {
        const url = document.url;
        const response = await fetch(url);
        const blob = await response.blob();
        const arrayBuffer = await blob.arrayBuffer();
        
        const pdfDoc = await PDFDocument.load(arrayBuffer);
        const pages = pdfDoc.getPages();
        setTotalPages(pages.length);
      } catch (error) {
        console.error('Error loading PDF info:', error);
        setTotalPages(1);
      }
    };
    
    loadPdfInfo();
  }, [document.url]);

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

  const handlePdfClick = (e) => {
    const container = pdfContainerRef.current;
    if (!container) return;

    const rect = container.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Create a signature box at click position
    const box = {
      x: x - 75, // Center the 150px box on click
      y: y - 25, // Center the 50px box on click
      width: 150,
      height: 50,
      page: currentPage // Assign to current page being viewed
    };

    setSignatureBox(box);
    toast.success('Drag the blue box to position it exactly!');
  };

  const handleMouseDown = (e, box, isClient = false) => {
    e.stopPropagation();
    const rect = pdfContainerRef.current.getBoundingClientRect();
    setDraggedBox({ box, isClient });
    setDragOffset({
      x: e.clientX - rect.left - box.x,
      y: e.clientY - rect.top - box.y
    });
  };

  const handleMouseMove = (e) => {
    if (!draggedBox || !pdfContainerRef.current) return;

    const rect = pdfContainerRef.current.getBoundingClientRect();
    const newX = e.clientX - rect.left - dragOffset.x;
    const newY = e.clientY - rect.top - dragOffset.y;

    const updatedBox = {
      ...draggedBox.box,
      x: Math.max(0, Math.min(newX, rect.width - draggedBox.box.width)),
      y: Math.max(0, Math.min(newY, rect.height - draggedBox.box.height))
    };

    if (draggedBox.isClient) {
      setClientBoxes(clientBoxes.map(b => 
        b.id === draggedBox.box.id ? updatedBox : b
      ));
    } else {
      setSignatureBox(updatedBox);
    }
  };

  const handleMouseUp = () => {
    if (draggedBox) {
      toast.success('Position set!');
    }
    setDraggedBox(null);
  };

  const addClientBox = () => {
    const container = pdfContainerRef.current;
    if (!container) {
      toast.error('Please wait for PDF to load');
      return;
    }

    const rect = container.getBoundingClientRect();
    const box = {
      id: Date.now(),
      x: rect.width / 2 - 75,
      y: rect.height / 2 - 25,
      width: 150,
      height: 50,
      page: currentPage // Assign to current page
    };

    setClientBoxes([...clientBoxes, box]);
    toast.success('Yellow box added - drag it to position');
  };

  const removeClientBox = (id) => {
    setClientBoxes(clientBoxes.filter(b => b.id !== id));
    toast.success('Removed');
  };

  const convertToPdfCoordinates = (box, pdfWidth, pdfHeight, containerWidth, containerHeight) => {
    // Convert from screen/container pixels to PDF points
    const scaleX = pdfWidth / containerWidth;
    const scaleY = pdfHeight / containerHeight;
    
    // PDF coordinates: Y starts at bottom
    return {
      x: box.x * scaleX,
      y: pdfHeight - (box.y * scaleY) - (box.height * scaleY), // Flip Y and account for box height
      width: box.width * scaleX,
      height: box.height * scaleY
    };
  };

  const embedSignatureAndSave = async () => {
    if (!signatureData) {
      toast.error('Please provide a signature first');
      return;
    }

    if (!signatureBox) {
      toast.error('Please click on the PDF to place your signature');
      return;
    }

    setIsSigning(true);
    
    try {
      // Get PDF
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
      const page = pages[0]; // For now, first page
      const { width, height } = page.getSize();
      
      // Get container dimensions for conversion
      const container = pdfContainerRef.current;
      const rect = container.getBoundingClientRect();
      
      // Convert box position to PDF coordinates
      const pdfCoords = convertToPdfCoordinates(
        signatureBox,
        width,
        height,
        rect.width,
        rect.height
      );

      console.log('Container dimensions:', rect.width, rect.height);
      console.log('PDF dimensions:', width, height);
      console.log('Box position (screen):', signatureBox);
      console.log('Box position (PDF):', pdfCoords);
      
      // Embed signature
      const signatureImageBytes = signatureData.split(',')[1];
      const signatureImageBuffer = Uint8Array.from(atob(signatureImageBytes), c => c.charCodeAt(0));
      const signatureImage = await pdfDoc.embedPng(signatureImageBuffer);
      
      page.drawImage(signatureImage, {
        x: pdfCoords.x,
        y: pdfCoords.y,
        width: pdfCoords.width,
        height: pdfCoords.height,
      });
      
      // Add text below signature
      page.drawText(`${clientName}`, {
        x: pdfCoords.x,
        y: pdfCoords.y - 15,
        size: 10,
        color: rgb(0, 0, 0),
      });
      
      page.drawText(`Signed: ${new Date().toLocaleDateString()}`, {
        x: pdfCoords.x,
        y: pdfCoords.y - 30,
        size: 8,
        color: rgb(0.3, 0.3, 0.3),
      });
      
      // Save signed PDF
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
        signaturePosition: pdfCoords
      };
      
      // Update client documents
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

  const createMarkedDocumentForClient = async () => {
    if (clientBoxes.length === 0) {
      toast.error('Please add at least one signature field for the client');
      return;
    }

    try {
      toast.success('Creating marked document...');
      
      const url = document.url;
      const pathMatch = url.match(/\/o\/(.+?)\?/);
      const encodedPath = pathMatch[1];
      const decodedPath = decodeURIComponent(encodedPath);
      
      const storageRef = ref(storage, decodedPath);
      const blob = await getBlob(storageRef);
      const pdfBytes = await blob.arrayBuffer();
      
      const pdfDoc = await PDFDocument.load(pdfBytes);
      const helveticaFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
      const pages = pdfDoc.getPages();
      const page = pages[0];
      const { width, height } = page.getSize();
      
      const container = pdfContainerRef.current;
      const rect = container.getBoundingClientRect();
      
      clientBoxes.forEach(box => {
        const pdfCoords = convertToPdfCoordinates(box, width, height, rect.width, rect.height);
        
        page.drawRectangle({
          x: pdfCoords.x,
          y: pdfCoords.y,
          width: pdfCoords.width,
          height: pdfCoords.height,
          borderColor: rgb(1, 0.76, 0.03),
          borderWidth: 2,
          color: rgb(1, 0.92, 0.23),
          opacity: 0.3,
        });
        
        page.drawText('Sign Here >', {
          x: pdfCoords.x + 5,
          y: pdfCoords.y + pdfCoords.height / 2 - 5,
          size: 12,
          font: helveticaFont,
          color: rgb(0, 0, 0),
        });
      });
      
      const markedPdfBytes = await pdfDoc.save();
      const markedBlob = new Blob([markedPdfBytes], { type: 'application/pdf' });
      
      const timestamp = Date.now();
      const markedFileName = `${clientId}/marked/${timestamp}-${document.name}`;
      const markedStorageRef = ref(storage, `client-documents/${markedFileName}`);
      
      await uploadBytes(markedStorageRef, markedBlob);
      const markedURL = await getDownloadURL(markedStorageRef);
      
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
        markers: clientBoxes,
        createdAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
      };

      await setDoc(doc(db, 'signingSessions', sessionId), signingData);
      
      const signingLink = `${window.location.origin}/sign/${sessionId}`;
      setSigningLinkGenerated(signingLink);
      
      navigator.clipboard.writeText(signingLink);
      toast.success('Marked document created! Link copied');
      
    } catch (error) {
      console.error('Error:', error);
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
      toast.success('Link copied!');
      
    } catch (error) {
      console.error('Error:', error);
      toast.error('Failed to create link');
    }
  };

  return (
    <div 
      style={{ 
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
      }}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
    >
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
          {/* Left - PDF Preview */}
          <div>
            <h3>Document Preview</h3>
            
            <div style={{ marginBottom: '15px' }}>
              {/* Page Navigation */}
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'space-between',
                marginBottom: '15px',
                padding: '10px',
                background: '#f8f9fa',
                borderRadius: '4px'
              }}>
                <button
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  style={{
                    padding: '8px 15px',
                    background: currentPage === 1 ? '#ccc' : '#007bff',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
                    fontWeight: '500'
                  }}
                >
                  Previous
                </button>
                <span style={{ fontWeight: '500', fontSize: '14px' }}>
                  Page {currentPage} of {totalPages}
                </span>
                <button
                  onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages}
                  style={{
                    padding: '8px 15px',
                    background: currentPage === totalPages ? '#ccc' : '#007bff',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
                    fontWeight: '500'
                  }}
                >
                  Next
                </button>
              </div>

              <button 
                onClick={handlePdfClick}
                disabled={!!signatureBox}
                style={{
                  width: '100%',
                  padding: '10px',
                  background: signatureBox ? '#28a745' : '#007bff',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: signatureBox ? 'not-allowed' : 'pointer',
                  marginBottom: '10px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  fontWeight: '500'
                }}
              >
                <MapPin size={18} />
                {signatureBox ? `✓ Your Signature on Page ${signatureBox.page}` : 'Click PDF to Place Your Signature'}
              </button>

              <button 
                onClick={addClientBox}
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
                  fontWeight: '500'
                }}
              >
                <Tag size={18} />
                Add Client Signature Field (Page {currentPage})
              </button>

              {signatureBox && (
                <div style={{
                  marginTop: '10px',
                  padding: '10px',
                  background: '#d4edda',
                  border: '1px solid #c3e6cb',
                  borderRadius: '4px',
                  fontSize: '13px'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontWeight: '500' }}>✓ Your signature (Page {signatureBox.page})</span>
                    <button
                      onClick={() => {
                        setSignatureBox(null);
                        toast.success('Removed');
                      }}
                      style={{
                        padding: '4px 8px',
                        background: '#dc3545',
                        color: 'white',
                        border: 'none',
                        borderRadius: '3px',
                        cursor: 'pointer',
                        fontSize: '11px'
                      }}
                    >
                      Remove
                    </button>
                  </div>
                  {signatureBox.page === currentPage ? (
                    <div style={{ fontSize: '12px', marginTop: '5px', color: '#155724' }}>
                      <Move size={12} style={{ display: 'inline', marginRight: '5px' }} />
                      Drag the blue box to adjust
                    </div>
                  ) : (
                    <div style={{ fontSize: '12px', marginTop: '5px', color: '#856404' }}>
                      Go to page {signatureBox.page} to adjust position
                    </div>
                  )}
                </div>
              )}

              {clientBoxes.length > 0 && (
                <div style={{
                  marginTop: '10px',
                  padding: '10px',
                  background: '#fff3cd',
                  border: '1px solid #ffc107',
                  borderRadius: '4px',
                  fontSize: '13px'
                }}>
                  <div style={{ fontWeight: '500', marginBottom: '5px' }}>
                    {clientBoxes.length} client field{clientBoxes.length > 1 ? 's' : ''}
                  </div>
                  {clientBoxes.filter(b => b.page === currentPage).length > 0 ? (
                    clientBoxes.filter(b => b.page === currentPage).map(box => (
                      <div key={box.id} style={{ 
                        display: 'flex', 
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginTop: '5px',
                        padding: '5px',
                        background: 'white',
                        borderRadius: '3px'
                      }}>
                        <span style={{ fontSize: '12px' }}>
                          <Move size={12} style={{ display: 'inline', marginRight: '5px' }} />
                          Drag yellow box
                        </span>
                        <button
                          onClick={() => removeClientBox(box.id)}
                          style={{
                            padding: '2px 6px',
                            background: '#dc3545',
                            color: 'white',
                            border: 'none',
                            borderRadius: '3px',
                            cursor: 'pointer',
                            fontSize: '10px'
                          }}
                        >
                          Remove
                        </button>
                      </div>
                    ))
                  ) : (
                    <div style={{ fontSize: '12px', color: '#856404', marginTop: '5px' }}>
                      No fields on this page. Navigate to other pages to see fields.
                    </div>
                  )}
                </div>
              )}
            </div>
            
            <div 
              ref={pdfContainerRef}
              onClick={handlePdfClick}
              style={{
                position: 'relative',
                border: '2px solid #ddd',
                borderRadius: '8px',
                overflow: 'hidden',
                minHeight: '500px',
                background: '#f5f5f5',
                cursor: draggedBox ? 'grabbing' : (signatureBox ? 'default' : 'crosshair')
              }}
            >
              <iframe
                key={currentPage}
                src={`${document.url}#page=${currentPage}&toolbar=0&navpanes=0&scrollbar=0`}
                style={{
                  width: '100%',
                  height: '500px',
                  border: 'none',
                  pointerEvents: 'none'
                }}
                title="PDF Preview"
              />
              
              {/* Your signature box (blue) - only show on current page */}
              {signatureBox && signatureBox.page === currentPage && (
                <div
                  onMouseDown={(e) => handleMouseDown(e, signatureBox, false)}
                  style={{
                    position: 'absolute',
                    left: signatureBox.x,
                    top: signatureBox.y,
                    width: signatureBox.width,
                    height: signatureBox.height,
                    background: 'rgba(0, 123, 255, 0.3)',
                    border: '3px solid #007bff',
                    borderRadius: '4px',
                    cursor: 'grab',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#007bff',
                    fontWeight: 'bold',
                    fontSize: '13px',
                    userSelect: 'none',
                    pointerEvents: 'auto'
                  }}
                >
                  You Sign Here
                </div>
              )}
              
              {/* Client boxes (yellow) - only show on current page */}
              {clientBoxes.filter(box => box.page === currentPage).map(box => (
                <div
                  key={box.id}
                  onMouseDown={(e) => handleMouseDown(e, box, true)}
                  style={{
                    position: 'absolute',
                    left: box.x,
                    top: box.y,
                    width: box.width,
                    height: box.height,
                    background: 'rgba(255, 235, 59, 0.3)',
                    border: '3px solid #FFC107',
                    borderRadius: '4px',
                    cursor: 'grab',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#000',
                    fontWeight: 'bold',
                    fontSize: '13px',
                    userSelect: 'none',
                    pointerEvents: 'auto'
                  }}
                >
                  Sign Here &gt;
                </div>
              ))}
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

          {/* Right - Signature */}
          <div>
            <h3>Your Signature</h3>
            
            <div style={{ marginBottom: '20px' }}>
              <p style={{ fontSize: '14px', marginBottom: '10px' }}>Draw your signature:</p>
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
              
              <button 
                onClick={clearSignature}
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
                <RotateCcw size={16} />
                Clear
              </button>

              {signatureData && (
                <div style={{ marginTop: '15px' }}>
                  <p style={{ fontSize: '14px', fontWeight: '500', marginBottom: '8px' }}>Preview:</p>
                  <img 
                    src={signatureData} 
                    alt="Signature" 
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
              disabled={!signatureData || !signatureBox || isSigning}
              style={{
                width: '100%',
                padding: '12px',
                background: (!signatureData || !signatureBox || isSigning) ? '#ccc' : '#28a745',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: (!signatureData || !signatureBox || isSigning) ? 'not-allowed' : 'pointer',
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
              {isSigning ? 'Signing...' : 'Sign & Save Document'}
            </button>

            <div style={{ padding: '15px', background: '#f8f9fa', borderRadius: '4px' }}>
              <h4 style={{ marginTop: 0, marginBottom: '10px' }}>Send to Client</h4>
              
              {clientBoxes.length > 0 ? (
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
                  Send Marked Document
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
