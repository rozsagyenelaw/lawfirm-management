import React, { useState, useEffect } from 'react';
import { AlertTriangle, Mail, Calendar, ExternalLink, Paperclip, FolderOpen } from 'lucide-react';
import toast from 'react-hot-toast';

// Your Google Apps Script Web App URL
const FIRE_MONITOR_API = 'https://script.google.com/macros/s/AKfycbyQ3AA4Q1xtPbLu3uClpavvAxnm-s4ApdtVm5KzW1M8_F9yvWQwZwgXyNGL_zSZrVxK5Q/exec';

const FireCaseDashboard = () => {
  const [fireCases, setFireCases] = useState([]);
  const [summary, setSummary] = useState({});
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState(null);

  // Fetch fire case data with better error handling
  const fetchFireCaseData = async () => {
    try {
      setLoading(true);
      console.log('Fetching fire case data...');
      
      const response = await fetch(FIRE_MONITOR_API, {
        method: 'GET',
        mode: 'cors',
        cache: 'no-cache'
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const text = await response.text();
      console.log('Response received, length:', text.length);
      
      const data = JSON.parse(text);
      console.log('Parsed data structure:', {
        success: data.success,
        hasCases: !!data.data?.cases,
        caseCount: data.data?.cases?.length || 0
      });
      
      if (data.success && data.data) {
        const cases = data.data.cases || [];
        const summaryData = data.data.summary || {};
        
        // Sort cases by date, newest first
        const sortedCases = cases.sort((a, b) => {
          const dateA = new Date(a.receivedDate || a.timestamp);
          const dateB = new Date(b.receivedDate || b.timestamp);
          return dateB - dateA;
        });
        
        setFireCases(sortedCases);
        setSummary({
          totalProcessed: summaryData.totalProcessed || cases.length,
          eatonCases: summaryData.eatonCases || cases.filter(c => c.caseType?.includes('Eaton')).length,
          palisadesCases: summaryData.palisadesCases || cases.filter(c => c.caseType?.includes('Pacific')).length,
          newCasesDetected: summaryData.newCasesDetected || 0,
          lastCheck: summaryData.lastCheck || new Date().toISOString()
        });
        setLastUpdate(new Date());
        
        if (cases.length > 0) {
          toast.success(`Loaded ${cases.length} fire case emails`);
          console.log(`Successfully loaded ${cases.length} fire cases`);
        } else {
          console.log('No fire cases found in the data');
        }
      } else {
        console.warn('Data structure issue:', data);
        setFireCases([]);
        setSummary({});
      }
    } catch (error) {
      console.error('Error fetching fire cases:', error);
      toast.error(`Failed to load fire cases: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFireCaseData();
    // Refresh every 5 minutes
    const interval = setInterval(() => {
      fetchFireCaseData();
    }, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const formatDate = (dateString) => {
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return dateString;
      return date.toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return dateString || 'Unknown date';
    }
  };

  const getPriorityColor = (priority) => {
    const colors = {
      'critical': '#dc3545',
      'high': '#ff6b6b',
      'medium': '#ffc107',
      'low': '#28a745'
    };
    return colors[priority?.toLowerCase()] || '#6c757d';
  };

  return (
    <div className="fire-case-dashboard" style={{ 
      backgroundColor: '#f8f9fa', 
      padding: '20px', 
      borderRadius: '8px',
      marginBottom: '20px' 
    }}>
      {/* Header */}
      <div className="dashboard-header" style={{ marginBottom: '20px' }}>
        <h2 style={{ 
          display: 'flex', 
          alignItems: 'center', 
          fontSize: '24px',
          fontWeight: 'bold',
          color: '#333'
        }}>
          <AlertTriangle style={{ marginRight: '10px', color: '#ff5722' }} size={24} />
          Fire Case Email Monitor - AI Enhanced
        </h2>
        <p style={{ color: '#666', marginTop: '5px' }}>
          Automatically detected and AI-analyzed emails for Eaton and Pacific Palisades fire cases
        </p>
      </div>

      {/* Summary Cards */}
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
            {fireCases.length}
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
            {fireCases.filter(c => c.caseType?.includes('Eaton')).length}
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
            {fireCases.filter(c => c.caseType?.includes('Pacific')).length}
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

      {/* Controls */}
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

      {/* Main Table */}
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
                  <th style={{ padding: '12px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#666' }}>FILES</th>
                  <th style={{ padding: '12px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#666' }}>ACTIONS</th>
                </tr>
              </thead>
              <tbody>
                {fireCases.map((fireCase) => (
                  <React.Fragment key={fireCase.id}>
                    <tr style={{ borderBottom: '1px solid #f0f0f0' }}>
                      <td style={{ padding: '12px', fontSize: '14px' }}>
                        {formatDate(fireCase.receivedDate || fireCase.timestamp)}
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
                        <div>
                          {fireCase.from?.split('<')[0].trim() || 'Unknown'}
                        </div>
                      </td>
                      <td style={{ padding: '12px', fontSize: '14px', fontWeight: '500' }}>
                        {fireCase.emailSubject}
                      </td>
                      <td style={{ padding: '12px' }}>
                        <span style={{
                          padding: '4px 8px',
                          borderRadius: '4px',
                          fontSize: '12px',
                          fontWeight: '600',
                          backgroundColor: `${getPriorityColor(fireCase.priority)}20`,
                          color: getPriorityColor(fireCase.priority)
                        }}>
                          {(fireCase.priority || 'normal').toUpperCase()}
                        </span>
                      </td>
                      <td style={{ padding: '12px' }}>
                        {fireCase.attachmentCount > 0 && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                            <Paperclip size={16} />
                            <span style={{ fontSize: '14px' }}>{fireCase.attachmentCount}</span>
                          </div>
                        )}
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
                          {fireCase.documentFolderUrl && (
                            <a
                              href={fireCase.documentFolderUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              style={{ color: '#34a853' }}
                              title="Open Drive Folder"
                            >
                              <FolderOpen size={18} />
                            </a>
                          )}
                        </div>
                      </td>
                    </tr>
                    {/* Detailed AI Analysis Row */}
                    <tr>
                      <td colSpan="7" style={{ 
                        padding: '15px', 
                        backgroundColor: '#f8f9fa',
                        borderBottom: '3px solid #dee2e6'
                      }}>
                        <div style={{ maxWidth: '900px' }}>
                          {/* Detailed Summary */}
                          <div style={{ marginBottom: '10px' }}>
                            <strong style={{ color: '#333' }}>📝 Detailed Summary:</strong>
                            <div style={{ 
                              fontSize: '14px', 
                              color: '#555', 
                              marginTop: '5px',
                              padding: '10px',
                              backgroundColor: 'white',
                              borderRadius: '4px',
                              lineHeight: '1.6'
                            }}>
                              {fireCase.detailedSummary || fireCase.executiveSummary || 'AI analysis pending...'}
                            </div>
                          </div>

                          {/* Action Items */}
                          {fireCase.actionItems && fireCase.actionItems.length > 0 && (
                            <div style={{ marginBottom: '10px' }}>
                              <strong style={{ color: '#dc3545' }}>⚡ Action Items:</strong>
                              <ul style={{ margin: '5px 0 0 20px', color: '#dc3545', fontSize: '14px' }}>
                                {fireCase.actionItems.map((item, idx) => (
                                  <li key={idx}>{item}</li>
                                ))}
                              </ul>
                            </div>
                          )}

                          {/* Deadlines */}
                          {fireCase.deadlines && fireCase.deadlines.length > 0 && (
                            <div style={{ marginBottom: '10px' }}>
                              <strong style={{ color: '#ff6b6b' }}>📅 Deadlines:</strong>
                              <ul style={{ margin: '5px 0 0 20px', color: '#ff6b6b', fontSize: '14px' }}>
                                {fireCase.deadlines.map((deadline, idx) => (
                                  <li key={idx}>
                                    <strong>{deadline.date}:</strong> {deadline.description}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}

                          {/* Legal Significance */}
                          {fireCase.legalSignificance && (
                            <div style={{ marginBottom: '10px' }}>
                              <strong style={{ color: '#333' }}>⚖️ Legal Significance:</strong>
                              <div style={{ fontSize: '14px', color: '#555', marginTop: '5px' }}>
                                {fireCase.legalSignificance}
                              </div>
                            </div>
                          )}

                          {/* Key Parties */}
                          {fireCase.keyParties && fireCase.keyParties.length > 0 && (
                            <div style={{ marginBottom: '10px' }}>
                              <strong style={{ color: '#333' }}>👥 Key Parties:</strong>
                              <div style={{ fontSize: '14px', color: '#555', marginTop: '5px' }}>
                                {fireCase.keyParties.join(', ')}
                              </div>
                            </div>
                          )}

                          {/* Next Steps */}
                          {fireCase.nextSteps && fireCase.nextSteps.length > 0 && (
                            <div style={{ marginBottom: '10px' }}>
                              <strong style={{ color: '#4285f4' }}>➡️ Recommended Next Steps:</strong>
                              <ul style={{ margin: '5px 0 0 20px', color: '#4285f4', fontSize: '14px' }}>
                                {fireCase.nextSteps.map((step, idx) => (
                                  <li key={idx}>{step}</li>
                                ))}
                              </ul>
                            </div>
                          )}

                          {/* Evidence Value */}
                          {fireCase.evidenceValue && (
                            <div style={{ marginBottom: '10px' }}>
                              <strong style={{ color: '#333' }}>📊 Evidence Value:</strong>
                              <div style={{ fontSize: '14px', color: '#555', marginTop: '5px' }}>
                                {fireCase.evidenceValue}
                              </div>
                            </div>
                          )}

                          {/* Client Impact */}
                          {fireCase.clientImpact && (
                            <div style={{ marginBottom: '10px' }}>
                              <strong style={{ color: '#333' }}>👤 Client Impact:</strong>
                              <div style={{ fontSize: '14px', color: '#555', marginTop: '5px' }}>
                                {fireCase.clientImpact}
                              </div>
                            </div>
                          )}

                          {/* Attachments */}
                          {fireCase.attachmentDriveLinks && fireCase.attachmentDriveLinks.length > 0 && (
                            <div>
                              <strong style={{ color: '#333' }}>📎 Documents in Drive:</strong>
                              <div style={{ fontSize: '14px', marginTop: '5px' }}>
                                {fireCase.attachmentDriveLinks.map((att, idx) => (
                                  <a 
                                    key={idx}
                                    href={att.driveUrl} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    style={{ color: '#4285f4', marginRight: '15px', textDecoration: 'none' }}
                                  >
                                    {att.name} ({att.size})
                                  </a>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Document Folder */}
                          {fireCase.documentFolderUrl && (
                            <div style={{ marginTop: '10px' }}>
                              <a 
                                href={fireCase.documentFolderUrl} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                style={{ 
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '5px',
                                  padding: '8px 12px',
                                  backgroundColor: '#34a853',
                                  color: 'white',
                                  textDecoration: 'none',
                                  borderRadius: '4px',
                                  fontSize: '14px',
                                  fontWeight: '500'
                                }}
                              >
                                <FolderOpen size={16} />
                                Open Document Folder
                              </a>
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

// Real-time notification handler
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
            
            // Show notification for the most recent case
            const latestCase = recentCases[0];
            toast.custom((t) => (
              <div style={{
                backgroundColor: latestCase.priority === 'critical' ? '#ffebee' : '#fff3cd',
                border: `1px solid ${latestCase.priority === 'critical' ? '#f44336' : '#ffc107'}`,
                borderRadius: '4px',
                padding: '12px',
                display: 'flex',
                alignItems: 'center',
                maxWidth: '400px'
              }}>
                <AlertTriangle style={{ marginRight: '10px', color: '#ff5722' }} />
                <div>
                  <div style={{ fontWeight: 'bold' }}>New Fire Case Email</div>
                  <div style={{ fontSize: '14px', marginTop: '2px' }}>
                    {latestCase.caseType}: {latestCase.emailSubject}
                  </div>
                  {latestCase.priority === 'critical' && (
                    <div style={{ fontSize: '12px', color: '#f44336', marginTop: '2px' }}>
                      CRITICAL PRIORITY - Immediate action required
                    </div>
                  )}
                </div>
              </div>
            ), {
              duration: 5000,
            });
          }
        }
      } catch (error) {
        console.error('Error checking for new cases:', error);
      }
    };

    // Initial check
    checkForNewCases();
    
    // Check every 5 minutes
    const interval = setInterval(checkForNewCases, 5 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, [onNewCase]);

  return null;
};

export { FireCaseDashboard, FireCaseEmailHandler };
