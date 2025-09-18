import React, { useState, useEffect } from 'react';
import { useData } from '../context/DataContext';
import { Clock, User, FileText, Calendar, Phone, Mail, Briefcase, Search, Filter, Download } from 'lucide-react';
import { format, startOfDay, endOfDay, subDays } from 'date-fns';
import toast from 'react-hot-toast';

const ActivityLog = () => {
  const { clients, tasks, events, documents } = useData();
  const [activities, setActivities] = useState([]);
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [dateRange, setDateRange] = useState('week');
  const [selectedClient, setSelectedClient] = useState('');
  const [showAddActivity, setShowAddActivity] = useState(false);

  // Activity types for manual logging
  const activityTypes = [
    { id: 'phone', label: 'Phone Call', icon: Phone, color: '#3B82F6' },
    { id: 'email', label: 'Email', icon: Mail, color: '#10B981' },
    { id: 'meeting', label: 'Client Meeting', icon: User, color: '#8B5CF6' },
    { id: 'court', label: 'Court Appearance', icon: Briefcase, color: '#EF4444' },
    { id: 'document', label: 'Document Review', icon: FileText, color: '#F59E0B' },
    { id: 'research', label: 'Legal Research', icon: Search, color: '#6B7280' }
  ];

  // Load activities from localStorage
  useEffect(() => {
    const savedActivities = localStorage.getItem('activityLog');
    if (savedActivities) {
      setActivities(JSON.parse(savedActivities));
    }
  }, []);

  // Save activities to localStorage (and eventually Firebase)
  const saveActivities = (newActivities) => {
    setActivities(newActivities);
    localStorage.setItem('activityLog', JSON.stringify(newActivities));
  };

  // Add manual activity
  const addActivity = (activityData) => {
    const newActivity = {
      id: Date.now().toString(),
      ...activityData,
      timestamp: new Date().toISOString(),
      type: activityData.type || 'manual'
    };
    
    const updatedActivities = [newActivity, ...activities];
    saveActivities(updatedActivities);
    toast.success('Activity logged');
    setShowAddActivity(false);
  };

  // Auto-log system activities (called from other components)
  const logSystemActivity = (action, details) => {
    const systemActivity = {
      id: Date.now().toString(),
      action,
      details,
      timestamp: new Date().toISOString(),
      type: 'system'
    };
    
    const updatedActivities = [systemActivity, ...activities];
    saveActivities(updatedActivities);
  };

  // Filter activities
  const getFilteredActivities = () => {
    let filtered = [...activities];
    
    // Date range filter
    const now = new Date();
    let startDate = startOfDay(now);
    
    switch (dateRange) {
      case 'today':
        startDate = startOfDay(now);
        break;
      case 'week':
        startDate = subDays(startOfDay(now), 7);
        break;
      case 'month':
        startDate = subDays(startOfDay(now), 30);
        break;
      case 'all':
      default:
        startDate = new Date(0);
    }
    
    filtered = filtered.filter(activity => 
      new Date(activity.timestamp) >= startDate
    );
    
    // Client filter
    if (selectedClient) {
      filtered = filtered.filter(activity => 
        activity.clientId === selectedClient
      );
    }
    
    // Type filter
    if (filter !== 'all') {
      filtered = filtered.filter(activity => 
        activity.type === filter || activity.activityType === filter
      );
    }
    
    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(activity => 
        JSON.stringify(activity).toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    return filtered;
  };

  // Export activities
  const exportActivities = () => {
    const filtered = getFilteredActivities();
    const csv = [
      ['Date', 'Time', 'Client', 'Type', 'Description', 'Duration', 'Billable'].join(','),
      ...filtered.map(a => [
        format(new Date(a.timestamp), 'yyyy-MM-dd'),
        format(new Date(a.timestamp), 'HH:mm'),
        a.clientId ? clients.find(c => c.id === a.clientId)?.name || '' : '',
        a.activityType || a.type || '',
        a.description || a.action || '',
        a.duration || '',
        a.billable ? 'Yes' : 'No'
      ].join(','))
    ].join('\n');
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `activity-log-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    link.click();
    
    toast.success('Activity log exported');
  };

  const ActivityItem = ({ activity }) => {
    const client = activity.clientId ? clients.find(c => c.id === activity.clientId) : null;
    const activityType = activityTypes.find(t => t.id === activity.activityType);
    const Icon = activityType?.icon || FileText;
    
    return (
      <div className="activity-item">
        <div className="activity-icon" style={{ background: activityType?.color || '#6B7280' }}>
          <Icon size={16} color="white" />
        </div>
        
        <div className="activity-content">
          <div className="activity-header">
            <strong>{activity.activityType ? activityType?.label : activity.action}</strong>
            {client && (
              <span className="activity-client">• {client.name}</span>
            )}
            {activity.billable && (
              <span className="billable-badge">Billable</span>
            )}
          </div>
          
          <div className="activity-description">
            {activity.description || activity.details}
          </div>
          
          <div className="activity-meta">
            <span>
              <Clock size={12} />
              {format(new Date(activity.timestamp), 'MMM d, yyyy h:mm a')}
            </span>
            {activity.duration && (
              <span>Duration: {activity.duration} min</span>
            )}
          </div>
        </div>
      </div>
    );
  };

  const AddActivityModal = () => {
    const [formData, setFormData] = useState({
      activityType: 'phone',
      clientId: '',
      description: '',
      duration: '',
      billable: true
    });
    
    if (!showAddActivity) return null;
    
    return (
      <div className="modal-overlay" onClick={() => setShowAddActivity(false)}>
        <div className="modal" onClick={e => e.stopPropagation()}>
          <div className="modal-header">
            <h2>Log Activity</h2>
            <button onClick={() => setShowAddActivity(false)}>✕</button>
          </div>
          
          <form onSubmit={(e) => {
            e.preventDefault();
            addActivity(formData);
          }}>
            <div className="form-group">
              <label>Activity Type</label>
              <select
                value={formData.activityType}
                onChange={(e) => setFormData({...formData, activityType: e.target.value})}
                required
              >
                {activityTypes.map(type => (
                  <option key={type.id} value={type.id}>{type.label}</option>
                ))}
              </select>
            </div>
            
            <div className="form-group">
              <label>Client</label>
              <select
                value={formData.clientId}
                onChange={(e) => setFormData({...formData, clientId: e.target.value})}
              >
                <option value="">No Client</option>
                {clients.map(client => (
                  <option key={client.id} value={client.id}>{client.name}</option>
                ))}
              </select>
            </div>
            
            <div className="form-group">
              <label>Description</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                rows="3"
                required
                placeholder="Brief description of the activity..."
              />
            </div>
            
            <div className="form-row">
              <div className="form-group">
                <label>Duration (minutes)</label>
                <input
                  type="number"
                  value={formData.duration}
                  onChange={(e) => setFormData({...formData, duration: e.target.value})}
                  min="0"
                  step="15"
                  placeholder="30"
                />
              </div>
              
              <div className="form-group">
                <label>
                  <input
                    type="checkbox"
                    checked={formData.billable}
                    onChange={(e) => setFormData({...formData, billable: e.target.checked})}
                  />
                  Billable
                </label>
              </div>
            </div>
            
            <div className="modal-footer">
              <button type="button" className="btn-secondary" onClick={() => setShowAddActivity(false)}>
                Cancel
              </button>
              <button type="submit" className="btn-primary">
                Log Activity
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  };

  const filteredActivities = getFilteredActivities();
  const totalBillableTime = filteredActivities
    .filter(a => a.billable && a.duration)
    .reduce((sum, a) => sum + parseInt(a.duration), 0);

  return (
    <div className="activity-log">
      <div className="activity-log-header">
        <h2>Activity Log</h2>
        <div className="header-actions">
          <button className="btn-primary" onClick={() => setShowAddActivity(true)}>
            Log Activity
          </button>
          <button className="btn-secondary" onClick={exportActivities}>
            <Download size={16} />
            Export CSV
          </button>
        </div>
      </div>
      
      <div className="activity-filters">
        <div className="filter-group">
          <select value={dateRange} onChange={(e) => setDateRange(e.target.value)}>
            <option value="today">Today</option>
            <option value="week">Past Week</option>
            <option value="month">Past Month</option>
            <option value="all">All Time</option>
          </select>
        </div>
        
        <div className="filter-group">
          <select value={selectedClient} onChange={(e) => setSelectedClient(e.target.value)}>
            <option value="">All Clients</option>
            {clients.map(client => (
              <option key={client.id} value={client.id}>{client.name}</option>
            ))}
          </select>
        </div>
        
        <div className="filter-group">
          <select value={filter} onChange={(e) => setFilter(e.target.value)}>
            <option value="all">All Types</option>
            {activityTypes.map(type => (
              <option key={type.id} value={type.id}>{type.label}</option>
            ))}
          </select>
        </div>
        
        <div className="search-box">
          <Search size={20} />
          <input
            type="text"
            placeholder="Search activities..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>
      
      {totalBillableTime > 0 && (
        <div className="billable-summary">
          <strong>Billable Time:</strong> {Math.floor(totalBillableTime / 60)}h {totalBillableTime % 60}m
          <span>({filteredActivities.filter(a => a.billable).length} billable activities)</span>
        </div>
      )}
      
      <div className="activity-list">
        {filteredActivities.length > 0 ? (
          filteredActivities.map(activity => (
            <ActivityItem key={activity.id} activity={activity} />
          ))
        ) : (
          <div className="empty-state">
            <p>No activities found</p>
            <button className="btn-text" onClick={() => setShowAddActivity(true)}>
              Log your first activity
            </button>
          </div>
        )}
      </div>
      
      <AddActivityModal />
    </div>
  );
};

export default ActivityLog;
