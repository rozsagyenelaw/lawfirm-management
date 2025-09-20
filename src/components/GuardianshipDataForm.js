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
  IconButton,
  Alert
} from '@mui/material';
import { Add as AddIcon, Delete as DeleteIcon } from '@mui/icons-material';

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
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
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
              name="petitioner_name"
              value={formData.petitioner_name}
              onChange={handleInputChange}
              required
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Relationship to Minor"
              name="petitioner_relationship"
              value={formData.petitioner_relationship}
              onChange={handleInputChange}
              required
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Petitioner Address"
              name="petitioner_address"
              value={formData.petitioner_address}
              onChange={handleInputChange}
              required
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Petitioner Phone"
              name="petitioner_phone"
              value={formData.petitioner_phone}
              onChange={handleInputChange}
              required
            />
          </Grid>
          <Grid item xs={12}>
            <FormControl component="fieldset">
              <FormLabel>Are you the proposed guardian?</FormLabel>
              <RadioGroup
                row
                name="petitioner_is_guardian"
                value={formData.petitioner_is_guardian}
                onChange={handleInputChange}
              >
                <FormControlLabel value="yes" control={<Radio />} label="Yes" />
                <FormControlLabel value="no" control={<Radio />} label="No" />
              </RadioGroup>
            </FormControl>
          </Grid>
        </Grid>
      </Paper>

      {/* Minor Information */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Minor Information
        </Typography>
        {minors.map((minor, index) => (
          <Box key={minor.id} sx={{ mb: 3, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
              <Typography variant="subtitle1">Minor #{index + 1}</Typography>
              {minors.length > 1 && (
                <IconButton size="small" onClick={() => removeMinor(index)} color="error">
                  <DeleteIcon />
                </IconButton>
              )}
            </Box>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Full Name"
                  value={minor.name}
                  onChange={(e) => handleMinorChange(index, 'name', e.target.value)}
                  required
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Date of Birth"
                  type="date"
                  value={minor.dob}
                  onChange={(e) => handleMinorChange(index, 'dob', e.target.value)}
                  InputLabelProps={{ shrink: true }}
                  required
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Current Address"
                  value={minor.address}
                  onChange={(e) => handleMinorChange(index, 'address', e.target.value)}
                  required
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="School Name"
                  value={minor.school}
                  onChange={(e) => handleMinorChange(index, 'school', e.target.value)}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="School Phone"
                  value={minor.school_phone}
                  onChange={(e) => handleMinorChange(index, 'school_phone', e.target.value)}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Home Phone"
                  value={minor.home_phone}
                  onChange={(e) => handleMinorChange(index, 'home_phone', e.target.value)}
                />
              </Grid>
            </Grid>
          </Box>
        ))}
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={addMinor}
          sx={{ mt: 2 }}
        >
          Add Another Minor
        </Button>
      </Paper>

      {/* Guardian Information */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Proposed Guardian Information
        </Typography>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Guardian Full Name"
              name="guardian_name"
              value={formData.guardian_name}
              onChange={handleInputChange}
              required
              disabled={formData.petitioner_is_guardian === 'yes'}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth required>
              <InputLabel>Relationship to Minor</InputLabel>
              <Select
                name="guardian_relationship"
                value={formData.guardian_relationship}
                onChange={handleInputChange}
              >
                <MenuItem value="">Select...</MenuItem>
                <MenuItem value="Parent">Parent</MenuItem>
                <MenuItem value="Grandparent">Grandparent</MenuItem>
                <MenuItem value="Aunt">Aunt</MenuItem>
                <MenuItem value="Uncle">Uncle</MenuItem>
                <MenuItem value="Sibling">Sibling</MenuItem>
                <MenuItem value="Step-parent">Step-parent</MenuItem>
                <MenuItem value="Family Friend">Family Friend</MenuItem>
                <MenuItem value="Other Relative">Other Relative</MenuItem>
                <MenuItem value="Non-relative">Non-relative</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Guardian Address"
              name="guardian_address"
              value={formData.guardian_address}
              onChange={handleInputChange}
              required
              disabled={formData.petitioner_is_guardian === 'yes'}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Guardian Phone"
              name="guardian_phone"
              value={formData.guardian_phone}
              onChange={handleInputChange}
              required
              disabled={formData.petitioner_is_guardian === 'yes'}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Guardian Date of Birth"
              name="guardian_dob"
              type="date"
              value={formData.guardian_dob}
              onChange={handleInputChange}
              InputLabelProps={{ shrink: true }}
              required
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Social Security Number"
              name="guardian_ssn"
              value={formData.guardian_ssn}
              onChange={handleInputChange}
              placeholder="XXX-XX-XXXX"
              required
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Driver's License Number"
              name="guardian_dl"
              value={formData.guardian_dl}
              onChange={handleInputChange}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="State"
              name="guardian_state"
              value={formData.guardian_state}
              onChange={handleInputChange}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Home Phone"
              name="guardian_home_phone"
              value={formData.guardian_home_phone}
              onChange={handleInputChange}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Work Phone"
              name="guardian_work_phone"
              value={formData.guardian_work_phone}
              onChange={handleInputChange}
            />
          </Grid>
        </Grid>
      </Paper>

      {/* Background Screening (GC-212) */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Background Screening (Confidential - Required for GC-212)
        </Typography>
        <Alert severity="info" sx={{ mb: 2 }}>
          This information is required by the court and will be kept confidential. Answer all questions truthfully.
        </Alert>
        <Grid container spacing={2}>
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
            <Grid item xs={12} key={question.name}>
              <FormControl component="fieldset">
                <FormLabel>{question.label} *</FormLabel>
                <RadioGroup
                  row
                  name={question.name}
                  value={formData[question.name]}
                  onChange={handleInputChange}
                >
                  <FormControlLabel value="yes" control={<Radio />} label="Yes" />
                  <FormControlLabel value="no" control={<Radio />} label="No" />
                </RadioGroup>
              </FormControl>
            </Grid>
          ))}
        </Grid>
      </Paper>

      {/* Type of Guardianship */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Type of Guardianship
        </Typography>
        <FormControl fullWidth required>
          <InputLabel>What type of guardianship are you requesting?</InputLabel>
          <Select
            name="guardianship_type"
            value={formData.guardianship_type}
            onChange={handleInputChange}
          >
            <MenuItem value="">Select...</MenuItem>
            <MenuItem value="person">Guardianship of the Person Only</MenuItem>
            <MenuItem value="estate">Guardianship of the Estate Only</MenuItem>
            <MenuItem value="both">Both Person and Estate</MenuItem>
          </Select>
        </FormControl>
        <Typography variant="caption" sx={{ mt: 1, display: 'block' }}>
          Person = custody and care decisions. Estate = financial decisions.
        </Typography>
      </Paper>

      {/* Estate Information */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Minor's Estate Information
        </Typography>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Personal Property Value"
              name="personal_property_value"
              type="number"
              value={formData.personal_property_value}
              onChange={handleInputChange}
              placeholder="0"
              helperText="Bank accounts, stocks, vehicles, etc."
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Real Property Value"
              name="real_property_value"
              type="number"
              value={formData.real_property_value}
              onChange={handleInputChange}
              placeholder="0"
              helperText="Real estate owned by minor"
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <FormControl component="fieldset">
              <FormLabel>Is bond required?</FormLabel>
              <RadioGroup
                row
                name="bond_required"
                value={formData.bond_required}
                onChange={handleInputChange}
              >
                <FormControlLabel value="yes" control={<Radio />} label="Yes" />
                <FormControlLabel value="no" control={<Radio />} label="No" />
              </RadioGroup>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Bond Amount (if required)"
              name="bond_amount"
              type="number"
              value={formData.bond_amount}
              onChange={handleInputChange}
              placeholder="0"
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Blocked Account Amount"
              name="blocked_account"
              type="number"
              value={formData.blocked_account}
              onChange={handleInputChange}
              placeholder="0"
              helperText="Amount to be placed in blocked account"
            />
          </Grid>
        </Grid>
      </Paper>

      {/* Parents Information */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Parents Information
        </Typography>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Mother's Name"
              name="mother_name"
              value={formData.mother_name}
              onChange={handleInputChange}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth>
              <InputLabel>Mother's Status</InputLabel>
              <Select
                name="mother_status"
                value={formData.mother_status}
                onChange={handleInputChange}
              >
                <MenuItem value="">Select...</MenuItem>
                <MenuItem value="Living">Living</MenuItem>
                <MenuItem value="Deceased">Deceased</MenuItem>
                <MenuItem value="Unknown">Unknown</MenuItem>
                <MenuItem value="Whereabouts Unknown">Whereabouts Unknown</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Mother's Address (if living)"
              name="mother_address"
              value={formData.mother_address}
              onChange={handleInputChange}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Father's Name"
              name="father_name"
              value={formData.father_name}
              onChange={handleInputChange}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth>
              <InputLabel>Father's Status</InputLabel>
              <Select
                name="father_status"
                value={formData.father_status}
                onChange={handleInputChange}
              >
                <MenuItem value="">Select...</MenuItem>
                <MenuItem value="Living">Living</MenuItem>
                <MenuItem value="Deceased">Deceased</MenuItem>
                <MenuItem value="Unknown">Unknown</MenuItem>
                <MenuItem value="Whereabouts Unknown">Whereabouts Unknown</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Father's Address (if living)"
              name="father_address"
              value={formData.father_address}
              onChange={handleInputChange}
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              fullWidth
              multiline
              rows={4}
              label="Reason for Guardianship"
              name="guardianship_reason"
              value={formData.guardianship_reason}
              onChange={handleInputChange}
              placeholder="Explain why guardianship is necessary (e.g., parents deceased, unable to care for child, etc.)"
              required
            />
          </Grid>
        </Grid>
      </Paper>

      {/* Powers Requested */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Powers Requested
        </Typography>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6}>
            <FormControl component="fieldset">
              <FormLabel>Are you requesting independent powers?</FormLabel>
              <RadioGroup
                row
                name="independent_powers"
                value={formData.independent_powers}
                onChange={handleInputChange}
              >
                <FormControlLabel value="yes" control={<Radio />} label="Yes" />
                <FormControlLabel value="no" control={<Radio />} label="No" />
              </RadioGroup>
            </FormControl>
            <Typography variant="caption">
              Independent powers allow certain actions without court approval
            </Typography>
          </Grid>
          <Grid item xs={12} sm={6}>
            <FormControl component="fieldset">
              <FormLabel>Do you want to dispense with notice to any relatives?</FormLabel>
              <RadioGroup
                row
                name="dispense_notice"
                value={formData.dispense_notice}
                onChange={handleInputChange}
              >
                <FormControlLabel value="yes" control={<Radio />} label="Yes" />
                <FormControlLabel value="no" control={<Radio />} label="No" />
              </RadioGroup>
            </FormControl>
          </Grid>
        </Grid>
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

export default GuardianshipDataForm;
