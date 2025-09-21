import React, { useState, useEffect } from 'react';
import { AlertTriangle, Mail, Calendar, ExternalLink } from 'lucide-react';
import toast from 'react-hot-toast';

// Your Google Apps Script Web App URL
const FIRE_MONITOR_API = 'https://corsproxy.io/?https://script.google.com/macros/s/AKfycbwLQSSa9jyxy7oHqeHWMzLIWQP_aG4_PzXdJAYRAxDKlw0SJw6XjOw_jdWHa7EEGdwC2w/exec';

const FireCaseDashboard = () => {
  const [fireCases, setFireCases] = useState([]);
  const [summary, setSummary] = useState({});
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState(null);

  // Fetch fire case data
  const fetchFireCaseData = async () => {
    try {
      setLoading(true);
      console.log('Fetching fire case data...');
      
      const response = await fetch(FIRE_MONITOR_API);
      const text = await response.text();
      const data = JSON.parse(text);
      console.log('Data received:', data);
      
      if (data.success && data.data) {
        setFireCases(data.data.cases || []);
        setSummary(data.data.summary || {});
        setLastUpdate(new Date());
        
        if (data.data.cases && data.data.cases.length > 0) {
          toast.success(`Loaded ${data.data.cases.length} fire case emails`);
        }
      } else {
        console.error('Invalid data structure:', data);
        toast.error('No data available');
      }
    } catch (error) {
      console.error('Error fetching fire cases:', error);
      if (lastUpdate) {
        toast.error('Could not refresh data');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFireCaseData();
    const interval = setInterval(() => {
      fetchFireCaseData();
    }, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const formatDate = (dateString) => {
    try {
      return new Date(dateString).toLocaleString();
    } catch {
      return dateString;
    }
  };

  const getCaseTypeColor = (caseType) => {
    if (caseType?.includes('Eaton')) return 'eaton-case';
    if (caseType?.includes('Pacific') || caseType?.includes('Palisades')) return 'pacific-case';
    return 'other-case';
  };

  const getPriorityColor = (priority) => {
    if (priority === 'high') return 'priority-high';
    if (priority === 'medium') return 'priority-medium';
    return 'priority-low';
  };

  return (
    <div className="fire-case-dashboard" style={{ 
      backgroundColor: '#f8f9fa', 
      padding: '20px', 
      borderRadius: '8px',
      marginBottom: '20px' 
    }}>
      <div className="dashboard-header" style={{ marginBottom: '20px' }}>
        <h2 style={{ 
          display: 'flex', 
          alignItems: 'center', 
          fontSize: '24px',
          fontWeight: 'bold',
          color: '#333'
        }}>
          <AlertTriangle style={{ marginRight: '10px', color: '#ff5722' }} size={24} />
          Fire Case Email Monitor
        </h2>
        <p style={{ color: '#666', marginTop: '5px' }}>
          Automatically detected emails for Eaton and Pacific Palisades fire cases
        </p>
      </div>

      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '15px',
        marginBottom: '20px'
      }}>
        <div style={{ 
          backgroundColor: 'white',
          padding: '15px',
          borderRadius: '8px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
        }}>
          <div style={{ fontSize: '14px', color: '#666' }}>Total Detected</div>
          <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#333' }}>
            {summary.totalProcessed || fireCases.length || 0}
          </div>
        </div>
        
        <div style={{ 
          backgroundColor: 'white',
          padding: '15px',
          borderRadius: '8px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
        }}>
          <div style={{ fontSize: '14px', color: '#666' }}>Eaton Fire</div>
          <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#ff9800' }}>
            {fireCases.filter(c => c.caseType?.includes('Eaton')).length || 0}
          </div>
        </div>
        
        <div style={{ 
          backgroundColor: 'white',
          padding: '15px',
          borderRadius: '8px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
        }}>
          <div style={{ fontSize: '14px', color: '#666' }}>Pacific Palisades</div>
          <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#2196f3' }}>
            {fireCases.filter(c => c.caseType?.includes('Pacific')).length || 0}
          </div>
        </div>
        
        <div style={{ 
          backgroundColor: 'white',
          padding: '15px',
          borderRadius: '8px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
        }}>
          <div style={{ fontSize: '14px', color: '#666' }}>Status</div>
          <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#4caf50' }}>
            Active
          </div>
        </div>
      </div>

      <div style={{ 
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '20px'
      }}>
        <div style={{ fontSize: '14px', color: '#666' }}>
          {lastUpdate && `Last updated: ${lastUpdate.toLocaleTimeString()}`}
        </div>
        <button
          onClick={fetchFireCaseData}
          disabled={loading}
          style={{
            padding: '8px 16px',
            backgroundColor: loading ? '#ccc' : '#4285f4',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: loading ? 'not-allowed' : 'pointer'
          }}
        >
          {loading ? 'Loading...' : 'Refresh'}
        </button>
      </div>

      <div style={{ 
        backgroundColor: 'white',
        borderRadius: '8px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        overflow: 'hidden'
      }}>
        {loading && fireCases.length === 0 ? (
          <div style={{ padding: '40px', textAlign: 'center' }}>
            <p>Loading fire cases...</p>
          </div>
        ) : fireCases.length === 0 ? (
          <div style={{ padding: '40px', textAlign: 'center', color: '#666' }}>
            <Mail size={48} style={{ margin: '0 auto 10px', opacity: 0.5 }} />
            <p>No fire case emails detected yet</p>
            <p style={{ fontSize: '14px', marginTop: '10px' }}>
              Emails containing "Eaton" or "Pacific Palisades" will appear here
            </p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ backgroundColor: '#f8f9fa' }}>
                  <th style={{ padding: '12px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#666' }}>DATE</th>
                  <th style={{ padding: '12px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#666' }}>CASE TYPE</th>
                  <th style={{ padding: '12px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#666' }}>FROM</th>
                  <th style={{ padding: '12px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#666' }}>SUBJECT</th>
                  <th style={{ padding: '12px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#666' }}>PRIORITY</th>
                  <th style={{ padding: '12px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#666' }}>ACTIONS</th>
                </tr>
              </thead>
              <tbody>
                {fireCases.map((fireCase) => (
                  <tr key={fireCase.id} style={{ borderBottom: '1px solid #f0f0f0' }}>
                    <td style={{ padding: '12px', fontSize: '14px' }}>
                      {formatDate(fireCase.receivedDate)}
                    </td>
                    <td style={{ padding: '12px' }}>
                      <span style={{
                        padding: '4px 8px',
                        borderRadius: '12px',
                        fontSize: '12px',
                        backgroundColor: fireCase.caseType?.includes('Eaton') ? '#fff3cd' : '#cfe2ff',
                        color: fireCase.caseType?.includes('Eaton') ? '#856404' : '#004085'
                      }}>
                        {fireCase.caseType}
                      </span>
                    </td>
                    <td style={{ padding: '12px', fontSize: '14px' }}>
                      {fireCase.from}
                    </td>
                    <td style={{ padding: '12px', fontSize: '14px', fontWeight: '500' }}>
                      {fireCase.emailSubject}
                    </td>
                    <td style={{ padding: '12px' }}>
                      <span style={{
                        fontSize: '14px',
                        fontWeight: '500',
                        color: fireCase.priority === 'high' ? '#dc3545' : '#6c757d'
                      }}>
                        {fireCase.priority || 'normal'}
                      </span>
                    </td>
                    <td style={{ padding: '12px' }}>
                      <div style={{ display: 'flex', gap: '10px' }}>
                        <a
                          href={fireCase.gmailLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{ color: '#4285f4' }}
                          title="Open in Gmail"
                        >
                          <Mail size={18} />
                        </a>
                        <button
                          onClick={() => toast.success('Added to calendar')}
                          style={{ 
                            background: 'none',
                            border: 'none',
                            color: '#34a853',
                            cursor: 'pointer',
                            padding: 0
                          }}
                          title="Add to Calendar"
                        >
                          <Calendar size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {fireCases.length > 0 && (
        <div style={{ marginTop: '20px' }}>
          <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '10px' }}>
            Latest Email Preview
          </h3>
          <div style={{ 
            backgroundColor: 'white',
            padding: '15px',
            borderRadius: '8px',
            border: '1px solid #e0e0e0'
          }}>
            <div style={{ marginBottom: '8px' }}>
              <strong>From:</strong> {fireCases[0]?.from}
            </div>
            <div style={{ marginBottom: '8px' }}>
              <strong>Subject:</strong> {fireCases[0]?.emailSubject}
            </div>
            <div style={{ fontSize: '14px', color: '#666', fontStyle: 'italic' }}>
              {fireCases[0]?.bodyPreview}...
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const FireCaseEmailHandler = ({ onNewCase }) => {
  const [newCases, setNewCases] = useState([]);

  useEffect(() => {
    const checkForNewCases = async () => {
      try {
        const response = await fetch(FIRE_MONITOR_API);
        const data = await response.json();
        
        if (data.success && data.data.cases) {
          const recentCases = data.data.cases.filter(c => 
            new Date(c.timestamp) > new Date(Date.now() - 15 * 60 * 1000)
          );
          
          if (recentCases.length > 0) {
            setNewCases(recentCases);
            
            if (onNewCase) {
              recentCases.forEach(c => onNewCase(c));
            }
            
            toast.custom((t) => (
              <div style={{
                backgroundColor: '#fff3cd',
                border: '1px solid #ffc107',
                borderRadius: '4px',
                padding: '12px',
                display: 'flex',
                alignItems: 'center'
              }}>
                <AlertTriangle style={{ marginRight: '10px', color: '#ff5722' }} />
                <div>
                  <div style={{ fontWeight: 'bold' }}>New Fire Case Email</div>
                  <div style={{ fontSize: '14px', marginTop: '2px' }}>
                    {recentCases[0].caseType}: {recentCases[0].emailSubject}
                  </div>
                </div>
              </div>
            ));
          }
        }
      } catch (error) {
        console.error('Error checking for new cases:', error);
      }
    };

    checkForNewCases();
    const interval = setInterval(checkForNewCases, 5 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, [onNewCase]);

  return null;
};

export { FireCaseDashboard, FireCaseEmailHandler };
