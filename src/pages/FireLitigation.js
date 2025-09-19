import React, { useState, useEffect } from 'react';
import { Flame, AlertTriangle, Calendar, Mail, FileText, Users, Clock, CheckCircle, AlertCircle, Download, RefreshCw } from 'lucide-react';
import { format, isAfter, addDays, differenceInDays } from 'date-fns';
import { useData } from '../context/DataContext';
import toast from 'react-hot-toast';

const FireLitigation = () => {
  const { clients, addTask, addEvent, addDocument } = useData();
  
  const [activeCase, setActiveCase] = useState('all');
  const [emailSummaries, setEmailSummaries] = useState([]);
  const [showImportModal, setShowImportModal] = useState(false);
  const [importData, setImportData] = useState('');
  const [selectedEmail, setSelectedEmail] = useState(null);
  const [deadlines, setDeadlines] = useState([]);
  
  const fireClients = clients.filter(c => c.category === 'fire-victim');
  const eatonClients = fireClients.filter(c => 
    c.notes?.toLowerCase().includes('eaton') || c.fireCase === 'eaton'
  );
  const pacificClients = fireClients.filter(c => 
    c.notes?.toLowerCase().includes('pacific') || 
    c.notes?.toLowerCase().includes('palisades') || 
    c.fireCase === 'pacific'
  );
  
  useEffect(() => {
    const stored = localStorage.getItem('fireLitigationEmails');
    if (stored) {
      setEmailSummaries(JSON.parse(stored));
    }
    
    const storedDeadlines = localStorage.getItem('fireLitigationDeadlines');
    if (storedDeadlines) {
      setDeadlines(JSON.parse(storedDeadlines));
    }
  }, []);
  
  const handleImportEmails = () => {
    try {
      let data;
      if (importData.trim().startsWith('[')) {
        data = JSON.parse(importData);
      } else if (importData.trim().startsWith('{')) {
        const parsed = JSON.parse(importData);
        data = parsed.emails || [parsed];
      } else {
        throw new Error('Invalid JSON format');
      }
      
      const existingIds = emailSummaries.map(e => e.emailId);
      const uniqueNewEmails = data.filter(e => !existingIds.includes(e.emailId));
      
      const updatedEmails = [...emailSummaries, ...uniqueNewEmails];
      setEmailSummaries(updatedEmails);
      localStorage.setItem('fireLitigationEmails', JSON.stringify(updatedEmails));
      
      uniqueNewEmails.forEach(email => {
        if (email.deadlines && email.deadlines.length > 0) {
          email.deadlines.forEach(deadline => {
            const newDeadline = {
              id: Date.now().toString() + Math.random(),
              date: deadline.date,
              description: `${email.fireCase}: ${deadline.description}`,
              source: 'Email',
              fireCase: email.fireCase,
              priority: email.priority
            };
            setDeadlines(prev => [...prev, newDeadline]);
          });
        }
        
        if (email.actionItems && email.actionItems.length > 0) {
          email.actionItems.forEach(action => {
            addTask({
              clientId: 'fire-litigation-general',
              title: `${email.fireCase}: ${action}`,
              description: `From email: ${email.subject}`,
              priority: email.priority?.toLowerCase() || 'medium',
              status: 'pending',
              dueDate: addDays(new Date(), 7).toISOString(),
              category: 'fire-victim'
            });
          });
        }
      });
      
      toast.success(`Imported ${uniqueNewEmails.length} new emails`);
      setShowImportModal(false);
      setImportData('');
    } catch (error) {
      toast.error('Invalid import data. Please paste the JSON from the email.');
      console.error(error);
    }
  };
  
  const filteredEmails = emailSummaries.filter(email => {
    if (activeCase === 'all') return true;
    if (activeCase === 'eaton') return email.fireCase === 'Eaton Fire';
    if (activeCase === 'pacific') return email.fireCase === 'Pacific Palisades';
    return true;
  });
  
  const upcomingDeadlines = deadlines
    .filter(d => isAfter(new Date(d.date), new Date()))
    .sort((a, b) => new Date(a.date) - new Date(b.date))
    .slice(0, 10);
  
  const daysUntil = (date) => {
    const days = differenceInDays(new Date(date), new Date());
    if (days === 0) return 'TODAY';
    if (days === 1) return 'Tomorrow';
    if (days < 0) return 'OVERDUE';
    return `${days} days`;
  };
  
  return (
    <div className="fire-litigation">
      <div className="page-header">
        <div>
          <h1>
            <Flame size={28} style={{ color: '#ff5722', marginRight: '10px' }} />
            Fire Litigation Command Center
          </h1>
          <p>Manage Eaton Fire and Pacific Palisades cases</p>
        </div>
        <div className="header-actions">
          <button 
            className="btn-primary"
            onClick={() => setShowImportModal(true)}
          >
            <Mail size={18} />
            Import Email Summary
          </button>
        </div>
      </div>
      
      <div className="case-tabs">
        <button 
          className={`case-tab ${activeCase === 'all' ? 'active' : ''}`}
          onClick={() => setActiveCase('all')}
        >
          All Cases ({fireClients.length} clients)
        </button>
        <button 
          className={`case-tab ${activeCase === 'eaton' ? 'active' : ''}`}
          onClick={() => setActiveCase('eaton')}
        >
          <Flame size={16} />
          Eaton Fire ({eatonClients.length} clients)
        </button>
        <button 
          className={`case-tab ${activeCase === 'pacific' ? 'active' : ''}`}
          onClick={() => setActiveCase('pacific')}
        >
          <Flame size={16} />
          Pacific Palisades ({pacificClients.length} clients)
        </button>
      </div>
      
      {upcomingDeadlines.filter(d => differenceInDays(new Date(d.date), new Date()) <= 3).length > 0 && (
        <div className="critical-alert">
          <AlertTriangle size={20} />
          <div>
            <strong>Urgent Deadlines!</strong>
            {upcomingDeadlines
              .filter(d => differenceInDays(new Date(d.date), new Date()) <= 3)
              .map(d => (
                <div key={d.id}>
                  {d.description} - <strong>{daysUntil(d.date)}</strong>
                </div>
              ))}
          </div>
        </div>
      )}
      
      <div className="fire-litigation-grid">
        <div className="fire-section">
          <h3>
            <Mail size={20} />
            Email Summaries ({filteredEmails.length})
          </h3>
          <div className="email-list">
            {filteredEmails.slice(0, 10).map((email, index) => (
              <div 
                key={index} 
                className={`email-item priority-${email.priority?.toLowerCase()}`}
                onClick={() => setSelectedEmail(email)}
                style={{ cursor: 'pointer' }}
              >
                <div className="email-header">
                  <span className="email-case">{email.fireCase}</span>
                  <span className="email-date">
                    {format(new Date(email.receivedDate), 'MMM dd')}
                  </span>
                </div>
                <div className="email-subject">{email.subject}</div>
                <div className="email-summary">{email.executiveSummary}</div>
                {email.priority === 'Critical' && (
                  <div className="email-critical">REQUIRES IMMEDIATE ATTENTION</div>
                )}
              </div>
            ))}
          </div>
        </div>
        
        {selectedEmail && (
          <div className="fire-section email-detail">
            <h3>Email Details</h3>
            <button 
              className="btn-text" 
              onClick={() => setSelectedEmail(null)}
              style={{ float: 'right', marginTop: '-30px' }}
            >
              Close ×
            </button>
            <div className="detail-content">
              <h4>{selectedEmail.subject}</h4>
              <p><strong>From:</strong> {selectedEmail.sender}</p>
              <p><strong>Date:</strong> {format(new Date(selectedEmail.receivedDate), 'MMMM dd, yyyy')}</p>
              <p><strong>Priority:</strong> {selectedEmail.priority}</p>
              
              <div className="detail-section">
                <h5>Detailed Summary</h5>
                <p style={{ whiteSpace: 'pre-wrap' }}>{selectedEmail.detailedSummary}</p>
              </div>
              
              {selectedEmail.actionItems?.length > 0 && (
                <div className="detail-section">
                  <h5>Action Items</h5>
                  <ul>
                    {selectedEmail.actionItems.map((item, i) => (
                      <li key={i}>{item}</li>
                    ))}
                  </ul>
                </div>
              )}
              
              {selectedEmail.deadlines?.length > 0 && (
                <div className="detail-section">
                  <h5>Deadlines</h5>
                  <ul>
                    {selectedEmail.deadlines.map((deadline, i) => (
                      <li key={i}>
                        <strong>{deadline.date}</strong>: {deadline.description}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              
              <a href={selectedEmail.fullBodyUrl} target="_blank" rel="noopener noreferrer">
                View original in Gmail →
              </a>
            </div>
          </div>
        )}
      </div>
      
      {showImportModal && (
        <div className="modal-overlay" onClick={() => setShowImportModal(false)}>
          <div className="modal large" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Import Email Summary</h3>
              <button className="btn-icon" onClick={() => setShowImportModal(false)}>×</button>
            </div>
            <div className="modal-body">
              <p>Paste the JSON attachment content from your fire litigation email here:</p>
              <textarea
                value={importData}
                onChange={(e) => setImportData(e.target.value)}
                placeholder='Paste the JSON data here...'
                rows="15"
                style={{ width: '100%', fontFamily: 'monospace', fontSize: '12px' }}
              />
            </div>
            <div className="modal-footer">
              <button className="btn-secondary" onClick={() => setShowImportModal(false)}>
                Cancel
              </button>
              <button className="btn-primary" onClick={handleImportEmails}>
                Import Emails
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FireLitigation;
