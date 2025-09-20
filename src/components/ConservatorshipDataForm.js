import React, { useState } from 'react';
import {
  Box,
  TextField,
  Button,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Radio,
  RadioGroup,
  FormControlLabel,
  FormLabel,
  Paper,
  Grid,
  Divider,
  Alert
} from '@mui/material';

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
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <Box component="form" onSubmit={handleSubmit} sx={{ width: '100%' }}>
      {/* Petitioner Information */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Petitioner Information
        </Typography>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Petitioner Name"
              name="cons_petitioner_name"
              value={formData.cons_petitioner_name}
              onChange={handleInputChange}
              required
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Relationship to Conservatee"
              name="cons_petitioner_relationship"
              value={formData.cons_petitioner_relationship}
              onChange={handleInputChange}
              required
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Petitioner Address"
              name="cons_petitioner_address"
              value={formData.cons_petitioner_address}
              onChange={handleInputChange}
              required
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Petitioner Phone"
              name="cons_petitioner_phone"
              value={formData.cons_petitioner_phone}
              onChange={handleInputChange}
              required
            />
          </Grid>
        </Grid>
      </Paper>

      {/* Proposed Conservatee Information */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Proposed Conservatee Information
        </Typography>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Full Name"
              name="conservatee_name"
              value={formData.conservatee_name}
              onChange={handleInputChange}
              required
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Date of Birth"
              name="conservatee_dob"
              type="date"
              value={formData.conservatee_dob}
              onChange={handleInputChange}
              InputLabelProps={{ shrink: true }}
              required
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Current Address"
              name="conservatee_address"
              value={formData.conservatee_address}
              onChange={handleInputChange}
              required
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Phone Number"
              name="conservatee_phone"
              value={formData.conservatee_phone}
              onChange={handleInputChange}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Social Security Number"
              name="conservatee_ssn"
              value={formData.conservatee_ssn}
              onChange={handleInputChange}
              placeholder="XXX-XX-XXXX"
              required
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth required>
              <InputLabel>Current Living Situation</InputLabel>
              <Select
                name="conservatee_living"
                value={formData.conservatee_living}
                onChange={handleInputChange}
              >
                <MenuItem value="">Select...</MenuItem>
                <MenuItem value="Own Home">Own Home</MenuItem>
                <MenuItem value="Family Home">Family Home</MenuItem>
                <MenuItem value="Assisted Living">Assisted Living Facility</MenuItem>
                <MenuItem value="Nursing Home">Nursing Home</MenuItem>
                <MenuItem value="Hospital">Hospital</MenuItem>
                <MenuItem value="Other">Other</MenuItem>
              </Select>
            </FormControl>
          </Grid>
        </Grid>
      </Paper>

      {/* Proposed Conservator Information */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Proposed Conservator Information
        </Typography>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Full Name"
              name="conservator_name"
              value={formData.conservator_name}
              onChange={handleInputChange}
              required
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth required>
              <InputLabel>Relationship to Conservatee</InputLabel>
              <Select
                name="conservator_relationship"
                value={formData.conservator_relationship}
                onChange={handleInputChange}
              >
                <MenuItem value="">Select...</MenuItem>
                <MenuItem value="Spouse">Spouse</MenuItem>
                <MenuItem value="Child">Child</MenuItem>
                <MenuItem value="Parent">Parent</MenuItem>
                <MenuItem value="Sibling">Sibling</MenuItem>
                <MenuItem value="Other Relative">Other Relative</MenuItem>
                <MenuItem value="Professional Conservator">Professional Conservator</MenuItem>
                <MenuItem value="Friend">Friend</MenuItem>
                <MenuItem value="Other">Other</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Address"
              name="conservator_address"
              value={formData.conservator_address}
              onChange={handleInputChange}
              required
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Phone Number"
              name="conservator_phone"
              value={formData.conservator_phone}
              onChange={handleInputChange}
              required
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Date of Birth"
              name="conservator_dob"
              type="date"
              value={formData.conservator_dob}
              onChange={handleInputChange}
              InputLabelProps={{ shrink: true }}
              required
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Social Security Number"
              name="conservator_ssn"
              value={formData.conservator_ssn}
              onChange={handleInputChange}
              placeholder="XXX-XX-XXXX"
              required
            />
          </Grid>
        </Grid>
      </Paper>

      {/* Relatives Information */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Relatives Information (For Notice Requirements)
        </Typography>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Spouse Name (if any)"
              name="spouse_name"
              value={formData.spouse_name}
              onChange={handleInputChange}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Spouse Address"
              name="spouse_address"
              value={formData.spouse_address}
              onChange={handleInputChange}
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              fullWidth
              multiline
              rows={3}
              label="Children (Names and Addresses)"
              name="children_info"
              value={formData.children_info}
              onChange={handleInputChange}
              placeholder="List each child's name and address on a separate line"
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              fullWidth
              multiline
              rows={3}
              label="Parents (Names and Addresses)"
              name="parents_info"
              value={formData.parents_info}
              onChange={handleInputChange}
              placeholder="List each parent's name and address on a separate line"
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              fullWidth
              multiline
              rows={3}
              label="Siblings (Names and Addresses)"
              name="siblings_info"
              value={formData.siblings_info}
              onChange={handleInputChange}
              placeholder="List each sibling's name and address on a separate line"
            />
          </Grid>
        </Grid>
      </Paper>

      {/* Type of Conservatorship */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Type of Conservatorship
        </Typography>
        <FormControl fullWidth required>
          <InputLabel>What type of conservatorship are you requesting?</InputLabel>
          <Select
            name="conservatorship_type"
            value={formData.conservatorship_type}
            onChange={handleInputChange}
          >
            <MenuItem value="">Select...</MenuItem>
            <MenuItem value="person">Conservatorship of the Person</MenuItem>
            <MenuItem value="estate">Conservatorship of the Estate</MenuItem>
            <MenuItem value="both">Both Person and Estate</MenuItem>
            <MenuItem value="limited">Limited Conservatorship (Developmentally Disabled)</MenuItem>
          </Select>
        </FormControl>
        <Typography variant="caption" sx={{ mt: 1, display: 'block' }}>
          Person = personal care decisions. Estate = financial decisions. Limited = for developmentally disabled adults.
        </Typography>
      </Paper>

      {/* Conservatee's Capacity */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Conservatee's Capacity
        </Typography>
        <Grid container spacing={2}>
          <Grid item xs={12}>
            <TextField
              fullWidth
              multiline
              rows={4}
              label="Reason for Conservatorship"
              name="conservatorship_reason"
              value={formData.conservatorship_reason}
              onChange={handleInputChange}
              placeholder="Explain why conservatorship is necessary (medical condition, mental capacity issues, etc.)"
              required
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <FormControl component="fieldset">
              <FormLabel>Can conservatee provide for personal needs? *</FormLabel>
              <RadioGroup
                row
                name="personal_needs"
                value={formData.personal_needs}
                onChange={handleInputChange}
              >
                <FormControlLabel value="yes" control={<Radio />} label="Yes" />
                <FormControlLabel value="no" control={<Radio />} label="No" />
              </RadioGroup>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6}>
            <FormControl component="fieldset">
              <FormLabel>Can conservatee manage financial affairs? *</FormLabel>
              <RadioGroup
                row
                name="financial_management"
                value={formData.financial_management}
                onChange={handleInputChange}
              >
                <FormControlLabel value="yes" control={<Radio />} label="Yes" />
                <FormControlLabel value="no" control={<Radio />} label="No" />
              </RadioGroup>
            </FormControl>
          </Grid>
          <Grid item xs={12}>
            <TextField
              fullWidth
              multiline
              rows={3}
              label="Medical/Mental Health Diagnosis"
              name="medical_diagnosis"
              value={formData.medical_diagnosis}
              onChange={handleInputChange}
              placeholder="Describe any medical or mental health conditions that affect capacity"
            />
          </Grid>
          <Grid item xs={12}>
            <FormControl component="fieldset">
              <FormLabel>Have less restrictive alternatives been considered? *</FormLabel>
              <RadioGroup
                row
                name="alternatives_considered"
                value={formData.alternatives_considered}
                onChange={handleInputChange}
              >
                <FormControlLabel value="yes" control={<Radio />} label="Yes" />
                <FormControlLabel value="no" control={<Radio />} label="No" />
              </RadioGroup>
            </FormControl>
          </Grid>
          <Grid item xs={12}>
            <TextField
              fullWidth
              multiline
              rows={3}
              label="If yes, explain why alternatives are not sufficient"
              name="alternatives_explanation"
              value={formData.alternatives_explanation}
              onChange={handleInputChange}
              placeholder="Explain why power of attorney, trust, or other alternatives won't work"
            />
          </Grid>
        </Grid>
      </Paper>

      {/* Estate Information */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Estate Information
        </Typography>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Personal Property Value"
              name="conservatee_personal_property"
              type="number"
              value={formData.conservatee_personal_property}
              onChange={handleInputChange}
              placeholder="Enter amount without $"
              helperText="Bank accounts, investments, vehicles, etc."
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Real Property Value"
              name="conservatee_real_property"
              type="number"
              value={formData.conservatee_real_property}
              onChange={handleInputChange}
              placeholder="Enter amount without $"
              helperText="Real estate owned by conservatee"
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Monthly Income"
              name="conservatee_income"
              type="number"
              value={formData.conservatee_income}
              onChange={handleInputChange}
              placeholder="Enter amount without $"
              helperText="Social Security, pensions, etc."
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Monthly Expenses"
              name="conservatee_expenses"
              type="number"
              value={formData.conservatee_expenses}
              onChange={handleInputChange}
              placeholder="Enter amount without $"
              helperText="Housing, food, medical, etc."
            />
          </Grid>
        </Grid>
      </Paper>

      {/* Powers Requested */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Powers Requested
        </Typography>
        <FormControl component="fieldset">
          <FormLabel>Are you requesting independent powers?</FormLabel>
          <RadioGroup
            row
            name="cons_independent_powers"
            value={formData.cons_independent_powers}
            onChange={handleInputChange}
          >
            <FormControlLabel value="yes" control={<Radio />} label="Yes" />
            <FormControlLabel value="no" control={<Radio />} label="No" />
          </RadioGroup>
        </FormControl>
        <Typography variant="caption" sx={{ mt: 1, display: 'block' }}>
          Independent powers allow certain actions without court approval
        </Typography>
      </Paper>

      {/* Hearing Information */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Hearing Information
        </Typography>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Requested Hearing Date"
              name="hearing_date"
              type="date"
              value={formData.hearing_date}
              onChange={handleInputChange}
              InputLabelProps={{ shrink: true }}
              helperText="Leave blank for court to assign"
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Preferred Time"
              name="hearing_time"
              type="time"
              value={formData.hearing_time}
              onChange={handleInputChange}
              InputLabelProps={{ shrink: true }}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Department"
              name="hearing_dept"
              value={formData.hearing_dept}
              onChange={handleInputChange}
              placeholder="Will be assigned by court"
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Room"
              name="hearing_room"
              value={formData.hearing_room}
              onChange={handleInputChange}
              placeholder="Will be assigned by court"
            />
          </Grid>
        </Grid>
      </Paper>

      {/* Attorney Information */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Attorney Information
        </Typography>
        <Alert severity="info" sx={{ mb: 2 }}>
          Attorney information is pre-filled with Law Offices of Rozsa Gyene details.
        </Alert>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Attorney Name"
              name="attorney_name"
              value={formData.attorney_name}
              onChange={handleInputChange}
              InputProps={{ readOnly: true }}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="State Bar Number"
              name="attorney_bar"
              value={formData.attorney_bar}
              onChange={handleInputChange}
              InputProps={{ readOnly: true }}
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Firm Name"
              name="firm_name"
              value={formData.firm_name}
              onChange={handleInputChange}
              InputProps={{ readOnly: true }}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Attorney Fees Requested"
              name="attorney_fees"
              type="number"
              value={formData.attorney_fees}
              onChange={handleInputChange}
              placeholder="0"
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth>
              <InputLabel>Fee Payment Terms</InputLabel>
              <Select
                name="fee_terms"
                value={formData.fee_terms}
                onChange={handleInputChange}
              >
                <MenuItem value="forthwith">Forthwith</MenuItem>
                <MenuItem value="upon_approval">Upon Approval</MenuItem>
                <MenuItem value="from_estate">From Estate</MenuItem>
              </Select>
            </FormControl>
          </Grid>
        </Grid>
      </Paper>

      {/* Court Information */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Court Information
        </Typography>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth required>
              <InputLabel>County</InputLabel>
              <Select
                name="court_county"
                value={formData.court_county}
                onChange={handleInputChange}
              >
                <MenuItem value="LOS ANGELES">Los Angeles</MenuItem>
                <MenuItem value="ORANGE">Orange</MenuItem>
                <MenuItem value="SAN DIEGO">San Diego</MenuItem>
                <MenuItem value="RIVERSIDE">Riverside</MenuItem>
                <MenuItem value="SAN BERNARDINO">San Bernardino</MenuItem>
                <MenuItem value="VENTURA">Ventura</MenuItem>
                <MenuItem value="SANTA BARBARA">Santa Barbara</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Court Branch"
              name="court_branch"
              value={formData.court_branch}
              onChange={handleInputChange}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Case Number (if known)"
              name="case_number"
              value={formData.case_number}
              onChange={handleInputChange}
              placeholder="Leave blank if new case"
            />
          </Grid>
        </Grid>
      </Paper>

      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 3 }}>
        <Button
          type="submit"
          variant="contained"
          size="large"
          sx={{ minWidth: 200 }}
        >
          Generate Forms
        </Button>
      </Box>
    </Box>
  );
};

export default ConservatorshipDataForm;
