import React, { useState, useEffect } from 'react';
import { storage, db } from '../config/firebase';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { doc, updateDoc, arrayUnion, arrayRemove, getDoc } from 'firebase/firestore';
import { Upload, FileText, Download, Trash2, Eye } from 'lucide-react';
import toast from 'react-hot-toast';

const DocumentUpload = ({ clientId, clientName }) => {
  const [uploading, setUploading] = useState(false);
  const [documents, setDocuments] = useState([]);
  
  useEffect(() => {
    const loadDocuments = async () => {
      try {
        const clientRef = doc(db, 'clients', clientId);
        const clientDoc = await getDoc(clientRef);
        if (clientDoc.exists() && clientDoc.data().documents) {
          setDocuments(clientDoc.data().documents);
        }
      } catch (error) {
        console.error('Error loading documents:', error);
      }
    };
    loadDocuments();
  }, [clientId]);
  
  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    // Check if it's a PDF
    if (file.type !== 'application/pdf') {
      toast.error('Please upload only PDF files');
      return;
    }
    
    // Check file size (limit to 10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast.error('File size must be less than 10MB');
      return;
    }
    
    setUploading(true);
    
    try {
      // Create a unique filename
      const timestamp = Date.now();
      const fileName = `${clientId}/${timestamp}-${file.name}`;
      
      // Create storage reference
      const storageRef = ref(storage, `client-documents/${fileName}`);
      
      // Upload file
      const snapshot = await uploadBytes(storageRef, file);
      
      // Get download URL
      const downloadURL = await getDownloadURL(snapshot.ref);
      
      // Create document metadata
      const docData = {
        id: timestamp.toString(),
        name: file.name,
        url: downloadURL,
        path: fileName,
        size: file.size,
        uploadedAt: new Date().toISOString(),
        type: 'pdf',
        clientId: clientId,
        clientName: clientName
      };
      
      // Save metadata to Firestore
      const clientRef = doc(db, 'clients', clientId);
      await updateDoc(clientRef, {
        documents: arrayUnion(docData)
      });
      
      // Update local state
      setDocuments([...documents, docData]);
      
      toast.success('Document uploaded successfully');
    } catch (error) {
      console.error('Error uploading document:', error);
      toast.error('Failed to upload document');
    } finally {
      setUploading(false);
    }
  };
  
  const handleDelete = async (document) => {
    if (!window.confirm('Are you sure you want to delete this document?')) return;
    
    try {
      // Delete from Storage
      const storageRef = ref(storage, `client-documents/${document.path}`);
      await deleteObject(storageRef);
      
      // Remove from Firestore
      const clientRef = doc(db, 'clients', clientId);
      await updateDoc(clientRef, {
        documents: arrayRemove(document)
      });
      
      // Update local state
      setDocuments(documents.filter(d => d.id !== document.id));
      
      toast.success('Document deleted');
    } catch (error) {
      console.error('Error deleting document:', error);
      toast.error('Failed to delete document');
    }
  };
  
  const handleView = (document) => {
    window.open(document.url, '_blank');
  };
  
  const handleDownload = async (document) => {
    try {
      const response = await fetch(document.url);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = document.name;
      link.click();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading document:', error);
      toast.error('Failed to download document');
    }
  };
  
  return (
    <div className="document-upload">
      <div className="upload-section">
        <h3>Documents</h3>
        
        <div className="upload-area">
          <input
            type="file"
            accept="application/pdf"
            onChange={handleFileUpload}
            disabled={uploading}
            id="file-upload"
            style={{ display: 'none' }}
          />
          <label htmlFor="file-upload" className="upload-button">
            {uploading ? (
              <span>Uploading...</span>
            ) : (
              <>
                <Upload size={20} />
                <span>Upload PDF</span>
              </>
            )}
          </label>
        </div>
        
        <div className="documents-list">
          {documents.length === 0 ? (
            <p className="no-documents">No documents uploaded yet</p>
          ) : (
            documents.map(doc => (
              <div key={doc.id} className="document-item">
                <div className="document-info">
                  <FileText size={20} />
                  <div>
                    <p className="document-name">{doc.name}</p>
                    <span className="document-meta">
                      {(doc.size / 1024).toFixed(2)} KB • 
                      {new Date(doc.uploadedAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
                
                <div className="document-actions">
                  <button
                    onClick={() => handleView(doc)}
                    className="btn-icon"
                    title="View"
                  >
                    <Eye size={16} />
                  </button>
                  <button
                    onClick={() => handleDownload(doc)}
                    className="btn-icon"
                    title="Download"
                  >
                    <Download size={16} />
                  </button>
                  <button
                    onClick={() => handleDelete(doc)}
                    className="btn-icon danger"
                    title="Delete"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default DocumentUpload;
