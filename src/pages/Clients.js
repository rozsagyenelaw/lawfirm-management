import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, Filter, Mail, Phone, MapPin, Calendar, FolderOpen, X, CheckSquare, Trash2, Edit } from 'lucide-react';
import { useData } from '../context/DataContext';
import { format } from 'date-fns';

const Clients = () => {
  const navigate = useNavigate();
  const { clients, addClient, deleteClient, updateClient } = useData();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectMode, setSelectMode] = useState(false);
  const [selectedClients, setSelectedClients] = useState([]);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    category: 'estate-planning',
    notes: ''
  });

  const categories = [
    { value: 'estate-planning', label: 'Estate Planning' },
    { value: 'probate', label: 'Probate' },
    { value: 'trust-litigation', label: 'Trust Litigation' },
    { value: 'conservatorship', label: 'Conservatorship' },
    { value: 'guardianship', label: 'Guardianship' },
    { value: 'fire-victim', label: 'Fire Victim' }
  ];

  const filteredClients = clients.filter(client => {
    const matchesSearch = client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         client.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterCategory === 'all' || client.category === filterCategory;
    return matchesSearch && matchesFilter;
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    addClient(formData);
    setShowAddModal(false);
    setFormData({
      name: '',
      email: '',
      phone: '',
      address: '',
      category: 'estate-planning',
      notes: ''
    });
  };

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSelectClient = (clientId) => {
    if (selectedClients.includes(clientId)) {
      setSelectedClients(selectedClients.filter(id => id !== clientId));
    } else {
      setSelectedClients([...selectedClients, clientId]);
    }
  };

  const handleSelectAll = () => {
    if (selectedClients.length === filteredClients.length) {
      setSelectedClients([]);
    } else {
      setSelectedClients(filteredClients.map(c => c.id));
    }
  };

  const handleBatchDelete = () => {
    if (selectedClients.length === 0) return;
    if (window.confirm(`Delete ${selectedClients.length} clients? This will also delete all associated tasks, documents, and events. This cannot be undone.`)) {
      selectedClients.forEach(clientId => {
        deleteClient(clientId);
      });
      setSelectedClients([]);
      setSelectMode(false);
    }
  };

  const handleBatchCategoryUpdate = () => {
    if (selectedClients.length === 0) return;
    const newCategory = prompt('Select new category:\n1. estate-planning\n2. probate\n3. trust-litigation\n4. conservatorship\n5. guardianship\n6. fire-victim\n\nEnter the category name:');
    if (newCategory && categories.find(c => c.value === newCategory)) {
      selectedClients.forEach(clientId => {
        updateClient(clientId, { category: newCategory });
      });
      setSelectedClients([]);
      setSelectMode(false);
    }
  };

  const handleBatchExport = () => {
    if (selectedClients.length === 0) return;
    const selectedData = clients.filter(c => selectedClients.includes(c.id));
    const csv = [
      ['Name', 'Email', 'Phone', 'Address', 'Category', 'Notes'],
      ...selectedData.map(c => [c.name, c.email, c.phone, c.address, c.category, c.notes])
    ].map(row => row.join(',')).join('\n');
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `clients_export_${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
    
    setSelectedClients([]);
    setSelectMode(false);
  };

  return (
    <div className="clients-page">
      <div className="page-header">
        <div>
          <h1>Clients</h1>
          <p>Manage your client database</p>
        </div>
        <div className="header-actions">
          {!selectMode ? (
            <>
              <button className="btn-secondary" onClick={() => {
                setSelectMode(true);
                setSelectedClients([]);
              }}>
                <CheckSquare size={20} />
                Select
              </button>
              <button className="btn-primary" onClick={() => setShowAddModal(true)}>
                <Plus size={20} />
                Add Client
              </button>
            </>
          ) : (
            <>
              <button className="btn-text" onClick={() => {
                setSelectMode(false);
                setSelectedClients([]);
              }}>
                Cancel
              </button>
              <span className="selected-count">{selectedClients.length} selected</span>
            </>
          )}
        </div>
      </div>

      {/* Batch Actions Bar */}
      {selectMode && (
        <div className="batch-actions-bar">
          <div className="batch-actions-group">
            <button className="btn-text" onClick={handleSelectAll}>
              {selectedClients.length === filteredClients.length ? 'Deselect All' : 'Select All'}
            </button>
            {selectedClients.length > 0 && (
              <>
                <button className="btn-secondary" onClick={handleBatchCategoryUpdate}>
                  <Edit size={18} />
                  Change Category
                </button>
                <button className="btn-secondary" onClick={handleBatchExport}>
                  <FolderOpen size={18} />
                  Export CSV
                </button>
                <button className="btn-danger" onClick={handleBatchDelete}>
                  <Trash2 size={18} />
                  Delete Selected
                </button>
              </>
            )}
          </div>
        </div>
      )}

      <div className="controls-bar">
        <div className="search-box">
          <Search size={20} />
          <input
            type="text"
            placeholder="Search clients..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="filter-group">
          <Filter size={20} />
          <select 
            value={filterCategory} 
            onChange={(e) => setFilterCategory(e.target.value)}
          >
            <option value="all">All Categories</option>
            {categories.map(cat => (
              <option key={cat.value} value={cat.value}>{cat.label}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="clients-grid">
        {filteredClients.length > 0 ? (
          filteredClients.map(client => {
            const isSelected = selectedClients.includes(client.id);
            return (
              <div 
                key={client.id} 
                className={`client-card ${isSelected ? 'selected' : ''}`}
                onClick={() => {
                  if (selectMode) {
                    handleSelectClient(client.id);
                  } else {
                    navigate(`/clients/${client.id}`);
                  }
                }}
              >
                {selectMode && (
                  <div className="client-select-checkbox">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => handleSelectClient(client.id)}
                      onClick={(e) => e.stopPropagation()}
                    />
                  </div>
                )}
                <div className="client-header">
                  <div className="client-avatar">
                    {client.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="client-info">
                    <h3>{client.name}</h3>
                    <span className={`category-badge ${client.category}`}>
                      {categories.find(c => c.value === client.category)?.label}
                    </span>
                  </div>
                </div>
                <div className="client-details">
                  {client.email && (
                    <div className="detail-item">
                      <Mail size={16} />
                      <span>{client.email}</span>
                    </div>
                  )}
                  {client.phone && (
                    <div className="detail-item">
                      <Phone size={16} />
                      <span>{client.phone}</span>
                    </div>
                  )}
                  {client.address && (
                    <div className="detail-item">
                      <MapPin size={16} />
                      <span>{client.address}</span>
                    </div>
                  )}
                  <div className="detail-item">
                    <Calendar size={16} />
                    <span>Added {format(new Date(client.createdAt), 'MMM dd, yyyy')}</span>
                  </div>
                </div>
                {!selectMode && (
                  <div className="client-actions">
                    <button 
                      className="btn-text"
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/clients/${client.id}`);
                      }}
                    >
                      <FolderOpen size={16} />
                      View Details
                    </button>
                  </div>
                )}
              </div>
            );
          })
        ) : (
          <div className="empty-state">
            <p>No clients found</p>
            <button className="btn-primary" onClick={() => setShowAddModal(true)}>
              Add Your First Client
            </button>
          </div>
        )}
      </div>

      {showAddModal && (
        <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Add New Client</h2>
              <button className="btn-icon" onClick={() => setShowAddModal(false)}>
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Name *</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div className="form-group">
                <label>Email</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                />
              </div>
              <div className="form-group">
                <label>Phone</label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                />
              </div>
              <div className="form-group">
                <label>Address</label>
                <input
                  type="text"
                  name="address"
                  value={formData.address}
                  onChange={handleInputChange}
                />
              </div>
              <div className="form-group">
                <label>Practice Area *</label>
                <select
                  name="category"
                  value={formData.category}
                  onChange={handleInputChange}
                  required
                >
                  {categories.map(cat => (
                    <option key={cat.value} value={cat.value}>
                      {cat.label}
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
                  rows="4"
                />
              </div>
              <div className="modal-footer">
                <button type="button" className="btn-secondary" onClick={() => setShowAddModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  Add Client
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Clients;
