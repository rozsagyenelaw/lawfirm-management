import React, { useState } from 'react';
import { User, UserCheck, Users, Home, Phone, Calendar, DollarSign, Building, FileText, AlertCircle, Plus, Trash2, Shield, Heart, Briefcase } from 'lucide-react';

const GuardianshipDataForm = ({ onSubmit, initialData = {} }) => {
  const [formData, setFormData] = useState({
    form_type: 'guardianship',
    
    // Petitioner Information
    petitioner_name: '',
    petitioner_relationship: '',
    petitioner_address: '',
    petitioner_phone: '',
    petitioner_is_guardian: '',
    
    // Guardian Information
    guardian_name: '',
    guardian_relationship: '',
    guardian_address: '',
    guardian_phone: '',
    guardian_dob: '',
    guardian_ssn: '',
    guardian_dl: '',
    guardian_state: 'CA',
    guardian_home_phone: '',
    guardian_work_phone: '',
    
    // Screening Questions (GC-212)
    related_to_minor: '',
    convicted_felony: '',
    arrested_drug_alcohol: '',
    convicted_misdemeanor_violence: '',
    domestic_violence_restraining: '',
    court_found_abused_child: '',
    court_found_abused_adult: '',
    under_conservatorship: '',
    financial_conflict: '',
    been_guardian_conservator_trustee: '',
    been_removed_as_guardian: '',
    minor_lives_with_you: '',
    
    // Guardianship Type
    guardianship_type: '',
    
    // Estate Information
    personal_property_value: '',
    real_property_value: '',
    bond_required: '',
    bond_amount: '',
    blocked_account: '',
    
    // Parents Information
    mother_name: '',
    mother_status: '',
    mother_address: '',
    father_name: '',
    father_status: '',
    father_address: '',
    guardianship_reason: '',
    
    // Powers Requested
    independent_powers: '',
    dispense_notice: '',
    
    // Hearing Information
    hearing_date: '',
    hearing_time: '09:00',
    hearing_dept: '',
    hearing_room: '',
    
    // Attorney Information (pre-filled)
    attorney_name: 'ROZSA GYENE, ESQ.',
    attorney_bar: '208356',
    firm_name: 'LAW OFFICES OF ROZSA GYENE',
    firm_street: '450 N BRAND BLVD SUITE 600',
    firm_city: 'GLENDALE',
    firm_state: 'CA',
    firm_zip: '91203',
    firm_phone: '818-291-6217',
    firm_fax: '818-291-6205',
    firm_email: 'ROZSAGYENELAW@YAHOO.COM',
    attorney_fees: '',
    fee_terms: 'forthwith',
    
    // Court Information
    court_county: 'LOS ANGELES',
    court_branch: 'STANLEY MOSK COURTHOUSE',
    case_number: '',
    
    ...initialData
  });

  // Minors list (separate state for dynamic minors)
  const [minors, setMinors] = useState(initialData.minors || [
    { id: 1, name: '', dob: '', address: '', school: '', school_phone: '', home_phone: '' }
  ]);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    
    // Auto-fill guardian info if petitioner is guardian
    if (name === 'petitioner_is_guardian' && value === 'yes') {
      setFormData(prev => ({
        ...prev,
        guardian_name: prev.petitioner_name,
        guardian_address: prev.petitioner_address,
        guardian_phone: prev.petitioner_phone
      }));
    }
  };

  const handleMinorChange = (index, field, value) => {
    setMinors(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const addMinor = () => {
    setMinors(prev => [...prev, {
      id: prev.length + 1,
      name: '',
      dob: '',
      address: '',
      school: '',
      school_phone: '',
      home_phone: ''
    }]);
  };

  const removeMinor = (index) => {
    if (minors.length > 1) {
      setMinors(prev => prev.filter((_, i) => i !== index));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Prepare minors data as formatted string
    const minors_list = minors
      .filter(m => m.name && m.dob)
      .map(m => `${m.name},${m.dob},${m.address},${m.school || ''}`)
      .join('\n');
    
    const finalData = {
      ...formData,
      minors_list,
      minors // Keep the array format too for reference
    };
    
    onSubmit(finalData);
  };

  return (
    <div className="probate-data-form">
      <form onSubmit={handleSubmit}>
        <div className="flex justify-between items-center mb-6">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Guardianship Information</h3>
            <p className="text-sm text-gray-500 mt-1">Complete all required fields for guardianship petition</p>
          </div>
          <span className="category-badge guardianship">Guardianship</span>
        </div>

        {/* Petitioner Information Section */}
        <div className="section">
          <h4 className="text-gray-700 font-medium mb-4 flex items-center gap-2">
            <User className="w-4 h-4" />
            Petitioner Information
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="petitioner_name">
                Petitioner Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="petitioner_name"
                name="petitioner_name"
                value={formData.petitioner_name}
                onChange={handleInputChange}
                required
                placeholder="Enter full name"
              />
            </div>
            <div>
              <label htmlFor="petitioner_relationship">
                Relationship to Minor <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="petitioner_relationship"
                name="petitioner_relationship"
                value={formData.petitioner_relationship}
                onChange={handleInputChange}
                required
                placeholder="e.g., Grandparent, Aunt, Uncle"
              />
            </div>
            <div>
              <label htmlFor="petitioner_address">
                Petitioner Address <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="petitioner_address"
                name="petitioner_address"
                value={formData.petitioner_address}
                onChange={handleInputChange}
                required
                placeholder="Full address"
              />
            </div>
            <div>
              <label htmlFor="petitioner_phone">
                Petitioner Phone <span className="text-red-500">*</span>
              </label>
              <input
                type="tel"
                id="petitioner_phone"
                name="petitioner_phone"
                value={formData.petitioner_phone}
                onChange={handleInputChange}
                required
                placeholder="(xxx) xxx-xxxx"
              />
            </div>
            <div className="md:col-span-2">
              <label>Are you the proposed guardian?</label>
              <div className="flex gap-4 mt-2">
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="petitioner_is_guardian"
                    value="yes"
                    checked={formData.petitioner_is_guardian === 'yes'}
                    onChange={handleInputChange}
                  />
                  <span className="ml-2">Yes</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="petitioner_is_guardian"
                    value="no"
                    checked={formData.petitioner_is_guardian === 'no'}
                    onChange={handleInputChange}
                  />
                  <span className="ml-2">No</span>
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* Minor Information Section */}
        <div className="section">
          <h4 className="text-gray-700 font-medium mb-4 flex items-center gap-2">
            <UserCheck className="w-4 h-4" />
            Minor Information
          </h4>
          {minors.map((minor, index) => (
            <div key={minor.id} className="bg-gray-50 p-4 rounded-lg mb-4">
              <div className="flex justify-between items-center mb-4">
                <h5 className="text-sm font-medium text-gray-700">Minor #{index + 1}</h5>
                {minors.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeMinor(index)}
                    className="flex items-center gap-1 px-3 py-1 text-red-600 hover:bg-red-50 rounded-md text-sm"
                  >
                    <Trash2 className="w-4 h-4" />
                    Remove
                  </button>
                )}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label>
                    Full Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={minor.name}
                    onChange={(e) => handleMinorChange(index, 'name', e.target.value)}
                    required
                    placeholder="Minor's full legal name"
                  />
                </div>
                <div>
                  <label>
                    Date of Birth <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={minor.dob}
                    onChange={(e) => handleMinorChange(index, 'dob', e.target.value)}
                    required
                  />
                </div>
                <div className="md:col-span-2">
                  <label>
                    Current Address <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={minor.address}
                    onChange={(e) => handleMinorChange(index, 'address', e.target.value)}
                    required
                    placeholder="Where the minor currently lives"
                  />
                </div>
                <div>
                  <label>School Name</label>
                  <input
                    type="text"
                    value={minor.school}
                    onChange={(e) => handleMinorChange(index, 'school', e.target.value)}
                    placeholder="Current school"
                  />
                </div>
                <div>
                  <label>School Phone</label>
                  <input
                    type="tel"
                    value={minor.school_phone}
                    onChange={(e) => handleMinorChange(index, 'school_phone', e.target.value)}
                    placeholder="(xxx) xxx-xxxx"
                  />
                </div>
                <div>
                  <label>Home Phone</label>
                  <input
                    type="tel"
                    value={minor.home_phone}
                    onChange={(e) => handleMinorChange(index, 'home_phone', e.target.value)}
                    placeholder="(xxx) xxx-xxxx"
                  />
                </div>
              </div>
            </div>
          ))}
          <button
            type="button"
            onClick={addMinor}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            <Plus className="w-4 h-4" />
            Add Another Minor
          </button>
        </div>

        {/* Guardian Information Section */}
        <div className="section">
          <h4 className="text-gray-700 font-medium mb-4 flex items-center gap-2">
            <Shield className="w-4 h-4" />
            Proposed Guardian Information
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="guardian_name">
                Guardian Full Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="guardian_name"
                name="guardian_name"
                value={formData.guardian_name}
                onChange={handleInputChange}
                required
                disabled={formData.petitioner_is_guardian === 'yes'}
                className={formData.petitioner_is_guardian === 'yes' ? 'bg-gray-100' : ''}
                placeholder="Enter full legal name"
              />
            </div>
            <div>
              <label htmlFor="guardian_relationship">
                Relationship to Minor <span className="text-red-500">*</span>
              </label>
              <select
                id="guardian_relationship"
                name="guardian_relationship"
                value={formData.guardian_relationship}
                onChange={handleInputChange}
                required
              >
                <option value="">Select...</option>
                <option value="Parent">Parent</option>
                <option value="Grandparent">Grandparent</option>
                <option value="Aunt">Aunt</option>
                <option value="Uncle">Uncle</option>
                <option value="Sibling">Sibling</option>
                <option value="Step-parent">Step-parent</option>
                <option value="Family Friend">Family Friend</option>
                <option value="Other Relative">Other Relative</option>
                <option value="Non-relative">Non-relative</option>
              </select>
            </div>
            <div>
              <label htmlFor="guardian_address">
                Guardian Address <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="guardian_address"
                name="guardian_address"
                value={formData.guardian_address}
                onChange={handleInputChange}
                required
                disabled={formData.petitioner_is_guardian === 'yes'}
                className={formData.petitioner_is_guardian === 'yes' ? 'bg-gray-100' : ''}
                placeholder="Full address"
              />
            </div>
            <div>
              <label htmlFor="guardian_phone">
                Guardian Phone <span className="text-red-500">*</span>
              </label>
              <input
                type="tel"
                id="guardian_phone"
                name="guardian_phone"
                value={formData.guardian_phone}
                onChange={handleInputChange}
                required
                disabled={formData.petitioner_is_guardian === 'yes'}
                className={formData.petitioner_is_guardian === 'yes' ? 'bg-gray-100' : ''}
                placeholder="(xxx) xxx-xxxx"
              />
            </div>
            <div>
              <label htmlFor="guardian_dob">
                Guardian Date of Birth <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                id="guardian_dob"
                name="guardian_dob"
                value={formData.guardian_dob}
                onChange={handleInputChange}
                required
              />
            </div>
            <div>
              <label htmlFor="guardian_ssn">
                Social Security Number <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="guardian_ssn"
                name="guardian_ssn"
                value={formData.guardian_ssn}
                onChange={handleInputChange}
                required
                placeholder="XXX-XX-XXXX"
              />
            </div>
            <div>
              <label htmlFor="guardian_dl">
                Driver's License Number
              </label>
              <input
                type="text"
                id="guardian_dl"
                name="guardian_dl"
                value={formData.guardian_dl}
                onChange={handleInputChange}
                placeholder="License number"
              />
            </div>
            <div>
              <label htmlFor="guardian_state">
                State
              </label>
              <input
                type="text"
                id="guardian_state"
                name="guardian_state"
                value={formData.guardian_state}
                onChange={handleInputChange}
                placeholder="CA"
              />
            </div>
            <div>
              <label htmlFor="guardian_home_phone">
                Home Phone
              </label>
              <input
                type="tel"
                id="guardian_home_phone"
                name="guardian_home_phone"
                value={formData.guardian_home_phone}
                onChange={handleInputChange}
                placeholder="(xxx) xxx-xxxx"
              />
            </div>
            <div>
              <label htmlFor="guardian_work_phone">
                Work Phone
              </label>
              <input
                type="tel"
                id="guardian_work_phone"
                name="guardian_work_phone"
                value={formData.guardian_work_phone}
                onChange={handleInputChange}
                placeholder="(xxx) xxx-xxxx"
              />
            </div>
          </div>
        </div>

        {/* Background Screening (GC-212) Section */}
        <div className="section bg-yellow-50">
          <h4 className="text-gray-700 font-medium mb-4 flex items-center gap-2">
            <AlertCircle className="w-4 h-4" />
            Background Screening (Confidential - Required for GC-212)
          </h4>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
            <p className="text-sm text-blue-700 flex items-center gap-2">
              <AlertCircle className="w-4 h-4" />
              This information is required by the court and will be kept confidential. Answer all questions truthfully.
            </p>
          </div>
          <div className="space-y-4">
            {[
              { name: 'related_to_minor', label: 'Are you related to the minor?' },
              { name: 'convicted_felony', label: 'Have you been convicted of a felony?' },
              { name: 'arrested_drug_alcohol', label: 'Have you been arrested for drug or alcohol-related offenses?' },
              { name: 'convicted_misdemeanor_violence', label: 'Have you been convicted of a misdemeanor involving violence?' },
              { name: 'domestic_violence_restraining', label: 'Are you subject to a domestic violence restraining order?' },
              { name: 'court_found_abused_child', label: 'Have you been found by a court to have abused or neglected a child?' },
              { name: 'court_found_abused_adult', label: 'Have you been found by a court to have abused or neglected a dependent adult?' },
              { name: 'under_conservatorship', label: 'Are you under a conservatorship?' },
              { name: 'financial_conflict', label: 'Do you have a financial conflict of interest?' },
              { name: 'been_guardian_conservator_trustee', label: 'Have you been a guardian, conservator, or trustee before?' },
              { name: 'been_removed_as_guardian', label: 'Have you been removed as a guardian, conservator, or trustee?' },
              { name: 'minor_lives_with_you', label: 'Does the minor currently live with you?' }
            ].map(question => (
              <div key={question.name}>
                <label>{question.label} <span className="text-red-500">*</span></label>
                <div className="flex gap-4 mt-2">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name={question.name}
                      value="yes"
                      checked={formData[question.name] === 'yes'}
                      onChange={handleInputChange}
                      required
                    />
                    <span className="ml-2">Yes</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name={question.name}
                      value="no"
                      checked={formData[question.name] === 'no'}
                      onChange={handleInputChange}
                      required
                    />
                    <span className="ml-2">No</span>
                  </label>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Type of Guardianship Section */}
        <div className="section">
          <h4 className="text-gray-700 font-medium mb-4 flex items-center gap-2">
            <FileText className="w-4 h-4" />
            Type of Guardianship
          </h4>
          <div>
            <label htmlFor="guardianship_type">
              What type of guardianship are you requesting? <span className="text-red-500">*</span>
            </label>
            <select
              id="guardianship_type"
              name="guardianship_type"
              value={formData.guardianship_type}
              onChange={handleInputChange}
              required
            >
              <option value="">Select...</option>
              <option value="person">Guardianship of the Person Only</option>
              <option value="estate">Guardianship of the Estate Only</option>
              <option value="both">Both Person and Estate</option>
            </select>
            <p className="text-xs text-gray-500 mt-2">
              Person = custody and care decisions. Estate = financial decisions.
            </p>
          </div>
        </div>

        {/* Estate Information Section */}
        <div className="section">
          <h4 className="text-gray-700 font-medium mb-4 flex items-center gap-2">
            <DollarSign className="w-4 h-4" />
            Minor's Estate Information
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="personal_property_value">
                Personal Property Value
              </label>
              <input
                type="number"
                id="personal_property_value"
                name="personal_property_value"
                value={formData.personal_property_value}
                onChange={handleInputChange}
                placeholder="0"
              />
              <p className="text-xs text-gray-500 mt-1">Bank accounts, stocks, vehicles, etc.</p>
            </div>
            <div>
              <label htmlFor="real_property_value">
                Real Property Value
              </label>
              <input
                type="number"
                id="real_property_value"
                name="real_property_value"
                value={formData.real_property_value}
                onChange={handleInputChange}
                placeholder="0"
              />
              <p className="text-xs text-gray-500 mt-1">Real estate owned by minor</p>
            </div>
            <div>
              <label>Is bond required?</label>
              <div className="flex gap-4 mt-2">
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="bond_required"
                    value="yes"
                    checked={formData.bond_required === 'yes'}
                    onChange={handleInputChange}
                  />
                  <span className="ml-2">Yes</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="bond_required"
                    value="no"
                    checked={formData.bond_required === 'no'}
                    onChange={handleInputChange}
                  />
                  <span className="ml-2">No</span>
                </label>
              </div>
            </div>
            <div>
              <label htmlFor="bond_amount">
                Bond Amount (if required)
              </label>
              <input
                type="number"
                id="bond_amount"
                name="bond_amount"
                value={formData.bond_amount}
                onChange={handleInputChange}
                placeholder="0"
              />
            </div>
            <div>
              <label htmlFor="blocked_account">
                Blocked Account Amount
              </label>
              <input
                type="number"
                id="blocked_account"
                name="blocked_account"
                value={formData.blocked_account}
                onChange={handleInputChange}
                placeholder="0"
              />
              <p className="text-xs text-gray-500 mt-1">Amount to be placed in blocked account</p>
            </div>
          </div>
        </div>

        {/* Parents Information Section */}
        <div className="section">
          <h4 className="text-gray-700 font-medium mb-4 flex items-center gap-2">
            <Heart className="w-4 h-4" />
            Parents Information
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="mother_name">
                Mother's Name
              </label>
              <input
                type="text"
                id="mother_name"
                name="mother_name"
                value={formData.mother_name}
                onChange={handleInputChange}
                placeholder="Full name"
              />
            </div>
            <div>
              <label htmlFor="mother_status">
                Mother's Status
              </label>
              <select
                id="mother_status"
                name="mother_status"
                value={formData.mother_status}
                onChange={handleInputChange}
              >
                <option value="">Select...</option>
                <option value="Living">Living</option>
                <option value="Deceased">Deceased</option>
                <option value="Unknown">Unknown</option>
                <option value="Whereabouts Unknown">Whereabouts Unknown</option>
              </select>
            </div>
            <div className="md:col-span-2">
              <label htmlFor="mother_address">
                Mother's Address (if living)
              </label>
              <input
                type="text"
                id="mother_address"
                name="mother_address"
                value={formData.mother_address}
                onChange={handleInputChange}
                placeholder="Current address"
              />
            </div>
            <div>
              <label htmlFor="father_name">
                Father's Name
              </label>
              <input
                type="text"
                id="father_name"
                name="father_name"
                value={formData.father_name}
                onChange={handleInputChange}
                placeholder="Full name"
              />
            </div>
            <div>
              <label htmlFor="father_status">
                Father's Status
              </label>
              <select
                id="father_status"
                name="father_status"
                value={formData.father_status}
                onChange={handleInputChange}
              >
                <option value="">Select...</option>
                <option value="Living">Living</option>
                <option value="Deceased">Deceased</option>
                <option value="Unknown">Unknown</option>
                <option value="Whereabouts Unknown">Whereabouts Unknown</option>
              </select>
            </div>
            <div className="md:col-span-2">
              <label htmlFor="father_address">
                Father's Address (if living)
              </label>
              <input
                type="text"
                id="father_address"
                name="father_address"
                value={formData.father_address}
                onChange={handleInputChange}
                placeholder="Current address"
              />
            </div>
            <div className="md:col-span-2">
              <label htmlFor="guardianship_reason">
                Reason for Guardianship <span className="text-red-500">*</span>
              </label>
              <textarea
                id="guardianship_reason"
                name="guardianship_reason"
                value={formData.guardianship_reason}
                onChange={handleInputChange}
                required
                rows="4"
                placeholder="Explain why guardianship is necessary (e.g., parents deceased, unable to care for child, etc.)"
              />
            </div>
          </div>
        </div>

        {/* Powers Requested Section */}
        <div className="section">
          <h4 className="text-gray-700 font-medium mb-4 flex items-center gap-2">
            <Briefcase className="w-4 h-4" />
            Powers Requested
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label>Are you requesting independent powers?</label>
              <div className="flex gap-4 mt-2">
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="independent_powers"
                    value="yes"
                    checked={formData.independent_powers === 'yes'}
                    onChange={handleInputChange}
                  />
                  <span className="ml-2">Yes</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="independent_powers"
                    value="no"
                    checked={formData.independent_powers === 'no'}
                    onChange={handleInputChange}
                  />
                  <span className="ml-2">No</span>
                </label>
              </div>
              <p className="text-xs text-gray-500 mt-2">
                Independent powers allow certain actions without court approval
              </p>
            </div>
            <div>
              <label>Do you want to dispense with notice to any relatives?</label>
              <div className="flex gap-4 mt-2">
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="dispense_notice"
                    value="yes"
                    checked={formData.dispense_notice === 'yes'}
                    onChange={handleInputChange}
                  />
                  <span className="ml-2">Yes</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="dispense_notice"
                    value="no"
                    checked={formData.dispense_notice === 'no'}
                    onChange={handleInputChange}
                  />
                  <span className="ml-2">No</span>
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* Hearing Information Section */}
        <div className="section">
          <h4 className="text-gray-700 font-medium mb-4 flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            Hearing Information
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="hearing_date">
                Requested Hearing Date
              </label>
              <input
                type="date"
                id="hearing_date"
                name="hearing_date"
                value={formData.hearing_date}
                onChange={handleInputChange}
              />
              <p className="text-xs text-gray-500 mt-1">Leave blank for court to assign</p>
            </div>
            <div>
              <label htmlFor="hearing_time">
                Preferred Time
              </label>
              <input
                type="time"
                id="hearing_time"
                name="hearing_time"
                value={formData.hearing_time}
                onChange={handleInputChange}
              />
            </div>
            <div>
              <label htmlFor="hearing_dept">
                Department
              </label>
              <input
                type="text"
                id="hearing_dept"
                name="hearing_dept"
                value={formData.hearing_dept}
                onChange={handleInputChange}
                placeholder="Will be assigned by court"
              />
            </div>
            <div>
              <label htmlFor="hearing_room">
                Room
              </label>
              <input
                type="text"
                id="hearing_room"
                name="hearing_room"
                value={formData.hearing_room}
                onChange={handleInputChange}
                placeholder="Will be assigned by court"
              />
            </div>
          </div>
        </div>

        {/* Court Information Section */}
        <div className="section">
          <h4 className="text-gray-700 font-medium mb-4 flex items-center gap-2">
            <Building className="w-4 h-4" />
            Court Information
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label htmlFor="court_county">
                County <span className="text-red-500">*</span>
              </label>
              <select
                id="court_county"
                name="court_county"
                value={formData.court_county}
                onChange={handleInputChange}
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
              <label htmlFor="court_branch">
                Court Branch
              </label>
              <input
                type="text"
                id="court_branch"
                name="court_branch"
                value={formData.court_branch}
                onChange={handleInputChange}
                placeholder="Branch name"
              />
            </div>
            <div>
              <label htmlFor="case_number">
                Case Number (if known)
              </label>
              <input
                type="text"
                id="case_number"
                name="case_number"
                value={formData.case_number}
                onChange={handleInputChange}
                placeholder="Leave blank if new case"
              />
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex justify-end mt-8">
          <button
            type="submit"
            className="px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700"
          >
            Generate Forms
          </button>
        </div>
      </form>
    </div>
  );
};

export default GuardianshipDataForm;
