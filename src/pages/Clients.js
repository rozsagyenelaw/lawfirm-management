import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, Filter, Mail, Phone, MapPin, Calendar, FolderOpen, X } from 'lucide-react';
import { useData } from '../context/DataContext';
import { format } from 'date-fns';

const Clients = () => {
  const navigate = useNavigate();
  const { clients, addClient, deleteClient } = useData();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [showAddModal, setShowAddModal] = useState(false);
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

  return (
    <div className="clients-page">
      <div className="page-header">
        <div>
          <h1>Clients</h1>
          <p>Manage your client database</p>
        </div>
        <button className="btn-primary" onClick={() => setShowAddModal(true)}>
          <Plus size={20} />
          Add Client
        </button>
      </div>

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
          filteredClients.map(client => (
            <div 
              key={client.id} 
              className="client-card"
              onClick={() => navigate(`/clients/${client.id}`)}
            >
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
            </div>
          ))
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
