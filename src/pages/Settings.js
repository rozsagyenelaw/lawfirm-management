import React, { useState } from 'react';
import { Save, Download, Upload, Trash2, Bell, Moon, Sun, Globe, Lock, Database, AlertCircle } from 'lucide-react';
import { useData } from '../context/DataContext';
import toast from 'react-hot-toast';
import { format } from 'date-fns';  // ADD THIS LINE

const Settings = () => {
  const { clients, tasks, events, documents } = useData();
  const [activeTab, setActiveTab] = useState('general');
  const [settings, setSettings] = useState(() => {
    const saved = localStorage.getItem('appSettings');
    return saved ? JSON.parse(saved) : {
      firmName: 'Law Offices of Rozsa Gyene',  // Added your firm info
      email: 'rozsagyenelaw@yahoo.com',
      phone: '(818) 291-6217',
      address: '450 N Brand Blvd. Suite 600\nGlendale, CA 91203',
      theme: 'light',
      notifications: true,
      emailReminders: true,
      timezone: 'America/Los_Angeles'
    };
  });

  const handleSettingChange = (key, value) => {
    const newSettings = { ...settings, [key]: value };
    setSettings(newSettings);
    localStorage.setItem('appSettings', JSON.stringify(newSettings));
    toast.success('Settings saved');
  };

  const exportData = () => {
    const data = {
      clients,
      tasks,
      events,
      documents,
      settings,
      exportDate: new Date().toISOString()
    };
    const dataStr = JSON.stringify(data, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    const exportFileDefaultName = `lawfirm-backup-${format(new Date(), 'yyyy-MM-dd')}.json`;
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
    toast.success('Data exported successfully');
  };

  const importData = (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = JSON.parse(e.target.result);
          if (data.clients) localStorage.setItem('clients', JSON.stringify(data.clients));
          if (data.tasks) localStorage.setItem('tasks', JSON.stringify(data.tasks));
          if (data.events) localStorage.setItem('events', JSON.stringify(data.events));
          if (data.documents) localStorage.setItem('documents', JSON.stringify(data.documents));
          if (data.settings) {
            setSettings(data.settings);
            localStorage.setItem('appSettings', JSON.stringify(data.settings));
          }
          toast.success('Data imported successfully! Please refresh the page.');
          setTimeout(() => window.location.reload(), 2000);
        } catch (error) {
          toast.error('Failed to import data');
        }
      };
      reader.readAsText(file);
    }
  };

  const clearAllData = () => {
    if (window.confirm('Are you sure you want to delete all data? This cannot be undone!')) {
      if (window.confirm('This will delete ALL clients, tasks, events, and documents. Are you absolutely sure?')) {
        localStorage.clear();
        toast.success('All data cleared. Refreshing...');
        setTimeout(() => window.location.reload(), 2000);
      }
    }
  };

  // REMOVE THE CUSTOM FORMAT FUNCTION - WE'RE USING DATE-FNS NOW

  return (
    <div className="settings-page">
      <div className="page-header">
        <h1>Settings</h1>
        <p>Manage your application preferences</p>
      </div>

      <div className="settings-container">
        <div className="settings-sidebar">
          <button 
            className={`settings-nav-item ${activeTab === 'general' ? 'active' : ''}`}
            onClick={() => setActiveTab('general')}
          >
            <Globe size={20} />
            General
          </button>
          <button 
            className={`settings-nav-item ${activeTab === 'notifications' ? 'active' : ''}`}
            onClick={() => setActiveTab('notifications')}
          >
            <Bell size={20} />
            Notifications
          </button>
          <button 
            className={`settings-nav-item ${activeTab === 'appearance' ? 'active' : ''}`}
            onClick={() => setActiveTab('appearance')}
          >
            <Moon size={20} />
            Appearance
          </button>
          <button 
            className={`settings-nav-item ${activeTab === 'data' ? 'active' : ''}`}
            onClick={() => setActiveTab('data')}
          >
            <Database size={20} />
            Data Management
          </button>
          <button 
            className={`settings-nav-item ${activeTab === 'security' ? 'active' : ''}`}
            onClick={() => setActiveTab('security')}
          >
            <Lock size={20} />
            Security
          </button>
        </div>

        <div className="settings-content">
          {activeTab === 'general' && (
            <div className="settings-section">
              <h2>General Settings</h2>
              <div className="settings-form">
                <div className="form-group">
                  <label>Firm Name</label>
                  <input
                    type="text"
                    value={settings.firmName}
                    onChange={(e) => handleSettingChange('firmName', e.target.value)}
                    placeholder="Your Law Firm Name"
                  />
                </div>
                <div className="form-group">
                  <label>Email</label>
                  <input
                    type="email"
                    value={settings.email}
                    onChange={(e) => handleSettingChange('email', e.target.value)}
                    placeholder="firm@example.com"
                  />
                </div>
                <div className="form-group">
                  <label>Phone</label>
                  <input
                    type="tel"
                    value={settings.phone}
                    onChange={(e) => handleSettingChange('phone', e.target.value)}
                    placeholder="(555) 123-4567"
                  />
                </div>
                <div className="form-group">
                  <label>Address</label>
                  <textarea
                    value={settings.address}
                    onChange={(e) => handleSettingChange('address', e.target.value)}
                    rows="3"
                    placeholder="123 Legal Street, Suite 100&#10;Law City, LC 12345"
                  />
                </div>
                <div className="form-group">
                  <label>Timezone</label>
                  <select
                    value={settings.timezone}
                    onChange={(e) => handleSettingChange('timezone', e.target.value)}
                  >
                    <option value="America/New_York">Eastern Time</option>
                    <option value="America/Chicago">Central Time</option>
                    <option value="America/Denver">Mountain Time</option>
                    <option value="America/Los_Angeles">Pacific Time</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'notifications' && (
            <div className="settings-section">
              <h2>Notification Preferences</h2>
              <div className="settings-options">
                <div className="option-item">
                  <div className="option-info">
                    <h3>Court Date Reminders (10 days)</h3>
                    <p>Get notified 10 days before court dates to clear notes</p>
                  </div>
                  <label className="switch">
                    <input
                      type="checkbox"
                      checked={settings.notifications}
                      onChange={(e) => handleSettingChange('notifications', e.target.checked)}
                    />
                    <span className="slider"></span>
                  </label>
                </div>
                <div className="option-item">
                  <div className="option-info">
                    <h3>Court Date Reminders (1 day)</h3>
                    <p>Get notified 1 day before court dates</p>
                  </div>
                  <label className="switch">
                    <input
                      type="checkbox"
                      checked={settings.emailReminders}
                      onChange={(e) => handleSettingChange('emailReminders', e.target.checked)}
                    />
                    <span className="slider"></span>
                  </label>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'appearance' && (
            <div className="settings-section">
              <h2>Appearance</h2>
              <div className="theme-options">
                <div 
                  className={`theme-card ${settings.theme === 'light' ? 'active' : ''}`}
                  onClick={() => handleSettingChange('theme', 'light')}
                >
                  <Sun size={32} />
                  <span>Light Mode</span>
                </div>
                <div 
                  className={`theme-card ${settings.theme === 'dark' ? 'active' : ''}`}
                  onClick={() => handleSettingChange('theme', 'dark')}
                >
                  <Moon size={32} />
                  <span>Dark Mode</span>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'data' && (
            <div className="settings-section">
              <h2>Data Management</h2>
              <div className="data-stats">
                <div className="stat-card">
                  <h3>{clients.length}</h3>
                  <p>Clients</p>
                </div>
                <div className="stat-card">
                  <h3>{tasks.length}</h3>
                  <p>Tasks</p>
                </div>
                <div className="stat-card">
                  <h3>{events.length}</h3>
                  <p>Events</p>
                </div>
                <div className="stat-card">
                  <h3>{documents.length}</h3>
                  <p>Documents</p>
                </div>
              </div>
              <div className="data-actions">
                <button className="btn-primary" onClick={exportData}>
                  <Download size={20} />
                  Export All Data
                </button>
                <label className="btn-secondary">
                  <Upload size={20} />
                  Import Data
                  <input
                    type="file"
                    accept=".json"
                    onChange={importData}
                    style={{ display: 'none' }}
                  />
                </label>
                <button className="btn-danger" onClick={clearAllData}>
                  <Trash2 size={20} />
                  Clear All Data
                </button>
              </div>
              <div className="warning-box">
                <AlertCircle size={20} />
                <p>
                  <strong>Important:</strong> Export your data regularly! Data is stored locally in your browser. 
                  Clearing browser data or using a different browser will result in data loss. 
                  Export your data now to prevent losing your clients and tasks.
                </p>
              </div>
            </div>
          )}

          {activeTab === 'security' && (
            <div className="settings-section">
              <h2>Security</h2>
              <div className="warning-box">
                <Lock size={20} />
                <p>
                  <strong>Note:</strong> This is a demo application. For production use, 
                  implement proper authentication, encryption, and secure data storage.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Settings;
