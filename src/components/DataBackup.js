import React from 'react';
import { Download, Upload } from 'lucide-react';
import { useData } from '../context/DataContext';
import { format } from 'date-fns';

const DataBackup = () => {
  const { clients, tasks, events, documents } = useData();

  const exportData = () => {
    const data = {
      clients,
      tasks,
      events,
      documents,
      exportDate: new Date().toISOString()
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], 
      { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `law-firm-backup-${format(new Date(), 'yyyy-MM-dd')}.json`;
    a.click();
  };

  const importData = (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = JSON.parse(e.target.result);
          if (window.confirm('This will replace all existing data. Continue?')) {
            localStorage.setItem('clients', JSON.stringify(data.clients || []));
            localStorage.setItem('tasks', JSON.stringify(data.tasks || []));
            localStorage.setItem('events', JSON.stringify(data.events || []));
            localStorage.setItem('documents', JSON.stringify(data.documents || []));
            window.location.reload();
          }
        } catch (error) {
          alert('Invalid backup file');
        }
      };
      reader.readAsText(file);
    }
  };

  return (
    <div className="data-backup-section">
      <h3>Backup & Restore</h3>
      <p className="backup-description">
        Export your data regularly to prevent data loss. Import to restore from a backup.
      </p>
      <div className="backup-buttons">
        <button onClick={exportData} className="btn-primary">
          <Download size={16} />
          Export Backup
        </button>
        <label className="btn-secondary" style={{ cursor: 'pointer' }}>
          <Upload size={16} />
          Import Backup
          <input 
            type="file" 
            accept=".json" 
            onChange={importData} 
            style={{ display: 'none' }}
          />
        </label>
      </div>
      <div className="backup-info">
        <small>Last backup: {localStorage.getItem('lastBackup') || 'Never'}</small>
      </div>
    </div>
  );
};

export default DataBackup;
