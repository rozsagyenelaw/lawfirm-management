// ============================================
// REACT INTEGRATION FOR FIRE CASE MONITOR
// ============================================
// This fetches fire case data from your Google Apps Script

import React, { useState, useEffect } from 'react';
import { AlertTriangle, Mail, Calendar, ExternalLink } from 'lucide-react';
import toast from 'react-hot-toast';

// Your Google Apps Script Web App URL
const FIRE_MONITOR_API = 'https://script.google.com/macros/s/AKfycbwLQSSa9jyxy7oHqeHWMzLIWQP_aG4_PzXdJAYRAxDKlw0SJw6XjOw_jdWHa7EEGdwC2w/exec';

// Fire Case Dashboard Component
const FireCaseDashboard = () => {
  const [fireCases, setFireCases] = useState([]);
  const [summary, setSummary] = useState({});
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState(null);

  // Fetch fire case data from Google Apps Script
  const fetchFireCaseData = async () => {
    try {
      setLoading(true);
      
      const response = await fetch(FIRE_MONITOR_API, {
        method: 'GET',
        mode: 'cors',
      });
      
      const data = await response.json();
      
      if (data.success) {
        setFireCases(data.data.cases || []);
        setSummary(data.data.summary || {});
        setLastUpdate(new Date());
        toast.success('Fire case data updated');
      } else {
        toast.error('Error fetching fire case data');
      }
    } catch (error) {
      console.error('Error fetching fire cases:', error);
      toast.error('Failed to connect to fire case monitor');
    } finally {
      setLoading(false);
    }
  };

  // Auto-refresh every 5 minutes
  useEffect(() => {
    fetchFireCaseData();
    
    const interval = setInterval(() => {
      fetchFireCaseData();
    }, 5 * 60 * 1000); // 5 minutes
    
    return () => clearInterval(interval);
  }, []);

  // Format date
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString();
  };

  // Get case type color
  const getCaseTypeColor = (caseType) => {
    if (caseType === 'Eaton Fire') return 'bg-yellow-100 text-yellow-800';
    if (caseType === 'Pacific Palisades Fire') return 'bg-blue-100 text-blue-800';
    return 'bg-gray-100 text-gray-800';
  };

  // Get priority color
  const getPriorityColor = (priority) => {
    if (priority === 'high') return 'text-red-600';
    if (priority === 'medium') return 'text-yellow-600';
    return 'text-green-600';
  };

  return (
    <div className="fire-case-dashboard">
      {/* Header */}
      <div className="dashboard-header">
        <h2 className="text-2xl font-bold flex items-center">
          <AlertTriangle className="mr-2" size={24} />
          Fire Case Email Monitor
        </h2>
        <p className="text-gray-600">
          Automatically detected emails for Eaton and Pacific Palisades fire cases
        </p>
      </div>

      {/* Summary Cards */}
      <div className="summary-cards grid grid-cols-1 md:grid-cols-4 gap-4 my-6">
        <div className="summary-card bg-white p-4 rounded-lg shadow">
          <div className="text-sm text-gray-500">Total Detected</div>
          <div className="text-2xl font-bold">{summary.totalProcessed || 0}</div>
        </div>
        
        <div className="summary-card bg-white p-4 rounded-lg shadow">
          <div className="text-sm text-gray-500">Eaton Fire</div>
          <div className="text-2xl font-bold text-yellow-600">
            {summary.eatonCases || 0}
          </div>
        </div>
        
        <div className="summary-card bg-white p-4 rounded-lg shadow">
          <div className="text-sm text-gray-500">Pacific Palisades</div>
          <div className="text-2xl font-bold text-blue-600">
            {summary.palisadesCases || 0}
          </div>
        </div>
        
        <div className="summary-card bg-white p-4 rounded-lg shadow">
          <div className="text-sm text-gray-500">New Today</div>
          <div className="text-2xl font-bold text-green-600">
            {summary.newCasesDetected || 0}
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="controls flex justify-between items-center my-4">
        <div className="text-sm text-gray-500">
          {lastUpdate && `Last updated: ${lastUpdate.toLocaleTimeString()}`}
        </div>
        <button
          onClick={fetchFireCaseData}
          className="btn-refresh px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          disabled={loading}
        >
          {loading ? 'Loading...' : 'Refresh'}
        </button>
      </div>

      {/* Cases Table */}
      <div className="cases-table bg-white rounded-lg shadow overflow-hidden">
        {loading ? (
          <div className="p-8 text-center">
            <div className="spinner"></div>
            <p>Loading fire cases...</p>
          </div>
        ) : fireCases.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <Mail size={48} className="mx-auto mb-4 opacity-50" />
            <p>No fire case emails detected yet</p>
            <p className="text-sm mt-2">Emails containing "Eaton" or "Pacific Palisades" will appear here</p>
          </div>
        ) : (
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Case Type</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">From</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Subject</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Priority</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {fireCases.map((fireCase) => (
                <tr key={fireCase.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm">
                    {formatDate(fireCase.receivedDate)}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 text-xs rounded-full ${getCaseTypeColor(fireCase.caseType)}`}>
                      {fireCase.caseType}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm">
                    {fireCase.from}
                  </td>
                  <td className="px-4 py-3 text-sm font-medium">
                    {fireCase.emailSubject}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-sm font-medium ${getPriorityColor(fireCase.priority)}`}>
                      {fireCase.priority}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded">
                      {fireCase.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex space-x-2">
                      <a
                        href={fireCase.gmailLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-800"
                        title="Open in Gmail"
                      >
                        <Mail size={18} />
                      </a>
                      <button
                        onClick={() => {
                          // Add to calendar logic
                          toast.success('Added to calendar');
                        }}
                        className="text-green-600 hover:text-green-800"
                        title="Add to Calendar"
                      >
                        <Calendar size={18} />
                      </button>
                      <button
                        onClick={() => {
                          // View details logic
                          console.log('View details:', fireCase);
                        }}
                        className="text-gray-600 hover:text-gray-800"
                        title="View Details"
                      >
                        <ExternalLink size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Preview Section */}
      {fireCases.length > 0 && (
        <div className="preview-section mt-6">
          <h3 className="text-lg font-semibold mb-3">Latest Email Preview</h3>
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="mb-2">
              <strong>From:</strong> {fireCases[0]?.from}
            </div>
            <div className="mb-2">
              <strong>Subject:</strong> {fireCases[0]?.emailSubject}
            </div>
            <div className="text-sm text-gray-600 italic">
              {fireCases[0]?.bodyPreview}...
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Integration with your existing DocumentAnalyzer
const FireCaseEmailHandler = ({ onNewCase }) => {
  const [newCases, setNewCases] = useState([]);

  useEffect(() => {
    // Check for new fire case emails
    const checkForNewCases = async () => {
      try {
        const response = await fetch(FIRE_MONITOR_API);
        const data = await response.json();
        
        if (data.success && data.data.cases) {
          const recentCases = data.data.cases.filter(c => 
            new Date(c.timestamp) > new Date(Date.now() - 15 * 60 * 1000) // Last 15 minutes
          );
          
          if (recentCases.length > 0) {
            setNewCases(recentCases);
            
            // Notify parent component
            if (onNewCase) {
              recentCases.forEach(c => onNewCase(c));
            }
            
            // Show notification
            toast.custom((t) => (
              <div className="bg-red-50 border-l-4 border-red-400 p-4">
                <div className="flex">
                  <AlertTriangle className="text-red-400" />
                  <div className="ml-3">
                    <p className="text-sm font-medium text-red-800">
                      New Fire Case Email
                    </p>
                    <p className="mt-1 text-sm text-red-700">
                      {recentCases[0].caseType}: {recentCases[0].emailSubject}
                    </p>
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

    // Check immediately and then every 5 minutes
    checkForNewCases();
    const interval = setInterval(checkForNewCases, 5 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, [onNewCase]);

  return null; // This is a background component
};

export { FireCaseDashboard, FireCaseEmailHandler };
