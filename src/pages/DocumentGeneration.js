import React, { useState, useEffect } from 'react';
import { useData } from '../context/DataContext';
import { FileText, Search, Filter, Download, Clock, CheckCircle, AlertCircle, Loader, ChevronDown, ChevronRight } from 'lucide-react';
import documentService from '../services/DocumentAutomationService';
import toast from 'react-hot-toast';

const DocumentGeneration = () => {
  const { clients } = useData();
  const [selectedClient, setSelectedClient] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [expandedSections, setExpandedSections] = useState({});
  const [generating, setGenerating] = useState({});
  const [batchGenerating, setBatchGenerating] = useState(false);
  const [documentHistory, setDocumentHistory] = useState([]);
  const [selectedStage, setSelectedStage] = useState('');

  // Filter clients based on search and category
  const filteredClients = clients.filter(client => {
    const matchesSearch = client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          client.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          client.caseNumber?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = filterCategory === 'all' || client.category === filterCategory;
    
    // Only show clients with supported categories for document generation
    const supportedCategories = ['probate', 'conservatorship', 'guardianship', 'estate-planning'];
    const hasSupport = supportedCategories.includes(client.category);
    
    return matchesSearch && matchesCategory && hasSupport;
  });

  // Get practice area for client
  const getPracticeArea = (client) => {
    const mapping = {
      'estate-planning': 'trust',
      'probate': 'probate',
      'conservatorship': 'conservatorship',
      'guardianship': 'guardianship'
    };
    return mapping[client.category];
  };

  // Get available forms for practice area
  const getAvailableForms = (practiceArea) => {
    return documentService.getAvailableForms(practiceArea);
  };

  // Toggle section expansion
  const toggleSection = (clientId, section) => {
    setExpandedSections(prev => ({
      ...prev,
      [`${clientId}-${section}`]: !prev[`${clientId}-${section}`]
    }));
  };

  // Generate single document
  const handleGenerateDocument = async (client, formCode, formName) => {
    const practiceArea = getPracticeArea(client);
    const key = `${client.id}-${formCode}`;
    
    setGenerating(prev => ({ ...prev, [key]: true }));
    
    try {
      // Prepare client data
      const clientData = {
        ...client,
        caseType: practiceArea,
        petitionerName: client.name,
        conservatorName: client.name,
        guardianName: client.name,
        trustorName: client.name
      };
      
      const result = await documentService.generateDocument(
        practiceArea,
        formCode,
        clientData
      );
      
      toast.success(`${formName} generated for ${client.name}`);
      
      // Update history
      loadDocumentHistory();
      
      if (result.documentUrl) {
        window.open(result.documentUrl, '_blank');
      }
    } catch (error) {
      toast.error(`Failed to generate ${formName}: ${error.message}`);
    } finally {
      setGenerating(prev => ({ ...prev, [key]: false }));
    }
  };

  // Generate all documents for a workflow stage
  const handleGenerateWorkflow = async (client, stage, forms) => {
    const practiceArea = getPracticeArea(client);
    const key = `${client.id}-${stage}`;
    
    setBatchGenerating(true);
    setSelectedStage(key);
    
    try {
      const clientData = {
        ...client,
        caseType: practiceArea,
        petitionerName: client.name,
        conservatorName: client.name,
        guardianName: client.name,
        trustorName: client.name
      };
      
      const { results, errors } = await documentService.generateWorkflowDocuments(
        practiceArea,
        stage,
        clientData
      );
      
      if (results.length > 0) {
        toast.success(`Generated ${results.length} documents for ${client.name}`);
      }
      
      if (errors.length > 0) {
        toast.error(`Failed to generate ${errors.length} documents`);
      }
      
      loadDocumentHistory();
    } catch (error) {
      toast.error(`Workflow generation failed: ${error.message}`);
    } finally {
      setBatchGenerating(false);
      setSelectedStage('');
    }
  };

  // Load document history
  const loadDocumentHistory = () => {
    const allHistory = [];
    clients.forEach(client => {
      const clientHistory = documentService.getClientDocumentHistory(client.id);
      allHistory.push(...clientHistory.map(doc => ({ ...doc, clientName: client.name })));
    });
    setDocumentHistory(allHistory.sort((a, b) => new Date(b.generatedAt) - new Date(a.generatedAt)));
  };

  useEffect(() => {
    loadDocumentHistory();
  }, [clients]);

  const categories = {
    'all': 'All Categories',
    'estate-planning': 'Estate Planning',
    'probate': 'Probate',
    'conservatorship': 'Conservatorship',
    'guardianship': 'Guardianship'
  };

  return (
    <div className="document-generation-page">
      <div className="page-header">
        <div>
          <h1>Document Generation</h1>
          <p>Generate court documents for your clients</p>
        </div>
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
            {Object.entries(categories).map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
        </div>

        <div className="stats-info">
          {filteredClients.length} eligible clients • {documentHistory.length} documents generated
        </div>
      </div>

      {filteredClients.length === 0 ? (
        <div className="empty-state">
          <FileText size={48} />
          <p>No clients found with document generation support</p>
          <span className="empty-state-hint">
            Document generation is available for Probate, Conservatorship, Guardianship, and Estate Planning clients
          </span>
        </div>
      ) : (
        <div className="clients-documents-list">
          {filteredClients.map(client => {
            const practiceArea = getPracticeArea(client);
            const availableForms = getAvailableForms(practiceArea);
            
            return (
              <div key={client.id} className="client-document-card">
                <div className="client-document-header">
                  <div className="client-info">
                    <div className="client-avatar">
                      {client.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="client-details">
                      <h3>{client.name}</h3>
                      <div className="client-meta">
                        <span className={`category-badge ${client.category}`}>
                          {categories[client.category]}
                        </span>
                        {client.caseNumber && (
                          <span className="case-number">#{client.caseNumber}</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="workflow-stages">
                  {Object.entries(availableForms).map(([stage, forms]) => {
                    const isExpanded = expandedSections[`${client.id}-${stage}`];
                    const stageKey = `${client.id}-${stage}`;
                    
                    return (
                      <div key={stage} className="workflow-stage">
                        <button
                          onClick={() => toggleSection(client.id, stage)}
                          className="stage-header"
                        >
                          <div className="stage-header-left">
                            {isExpanded ? (
                              <ChevronDown className="stage-chevron" size={16} />
                            ) : (
                              <ChevronRight className="stage-chevron" size={16} />
                            )}
                            <span className="stage-name">
                              {stage.replace(/([A-Z])/g, ' $1').trim()}
                            </span>
                            <span className="stage-count">({forms.length} forms)</span>
                          </div>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleGenerateWorkflow(client, stage, forms);
                            }}
                            disabled={batchGenerating && selectedStage === stageKey}
                            className="generate-all-btn"
                          >
                            {batchGenerating && selectedStage === stageKey ? (
                              <>
                                <Loader className="loading-spinner" size={14} />
                                Generating...
                              </>
                            ) : (
                              'Generate All'
                            )}
                          </button>
                        </button>

                        {isExpanded && (
                          <div className="stage-forms">
                            <div className="stage-forms-grid">
                              {forms.map(form => {
                                const formKey = `${client.id}-${form.code}`;
                                const isGenerating = generating[formKey];
                                const wasGenerated = documentHistory.some(
                                  doc => doc.clientId === client.id && doc.formCode === form.code
                                );
                                
                                return (
                                  <div key={form.code} className="form-generation-item">
                                    <div className="form-generation-info">
                                      {wasGenerated ? (
                                        <CheckCircle className="form-status-icon generated" size={18} />
                                      ) : (
                                        <FileText className="form-status-icon" size={18} />
                                      )}
                                      <div className="form-generation-details">
                                        <span className="form-code">{form.code}</span>
                                        <span className="form-name">{form.name}</span>
                                      </div>
                                    </div>
                                    <button
                                      onClick={() => handleGenerateDocument(client, form.code, form.name)}
                                      disabled={isGenerating}
                                      className={`generate-btn ${wasGenerated ? 'regenerate' : 'primary'}`}
                                    >
                                      {isGenerating ? (
                                        <>
                                          <Loader className="loading-spinner" size={14} />
                                          Generating...
                                        </>
                                      ) : wasGenerated ? (
                                        'Regenerate'
                                      ) : (
                                        'Generate'
                                      )}
                                    </button>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {documentHistory.length > 0 && (
        <div className="recent-documents-section">
          <h2>Recent Documents</h2>
          <div className="recent-documents-list">
            {documentHistory.slice(0, 10).map((doc, index) => (
              <div key={index} className="recent-document-item">
                <div className="document-icon">
                  {doc.status === 'generated' ? (
                    <CheckCircle className="status-icon success" size={20} />
                  ) : (
                    <AlertCircle className="status-icon error" size={20} />
                  )}
                </div>
                <div className="document-info">
                  <strong>{doc.formCode}</strong>
                  <span className="client-name">{doc.clientName}</span>
                  <span className="document-date">
                    {new Date(doc.generatedAt).toLocaleString()}
                  </span>
                </div>
                {doc.documentUrl && (
                  <button
                    onClick={() => window.open(doc.documentUrl, '_blank')}
                    className="download-btn"
                  >
                    <Download size={16} />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default DocumentGeneration;
