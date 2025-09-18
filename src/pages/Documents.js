import React, { useState } from 'react';
import { Upload, FileText, Download, Trash2, Search, Filter, X, File, Image, FileSpreadsheet, Link, ExternalLink } from 'lucide-react';
import { useData } from '../context/DataContext';
import { format } from 'date-fns';

const Documents = () => {
  const { documents, clients, addDocument, deleteDocument } = useData();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterClient, setFilterClient] = useState('all');
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    clientId: '',
    type: 'general',
    driveLink: '',
    notes: ''
  });

  const filteredDocuments = documents.filter(doc => {
    const matchesSearch = doc.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesClient = filterClient === 'all' || doc.clientId === filterClient;
    return matchesSearch && matchesClient;
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Validate Google Drive link
    let finalLink = formData.driveLink;
    if (finalLink && !finalLink.startsWith('http')) {
      finalLink = 'https://' + finalLink;
    }
    
    addDocument({
      ...formData,
      driveLink: finalLink,
      url: finalLink || '#'
    });
    
    setShowUploadModal(false);
    setFormData({
      name: '',
      clientId: '',
      type: 'general',
      driveLink: '',
      notes: ''
    });
  };

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleDelete = (id) => {
    if (window.confirm('Are you sure you want to delete this document record?')) {
      deleteDocument(id);
    }
  };

  const openDriveLink = (url) => {
    if (url && url !== '#') {
      window.open(url, '_blank');
    }
  };

  const getDocumentIcon = (type, driveLink) => {
    if (driveLink && driveLink.includes('drive.google.com')) {
      return <img src="https://ssl.gstatic.com/images/branding/product/2x/drive_48dp.png" alt="Google Drive" style={{width: '40px', height: '40px'}} />;
    }
    
    switch(type) {
      case 'pdf':
        return <FileText size={40} className="text-red" />;
      case 'image':
        return <Image size={40} className="text-green" />;
      case 'spreadsheet':
        return <FileSpreadsheet size={40} className="text-blue" />;
      default:
        return <File size={40} className="text-gray" />;
    }
  };

  const documentTypes = [
    { value: 'general', label: 'General' },
    { value: 'contract', label: 'Contract' },
    { value: 'will', label: 'Will' },
    { value: 'trust', label: 'Trust' },
    { value: 'court', label: 'Court Filing' },
    { value: 'correspondence', label: 'Correspondence' },
    { value: 'financial', label: 'Financial' },
    { value: 'other', label: 'Other' }
  ];

  return (
    <div className="documents-page">
      <div className="page-header">
        <div>
          <h1>Documents</h1>
          <p>Manage your legal documents with Google Drive</p>
        </div>
        <button className="btn-primary" onClick={() => setShowUploadModal(true)}>
          <Link size={20} />
          Add Document Link
        </button>
      </div>

      <div className="controls-bar">
        <div className="search-box">
          <Search size={20} />
          <input
            type="text"
            placeholder="Search documents..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="filter-group">
          <Filter size={20} />
          <select 
            value={filterClient} 
            onChange={(e) => setFilterClient(e.target.value)}
          >
            <option value="all">All Clients</option>
            {clients.map(client => (
              <option key={client.id} value={client.id}>
                {client.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="documents-grid">
        {filteredDocuments.length > 0 ? (
          filteredDocuments.map(doc => {
            const client = clients.find(c => c.id === doc.clientId);
            return (
              <div key={doc.id} className="document-card">
                <div className="document-icon">
                  {getDocumentIcon(doc.type, doc.driveLink)}
                </div>
                <div className="document-info">
                  <h3>{doc.name}</h3>
                  {client && <p className="client-name">{client.name}</p>}
                  <p className="document-meta">
                    {format(new Date(doc.uploadedAt), 'MMM dd, yyyy')}
                  </p>
                  <span className={`document-type ${doc.type}`}>
                    {documentTypes.find(t => t.value === doc.type)?.label || doc.type}
                  </span>
                  {doc.notes && <p className="document-notes">{doc.notes}</p>}
                </div>
                <div className="document-actions">
                  {doc.driveLink && doc.driveLink !== '#' && (
                    <button 
                      className="btn-icon" 
                      title="Open in Google Drive"
                      onClick={() => openDriveLink(doc.driveLink)}
                    >
                      <ExternalLink size={18} />
                    </button>
                  )}
                  <button 
                    className="btn-icon text-red" 
                    title="Delete"
                    onClick={() => handleDelete(doc.id)}
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            );
          })
        ) : (
          <div className="empty-state">
            <FileText size={48} />
            <p>No documents found</p>
            <button className="btn-primary" onClick={() => setShowUploadModal(true)}>
              Add Your First Document Link
            </button>
          </div>
        )}
      </div>

      {showUploadModal && (
        <div className="modal-overlay" onClick={() => setShowUploadModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Add Document from Google Drive</h2>
              <button className="btn-icon" onClick={() => setShowUploadModal(false)}>
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Document Name *</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="e.g., Smith Family Trust Document"
                  required
                />
              </div>
              
              <div className="form-group">
                <label>Google Drive Link</label>
                <input
                  type="text"
                  name="driveLink"
                  value={formData.driveLink}
                  onChange={handleInputChange}
                  placeholder="https://drive.google.com/file/d/..."
                />
                <small style={{color: '#666', fontSize: '12px'}}>
                  How to get link: Open document in Google Drive → Click "Share" → Copy link
                </small>
              </div>

              <div className="form-group">
                <label>Client</label>
                <select
                  name="clientId"
                  value={formData.clientId}
                  onChange={handleInputChange}
                >
                  <option value="">No specific client</option>
                  {clients.map(client => (
                    <option key={client.id} value={client.id}>
                      {client.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Document Type</label>
                <select
                  name="type"
                  value={formData.type}
                  onChange={handleInputChange}
                >
                  {documentTypes.map(type => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Notes</label>
                <textarea
                  name="notes"
                  value={formData.notes}
                  onChange={handleInputChange}
                  rows="3"
                  placeholder="Any additional notes about this document"
                />
              </div>

              <div style={{
                padding: '15px',
                background: '#E3F2FD',
                borderRadius: '8px',
                marginBottom: '20px'
              }}>
                <h4 style={{margin: '0 0 10px 0', color: '#1976D2'}}>
                  📁 How to organize in Google Drive:
                </h4>
                <ol style={{margin: '0', paddingLeft: '20px', fontSize: '14px'}}>
                  <li>Create a folder for each client in Drive</li>
                  <li>Upload or create documents in client folders</li>
                  <li>Share folders with clients as needed</li>
                  <li>Copy the sharing link to add here</li>
                </ol>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn-secondary" onClick={() => setShowUploadModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  Add Document Link
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Documents;
