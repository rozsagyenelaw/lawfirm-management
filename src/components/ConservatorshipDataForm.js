import React, { useState } from 'react';
import { User, UserCheck, Scale, Heart, DollarSign, Building, Calendar, Briefcase, AlertCircle, FileText, Users, Phone, Home, Hash } from 'lucide-react';

const ConservatorshipDataForm = ({ onSubmit, initialData = {} }) => {
  const [formData, setFormData] = useState({
    form_type: 'conservatorship',
    
    // Petitioner Information
    cons_petitioner_name: '',
    cons_petitioner_relationship: '',
    cons_petitioner_address: '',
    cons_petitioner_phone: '',
    
    // Proposed Conservatee Information
    conservatee_name: '',
    conservatee_dob: '',
    conservatee_address: '',
    conservatee_phone: '',
    conservatee_ssn: '',
    conservatee_living: '',
    
    // Proposed Conservator Information
    conservator_name: '',
    conservator_relationship: '',
    conservator_address: '',
    conservator_phone: '',
    conservator_dob: '',
    conservator_ssn: '',
    
    // Relatives Information (for notice requirements)
    spouse_name: '',
    spouse_address: '',
    children_info: '',
    parents_info: '',
    siblings_info: '',
    
    // Type of Conservatorship
    conservatorship_type: '',
    
    // Conservatee's Capacity
    conservatorship_reason: '',
    personal_needs: '',
    financial_management: '',
    medical_diagnosis: '',
    alternatives_considered: '',
    alternatives_explanation: '',
    
    // Estate Information
    conservatee_personal_property: '',
    conservatee_real_property: '',
    conservatee_income: '',
    conservatee_expenses: '',
    
    // Powers Requested
    cons_independent_powers: '',
    
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

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <div className="probate-data-form">
      <form onSubmit={handleSubmit}>
        <div className="flex justify-between items-center mb-6">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Conservatorship Information</h3>
            <p className="text-sm text-gray-500 mt-1">Complete all required fields for conservatorship petition</p>
          </div>
          <span className="category-badge conservatorship">Conservatorship</span>
        </div>

        {/* Petitioner Information Section */}
        <div className="section">
          <h4 className="text-gray-700 font-medium mb-4 flex items-center gap-2">
            <User className="w-4 h-4" />
            Petitioner Information
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="cons_petitioner_name">
                Petitioner Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="cons_petitioner_name"
                name="cons_petitioner_name"
                value={formData.cons_petitioner_name}
                onChange={handleInputChange}
                required
                placeholder="Enter full name"
              />
            </div>
            <div>
              <label htmlFor="cons_petitioner_relationship">
                Relationship to Conservatee <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="cons_petitioner_relationship"
                name="cons_petitioner_relationship"
                value={formData.cons_petitioner_relationship}
                onChange={handleInputChange}
                required
                placeholder="e.g., Son, Daughter, Friend"
              />
            </div>
            <div>
              <label htmlFor="cons_petitioner_address">
                Petitioner Address <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="cons_petitioner_address"
                name="cons_petitioner_address"
                value={formData.cons_petitioner_address}
                onChange={handleInputChange}
                required
                placeholder="Full address"
              />
            </div>
            <div>
              <label htmlFor="cons_petitioner_phone">
                Petitioner Phone <span className="text-red-500">*</span>
              </label>
              <input
                type="tel"
                id="cons_petitioner_phone"
                name="cons_petitioner_phone"
                value={formData.cons_petitioner_phone}
                onChange={handleInputChange}
                required
                placeholder="(xxx) xxx-xxxx"
              />
            </div>
          </div>
        </div>

        {/* Proposed Conservatee Information Section */}
        <div className="section">
          <h4 className="text-gray-700 font-medium mb-4 flex items-center gap-2">
            <UserCheck className="w-4 h-4" />
            Proposed Conservatee Information
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="conservatee_name">
                Full Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="conservatee_name"
                name="conservatee_name"
                value={formData.conservatee_name}
                onChange={handleInputChange}
                required
                placeholder="Enter full legal name"
              />
            </div>
            <div>
              <label htmlFor="conservatee_dob">
                Date of Birth <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                id="conservatee_dob"
                name="conservatee_dob"
                value={formData.conservatee_dob}
                onChange={handleInputChange}
                required
              />
            </div>
            <div>
              <label htmlFor="conservatee_address">
                Current Address <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="conservatee_address"
                name="conservatee_address"
                value={formData.conservatee_address}
                onChange={handleInputChange}
                required
                placeholder="Current residence or facility"
              />
            </div>
            <div>
              <label htmlFor="conservatee_phone">
                Phone Number
              </label>
              <input
                type="tel"
                id="conservatee_phone"
                name="conservatee_phone"
                value={formData.conservatee_phone}
                onChange={handleInputChange}
                placeholder="If available"
              />
            </div>
            <div>
              <label htmlFor="conservatee_ssn">
                Social Security Number <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="conservatee_ssn"
                name="conservatee_ssn"
                value={formData.conservatee_ssn}
                onChange={handleInputChange}
                required
                placeholder="XXX-XX-XXXX"
              />
            </div>
            <div>
              <label htmlFor="conservatee_living">
                Current Living Situation <span className="text-red-500">*</span>
              </label>
              <select
                id="conservatee_living"
                name="conservatee_living"
                value={formData.conservatee_living}
                onChange={handleInputChange}
                required
              >
                <option value="">Select...</option>
                <option value="Own Home">Own Home</option>
                <option value="Family Home">Family Home</option>
                <option value="Assisted Living">Assisted Living Facility</option>
                <option value="Nursing Home">Nursing Home</option>
                <option value="Hospital">Hospital</option>
                <option value="Other">Other</option>
              </select>
            </div>
          </div>
        </div>

        {/* Proposed Conservator Information Section */}
        <div className="section">
          <h4 className="text-gray-700 font-medium mb-4 flex items-center gap-2">
            <Scale className="w-4 h-4" />
            Proposed Conservator Information
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="conservator_name">
                Full Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="conservator_name"
                name="conservator_name"
                value={formData.conservator_name}
                onChange={handleInputChange}
                required
                placeholder="Enter full legal name"
              />
            </div>
            <div>
              <label htmlFor="conservator_relationship">
                Relationship to Conservatee <span className="text-red-500">*</span>
              </label>
              <select
                id="conservator_relationship"
                name="conservator_relationship"
                value={formData.conservator_relationship}
                onChange={handleInputChange}
                required
              >
                <option value="">Select...</option>
                <option value="Spouse">Spouse</option>
                <option value="Child">Child</option>
                <option value="Parent">Parent</option>
                <option value="Sibling">Sibling</option>
                <option value="Other Relative">Other Relative</option>
                <option value="Professional Conservator">Professional Conservator</option>
                <option value="Friend">Friend</option>
                <option value="Other">Other</option>
              </select>
            </div>
            <div>
              <label htmlFor="conservator_address">
                Address <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="conservator_address"
                name="conservator_address"
                value={formData.conservator_address}
                onChange={handleInputChange}
                required
                placeholder="Full address"
              />
            </div>
            <div>
              <label htmlFor="conservator_phone">
                Phone Number <span className="text-red-500">*</span>
              </label>
              <input
                type="tel"
                id="conservator_phone"
                name="conservator_phone"
                value={formData.conservator_phone}
                onChange={handleInputChange}
                required
                placeholder="(xxx) xxx-xxxx"
              />
            </div>
            <div>
              <label htmlFor="conservator_dob">
                Date of Birth <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                id="conservator_dob"
                name="conservator_dob"
                value={formData.conservator_dob}
                onChange={handleInputChange}
                required
              />
            </div>
            <div>
              <label htmlFor="conservator_ssn">
                Social Security Number <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="conservator_ssn"
                name="conservator_ssn"
                value={formData.conservator_ssn}
                onChange={handleInputChange}
                required
                placeholder="XXX-XX-XXXX"
              />
            </div>
          </div>
        </div>

        {/* Relatives Information Section */}
        <div className="section">
          <h4 className="text-gray-700 font-medium mb-4 flex items-center gap-2">
            <Users className="w-4 h-4" />
            Relatives Information (For Notice Requirements)
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="spouse_name">
                Spouse Name (if any)
              </label>
              <input
                type="text"
                id="spouse_name"
                name="spouse_name"
                value={formData.spouse_name}
                onChange={handleInputChange}
                placeholder="Enter spouse's full name"
              />
            </div>
            <div>
              <label htmlFor="spouse_address">
                Spouse Address
              </label>
              <input
                type="text"
                id="spouse_address"
                name="spouse_address"
                value={formData.spouse_address}
                onChange={handleInputChange}
                placeholder="Enter spouse's address"
              />
            </div>
            <div className="md:col-span-2">
              <label htmlFor="children_info">
                Children (Names and Addresses)
              </label>
              <textarea
                id="children_info"
                name="children_info"
                value={formData.children_info}
                onChange={handleInputChange}
                rows="3"
                placeholder="List each child's name and address on a separate line"
              />
            </div>
            <div className="md:col-span-2">
              <label htmlFor="parents_info">
                Parents (Names and Addresses)
              </label>
              <textarea
                id="parents_info"
                name="parents_info"
                value={formData.parents_info}
                onChange={handleInputChange}
                rows="3"
                placeholder="List each parent's name and address on a separate line"
              />
            </div>
            <div className="md:col-span-2">
              <label htmlFor="siblings_info">
                Siblings (Names and Addresses)
              </label>
              <textarea
                id="siblings_info"
                name="siblings_info"
                value={formData.siblings_info}
                onChange={handleInputChange}
                rows="3"
                placeholder="List each sibling's name and address on a separate line"
              />
            </div>
          </div>
        </div>

        {/* Type of Conservatorship Section */}
        <div className="section">
          <h4 className="text-gray-700 font-medium mb-4 flex items-center gap-2">
            <FileText className="w-4 h-4" />
            Type of Conservatorship
          </h4>
          <div>
            <label htmlFor="conservatorship_type">
              What type of conservatorship are you requesting? <span className="text-red-500">*</span>
            </label>
            <select
              id="conservatorship_type"
              name="conservatorship_type"
              value={formData.conservatorship_type}
              onChange={handleInputChange}
              required
            >
              <option value="">Select...</option>
              <option value="person">Conservatorship of the Person</option>
              <option value="estate">Conservatorship of the Estate</option>
              <option value="both">Both Person and Estate</option>
              <option value="limited">Limited Conservatorship (Developmentally Disabled)</option>
            </select>
            <p className="text-xs text-gray-500 mt-2">
              Person = personal care decisions. Estate = financial decisions. Limited = for developmentally disabled adults.
            </p>
          </div>
        </div>

        {/* Conservatee's Capacity Section */}
        <div className="section">
          <h4 className="text-gray-700 font-medium mb-4 flex items-center gap-2">
            <Heart className="w-4 h-4" />
            Conservatee's Capacity
          </h4>
          <div className="space-y-4">
            <div>
              <label htmlFor="conservatorship_reason">
                Reason for Conservatorship <span className="text-red-500">*</span>
              </label>
              <textarea
                id="conservatorship_reason"
                name="conservatorship_reason"
                value={formData.conservatorship_reason}
                onChange={handleInputChange}
                required
                rows="4"
                placeholder="Explain why conservatorship is necessary (medical condition, mental capacity issues, etc.)"
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label>Can conservatee provide for personal needs? <span className="text-red-500">*</span></label>
                <div className="flex gap-4 mt-2">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="personal_needs"
                      value="yes"
                      checked={formData.personal_needs === 'yes'}
                      onChange={handleInputChange}
                      required
                    />
                    <span className="ml-2">Yes</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="personal_needs"
                      value="no"
                      checked={formData.personal_needs === 'no'}
                      onChange={handleInputChange}
                      required
                    />
                    <span className="ml-2">No</span>
                  </label>
                </div>
              </div>
              <div>
                <label>Can conservatee manage financial affairs? <span className="text-red-500">*</span></label>
                <div className="flex gap-4 mt-2">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="financial_management"
                      value="yes"
                      checked={formData.financial_management === 'yes'}
                      onChange={handleInputChange}
                      required
                    />
                    <span className="ml-2">Yes</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="financial_management"
                      value="no"
                      checked={formData.financial_management === 'no'}
                      onChange={handleInputChange}
                      required
                    />
                    <span className="ml-2">No</span>
                  </label>
                </div>
              </div>
            </div>
            <div>
              <label htmlFor="medical_diagnosis">
                Medical/Mental Health Diagnosis
              </label>
              <textarea
                id="medical_diagnosis"
                name="medical_diagnosis"
                value={formData.medical_diagnosis}
                onChange={handleInputChange}
                rows="3"
                placeholder="Describe any medical or mental health conditions that affect capacity"
              />
            </div>
            <div>
              <label>Have less restrictive alternatives been considered? <span className="text-red-500">*</span></label>
              <div className="flex gap-4 mt-2">
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="alternatives_considered"
                    value="yes"
                    checked={formData.alternatives_considered === 'yes'}
                    onChange={handleInputChange}
                    required
                  />
                  <span className="ml-2">Yes</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="alternatives_considered"
                    value="no"
                    checked={formData.alternatives_considered === 'no'}
                    onChange={handleInputChange}
                    required
                  />
                  <span className="ml-2">No</span>
                </label>
              </div>
            </div>
            {formData.alternatives_considered === 'yes' && (
              <div>
                <label htmlFor="alternatives_explanation">
                  If yes, explain why alternatives are not sufficient
                </label>
                <textarea
                  id="alternatives_explanation"
                  name="alternatives_explanation"
                  value={formData.alternatives_explanation}
                  onChange={handleInputChange}
                  rows="3"
                  placeholder="Explain why power of attorney, trust, or other alternatives won't work"
                />
              </div>
            )}
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
              <label htmlFor="conservatee_personal_property">
                Personal Property Value
              </label>
              <input
                type="number"
                id="conservatee_personal_property"
                name="conservatee_personal_property"
                value={formData.conservatee_personal_property}
                onChange={handleInputChange}
                placeholder="Enter amount without $"
              />
              <p className="text-xs text-gray-500 mt-1">Bank accounts, investments, vehicles, etc.</p>
            </div>
            <div>
              <label htmlFor="conservatee_real_property">
                Real Property Value
              </label>
              <input
                type="number"
                id="conservatee_real_property"
                name="conservatee_real_property"
                value={formData.conservatee_real_property}
                onChange={handleInputChange}
                placeholder="Enter amount without $"
              />
              <p className="text-xs text-gray-500 mt-1">Real estate owned by conservatee</p>
            </div>
            <div>
              <label htmlFor="conservatee_income">
                Monthly Income
              </label>
              <input
                type="number"
                id="conservatee_income"
                name="conservatee_income"
                value={formData.conservatee_income}
                onChange={handleInputChange}
                placeholder="Enter amount without $"
              />
              <p className="text-xs text-gray-500 mt-1">Social Security, pensions, etc.</p>
            </div>
            <div>
              <label htmlFor="conservatee_expenses">
                Monthly Expenses
              </label>
              <input
                type="number"
                id="conservatee_expenses"
                name="conservatee_expenses"
                onChange={handleInputChange}
                placeholder="Enter amount without $"
              />
              <p className="text-xs text-gray-500 mt-1">Housing, food, medical, etc.</p>
            </div>
          </div>
        </div>

        {/* Powers Requested Section */}
        <div className="section">
          <h4 className="text-gray-700 font-medium mb-4 flex items-center gap-2">
            <Briefcase className="w-4 h-4" />
            Powers Requested
          </h4>
          <div>
            <label>Are you requesting independent powers?</label>
            <div className="flex gap-4 mt-2">
              <label className="flex items-center">
                <input
                  type="radio"
                  name="cons_independent_powers"
                  value="yes"
                  checked={formData.cons_independent_powers === 'yes'}
                  onChange={handleInputChange}
                />
                <span className="ml-2">Yes</span>
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  name="cons_independent_powers"
                  value="no"
                  checked={formData.cons_independent_powers === 'no'}
                  onChange={handleInputChange}
                />
                <span className="ml-2">No</span>
              </label>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              Independent powers allow certain actions without court approval
            </p>
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

        {/* Attorney Information Section */}
        <div className="section bg-gray-50">
          <h4 className="text-gray-700 font-medium mb-4 flex items-center gap-2">
            <Briefcase className="w-4 h-4" />
            Attorney Information
          </h4>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
            <p className="text-sm text-blue-700 flex items-center gap-2">
              <AlertCircle className="w-4 h-4" />
              Attorney information is pre-filled with Law Offices of Rozsa Gyene details.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="attorney_name">
                Attorney Name
              </label>
              <input
                type="text"
                id="attorney_name"
                name="attorney_name"
                value={formData.attorney_name}
                onChange={handleInputChange}
                readOnly
                className="bg-gray-100"
              />
            </div>
            <div>
              <label htmlFor="attorney_bar">
                State Bar Number
              </label>
              <input
                type="text"
                id="attorney_bar"
                name="attorney_bar"
                value={formData.attorney_bar}
                onChange={handleInputChange}
                readOnly
                className="bg-gray-100"
              />
            </div>
            <div className="md:col-span-2">
              <label htmlFor="firm_name">
                Firm Name
              </label>
              <input
                type="text"
                id="firm_name"
                name="firm_name"
                value={formData.firm_name}
                onChange={handleInputChange}
                readOnly
                className="bg-gray-100"
              />
            </div>
            <div>
              <label htmlFor="attorney_fees">
                Attorney Fees Requested
              </label>
              <input
                type="number"
                id="attorney_fees"
                name="attorney_fees"
                value={formData.attorney_fees}
                onChange={handleInputChange}
                placeholder="0"
              />
            </div>
            <div>
              <label htmlFor="fee_terms">
                Fee Payment Terms
              </label>
              <select
                id="fee_terms"
                name="fee_terms"
                value={formData.fee_terms}
                onChange={handleInputChange}
              >
                <option value="forthwith">Forthwith</option>
                <option value="upon_approval">Upon Approval</option>
                <option value="from_estate">From Estate</option>
              </select>
            </div>
          </div>
        </div>

        {/* Court Information Section */}
        <div className="section">
          <h4 className="text-gray-700 font-medium mb-4 flex items-center gap-2">
            <Building className="w-4 h-4" />
            Court Information
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

export default ConservatorshipDataForm;
