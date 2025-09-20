import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Mail, Phone, MapPin, Calendar, Edit, Trash2, Plus, FileText, CheckSquare, Clock, DollarSign, CreditCard, Flame, FileSignature } from 'lucide-react';
import { useData } from '../context/DataContext';
import { format } from 'date-fns';
import DocumentUpload from '../components/DocumentUpload';
import InvoiceGenerator from '../components/InvoiceGenerator';
import PaymentManager from '../components/PaymentManager';
import FormsTracker from '../components/FormsTracker';
import DamageCalculator from '../components/DamageCalculator';
import DocumentGenerationPanel from '../components/DocumentGenerationPanel';

const ClientDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { 
    clients, 
    updateClient, 
    deleteClient,
    getClientTasks,
    getClientDocuments,
    getClientEvents,
    getClientInvoices,
    getClientTrustBalance,
    addTask,
    addDocument,
    addEvent
  } = useData();
  
  const client = clients.find(c => c.id === id);
  const [activeTab, setActiveTab] = useState('overview');
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState(client || {});
  
  if (!client) {
    return (
      <div className="client-detail">
        <div className="page-header">
          <button className="btn-text" onClick={() => navigate('/clients')}>
            <ArrowLeft size={20} />
            Back to Clients
          </button>
        </div>
        <p>Client not found</p>
      </div>
    );
  }

  const clientTasks = getClientTasks(id);
  const clientDocuments = getClientDocuments(id);
  const clientEvents = getClientEvents(id);
  const clientInvoices = getClientInvoices(id);
  const trustBalance = getClientTrustBalance(id);

  // Get damage estimate summary for fire victim clients
  const getDamagesSummary = () => {
    if (client.category !== 'fire-victim' || !client.damageEstimates) {
      return null;
    }
    
    const estimates = client.damageEstimates;
    const totalClaimed = estimates.totalClaimed || 0;
    const gapAmount = estimates.gapAmount || 0;
    
    return { totalClaimed, gapAmount };
  };

  const damagesSummary = getDamagesSummary();

  const handleUpdate = () => {
    updateClient(id, editData);
    setIsEditing(false);
  };

  const handleDelete = () => {
    if (window.confirm('Are you sure you want to delete this client?')) {
      deleteClient(id);
      navigate('/clients');
    }
  };

  const handleAddTask = () => {
    const taskTitle = prompt('Enter task title:');
    if (taskTitle) {
      addTask({
        clientId: id,
        title: taskTitle,
        description: '',
        priority: 'medium',
        status: 'pending',
        dueDate: new Date().toISOString()
      });
    }
  };

  const handleAddDocument = () => {
    const docName = prompt('Enter document name:');
    if (docName) {
      addDocument({
        clientId: id,
        name: docName,
        type: 'general',
        size: '0 KB',
        url: '#'
      });
    }
  };

  const handleAddEvent = () => {
    const eventTitle = prompt('Enter event title:');
    if (eventTitle) {
      const eventDate = new Date();
      eventDate.setDate(eventDate.getDate() + 7);
      addEvent({
        clientId: id,
        title: eventTitle,
        start: eventDate.toISOString(),
        end: new Date(eventDate.getTime() + 60 * 60 * 1000).toISOString(),
        type: 'meeting'
      });
    }
  };

  const categories = {
    'estate-planning': 'Estate Planning',
    'probate': 'Probate',
    'trust-litigation': 'Trust Litigation',
    'conservatorship': 'Conservatorship',
    'guardianship': 'Guardianship',
    'fire-victim': 'Fire Victim'
  };

  // Check if document generation should be available for this client category
  const shouldShowDocumentGeneration = () => {
    const supportedCategories = ['probate', 'conservatorship', 'guardianship', 'estate-planning'];
    return supportedCategories.includes(client.category);
  };

  // Prepare client data for document generation with the correct case type format
  const getClientDataForDocumentGeneration = () => {
    const caseTypeMapping = {
      'estate-planning': 'trust',
      'probate': 'probate',
      'conservatorship': 'conservatorship',
      'guardianship': 'guardianship'
    };

    return {
      ...client,
      caseType: caseTypeMapping[client.category] || client.category,
      petitionerName: client.name,
      conservatorName: client.name,
      guardianName: client.name,
      trustorName: client.name,
      caseNumber: client.caseNumber || '',
      createdAt: client.createdAt,
      updatedAt: client.updatedAt
    };
  };

  return (
    <div className="client-detail">
      <div className="page-header">
        <button className="btn-text" onClick={() => navigate('/clients')}>
          <ArrowLeft size={20} />
          Back to Clients
        </button>
        <div className="header-actions">
          {!isEditing ? (
            <>
              <button className="btn-secondary" onClick={() => setIsEditing(true)}>
                <Edit size={20} />
                Edit
              </button>
              <button className="btn-danger" onClick={handleDelete}>
                <Trash2 size={20} />
                Delete
              </button>
            </>
          ) : (
            <>
              <button className="btn-secondary" onClick={() => setIsEditing(false)}>
                Cancel
              </button>
              <button className="btn-primary" onClick={handleUpdate}>
                Save Changes
              </button>
            </>
          )}
        </div>
      </div>

      <div className="client-detail-content">
        <div className="client-header-card">
          <div className="client-avatar-large">
            {client.name.charAt(0).toUpperCase()}
          </div>
          <div className="client-header-info">
            {!isEditing ? (
              <>
                <h1>{client.name}</h1>
                <span className={`category-badge ${client.category}`}>
                  {categories[client.category]}
                </span>
              </>
            ) : (
              <>
                <input
                  type="text"
                  value={editData.name}
                  onChange={(e) => setEditData({...editData, name: e.target.value})}
                  className="edit-input-large"
                />
                <select
                  value={editData.category}
                  onChange={(e) => setEditData({...editData, category: e.target.value})}
                  className="edit-select"
                >
                  {Object.entries(categories).map(([value, label]) => (
                    <option key={value} value={value}>{label}</option>
                  ))}
                </select>
              </>
            )}
          </div>
        </div>

        <div className="tabs">
          <button 
            className={`tab ${activeTab === 'overview' ? 'active' : ''}`}
            onClick={() => setActiveTab('overview')}
          >
            Overview
          </button>
          <button 
            className={`tab ${activeTab === 'tasks' ? 'active' : ''}`}
            onClick={() => setActiveTab('tasks')}
          >
            Tasks ({clientTasks.length})
          </button>
          <button 
            className={`tab ${activeTab === 'documents' ? 'active' : ''}`}
            onClick={() => setActiveTab('documents')}
          >
            Documents ({clientDocuments.length})
          </button>
          <button 
            className={`tab ${activeTab === 'events' ? 'active' : ''}`}
            onClick={() => setActiveTab('events')}
          >
            Events ({clientEvents.length})
          </button>
          <button 
            className={`tab ${activeTab === 'invoice' ? 'active' : ''}`}
            onClick={() => setActiveTab('invoice')}
          >
            Invoice ({clientInvoices.length})
          </button>
          <button 
            className={`tab ${activeTab === 'payments' ? 'active' : ''}`}
            onClick={() => setActiveTab('payments')}
          >
            Payments
          </button>
          {(client.category === 'probate' || 
            client.category === 'conservatorship' || 
            client.category === 'guardianship') && (
            <button 
              className={`tab ${activeTab === 'forms' ? 'active' : ''}`}
              onClick={() => setActiveTab('forms')}
            >
              Forms
            </button>
          )}
          {shouldShowDocumentGeneration() && (
            <button 
              className={`tab ${activeTab === 'generate' ? 'active' : ''}`}
              onClick={() => setActiveTab('generate')}
            >
              <FileSignature size={16} />
              Generate
            </button>
          )}
          {client.category === 'fire-victim' && (
            <button 
              className={`tab ${activeTab === 'damages' ? 'active' : ''}`}
              onClick={() => setActiveTab('damages')}
            >
              <Flame size={16} />
              Damages
            </button>
          )}
        </div>

        <div className="tab-content">
          {activeTab === 'overview' && (
            <div className="overview-grid">
              <div className="info-card">
                <h3>Contact Information</h3>
                <div className="info-list">
                  <div className="info-item">
                    <Mail size={18} />
                    {!isEditing ? (
                      <span>{client.email || 'No email'}</span>
                    ) : (
                      <input
                        type="email"
                        value={editData.email}
                        onChange={(e) => setEditData({...editData, email: e.target.value})}
                        placeholder="Email"
                      />
                    )}
                  </div>
                  <div className="info-item">
                    <Phone size={18} />
                    {!isEditing ? (
                      <span>{client.phone || 'No phone'}</span>
                    ) : (
                      <input
                        type="tel"
                        value={editData.phone}
                        onChange={(e) => setEditData({...editData, phone: e.target.value})}
                        placeholder="Phone"
                      />
                    )}
                  </div>
                  <div className="info-item">
                    <MapPin size={18} />
                    {!isEditing ? (
                      <span>{client.address || 'No address'}</span>
                    ) : (
                      <input
                        type="text"
                        value={editData.address}
                        onChange={(e) => setEditData({...editData, address: e.target.value})}
                        placeholder="Address"
                      />
                    )}
                  </div>
                  <div className="info-item">
                    <Calendar size={18} />
                    <span>Client since {format(new Date(client.createdAt), 'MMMM dd, yyyy')}</span>
                  </div>
                </div>
              </div>

              <div className="info-card">
                <h3>Notes</h3>
                {!isEditing ? (
                  <p>{client.notes || 'No notes added'}</p>
                ) : (
                  <textarea
                    value={editData.notes}
                    onChange={(e) => setEditData({...editData, notes: e.target.value})}
                    rows="6"
                    placeholder="Add notes about this client"
                  />
                )}
              </div>

              <div className="info-card">
                <h3>Quick Stats</h3>
                <div className="stats-list">
                  <div className="stat-item">
                    <CheckSquare size={18} />
                    <span>{clientTasks.filter(t => !t.completed).length} pending tasks</span>
                  </div>
                  <div className="stat-item">
                    <FileText size={18} />
                    <span>{clientDocuments.length} documents</span>
                  </div>
                  <div className="stat-item">
                    <Clock size={18} />
                    <span>{clientEvents.length} scheduled events</span>
                  </div>
                  <div className="stat-item">
                    <DollarSign size={18} />
                    <span>{clientInvoices.length} invoices</span>
                  </div>
                  <div className="stat-item">
                    <CreditCard size={18} />
                    <span>${trustBalance.toFixed(2)} in trust</span>
                  </div>
                  {damagesSummary && (
                    <>
                      <div className="stat-item">
                        <Flame size={18} />
                        <span>${damagesSummary.totalClaimed.toLocaleString()} total damages</span>
                      </div>
                      {damagesSummary.gapAmount > 0 && (
                        <div className="stat-item" style={{ color: '#dc2626' }}>
                          <DollarSign size={18} />
                          <span>${damagesSummary.gapAmount.toLocaleString()} gap amount</span>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'tasks' && (
            <div className="section-content">
              <div className="section-header">
                <h3>Tasks</h3>
                <button className="btn-primary" onClick={handleAddTask}>
                  <Plus size={20} />
                  Add Task
                </button>
              </div>
              {clientTasks.length > 0 ? (
                <div className="task-list">
                  {clientTasks.map(task => (
                    <div key={task.id} className="task-item">
                      <div className="task-info">
                        <h4>{task.title}</h4>
                        <p>{task.description}</p>
                      </div>
                      <div className="task-meta">
                        <span className={`status-badge ${task.status}`}>
                          {task.status}
                        </span>
                        <span className="due-date">
                          Due {format(new Date(task.dueDate), 'MMM dd')}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="empty-state">No tasks for this client</p>
              )}
            </div>
          )}

          {activeTab === 'documents' && (
            <div className="section-content">
              <DocumentUpload clientId={id} clientName={client.name} />
            </div>
          )}

          {activeTab === 'events' && (
            <div className="section-content">
              <div className="section-header">
                <h3>Events</h3>
                <button className="btn-primary" onClick={handleAddEvent}>
                  <Plus size={20} />
                  Add Event
                </button>
              </div>
              {clientEvents.length > 0 ? (
                <div className="event-list">
                  {clientEvents.map(event => (
                    <div key={event.id} className="event-item">
                      <div className="event-info">
                        <h4>{event.title}</h4>
                        <p>{format(new Date(event.start), 'MMM dd, yyyy h:mm a')}</p>
                      </div>
                      <span className={`event-type ${event.type}`}>
                        {event.type}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="empty-state">No events for this client</p>
              )}
            </div>
          )}

          {activeTab === 'invoice' && (
            <div className="section-content">
              <InvoiceGenerator clientId={id} clientName={client.name} />
            </div>
          )}

          {activeTab === 'payments' && (
            <div className="section-content">
              <PaymentManager clientId={id} clientName={client.name} />
            </div>
          )}

          {activeTab === 'forms' && (
            <div className="section-content">
              {(client.category === 'probate' || 
                client.category === 'conservatorship' || 
                client.category === 'guardianship') ? (
                <FormsTracker 
                  clientId={id} 
                  clientName={client.name}
                  category={client.category}
                  caseStartDate={client.createdAt}
                />
              ) : (
                <div className="empty-state">
                  <FileText size={48} />
                  <p>Forms tracking is not available for {categories[client.category]}</p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'generate' && shouldShowDocumentGeneration() && (
            <div className="section-content">
              <DocumentGenerationPanel client={getClientDataForDocumentGeneration()} />
            </div>
          )}

          {activeTab === 'damages' && client.category === 'fire-victim' && (
            <div className="section-content">
              <DamageCalculator 
                clientId={id} 
                clientName={client.name}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ClientDetail;
