import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { db, storage } from '../config/firebase';
import { doc, getDoc, updateDoc, arrayUnion } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, getBlob } from 'firebase/storage';
import SignatureCanvas from 'react-signature-canvas';
import { PDFDocument, rgb } from 'pdf-lib';
import { Save, RotateCcw, CheckCircle, AlertCircle, FileText } from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';

const ClientSigningPage = () => {
  const { sessionId } = useParams();
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [signatureData, setSignatureData] = useState(null);
  const [isSigning, setIsSigning] = useState(false);
  const [signed, setSigned] = useState(false);
  const [signedDocUrl, setSignedDocUrl] = useState(null);
  
  const signaturePadRef = useRef(null);

  useEffect(() => {
    loadSigningSession();
  }, [sessionId]);

  const loadSigningSession = async () => {
    try {
      setLoading(true);
      const sessionDoc = await getDoc(doc(db, 'signingSessions', sessionId));
      
      if (!sessionDoc.exists()) {
        setError('This signing link is invalid or has expired.');
        setLoading(false);
        return;
      }
      
      const sessionData = sessionDoc.data();
      
      // Check if expired
      const expiresAt = new Date(sessionData.expiresAt);
      if (expiresAt < new Date()) {
        setError('This signing link has expired.');
        setLoading(false);
        return;
      }
      
      // Check if already signed
      if (sessionData.status === 'completed') {
        setError('This document has already been signed.');
        setLoading(false);
        return;
      }
      
      setSession(sessionData);
      setLoading(false);
    } catch (err) {
      console.error('Error loading session:', err);
      setError('Failed to load signing session.');
      setLoading(false);
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
    }
  };

  const signDocument = async () => {
    if (!signatureData) {
      toast.error('Please provide your signature first');
      return;
    }

    setIsSigning(true);

    try {
      // IMPORTANT: Use the ORIGINAL document URL, not the marked one
      // The marked document has yellow boxes, we want to sign the original
      const pdfUrl = session.originalUrl || session.documentUrl;
      const response = await fetch(pdfUrl);
      const pdfBlob = await response.blob();
      const pdfBytes = await pdfBlob.arrayBuffer();
      
      const pdfDoc = await PDFDocument.load(pdfBytes);
      const pages = pdfDoc.getPages();
      
      const signatureImageBytes = signatureData.split(',')[1];
      const signatureImageBuffer = Uint8Array.from(atob(signatureImageBytes), c => c.charCodeAt(0));
      const signatureImage = await pdfDoc.embedPng(signatureImageBuffer);
      
      // If there are markers (yellow boxes), use their positions
      if (session.markers && session.markers.length > 0) {
        // Add signature to each marker position
        session.markers.forEach(marker => {
          const page = pages[marker.page - 1];
          const { width: pdfWidth, height: pdfHeight } = page.getSize();
          
          const x = marker.x;
          const y = marker.y;
          const markerWidth = marker.width;
          const markerHeight = marker.height;
          
          console.log('===== CLIENT SIGNING DEBUG =====');
          console.log('PDF Page Size:', pdfWidth, 'x', pdfHeight);
          console.log('Marker from database:', marker);
          console.log('Placing signature at:', { x, y, width: markerWidth, height: markerHeight });
          console.log('================================');
          
          // Place signature exactly where the yellow box was
          page.drawImage(signatureImage, {
            x: x,
            y: y,
            width: markerWidth,
            height: markerHeight,
          });
          
          // Add client name below signature
          page.drawText(session.clientName, {
            x: x,
            y: y - 15,
            size: 10,
            color: rgb(0, 0, 0),
          });
          
          // Add date stamp
          page.drawText(`Signed: ${new Date().toLocaleDateString()}`, {
            x: x,
            y: y - 30,
            size: 8,
            color: rgb(0.3, 0.3, 0.3),
          });
        });
      } else {
        // No markers - place signature at default location (bottom of first page)
        const firstPage = pages[0];
        const { width, height } = firstPage.getSize();
        
        firstPage.drawImage(signatureImage, {
          x: 50,
          y: 100,
          width: 150,
          height: 50,
        });
        
        firstPage.drawText(session.clientName, {
          x: 50,
          y: 85,
          size: 10,
          color: rgb(0, 0, 0),
        });
        
        firstPage.drawText(`Signed: ${new Date().toLocaleDateString()}`, {
          x: 50,
          y: 70,
          size: 8,
          color: rgb(0.3, 0.3, 0.3),
        });
      }
      
      // Save the signed PDF
      const signedPdfBytes = await pdfDoc.save();
      const signedBlob = new Blob([signedPdfBytes], { type: 'application/pdf' });
      
      // Upload to Firebase Storage
      const timestamp = Date.now();
      const signedFileName = `${session.clientId}/client-signed/${timestamp}-${session.documentName}`;
      const storageRef = ref(storage, `client-documents/${signedFileName}`);
      
      await uploadBytes(storageRef, signedBlob);
      const downloadURL = await getDownloadURL(storageRef);
      
      // Update the signing session
      await updateDoc(doc(db, 'signingSessions', sessionId), {
        status: 'completed',
        signedAt: new Date().toISOString(),
        signedDocumentUrl: downloadURL
      });
      
      // Add signed document to client's documents array
      const signedDocData = {
        id: timestamp.toString(),
        name: `CLIENT-SIGNED-${session.documentName}`,
        url: downloadURL,
        path: signedFileName,
        size: signedBlob.size,
        uploadedAt: new Date().toISOString(),
        type: 'pdf',
        clientId: session.clientId,
        clientName: session.clientName,
        signedBy: session.clientName,
        signedAt: new Date().toISOString(),
        signedViaSession: sessionId
      };
      
      // Update client's documents in Firestore
      const clientRef = doc(db, 'clients', session.clientId);
      await updateDoc(clientRef, {
        documents: arrayUnion(signedDocData)
      });
      
      setSignedDocUrl(downloadURL);
      setSigned(true);
      toast.success('Document signed successfully!');
      
    } catch (err) {
      console.error('Error signing document:', err);
      toast.error('Failed to sign document. Please try again.');
    } finally {
      setIsSigning(false);
    }
  };

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        fontFamily: 'system-ui, -apple-system, sans-serif'
      }}>
        <div style={{
          background: 'white',
          padding: '40px',
          borderRadius: '12px',
          boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
          textAlign: 'center'
        }}>
          <div style={{
            width: '50px',
            height: '50px',
            border: '4px solid #667eea',
            borderTopColor: 'transparent',
            borderRadius: '50%',
            margin: '0 auto 20px',
            animation: 'spin 1s linear infinite'
          }} />
          <p style={{ margin: 0, color: '#666' }}>Loading document...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        fontFamily: 'system-ui, -apple-system, sans-serif',
        padding: '20px'
      }}>
        <Toaster position="top-center" />
        <div style={{
          background: 'white',
          padding: '40px',
          borderRadius: '12px',
          boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
          textAlign: 'center',
          maxWidth: '500px'
        }}>
          <AlertCircle size={60} color="#dc3545" style={{ marginBottom: '20px' }} />
          <h2 style={{ margin: '0 0 15px', color: '#333' }}>Unable to Load Document</h2>
          <p style={{ margin: 0, color: '#666', lineHeight: 1.6 }}>{error}</p>
        </div>
      </div>
    );
  }

  if (signed) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        fontFamily: 'system-ui, -apple-system, sans-serif',
        padding: '20px'
      }}>
        <Toaster position="top-center" />
        <div style={{
          background: 'white',
          padding: '40px',
          borderRadius: '12px',
          boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
          textAlign: 'center',
          maxWidth: '500px'
        }}>
          <CheckCircle size={60} color="#28a745" style={{ marginBottom: '20px' }} />
          <h2 style={{ margin: '0 0 15px', color: '#333' }}>Document Signed Successfully!</h2>
          <p style={{ margin: '0 0 25px', color: '#666', lineHeight: 1.6 }}>
            Your signature has been added to the document. You can download a copy below.
          </p>
          <button
            onClick={() => window.open(signedDocUrl, '_blank')}
            style={{
              padding: '12px 30px',
              background: '#28a745',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              fontSize: '16px',
              fontWeight: '500',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            <FileText size={20} />
            Download Signed Document
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      fontFamily: 'system-ui, -apple-system, sans-serif',
      padding: '20px'
    }}>
      <Toaster position="top-center" />
      
      <div style={{
        maxWidth: '900px',
        margin: '0 auto',
        background: 'white',
        borderRadius: '12px',
        boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
        overflow: 'hidden'
      }}>
        {/* Header */}
        <div style={{
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          padding: '30px',
          color: 'white'
        }}>
          <h1 style={{ margin: '0 0 10px', fontSize: '28px' }}>Document Signing</h1>
          <p style={{ margin: 0, opacity: 0.9 }}>
            Please review and sign the document: <strong>{session.documentName}</strong>
          </p>
        </div>

        <div style={{ padding: '30px' }}>
          {/* Document Preview */}
          <div style={{ marginBottom: '30px' }}>
            <h3 style={{ margin: '0 0 15px', color: '#333' }}>Document Preview</h3>
            <div style={{
              border: '2px solid #ddd',
              borderRadius: '8px',
              overflow: 'hidden',
              background: '#f8f9fa'
            }}>
              <iframe
                src={session.documentUrl}
                style={{
                  width: '100%',
                  height: '500px',
                  border: 'none'
                }}
                title="Document Preview"
              />
            </div>
            <button
              onClick={() => window.open(session.documentUrl, '_blank')}
              style={{
                marginTop: '10px',
                padding: '8px 15px',
                background: '#6c757d',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '14px'
              }}
            >
              Open Full Document in New Tab
            </button>
            
            {/* Scroll indicator */}
            <div style={{
              marginTop: '20px',
              padding: '15px',
              background: '#fff3cd',
              border: '2px solid #ffc107',
              borderRadius: '8px',
              textAlign: 'center',
              fontSize: '16px',
              fontWeight: '500',
              color: '#856404'
            }}>
              👇 Scroll down to sign the document 👇
            </div>
          </div>

          {/* Signature Section */}
          <div style={{ marginBottom: '30px', scrollMarginTop: '20px' }} id="signature-section">
            <div style={{
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              padding: '20px',
              borderRadius: '8px 8px 0 0',
              marginBottom: 0
            }}>
              <h3 style={{ margin: 0, color: 'white', fontSize: '24px' }}>✍️ Sign Here</h3>
            </div>
            <div style={{
              border: '3px solid #667eea',
              borderTop: 'none',
              borderRadius: '0 0 8px 8px',
              padding: '20px',
              background: 'white'
            }}>
              <p style={{ margin: '0 0 15px', color: '#666', fontSize: '14px' }}>
                Please draw your signature in the box below:
              </p>
            
            <div style={{
              border: '2px solid #667eea',
              borderRadius: '8px',
              overflow: 'hidden',
              marginBottom: '15px'
            }}>
              <SignatureCanvas
                ref={signaturePadRef}
                canvasProps={{
                  width: 800,
                  height: 200,
                  style: { width: '100%', height: '200px', background: 'white' }
                }}
                backgroundColor="white"
                onEnd={saveSignature}
              />
            </div>

            <button
              onClick={clearSignature}
              style={{
                padding: '8px 20px',
                background: '#6c757d',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '14px',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              <RotateCcw size={16} />
              Clear Signature
            </button>

            {signatureData && (
              <div style={{ marginTop: '20px' }}>
                <p style={{ margin: '0 0 10px', color: '#333', fontWeight: '500' }}>
                  Signature Preview:
                </p>
                <img
                  src={signatureData}
                  alt="Signature preview"
                  style={{
                    border: '1px solid #ddd',
                    borderRadius: '6px',
                    padding: '15px',
                    background: 'white',
                    maxWidth: '100%'
                  }}
                />
              </div>
            )}
            </div>
          </div>

          {/* Sign Button */}
          <button
            onClick={signDocument}
            disabled={!signatureData || isSigning}
            style={{
              width: '100%',
              padding: '15px',
              background: (!signatureData || isSigning) ? '#ccc' : '#28a745',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: '18px',
              fontWeight: '600',
              cursor: (!signatureData || isSigning) ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '10px'
            }}
          >
            <Save size={24} />
            {isSigning ? 'Signing Document...' : 'Sign & Submit Document'}
          </button>

          {/* Footer Info */}
          <div style={{
            marginTop: '30px',
            padding: '20px',
            background: '#f8f9fa',
            borderRadius: '8px',
            fontSize: '13px',
            color: '#666'
          }}>
            <p style={{ margin: '0 0 5px' }}>
              <strong>Client:</strong> {session.clientName}
            </p>
            <p style={{ margin: 0 }}>
              <strong>Link expires:</strong> {new Date(session.expiresAt).toLocaleDateString()}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ClientSigningPage;
