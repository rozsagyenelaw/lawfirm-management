import React, { useState } from 'react';
import { Upload, FileText, AlertTriangle, CheckCircle, DollarSign, X, Loader, AlertCircle, Gavel, Search, Scale, Mail, Users, Camera, File, Calendar } from 'lucide-react';
import toast from 'react-hot-toast';

const DocumentAnalyzer = ({ clientId, clientName }) => {
  const [uploading, setUploading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState(null);
  const [fileName, setFileName] = useState('');
  const [documentText, setDocumentText] = useState('');
  const [documentType, setDocumentType] = useState('auto'); // auto-detect by default
  
  // Your OpenAI API key from environment variable
  const OPENAI_API_KEY = process.env.REACT_APP_OPENAI_KEY;
  console.log('API Key loaded:', OPENAI_API_KEY ? 'Yes' : 'No'); // ADD THIS LINE

  const documentTypes = [
    { value: 'auto', label: 'Auto-Detect Type', icon: Search },
    { value: 'insurance', label: 'Insurance Policy', icon: FileText },
    { value: 'court-order', label: 'Court Order', icon: Gavel },
    { value: 'discovery', label: 'Discovery Request', icon: Search },
    { value: 'complaint', label: 'Complaint/Petition', icon: Scale },
    { value: 'settlement', label: 'Settlement Agreement', icon: DollarSign },
    { value: 'correspondence', label: 'Legal Correspondence', icon: Mail },
    { value: 'expert-report', label: 'Expert Report', icon: FileText },
    { value: 'deposition', label: 'Deposition', icon: Users },
    { value: 'contract', label: 'Contract/Agreement', icon: FileText },
    { value: 'evidence', label: 'Evidence/Exhibit', icon: Camera },
    { value: 'other', label: 'Other Legal Document', icon: File }
  ];

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setFileName(file.name);
    setUploading(true);

    try {
      // For PDF files, we'll extract text
      if (file.type === 'application/pdf') {
        // Note: You'll need to add pdf.js library for this
        // For now, we'll use demo mode
        toast('PDF processing requires additional setup. Using demo mode.');
        
        // Demo text for testing
        const demoInsuranceText = `
          HOMEOWNER'S INSURANCE POLICY
          Policy Number: HO-123456789
          Insured: ${clientName}
          
          COVERAGE LIMITS:
          Dwelling Coverage (Coverage A): $850,000
          Other Structures (Coverage B): $85,000
          Personal Property (Coverage C): $425,000
          Loss of Use (Coverage D): $255,000
          
          DEDUCTIBLE: $5,000
          
          EXCLUSIONS:
          - Earthquake damage
          - Flood damage
          - Earth movement
          - Neglect
          - Power failure
          
          WILDFIRE COVERAGE:
          This policy covers direct physical loss caused by wildfire, subject to policy limits and deductibles.
          
          ADDITIONAL LIVING EXPENSES:
          Covers necessary increase in living expenses incurred by the insured to maintain normal standard of living.
          Limited to 30% of dwelling coverage or 24 months, whichever comes first.
          
          DEBRIS REMOVAL:
          Coverage for debris removal is included up to 5% of the dwelling limit.
        `;
        
        setDocumentText(demoInsuranceText);
        
        // Auto-detect document type from filename if set to auto
        if (documentType === 'auto') {
          const detectedType = detectDocumentType(file.name);
          setDocumentType(detectedType);
        }
        
        analyzeDocument(demoInsuranceText, documentType);
      } else {
        // Handle text files
        const reader = new FileReader();
        reader.onload = (e) => {
          const text = e.target.result;
          setDocumentText(text);
          
          // Auto-detect document type from filename if set to auto
          if (documentType === 'auto') {
            const detectedType = detectDocumentType(file.name);
            setDocumentType(detectedType);
          }
          
          analyzeDocument(text, documentType);
        };
        reader.readAsText(file);
      }
    } catch (error) {
      console.error('Error uploading file:', error);
      toast.error('Error uploading file');
    } finally {
      setUploading(false);
    }
  };

  const detectDocumentType = (filename) => {
    const lower = filename.toLowerCase();
    if (lower.includes('insurance') || lower.includes('policy')) return 'insurance';
    if (lower.includes('order') || lower.includes('ruling')) return 'court-order';
    if (lower.includes('discovery') || lower.includes('request')) return 'discovery';
    if (lower.includes('complaint') || lower.includes('petition')) return 'complaint';
    if (lower.includes('settlement') || lower.includes('agreement')) return 'settlement';
    if (lower.includes('deposition') || lower.includes('depo')) return 'deposition';
    if (lower.includes('expert') || lower.includes('report')) return 'expert-report';
    if (lower.includes('correspondence') || lower.includes('letter')) return 'correspondence';
    if (lower.includes('contract')) return 'contract';
    if (lower.includes('evidence') || lower.includes('exhibit')) return 'evidence';
    return 'other';
  };

  const analyzeDocument = async (text, type) => {
    setAnalyzing(true);
    
    // Customize the analysis based on document type
    const analysisPrompt = getAnalysisPrompt(type, text);
    
    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${OPENAI_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4',
          messages: [
            {
              role: 'system',
              content: `You are an expert legal analyst specializing in California fire litigation. 
                       Analyze legal documents and extract key information relevant to fire victim cases.`
            },
            {
              role: 'user',
              content: analysisPrompt
            }
          ],
          temperature: 0.3,
          max_tokens: 2000
        })
      });

      const data = await response.json();
      
      if (data.error) {
        throw new Error(data.error.message);
      }

      const analysisResult = JSON.parse(data.choices[0].message.content);
      setAnalysis(analysisResult);
      
      // Save to localStorage for this client
      const storageKey = `document_analysis_${clientId}_${Date.now()}`;
      localStorage.setItem(storageKey, JSON.stringify({
        fileName,
        documentType: type,
        date: new Date().toISOString(),
        analysis: analysisResult
      }));
      
      toast.success('Document analyzed successfully!');
    } catch (error) {
      console.error('Error analyzing document:', error);
      toast.error('Error analyzing document. Using demo analysis.');
      
      // Set demo analysis for testing
      setAnalysis(getDemoAnalysis(type));
    } finally {
      setAnalyzing(false);
    }
  };

  const getAnalysisPrompt = (type, text) => {
    const basePrompt = `Analyze this ${type} document for a fire litigation case. Document text: ${text}\n\n`;
    
    switch(type) {
      case 'insurance':
        return `${basePrompt} Extract coverage limits, deductibles, exclusions, and fire-specific provisions. 
                Format as JSON with fields: policyNumber, coverageLimits (object with dwelling, personalProperty, lossOfUse, otherStructures, debrisRemoval), 
                deductible, totalPossiblePayout, exclusions (array), concerns (array), advantages (array), recommendations (array), 
                timeLimit, additionalLivingExpense (object with limit and duration).`;
      
      case 'court-order':
        return `${basePrompt} Extract: 1) Key rulings/orders, 2) Deadlines imposed, 3) Required actions, 4) Parties affected, 
                5) Compliance requirements, 6) Important dates. 
                Format as JSON with fields: orderType, keyRulings (array), deadlines (array of objects with date and description), 
                requiredActions (array), affectedParties (array), complianceItems (array), recommendations (array).`;
      
      case 'discovery':
        return `${basePrompt} Extract: 1) Documents requested, 2) Response deadline, 3) Interrogatories, 4) Admissions requested, 
                5) Objectionable requests, 6) Strategy recommendations. 
                Format as JSON with fields: requestType, documentsRequested (array), interrogatories (array), 
                deadlines (array of objects with date and description), objectionableItems (array), 
                strategyNotes, recommendations (array).`;
      
      case 'complaint':
        return `${basePrompt} Extract: 1) Causes of action, 2) Defendants named, 3) Damages claimed, 4) Key allegations, 
                5) Legal theories, 6) Weaknesses/strengths. 
                Format as JSON with fields: causesOfAction (array), defendants (array), damagesClaimed (object), 
                keyAllegations (array), legalTheories (array), strengths (array), weaknesses (array), recommendations (array).`;
      
      case 'settlement':
        return `${basePrompt} Extract: 1) Settlement amount, 2) Payment terms, 3) Release provisions, 4) Conditions, 
                5) Deadlines, 6) Pros/cons. 
                Format as JSON with fields: settlementAmount (number), paymentTerms, releaseProvisions (array), 
                conditions (array), deadlines (array of objects with date and description), 
                advantages (array), disadvantages (array), recommendations (array).`;
      
      case 'expert-report':
        return `${basePrompt} Extract: 1) Expert conclusions, 2) Key opinions, 3) Methodology, 4) Supporting evidence, 
                5) Weaknesses, 6) How to use/counter. 
                Format as JSON with fields: expertName, conclusions (array), keyOpinions (array), methodology (array), 
                supportingEvidence (array), weaknesses (array), howToUse, recommendations (array).`;
      
      case 'correspondence':
        return `${basePrompt} Extract: 1) Main points, 2) Any deadlines mentioned, 3) Action items required, 
                4) Parties involved, 5) Legal implications. 
                Format as JSON with fields: from, to, date, mainPoints (array), deadlines (array of objects), 
                actionItems (array), legalImplications (array), recommendations (array).`;
      
      case 'deposition':
        return `${basePrompt} Extract: 1) Key testimony, 2) Admissions made, 3) Contradictions, 4) Helpful testimony, 
                5) Harmful testimony, 6) Follow-up needed. 
                Format as JSON with fields: deponent, date, keyTestimony (array), admissions (array), 
                contradictions (array), helpfulPoints (array), harmfulPoints (array), followUpNeeded (array), recommendations (array).`;
      
      case 'contract':
        return `${basePrompt} Extract: 1) Parties, 2) Key terms, 3) Payment provisions, 4) Termination clauses, 
                5) Dispute resolution, 6) Important dates. 
                Format as JSON with fields: parties (array), keyTerms (array), paymentProvisions, 
                terminationClauses (array), disputeResolution, importantDates (array), concerns (array), recommendations (array).`;
      
      case 'evidence':
        return `${basePrompt} Analyze this evidence/exhibit for: 1) What it proves, 2) Relevance to fire case, 
                3) Authenticity issues, 4) How to use it, 5) Potential objections. 
                Format as JSON with fields: exhibitType, whatItProves (array), relevanceToCase, 
                authenticityIssues (array), howToUse (array), potentialObjections (array), recommendations (array).`;
      
      default:
        return `${basePrompt} Extract all key information relevant to fire litigation including: 
                1) Main points, 2) Important dates/deadlines, 3) Action items, 4) Parties involved, 
                5) Financial implications, 6) Legal implications, 7) Recommendations. 
                Format as JSON with appropriate fields.`;
    }
  };

  const getDemoAnalysis = (type) => {
    // Return demo analysis based on document type
    const demoAnalyses = {
      'insurance': {
        policyNumber: "HO-123456789",
        coverageLimits: {
          dwelling: 850000,
          personalProperty: 425000,
          lossOfUse: 255000,
          otherStructures: 85000,
          debrisRemoval: 42500
        },
        deductible: 5000,
        totalPossiblePayout: 1657500,
        exclusions: ["Earthquake damage", "Flood damage", "Earth movement", "Neglect", "Power failure"],
        concerns: [
          "24-month limit on additional living expenses may be insufficient",
          "5% debris removal may be low for total loss",
          "High deductible of $5,000"
        ],
        advantages: [
          "Explicit wildfire coverage confirmed",
          "High personal property limit at 50% of dwelling",
          "Additional living expenses covered up to 30% of dwelling"
        ],
        recommendations: [
          "Document all personal property with photos/receipts",
          "Track all additional living expenses from day one",
          "Consider if debris removal will exceed 5% limit",
          "File claim immediately to start time limits"
        ],
        timeLimit: "2 years from date of loss",
        additionalLivingExpense: {
          limit: 255000,
          duration: "24 months"
        }
      },
      'court-order': {
        orderType: "Case Management Order",
        keyRulings: [
          "All fire cases consolidated for pretrial proceedings",
          "Bellwether trials scheduled for March 2026",
          "Discovery to proceed in phases"
        ],
        deadlines: [
          { date: "2025-10-15", description: "Plaintiff fact sheets due" },
          { date: "2025-11-30", description: "Discovery cutoff" },
          { date: "2025-12-15", description: "Expert designation deadline" }
        ],
        requiredActions: [
          "File plaintiff fact sheets",
          "Complete document production",
          "Attend monthly status conferences"
        ],
        affectedParties: ["All plaintiffs", "Utility defendants", "Insurance defendants"],
        complianceItems: [
          "Monthly status reports required",
          "Meet and confer before discovery motions",
          "Electronic filing mandatory"
        ],
        recommendations: [
          "Calendar all deadlines immediately",
          "Prepare fact sheets early",
          "Coordinate with co-counsel on discovery plan"
        ]
      },
      'discovery': {
        requestType: "Request for Production of Documents",
        documentsRequested: [
          "All insurance policies in effect at time of fire",
          "All photographs of property damage",
          "All repair estimates and invoices",
          "All communication with insurance carriers",
          "All documents related to property value"
        ],
        interrogatories: [
          "Describe all property damage",
          "List all personal property losses",
          "State all living expenses incurred"
        ],
        deadlines: [
          { date: "2025-10-01", description: "Response due (30 days from service)" }
        ],
        objectionableItems: [
          "Request #5 is overly broad and unduly burdensome",
          "Request #12 seeks privileged attorney communications",
          "Request #18 is not reasonably calculated to lead to admissible evidence"
        ],
        strategyNotes: "Object to overbroad requests while producing core documents",
        recommendations: [
          "Start gathering documents immediately",
          "Review all documents for privilege",
          "Consider seeking protective order for overbroad requests",
          "Coordinate with clients on document collection"
        ]
      },
      'complaint': {
        causesOfAction: [
          "Negligence",
          "Inverse Condemnation",
          "Public Nuisance",
          "Private Nuisance",
          "Trespass",
          "Violation of Public Utilities Code"
        ],
        defendants: [
          "Pacific Gas & Electric Company",
          "Southern California Edison",
          "Edison International"
        ],
        damagesClaimed: {
          economic: "Property damage, loss of use, living expenses, personal property",
          nonEconomic: "Emotional distress, loss of enjoyment, inconvenience"
        },
        keyAllegations: [
          "Failure to maintain power lines",
          "Failure to de-energize during high wind events",
          "Ignored weather warnings",
          "Inadequate vegetation management"
        ],
        legalTheories: [
          "Strict liability for inverse condemnation",
          "Negligence per se based on safety violations",
          "Res ipsa loquitur"
        ],
        strengths: [
          "Strong causation evidence from Cal Fire report",
          "Multiple viable theories of liability",
          "Similar successful cases as precedent"
        ],
        weaknesses: [
          "Statute of limitations issues for some claims",
          "Comparative negligence defenses possible",
          "Insurance coverage disputes likely"
        ],
        recommendations: [
          "Amend to add specific damage amounts when calculated",
          "Consider adding punitive damages claim",
          "Ensure all defendants properly named",
          "Review for additional causes of action"
        ]
      },
      'settlement': {
        settlementAmount: 500000,
        paymentTerms: "Lump sum payment within 30 days of execution",
        releaseProvisions: [
          "Full release of all claims against defendant",
          "Release of unknown claims under Civil Code 1542",
          "Dismissal with prejudice required"
        ],
        conditions: [
          "Settlement contingent on all plaintiffs accepting",
          "Confidentiality clause included",
          "No admission of liability"
        ],
        deadlines: [
          { date: "2025-10-30", description: "Acceptance deadline" },
          { date: "2025-11-15", description: "Payment deadline if accepted" }
        ],
        advantages: [
          "Quick resolution and payment",
          "Avoids trial uncertainty",
          "Guaranteed recovery"
        ],
        disadvantages: [
          "Amount below full damage value",
          "Includes broad release",
          "Confidentiality restricts discussion"
        ],
        recommendations: [
          "Compare to likely trial outcome",
          "Consider counter-offer for higher amount",
          "Review carefully with client",
          "Calculate net after attorneys fees"
        ]
      },
      'expert-report': {
        expertName: "Dr. John Smith, Fire Origin & Cause Expert",
        conclusions: [
          "Fire originated from power line contact with vegetation",
          "Wind conditions exceeded safe operating parameters",
          "Utility failed to de-energize despite warnings"
        ],
        keyOpinions: [
          "Fire was preventable with proper line maintenance",
          "De-energization would have prevented ignition",
          "Vegetation clearance was inadequate"
        ],
        methodology: [
          "Site inspection and documentation",
          "Weather data analysis",
          "Equipment examination",
          "Witness interview review"
        ],
        supportingEvidence: [
          "Cal Fire investigation report",
          "Weather station data",
          "Maintenance records",
          "Photographic evidence"
        ],
        weaknesses: [
          "Limited physical evidence due to destruction",
          "Some conclusions based on circumstantial evidence",
          "No direct observation of ignition"
        ],
        howToUse: "Strong support for causation and negligence claims",
        recommendations: [
          "Depose expert early to lock in testimony",
          "Use report for settlement leverage",
          "Prepare for Daubert challenges",
          "Consider supplemental report if new evidence emerges"
        ]
      },
      'correspondence': {
        from: "Opposing Counsel",
        to: "Our Firm",
        date: "2025-09-15",
        mainPoints: [
          "Proposing settlement conference",
          "Requesting extension for discovery responses",
          "Confirming meet and confer date"
        ],
        deadlines: [
          { date: "2025-09-25", description: "Respond regarding settlement conference" },
          { date: "2025-09-30", description: "Meet and confer scheduled" }
        ],
        actionItems: [
          "Respond to settlement conference proposal",
          "Consider discovery extension request",
          "Prepare for meet and confer"
        ],
        legalImplications: [
          "Settlement discussions may affect trial timeline",
          "Discovery extension impacts case schedule"
        ],
        recommendations: [
          "Agree to settlement conference",
          "Grant extension in exchange for reciprocal courtesy",
          "Document all agreements in writing"
        ]
      },
      'deposition': {
        deponent: "John Doe, Former Utility Employee",
        date: "2025-09-10",
        keyTestimony: [
          "Confirmed maintenance was deferred",
          "Acknowledged weather warnings received",
          "Testified about company cost-cutting measures"
        ],
        admissions: [
          "Equipment was past replacement date",
          "Vegetation clearance was behind schedule",
          "Prior incidents in same area"
        ],
        contradictions: [
          "Timeline conflicts with company records",
          "Description of procedures varies from manual"
        ],
        helpfulPoints: [
          "Establishes knowledge of risk",
          "Shows pattern of deferred maintenance",
          "Confirms receipt of weather warnings"
        ],
        harmfulPoints: [
          "Claims decisions were reasonable at time",
          "Points to budget constraints"
        ],
        followUpNeeded: [
          "Obtain referenced maintenance records",
          "Interview other employees mentioned",
          "Get expert opinion on testimony"
        ],
        recommendations: [
          "Use key admissions in motion practice",
          "Prepare cross-examination for trial",
          "Consider additional depositions of supervisors",
          "Designate key portions for trial"
        ]
      },
      'contract': {
        parties: ["Client", "Contractor"],
        keyTerms: [
          "Scope of repair work",
          "Total contract price",
          "Payment schedule",
          "Completion timeline"
        ],
        paymentProvisions: "50% upfront, 50% on completion",
        terminationClauses: [
          "Either party may terminate with 30 days notice",
          "Immediate termination for material breach"
        ],
        disputeResolution: "Binding arbitration required",
        importantDates: [
          { date: "2025-10-01", description: "Work commencement date" },
          { date: "2025-12-31", description: "Completion deadline" }
        ],
        concerns: [
          "No provision for cost overruns",
          "Limited warranty period",
          "Arbitration clause may limit remedies"
        ],
        recommendations: [
          "Negotiate better payment terms",
          "Add provisions for change orders",
          "Consider requiring performance bond",
          "Review insurance requirements"
        ]
      },
      'evidence': {
        exhibitType: "Photographic Evidence",
        whatItProves: [
          "Extent of property damage",
          "Condition before fire",
          "Personal property losses"
        ],
        relevanceToCase: "Directly shows damages for compensation claim",
        authenticityIssues: [
          "Need witness to authenticate",
          "Metadata should be preserved",
          "Chain of custody documentation needed"
        ],
        howToUse: [
          "Opening statement visuals",
          "Damage expert testimony support",
          "Settlement negotiation leverage"
        ],
        potentialObjections: [
          "Lack of foundation",
          "Hearsay if used for certain purposes",
          "Prejudicial if too graphic"
        ],
        recommendations: [
          "Create authentication affidavit",
          "Organize chronologically",
          "Prepare enlarged exhibits for trial",
          "Create comparison before/after boards"
        ]
      },
      'other': {
        documentType: "Legal Document",
        keyPoints: [
          "Important legal document requiring detailed review",
          "Multiple issues identified requiring attention",
          "Several deadlines and action items noted"
        ],
        dates: ["Various dates identified in document"],
        parties: ["Multiple parties involved"],
        actionItems: [
          "Review document thoroughly",
          "Identify relevant sections for case",
          "Consider impact on litigation strategy"
        ],
        recommendations: [
          "Conduct detailed manual review",
          "Consult with team on implications",
          "Add to case file and index",
          "Consider follow-up actions needed"
        ]
      }
    };
    
    return demoAnalyses[type] || demoAnalyses['other'];
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const renderAnalysisResults = () => {
    if (!analysis) return null;
    
    // Render different UI based on document type
    switch(documentType) {
      case 'insurance':
        return renderInsuranceAnalysis();
      case 'court-order':
        return renderCourtOrderAnalysis();
      case 'discovery':
        return renderDiscoveryAnalysis();
      case 'complaint':
        return renderComplaintAnalysis();
      case 'settlement':
        return renderSettlementAnalysis();
      case 'expert-report':
        return renderExpertReportAnalysis();
      case 'correspondence':
        return renderCorrespondenceAnalysis();
      case 'deposition':
        return renderDepositionAnalysis();
      case 'contract':
        return renderContractAnalysis();
      case 'evidence':
        return renderEvidenceAnalysis();
      default:
        return renderGenericAnalysis();
    }
  };

  const renderInsuranceAnalysis = () => (
    <>
      <div className="coverage-summary">
        <h5>Coverage Limits</h5>
        <div className="coverage-grid">
          {Object.entries(analysis.coverageLimits || {}).map(([key, value]) => (
            <div key={key} className="coverage-item">
              <span className="coverage-label">{key.replace(/([A-Z])/g, ' $1').trim()}</span>
              <span className="coverage-amount">{formatCurrency(value)}</span>
            </div>
          ))}
          {analysis.totalPossiblePayout && (
            <div className="coverage-item total">
              <span className="coverage-label">Total Possible Payout</span>
              <span className="coverage-amount">{formatCurrency(analysis.totalPossiblePayout)}</span>
            </div>
          )}
        </div>
      </div>
      
      <div className="key-info">
        <div className="info-item">
          <strong>Policy Number:</strong> {analysis.policyNumber}
        </div>
        <div className="info-item">
          <strong>Deductible:</strong> {formatCurrency(analysis.deductible)}
        </div>
        <div className="info-item">
          <strong>Time Limit:</strong> {analysis.timeLimit}
        </div>
        {analysis.additionalLivingExpense && (
          <div className="info-item">
            <strong>Additional Living Expenses:</strong> {formatCurrency(analysis.additionalLivingExpense.limit)} for {analysis.additionalLivingExpense.duration}
          </div>
        )}
      </div>
      
      {analysis.exclusions && analysis.exclusions.length > 0 && (
        <div className="analysis-section exclusions">
          <h5>
            <X size={18} />
            Exclusions
          </h5>
          <ul>
            {analysis.exclusions.map((exclusion, index) => (
              <li key={index}>{exclusion}</li>
            ))}
          </ul>
        </div>
      )}
      
      {renderCommonSections()}
    </>
  );

  const renderCourtOrderAnalysis = () => (
    <>
      <div className="order-summary">
        <h5>Court Order: {analysis.orderType}</h5>
        <div className="key-rulings">
          <h6>Key Rulings:</h6>
          <ul>
            {analysis.keyRulings?.map((ruling, i) => (
              <li key={i}>{ruling}</li>
            ))}
          </ul>
        </div>
        
        {analysis.requiredActions && analysis.requiredActions.length > 0 && (
          <div className="required-actions">
            <h6>Required Actions:</h6>
            <ul>
              {analysis.requiredActions.map((action, i) => (
                <li key={i}>{action}</li>
              ))}
            </ul>
          </div>
        )}
        
        {analysis.affectedParties && analysis.affectedParties.length > 0 && (
          <div className="affected-parties">
            <h6>Affected Parties:</h6>
            <ul>
              {analysis.affectedParties.map((party, i) => (
                <li key={i}>{party}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
      {renderDeadlines()}
      {renderCommonSections()}
    </>
  );

  const renderDiscoveryAnalysis = () => (
    <>
      <div className="discovery-summary">
        <h5>Discovery: {analysis.requestType}</h5>
        
        {analysis.documentsRequested && analysis.documentsRequested.length > 0 && (
          <div className="documents-requested">
            <h6>Documents Requested:</h6>
            <ul>
              {analysis.documentsRequested.map((doc, i) => (
                <li key={i}>{doc}</li>
              ))}
            </ul>
          </div>
        )}
        
        {analysis.interrogatories && analysis.interrogatories.length > 0 && (
          <div className="interrogatories">
            <h6>Interrogatories:</h6>
            <ul>
              {analysis.interrogatories.map((interrogatory, i) => (
                <li key={i}>{interrogatory}</li>
              ))}
            </ul>
          </div>
        )}
        
        {analysis.objectionableItems && analysis.objectionableItems.length > 0 && (
          <div className="objections">
            <h6>Potential Objections:</h6>
            <ul>
              {analysis.objectionableItems.map((item, i) => (
                <li key={i}>{item}</li>
              ))}
            </ul>
          </div>
        )}
        
        {analysis.strategyNotes && (
          <div className="strategy">
            <h6>Strategy Notes:</h6>
            <p>{analysis.strategyNotes}</p>
          </div>
        )}
      </div>
      {renderDeadlines()}
      {renderCommonSections()}
    </>
  );

  const renderComplaintAnalysis = () => (
    <>
      <div className="complaint-summary">
        <h5>Causes of Action</h5>
        <ul>
          {analysis.causesOfAction?.map((cause, i) => (
            <li key={i}>{cause}</li>
          ))}
        </ul>
        
        <h6>Named Defendants:</h6>
        <ul>
          {analysis.defendants?.map((defendant, i) => (
            <li key={i}>{defendant}</li>
          ))}
        </ul>
        
        {analysis.damagesClaimed && (
          <div className="damages">
            <h6>Damages Claimed:</h6>
            {typeof analysis.damagesClaimed === 'object' ? (
              <ul>
                {Object.entries(analysis.damagesClaimed).map(([key, value]) => (
                  <li key={key}><strong>{key}:</strong> {value}</li>
                ))}
              </ul>
            ) : (
              <p>{analysis.damagesClaimed}</p>
            )}
          </div>
        )}
        
        {analysis.keyAllegations && analysis.keyAllegations.length > 0 && (
          <div className="allegations">
            <h6>Key Allegations:</h6>
            <ul>
              {analysis.keyAllegations.map((allegation, i) => (
                <li key={i}>{allegation}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
      {renderCommonSections()}
    </>
  );

  const renderSettlementAnalysis = () => (
    <>
      <div className="settlement-summary">
        <h5>Settlement Terms</h5>
        <div className="settlement-amount">
          <strong>Amount:</strong> {formatCurrency(analysis.settlementAmount)}
        </div>
        <div className="payment-terms">
          <strong>Payment:</strong> {analysis.paymentTerms}
        </div>
        
        {analysis.releaseProvisions && analysis.releaseProvisions.length > 0 && (
          <div className="release-provisions">
            <h6>Release Provisions:</h6>
            <ul>
              {analysis.releaseProvisions.map((provision, i) => (
                <li key={i}>{provision}</li>
              ))}
            </ul>
          </div>
        )}
        
        {analysis.conditions && analysis.conditions.length > 0 && (
          <div className="conditions">
            <h6>Conditions:</h6>
            <ul>
              {analysis.conditions.map((condition, i) => (
                <li key={i}>{condition}</li>
              ))}
            </ul>
          </div>
        )}
        
        {analysis.disadvantages && analysis.disadvantages.length > 0 && (
          <div className="disadvantages">
            <h6>Disadvantages:</h6>
            <ul>
              {analysis.disadvantages.map((disadvantage, i) => (
                <li key={i}>{disadvantage}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
      {renderDeadlines()}
      {renderCommonSections()}
    </>
  );

  const renderExpertReportAnalysis = () => (
    <>
      <div className="expert-summary">
        <h5>{analysis.expertName}</h5>
        
        {analysis.conclusions && analysis.conclusions.length > 0 && (
          <div className="conclusions">
            <h6>Key Conclusions:</h6>
            <ul>
              {analysis.conclusions.map((conclusion, i) => (
                <li key={i}>{conclusion}</li>
              ))}
            </ul>
          </div>
        )}
        
        {analysis.keyOpinions && analysis.keyOpinions.length > 0 && (
          <div className="opinions">
            <h6>Key Opinions:</h6>
            <ul>
              {analysis.keyOpinions.map((opinion, i) => (
                <li key={i}>{opinion}</li>
              ))}
            </ul>
          </div>
        )}
        
        {analysis.methodology && analysis.methodology.length > 0 && (
          <div className="methodology">
            <h6>Methodology:</h6>
            <ul>
              {analysis.methodology.map((method, i) => (
                <li key={i}>{method}</li>
              ))}
            </ul>
          </div>
        )}
        
        {analysis.supportingEvidence && analysis.supportingEvidence.length > 0 && (
          <div className="evidence">
            <h6>Supporting Evidence:</h6>
            <ul>
              {analysis.supportingEvidence.map((evidence, i) => (
                <li key={i}>{evidence}</li>
              ))}
            </ul>
          </div>
        )}
        
        {analysis.howToUse && (
          <div className="how-to-use">
            <h6>How to Use:</h6>
            <p>{analysis.howToUse}</p>
          </div>
        )}
      </div>
      {renderCommonSections()}
    </>
  );

  const renderCorrespondenceAnalysis = () => (
    <>
      <div className="correspondence-summary">
        <h5>Legal Correspondence</h5>
        <div className="correspondence-header">
          <p><strong>From:</strong> {analysis.from}</p>
          <p><strong>To:</strong> {analysis.to}</p>
          <p><strong>Date:</strong> {analysis.date}</p>
        </div>
        
        {analysis.mainPoints && analysis.mainPoints.length > 0 && (
          <div className="main-points">
            <h6>Main Points:</h6>
            <ul>
              {analysis.mainPoints.map((point, i) => (
                <li key={i}>{point}</li>
              ))}
            </ul>
          </div>
        )}
        
        {analysis.actionItems && analysis.actionItems.length > 0 && (
          <div className="action-items">
            <h6>Action Items:</h6>
            <ul>
              {analysis.actionItems.map((item, i) => (
                <li key={i}>{item}</li>
              ))}
            </ul>
          </div>
        )}
        
        {analysis.legalImplications && analysis.legalImplications.length > 0 && (
          <div className="legal-implications">
            <h6>Legal Implications:</h6>
            <ul>
              {analysis.legalImplications.map((implication, i) => (
                <li key={i}>{implication}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
      {renderDeadlines()}
      {renderCommonSections()}
    </>
  );

  const renderDepositionAnalysis = () => (
    <>
      <div className="deposition-summary">
        <h5>Deposition: {analysis.deponent}</h5>
        <p><strong>Date:</strong> {analysis.date}</p>
        
        {analysis.keyTestimony && analysis.keyTestimony.length > 0 && (
          <div className="key-testimony">
            <h6>Key Testimony:</h6>
            <ul>
              {analysis.keyTestimony.map((testimony, i) => (
                <li key={i}>{testimony}</li>
              ))}
            </ul>
          </div>
        )}
        
        {analysis.admissions && analysis.admissions.length > 0 && (
          <div className="admissions">
            <h6>Admissions:</h6>
            <ul>
              {analysis.admissions.map((admission, i) => (
                <li key={i}>{admission}</li>
              ))}
            </ul>
          </div>
        )}
        
        {analysis.contradictions && analysis.contradictions.length > 0 && (
          <div className="contradictions">
            <h6>Contradictions:</h6>
            <ul>
              {analysis.contradictions.map((contradiction, i) => (
                <li key={i}>{contradiction}</li>
              ))}
            </ul>
          </div>
        )}
        
        {analysis.helpfulPoints && analysis.helpfulPoints.length > 0 && (
          <div className="helpful-points">
            <h6>Helpful Points:</h6>
            <ul>
              {analysis.helpfulPoints.map((point, i) => (
                <li key={i}>{point}</li>
              ))}
            </ul>
          </div>
        )}
        
        {analysis.harmfulPoints && analysis.harmfulPoints.length > 0 && (
          <div className="harmful-points">
            <h6>Harmful Points:</h6>
            <ul>
              {analysis.harmfulPoints.map((point, i) => (
                <li key={i}>{point}</li>
              ))}
            </ul>
          </div>
        )}
        
        {analysis.followUpNeeded && analysis.followUpNeeded.length > 0 && (
          <div className="follow-up">
            <h6>Follow-Up Needed:</h6>
            <ul>
              {analysis.followUpNeeded.map((item, i) => (
                <li key={i}>{item}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
      {renderCommonSections()}
    </>
  );

  const renderContractAnalysis = () => (
    <>
      <div className="contract-summary">
        <h5>Contract Analysis</h5>
        
        {analysis.parties && analysis.parties.length > 0 && (
          <div className="parties">
            <h6>Parties:</h6>
            <ul>
              {analysis.parties.map((party, i) => (
                <li key={i}>{party}</li>
              ))}
            </ul>
          </div>
        )}
        
        {analysis.keyTerms && analysis.keyTerms.length > 0 && (
          <div className="key-terms">
            <h6>Key Terms:</h6>
            <ul>
              {analysis.keyTerms.map((term, i) => (
                <li key={i}>{term}</li>
              ))}
            </ul>
          </div>
        )}
        
        {analysis.paymentProvisions && (
          <div className="payment-provisions">
            <h6>Payment Provisions:</h6>
            <p>{analysis.paymentProvisions}</p>
          </div>
        )}
        
        {analysis.terminationClauses && analysis.terminationClauses.length > 0 && (
          <div className="termination">
            <h6>Termination Clauses:</h6>
            <ul>
              {analysis.terminationClauses.map((clause, i) => (
                <li key={i}>{clause}</li>
              ))}
            </ul>
          </div>
        )}
        
        {analysis.disputeResolution && (
          <div className="dispute-resolution">
            <h6>Dispute Resolution:</h6>
            <p>{analysis.disputeResolution}</p>
          </div>
        )}
        
        {analysis.importantDates && analysis.importantDates.length > 0 && (
          <div className="important-dates">
            <h6>Important Dates:</h6>
            <ul>
              {analysis.importantDates.map((date, i) => (
                <li key={i}>
                  <strong>{date.date}</strong>: {date.description}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
      {renderCommonSections()}
    </>
  );

  const renderEvidenceAnalysis = () => (
    <>
      <div className="evidence-summary">
        <h5>Evidence: {analysis.exhibitType}</h5>
        
        {analysis.whatItProves && analysis.whatItProves.length > 0 && (
          <div className="what-it-proves">
            <h6>What It Proves:</h6>
            <ul>
              {analysis.whatItProves.map((item, i) => (
                <li key={i}>{item}</li>
              ))}
            </ul>
          </div>
        )}
        
        {analysis.relevanceToCase && (
          <div className="relevance">
            <h6>Relevance to Case:</h6>
            <p>{analysis.relevanceToCase}</p>
          </div>
        )}
        
        {analysis.authenticityIssues && analysis.authenticityIssues.length > 0 && (
          <div className="authenticity">
            <h6>Authenticity Issues:</h6>
            <ul>
              {analysis.authenticityIssues.map((issue, i) => (
                <li key={i}>{issue}</li>
              ))}
            </ul>
          </div>
        )}
        
        {analysis.howToUse && analysis.howToUse.length > 0 && (
          <div className="how-to-use">
            <h6>How to Use:</h6>
            <ul>
              {analysis.howToUse.map((use, i) => (
                <li key={i}>{use}</li>
              ))}
            </ul>
          </div>
        )}
        
        {analysis.potentialObjections && analysis.potentialObjections.length > 0 && (
          <div className="objections">
            <h6>Potential Objections:</h6>
            <ul>
              {analysis.potentialObjections.map((objection, i) => (
                <li key={i}>{objection}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
      {renderCommonSections()}
    </>
  );

  const renderGenericAnalysis = () => (
    <>
      <div className="generic-summary">
        <h5>Document Analysis</h5>
        {Object.entries(analysis).map(([key, value]) => {
          if (key === 'recommendations' || key === 'concerns' || key === 'advantages' || 
              key === 'strengths' || key === 'weaknesses' || key === 'deadlines') {
            return null; // These are handled by renderCommonSections
          }
          
          return (
            <div key={key} className="analysis-item">
              <strong>{key.replace(/([A-Z])/g, ' $1').trim()}:</strong>
              {Array.isArray(value) ? (
                <ul>
                  {value.map((item, i) => (
                    <li key={i}>{typeof item === 'object' ? JSON.stringify(item) : item}</li>
                  ))}
                </ul>
              ) : typeof value === 'object' ? (
                <pre>{JSON.stringify(value, null, 2)}</pre>
              ) : (
                <span> {value}</span>
              )}
            </div>
          );
        })}
      </div>
      {renderDeadlines()}
      {renderCommonSections()}
    </>
  );

  const renderDeadlines = () => {
    if (!analysis.deadlines || analysis.deadlines.length === 0) return null;
    
    return (
      <div className="deadlines-section">
        <h5>
          <Calendar size={18} />
          Deadlines
        </h5>
        <ul>
          {analysis.deadlines.map((deadline, i) => (
            <li key={i}>
              <strong>{deadline.date}</strong>: {deadline.description}
            </li>
          ))}
        </ul>
      </div>
    );
  };

  const renderCommonSections = () => (
    <>
      {analysis.concerns && analysis.concerns.length > 0 && (
        <div className="analysis-section concerns">
          <h5><AlertTriangle size={18} /> Concerns</h5>
          <ul>
            {analysis.concerns.map((concern, i) => (
              <li key={i}>{concern}</li>
            ))}
          </ul>
        </div>
      )}
      
      {analysis.advantages && analysis.advantages.length > 0 && (
        <div className="analysis-section advantages">
          <h5><CheckCircle size={18} /> Advantages</h5>
          <ul>
            {analysis.advantages.map((advantage, i) => (
              <li key={i}>{advantage}</li>
            ))}
          </ul>
        </div>
      )}
      
      {analysis.strengths && analysis.strengths.length > 0 && (
        <div className="analysis-section advantages">
          <h5><CheckCircle size={18} /> Strengths</h5>
          <ul>
            {analysis.strengths.map((strength, i) => (
              <li key={i}>{strength}</li>
            ))}
          </ul>
        </div>
      )}
      
      {analysis.weaknesses && analysis.weaknesses.length > 0 && (
        <div className="analysis-section concerns">
          <h5><AlertTriangle size={18} /> Weaknesses</h5>
          <ul>
            {analysis.weaknesses.map((weakness, i) => (
              <li key={i}>{weakness}</li>
            ))}
          </ul>
        </div>
      )}
      
      {analysis.recommendations && analysis.recommendations.length > 0 && (
        <div className="analysis-section recommendations">
          <h5><AlertCircle size={18} /> Recommendations</h5>
          <ul>
            {analysis.recommendations.map((rec, i) => (
              <li key={i}>{rec}</li>
            ))}
          </ul>
        </div>
      )}
    </>
  );

  return (
    <div className="document-analyzer">
      <div className="analyzer-header">
        <h3>
          <FileText size={20} />
          AI Legal Document Analyzer
        </h3>
        <p>Upload any legal document for instant AI analysis</p>
      </div>

      {/* Document Type Selector */}
      <div className="document-type-selector">
        <label>Document Type:</label>
        <select 
          value={documentType} 
          onChange={(e) => setDocumentType(e.target.value)}
          className="document-type-select"
        >
          {documentTypes.map(type => (
            <option key={type.value} value={type.value}>
              {type.label}
            </option>
          ))}
        </select>
      </div>

      {/* Upload Section */}
      <div className="upload-section">
        <label htmlFor="doc-upload" className="upload-area">
          <Upload size={32} />
          <p>Click to upload document (PDF, TXT, DOC, DOCX)</p>
          <span className="upload-hint">
            {documentType === 'auto' ? 
              'Any legal document - will auto-detect type' : 
              `Upload ${documentTypes.find(t => t.value === documentType)?.label}`
            }
          </span>
          <input
            id="doc-upload"
            type="file"
            accept=".pdf,.txt,.doc,.docx"
            onChange={handleFileUpload}
            style={{ display: 'none' }}
          />
        </label>
      </div>

      {/* Status Indicators */}
      {uploading && (
        <div className="status-message">
          <Loader className="spinning" size={20} />
          Uploading {fileName}...
        </div>
      )}

      {analyzing && (
        <div className="status-message">
          <Loader className="spinning" size={20} />
          Analyzing {documentType === 'auto' ? 'document' : documentTypes.find(t => t.value === documentType)?.label} with AI...
        </div>
      )}

      {/* Analysis Results */}
      {analysis && (
        <div className="analysis-results">
          <div className="results-header">
            <h4>Analysis Results: {fileName}</h4>
            <span className="doc-type-badge">
              {documentTypes.find(t => t.value === documentType)?.label}
            </span>
            <button 
              className="btn-text" 
              onClick={() => {
                setAnalysis(null);
                setFileName('');
                setDocumentType('auto');
              }}
            >
              <X size={20} />
              Clear
            </button>
          </div>

          {renderAnalysisResults()}

          {/* Action Buttons */}
          <div className="analysis-actions">
            <button className="btn-primary">
              <FileText size={18} />
              Save to Case File
            </button>
            <button className="btn-secondary">
              <Mail size={18} />
              Email Summary
            </button>
            <button className="btn-secondary">
              <Calendar size={18} />
              Add Deadlines to Calendar
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default DocumentAnalyzer;
