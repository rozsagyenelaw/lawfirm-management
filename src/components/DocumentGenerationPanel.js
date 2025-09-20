import React, { useState, useEffect } from 'react';
import { FileText, Download, Clock, CheckCircle, AlertCircle, Loader, ChevronDown, ChevronRight } from 'lucide-react';
import documentService from '../services/DocumentAutomationService';
import toast from 'react-hot-toast';
import GuardianshipDataForm from './GuardianshipDataForm';
import ConservatorshipDataForm from './ConservatorshipDataForm';

const DocumentGenerationPanel = ({ client }) => {
  const [generating, setGenerating] = useState({});
  const [documentHistory, setDocumentHistory] = useState([]);
  const [expandedSections, setExpandedSections] = useState({});
  const [selectedStage, setSelectedStage] = useState('');
  const [batchGenerating, setBatchGenerating] = useState(false);
  const [showDataForm, setShowDataForm] = useState(false);
  const [formData, setFormData] = useState(null);
  const [dataFormType, setDataFormType] = useState('');

  // Load document history and saved form data on component mount
  useEffect(() => {
    if (client?.id) {
      const history = documentService.getClientDocumentHistory(client.id);
      setDocumentHistory(history);
      
      // Load saved form data for guardianship/conservatorship
      const practiceArea = getPracticeArea();
      if (practiceArea === 'guardianship' || practiceArea === 'conservatorship') {
        const savedData = localStorage.getItem(`${practiceArea}_${client.id}_data`);
        if (savedData) {
          setFormData(JSON.parse(savedData));
        }
      }
    }
  }, [client]);

  // Determine practice area based on client case type
  const getPracticeArea = () => {
    const caseType = client?.caseType?.toLowerCase() || '';
    if (caseType.includes('probate')) return 'probate';
    if (caseType.includes('conservator')) return 'conservatorship';
    if (caseType.includes('guardian')) return 'guardianship';
    if (caseType.includes('trust')) return 'trust';
    return null;
  };

  // Get available forms for the client's practice area
  const getAvailableForms = () => {
    const practiceArea = getPracticeArea();
    if (!practiceArea) return {};
    
    // Add guardianship and conservatorship forms
    if (practiceArea === 'guardianship') {
      return {
        initialFiling: [
          { code: 'gc210', name: 'Petition for Appointment of Guardian' },
          { code: 'gc212', name: 'Confidential Guardian Screening Form' }
        ],
        afterHearing: [
          { code: 'gc240', name: 'Order Appointing Guardian of Minor' },
          { code: 'gc250', name: 'Letters of Guardianship' }
        ]
      };
    }
    
    if (practiceArea === 'conservatorship') {
      return {
        initialFiling: [
          { code: 'gc310', name: 'Petition for Appointment of Conservator' },
          { code: 'gc312', name: 'Confidential Supplemental Information' },
          { code: 'gc320', name: 'Citation for Conservatorship' }
        ],
        afterHearing: [
          { code: 'gc340', name: 'Order Appointing Conservator' },
          { code: 'gc350', name: 'Letters of Conservatorship' }
        ]
      };
    }
    
    return documentService.getAvailableForms(practiceArea);
  };

  // Save form data for guardianship/conservatorship
  const handleSaveFormData = (data) => {
    setFormData(data);
    setShowDataForm(false);
    const practiceArea = getPracticeArea();
    
    // Save to local storage
    localStorage.setItem(`${practiceArea}_${client.id}_data`, JSON.stringify(data));
    
    // Add client info to the form data
    const enrichedData = {
      ...data,
      clientInfo: {
        ...data.clientInfo,
        id: client.id,
        name: data.clientInfo?.name || client.name,
        caseNumber: data.clientInfo?.caseNumber || client.caseNumber
      }
    };
    
    setFormData(enrichedData);
    toast.success('Case information saved successfully!');
  };

  // Check if form data is required and available
  const isFormDataRequired = () => {
    const practiceArea = getPracticeArea();
    return practiceArea === 'guardianship' || practiceArea === 'conservatorship';
  };

  // Generate a single document
  const handleGenerateDocument = async (formCode, formName) => {
    const practiceArea = getPracticeArea();
    if (!practiceArea) {
      toast.error('Unable to determine practice area for this client');
      return;
    }

    // Check if form data is needed for guardianship/conservatorship
    if (isFormDataRequired() && !formData) {
      toast.error('Please fill out the case information first');
      setDataFormType(practiceArea);
      setShowDataForm(true);
      return;
    }

    setGenerating(prev => ({ ...prev, [formCode]: true }));
    
    try {
      let result;
      
      if (practiceArea === 'guardianship') {
        result = await documentService.generateGuardianshipForm(formCode, formData);
      } else if (practiceArea === 'conservatorship') {
        result = await documentService.generateConservatorshipForm(formCode, formData);
      } else {
        result = await documentService.generateDocument(
          practiceArea, 
          formCode, 
          client
        );
      }
      
      if (result.success) {
        toast.success(`${formName} generated successfully!`);
        
        // Update document history
        const newDoc = {
          formCode,
          formName,
          status: 'generated',
          generatedAt: new Date().toISOString(),
          documentUrl: result.documentUrl,
          documentId: result.documentId
        };
        
        setDocumentHistory(prev => [newDoc, ...prev]);
        
        // Save to service
        documentService.saveDocumentToHistory(client.id, newDoc);
        
        // Open document in new tab if URL is provided
        if (result.documentUrl) {
          // Create download link for base64 data URL
          const link = document.createElement('a');
          link.href = result.documentUrl;
          link.download = `${formCode}-${Date.now()}.pdf`;
          link.click();
        }
      } else {
        throw new Error(result.message || 'Document generation failed');
      }
    } catch (error) {
      toast.error(`Failed to generate ${formName}: ${error.message}`);
      console.error('Document generation error:', error);
    } finally {
      setGenerating(prev => ({ ...prev, [formCode]: false }));
    }
  };

  // Generate all documents for a workflow stage
  const handleGenerateWorkflow = async (stage) => {
    const practiceArea = getPracticeArea();
    if (!practiceArea) {
      toast.error('Unable to determine practice area for this client');
      return;
    }

    // Check if form data is needed for guardianship/conservatorship
    if (isFormDataRequired() && !formData) {
      toast.error('Please fill out the case information first');
      setDataFormType(practiceArea);
      setShowDataForm(true);
      return;
    }

    setBatchGenerating(true);
    setSelectedStage(stage);
    
    try {
      const availableForms = getAvailableForms();
      const stageForms = availableForms[stage] || [];
      const results = [];
      const errors = [];

      for (const form of stageForms) {
        try {
          let result;
          
          if (practiceArea === 'guardianship') {
            result = await documentService.generateGuardianshipForm(form.code, formData);
          } else if (practiceArea === 'conservatorship') {
            result = await documentService.generateConservatorshipForm(form.code, formData);
          } else {
            result = await documentService.generateDocument(
              practiceArea,
              form.code,
              client
            );
          }
          
          if (result.success) {
            results.push({
              formCode: form.code,
              formName: form.name,
              documentId: result.documentId,
              documentUrl: result.documentUrl
            });
            
            // Update history
            const newDoc = {
              formCode: form.code,
              formName: form.name,
              status: 'generated',
              generatedAt: new Date().toISOString(),
              documentUrl: result.documentUrl,
              documentId: result.documentId
            };
            
            documentService.saveDocumentToHistory(client.id, newDoc);
          } else {
            errors.push({
              formCode: form.code,
              formName: form.name,
              error: result.message || 'Generation failed'
            });
          }
        } catch (error) {
          errors.push({
            formCode: form.code,
            formName: form.name,
            error: error.message
          });
        }
      }
      
      if (results.length > 0) {
        toast.success(`Generated ${results.length} documents successfully!`);
        
        // Refresh document history
        const history = documentService.getClientDocumentHistory(client.id);
        setDocumentHistory(history);
      }
      
      if (errors.length > 0) {
        toast.error(`Failed to generate ${errors.length} documents`);
        console.error('Document generation errors:', errors);
      }
    } catch (error) {
      toast.error(`Workflow generation failed: ${error.message}`);
    } finally {
      setBatchGenerating(false);
      setSelectedStage('');
    }
  };

  // Toggle section expansion
  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  // Get status icon for document
  const getStatusIcon = (status) => {
    switch (status) {
      case 'generated':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'generating':
        return <Loader className="w-4 h-4 text-blue-500 animate-spin" />;
      case 'error':
        return <AlertCircle className="w-4 h-4 text-red-500" />;
      default:
        return <Clock className="w-4 h-4 text-gray-400" />;
    }
  };

  // Format date for display
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const availableForms = getAvailableForms();
  const practiceArea = getPracticeArea();

  if (!practiceArea) {
    return (
      <div className="document-panel">
        <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
          <p className="text-sm text-yellow-800">
            Document generation is not available for this client type.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="document-panel bg-white rounded-lg shadow-sm border border-gray-200">
      <div className="p-6">
        <div className="flex justify-between items-start mb-6">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Document Generation
            </h3>
            <p className="text-sm text-gray-600 mt-1">
              Generate court documents for {client.name}
            </p>
          </div>
          <span className="px-3 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded-full">
            {practiceArea.charAt(0).toUpperCase() + practiceArea.slice(1)}
          </span>
        </div>

        {/* Case Information Form Button for Guardianship/Conservatorship */}
        {isFormDataRequired() && (
          <div className="mb-6">
            <button
              onClick={() => {
                setDataFormType(practiceArea);
                setShowDataForm(!showDataForm);
              }}
              className="w-full px-4 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2"
            >
              <FileText className="w-4 h-4" />
              {formData ? 'Edit Case Information' : 'Enter Case Information'}
            </button>
            
            {!formData && (
              <p className="text-sm text-amber-600 mt-2 text-center">
                ⚠️ Case information must be entered before generating documents
              </p>
            )}
          </div>
        )}

        {/* Data Form */}
        {showDataForm && isFormDataRequired() && (
          <div className="mb-6 p-4 border border-gray-200 rounded-lg bg-gray-50">
            {practiceArea === 'guardianship' && (
              <GuardianshipDataForm
                onSubmit={handleSaveFormData}
                initialData={formData}
                client={client}
              />
            )}
            {practiceArea === 'conservatorship' && (
              <ConservatorshipDataForm
                onSubmit={handleSaveFormData}
                initialData={formData}
                client={client}
              />
            )}
          </div>
        )}

        {/* Workflow Stages */}
        {(!isFormDataRequired() || formData) && (
          <div className="space-y-4">
            {Object.entries(availableForms).map(([stage, forms]) => (
              <div key={stage} className="border border-gray-200 rounded-lg">
                <button
                  onClick={() => toggleSection(stage)}
                  className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    {expandedSections[stage] ? (
                      <ChevronDown className="w-4 h-4 text-gray-500" />
                    ) : (
                      <ChevronRight className="w-4 h-4 text-gray-500" />
                    )}
                    <span className="font-medium text-gray-900">
                      {stage.charAt(0).toUpperCase() + stage.slice(1).replace(/([A-Z])/g, ' $1')}
                    </span>
                    <span className="text-sm text-gray-500">
                      ({forms.length} forms)
                    </span>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleGenerateWorkflow(stage);
                    }}
                    disabled={batchGenerating && selectedStage === stage}
                    className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {batchGenerating && selectedStage === stage ? (
                      <span className="flex items-center gap-2">
                        <Loader className="w-3 h-3 animate-spin" />
                        Generating...
                      </span>
                    ) : (
                      'Generate All'
                    )}
                  </button>
                </button>

                {expandedSections[stage] && (
                  <div className="border-t border-gray-200 p-4 bg-gray-50">
                    <div className="grid gap-3">
                      {forms.map((form) => {
                        const isGenerating = generating[form.code];
                        const wasGenerated = documentHistory.some(
                          doc => doc.formCode === form.code
                        );

                        return (
                          <div
                            key={form.code}
                            className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200"
                          >
                            <div className="flex items-center gap-3">
                              {wasGenerated ? (
                                <CheckCircle className="w-4 h-4 text-green-500" />
                              ) : (
                                <FileText className="w-4 h-4 text-gray-400" />
                              )}
                              <div>
                                <span className="font-medium text-gray-900">
                                  {form.code.toUpperCase()}
                                </span>
                                <span className="text-gray-600 ml-2">
                                  {form.name}
                                </span>
                              </div>
                            </div>
                            <button
                              onClick={() => handleGenerateDocument(form.code, form.name)}
                              disabled={isGenerating}
                              className={`px-4 py-2 text-sm rounded-lg font-medium transition-colors ${
                                wasGenerated
                                  ? 'bg-green-100 text-green-700 hover:bg-green-200'
                                  : 'bg-blue-600 text-white hover:bg-blue-700'
                              } disabled:opacity-50 disabled:cursor-not-allowed`}
                            >
                              {isGenerating ? (
                                <span className="flex items-center gap-2">
                                  <Loader className="w-3 h-3 animate-spin" />
                                  Generating...
                                </span>
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
            ))}
          </div>
        )}

        {/* Document History */}
        {documentHistory.length > 0 && (
          <div className="mt-8">
            <h4 className="text-sm font-medium text-gray-900 mb-4">
              Recent Documents
            </h4>
            <div className="space-y-2">
              {documentHistory.slice(0, 5).map((doc, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    {getStatusIcon(doc.status)}
                    <div>
                      <span className="font-medium text-gray-900">
                        {doc.formCode.toUpperCase()}
                      </span>
                      <span className="text-sm text-gray-600 ml-2">
                        {formatDate(doc.generatedAt)}
                      </span>
                    </div>
                  </div>
                  {doc.documentUrl && (
                    
                      <a href={doc.documentUrl}
                      download={`${doc.formCode}-${doc.documentId}.pdf`}
                      className="text-blue-600 hover:text-blue-700"
                      title="Download Document"
                    >
                      <Download className="w-4 h-4" />
                    </a>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DocumentGenerationPanel;
