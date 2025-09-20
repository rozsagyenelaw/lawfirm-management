
// src/components/ProbateDataForm.js
import React, { useState, useEffect } from 'react';
import { Save, Plus, Trash2, User, Calendar, Home, DollarSign, Users, FileText, Gavel } from 'lucide-react';
import toast from 'react-hot-toast';

const ProbateDataForm = ({ client, onSave }) => {
  const [formData, setFormData] = useState({
    // Decedent Information
    decedentName: '',
    dateOfDeath: '',
    placeOfDeath: '',
    deathAddress: '',
    californiaResident: 'yes',
    
    // Family Information
    hasSpouse: 'no',
    hasChildren: 'no',
    hasGrandchildren: 'no',
    
    // Petitioner Information
    petitionerName: client?.name || '',
    petitionerRelationship: '',
    petitionerAddress: client?.address || '',
    petitionerPhone: client?.phone || '',
    petitionerEmail: client?.email || '',
    petitionerIsExecutor: 'no',
    
    // Estate Information
    personalPropertyValue: '',
    realPropertyGross: '',
    realPropertyEncumbrance: '',
    hasWill: false,
    willDate: '',
    willSelfProving: 'no',
    executorNamedInWill: 'no',
    estateValue: '',
    
    // Case Information
    caseNumber: '',
    hearingDept: '',
    hearingDate: '',
    hearingTime: '',
    
    // Administration
    bondWaived: false,
    independentAdmin: false,
    adminType: 'full',
    bondRequired: 'no',
    bondAmount: '',
    
    // Court Information
    courtCounty: 'LOS ANGELES',
    courtBranch: 'STANLEY MOSK COURTHOUSE',
    
    // Arrays
    heirs: [],
    realProperty: [],
    personalProperty: [],
    debts: []
  });

  const [newHeir, setNewHeir] = useState({ 
    name: '', 
    relationship: '', 
    age: '', 
    address: '' 
  });

  const [newAsset, setNewAsset] = useState({ 
    description: '', 
    value: '', 
    type: 'real' 
  });
  
  const [newDebt, setNewDebt] = useState({ 
    creditor: '', 
    amount: '', 
    description: '' 
  });

  // Load saved data from localStorage if exists
  useEffect(() => {
    if (client?.id) {
      const savedData = localStorage.getItem(`probate_data_${client.id}`);
      if (savedData) {
        setFormData(JSON.parse(savedData));
      }
    }
  }, [client]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSave = () => {
    // Save to localStorage
    if (client?.id) {
      localStorage.setItem(`probate_data_${client.id}`, JSON.stringify(formData));
    }
    
    // Update client object with probate data
    const updatedClient = {
      ...client,
      ...formData
    };
    
    // Call parent save handler
    if (onSave) {
      onSave(updatedClient);
    }
    
    toast.success('Probate data saved successfully!');
  };

  // Heir management
  const addHeir = () => {
    if (newHeir.name) {
      setFormData(prev => ({
        ...prev,
        heirs: [...prev.heirs, { ...newHeir, id: Date.now() }]
      }));
      setNewHeir({ name: '', relationship: '', age: '', address: '' });
    }
  };

  const removeHeir = (id) => {
    setFormData(prev => ({
      ...prev,
      heirs: prev.heirs.filter(h => h.id !== id)
    }));
  };

  // Asset management
  const addAsset = () => {
    if (newAsset.description && newAsset.value) {
      const assetList = newAsset.type === 'real' ? 'realProperty' : 'personalProperty';
      setFormData(prev => ({
        ...prev,
        [assetList]: [...prev[assetList], { ...newAsset, id: Date.now() }]
      }));
      setNewAsset({ description: '', value: '', type: 'real' });
    }
  };

  const removeAsset = (id, type) => {
    const assetList = type === 'real' ? 'realProperty' : 'personalProperty';
    setFormData(prev => ({
      ...prev,
      [assetList]: prev[assetList].filter(a => a.id !== id)
    }));
  };

  // Debt management
  const addDebt = () => {
    if (newDebt.creditor && newDebt.amount) {
      setFormData(prev => ({
        ...prev,
        debts: [...prev.debts, { ...newDebt, id: Date.now() }]
      }));
      setNewDebt({ creditor: '', amount: '', description: '' });
    }
  };

  const removeDebt = (id) => {
    setFormData(prev => ({
      ...prev,
      debts: prev.debts.filter(d => d.id !== id)
    }));
  };

  const formatCurrency = (value) => {
    if (!value) return '';
    const num = parseFloat(value.toString().replace(/[^0-9.-]+/g, ''));
    return isNaN(num) ? '' : new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0
    }).format(num);
  };

  return (
    <div className="probate-data-form bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-semibold text-gray-900">
          Probate Information Form
        </h3>
        <button
          onClick={handleSave}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
        >
          <Save size={18} />
          Save Data
        </button>
      </div>

      {/* Decedent Information */}
      <div className="section mb-6">
        <h4 className="text-md font-medium text-gray-800 mb-4 flex items-center gap-2">
          <User size={18} />
          Decedent Information
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Full Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="decedentName"
              value={formData.decedentName}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              placeholder="Full legal name"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Date of Death <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              name="dateOfDeath" 
              value={formData.dateOfDeath}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Place of Death <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="placeOfDeath"
              value={formData.placeOfDeath}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              placeholder="City, State"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              California Resident? <span className="text-red-500">*</span>
            </label>
            <select
              name="californiaResident"
              value={formData.californiaResident}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            >
              <option value="yes">Yes</option>
              <option value="no">No</option>
            </select>
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Address at Time of Death <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="deathAddress"
              value={formData.deathAddress}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              placeholder="Full address"
            />
          </div>
        </div>
      </div>

      {/* Family Information */}
      <div className="section mb-6">
        <h4 className="text-md font-medium text-gray-800 mb-4 flex items-center gap-2">
          <Users size={18} />
          Family Information
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Was decedent survived by a spouse?
            </label>
            <select
              name="hasSpouse"
              value={formData.hasSpouse}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            >
              <option value="yes">Yes</option>
              <option value="no">No</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Was decedent survived by children?
            </label>
            <select
              name="hasChildren"
              value={formData.hasChildren}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            >
              <option value="yes">Yes</option>
              <option value="no">No</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Survived by grandchildren?
            </label>
            <select
              name="hasGrandchildren"
              value={formData.hasGrandchildren}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            >
              <option value="yes">Yes</option>
              <option value="no">No</option>
            </select>
          </div>
        </div>
      </div>

      {/* Petitioner Information */}
      <div className="section mb-6">
        <h4 className="text-md font-medium text-gray-800 mb-4 flex items-center gap-2">
          <User size={18} />
          Petitioner Information
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Full Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="petitionerName"
              value={formData.petitionerName}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Relationship to Decedent <span className="text-red-500">*</span>
            </label>
            <select
              name="petitionerRelationship"
              value={formData.petitionerRelationship}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            >
              <option value="">Select...</option>
              <option value="Spouse">Spouse</option>
              <option value="Child">Child</option>
              <option value="Parent">Parent</option>
              <option value="Sibling">Sibling</option>
              <option value="Other Relative">Other Relative</option>
              <option value="Creditor">Creditor</option>
              <option value="Other">Other</option>
            </select>
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Address <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="petitionerAddress"
              value={formData.petitionerAddress}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Phone Number <span className="text-red-500">*</span>
            </label>
            <input
              type="tel"
              name="petitionerPhone"
              value={formData.petitionerPhone}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Is Petitioner Named as Executor in Will?
            </label>
            <select
              name="petitionerIsExecutor"
              value={formData.petitionerIsExecutor}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            >
              <option value="yes">Yes</option>
              <option value="no">No</option>
            </select>
          </div>
        </div>
      </div>

      {/* Estate Information */}
      <div className="section mb-6">
        <h4 className="text-md font-medium text-gray-800 mb-4 flex items-center gap-2">
          <DollarSign size={18} />
          Estate Information
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Personal Property Value <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              name="personalPropertyValue"
              value={formData.personalPropertyValue}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              placeholder="Enter amount without $"
            />
            <span className="text-xs text-gray-500">Bank accounts, vehicles, jewelry, etc.</span>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Real Property Gross Value
            </label>
            <input
              type="number"
              name="realPropertyGross"
              value={formData.realPropertyGross}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              placeholder="Enter amount without $"
            />
            <span className="text-xs text-gray-500">Total value of real estate</span>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Real Property Encumbrances
            </label>
            <input
              type="number"
              name="realPropertyEncumbrance"
              value={formData.realPropertyEncumbrance}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              placeholder="Enter amount without $"
            />
            <span className="text-xs text-gray-500">Mortgages/liens on real estate</span>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Is There a Will? <span className="text-red-500">*</span>
            </label>
            <select
              name="hasWill"
              value={formData.hasWill ? 'yes' : 'no'}
              onChange={(e) => setFormData(prev => ({
                ...prev,
                hasWill: e.target.value === 'yes'
              }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            >
              <option value="yes">Yes</option>
              <option value="no">No</option>
            </select>
          </div>
          
          {formData.hasWill && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Date of Will
                </label>
                <input
                  type="date"
                  name="willDate"
                  value={formData.willDate}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Is Will Self-Proving?
                </label>
                <select
                  name="willSelfProving"
                  value={formData.willSelfProving}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                >
                  <option value="yes">Yes</option>
                  <option value="no">No</option>
                </select>
                <span className="text-xs text-gray-500">A self-proving will includes notarized witness affidavits</span>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Is there an executor named in the will?
                </label>
                <select
                  name="executorNamedInWill"
                  value={formData.executorNamedInWill}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                >
                  <option value="yes">Yes</option>
                  <option value="no">No</option>
                </select>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Heirs and Beneficiaries */}
      <div className="section mb-6">
        <h4 className="text-md font-medium text-gray-800 mb-4 flex items-center gap-2">
          <Users size={18} />
          Heirs and Beneficiaries
        </h4>
        
        <div className="space-y-2 mb-4">
          {formData.heirs.map(heir => (
            <div key={heir.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div>
                <span className="font-medium">{heir.name}</span>
                <span className="text-gray-600 ml-2">({heir.relationship})</span>
                {heir.age && <span className="text-gray-500 ml-2">Age: {heir.age}</span>}
                <div className="text-sm text-gray-500">{heir.address}</div>
              </div>
              <button
                onClick={() => removeHeir(heir.id)}
                className="text-red-500 hover:text-red-700"
              >
                <Trash2 size={18} />
              </button>
            </div>
          ))}
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mb-2">
          <input
            type="text"
            value={newHeir.name}
            onChange={(e) => setNewHeir({ ...newHeir, name: e.target.value })}
            placeholder="Name (e.g., Jane Smith or The John Rude Living Trust)"
            className="px-3 py-2 border border-gray-300 rounded-md"
          />
          <select
            value={newHeir.relationship}
            onChange={(e) => setNewHeir({ ...newHeir, relationship: e.target.value })}
            className="px-3 py-2 border border-gray-300 rounded-md"
          >
            <option value="">Select Relationship...</option>
            <option value="Spouse">Spouse</option>
            <option value="Child">Child (Son/Daughter)</option>
            <option value="Son">Son</option>
            <option value="Daughter">Daughter</option>
            <option value="Grandchild">Grandchild</option>
            <option value="Parent">Parent</option>
            <option value="Sibling">Sibling</option>
            <option value="Brother">Brother</option>
            <option value="Sister">Sister</option>
            <option value="Niece">Niece</option>
            <option value="Nephew">Nephew</option>
            <option value="Beneficiary">Beneficiary</option>
            <option value="Trust">Trust</option>
            <option value="Other">Other</option>
          </select>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          <input
            type="text"
            value={newHeir.age}
            onChange={(e) => setNewHeir({ ...newHeir, age: e.target.value })}
            placeholder="Age (or N/A for trusts)"
            className="px-3 py-2 border border-gray-300 rounded-md"
          />
          <input
            type="text"
            value={newHeir.address}
            onChange={(e) => setNewHeir({ ...newHeir, address: e.target.value })}
            placeholder="Address (e.g., 123 Main St Los Angeles CA 90001)"
            className="px-3 py-2 border border-gray-300 rounded-md"
          />
        </div>
        <button
          onClick={addHeir}
          className="mt-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 flex items-center gap-2"
        >
          <Plus size={18} />
          Add Heir/Beneficiary
        </button>
        <p className="text-xs text-gray-500 mt-2">Include all heirs, beneficiaries, and anyone named in the will. For trusts, use "N/A" for age.</p>
      </div>

      {/* Administration Details */}
      <div className="section mb-6">
        <h4 className="text-md font-medium text-gray-800 mb-4 flex items-center gap-2">
          <Gavel size={18} />
          Administration Details
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Type of Authority Requested <span className="text-red-500">*</span>
            </label>
            <select
              name="adminType"
              value={formData.adminType}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            >
              <option value="full">Full Authority (Independent Administration)</option>
              <option value="limited">Limited Authority</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Is Bond Required? <span className="text-red-500">*</span>
            </label>
            <select
              name="bondRequired"
              value={formData.bondRequired}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            >
              <option value="yes">Yes</option>
              <option value="no">No</option>
            </select>
          </div>
          {formData.bondRequired === 'yes' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Bond Amount
              </label>
              <input
                type="number"
                name="bondAmount"
                value={formData.bondAmount}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                placeholder="Enter amount without $"
              />
            </div>
          )}
        </div>
      </div>

      {/* Court Information */}
      <div className="section mb-6">
        <h4 className="text-md font-medium text-gray-800 mb-4 flex items-center gap-2">
          <Gavel size={18} />
          Court Information
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              County
            </label>
            <select
              name="courtCounty"
              value={formData.courtCounty}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            >
              <option value="LOS ANGELES">Los Angeles</option>
              <option value="ORANGE">Orange</option>
              <option value="SAN DIEGO">San Diego</option>
              <option value="RIVERSIDE">Riverside</option>
              <option value="SAN BERNARDINO">San Bernardino</option>
              <option value="VENTURA">Ventura</option>
              <option value="SANTA BARBARA">Santa Barbara</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Court Branch
            </label>
            <input
              type="text"
              name="courtBranch"
              value={formData.courtBranch}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            />
          </div>
        </div>
      </div>

      {/* ALTERNATIVE SECTIONS - Lines 806-1210 from your original */}
      
      {/* Alternative Decedent Information */}
      <div className="section mb-6">
        <h4 className="text-md font-medium text-gray-800 mb-4 flex items-center gap-2">
          <User size={18} />
          Decedent Information (Simplified)
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Decedent Name *
            </label>
            <input
              type="text"
              name="decedentName"
              value={formData.decedentName}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              placeholder="Full legal name"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Date of Death *
            </label>
            <input
              type="date"
              name="dateOfDeath"
              value={formData.dateOfDeath}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Place of Death
            </label>
            <input
              type="text"
              name="placeOfDeath"
              value={formData.placeOfDeath}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              placeholder="City, County, State"
            />
          </div>
        </div>
      </div>

      {/* Alternative Petitioner Information */}
      <div className="section mb-6">
        <h4 className="text-md font-medium text-gray-800 mb-4 flex items-center gap-2">
          <User size={18} />
          Petitioner Information (Extended)
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Petitioner Name *
            </label>
            <input
              type="text"
              name="petitionerName"
              value={formData.petitionerName}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Relationship to Decedent *
            </label>
            <input
              type="text"
              name="petitionerRelationship"
              value={formData.petitionerRelationship}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              placeholder="e.g., Spouse, Child, Parent"
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Petitioner Address
            </label>
            <input
              type="text"
              name="petitionerAddress"
              value={formData.petitionerAddress}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Phone
            </label>
            <input
              type="tel"
              name="petitionerPhone"
              value={formData.petitionerPhone}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <input
              type="email"
              name="petitionerEmail"
              value={formData.petitionerEmail}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            />
          </div>
        </div>
      </div>

      {/* Case Information */}
      <div className="section mb-6">
        <h4 className="text-md font-medium text-gray-800 mb-4 flex items-center gap-2">
          <Calendar size={18} />
          Case Information
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Case Number
            </label>
            <input
              type="text"
              name="caseNumber"
              value={formData.caseNumber}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Hearing Department
            </label>
            <input
              type="text"
              name="hearingDept"
              value={formData.hearingDept}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Hearing Date
            </label>
            <input
              type="date"
              name="hearingDate"
              value={formData.hearingDate}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Hearing Time
            </label>
            <input
              type="time"
              name="hearingTime"
              value={formData.hearingTime}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            />
          </div>
        </div>
      </div>

      {/* Alternative Estate Information */}
      <div className="section mb-6">
        <h4 className="text-md font-medium text-gray-800 mb-4 flex items-center gap-2">
          <DollarSign size={18} />
          Estate Information (Summary)
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Estimated Estate Value
            </label>
            <input
              type="text"
              name="estateValue"
              value={formData.estateValue}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              placeholder="$0.00"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Will Date (if applicable)
            </label>
            <input
              type="date"
              name="willDate"
              value={formData.willDate}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              disabled={!formData.hasWill}
            />
          </div>
          <div className="md:col-span-2 space-y-2">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                name="hasWill"
                checked={formData.hasWill}
                onChange={handleChange}
                className="rounded"
              />
              <span className="text-sm">Decedent left a will</span>
            </label>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                name="bondWaived"
                checked={formData.bondWaived}
                onChange={handleChange}
                className="rounded"
              />
              <span className="text-sm">Bond waived</span>
            </label>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                name="independentAdmin"
                checked={formData.independentAdmin}
                onChange={handleChange}
                className="rounded"
              />
              <span className="text-sm">Independent administration requested</span>
            </label>
          </div>
        </div>
      </div>

      {/* Alternative Heirs and Beneficiaries - with only 3 columns */}
      <div className="section mb-6">
        <h4 className="text-md font-medium text-gray-800 mb-4 flex items-center gap-2">
          <Users size={18} />
          Heirs and Beneficiaries (Simple)
        </h4>
        
        <div className="space-y-2 mb-4">
          {formData.heirs.map(heir => (
            <div key={heir.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div>
                <span className="font-medium">{heir.name}</span>
                <span className="text-gray-600 ml-2">({heir.relationship})</span>
                <div className="text-sm text-gray-500">{heir.address}</div>
              </div>
              <button
                onClick={() => removeHeir(heir.id)}
                className="text-red-500 hover:text-red-700"
              >
                <Trash2 size={18} />
              </button>
            </div>
          ))}
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
          <input
            type="text"
            value={newHeir.name}
            onChange={(e) => setNewHeir({ ...newHeir, name: e.target.value })}
            placeholder="Heir name"
            className="px-3 py-2 border border-gray-300 rounded-md"
          />
          <input
            type="text"
            value={newHeir.relationship}
            onChange={(e) => setNewHeir({ ...newHeir, relationship: e.target.value })}
            placeholder="Relationship"
            className="px-3 py-2 border border-gray-300 rounded-md"
          />
          <input
            type="text"
            value={newHeir.address}
            onChange={(e) => setNewHeir({ ...newHeir, address: e.target.value })}
            placeholder="Address"
            className="px-3 py-2 border border-gray-300 rounded-md"
          />
        </div>
        <button
          onClick={addHeir}
          className="mt-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 flex items-center gap-2"
        >
          <Plus size={18} />
          Add Heir
        </button>
      </div>

      {/* Assets */}
      <div className="section mb-6">
        <h4 className="text-md font-medium text-gray-800 mb-4 flex items-center gap-2">
          <Home size={18} />
          Assets
        </h4>
        
        {/* Real Property */}
        <h5 className="text-sm font-medium text-gray-700 mb-2">Real Property</h5>
        <div className="space-y-2 mb-4">
          {formData.realProperty.map(asset => (
            <div key={asset.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div>
                <span className="font-medium">{asset.description}</span>
                <span className="text-gray-600 ml-2">{formatCurrency(asset.value)}</span>
              </div>
              <button
                onClick={() => removeAsset(asset.id, 'real')}
                className="text-red-500 hover:text-red-700"
              >
                <Trash2 size={18} />
              </button>
            </div>
          ))}
        </div>
        
        {/* Personal Property */}
        <h5 className="text-sm font-medium text-gray-700 mb-2 mt-4">Personal Property</h5>
        <div className="space-y-2 mb-4">
          {formData.personalProperty.map(asset => (
            <div key={asset.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div>
                <span className="font-medium">{asset.description}</span>
                <span className="text-gray-600 ml-2">{formatCurrency(asset.value)}</span>
              </div>
              <button
                onClick={() => removeAsset(asset.id, 'personal')}
                className="text-red-500 hover:text-red-700"
              >
                <Trash2 size={18} />
              </button>
            </div>
          ))}
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
          <select
            value={newAsset.type}
            onChange={(e) => setNewAsset({ ...newAsset, type: e.target.value })}
            className="px-3 py-2 border border-gray-300 rounded-md"
          >
            <option value="real">Real Property</option>
            <option value="personal">Personal Property</option>
          </select>
          <input
            type="text"
            value={newAsset.description}
            onChange={(e) => setNewAsset({ ...newAsset, description: e.target.value })}
            placeholder="Asset description"
            className="px-3 py-2 border border-gray-300 rounded-md"
          />
          <input
            type="text"
            value={newAsset.value}
            onChange={(e) => setNewAsset({ ...newAsset, value: e.target.value })}
            placeholder="Value"
            className="px-3 py-2 border border-gray-300 rounded-md"
          />
        </div>
        <button
          onClick={addAsset}
          className="mt-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 flex items-center gap-2"
        >
          <Plus size={18} />
          Add Asset
        </button>
      </div>

      {/* Debts */}
      <div className="section mb-6">
        <h4 className="text-md font-medium text-gray-800 mb-4 flex items-center gap-2">
          <FileText size={18} />
          Debts and Liabilities
        </h4>
        
        <div className="space-y-2 mb-4">
          {formData.debts.map(debt => (
            <div key={debt.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div>
                <span className="font-medium">{debt.creditor}</span>
                <span className="text-gray-600 ml-2">{formatCurrency(debt.amount)}</span>
                {debt.description && (
                  <div className="text-sm text-gray-500">{debt.description}</div>
                )}
              </div>
              <button
                onClick={() => removeDebt(debt.id)}
                className="text-red-500 hover:text-red-700"
              >
                <Trash2 size={18} />
              </button>
            </div>
          ))}
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
          <input
            type="text"
            value={newDebt.creditor}
            onChange={(e) => setNewDebt({ ...newDebt, creditor: e.target.value })}
            placeholder="Creditor name"
            className="px-3 py-2 border border-gray-300 rounded-md"
          />
          <input
            type="text"
            value={newDebt.amount}
            onChange={(e) => setNewDebt({ ...newDebt, amount: e.target.value })}
            placeholder="Amount owed"
            className="px-3 py-2 border border-gray-300 rounded-md"
          />
          <input
            type="text"
            value={newDebt.description}
            onChange={(e) => setNewDebt({ ...newDebt, description: e.target.value })}
            placeholder="Description (optional)"
            className="px-3 py-2 border border-gray-300 rounded-md"
          />
        </div>
        <button
          onClick={addDebt}
          className="mt-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 flex items-center gap-2"
        >
          <Plus size={18} />
          Add Debt
        </button>
      </div>

      {/* Save Button */}
      <div className="flex justify-end mt-8">
        <button
          onClick={handleSave}
          className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2 font-medium"
        >
          <Save size={20} />
          Save Probate Information
        </button>
      </div>
    </div>
  );
};

export default ProbateDataForm;
