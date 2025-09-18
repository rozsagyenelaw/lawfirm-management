import React, { useState } from 'react';
import { Upload, FileText, Download, Trash2, Search, Filter, X, File, Image, FileSpreadsheet } from 'lucide-react';
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
    notes: ''
  });

  const filteredDocuments = documents.filter(doc => {
    const matchesSearch = doc.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesClient = filterClient === 'all' || doc.clientId === filterClient;
    return matchesSearch && matchesClient;
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    addDocument({
      ...formData,
      size: '0 KB',
      url: '#'
    });
    setShowUploadModal(false);
    setFormData({
      name: '',
      clientId: '',
      type: 'general',
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
    if (window.confirm('Are you sure you want to delete this document?')) {
      deleteDocument(id);
    }
  };

  const getDocumentIcon = (type) => {
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
          <p>Manage your legal documents and files</p>
        </div>
        <button className="btn-primary" onClick={() => setShowUploadModal(true)}>
          <Upload size={20} />
          Upload Document
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
                  {getDocumentIcon(doc.type)}
                </div>
                <div className="document-info">
                  <h3>{doc.name}</h3>
                  {client && <p className="client-name">{client.name}</p>}
                  <p className="document-meta">
                    {format(new Date(doc.uploadedAt), 'MMM dd, yyyy')}
                    {doc.size && ` • ${doc.size}`}
                  </p>
                  <span className={`document-type ${doc.type}`}>
                    {documentTypes.find(t => t.value === doc.type)?.label || doc.type}
                  </span>
                </div>
                <div className="document-actions">
                  <button className="btn-icon" title="Download">
                    <Download size={18} />
                  </button>
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
              Upload Your First Document
            </button>
          </div>
        )}
      </div>

      {showUploadModal && (
        <div className="modal-overlay" onClick={() => setShowUploadModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Upload Document</h2>
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
              <div className="upload-area">
                <Upload size={48} />
                <p>Click to upload or drag and drop</p>
                <p className="upload-hint">PDF, DOC, DOCX, JPG, PNG up to 10MB</p>
                <input type="file" style={{ display: 'none' }} />
              </div>
              <div className="modal-footer">
                <button type="button" className="btn-secondary" onClick={() => setShowUploadModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  Upload Document
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
