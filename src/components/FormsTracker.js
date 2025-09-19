import React, { useState, useEffect } from 'react';
import { FileText, Check, Clock, AlertCircle, Calendar, Download, Plus, Edit2 } from 'lucide-react';
import { format, addDays, isPast, isWithinInterval, addYears } from 'date-fns';
import { useData } from '../context/DataContext';
import toast from 'react-hot-toast';

const FormsTracker = ({ clientId, clientName, category, caseStartDate }) => {
  const { 
    getFormsLibrary, 
    addFormFiling, 
    getClientFormFilings,
    updateFormFiling 
  } = useData();
  
  const [activeStage, setActiveStage] = useState(0);
  const [filedForms, setFiledForms] = useState({});
  const [showFilingModal, setShowFilingModal] = useState(false);
  const [selectedForm, setSelectedForm] = useState(null);
  const [filingData, setFilingData] = useState({
    filingDate: format(new Date(), 'yyyy-MM-dd'),
    courtDate: '',
    notes: '',
    numberOfChildren: 1
  });
  
  const formsLibrary = getFormsLibrary();
  const clientFilings = getClientFormFilings(clientId);
  const practiceAreaForms = formsLibrary[category];
  
  useEffect(() => {
    // Load existing filings
    const filings = {};
    clientFilings.forEach(filing => {
      filings[filing.formCode] = filing;
    });
    setFiledForms(filings);
  }, [clientFilings]);
  
  if (!practiceAreaForms) {
    return (
      <div className="forms-tracker">
        <div className="empty-state">
          <FileText size={48} />
          <p>No forms workflow available for {category}</p>
        </div>
      </div>
    );
  }
  
  const calculateDueDate = (daysFromStart) => {
    const startDate = new Date(caseStartDate || new Date());
    return addDays(startDate, daysFromStart);
  };
  
  const getStageStatus = (stage) => {
    const dueDate = calculateDueDate(stage.daysFromStart);
    const allFormsFiled = stage.forms.every(form => 
      !form.required || filedForms[form.code]?.filed
    );
    
    if (allFormsFiled) return 'completed';
    if (isPast(dueDate)) return 'overdue';
    if (isWithinInterval(new Date(), { 
      start: new Date(), 
      end: addDays(new Date(), 7) 
    })) return 'upcoming';
    return 'future';
  };
  
  const handleFilingSubmit = () => {
    if (!selectedForm) return;
    
    const filing = {
      clientId,
      clientName,
      formCode: selectedForm.code,
      formName: selectedForm.name,
      stage: practiceAreaForms.stages[activeStage].name,
      filed: true,
      filingDate: filingData.filingDate,
      courtDate: filingData.courtDate,
      notes: filingData.notes,
      numberOfChildren: selectedForm.perChild ? filingData.numberOfChildren : null
    };
    
    addFormFiling(filing);
    
    setFiledForms({
      ...filedForms,
      [selectedForm.code]: filing
    });
    
    setShowFilingModal(false);
    setFilingData({
      filingDate: format(new Date(), 'yyyy-MM-dd'),
      courtDate: '',
      notes: '',
      numberOfChildren: 1
    });
    
    toast.success(`${selectedForm.name} marked as filed`);
  };
  
  const generateCoverSheet = (stage) => {
    const forms = stage.forms.filter(form => filedForms[form.code]?.filed);
    if (forms.length === 0) {
      toast.error('No forms filed in this stage');
      return;
    }
    
    // Create cover sheet content
    let content = `SUPERIOR COURT OF CALIFORNIA\nCOUNTY OF LOS ANGELES\n\n`;
    content += `CASE: ${clientName}\n`;
    content += `CASE NUMBER: _____________\n\n`;
    content += `FORMS COVER SHEET\n`;
    content += `${stage.name}\n\n`;
    content += `The following forms are being filed:\n\n`;
    
    forms.forEach(form => {
      content += `☑ ${form.code} - ${form.name}\n`;
      if (form.perChild && filedForms[form.code]?.numberOfChildren) {
        content += `   (${filedForms[form.code].numberOfChildren} copies - one per child)\n`;
      }
    });
    
    content += `\nTotal Forms: ${forms.length}\n`;
    content += `Date: ${format(new Date(), 'MMMM dd, yyyy')}\n`;
    
    // Download as text file
    const blob = new Blob([content], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `cover-sheet-${clientName.replace(' ', '-')}-${format(new Date(), 'yyyy-MM-dd')}.txt`;
    a.click();
  };
  
  return (
    <div className="forms-tracker">
      <div className="tracker-header">
        <h3>Court Forms Tracker - {practiceAreaForms.name}</h3>
        <div className="tracker-stats">
          <span className="stat">
            <Check size={16} />
            {Object.keys(filedForms).filter(key => filedForms[key]?.filed).length} Filed
          </span>
          <span className="stat">
            <Clock size={16} />
            {practiceAreaForms.stages.reduce((total, stage) => 
              total + stage.forms.filter(f => f.required && !filedForms[f.code]?.filed).length, 0
            )} Pending
          </span>
        </div>
      </div>
      
      <div className="stages-timeline">
        {practiceAreaForms.stages.map((stage, index) => {
          const status = getStageStatus(stage);
          const dueDate = calculateDueDate(stage.daysFromStart);
          
          return (
            <div key={index} className={`stage-card ${status}`}>
              <div className="stage-header">
                <h4>{stage.name}</h4>
                <div className="stage-meta">
                  <span className={`status-badge ${status}`}>
                    {status === 'completed' && 'Completed'}
                    {status === 'overdue' && 'Overdue'}
                    {status === 'upcoming' && 'Due Soon'}
                    {status === 'future' && 'Upcoming'}
                  </span>
                  <span className="due-date">
                    <Calendar size={14} />
                    {format(dueDate, 'MMM dd, yyyy')}
                  </span>
                </div>
              </div>
              
              <div className="forms-list">
                {stage.forms.map((form, formIndex) => {
                  const isFiled = filedForms[form.code]?.filed;
                  
                  return (
                    <div key={formIndex} className={`form-item ${isFiled ? 'filed' : ''}`}>
                      <div className="form-checkbox">
                        <input
                          type="checkbox"
                          checked={isFiled}
                          onChange={() => {
                            if (!isFiled) {
                              setSelectedForm(form);
                              setActiveStage(index);
                              setShowFilingModal(true);
                            } else {
                              // Unfile the form
                              const updatedFilings = { ...filedForms };
                              delete updatedFilings[form.code];
                              setFiledForms(updatedFilings);
                              updateFormFiling(filedForms[form.code].id, { filed: false });
                            }
                          }}
                        />
                      </div>
                      <div className="form-details">
                        <span className="form-code">{form.code}</span>
                        <span className="form-name">{form.name}</span>
                        {form.required && <span className="required-badge">Required</span>}
                        {form.perChild && <span className="per-child-badge">Per Child</span>}
                        {form.conditional && <span className="conditional-badge">{form.conditional}</span>}
                        {isFiled && filedForms[form.code]?.filingDate && (
                          <span className="filed-date">
                            Filed: {format(new Date(filedForms[form.code].filingDate), 'MM/dd/yy')}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
              
              <div className="stage-actions">
                <button 
                  className="btn-text"
                  onClick={() => generateCoverSheet(stage)}
                >
                  <Download size={16} />
                  Generate Cover Sheet
                </button>
              </div>
            </div>
          );
        })}
      </div>
      
      {/* Upcoming Deadlines Alert */}
      <div className="deadlines-alert">
        <h4>Upcoming Deadlines</h4>
        {practiceAreaForms.stages.map((stage, index) => {
          const dueDate = calculateDueDate(stage.daysFromStart);
          const daysUntil = Math.ceil((dueDate - new Date()) / (1000 * 60 * 60 * 24));
          const pendingForms = stage.forms.filter(f => f.required && !filedForms[f.code]?.filed);
          
          if (daysUntil > 0 && daysUntil <= 30 && pendingForms.length > 0) {
            return (
              <div key={index} className="deadline-item">
                <AlertCircle size={16} className="alert-icon" />
                <div>
                  <strong>{stage.name}</strong> - {daysUntil} days
                  <div className="pending-forms">
                    {pendingForms.map(f => f.name).join(', ')}
                  </div>
                </div>
              </div>
            );
          }
          return null;
        })}
      </div>
      
      {/* Filing Modal */}
      {showFilingModal && selectedForm && (
        <div className="modal-overlay" onClick={() => setShowFilingModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Mark Form as Filed</h3>
              <button className="btn-icon" onClick={() => setShowFilingModal(false)}>×</button>
            </div>
            <div className="modal-body">
              <div className="form-info">
                <strong>{selectedForm.code}</strong> - {selectedForm.name}
              </div>
              
              <div className="form-group">
                <label>Filing Date</label>
                <input
                  type="date"
                  value={filingData.filingDate}
                  onChange={(e) => setFilingData({...filingData, filingDate: e.target.value})}
                />
              </div>
              
              {selectedForm.perChild && (
                <div className="form-group">
                  <label>Number of Children</label>
                  <input
                    type="number"
                    min="1"
                    value={filingData.numberOfChildren}
                    onChange={(e) => setFilingData({...filingData, numberOfChildren: parseInt(e.target.value)})}
                  />
                </div>
              )}
              
              <div className="form-group">
                <label>Court Date (if received)</label>
                <input
                  type="date"
                  value={filingData.courtDate}
                  onChange={(e) => setFilingData({...filingData, courtDate: e.target.value})}
                />
              </div>
              
              <div className="form-group">
                <label>Notes</label>
                <textarea
                  value={filingData.notes}
                  onChange={(e) => setFilingData({...filingData, notes: e.target.value})}
                  placeholder="Any additional notes..."
                  rows="3"
                />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-secondary" onClick={() => setShowFilingModal(false)}>
                Cancel
              </button>
              <button className="btn-primary" onClick={handleFilingSubmit}>
                Mark as Filed
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FormsTracker;
