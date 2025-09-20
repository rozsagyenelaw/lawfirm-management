// DocumentAutomationService.js
// Service for integrating with the Probate Form Automation API

class DocumentAutomationService {
  constructor() {
    // Use your actual probate automation app URL
    this.baseUrl = 'https://probateformautomation.netlify.app/.netlify/functions';
    this.documentHistory = JSON.parse(localStorage.getItem('documentHistory') || '{}');
  }

  // Map law firm client data to probate app format
  mapClientDataToFormData(client, practiceArea) {
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

  // Get available forms for probate
  getAvailableForms(practiceArea) {
    if (practiceArea !== 'probate') {
      return {};
    }

    return {
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
    };
  }

  // Generate a single document
  async generateDocument(practiceArea, formCode, client) {
    try {
      // Map client data to the format expected by the probate automation app
      const formData = this.mapClientDataToFormData(client, practiceArea);
      
      // Use local Netlify function to avoid CORS issues
      const response = await fetch('/.netlify/functions/generate-document', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          formType: formCode,
          data: formData
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

  // Generate multiple documents for a workflow stage
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

  // Add to document history
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

  // Get document history for a client
  getClientDocumentHistory(clientId) {
    return this.documentHistory[clientId] || [];
  }

  // Clear history for a client
  clearClientHistory(clientId) {
    delete this.documentHistory[clientId];
    localStorage.setItem('documentHistory', JSON.stringify(this.documentHistory));
  }
}

// Export as singleton
const documentService = new DocumentAutomationService();
export default documentService;
