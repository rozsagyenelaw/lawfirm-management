import React, { useState, useEffect } from 'react';
import { collection, query, where, orderBy, limit, getDocs } from 'firebase/firestore';
import { db } from '../config/firebase';
import { FileCheck, Download, Calendar } from 'lucide-react';
import toast from 'react-hot-toast';

const RecentSignedDocuments = () => {
  const [signedDocs, setSignedDocs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadRecentSignedDocs();
  }, []);

  const loadRecentSignedDocs = async () => {
    try {
      const q = query(
        collection(db, 'signingSessions'),
        where('status', '==', 'completed'),
        orderBy('signedAt', 'desc'),
        limit(10)
      );
      
      const snapshot = await getDocs(q);
      const docs = [];
      snapshot.forEach((doc) => {
        docs.push({ id: doc.id, ...doc.data() });
      });
      
      setSignedDocs(docs);
      setLoading(false);
    } catch (error) {
      console.error('Error loading signed documents:', error);
      toast.error('Failed to load signed documents');
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{ padding: '20px', textAlign: 'center', color: '#666' }}>
        Loading recent signed documents...
      </div>
    );
  }

  if (signedDocs.length === 0) {
    return (
      <div style={{
        padding: '30px',
        textAlign: 'center',
        background: '#f8f9fa',
        borderRadius: '8px',
        border: '2px dashed #dee2e6'
      }}>
        <FileCheck size={48} color="#6c757d" style={{ marginBottom: '15px' }} />
        <p style={{ margin: 0, color: '#6c757d' }}>
          No signed documents yet
        </p>
      </div>
    );
  }

  return (
    <div>
      <h3 style={{
        marginBottom: '20px',
        display: 'flex',
        alignItems: 'center',
        gap: '10px'
      }}>
        <FileCheck size={24} color="#28a745" />
        Recently Signed Documents
      </h3>
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
        {signedDocs.map((doc) => (
          <div
            key={doc.id}
            style={{
              padding: '20px',
              background: 'white',
              border: '2px solid #28a745',
              borderRadius: '8px',
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
            }}
          >
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'start'
            }}>
              <div style={{ flex: 1 }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  marginBottom: '10px'
                }}>
                  <FileCheck size={20} color="#28a745" />
                  <h4 style={{ margin: 0, fontSize: '16px' }}>{doc.documentName}</h4>
                  <span style={{
                    padding: '2px 8px',
                    background: '#d4edda',
                    color: '#155724',
                    borderRadius: '4px',
                    fontSize: '12px',
                    fontWeight: '500'
                  }}>
                    ✓ Signed
                  </span>
                </div>
                
                <div style={{
                  display: 'flex',
                  gap: '20px',
                  fontSize: '14px',
                  color: '#666'
                }}>
                  <div>
                    <strong>Client:</strong> {doc.clientName}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <Calendar size={14} />
                    <span>{new Date(doc.signedAt).toLocaleDateString()} at {new Date(doc.signedAt).toLocaleTimeString()}</span>
                  </div>
                </div>
              </div>
              
              {doc.signedDocumentUrl && (
                <button
                  onClick={() => {
                    window.open(doc.signedDocumentUrl, '_blank');
                    toast.success('Opening signed document...');
                  }}
                  style={{
                    padding: '10px 20px',
                    background: '#28a745',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    fontSize: '14px',
                    fontWeight: '500'
                  }}
                >
                  <Download size={16} />
                  Download
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
      
      <button
        onClick={loadRecentSignedDocs}
        style={{
          marginTop: '15px',
          padding: '8px 16px',
          background: '#007bff',
          color: 'white',
          border: 'none',
          borderRadius: '6px',
          cursor: 'pointer',
          fontSize: '14px'
        }}
      >
        Refresh
      </button>
    </div>
  );
};

export default RecentSignedDocuments;
