// src/components/ProbateDataForm.js
import React, { useState, useEffect } from 'react';
import { Save, Plus, Trash2, User, Calendar, Home, DollarSign, Users, FileText, Gavel, AlertCircle } from 'lucide-react';
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
    
    // Case Information
    caseNumber: '',
    hearingDept: '',
    hearingDate: '',
    hearingTime: '',
    
    // Administration Details
    adminType: 'full',
    bondRequired: 'no',
    bondAmount: '',
    
    // Court Information
    courtCounty: 'LOS ANGELES',
    courtBranch: 'STANLEY MOSK COURTHOUSE',
    
    // Attorney Information (pre-filled)
    attorneyName: 'ROZSA GYENE, ESQ.',
    attorneyBar: '208356',
    firmName: 'LAW OFFICES OF ROZSA GYENE',
    firmStreet: '450 N BRAND BLVD SUITE 600',
    firmCity: 'GLENDALE',
    firmState: 'CA',
    firmZip: '91203',
    firmPhone: '818-291-6217',
    firmFax: '818-291-6205',
    firmEmail: 'ROZSAGYENELAW@YAHOO.COM',
    
    // Arrays for dynamic entries
    heirs: [],
    assets: [],
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
    type: 'personal' 
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
      probateData: formData
    };
    
    // Call parent save handler
    if (onSave) {
      onSave(updatedClient);
    }
    
    toast.success('Probate data saved successfully!');
  };

  // Heir management
  const addHeir = () => {
    if (newHeir.name && newHeir.relationship && newHeir.address) {
      setFormData(prev => ({
        ...prev,
        heirs: [...prev.heirs, { ...newHeir, id: Date.now() }]
      }));
      setNewHeir({ name: '', relationship: '', age: '', address: '' });
    } else {
      toast.error('Please fill in name, relationship, and address for the heir');
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
      setFormData(prev => ({
        ...prev,
        assets: [...prev.assets, { ...newAsset, id: Date.now() }]
      }));
      setNewAsset({ description: '', value: '', type: 'personal' });
    } else {
      toast.error('Please fill in description and value for the asset');
    }
  };

  const removeAsset = (id) => {
    setFormData(prev => ({
      ...prev,
      assets: prev.assets.filter(a => a.id !== id)
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
    } else {
      toast.error('Please fill in creditor and amount for the debt');
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

  // Calculate total estate value
  const calculateTotalEstate = () => {
    const personal = parseFloat(formData.personalPropertyValue || 0);
    const realGross = parseFloat(formData.realPropertyGross || 0);
    const realNet = realGross - parseFloat(formData.realPropertyEncumbrance || 0);
    const assetTotal = formData.assets.reduce((sum, asset) => sum + parseFloat(asset.value || 0), 0);
    return personal + realNet + assetTotal;
  };

  return (
    <div className="probate-data-form">
      <form onSubmit={(e) => { e.preventDefault(); handleSave(); }}>
        <div className="flex justify-between items-center mb-6">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Probate Information Form</h3>
            <p className="text-sm text-gray-500 mt-1">Complete all required fields for probate petition</p>
          </div>
          <span className="category-badge probate">Probate</span>
        </div>

        {/* Decedent Information Section */}
        <div className="section">
          <h4 className="text-gray-700 font-medium mb-4 flex items-center gap-2">
            <User className="w-4 h-4" />
            Decedent Information
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="decedentName">
                Full Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="decedentName"
                name="decedentName"
                value={formData.decedentName}
                onChange={handleChange}
                required
                placeholder="Full legal name"
              />
            </div>
            <div>
              <label htmlFor="dateOfDeath">
                Date of Death <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                id="dateOfDeath"
                name="dateOfDeath" 
                value={formData.dateOfDeath}
                onChange={handleChange}
                required
              />
            </div>
            <div>
              <label htmlFor="placeOfDeath">
                Place of Death <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="placeOfDeath"
                name="placeOfDeath"
                value={formData.placeOfDeath}
                onChange={handleChange}
                required
                placeholder="City, State"
              />
            </div>
            <div>
              <label htmlFor="californiaResident">
                California Resident? <span className="text-red-500">*</span>
              </label>
              <select
                id="californiaResident"
                name="californiaResident"
                value={formData.californiaResident}
                onChange={handleChange}
                required
              >
                <option value="yes">Yes</option>
                <option value="no">No</option>
              </select>
            </div>
            <div className="md:col-span-2">
              <label htmlFor="deathAddress">
                Address at Time of Death <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="deathAddress"
                name="deathAddress"
                value={formData.deathAddress}
                onChange={handleChange}
                required
                placeholder="Full address"
              />
            </div>
          </div>
        </div>

        {/* Family Information Section */}
        <div className="section">
          <h4 className="text-gray-700 font-medium mb-4 flex items-center gap-2">
            <Users className="w-4 h-4" />
            Family Information
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label>Was decedent survived by a spouse? <span className="text-red-500">*</span></label>
              <div className="flex gap-4 mt-2">
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="hasSpouse"
                    value="yes"
                    checked={formData.hasSpouse === 'yes'}
                    onChange={handleChange}
                    required
                  />
                  <span className="ml-2">Yes</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="hasSpouse"
                    value="no"
                    checked={formData.hasSpouse === 'no'}
                    onChange={handleChange}
                    required
                  />
                  <span className="ml-2">No</span>
                </label>
              </div>
            </div>
            <div>
              <label>Was decedent survived by children? <span className="text-red-500">*</span></label>
              <div className="flex gap-4 mt-2">
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="hasChildren"
                    value="yes"
                    checked={formData.hasChildren === 'yes'}
                    onChange={handleChange}
                    required
                  />
                  <span className="ml-2">Yes</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="hasChildren"
                    value="no"
                    checked={formData.hasChildren === 'no'}
                    onChange={handleChange}
                    required
                  />
                  <span className="ml-2">No</span>
                </label>
              </div>
            </div>
            <div>
              <label>Survived by grandchildren? <span className="text-red-500">*</span></label>
              <div className="flex gap-4 mt-2">
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="hasGrandchildren"
                    value="yes"
                    checked={formData.hasGrandchildren === 'yes'}
                    onChange={handleChange}
                    required
                  />
                  <span className="ml-2">Yes</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="hasGrandchildren"
                    value="no"
                    checked={formData.hasGrandchildren === 'no'}
                    onChange={handleChange}
                    required
                  />
                  <span className="ml-2">No</span>
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* Petitioner Information Section */}
        <div className="section">
          <h4 className="text-gray-700 font-medium mb-4 flex items-center gap-2">
            <User className="w-4 h-4" />
            Petitioner Information
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="petitionerName">
                Full Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="petitionerName"
                name="petitionerName"
                value={formData.petitionerName}
                onChange={handleChange}
                required
                placeholder="Petitioner's full name"
              />
            </div>
            <div>
              <label htmlFor="petitionerRelationship">
                Relationship to Decedent <span className="text-red-500">*</span>
              </label>
              <select
                id="petitionerRelationship"
                name="petitionerRelationship"
                value={formData.petitionerRelationship}
                onChange={handleChange}
                required
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
              <label htmlFor="petitionerAddress">
                Address <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="petitionerAddress"
                name="petitionerAddress"
                value={formData.petitionerAddress}
                onChange={handleChange}
                required
                placeholder="Full address"
              />
            </div>
            <div>
              <label htmlFor="petitionerPhone">
                Phone Number <span className="text-red-500">*</span>
              </label>
              <input
                type="tel"
                id="petitionerPhone"
                name="petitionerPhone"
                value={formData.petitionerPhone}
                onChange={handleChange}
                required
                placeholder="(xxx) xxx-xxxx"
              />
            </div>
            <div>
              <label htmlFor="petitionerEmail">
                Email Address
              </label>
              <input
                type="email"
                id="petitionerEmail"
                name="petitionerEmail"
                value={formData.petitionerEmail}
                onChange={handleChange}
                placeholder="email@example.com"
              />
            </div>
            <div className="md:col-span-2">
              <label>Is Petitioner Named as Executor in Will?</label>
              <div className="flex gap-4 mt-2">
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="petitionerIsExecutor"
                    value="yes"
                    checked={formData.petitionerIsExecutor === 'yes'}
                    onChange={handleChange}
                  />
                  <span className="ml-2">Yes</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="petitionerIsExecutor"
                    value="no"
                    checked={formData.petitionerIsExecutor === 'no'}
                    onChange={handleChange}
                  />
                  <span className="ml-2">No</span>
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* Estate Information Section */}
        <div className="section">
          <h4 className="text-gray-700 font-medium mb-4 flex items-center gap-2">
            <DollarSign className="w-4 h-4" />
            Estate Information
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="personalPropertyValue">
                Personal Property Value <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                id="personalPropertyValue"
                name="personalPropertyValue"
                value={formData.personalPropertyValue}
                onChange={handleChange}
                required
                placeholder="Enter amount without $"
              />
              <p className="text-xs text-gray-500 mt-1">Bank accounts, vehicles, jewelry, etc.</p>
            </div>
            <div>
              <label htmlFor="realPropertyGross">
                Real Property Gross Value
              </label>
              <input
                type="number"
                id="realPropertyGross"
                name="realPropertyGross"
                value={formData.realPropertyGross}
                onChange={handleChange}
                placeholder="Enter amount without $"
              />
              <p className="text-xs text-gray-500 mt-1">Total value of real estate</p>
            </div>
            <div>
              <label htmlFor="realPropertyEncumbrance">
                Real Property Encumbrances
              </label>
              <input
                type="number"
                id="realPropertyEncumbrance"
                name="realPropertyEncumbrance"
                value={formData.realPropertyEncumbrance}
                onChange={handleChange}
                placeholder="Enter amount without $"
              />
              <p className="text-xs text-gray-500 mt-1">Mortgages/liens on real estate</p>
            </div>
            <div>
              <label>Is There a Will? <span className="text-red-500">*</span></label>
              <div className="flex gap-4 mt-2">
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="hasWill"
                    value="yes"
                    checked={formData.hasWill === true}
                    onChange={(e) => setFormData(prev => ({ ...prev, hasWill: true }))}
                    required
                  />
                  <span className="ml-2">Yes</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="hasWill"
                    value="no"
                    checked={formData.hasWill === false}
                    onChange={(e) => setFormData(prev => ({ ...prev, hasWill: false }))}
                    required
                  />
                  <span className="ml-2">No</span>
                </label>
              </div>
            </div>
            
            {formData.hasWill && (
              <>
                <div>
                  <label htmlFor="willDate">
                    Date of Will
                  </label>
                  <input
                    type="date"
                    id="willDate"
                    name="willDate"
                    value={formData.willDate}
                    onChange={handleChange}
                  />
                </div>
                <div>
                  <label>Is Will Self-Proving?</label>
                  <div className="flex gap-4 mt-2">
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="willSelfProving"
                        value="yes"
                        checked={formData.willSelfProving === 'yes'}
                        onChange={handleChange}
                      />
                      <span className="ml-2">Yes</span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="willSelfProving"
                        value="no"
                        checked={formData.willSelfProving === 'no'}
                        onChange={handleChange}
                      />
                      <span className="ml-2">No</span>
                    </label>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">A self-proving will includes notarized witness affidavits</p>
                </div>
                <div>
                  <label>Is there an executor named in the will?</label>
                  <div className="flex gap-4 mt-2">
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="executorNamedInWill"
                        value="yes"
                        checked={formData.executorNamedInWill === 'yes'}
                        onChange={handleChange}
                      />
                      <span className="ml-2">Yes</span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="executorNamedInWill"
                        value="no"
                        checked={formData.executorNamedInWill === 'no'}
                        onChange={handleChange}
                      />
                      <span className="ml-2">No</span>
                    </label>
                  </div>
                </div>
              </>
            )}
          </div>
          
          {/* Estate Value Summary */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mt-4">
            <p className="text-sm text-blue-700 flex items-center gap-2">
              <DollarSign className="w-4 h-4" />
              Estimated Total Estate Value: <strong>{formatCurrency(calculateTotalEstate())}</strong>
            </p>
          </div>
        </div>

        {/* Heirs and Beneficiaries Section */}
        <div className="section">
          <h4 className="text-gray-700 font-medium mb-4 flex items-center gap-2">
            <Users className="w-4 h-4" />
            Heirs and Beneficiaries
          </h4>
          
          <div className="space-y-2 mb-4">
            {formData.heirs.map(heir => (
              <div key={heir.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex-1">
                  <span className="font-medium">{heir.name}</span>
                  <span className="text-gray-600 ml-2">({heir.relationship})</span>
                  {heir.age && <span className="text-gray-500 ml-2">Age: {heir.age}</span>}
                  <div className="text-sm text-gray-500">{heir.address}</div>
                </div>
                <button
                  type="button"
                  onClick={() => removeHeir(heir.id)}
                  className="text-red-500 hover:text-red-700 p-2"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
            {formData.heirs.length === 0 && (
              <div className="text-center py-4 text-gray-500 text-sm">
                No heirs or beneficiaries added yet
              </div>
            )}
          </div>
          
          <div className="bg-gray-50 p-4 rounded-lg">
            <h5 className="text-sm font-medium text-gray-700 mb-3">Add Heir/Beneficiary</h5>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-gray-600">Name <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  value={newHeir.name}
                  onChange={(e) => setNewHeir({ ...newHeir, name: e.target.value })}
                  placeholder="e.g., Jane Smith or The John Rude Living Trust"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                />
              </div>
              <div>
                <label className="text-xs text-gray-600">Relationship <span className="text-red-500">*</span></label>
                <select
                  value={newHeir.relationship}
                  onChange={(e) => setNewHeir({ ...newHeir, relationship: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                >
                  <option value="">Select...</option>
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
              <div>
                <label className="text-xs text-gray-600">Age</label>
                <input
                  type="text"
                  value={newHeir.age}
                  onChange={(e) => setNewHeir({ ...newHeir, age: e.target.value })}
                  placeholder="Age or N/A for trusts"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                />
              </div>
              <div>
                <label className="text-xs text-gray-600">Address <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  value={newHeir.address}
                  onChange={(e) => setNewHeir({ ...newHeir, address: e.target.value })}
                  placeholder="e.g., 123 Main St Los Angeles CA 90001"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                />
              </div>
            </div>
            <button
              type="button"
              onClick={addHeir}
              className="mt-3 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center gap-2 text-sm"
            >
              <Plus className="w-4 h-4" />
              Add Heir/Beneficiary
            </button>
            <p className="text-xs text-gray-500 mt-2">Include all heirs, beneficiaries, and anyone named in the will. For trusts, use "N/A" for age.</p>
          </div>
        </div>

        {/* Administration Details Section */}
        <div className="section">
          <h4 className="text-gray-700 font-medium mb-4 flex items-center gap-2">
            <Gavel className="w-4 h-4" />
            Administration Details
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="adminType">
                Type of Authority Requested <span className="text-red-500">*</span>
              </label>
              <select
                id="adminType"
                name="adminType"
                value={formData.adminType}
                onChange={handleChange}
                required
              >
                <option value="full">Full Authority (Independent Administration)</option>
                <option value="limited">Limited Authority</option>
              </select>
            </div>
            <div>
              <label>Is Bond Required? <span className="text-red-500">*</span></label>
              <div className="flex gap-4 mt-2">
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="bondRequired"
                    value="yes"
                    checked={formData.bondRequired === 'yes'}
                    onChange={handleChange}
                    required
                  />
                  <span className="ml-2">Yes</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="bondRequired"
                    value="no"
                    checked={formData.bondRequired === 'no'}
                    onChange={handleChange}
                    required
                  />
                  <span className="ml-2">No</span>
                </label>
              </div>
            </div>
            {formData.bondRequired === 'yes' && (
              <div>
                <label htmlFor="bondAmount">
                  Bond Amount
                </label>
                <input
                  type="number"
                  id="bondAmount"
                  name="bondAmount"
                  value={formData.bondAmount}
                  onChange={handleChange}
                  placeholder="Enter amount without $"
                />
              </div>
            )}
          </div>
        </div>

        {/* Case Information Section */}
        <div className="section">
          <h4 className="text-gray-700 font-medium mb-4 flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            Case Information
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="caseNumber">
                Case Number
              </label>
              <input
                type="text"
                id="caseNumber"
                name="caseNumber"
                value={formData.caseNumber}
                onChange={handleChange}
                placeholder="Leave blank if new case"
              />
            </div>
            <div>
              <label htmlFor="hearingDept">
                Hearing Department
              </label>
              <input
                type="text"
                id="hearingDept"
                name="hearingDept"
                value={formData.hearingDept}
                onChange={handleChange}
                placeholder="Will be assigned by court"
              />
            </div>
            <div>
              <label htmlFor="hearingDate">
                Hearing Date
              </label>
              <input
                type="date"
                id="hearingDate"
                name="hearingDate"
                value={formData.hearingDate}
                onChange={handleChange}
              />
            </div>
            <div>
              <label htmlFor="hearingTime">
                Hearing Time
              </label>
              <input
                type="time"
                id="hearingTime"
                name="hearingTime"
                value={formData.hearingTime}
                onChange={handleChange}
              />
            </div>
          </div>
        </div>

        {/* Court Information Section */}
        <div className="section">
          <h4 className="text-gray-700 font-medium mb-4 flex items-center gap-2">
            <Gavel className="w-4 h-4" />
            Court Information
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="courtCounty">
                County <span className="text-red-500">*</span>
              </label>
              <select
                id="courtCounty"
                name="courtCounty"
                value={formData.courtCounty}
                onChange={handleChange}
                required
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
              <label htmlFor="courtBranch">
                Court Branch
              </label>
              <input
                type="text"
                id="courtBranch"
                name="courtBranch"
                value={formData.courtBranch}
                onChange={handleChange}
                placeholder="Branch name"
              />
            </div>
          </div>
        </div>

        {/* Assets Section (Optional) */}
        <div className="section">
          <h4 className="text-gray-700 font-medium mb-4 flex items-center gap-2">
            <Home className="w-4 h-4" />
            Assets (Optional - For Inventory)
          </h4>
          
          <div className="space-y-2 mb-4">
            {formData.assets.map(asset => (
              <div key={asset.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex-1">
                  <span className="font-medium">{asset.description}</span>
                  <span className="ml-2 text-gray-600">
                    ({asset.type === 'real' ? 'Real Property' : 'Personal Property'})
                  </span>
                  <span className="ml-2 text-gray-700">{formatCurrency(asset.value)}</span>
                </div>
                <button
                  type="button"
                  onClick={() => removeAsset(asset.id)}
                  className="text-red-500 hover:text-red-700 p-2"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
          
          <div className="bg-gray-50 p-4 rounded-lg">
            <h5 className="text-sm font-medium text-gray-700 mb-3">Add Asset</h5>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label className="text-xs text-gray-600">Type</label>
                <select
                  value={newAsset.type}
                  onChange={(e) => setNewAsset({ ...newAsset, type: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                >
                  <option value="personal">Personal Property</option>
                  <option value="real">Real Property</option>
                </select>
              </div>
              <div>
                <label className="text-xs text-gray-600">Description</label>
                <input
                  type="text"
                  value={newAsset.description}
                  onChange={(e) => setNewAsset({ ...newAsset, description: e.target.value })}
                  placeholder="Asset description"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                />
              </div>
              <div>
                <label className="text-xs text-gray-600">Value</label>
                <input
                  type="number"
                  value={newAsset.value}
                  onChange={(e) => setNewAsset({ ...newAsset, value: e.target.value })}
                  placeholder="Value"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                />
              </div>
            </div>
            <button
              type="button"
              onClick={addAsset}
              className="mt-3 px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 flex items-center gap-2 text-sm"
            >
              <Plus className="w-4 h-4" />
              Add Asset
            </button>
          </div>
        </div>

        {/* Debts Section (Optional) */}
        <div className="section">
          <h4 className="text-gray-700 font-medium mb-4 flex items-center gap-2">
            <FileText className="w-4 h-4" />
            Debts and Liabilities (Optional)
          </h4>
          
          <div className="space-y-2 mb-4">
            {formData.debts.map(debt => (
              <div key={debt.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex-1">
                  <span className="font-medium">{debt.creditor}</span>
                  <span className="ml-2 text-gray-700">{formatCurrency(debt.amount)}</span>
                  {debt.description && (
                    <div className="text-sm text-gray-500">{debt.description}</div>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => removeDebt(debt.id)}
                  className="text-red-500 hover:text-red-700 p-2"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
          
          <div className="bg-gray-50 p-4 rounded-lg">
            <h5 className="text-sm font-medium text-gray-700 mb-3">Add Debt</h5>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label className="text-xs text-gray-600">Creditor</label>
                <input
                  type="text"
                  value={newDebt.creditor}
                  onChange={(e) => setNewDebt({ ...newDebt, creditor: e.target.value })}
                  placeholder="Creditor name"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                />
              </div>
              <div>
                <label className="text-xs text-gray-600">Amount</label>
                <input
                  type="number"
                  value={newDebt.amount}
                  onChange={(e) => setNewDebt({ ...newDebt, amount: e.target.value })}
                  placeholder="Amount owed"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                />
              </div>
              <div>
                <label className="text-xs text-gray-600">Description</label>
                <input
                  type="text"
                  value={newDebt.description}
                  onChange={(e) => setNewDebt({ ...newDebt, description: e.target.value })}
                  placeholder="Description (optional)"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                />
              </div>
            </div>
            <button
              type="button"
              onClick={addDebt}
              className="mt-3 px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 flex items-center gap-2 text-sm"
            >
              <Plus className="w-4 h-4" />
              Add Debt
            </button>
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex justify-end mt-8 gap-4">
          <button
            type="button"
            onClick={() => {
              if (window.confirm('Are you sure you want to clear all data?')) {
                setFormData({
                  decedentName: '',
                  dateOfDeath: '',
                  placeOfDeath: '',
                  deathAddress: '',
                  californiaResident: 'yes',
                  hasSpouse: 'no',
                  hasChildren: 'no',
                  hasGrandchildren: 'no',
                  petitionerName: client?.name || '',
                  petitionerRelationship: '',
                  petitionerAddress: client?.address || '',
                  petitionerPhone: client?.phone || '',
                  petitionerEmail: client?.email || '',
                  petitionerIsExecutor: 'no',
                  personalPropertyValue: '',
                  realPropertyGross: '',
                  realPropertyEncumbrance: '',
                  hasWill: false,
                  willDate: '',
                  willSelfProving: 'no',
                  executorNamedInWill: 'no',
                  caseNumber: '',
                  hearingDept: '',
                  hearingDate: '',
                  hearingTime: '',
                  adminType: 'full',
                  bondRequired: 'no',
                  bondAmount: '',
                  courtCounty: 'LOS ANGELES',
                  courtBranch: 'STANLEY MOSK COURTHOUSE',
                  attorneyName: 'ROZSA GYENE, ESQ.',
                  attorneyBar: '208356',
                  firmName: 'LAW OFFICES OF ROZSA GYENE',
                  firmStreet: '450 N BRAND BLVD SUITE 600',
                  firmCity: 'GLENDALE',
                  firmState: 'CA',
                  firmZip: '91203',
                  firmPhone: '818-291-6217',
                  firmFax: '818-291-6205',
                  firmEmail: 'ROZSAGYENELAW@YAHOO.COM',
                  heirs: [],
                  assets: [],
                  debts: []
                });
                toast.success('Form cleared');
              }
            }}
            className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600"
          >
            Clear Form
          </button>
          <button
            type="submit"
            className="px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 flex items-center gap-2"
          >
            <Save className="w-4 h-4" />
            Save Probate Information
          </button>
        </div>
      </form>
    </div>
  );
};

export default ProbateDataForm;
