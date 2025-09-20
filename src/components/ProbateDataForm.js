// src/components/ProbateDataForm.js
import React, { useState, useEffect } from 'react';
import { Save, Plus, Trash2, User, Users, DollarSign, FileText, Gavel, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';

const ProbateDataForm = ({ client, onSave }) => {
  const [formData, setFormData] = useState({
    // Decedent Information
    decedentName: '',
    deathDate: '',
    deathPlace: '',
    deathAddress: '',
    deathResident: 'yes',
    
    // Family Information
    hasSpouse: 'no',
    hasChildren: 'no',
    hasGrandchildren: 'no',
    
    // Petitioner Information
    petitionerName: client?.name || '',
    petitionerRelationship: '',
    petitionerAddress: client?.address || '',
    petitionerPhone: client?.phone || '',
    petitionerIsExecutor: 'no',
    
    // Estate Information
    personalPropertyValue: '',
    realPropertyGross: '',
    realPropertyEncumbrance: '',
    hasWill: 'no',
    willDate: '',
    willSelfProving: 'no',
    executorNamedInWill: 'no',
    
    // Administration Details
    adminType: 'full',
    bondRequired: 'no',
    bondAmount: '',
    
    // Court Information
    courtCounty: 'LOS ANGELES',
    courtBranch: 'STANLEY MOSK COURTHOUSE',
    
    // Heirs array
    heirs: []
  });

  const [heirCount, setHeirCount] = useState(0);

  // Load saved data from localStorage if exists
  useEffect(() => {
    if (client?.id) {
      const savedData = localStorage.getItem(`probate_data_${client.id}`);
      if (savedData) {
        const parsed = JSON.parse(savedData);
        setFormData(parsed);
        // Set heir count based on loaded heirs
        if (parsed.heirs && parsed.heirs.length > 0) {
          setHeirCount(Math.max(...parsed.heirs.map(h => h.id || 0)));
        }
      }
    }
    // Add at least one heir field by default if none exist
    if (formData.heirs.length === 0) {
      addHeir();
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
    // Validate required fields
    const requiredFields = ['decedentName', 'deathDate', 'deathPlace', 'deathAddress', 
                          'petitionerName', 'petitionerRelationship', 'petitionerAddress', 
                          'petitionerPhone', 'personalPropertyValue'];
    
    const missingFields = requiredFields.filter(field => !formData[field]);
    
    if (missingFields.length > 0) {
      toast.error('Please fill in all required fields');
      return;
    }

    // Validate at least one heir
    const validHeirs = formData.heirs.filter(h => h.name && h.relationship && h.address);
    if (validHeirs.length === 0) {
      toast.error('Please add at least one heir/beneficiary with complete information');
      return;
    }

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

  // Heir management functions
  const addHeir = (name = '', relationship = '', age = '', address = '') => {
    const newHeirCount = heirCount + 1;
    setHeirCount(newHeirCount);
    
    const newHeir = {
      id: newHeirCount,
      name: name,
      relationship: relationship,
      age: age,
      address: address
    };
    
    setFormData(prev => ({
      ...prev,
      heirs: [...prev.heirs, newHeir]
    }));
  };

  const removeHeir = (id) => {
    if (formData.heirs.length > 1) {
      setFormData(prev => ({
        ...prev,
        heirs: prev.heirs.filter(h => h.id !== id)
      }));
    } else {
      toast.error('At least one heir/beneficiary is required');
    }
  };

  const updateHeir = (id, field, value) => {
    setFormData(prev => ({
      ...prev,
      heirs: prev.heirs.map(h => 
        h.id === id ? { ...h, [field]: value } : h
      )
    }));
  };

  const toggleWillFields = () => {
    return formData.hasWill === 'yes';
  };

  const toggleBondAmount = () => {
    return formData.bondRequired === 'yes';
  };

  const fillTestData = () => {
    setFormData({
      decedentName: 'John Michael Smith',
      deathDate: '2024-01-15',
      deathPlace: 'Los Angeles, CA',
      deathAddress: '123 Main Street, Los Angeles, CA 90001',
      deathResident: 'yes',
      hasSpouse: 'yes',
      hasChildren: 'yes',
      hasGrandchildren: 'no',
      petitionerName: 'Jane Smith',
      petitionerRelationship: 'Spouse',
      petitionerAddress: '123 Main Street, Los Angeles, CA 90001',
      petitionerPhone: '(555) 123-4567',
      petitionerIsExecutor: 'yes',
      personalPropertyValue: '150000',
      realPropertyGross: '500000',
      realPropertyEncumbrance: '200000',
      hasWill: 'yes',
      willDate: '2020-01-01',
      willSelfProving: 'yes',
      executorNamedInWill: 'yes',
      adminType: 'full',
      bondRequired: 'no',
      bondAmount: '',
      courtCounty: 'LOS ANGELES',
      courtBranch: 'STANLEY MOSK COURTHOUSE',
      heirs: []
    });
    
    // Clear and add test heirs
    setHeirCount(0);
    addHeir('Jane Smith', 'Spouse', '55', '123 Main St Los Angeles CA 90001');
    addHeir('Michael Smith Jr', 'Son', '30', '456 Oak Ave Los Angeles CA 90002');
    addHeir('Sarah Smith', 'Daughter', '28', '789 Pine St Los Angeles CA 90003');
    addHeir('The John Rude Living Trust', 'Trust', 'N/A', '321 Trust Way Los Angeles CA 90004');
    
    toast.success('Form filled with test data!');
  };

  return (
    <div className="probate-data-form bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-xl font-semibold text-gray-900">
          California Probate Forms Generator
        </h3>
        <div className="flex gap-2">
          <button
            onClick={fillTestData}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2"
          >
            <FileText size={18} />
            Fill Test Data
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
          >
            <Save size={18} />
            Save Data
          </button>
        </div>
      </div>

      {/* Decedent Information */}
      <div className="section mb-6 p-4 bg-gray-50 rounded-lg">
        <h4 className="text-md font-semibold text-gray-800 mb-4 flex items-center gap-2">
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
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Date of Death <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              name="deathDate"
              value={formData.deathDate}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Place of Death <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="deathPlace"
              value={formData.deathPlace}
              onChange={handleChange}
              placeholder="City, State"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              California Resident? <span className="text-red-500">*</span>
            </label>
            <select
              name="deathResident"
              value={formData.deathResident}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
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
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </div>
        </div>
      </div>

      {/* Family Information */}
      <div className="section mb-6 p-4 bg-gray-50 rounded-lg">
        <h4 className="text-md font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <Users size={18} />
          Family Information
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Was decedent survived by a spouse? <span className="text-red-500">*</span>
            </label>
            <select
              name="hasSpouse"
              value={formData.hasSpouse}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
            >
              <option value="yes">Yes</option>
              <option value="no">No</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Was decedent survived by children? <span className="text-red-500">*</span>
            </label>
            <select
              name="hasChildren"
              value={formData.hasChildren}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
            >
              <option value="yes">Yes</option>
              <option value="no">No</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Survived by grandchildren? <span className="text-red-500">*</span>
            </label>
            <select
              name="hasGrandchildren"
              value={formData.hasGrandchildren}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
            >
              <option value="yes">Yes</option>
              <option value="no">No</option>
            </select>
          </div>
        </div>
      </div>

      {/* Petitioner Information */}
      <div className="section mb-6 p-4 bg-gray-50 rounded-lg">
        <h4 className="text-md font-semibold text-gray-800 mb-4 flex items-center gap-2">
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
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
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
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Address <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="petitionerAddress"
              value={formData.petitionerAddress}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
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
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Is Petitioner Named as Executor in Will?
            </label>
            <select
              name="petitionerIsExecutor"
              value={formData.petitionerIsExecutor}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="yes">Yes</option>
              <option value="no">No</option>
            </select>
          </div>
        </div>
      </div>

      {/* Estate Information */}
      <div className="section mb-6 p-4 bg-gray-50 rounded-lg">
        <h4 className="text-md font-semibold text-gray-800 mb-4 flex items-center gap-2">
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
              placeholder="Enter amount without $"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
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
              placeholder="Enter amount without $"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
              placeholder="Enter amount without $"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            <span className="text-xs text-gray-500">Mortgages/liens on real estate</span>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Is There a Will? <span className="text-red-500">*</span>
            </label>
            <select
              name="hasWill"
              value={formData.hasWill}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
            >
              <option value="yes">Yes</option>
              <option value="no">No</option>
            </select>
          </div>
          
          {toggleWillFields() && (
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
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Is Will Self-Proving? <span className="text-red-500">*</span>
                </label>
                <select
                  name="willSelfProving"
                  value={formData.willSelfProving}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="yes">Yes</option>
                  <option value="no">No</option>
                </select>
                <span className="text-xs text-gray-500">A self-proving will includes notarized witness affidavits</span>
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Is there an executor named in the will? <span className="text-red-500">*</span>
                </label>
                <select
                  name="executorNamedInWill"
                  value={formData.executorNamedInWill}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="yes">Yes</option>
                  <option value="no">No</option>
                </select>
                <span className="text-xs text-gray-500">Check the will to see if it names someone as executor</span>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Heirs and Beneficiaries */}
      <div className="section mb-6 p-4 bg-gray-50 rounded-lg">
        <h4 className="text-md font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <Users size={18} />
          Heirs and Beneficiaries
        </h4>
        
        <div className="space-y-3 mb-4">
          {formData.heirs.map((heir, index) => (
            <div key={heir.id} className="bg-white border border-gray-200 rounded-lg p-4">
              <div className="flex justify-between items-center mb-3">
                <span className="font-semibold text-gray-700">Heir/Beneficiary #{index + 1}</span>
                {formData.heirs.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeHeir(heir.id)}
                    className="text-red-500 hover:text-red-700"
                  >
                    <Trash2 size={18} />
                  </button>
                )}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={heir.name}
                    onChange={(e) => updateHeir(heir.id, 'name', e.target.value)}
                    placeholder="e.g., Jane Smith or The John Rude Living Trust"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Relationship <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={heir.relationship}
                    onChange={(e) => updateHeir(heir.id, 'relationship', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
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
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Age
                  </label>
                  <input
                    type="text"
                    value={heir.age}
                    onChange={(e) => updateHeir(heir.id, 'age', e.target.value)}
                    placeholder="Enter age or N/A for trusts"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Address <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={heir.address}
                    onChange={(e) => updateHeir(heir.id, 'address', e.target.value)}
                    placeholder="e.g., 123 Main St Los Angeles CA 90001"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
        
        <button
          type="button"
          onClick={() => addHeir()}
          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2"
        >
          <Plus size={18} />
          Add Heir/Beneficiary
        </button>
        <p className="text-xs text-gray-500 mt-2 flex items-center gap-1">
          <AlertCircle size={14} />
          Include all heirs, beneficiaries, and anyone named in the will. For trusts, use "N/A" for age.
        </p>
      </div>

      {/* Administration Details */}
      <div className="section mb-6 p-4 bg-gray-50 rounded-lg">
        <h4 className="text-md font-semibold text-gray-800 mb-4 flex items-center gap-2">
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
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
            >
              <option value="">Select...</option>
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
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
            >
              <option value="yes">Yes</option>
              <option value="no">No</option>
            </select>
          </div>
          {toggleBondAmount() && (
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Bond Amount
              </label>
              <input
                type="number"
                name="bondAmount"
                value={formData.bondAmount}
                onChange={handleChange}
                placeholder="Enter amount without $"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          )}
        </div>
      </div>

      {/* Court Information */}
      <div className="section mb-6 p-4 bg-gray-50 rounded-lg">
        <h4 className="text-md font-semibold text-gray-800 mb-4 flex items-center gap-2">
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
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex justify-end gap-4 mt-8 pt-4 border-t border-gray-200">
        <button
          type="button"
          onClick={handleSave}
          className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2 font-medium shadow-sm"
        >
          <Save size={20} />
          Save Probate Information
        </button>
      </div>
    </div>
  );
};

export default ProbateDataForm;
