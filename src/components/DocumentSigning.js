import React, { useState, useRef, useEffect } from 'react';
import { storage, db } from '../config/firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { doc, updateDoc, arrayUnion, getDoc } from 'firebase/firestore';
import SignatureCanvas from 'react-signature-canvas';
import { PDFDocument, rgb } from 'pdf-lib';
import { PenTool, Save, RotateCcw, Check, X, Move, Download, Send, Eye } from 'lucide-react';
import toast from 'react-hot-toast';
import '../styles/DocumentSigning.css';

const DocumentSigning = ({ document, clientId, clientName, onClose, onSigned }) => {
  const [pdfDoc, setPdfDoc] = useState(null);
  const [pdfPages, setPdfPages] = useState([]);
  const [currentPage, setCurrentPage] = useState(0);
  const [signatureFields, setSignatureFields] = useState([]);
  const [activeSignature, setActiveSignature] = useState(null);
  const [isPlacingSignature, setIsPlacingSignature] = useState(false);
  const [isSigning, setIsSigning] = useState(false);
  const [signedUrl, setSignedUrl] = useState(null);
  const [viewMode, setViewMode] = useState('setup'); // 'setup', 'sign', 'preview'
  
  const signaturePadRef = useRef(null);
  const pdfCanvasRef = useRef(null);

  useEffect(() => {
    loadPdfDocument();
  }, [document]);

  const loadPdfDocument = async () => {
    try {
      const response = await fetch(document.url);
      const arrayBuffer = await response.arrayBuffer();
      const pdfDoc = await PDFDocument.load(arrayBuffer);
      setPdfDoc(pdfDoc);
      
      // Render PDF pages as images for preview
      const pages = [];
      const pageCount = pdfDoc.getPageCount();
      
      for (let i = 0; i < pageCount; i++) {
        // For now, we'll store page numbers - in production you'd render to canvas
        pages.push({ pageNumber: i, width: 612, height: 792 }); // Standard letter size
      }
      setPdfPages(pages);
    } catch (error) {
      console.error('Error loading PDF:', error);
      toast.error('Failed to load document');
    }
  };

  const addSignatureField = () => {
    const newField = {
      id: Date.now().toString(),
      page: currentPage,
      x: 100,
      y: 100,
      width: 200,
      height: 80,
      signed: false,
      signatureData: null
    };
    setSignatureFields([...signatureFields, newField]);
    setActiveSignature(newField.id);
    setIsPlacingSignature(true);
  };

  const updateSignaturePosition = (fieldId, x, y) => {
    setSignatureFields(fields =>
      fields.map(field =>
        field.id === fieldId ? { ...field, x, y } : field
      )
    );
  };

  const deleteSignatureField = (fieldId) => {
    setSignatureFields(fields => fields.filter(f => f.id !== fieldId));
    setActiveSignature(null);
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
      toast.success('Signature saved');
    } else {
      toast.error('Please provide a signature');
    }
  };

  const embedSignaturesAndSave = async () => {
    if (!pdfDoc || signatureFields.length === 0) {
      toast.error('Please add at least one signature');
      return;
    }

    const unsignedFields = signatureFields.filter(f => !f.signed);
    if (unsignedFields.length > 0) {
      toast.error('Please complete all signature fields');
      return;
    }

    setIsSigning(true);
    
    try {
      // Create a copy of the PDF
      const pdfBytes = await pdfDoc.save();
      const copiedPdfDoc = await PDFDocument.load(pdfBytes);
      
      // Embed signatures
      for (const field of signatureFields) {
        if (field.signatureData) {
          const page = copiedPdfDoc.getPages()[field.page];
          
          // Convert signature to image
          const signatureImage = await copiedPdfDoc.embedPng(
            field.signatureData.replace('data:image/png;base64,', '')
          );
          
          // Draw signature on page
          page.drawImage(signatureImage, {
            x: field.x,
            y: page.getHeight() - field.y - field.height, // PDF coordinates are bottom-up
            width: field.width,
            height: field.height,
          });
          
          // Add timestamp and signer info
          page.drawText(`Signed by: ${clientName}`, {
            x: field.x,
            y: page.getHeight() - field.y - field.height - 15,
            size: 8,
            color: rgb(0.5, 0.5, 0.5)
          });
          
          page.drawText(`Date: ${new Date().toLocaleDateString()}`, {
            x: field.x,
            y: page.getHeight() - field.y - field.height - 25,
            size: 8,
            color: rgb(0.5, 0.5, 0.5)
          });
        }
      }
      
      // Save the signed PDF
      const signedPdfBytes = await copiedPdfDoc.save();
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
        signatures: signatureFields.map(f => ({
          page: f.page,
          x: f.x,
          y: f.y,
          signedAt: new Date().toISOString()
        })),
        signedBy: clientName,
        signedAt: new Date().toISOString()
      };
      
      // Save to Firestore
      const clientRef = doc(db, 'clients', clientId);
      await updateDoc(clientRef, {
        documents: arrayUnion(signedDocData)
      });
      
      setSignedUrl(downloadURL);
      setViewMode('preview');
      toast.success('Document signed and saved successfully!');
      
      if (onSigned) {
        onSigned(signedDocData);
      }
    } catch (error) {
      console.error('Error signing document:', error);
      toast.error('Failed to sign document');
    } finally {
      setIsSigning(false);
    }
  };

  const generateSigningLink = () => {
    // Generate a unique signing session ID
    const signingSessionId = `${clientId}_${document.id}_${Date.now()}`;
    const signingLink = `${window.location.origin}/sign/${signingSessionId}`;
    
    // In production, you'd save this session to Firestore with expiration
    navigator.clipboard.writeText(signingLink);
    toast.success('Signing link copied to clipboard!');
    
    return signingLink;
  };

  return (
    <div className="document-signing-modal">
      <div className="signing-header">
        <h2>Sign Document: {document.name}</h2>
        <div className="header-actions">
          {viewMode === 'setup' && (
            <>
              <button 
                className="btn-primary"
                onClick={() => setViewMode('sign')}
                disabled={signatureFields.length === 0}
              >
                <PenTool size={18} />
                Start Signing
              </button>
              <button className="btn-secondary" onClick={generateSigningLink}>
                <Send size={18} />
                Send Link
              </button>
            </>
          )}
          {viewMode === 'sign' && (
            <button 
              className="btn-primary"
              onClick={embedSignaturesAndSave}
              disabled={isSigning || signatureFields.some(f => !f.signed)}
            >
              <Save size={18} />
              {isSigning ? 'Processing...' : 'Save Signed Document'}
            </button>
          )}
          {viewMode === 'preview' && signedUrl && (
            <a 
              href={signedUrl} 
              target="_blank" 
              rel="noopener noreferrer"
              className="btn-primary"
            >
              <Download size={18} />
              Download Signed
            </a>
          )}
          <button className="btn-text" onClick={onClose}>
            <X size={20} />
          </button>
        </div>
      </div>

      <div className="signing-content">
        <div className="pdf-viewer">
          <div className="pdf-controls">
            <button 
              disabled={currentPage === 0}
              onClick={() => setCurrentPage(currentPage - 1)}
            >
              Previous
            </button>
            <span>Page {currentPage + 1} of {pdfPages.length}</span>
            <button 
              disabled={currentPage === pdfPages.length - 1}
              onClick={() => setCurrentPage(currentPage + 1)}
            >
              Next
            </button>
          </div>

          <div className="pdf-canvas-container" ref={pdfCanvasRef}>
            {/* PDF Preview would go here - using iframe for simplicity */}
            <iframe 
              src={`${document.url}#page=${currentPage + 1}`}
              className="pdf-iframe"
              title="PDF Document"
            />
            
            {/* Signature Fields Overlay */}
            <div className="signature-fields-overlay">
              {signatureFields
                .filter(field => field.page === currentPage)
                .map(field => (
                  <div
                    key={field.id}
                    className={`signature-field ${field.signed ? 'signed' : ''} ${activeSignature === field.id ? 'active' : ''}`}
                    style={{
                      left: `${field.x}px`,
                      top: `${field.y}px`,
                      width: `${field.width}px`,
                      height: `${field.height}px`,
                    }}
                    onClick={() => viewMode === 'sign' && setActiveSignature(field.id)}
                  >
                    {field.signed ? (
                      <img src={field.signatureData} alt="Signature" />
                    ) : (
                      <div className="signature-placeholder">
                        {viewMode === 'setup' ? (
                          <>
                            <Move size={16} />
                            <span>Sign Here</span>
                            <button 
                              className="delete-field"
                              onClick={(e) => {
                                e.stopPropagation();
                                deleteSignatureField(field.id);
                              }}
                            >
                              <X size={14} />
                            </button>
                          </>
                        ) : (
                          <span>Click to Sign</span>
                        )}
                      </div>
                    )}
                  </div>
                ))}
            </div>
          </div>

          {viewMode === 'setup' && (
            <button 
              className="btn-secondary add-signature-btn"
              onClick={addSignatureField}
            >
              <PenTool size={18} />
              Add Signature Field
            </button>
          )}
        </div>

        {/* Signature Pad */}
        {viewMode === 'sign' && activeSignature && (
          <div className="signature-pad-container">
            <h3>Draw Your Signature</h3>
            <div className="signature-pad-wrapper">
              <SignatureCanvas
                ref={signaturePadRef}
                canvasProps={{
                  className: 'signature-canvas',
                  width: 500,
                  height: 200
                }}
                backgroundColor="white"
              />
            </div>
            <div className="signature-pad-actions">
              <button className="btn-secondary" onClick={clearSignature}>
                <RotateCcw size={18} />
                Clear
              </button>
              <button 
                className="btn-primary" 
                onClick={() => saveSignature(activeSignature)}
              >
                <Check size={18} />
                Apply Signature
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DocumentSigning;
