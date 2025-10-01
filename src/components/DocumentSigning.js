import React, { useState, useRef, useEffect } from 'react';
import { storage, db } from '../config/firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { doc, updateDoc, arrayUnion } from 'firebase/firestore';
import SignatureCanvas from 'react-signature-canvas';
import { PDFDocument } from 'pdf-lib';
import { Document, Page, pdfjs } from 'react-pdf';
import { PenTool, Save, RotateCcw, Check, X, Move, Download, Eye, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import 'react-pdf/dist/esm/Page/AnnotationLayer.css';
import 'react-pdf/dist/esm/Page/TextLayer.css';

// Set up PDF.js worker
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.js`;

const DocumentSigning = ({ document, clientId, clientName, onClose, onSigned }) => {
  const [numPages, setNumPages] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [signatureFields, setSignatureFields] = useState([]);
  const [activeSignature, setActiveSignature] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [draggedField, setDraggedField] = useState(null);
  const [isSigning, setIsSigning] = useState(false);
  const [viewMode, setViewMode] = useState('setup'); // 'setup', 'sign', 'preview'
  const [pageScale, setPageScale] = useState(1);
  const [pdfBytes, setPdfBytes] = useState(null);
  
  const signaturePadRef = useRef(null);
  const pageRef = useRef(null);

  useEffect(() => {
    // Load PDF bytes for signing
    loadPdfBytes();
  }, [document]);

  const loadPdfBytes = async () => {
    try {
      const response = await fetch(document.url);
      const arrayBuffer = await response.arrayBuffer();
      setPdfBytes(arrayBuffer);
    } catch (error) {
      console.error('Error loading PDF:', error);
      toast.error('Failed to load document');
    }
  };

  const onDocumentLoadSuccess = ({ numPages }) => {
    setNumPages(numPages);
    toast.success('Document loaded successfully');
  };

  const addSignatureField = () => {
    const newField = {
      id: Date.now().toString(),
      page: currentPage,
      x: 100,
      y: 100,
      width: 200,
      height: 60,
      signed: false,
      signatureData: null
    };
    setSignatureFields([...signatureFields, newField]);
    setDraggedField(newField.id);
  };

  const handleMouseDown = (e, fieldId) => {
    if (viewMode !== 'setup') return;
    setIsDragging(true);
    setDraggedField(fieldId);
  };

  const handleMouseMove = (e) => {
    if (!isDragging || !draggedField || !pageRef.current) return;
    
    const rect = pageRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    setSignatureFields(fields =>
      fields.map(field =>
        field.id === draggedField 
          ? { ...field, x: x / pageScale, y: y / pageScale }
          : field
      )
    );
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const deleteSignatureField = (fieldId) => {
    setSignatureFields(fields => fields.filter(f => f.id !== fieldId));
    toast.success('Signature field removed');
  };

  const clearSignature = () => {
    if (signaturePadRef.current) {
      signaturePadRef.current.clear();
    }
  };

  const saveSignature = (fieldId) => {
    if (signaturePadRef.current && !signaturePadRef.current.isEmpty()) {
      const signatureData = signaturePadRef.current.toDataURL();
      setSignatureFields(fields =>
        fields.map(field =>
          field.id === fieldId 
            ? { ...field, signed: true, signatureData } 
            : field
        )
      );
      setActiveSignature(null);
      clearSignature();
      toast.success('Signature saved');
    } else {
      toast.error('Please provide a signature');
    }
  };

  const embedSignaturesAndSave = async () => {
    if (!pdfBytes || signatureFields.length === 0) {
      toast.error('Please add at least one signature');
      return;
    }

    const unsignedFields = signatureFields.filter(f => !f.signed);
    if (unsignedFields.length > 0) {
      toast.error(`Please complete all ${unsignedFields.length} signature field(s)`);
      return;
    }

    setIsSigning(true);
    
    try {
      // Load the PDF
      const pdfDoc = await PDFDocument.load(pdfBytes);
      
      // Embed signatures at exact positions
      for (const field of signatureFields) {
        if (field.signatureData) {
          const page = pdfDoc.getPages()[field.page - 1];
          const { height } = page.getSize();
          
          // Convert base64 to bytes
          const signatureImageBytes = field.signatureData.split(',')[1];
          const signatureImageBuffer = Uint8Array.from(atob(signatureImageBytes), c => c.charCodeAt(0));
          
          // Embed the signature image
          const signatureImage = await pdfDoc.embedPng(signatureImageBuffer);
          
          // Draw signature at exact position (PDF coordinates are bottom-up)
          page.drawImage(signatureImage, {
            x: field.x,
            y: height - field.y - field.height, // Convert from top-down to bottom-up
            width: field.width,
            height: field.height,
          });
        }
      }
      
      // Save the signed PDF
      const signedPdfBytes = await pdfDoc.save();
      const signedBlob = new Blob([signedPdfBytes], { type: 'application/pdf' });
      
      // Upload to Firebase Storage
      const timestamp = Date.now();
      const signedFileName = `${clientId}/${timestamp}-signed-${document.name}`;
      const storageRef = ref(storage, `client-documents/${signedFileName}`);
      
      const snapshot = await uploadBytes(storageRef, signedBlob);
      const downloadURL = await getDownloadURL(snapshot.ref);
      
      // Create signed document metadata
      const signedDocData = {
        id: timestamp.toString(),
        name: `SIGNED-${document.name}`,
        url: downloadURL,
        path: signedFileName,
        size: signedBlob.size,
        uploadedAt: new Date().toISOString(),
        type: 'pdf',
        clientId: clientId,
        clientName: clientName,
        originalDocId: document.id,
        signedBy: clientName,
        signedAt: new Date().toISOString()
      };
      
      // Save to Firestore
      const clientRef = doc(db, 'clients', clientId);
      await updateDoc(clientRef, {
        documents: arrayUnion(signedDocData)
      });
      
      toast.success('Document signed and saved successfully!');
      
      if (onSigned) {
        onSigned(signedDocData);
      }
      
      onClose();
    } catch (error) {
      console.error('Error signing document:', error);
      toast.error('Failed to sign document: ' + error.message);
    } finally {
      setIsSigning(false);
    }
  };

  return (
    <div className="document-signing-modal" onMouseMove={handleMouseMove} onMouseUp={handleMouseUp}>
      <div className="signing-header">
        <h2>Sign Document: {document.name}</h2>
        <div className="header-actions">
          {viewMode === 'setup' && (
            <button 
              className="btn-primary"
              onClick={() => setViewMode('sign')}
              disabled={signatureFields.length === 0}
            >
              <PenTool size={18} />
              Start Signing ({signatureFields.filter(f => f.page === currentPage).length} on this page)
            </button>
          )}
          {viewMode === 'sign' && (
            <button 
              className="btn-primary"
              onClick={embedSignaturesAndSave}
              disabled={isSigning || signatureFields.some(f => !f.signed)}
            >
              <Save size={18} />
              {isSigning ? 'Saving...' : 'Save Signed Document'}
            </button>
          )}
          <button className="btn-text" onClick={onClose}>
            <X size={20} />
          </button>
        </div>
      </div>

      <div className="signing-content">
        <div className="pdf-viewer-container">
          <div className="pdf-controls">
            <button 
              disabled={currentPage <= 1}
              onClick={() => setCurrentPage(currentPage - 1)}
            >
              Previous
            </button>
            <span>Page {currentPage} of {numPages || '...'}</span>
            <button 
              disabled={currentPage >= numPages}
              onClick={() => setCurrentPage(currentPage + 1)}
            >
              Next
            </button>
            <button onClick={() => setPageScale(pageScale + 0.1)}>Zoom In</button>
            <button onClick={() => setPageScale(Math.max(0.5, pageScale - 0.1))}>Zoom Out</button>
          </div>

          <div className="pdf-page-wrapper">
            <div className="pdf-page-container" ref={pageRef}>
              <Document
                file={document.url}
                onLoadSuccess={onDocumentLoadSuccess}
                loading={<div>Loading PDF...</div>}
                error={<div>Error loading PDF. <button onClick={() => window.open(document.url, '_blank')}>Open in new tab</button></div>}
              >
                <Page 
                  pageNumber={currentPage}
                  scale={pageScale}
                  renderTextLayer={false}
                  renderAnnotationLayer={false}
                />
              </Document>

              {/* Signature fields overlay */}
              {signatureFields
                .filter(field => field.page === currentPage)
                .map(field => (
                  <div
                    key={field.id}
                    className={`signature-field-overlay ${field.signed ? 'signed' : ''} ${viewMode === 'sign' && !field.signed ? 'ready-to-sign' : ''}`}
                    style={{
                      position: 'absolute',
                      left: `${field.x * pageScale}px`,
                      top: `${field.y * pageScale}px`,
                      width: `${field.width * pageScale}px`,
                      height: `${field.height * pageScale}px`,
                      border: field.signed ? '2px solid #10b981' : '2px dashed #ef4444',
                      backgroundColor: field.signed ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                      cursor: viewMode === 'setup' ? 'move' : 'pointer',
                    }}
                    onMouseDown={(e) => handleMouseDown(e, field.id)}
                    onClick={() => viewMode === 'sign' && !field.signed && setActiveSignature(field.id)}
                  >
                    {field.signed && field.signatureData ? (
                      <img 
                        src={field.signatureData} 
                        alt="Signature" 
                        style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                      />
                    ) : (
                      <div className="signature-field-content">
                        {viewMode === 'setup' && (
                          <>
                            <span>Sign Here</span>
                            <button 
                              className="delete-field-btn"
                              onClick={(e) => {
                                e.stopPropagation();
                                deleteSignatureField(field.id);
                              }}
                            >
                              <X size={14} />
                            </button>
                          </>
                        )}
                        {viewMode === 'sign' && !field.signed && (
                          <span>Click to Sign</span>
                        )}
                      </div>
                    )}
                  </div>
                ))}
            </div>

            {viewMode === 'setup' && (
              <div className="setup-instructions">
                <p>Drag signature fields to position them exactly where signatures are needed</p>
                <button className="btn-primary" onClick={addSignatureField}>
                  <PenTool size={18} />
                  Add Signature Field
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Signature Pad */}
        {viewMode === 'sign' && activeSignature && (
          <div className="signature-pad-panel">
            <h3>Sign Here</h3>
            <div className="signature-canvas-wrapper">
              <SignatureCanvas
                ref={signaturePadRef}
                canvasProps={{
                  className: 'signature-canvas',
                  width: 400,
                  height: 150
                }}
                backgroundColor="white"
              />
            </div>
            <div className="signature-actions">
              <button className="btn-secondary" onClick={clearSignature}>
                <RotateCcw size={18} />
                Clear
              </button>
              <button 
                className="btn-primary" 
                onClick={() => saveSignature(activeSignature)}
              >
                <Check size={18} />
                Save Signature
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DocumentSigning;
