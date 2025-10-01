import React, { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../config/firebase';
import { Clock, CheckCircle, AlertCircle, Copy } from 'lucide-react';
import toast from 'react-hot-toast';

const PendingSignatures = () => {
  const [pendingSessions, setPendingSessions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Listen to all signing sessions in real-time
    const q = query(collection(db, 'signingSessions'));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const sessions = [];
      snapshot.forEach((doc) => {
        sessions.push({ id: doc.id, ...doc.data() });
      });
      
      // Sort by created date, newest first
      sessions.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      
      setPendingSessions(sessions);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const copyLink = (sessionId) => {
    const link = `${window.location.origin}/sign/${sessionId}`;
    navigator.clipboard.writeText(link);
    toast.success('Link copied to clipboard!');
  };

  if (loading) {
    return (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <p style={{ color: '#666' }}>Loading...</p>
      </div>
    );
  }

  const pending = pendingSessions.filter(s => s.status === 'pending');
  const completed = pendingSessions.filter(s => s.status === 'completed');

  return (
    <div style={{
      background: 'white',
      borderRadius: '8px',
      padding: '20px',
      boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
    }}>
      <h3 style={{ margin: '0 0 20px', fontSize: '20px' }}>
        Document Signatures
      </h3>

      {/* Pending */}
      <div style={{ marginBottom: '30px' }}>
        <h4 style={{
          margin: '0 0 15px',
          fontSize: '16px',
          color: '#FFC107',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <Clock size={20} />
          Pending Signatures ({pending.length})
        </h4>
        
        {pending.length === 0 ? (
          <p style={{ color: '#666', fontSize: '14px', margin: 0 }}>
            No pending signatures
          </p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {pending.map((session) => (
              <div
                key={session.id}
                style={{
                  padding: '15px',
                  background: '#fff3cd',
                  border: '1px solid #FFC107',
                  borderRadius: '6px'
                }}
              >
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'start',
                  marginBottom: '8px'
                }}>
                  <div>
                    <div style={{ fontWeight: '500', marginBottom: '4px' }}>
                      {session.documentName}
                    </div>
                    <div style={{ fontSize: '13px', color: '#666' }}>
                      Client: {session.clientName}
                    </div>
                    <div style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>
                      Sent: {new Date(session.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                  <button
                    onClick={() => copyLink(session.sessionId)}
                    style={{
                      padding: '6px 12px',
                      background: '#007bff',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: '12px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}
                  >
                    <Copy size={14} />
                    Copy Link
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Completed */}
      <div>
        <h4 style={{
          margin: '0 0 15px',
          fontSize: '16px',
          color: '#28a745',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <CheckCircle size={20} />
          Recently Signed ({completed.slice(0, 5).length})
        </h4>
        
        {completed.length === 0 ? (
          <p style={{ color: '#666', fontSize: '14px', margin: 0 }}>
            No signed documents yet
          </p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {completed.slice(0, 5).map((session) => (
              <div
                key={session.id}
                style={{
                  padding: '15px',
                  background: '#d4edda',
                  border: '1px solid #28a745',
                  borderRadius: '6px'
                }}
              >
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'start'
                }}>
                  <div>
                    <div style={{ fontWeight: '500', marginBottom: '4px' }}>
                      {session.documentName}
                    </div>
                    <div style={{ fontSize: '13px', color: '#155724' }}>
                      Signed by: {session.clientName}
                    </div>
                    <div style={{ fontSize: '12px', color: '#155724', marginTop: '4px' }}>
                      On: {new Date(session.signedAt).toLocaleDateString()}
                    </div>
                  </div>
                  {session.signedDocumentUrl && (
                    <button
                      onClick={() => window.open(session.signedDocumentUrl, '_blank')}
                      style={{
                        padding: '6px 12px',
                        background: '#28a745',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontSize: '12px'
                      }}
                    >
                      View
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default PendingSignatures;
