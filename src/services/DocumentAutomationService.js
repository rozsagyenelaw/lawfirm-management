// DocumentAutomationService.js
// Service for integrating with the Probate Form Automation API and Guardianship/Conservatorship API

class DocumentAutomationService {
  constructor() {
    // API endpoints for different practice areas
    this.endpoints = {
      probate: 'https://probateformautomation.netlify.app/.netlify/functions',
      guardianship: 'https://guardianshipconservatorsh.netlify.app/.netlify/functions',
      conservatorship: 'https://guardianshipconservatorsh.netlify.app/.netlify/functions'
    };
    
    this.documentHistory = JSON.parse(localStorage.getItem('documentHistory') || '{}');
  }

  // Map law firm client data to appropriate format based on practice area
  mapClientDataToFormData(client, practiceArea) {
    switch(practiceArea) {
      case 'probate':
        return this.mapClientDataToProbateFormat(client);
      case 'guardianship':
        return this.mapClientDataToGuardianshipFormat(client);
      case 'conservatorship':
        return this.mapClientDataToConservatorshipFormat(client);
      default:
        return client;
    }
  }

  // Map law firm client data to probate app format (EXISTING METHOD - UNCHANGED)
  mapClientDataToProbateFormat(client) {
    // Format heirs list as expected by the probate automation app
    const formatHeirsList = () => {
      if (!client.heirs || client.heirs.length === 0) return '';
      
      return client.heirs.map(heir => {
        const age = heir.age || '';
        return `${heir.name}, ${heir.relationship}, ${age}, ${heir.address}`;
      }).join('\n');
    };

    // The working process-form.js expects these exact field names
    const baseData = {
      // Decedent Information
      decedent_name: client.decedentName || '',
      death_date: client.dateOfDeath || '',
      death_place: client.placeOfDeath || '',
      death_address: client.deathAddress || '',
      death_resident: client.californiaResident || 'yes',
      
      // Family Information
      has_spouse: client.hasSpouse || 'no',
      has_children: client.hasChildren || 'no',
      has_grandchildren: client.hasGrandchildren || 'no',
      
      // Petitioner Information
      petitioner_name: client.petitionerName || client.name || '',
      petitioner_relationship: client.petitionerRelationship || '',
      petitioner_address: client.petitionerAddress || client.address || '',
      petitioner_phone: client.petitionerPhone || client.phone || '',
      petitioner_is_executor: client.petitionerIsExecutor || 'no',
      
      // Estate Information
      personal_property_value: client.personalPropertyValue || '0',
      real_property_gross: client.realPropertyGross || '0',
      real_property_encumbrance: client.realPropertyEncumbrance || '0',
      has_will: client.hasWill ? 'yes' : 'no',
      will_date: client.willDate || '',
      will_self_proving: client.willSelfProving || 'no',
      executor_named_in_will: client.executorNamedInWill || 'no',
      
      // Heirs and Beneficiaries (as newline-separated string)
      heirs_list: formatHeirsList(),
      
      // Administration Details
      admin_type: client.adminType || 'full',
      bond_required: client.bondRequired || 'no',
      bond_amount: client.bondAmount || '',
      
      // Court Information
      court_county: client.courtCounty || 'LOS ANGELES',
      court_branch: client.courtBranch || 'STANLEY MOSK COURTHOUSE',
      
      // Attorney Information (from process-form.js defaults)
      attorney_name: "ROZSA GYENE, ESQ.",
      attorney_bar: "208356",
      firm_name: "LAW OFFICES OF ROZSA GYENE",
      firm_street: "450 N BRAND BLVD SUITE 600",
      firm_city: "GLENDALE",
      firm_state: "CA",
      firm_zip: "91203",
      firm_phone: "818-291-6217",
      firm_fax: "818-291-6205",
      firm_email: "ROZSAGYENELAW@YAHOO.COM"
    };

    return baseData;
  }

  // Map law firm client data to guardianship app format (NEW METHOD)
  mapClientDataToGuardianshipFormat(client) {
    // If we have guardianshipData stored from the form, use it directly
    if (client.guardianshipData) {
      return {
        ...client.guardianshipData,
        // Ensure attorney info is always included
        attorney_name: client.guardianshipData.attorney_name || "ROZSA GYENE, ESQ.",
        attorney_bar: client.guardianshipData.attorney_bar || "208356",
        firm_name: client.guardianshipData.firm_name || "LAW OFFICES OF ROZSA GYENE",
        firm_street: client.guardianshipData.firm_street || "450 N BRAND BLVD SUITE 600",
        firm_city: client.guardianshipData.firm_city || "GLENDALE",
        firm_state: client.guardianshipData.firm_state || "CA",
        firm_zip: client.guardianshipData.firm_zip || "91203",
        firm_phone: client.guardianshipData.firm_phone || "818-291-6217",
        firm_email: client.guardianshipData.firm_email || "ROZSAGYENELAW@YAHOO.COM"
      };
    }

    // Fallback mapping if no guardianshipData exists
    return {
      form_type: 'guardianship',
      petitioner_name: client.name || '',
      petitioner_relationship: client.relationship || '',
      petitioner_address: client.address || '',
      petitioner_phone: client.phone || '',
      guardian_name: client.guardianName || client.name || '',
      guardian_address: client.guardianAddress || client.address || '',
      guardian_phone: client.guardianPhone || client.phone || '',
      minors_list: client.minors_list || '',
      guardianship_type: client.guardianshipType || 'person',
      court_county: client.courtCounty || 'LOS ANGELES',
      court_branch: client.courtBranch || 'STANLEY MOSK COURTHOUSE',
      attorney_name: "ROZSA GYENE, ESQ.",
      attorney_bar: "208356",
      firm_name: "LAW OFFICES OF ROZSA GYENE",
      firm_street: "450 N BRAND BLVD SUITE 600",
      firm_city: "GLENDALE",
      firm_state: "CA",
      firm_zip: "91203",
      firm_phone: "818-291-6217",
      firm_email: "ROZSAGYENELAW@YAHOO.COM"
    };
  }

  // Map law firm client data to conservatorship app format (NEW METHOD)
  mapClientDataToConservatorshipFormat(client) {
    // If we have conservatorshipData stored from the form, use it directly
    if (client.conservatorshipData) {
      return {
        ...client.conservatorshipData,
        // Ensure attorney info is always included
        attorney_name: client.conservatorshipData.attorney_name || "ROZSA GYENE, ESQ.",
        attorney_bar: client.conservatorshipData.attorney_bar || "208356",
        firm_name: client.conservatorshipData.firm_name || "LAW OFFICES OF ROZSA GYENE",
        firm_street: client.conservatorshipData.firm_street || "450 N BRAND BLVD SUITE 600",
        firm_city: client.conservatorshipData.firm_city || "GLENDALE",
        firm_state: client.conservatorshipData.firm_state || "CA",
        firm_zip: client.conservatorshipData.firm_zip || "91203",
        firm_phone: client.conservatorshipData.firm_phone || "818-291-6217",
        firm_email: client.conservatorshipData.firm_email || "ROZSAGYENELAW@YAHOO.COM"
      };
    }

    // Fallback mapping if no conservatorshipData exists
    return {
      form_type: 'conservatorship',
      cons_petitioner_name: client.name || '',
      cons_petitioner_relationship: client.relationship || '',
      cons_petitioner_address: client.address || '',
      cons_petitioner_phone: client.phone || '',
      conservatee_name: client.conservateeName || '',
      conservator_name: client.conservatorName || client.name || '',
      conservator_address: client.conservatorAddress || client.address || '',
      conservator_phone: client.conservatorPhone || client.phone || '',
      conservatorship_type: client.conservatorshipType || 'person',
      court_county: client.courtCounty || 'LOS ANGELES',
      court_branch: client.courtBranch || 'STANLEY MOSK COURTHOUSE',
      attorney_name: "ROZSA GYENE, ESQ.",
      attorney_bar: "208356",
      firm_name: "LAW OFFICES OF ROZSA GYENE",
      firm_street: "450 N BRAND BLVD SUITE 600",
      firm_city: "GLENDALE",
      firm_state: "CA",
      firm_zip: "91203",
      firm_phone: "818-291-6217",
      firm_email: "ROZSAGYENELAW@YAHOO.COM"
    };
  }

  // Get available forms for practice area (UPDATED METHOD)
  getAvailableForms(practiceArea) {
    const forms = {
      probate: {
        initial: [
          { code: 'DE-111', name: 'Petition for Probate' },
          { code: 'DE-121', name: 'Notice of Petition to Administer Estate' },
          { code: 'DE-122', name: 'Citation - Probate' },
          { code: 'DE-131', name: 'Proof of Subscribing Witness' },
          { code: 'DE-135', name: 'Proof of Holographic Instrument' },
        ],
        administration: [
          { code: 'DE-140', name: 'Order for Probate' },
          { code: 'DE-147', name: 'Duties and Liabilities of Personal Representative' },
          { code: 'DE-150', name: 'Letters Testamentary/Administration' },
          { code: 'DE-157', name: 'Notice of Administration to Creditors' },
        ],
        inventory: [
          { code: 'DE-160', name: 'Inventory and Appraisal' },
          { code: 'DE-161', name: 'Inventory and Appraisal Attachment' },
        ],
        accounting: [
          { code: 'DE-172', name: 'Notice of Administration' },
          { code: 'DE-174', name: 'Allowance or Rejection of Creditors Claim' },
          { code: 'DE-260', name: 'Petition for Final Distribution' },
          { code: 'DE-270', name: 'Ex Parte Petition for Final Discharge' },
        ]
      },
      guardianship: {
        initial: [
          { code: 'GC-210', name: 'Petition for Guardianship' },
          { code: 'GC-212', name: 'Confidential Screening Form' },
          { code: 'GC-210(CA)', name: 'Confidential Guardian Assessment' }
        ],
        appointment: [
          { code: 'GC-240', name: 'Order Appointing Guardian' },
          { code: 'GC-250', name: 'Letters of Guardianship' }
        ],
        annual: [
          { code: 'GC-251', name: 'Annual Status Report' }
        ]
      },
      conservatorship: {
        initial: [
          { code: 'GC-310', name: 'Petition for Conservatorship' },
          { code: 'GC-312', name: 'Confidential Supplemental Information' },
          { code: 'GC-314', name: 'Confidential Conservator Screening Form' },
          { code: 'GC-320', name: 'Citation for Conservatorship' }
        ],
        appointment: [
          { code: 'GC-340', name: 'Order Appointing Conservator' },
          { code: 'GC-350', name: 'Letters of Conservatorship' }
        ],
        accounting: [
          { code: 'GC-355', name: 'Inventory and Appraisal' },
          { code: 'GC-405', name: 'Account of Conservator' }
        ]
      }
    };

    return forms[practiceArea] || {};
  }

  // Generate a single document (UPDATED METHOD)
  async generateDocument(practiceArea, formCode, client) {
    try {
      // Map client data to the format expected by the appropriate automation app
      const formData = this.mapClientDataToFormData(client, practiceArea);
      
      // Determine which Netlify function to use based on practice area
      let functionEndpoint = '/.netlify/functions/generate-document'; // Default for probate
      
      if (practiceArea === 'guardianship' || practiceArea === 'conservatorship') {
        functionEndpoint = '/.netlify/functions/generate-gc-document';
      }
      
      // Make the request
      const response = await fetch(functionEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          formType: formCode,
          data: formData,
          caseType: practiceArea // Add this for GC forms
        })
      });

      if (!response.ok) {
        const errorData = await response.text();
        console.error('API Error:', errorData);
        throw new Error(`Failed to generate document: ${response.statusText}`);
      }

      // Check content type of response
      const contentType = response.headers.get('content-type');
      
      if (contentType && contentType.includes('application/pdf')) {
        // Direct PDF response
        const pdfBlob = await response.blob();
        const pdfUrl = URL.createObjectURL(pdfBlob);
        
        // Store in history
        this.addToHistory(client.id, formCode, 'generated', pdfUrl);
        
        // Download the PDF
        const link = document.createElement('a');
        link.href = pdfUrl;
        link.download = `${formCode}_${client.name.replace(/\s+/g, '_')}_${Date.now()}.pdf`;
        link.click();
        
        return {
          success: true,
          documentUrl: pdfUrl,
          formCode: formCode
        };
      } else {
        // JSON response (batch generation)
        const result = await response.json();
        
        if (result.success && result.pdfs && result.pdfs[formCode]) {
          // Convert base64 to blob
          const base64 = result.pdfs[formCode];
          const byteCharacters = atob(base64);
          const byteNumbers = new Array(byteCharacters.length);
          for (let i = 0; i < byteCharacters.length; i++) {
            byteNumbers[i] = byteCharacters.charCodeAt(i);
          }
          const byteArray = new Uint8Array(byteNumbers);
          const blob = new Blob([byteArray], { type: 'application/pdf' });
          
          // Create URL for the PDF
          const pdfUrl = URL.createObjectURL(blob);
          
          // Store in history
          this.addToHistory(client.id, formCode, 'generated', pdfUrl);
          
          // Download the PDF
          const link = document.createElement('a');
          link.href = pdfUrl;
          link.download = `${formCode}_${client.name.replace(/\s+/g, '_')}_${Date.now()}.pdf`;
          link.click();
          
          return {
            success: true,
            documentUrl: pdfUrl,
            formCode: formCode
          };
        } else {
          throw new Error(result.error || 'Failed to generate document');
        }
      }
    } catch (error) {
      console.error('Error generating document:', error);
      
      // Store error in history
      this.addToHistory(client.id, formCode, 'error');
      
      throw error;
    }
  }

  // Generate multiple documents for a workflow stage (EXISTING METHOD - UNCHANGED)
  async generateWorkflowDocuments(practiceArea, stage, client) {
    const forms = this.getAvailableForms(practiceArea)[stage] || [];
    const results = [];
    const errors = [];

    for (const form of forms) {
      try {
        const result = await this.generateDocument(practiceArea, form.code, client);
        results.push(result);
      } catch (error) {
        errors.push({
          formCode: form.code,
          error: error.message
        });
      }
    }

    return { results, errors };
  }

  // Add to document history (EXISTING METHOD - UNCHANGED)
  addToHistory(clientId, formCode, status, documentUrl = null) {
    if (!this.documentHistory[clientId]) {
      this.documentHistory[clientId] = [];
    }

    this.documentHistory[clientId].push({
      formCode,
      status,
      documentUrl,
      generatedAt: new Date().toISOString()
    });

    // Save to localStorage
    localStorage.setItem('documentHistory', JSON.stringify(this.documentHistory));
  }

  // Get document history for a client (EXISTING METHOD - UNCHANGED)
  getClientDocumentHistory(clientId) {
    return this.documentHistory[clientId] || [];
  }

  // Clear history for a client (EXISTING METHOD - UNCHANGED)
  clearClientHistory(clientId) {
    delete this.documentHistory[clientId];
    localStorage.setItem('documentHistory', JSON.stringify(this.documentHistory));
  }
}

// Export as singleton
const documentService = new DocumentAutomationService();
export default documentService;
