import React, { useState, useEffect } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../config/firebase';
import { FileText, Search, Download, Eye, User } from 'lucide-react';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

const AllDocuments = () => {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedClient, setSelectedClient] = useState('');
  const [clients, setClients] = useState([]);

  useEffect(() => {
    loadAllDocuments();
  }, []);

  const loadAllDocuments = async () => {
    try {
      const clientsSnapshot = await getDocs(collection(db, 'clients'));
      const allDocs = [];
      const clientList = [];

      clientsSnapshot.forEach(doc => {
        const clientData = { id: doc.id, ...doc.data() };
        clientList.push({ id: doc.id, name: clientData.name });
        
        if (clientData.documents && Array.isArray(clientData.documents)) {
          clientData.documents.forEach(document => {
            allDocs.push({
              ...document,
              clientId: doc.id,
              clientName: clientData.name
            });
          });
        }
      });

      setDocuments(allDocs);
      setClients(clientList);
      setLoading(false);
    } catch (error) {
      console.error('Error loading documents:', error);
      toast.error('Failed to load documents');
      setLoading(false);
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
      toast.success('Download started');
    } catch (error) {
      console.error('Error downloading document:', error);
      toast.error('Failed to download document');
    }
  };

  const filteredDocuments = documents.filter(doc => {
    const matchesSearch = doc.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          doc.clientName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesClient = selectedClient === '' || doc.clientId === selectedClient;
    return matchesSearch && matchesClient;
  });

  if (loading) {
    return (
      <div className="all-documents-page">
        <div className="page-header">
          <h1>All Documents</h1>
          <p>Loading documents...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="all-documents-page">
      <div className="page-header">
        <h1>All Documents</h1>
        <p>View all client documents in one place</p>
      </div>

      <div className="documents-container">
        <div className="documents-filters">
          <div className="search-box">
            <Search size={20} />
            <input
              type="text"
              placeholder="Search documents..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <select
            value={selectedClient}
            onChange={(e) => setSelectedClient(e.target.value)}
            className="client-filter"
          >
            <option value="">All Clients</option>
            {clients.map(client => (
              <option key={client.id} value={client.id}>{client.name}</option>
            ))}
          </select>

          <div className="documents-stats">
            <span>{filteredDocuments.length} documents</span>
          </div>
        </div>

        {filteredDocuments.length === 0 ? (
          <div className="no-documents">
            <FileText size={48} />
            <p>No documents found</p>
          </div>
        ) : (
          <div className="all-documents-list">
            {filteredDocuments.map((doc, index) => (
              <div key={`${doc.clientId}-${doc.id}-${index}`} className="document-row">
                <div className="document-icon">
                  <FileText size={24} />
                </div>
                
                <div className="document-details">
                  <h4>{doc.name}</h4>
                  <div className="document-meta-info">
                    <span>
                      <User size={14} />
                      {doc.clientName}
                    </span>
                    <span>•</span>
                    <span>{(doc.size / 1024).toFixed(2)} KB</span>
                    <span>•</span>
                    <span>{format(new Date(doc.uploadedAt), 'MMM d, yyyy')}</span>
                  </div>
                </div>

                <div className="document-actions">
                  <button
                    onClick={() => handleView(doc)}
                    className="btn-icon"
                    title="View PDF"
                  >
                    <Eye size={16} />
                  </button>
                  <button
                    onClick={() => handleDownload(doc)}
                    className="btn-icon"
                    title="Download PDF"
                  >
                    <Download size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AllDocuments;
