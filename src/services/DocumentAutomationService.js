/**
 * Document Automation Service
 * Integrates with all Netlify-hosted document generation apps
 */

class DocumentAutomationService {
  constructor() {
    // Configure your actual Netlify app URLs here
    this.endpoints = {
      probate: {
        baseUrl: process.env.REACT_APP_PROBATE_URL || 'https://your-probate-app.netlify.app',
        apiKey: process.env.REACT_APP_PROBATE_API_KEY || ''
      },
      conservatorship: {
        baseUrl: process.env.REACT_APP_CONSERVATORSHIP_URL || 'https://your-conservatorship-app.netlify.app',
        apiKey: process.env.REACT_APP_CONSERVATORSHIP_API_KEY || ''
      },
      guardianship: {
        baseUrl: process.env.REACT_APP_GUARDIANSHIP_URL || 'https://your-guardianship-app.netlify.app',
        apiKey: process.env.REACT_APP_GUARDIANSHIP_API_KEY || ''
      },
      trust: {
        baseUrl: process.env.REACT_APP_TRUST_URL || 'https://your-trust-amendments-app.netlify.app',
        apiKey: process.env.REACT_APP_TRUST_API_KEY || ''
      }
    };

    // Form mappings for each practice area
    this.formMappings = {
      probate: {
        initial: [
          { code: 'PR-010', name: 'Cover Sheet', endpoint: '/api/generate-pr010' },
          { code: 'DE-111', name: 'Petition for Probate', endpoint: '/api/generate-de111' },
          { code: 'DE-147', name: 'Duties and Liabilities', endpoint: '/api/generate-de147' },
          { code: 'DE-147S', name: 'Supplement to DE-147', endpoint: '/api/generate-de147s' }
        ],
        afterHearing: [
          { code: 'DE-140', name: 'Order for Probate', endpoint: '/api/generate-de140' },
          { code: 'DE-150', name: 'Letters', endpoint: '/api/generate-de150' }
        ],
        notices: [
          { code: 'DE-121', name: 'Notice of Petition', endpoint: '/api/generate-de121' }
        ],
        distribution: [
          { code: 'DE-270', name: 'Petition for Distribution', endpoint: '/api/generate-de270' }
        ]
      },
      conservatorship: {
        initial: [
          { code: 'PR-010', name: 'Cover Sheet', endpoint: '/api/generate-pr010' },
          { code: 'GC-310', name: 'Petition for Appointment', endpoint: '/api/generate-gc310' },
          { code: 'GC-313', name: 'Supplement to GC-310', endpoint: '/api/generate-gc313' },
          { code: 'GC-320', name: 'Citation', endpoint: '/api/generate-gc320' },
          { code: 'GC-312', name: 'Confidential Supplemental', endpoint: '/api/generate-gc312' },
          { code: 'GC-314', name: 'Screening Form', endpoint: '/api/generate-gc314' },
          { code: 'GC-348', name: 'Duties of Conservator', endpoint: '/api/generate-gc348' }
        ],
        capacity: [
          { code: 'GC-335', name: 'Capacity Declaration', endpoint: '/api/generate-gc335' },
          { code: 'GC-335A', name: 'Dementia Supplement', endpoint: '/api/generate-gc335a' }
        ],
        afterAppointment: [
          { code: 'GC-340', name: 'Order Appointing', endpoint: '/api/generate-gc340' },
          { code: 'GC-350', name: 'Letters of Conservatorship', endpoint: '/api/generate-gc350' }
        ],
        ongoing: [
          { code: 'GC-355', name: 'Care Plan', endpoint: '/api/generate-gc355' },
          { code: 'GC-356', name: 'Supplemental Care Plan', endpoint: '/api/generate-gc356' }
        ]
      },
      guardianship: {
        initial: [
          { code: 'GC-210', name: 'Petition for Guardianship', endpoint: '/api/generate-gc210' },
          { code: 'GC-020', name: 'Notice of Hearing', endpoint: '/api/generate-gc020' },
          { code: 'GC-210(CA)', name: 'Child Information', endpoint: '/api/generate-gc210ca' },
          { code: 'ICWA-010(A)', name: 'Indian Child Inquiry', endpoint: '/api/generate-icwa010a' },
          { code: 'GC-211', name: 'Consent and Waiver', endpoint: '/api/generate-gc211' },
          { code: 'GC-212', name: 'Screening Form', endpoint: '/api/generate-gc212' },
          { code: 'GC-248', name: 'Duties of Guardian', endpoint: '/api/generate-gc248' },
          { code: 'FL-105', name: 'UCCJEA Declaration', endpoint: '/api/generate-fl105' }
        ],
        afterAppointment: [
          { code: 'GC-240', name: 'Order Appointing Guardian', endpoint: '/api/generate-gc240' },
          { code: 'GC-250', name: 'Letters of Guardianship', endpoint: '/api/generate-gc250' }
        ]
      },
      trust: {
        amendments: [
          { code: 'TRUST-AMD-1', name: 'First Amendment', endpoint: '/api/generate-amendment' },
          { code: 'TRUST-RESTATE', name: 'Restatement', endpoint: '/api/generate-restatement' }
        ],
        notices: [
          { code: 'TRUST-NOTICE', name: 'Notice to Beneficiaries', endpoint: '/api/generate-notice' }
        ]
      }
    };
  }

  /**
   * Generate a single document
   */
  async generateDocument(practiceArea, formCode, clientData) {
    try {
      const endpoint = this.endpoints[practiceArea];
      if (!endpoint) {
        throw new Error(`Unknown practice area: ${practiceArea}`);
      }

      // Find the form configuration
      const form = this.findForm(practiceArea, formCode);
      if (!form) {
        throw new Error(`Unknown form: ${formCode} for ${practiceArea}`);
      }

      // Prepare the data payload
      const payload = this.preparePayload(practiceArea, formCode, clientData);

      // Make the API call
      const response = await fetch(`${endpoint.baseUrl}${form.endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': endpoint.apiKey
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error(`Document generation failed: ${response.statusText}`);
      }

      const result = await response.json();
      
      // Save document reference to local storage
      this.saveDocumentRecord({
        clientId: clientData.id,
        formCode,
        practiceArea,
        generatedAt: new Date().toISOString(),
        documentUrl: result.documentUrl,
        status: 'generated'
      });

      return result;
    } catch (error) {
      console.error('Document generation error:', error);
      throw error;
    }
  }

  /**
   * Generate multiple documents in batch
   */
  async generateBatch(practiceArea, formCodes, clientData) {
    const results = [];
    const errors = [];

    for (const formCode of formCodes) {
      try {
        const result = await this.generateDocument(practiceArea, formCode, clientData);
        results.push({ formCode, success: true, ...result });
      } catch (error) {
        errors.push({ formCode, success: false, error: error.message });
      }
    }

    return { results, errors };
  }

  /**
   * Generate all documents for a workflow stage
   */
  async generateWorkflowDocuments(practiceArea, stage, clientData) {
    const forms = this.formMappings[practiceArea][stage];
    if (!forms) {
      throw new Error(`Unknown workflow stage: ${stage} for ${practiceArea}`);
    }

    const formCodes = forms.map(f => f.code);
    return this.generateBatch(practiceArea, formCodes, clientData);
  }

  /**
   * Prepare payload based on practice area
   */
  preparePayload(practiceArea, formCode, clientData) {
    const basePayload = {
      clientInfo: {
        name: clientData.name,
        email: clientData.email,
        phone: clientData.phone,
        address: clientData.address,
        caseNumber: clientData.caseNumber
      },
      formCode,
      generatedBy: localStorage.getItem('userName') || 'Staff',
      generatedAt: new Date().toISOString()
    };

    // Add practice-area specific data
    switch (practiceArea) {
      case 'probate':
        return {
          ...basePayload,
          decedentInfo: {
            name: clientData.decedentName,
            dateOfDeath: clientData.dateOfDeath,
            placeOfDeath: clientData.placeOfDeath
          },
          estateInfo: {
            value: clientData.estateValue,
            hasWill: clientData.hasWill,
            willDate: clientData.willDate
          },
          petitionerInfo: {
            name: clientData.petitionerName,
            relationship: clientData.relationship,
            priority: clientData.priority
          }
        };

      case 'conservatorship':
        return {
          ...basePayload,
          conservateeInfo: {
            name: clientData.conservateeName,
            dateOfBirth: clientData.conservateeDOB,
            address: clientData.conservateeAddress
          },
          proposedConservator: {
            name: clientData.conservatorName,
            relationship: clientData.conservatorRelationship,
            address: clientData.conservatorAddress
          },
          typeOfConservatorship: clientData.conservatorshipType,
          reasonsForConservatorship: clientData.reasons,
          hasCapacityDeclaration: clientData.hasCapacityDeclaration
        };

      case 'guardianship':
        return {
          ...basePayload,
          minorInfo: {
            names: clientData.minorNames || [],
            birthdates: clientData.minorBirthdates || [],
            currentAddress: clientData.minorAddress
          },
          proposedGuardian: {
            name: clientData.guardianName,
            relationship: clientData.guardianRelationship,
            address: clientData.guardianAddress
          },
          parents: {
            mother: clientData.motherInfo,
            father: clientData.fatherInfo
          },
          guardianshipType: clientData.guardianshipType
        };

      case 'trust':
        return {
          ...basePayload,
          trustInfo: {
            name: clientData.trustName,
            date: clientData.trustDate,
            trustor: clientData.trustorName,
            trustee: clientData.trusteeName
          },
          amendmentInfo: {
            number: clientData.amendmentNumber,
            changes: clientData.changes
          }
        };

      default:
        return basePayload;
    }
  }

  /**
   * Find form configuration
   */
  findForm(practiceArea, formCode) {
    const areas = this.formMappings[practiceArea];
    if (!areas) return null;

    for (const stage of Object.values(areas)) {
      const form = stage.find(f => f.code === formCode);
      if (form) return form;
    }
    return null;
  }

  /**
   * Save document record to local storage
   */
  saveDocumentRecord(record) {
    const key = `doc_${record.clientId}_${Date.now()}`;
    const documents = JSON.parse(localStorage.getItem('generatedDocuments') || '{}');
    documents[key] = record;
    localStorage.setItem('generatedDocuments', JSON.stringify(documents));
  }

  /**
   * Get document history for a client
   */
  getClientDocumentHistory(clientId) {
    const documents = JSON.parse(localStorage.getItem('generatedDocuments') || '{}');
    return Object.values(documents)
      .filter(doc => doc.clientId === clientId)
      .sort((a, b) => new Date(b.generatedAt) - new Date(a.generatedAt));
  }

  /**
   * Check document app availability
   */
  async checkAppStatus(practiceArea) {
    try {
      const endpoint = this.endpoints[practiceArea];
      const response = await fetch(`${endpoint.baseUrl}/api/health`, {
        method: 'GET',
        headers: {
          'X-API-Key': endpoint.apiKey
        }
      });
      return response.ok;
    } catch (error) {
      return false;
    }
  }

  /**
   * Get available forms for a practice area
   */
  getAvailableForms(practiceArea) {
    return this.formMappings[practiceArea] || {};
  }
}

export default new DocumentAutomationService();
