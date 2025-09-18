import React, { useState } from 'react';
import { Calculator, Calendar, AlertCircle, Clock, FileText, Plus } from 'lucide-react';
import { format, addDays, subDays, isWeekend, addBusinessDays } from 'date-fns';
import { useData } from '../context/DataContext';
import toast from 'react-hot-toast';

const CourtDateCalculator = () => {
  const { addTask, addEvent } = useData();
  const [baseDate, setBaseDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [caseType, setCaseType] = useState('probate');
  const [calculatedDeadlines, setCalculatedDeadlines] = useState([]);
  const [clientId, setClientId] = useState('');

  // California court holidays 2025
  const courtHolidays = [
    '2025-01-01', // New Year's Day
    '2025-01-20', // MLK Day
    '2025-02-17', // Presidents Day
    '2025-05-26', // Memorial Day
    '2025-07-04', // Independence Day
    '2025-09-01', // Labor Day
    '2025-11-11', // Veterans Day
    '2025-11-27', // Thanksgiving
    '2025-11-28', // Day after Thanksgiving
    '2025-12-25', // Christmas
  ];

  const deadlineRules = {
    probate: {
      'File Petition': { days: 0, type: 'calendar', description: 'Initial petition filing' },
      'Notice to Heirs': { days: 15, type: 'business', description: 'Must notify all heirs and beneficiaries' },
      'Creditor Notice Publication': { days: 30, type: 'calendar', description: 'Publish notice to creditors' },
      'Inventory Due': { days: 60, type: 'calendar', description: 'File inventory and appraisal' },
      'Creditor Claim Period Ends': { days: 120, type: 'calendar', description: '4-month creditor claim period' },
      'Petition for Distribution': { days: 180, type: 'calendar', description: 'Can file for final distribution' }
    },
    conservatorship: {
      'File Petition': { days: 0, type: 'calendar', description: 'Initial petition filing' },
      'Capacity Declaration': { days: 5, type: 'business', description: 'Medical capacity declaration due' },
      'Citation Service': { days: 15, type: 'business', description: 'Serve citation on proposed conservatee' },
      'Court Investigation': { days: 30, type: 'calendar', description: 'Court investigator report' },
      'Hearing Date': { days: 45, type: 'calendar', description: 'Initial hearing' },
      'Letters Issue': { days: 50, type: 'calendar', description: 'Letters of conservatorship' },
      'Initial Inventory': { days: 90, type: 'calendar', description: 'File initial inventory' },
      'First Accounting': { days: 365, type: 'calendar', description: 'First annual accounting due' }
    },
    'trust-litigation': {
      'File Complaint': { days: 0, type: 'calendar', description: 'Initial complaint filing' },
      'Serve Defendants': { days: 60, type: 'calendar', description: 'Service deadline' },
      'Response Due': { days: 30, type: 'calendar', description: 'Response due after service' },
      'Discovery Cutoff': { days: -30, type: 'calendar', description: '30 days before trial' },
      'Expert Disclosure': { days: -90, type: 'calendar', description: '90 days before trial' },
      'Motion Cutoff': { days: -16, type: 'business', description: '16 court days before trial' }
    },
    motion: {
      'File Motion': { days: -16, type: 'business', description: 'Motion must be filed 16 court days before hearing' },
      'Serve Motion': { days: -16, type: 'business', description: 'Serve motion papers' },
      'Opposition Due': { days: -9, type: 'business', description: 'Opposition due 9 court days before' },
      'Reply Due': { days: -5, type: 'business', description: 'Reply due 5 court days before' },
      'Lodge Courtesy Copy': { days: -2, type: 'business', description: 'Lodge courtesy copy with court' },
      'Hearing Date': { days: 0, type: 'calendar', description: 'Motion hearing' }
    }
  };

  const calculateBusinessDays = (startDate, numDays) => {
    let date = new Date(startDate);
    let daysToAdd = Math.abs(numDays);
    const direction = numDays < 0 ? -1 : 1;
    let addedDays = 0;

    while (addedDays < daysToAdd) {
      date.setDate(date.getDate() + direction);
      const dateStr = format(date, 'yyyy-MM-dd');
      
      if (!isWeekend(date) && !courtHolidays.includes(dateStr)) {
        addedDays++;
      }
    }
    
    return date;
  };

  const calculateDeadlines = () => {
    const rules = deadlineRules[caseType];
    if (!rules) return;

    const base = new Date(baseDate);
    const deadlines = [];

    Object.entries(rules).forEach(([name, rule]) => {
      let calculatedDate;
      
      if (rule.type === 'business') {
        calculatedDate = calculateBusinessDays(base, rule.days);
      } else {
        calculatedDate = addDays(base, rule.days);
      }

      // Skip weekends for court deadlines
      while (isWeekend(calculatedDate)) {
        calculatedDate = addDays(calculatedDate, 1);
      }

      // Skip court holidays
      const dateStr = format(calculatedDate, 'yyyy-MM-dd');
      if (courtHolidays.includes(dateStr)) {
        calculatedDate = addDays(calculatedDate, 1);
        // Check again for weekend
        while (isWeekend(calculatedDate)) {
          calculatedDate = addDays(calculatedDate, 1);
        }
      }

      deadlines.push({
        name,
        date: calculatedDate,
        description: rule.description,
        daysFromBase: rule.days,
        type: rule.type
      });
    });

    // Sort by date
    deadlines.sort((a, b) => a.date - b.date);
    setCalculatedDeadlines(deadlines);
  };

  const addToCalendar = (deadline) => {
    addEvent({
      title: `${deadline.name} - ${caseType}`,
      start: deadline.date.toISOString(),
      end: deadline.date.toISOString(),
      type: 'court-deadline',
      description: deadline.description,
      clientId: clientId || null
    });
    
    toast.success(`Added "${deadline.name}" to calendar`);
  };

  const addAllToCalendar = () => {
    calculatedDeadlines.forEach(deadline => {
      addEvent({
        title: `${deadline.name} - ${caseType}`,
        start: deadline.date.toISOString(),
        end: deadline.date.toISOString(),
        type: 'court-deadline',
        description: deadline.description,
        clientId: clientId || null
      });
    });
    
    toast.success(`Added ${calculatedDeadlines.length} deadlines to calendar`);
  };

  const createTasks = () => {
    calculatedDeadlines.forEach(deadline => {
      addTask({
        title: deadline.name,
        description: deadline.description,
        dueDate: deadline.date.toISOString(),
        priority: 'high',
        category: caseType,
        clientId: clientId || null
      });
    });
    
    toast.success(`Created ${calculatedDeadlines.length} tasks`);
  };

  return (
    <div className="court-date-calculator">
      <div className="calculator-header">
        <h2>
          <Calculator size={24} />
          Court Date Calculator
        </h2>
        <p>Calculate all deadlines based on California court rules</p>
      </div>

      <div className="calculator-inputs">
        <div className="form-row">
          <div className="form-group">
            <label>Case Type</label>
            <select value={caseType} onChange={(e) => setCaseType(e.target.value)}>
              <option value="probate">Probate</option>
              <option value="conservatorship">Conservatorship</option>
              <option value="trust-litigation">Trust Litigation</option>
              <option value="motion">Motion Deadlines</option>
            </select>
          </div>
          
          <div className="form-group">
            <label>
              {caseType === 'motion' ? 'Hearing Date' : 
               caseType === 'trust-litigation' ? 'Trial Date' : 'Filing Date'}
            </label>
            <input
              type="date"
              value={baseDate}
              onChange={(e) => setBaseDate(e.target.value)}
            />
          </div>
        </div>

        <button className="btn-primary" onClick={calculateDeadlines}>
          <Calculator size={16} />
          Calculate Deadlines
        </button>
      </div>

      {calculatedDeadlines.length > 0 && (
        <div className="calculated-results">
          <div className="results-header">
            <h3>Calculated Deadlines</h3>
            <div className="results-actions">
              <button className="btn-secondary" onClick={addAllToCalendar}>
                <Calendar size={16} />
                Add All to Calendar
              </button>
              <button className="btn-secondary" onClick={createTasks}>
                <FileText size={16} />
                Create Tasks
              </button>
            </div>
          </div>

          <div className="deadlines-list">
            {calculatedDeadlines.map((deadline, index) => (
              <div key={index} className="deadline-item">
                <div className="deadline-date">
                  <div className="date-display">
                    {format(deadline.date, 'MMM dd')}
                  </div>
                  <div className="date-year">
                    {format(deadline.date, 'yyyy')}
                  </div>
                </div>
                
                <div className="deadline-info">
                  <h4>{deadline.name}</h4>
                  <p>{deadline.description}</p>
                  <span className="deadline-meta">
                    {deadline.type === 'business' ? 'Business days' : 'Calendar days'}
                    {deadline.daysFromBase !== 0 && (
                      <> • {Math.abs(deadline.daysFromBase)} days {deadline.daysFromBase < 0 ? 'before' : 'after'}</>
                    )}
                  </span>
                </div>
                
                <button 
                  className="btn-icon"
                  onClick={() => addToCalendar(deadline)}
                  title="Add to Calendar"
                >
                  <Plus size={16} />
                </button>
              </div>
            ))}
          </div>

          <div className="calculator-note">
            <AlertCircle size={16} />
            <p>
              Note: These calculations are based on standard California court rules. 
              Always verify deadlines with current local rules and court orders.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default CourtDateCalculator;
