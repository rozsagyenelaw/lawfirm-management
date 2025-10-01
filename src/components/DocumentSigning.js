import React, { useState, useRef, useEffect } from 'react';
import { storage, db } from '../config/firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { doc, updateDoc, arrayUnion, getDoc } from 'firebase/firestore';
import SignatureCanvas from 'react-signature-canvas';
import { PDFDocument, rgb } from 'pdf-lib';
import { PenTool, Save, RotateCcw, Check, X, Move, Download, Send, Eye } from 'lucide-react';
import toast from 'react-hot-toast';

const DocumentSigning = ({ document, clientId, clientName, onClose, onSigned }) => {
  const [pdfDoc, setPdfDoc] = useState(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [signatureFields, setSignatureFields] = useState([]);
  const [activeSignature, setActiveSignature] = useState(null);
  const [isSigning, setIsSigning] = useState(false);
  const [signedUrl, setSignedUrl] = useState(null);
  const [viewMode, setViewMode] = useState('setup'); // 'setup', 'sign', 'preview'
  const [isLoading, setIsLoading] = useState(true);
  
  const signaturePadRef = useRef(null);

  useEffect(() => {
    loadPdfDocument();
  }, [document]);

  const loadPdfDocument = async () => {
    setIsLoading(true);
    try {
      // Fetch the PDF
      const response = await fetch(document.url);
      if (!response.ok) {
        throw new Error('Failed to fetch PDF');
      }
      
      const arrayBuffer = await response.arrayBuffer();
      
      // Load PDF for manipulation
      const pdfDoc = await PDFDocument.load(arrayBuffer);
      setPdfDoc(pdfDoc);
      
      // Get page count for navigation
      const pageCount = pdfDoc.getPageCount();
      setTotalPages(pageCount);
      
      setIsLoading(false);
      toast.success('Document loaded successfully');
    } catch (error) {
      console.error('Error loading PDF:', error);
      toast.error('Failed to load document. Please try again.');
      setIsLoading(false);
    }
  };

  const addSignatureField = () => {
    const newField = {
      id: Date.now().toString(),
      page: currentPage,
      signed: false,
      signatureData: null
    };
    setSignatureFields([...signatureFields, newField]);
    toast.success(`Signature field added to page ${currentPage + 1}`);
  };

  const deleteSignatureField = (fieldId) => {
    setSignatureFields(fields => fields.filter(f => f.id !== fieldId));
    setActiveSignature(null);
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
    if (!pdfDoc || signatureFields.length === 0) {
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
      // Create a copy of the PDF
      const pdfBytes = await pdfDoc.save();
      const copiedPdfDoc = await PDFDocument.load(pdfBytes);
      
      // Embed signatures
      for (const field of signatureFields) {
        if (field.signatureData) {
          const page = copiedPdfDoc.getPages()[field.page];
          const { width, height } = page.getSize();
          
          // Convert base64 to bytes
          const signatureImageBytes = field.signatureData.split(',')[1];
          const signatureImageBuffer = Uint8Array.from(atob(signatureImageBytes), c => c.charCodeAt(0));
          
          // Embed the image
          const signatureImage = await copiedPdfDoc.embedPng(signatureImageBuffer);
          
          // Calculate position (centered on page with some margin)
          const sigWidth = 200;
          const sigHeight = 80;
          const sigX = (width - sigWidth) / 2;
          const sigY = height - 200 - (field.page * 100); // Adjust position based on page
          
          // Draw signature on page
          page.drawImage(signatureImage, {
            x: sigX,
            y: sigY,
            width: sigWidth,
            height: sigHeight,
          });
          
          // Add timestamp and signer info
          page.drawText(`Signed by: ${clientName}`, {
            x: sigX,
            y: sigY - 15,
            size: 8,
            color: rgb(0.5, 0.5, 0.5)
          });
          
          page.drawText(`Date: ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}`, {
            x: sigX,
            y: sigY - 25,
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
      toast.error('Failed to sign document: ' + error.message);
    } finally {
      setIsSigning(false);
    }
  };

  if (isLoading) {
    return (
      <div className="document-signing-modal">
        <div className="signing-header">
          <h2>Loading Document...</h2>
          <button className="btn-text" onClick={onClose}>
            <X size={20} />
          </button>
        </div>
        <div className="signing-content">
          <div className="loading-spinner">Loading PDF...</div>
        </div>
      </div>
    );
  }

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
                Start Signing ({signatureFields.length} field{signatureFields.length !== 1 ? 's' : ''})
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
          {viewMode !== 'preview' && (
            <>
              <div className="pdf-controls">
                <button 
                  disabled={currentPage === 0}
                  onClick={() => setCurrentPage(currentPage - 1)}
                  className="btn-secondary"
                >
                  Previous
                </button>
                <span className="page-indicator">Page {currentPage + 1} of {totalPages}</span>
                <button 
                  disabled={currentPage === totalPages - 1}
                  onClick={() => setCurrentPage(currentPage + 1)}
                  className="btn-secondary"
                >
                  Next
                </button>
              </div>

              <div className="pdf-preview-area">
                <div className="pdf-page-display">
                  <h3>PDF Page {currentPage + 1}</h3>
                  <p className="pdf-info">Document: {document.name}</p>
                  
                  <button 
                    onClick={() => window.open(document.url, '_blank')} 
                    className="btn-secondary view-pdf-btn"
                  >
                    <Eye size={18} />
                    View Full PDF in New Tab
                  </button>

                  {viewMode === 'setup' && (
                    <div className="signature-setup-info">
                      <p>Click below to add signature fields to this page</p>
                      <button 
                        className="btn-primary add-signature-btn"
                        onClick={addSignatureField}
                      >
                        <PenTool size={18} />
                        Add Signature Field to Page {currentPage + 1}
                      </button>
                    </div>
                  )}

                  {/* Show signature fields for current page */}
                  <div className="signature-fields-list">
                    {signatureFields
                      .filter(field => field.page === currentPage)
                      .map(field => (
                        <div key={field.id} className="signature-field-item">
                          <span>
                            Signature Field on Page {field.page + 1}
                            {field.signed && ' ✓ Signed'}
                          </span>
                          {viewMode === 'setup' && (
                            <button 
                              onClick={() => deleteSignatureField(field.id)}
                              className="btn-text"
                            >
                              <X size={16} />
                            </button>
                          )}
                          {viewMode === 'sign' && !field.signed && (
                            <button 
                              onClick={() => setActiveSignature(field.id)}
                              className="btn-primary"
                            >
                              Sign This Field
                            </button>
                          )}
                        </div>
                      ))}
                  </div>

                  {/* Summary of all signature fields */}
                  {signatureFields.length > 0 && (
                    <div className="signature-summary">
                      <h4>Signature Fields Summary:</h4>
                      <ul>
                        {[...new Set(signatureFields.map(f => f.page))].sort().map(pageNum => {
                          const pageFields = signatureFields.filter(f => f.page === pageNum);
                          const signedCount = pageFields.filter(f => f.signed).length;
                          return (
                            <li key={pageNum}>
                              Page {pageNum + 1}: {signedCount}/{pageFields.length} signed
                            </li>
                          );
                        })}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}

          {viewMode === 'preview' && signedUrl && (
            <div className="preview-success">
              <Check size={48} color="#10b981" />
              <h3>Document Signed Successfully!</h3>
              <p>The signed document has been saved.</p>
              <div className="preview-actions">
                <a 
                  href={signedUrl} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="btn-primary"
                >
                  <Eye size={18} />
                  View Signed Document
                </a>
                <button onClick={onClose} className="btn-secondary">
                  Close
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Signature Pad */}
        {viewMode === 'sign' && activeSignature && (
          <div className="signature-pad-container">
            <h3>Draw Your Signature</h3>
            <p>Sign for field on page {signatureFields.find(f => f.id === activeSignature)?.page + 1}</p>
            <div className="signature-pad-wrapper">
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
