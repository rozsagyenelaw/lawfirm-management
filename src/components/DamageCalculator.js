import React, { useState, useEffect } from 'react';
import { 
  Home, 
  Package, 
  DollarSign, 
  Car, 
  Trees, 
  AlertTriangle,
  Calculator,
  Save,
  Download,
  TrendingUp,
  FileText,
  AlertCircle,
  Check,
  X
} from 'lucide-react';
import { useData } from '../context/DataContext';
import toast from 'react-hot-toast';

const DamageCalculator = ({ clientId, clientName }) => {
  const { clients, updateClient } = useData();
  const client = clients.find(c => c.id === clientId);
  
  // Initialize damage data from client or defaults
  const [damages, setDamages] = useState({
    structure: client?.damageEstimates?.structure || 0,
    personalProperty: client?.damageEstimates?.personalProperty || 0,
    additionalLivingExpenses: client?.damageEstimates?.additionalLivingExpenses || 0,
    landscaping: client?.damageEstimates?.landscaping || 0,
    vehicles: client?.damageEstimates?.vehicles || 0,
    other: client?.damageEstimates?.other || 0,
    insuranceOffered: client?.damageEstimates?.insuranceOffered || 0,
    insurancePaid: client?.damageEstimates?.insurancePaid || 0,
    notes: client?.damageEstimates?.notes || ''
  });

  // Detailed breakdowns for each category
  const [structureDetails, setStructureDetails] = useState(
    client?.damageEstimates?.structureDetails || []
  );
  
  const [propertyDetails, setPropertyDetails] = useState(
    client?.damageEstimates?.propertyDetails || []
  );
  
  const [aleDetails, setAleDetails] = useState(
    client?.damageEstimates?.aleDetails || []
  );
  
  const [vehicleDetails, setVehicleDetails] = useState(
    client?.damageEstimates?.vehicleDetails || []
  );

  const [showDetails, setShowDetails] = useState(false);
  const [activeCategory, setActiveCategory] = useState('');
  const [savingStatus, setSavingStatus] = useState('saved'); // 'saved', 'saving', 'unsaved'

  // Calculate totals
  const totalClaimed = 
    parseFloat(damages.structure || 0) +
    parseFloat(damages.personalProperty || 0) +
    parseFloat(damages.additionalLivingExpenses || 0) +
    parseFloat(damages.landscaping || 0) +
    parseFloat(damages.vehicles || 0) +
    parseFloat(damages.other || 0);

  const gapAmount = totalClaimed - parseFloat(damages.insuranceOffered || 0);
  const shortfall = totalClaimed - parseFloat(damages.insurancePaid || 0);

  // Auto-save functionality
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (savingStatus === 'unsaved') {
        handleSave();
      }
    }, 2000); // Auto-save after 2 seconds of inactivity

    return () => clearTimeout(timeoutId);
  }, [damages, structureDetails, propertyDetails, aleDetails, vehicleDetails, savingStatus]);

  const handleDamageChange = (field, value) => {
    setDamages(prev => ({ ...prev, [field]: value }));
    setSavingStatus('unsaved');
  };

  const handleSave = async () => {
    setSavingStatus('saving');
    
    const damageEstimates = {
      ...damages,
      structureDetails,
      propertyDetails,
      aleDetails,
      vehicleDetails,
      totalClaimed,
      gapAmount,
      shortfall,
      lastUpdated: new Date().toISOString()
    };

    try {
      await updateClient(clientId, { damageEstimates });
      setSavingStatus('saved');
      toast.success('Damage estimates saved');
    } catch (error) {
      console.error('Error saving damage estimates:', error);
      toast.error('Error saving damage estimates');
      setSavingStatus('unsaved');
    }
  };

  const addDetailItem = (category) => {
    const newItem = {
      id: Date.now(),
      description: '',
      amount: 0,
      quantity: 1,
      unitCost: 0,
      notes: ''
    };

    switch(category) {
      case 'structure':
        setStructureDetails([...structureDetails, newItem]);
        break;
      case 'property':
        setPropertyDetails([...propertyDetails, newItem]);
        break;
      case 'ale':
        setAleDetails([...aleDetails, newItem]);
        break;
      case 'vehicle':
        setVehicleDetails([...vehicleDetails, newItem]);
        break;
      default:
        break;
    }
    setSavingStatus('unsaved');
  };

  const updateDetailItem = (category, itemId, field, value) => {
    const updateFunction = (items) => 
      items.map(item => 
        item.id === itemId 
          ? { ...item, [field]: value }
          : item
      );

    switch(category) {
      case 'structure':
        setStructureDetails(updateFunction);
        break;
      case 'property':
        setPropertyDetails(updateFunction);
        break;
      case 'ale':
        setAleDetails(updateFunction);
        break;
      case 'vehicle':
        setVehicleDetails(updateFunction);
        break;
      default:
        break;
    }
    setSavingStatus('unsaved');
  };

  const deleteDetailItem = (category, itemId) => {
    const filterFunction = (items) => items.filter(item => item.id !== itemId);

    switch(category) {
      case 'structure':
        setStructureDetails(filterFunction);
        break;
      case 'property':
        setPropertyDetails(filterFunction);
        break;
      case 'ale':
        setAleDetails(filterFunction);
        break;
      case 'vehicle':
        setVehicleDetails(filterFunction);
        break;
      default:
        break;
    }
    setSavingStatus('unsaved');
  };

  const calculateCategoryTotal = (details) => {
    return details.reduce((sum, item) => {
      const amount = item.unitCost ? 
        parseFloat(item.quantity || 1) * parseFloat(item.unitCost || 0) :
        parseFloat(item.amount || 0);
      return sum + amount;
    }, 0);
  };

  const exportReport = () => {
    const report = {
      clientName,
      date: new Date().toISOString(),
      damages: {
        structure: damages.structure,
        personalProperty: damages.personalProperty,
        additionalLivingExpenses: damages.additionalLivingExpenses,
        landscaping: damages.landscaping,
        vehicles: damages.vehicles,
        other: damages.other,
        totalClaimed,
        insuranceOffered: damages.insuranceOffered,
        insurancePaid: damages.insurancePaid,
        gapAmount,
        shortfall
      },
      details: {
        structure: structureDetails,
        property: propertyDetails,
        ale: aleDetails,
        vehicles: vehicleDetails
      },
      notes: damages.notes
    };

    const dataStr = JSON.stringify(report, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileDefaultName = `damage-estimate-${clientName.replace(/\s+/g, '-')}-${new Date().toISOString().split('T')[0]}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
    
    toast.success('Report exported');
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount || 0);
  };

  const renderDetailModal = () => {
    if (!showDetails) return null;

    let details = [];
    let categoryName = '';
    
    switch(activeCategory) {
      case 'structure':
        details = structureDetails;
        categoryName = 'Structure Damage';
        break;
      case 'property':
        details = propertyDetails;
        categoryName = 'Personal Property';
        break;
      case 'ale':
        details = aleDetails;
        categoryName = 'Additional Living Expenses';
        break;
      case 'vehicle':
        details = vehicleDetails;
        categoryName = 'Vehicles';
        break;
      default:
        break;
    }

    const categoryTotal = calculateCategoryTotal(details);

    return (
      <div className="modal-overlay" onClick={() => setShowDetails(false)}>
        <div className="modal damage-detail-modal" onClick={e => e.stopPropagation()}>
          <div className="modal-header">
            <h2>{categoryName} Details</h2>
            <button className="btn-icon" onClick={() => setShowDetails(false)}>
              <X size={20} />
            </button>
          </div>

          <div className="damage-details-content">
            <div className="detail-items-list">
              {details.map(item => (
                <div key={item.id} className="detail-item-card">
                  <div className="detail-item-row">
                    <input
                      type="text"
                      placeholder="Description"
                      value={item.description}
                      onChange={(e) => updateDetailItem(activeCategory, item.id, 'description', e.target.value)}
                      className="detail-input description"
                    />
                    <button 
                      className="btn-icon danger"
                      onClick={() => deleteDetailItem(activeCategory, item.id)}
                    >
                      <X size={16} />
                    </button>
                  </div>
                  
                  <div className="detail-item-row">
                    <div className="detail-field">
                      <label>Quantity</label>
                      <input
                        type="number"
                        value={item.quantity || 1}
                        onChange={(e) => updateDetailItem(activeCategory, item.id, 'quantity', e.target.value)}
                        className="detail-input small"
                      />
                    </div>
                    
                    <div className="detail-field">
                      <label>Unit Cost</label>
                      <input
                        type="number"
                        value={item.unitCost || ''}
                        onChange={(e) => updateDetailItem(activeCategory, item.id, 'unitCost', e.target.value)}
                        className="detail-input small"
                        placeholder="$"
                      />
                    </div>
                    
                    <div className="detail-field">
                      <label>Total</label>
                      <input
                        type="number"
                        value={item.amount || (item.quantity * item.unitCost) || ''}
                        onChange={(e) => updateDetailItem(activeCategory, item.id, 'amount', e.target.value)}
                        className="detail-input small"
                        placeholder="$"
                      />
                    </div>
                  </div>
                  
                  <div className="detail-item-row">
                    <input
                      type="text"
                      placeholder="Notes (optional)"
                      value={item.notes || ''}
                      onChange={(e) => updateDetailItem(activeCategory, item.id, 'notes', e.target.value)}
                      className="detail-input notes"
                    />
                  </div>
                </div>
              ))}
            </div>

            <button 
              className="btn-secondary add-item-btn"
              onClick={() => addDetailItem(activeCategory)}
            >
              + Add Item
            </button>

            <div className="detail-summary">
              <h3>Category Total: {formatCurrency(categoryTotal)}</h3>
            </div>
          </div>

          <div className="modal-footer">
            <button 
              className="btn-primary"
              onClick={() => {
                handleDamageChange(activeCategory === 'property' ? 'personalProperty' : activeCategory, categoryTotal);
                setShowDetails(false);
              }}
            >
              Update Total
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="damage-calculator">
      <div className="calculator-header">
        <div>
          <h3>
            <Calculator size={20} />
            Damage Calculator & Estimator
          </h3>
          <p className="calculator-subtitle">Track all damages and insurance gaps for {clientName}</p>
        </div>
        
        <div className="header-actions">
          <div className={`save-status ${savingStatus}`}>
            {savingStatus === 'saved' && <><Check size={16} /> Saved</>}
            {savingStatus === 'saving' && <>Saving...</>}
            {savingStatus === 'unsaved' && <><AlertCircle size={16} /> Unsaved</>}
          </div>
          
          <button className="btn-secondary" onClick={exportReport}>
            <Download size={18} />
            Export Report
          </button>
          
          <button className="btn-primary" onClick={handleSave}>
            <Save size={18} />
            Save Changes
          </button>
        </div>
      </div>

      <div className="damage-categories">
        <h4>Damage Categories</h4>
        
        <div className="damage-grid">
          <div className="damage-category-card">
            <div className="category-icon structure">
              <Home size={24} />
            </div>
            <div className="category-content">
              <label>Structure Damage</label>
              <div className="input-with-detail">
                <input
                  type="number"
                  value={damages.structure || ''}
                  onChange={(e) => handleDamageChange('structure', e.target.value)}
                  placeholder="$0"
                />
                <button 
                  className="detail-btn"
                  onClick={() => {
                    setActiveCategory('structure');
                    setShowDetails(true);
                  }}
                >
                  <FileText size={16} />
                  Details
                </button>
              </div>
              {structureDetails.length > 0 && (
                <span className="item-count">{structureDetails.length} items</span>
              )}
            </div>
          </div>

          <div className="damage-category-card">
            <div className="category-icon property">
              <Package size={24} />
            </div>
            <div className="category-content">
              <label>Personal Property</label>
              <div className="input-with-detail">
                <input
                  type="number"
                  value={damages.personalProperty || ''}
                  onChange={(e) => handleDamageChange('personalProperty', e.target.value)}
                  placeholder="$0"
                />
                <button 
                  className="detail-btn"
                  onClick={() => {
                    setActiveCategory('property');
                    setShowDetails(true);
                  }}
                >
                  <FileText size={16} />
                  Details
                </button>
              </div>
              {propertyDetails.length > 0 && (
                <span className="item-count">{propertyDetails.length} items</span>
              )}
            </div>
          </div>

          <div className="damage-category-card">
            <div className="category-icon ale">
              <DollarSign size={24} />
            </div>
            <div className="category-content">
              <label>Additional Living Expenses</label>
              <div className="input-with-detail">
                <input
                  type="number"
                  value={damages.additionalLivingExpenses || ''}
                  onChange={(e) => handleDamageChange('additionalLivingExpenses', e.target.value)}
                  placeholder="$0"
                />
                <button 
                  className="detail-btn"
                  onClick={() => {
                    setActiveCategory('ale');
                    setShowDetails(true);
                  }}
                >
                  <FileText size={16} />
                  Details
                </button>
              </div>
              {aleDetails.length > 0 && (
                <span className="item-count">{aleDetails.length} items</span>
              )}
            </div>
          </div>

          <div className="damage-category-card">
            <div className="category-icon landscaping">
              <Trees size={24} />
            </div>
            <div className="category-content">
              <label>Landscaping</label>
              <input
                type="number"
                value={damages.landscaping || ''}
                onChange={(e) => handleDamageChange('landscaping', e.target.value)}
                placeholder="$0"
              />
            </div>
          </div>

          <div className="damage-category-card">
            <div className="category-icon vehicles">
              <Car size={24} />
            </div>
            <div className="category-content">
              <label>Cars/Vehicles</label>
              <div className="input-with-detail">
                <input
                  type="number"
                  value={damages.vehicles || ''}
                  onChange={(e) => handleDamageChange('vehicles', e.target.value)}
                  placeholder="$0"
                />
                <button 
                  className="detail-btn"
                  onClick={() => {
                    setActiveCategory('vehicle');
                    setShowDetails(true);
                  }}
                >
                  <FileText size={16} />
                  Details
                </button>
              </div>
              {vehicleDetails.length > 0 && (
                <span className="item-count">{vehicleDetails.length} vehicles</span>
              )}
            </div>
          </div>

          <div className="damage-category-card">
            <div className="category-icon other">
              <DollarSign size={24} />
            </div>
            <div className="category-content">
              <label>Other Damages</label>
              <input
                type="number"
                value={damages.other || ''}
                onChange={(e) => handleDamageChange('other', e.target.value)}
                placeholder="$0"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="calculation-summary">
        <div className="summary-section totals">
          <h4>Total Damages</h4>
          <div className="summary-row total-claimed">
            <span>Total Claimed</span>
            <strong>{formatCurrency(totalClaimed)}</strong>
          </div>
        </div>

        <div className="summary-section insurance">
          <h4>Insurance Response</h4>
          <div className="summary-row">
            <label>Insurance Offered</label>
            <input
              type="number"
              value={damages.insuranceOffered || ''}
              onChange={(e) => handleDamageChange('insuranceOffered', e.target.value)}
              placeholder="$0"
            />
          </div>
          <div className="summary-row">
            <label>Insurance Paid to Date</label>
            <input
              type="number"
              value={damages.insurancePaid || ''}
              onChange={(e) => handleDamageChange('insurancePaid', e.target.value)}
              placeholder="$0"
            />
          </div>
        </div>

        <div className="summary-section gaps">
          <h4>Gap Analysis</h4>
          <div className={`summary-row gap-amount ${gapAmount > 0 ? 'negative' : 'positive'}`}>
            <span>Gap Amount (Claimed - Offered)</span>
            <strong>{formatCurrency(Math.abs(gapAmount))}</strong>
          </div>
          <div className={`summary-row shortfall ${shortfall > 0 ? 'negative' : 'positive'}`}>
            <span>Current Shortfall (Claimed - Paid)</span>
            <strong>{formatCurrency(Math.abs(shortfall))}</strong>
          </div>
          
          {gapAmount > 0 && (
            <div className="gap-alert">
              <AlertTriangle size={20} />
              <span>Insurance offer is {formatCurrency(gapAmount)} short of total damages</span>
            </div>
          )}
        </div>
      </div>

      <div className="damage-notes">
        <h4>Notes & Additional Information</h4>
        <textarea
          value={damages.notes}
          onChange={(e) => handleDamageChange('notes', e.target.value)}
          placeholder="Add any additional notes about the damage assessment, special circumstances, or documentation needed..."
          rows={4}
        />
      </div>

      <div className="damage-insights">
        <div className="insight-card">
          <TrendingUp size={20} />
          <div>
            <h5>Recovery Rate</h5>
            <p>{((damages.insurancePaid / totalClaimed) * 100 || 0).toFixed(1)}% of damages paid</p>
          </div>
        </div>
        
        <div className="insight-card">
          <AlertCircle size={20} />
          <div>
            <h5>Documentation Status</h5>
            <p>
              {structureDetails.length + propertyDetails.length + aleDetails.length + vehicleDetails.length} 
              {' '}detailed items documented
            </p>
          </div>
        </div>
      </div>

      {renderDetailModal()}

      <style jsx>{`
        .damage-calculator {
          background: white;
          border-radius: 8px;
          padding: 25px;
        }

        .calculator-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 30px;
          padding-bottom: 20px;
          border-bottom: 2px solid var(--border);
        }

        .calculator-header h3 {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 5px;
        }

        .calculator-subtitle {
          color: var(--text-light);
          font-size: 14px;
        }

        .header-actions {
          display: flex;
          gap: 15px;
          align-items: center;
        }

        .save-status {
          display: flex;
          align-items: center;
          gap: 5px;
          padding: 6px 12px;
          border-radius: 6px;
          font-size: 13px;
          font-weight: 500;
        }

        .save-status.saved {
          background: #d1fae5;
          color: #065f46;
        }

        .save-status.saving {
          background: #dbeafe;
          color: #1e40af;
        }

        .save-status.unsaved {
          background: #fee2e2;
          color: #991b1b;
        }

        .damage-categories {
          margin-bottom: 30px;
        }

        .damage-categories h4 {
          margin-bottom: 20px;
          color: var(--text);
        }

        .damage-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
          gap: 20px;
        }

        .damage-category-card {
          display: flex;
          gap: 15px;
          padding: 20px;
          background: var(--light);
          border-radius: 8px;
          border: 1px solid var(--border);
          transition: all 0.3s;
        }

        .damage-category-card:hover {
          box-shadow: 0 4px 12px rgba(0,0,0,0.1);
        }

        .category-icon {
          width: 50px;
          height: 50px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 10px;
          flex-shrink: 0;
        }

        .category-icon.structure {
          background: #dbeafe;
          color: #1e40af;
        }

        .category-icon.property {
          background: #f3e8ff;
          color: #7c3aed;
        }

        .category-icon.ale {
          background: #fef3c7;
          color: #d97706;
        }

        .category-icon.landscaping {
          background: #d1fae5;
          color: #065f46;
        }

        .category-icon.vehicles {
          background: #fee2e2;
          color: #991b1b;
        }

        .category-icon.other {
          background: #e5e7eb;
          color: #374151;
        }

        .category-content {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .category-content label {
          font-weight: 500;
          color: var(--text);
        }

        .category-content input {
          padding: 8px 12px;
          border: 1px solid var(--border);
          border-radius: 6px;
          font-size: 16px;
          font-weight: 500;
        }

        .input-with-detail {
          display: flex;
          gap: 8px;
        }

        .input-with-detail input {
          flex: 1;
        }

        .detail-btn {
          display: flex;
          align-items: center;
          gap: 4px;
          padding: 8px 12px;
          background: white;
          border: 1px solid var(--border);
          border-radius: 6px;
          color: var(--primary);
          font-size: 13px;
          cursor: pointer;
          transition: all 0.2s;
        }

        .detail-btn:hover {
          background: var(--primary);
          color: white;
        }

        .item-count {
          font-size: 12px;
          color: var(--text-light);
        }

        .calculation-summary {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: 20px;
          margin-bottom: 30px;
        }

        .summary-section {
          padding: 20px;
          background: white;
          border: 1px solid var(--border);
          border-radius: 8px;
        }

        .summary-section h4 {
          margin-bottom: 15px;
          color: var(--text);
        }

        .summary-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 10px 0;
          border-bottom: 1px solid #f0f0f0;
        }

        .summary-row:last-child {
          border-bottom: none;
        }

        .summary-row strong {
          font-size: 20px;
        }

        .summary-row input {
          width: 150px;
          padding: 8px 12px;
          border: 1px solid var(--border);
          border-radius: 6px;
          font-size: 16px;
          text-align: right;
        }

        .total-claimed strong {
          color: var(--primary);
        }

        .gap-amount.negative strong,
        .shortfall.negative strong {
          color: #dc2626;
        }

        .gap-amount.positive strong,
        .shortfall.positive strong {
          color: #16a34a;
        }

        .gap-alert {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-top: 15px;
          padding: 12px;
          background: #fef2f2;
          border-left: 3px solid #ef4444;
          border-radius: 4px;
          color: #991b1b;
          font-size: 14px;
        }

        .damage-notes {
          margin-bottom: 30px;
        }

        .damage-notes h4 {
          margin-bottom: 15px;
        }

        .damage-notes textarea {
          width: 100%;
          padding: 12px;
          border: 1px solid var(--border);
          border-radius: 6px;
          font-size: 14px;
          resize: vertical;
        }

        .damage-insights {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 20px;
        }

        .insight-card {
          display: flex;
          gap: 15px;
          padding: 15px;
          background: #f9fafb;
          border-radius: 8px;
          align-items: center;
        }

        .insight-card h5 {
          margin-bottom: 4px;
          font-size: 14px;
        }

        .insight-card p {
          color: var(--text-light);
          font-size: 13px;
        }

        /* Detail Modal Styles */
        .damage-detail-modal {
          max-width: 700px;
          max-height: 80vh;
          overflow-y: auto;
        }

        .damage-details-content {
          padding: 20px;
        }

        .detail-items-list {
          display: flex;
          flex-direction: column;
          gap: 15px;
          margin-bottom: 20px;
        }

        .detail-item-card {
          padding: 15px;
          background: var(--light);
          border-radius: 8px;
          border: 1px solid var(--border);
        }

        .detail-item-row {
          display: flex;
          gap: 10px;
          margin-bottom: 10px;
        }

        .detail-item-row:last-child {
          margin-bottom: 0;
        }

        .detail-input {
          padding: 8px 12px;
          border: 1px solid var(--border);
          border-radius: 6px;
          font-size: 14px;
        }

        .detail-input.description {
          flex: 1;
        }

        .detail-input.small {
          width: 100px;
        }

        .detail-input.notes {
          flex: 1;
        }

        .detail-field {
          display: flex;
          flex-direction: column;
          gap: 5px;
        }

        .detail-field label {
          font-size: 12px;
          color: var(--text-light);
        }

        .add-item-btn {
          width: 100%;
          padding: 12px;
          border: 2px dashed var(--border);
          background: white;
          border-radius: 6px;
          color: var(--text-light);
          cursor: pointer;
          transition: all 0.2s;
        }

        .add-item-btn:hover {
          border-color: var(--primary);
          color: var(--primary);
        }

        .detail-summary {
          margin-top: 20px;
          padding: 15px;
          background: var(--primary);
          color: white;
          border-radius: 6px;
          text-align: center;
        }

        .detail-summary h3 {
          margin: 0;
        }

        @media (max-width: 768px) {
          .damage-grid {
            grid-template-columns: 1fr;
          }
          
          .calculation-summary {
            grid-template-columns: 1fr;
          }
          
          .damage-insights {
            grid-template-columns: 1fr;
          }
          
          .calculator-header {
            flex-direction: column;
            gap: 15px;
            align-items: flex-start;
          }
        }
      `}</style>
    </div>
  );
};

export default DamageCalculator;
