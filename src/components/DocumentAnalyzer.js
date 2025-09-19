import React, { useState } from 'react';
import { Upload, FileText, AlertTriangle, CheckCircle, DollarSign, X, Loader, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';

const DocumentAnalyzer = ({ clientId, clientName }) => {
  const [uploading, setUploading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState(null);
  const [fileName, setFileName] = useState('');
  const [documentText, setDocumentText] = useState('');
  const OPENAI_API_KEY = process.env.REACT_APP_OPENAI_KEY; // Use environment variable
  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setFileName(file.name);
    setUploading(true);

    try {
      // For PDF files, we'll extract text
      if (file.type === 'application/pdf') {
        // Note: You'll need to add pdf.js library for this
        // For now, we'll use FileReader for text files
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
        analyzeDocument(demoInsuranceText);
      } else {
        // Handle text files
        const reader = new FileReader();
        reader.onload = (e) => {
          const text = e.target.result;
          setDocumentText(text);
          analyzeDocument(text);
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

  const analyzeDocument = async (text) => {
    setAnalyzing(true);
    
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
              content: `You are an expert insurance analyst specializing in California wildfire claims. 
                       Analyze insurance documents and extract key information for fire victims.`
            },
            {
              role: 'user',
              content: `Analyze this insurance document for a fire victim claim. Extract:
                1. Policy number
                2. Coverage limits (dwelling, personal property, loss of use, other structures)
                3. Deductibles
                4. Key exclusions that might affect a fire claim
                5. Specific wildfire/fire provisions
                6. Additional living expense limits
                7. Time limits for filing claims
                8. Any concerning limitations
                9. Total maximum payout possible
                10. Recommendations for the claim

                Document text:
                ${text}

                Format as JSON with these fields:
                {
                  "policyNumber": "",
                  "coverageLimits": {
                    "dwelling": 0,
                    "personalProperty": 0,
                    "lossOfUse": 0,
                    "otherStructures": 0,
                    "debrisRemoval": 0
                  },
                  "deductible": 0,
                  "totalPossiblePayout": 0,
                  "exclusions": [],
                  "concerns": [],
                  "advantages": [],
                  "recommendations": [],
                  "timeLimit": "",
                  "additionalLivingExpense": {
                    "limit": 0,
                    "duration": ""
                  }
                }`
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
      const storageKey = `insurance_analysis_${clientId}`;
      localStorage.setItem(storageKey, JSON.stringify({
        fileName,
        date: new Date().toISOString(),
        analysis: analysisResult
      }));
      
      toast.success('Document analyzed successfully!');
    } catch (error) {
      console.error('Error analyzing document:', error);
      toast.error('Error analyzing document. Check your API key.');
      
      // Set demo analysis for testing
      setAnalysis({
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
        exclusions: [
          "Earthquake damage",
          "Flood damage",
          "Earth movement"
        ],
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
      });
    } finally {
      setAnalyzing(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0
    }).format(amount);
  };

  return (
    <div className="document-analyzer">
      <div className="analyzer-header">
        <h3>
          <FileText size={20} />
          AI Insurance Document Analyzer
        </h3>
        <p>Upload insurance policies or claim documents for instant analysis</p>
      </div>

      {/* Upload Section */}
      <div className="upload-section">
        <label htmlFor="doc-upload" className="upload-area">
          <Upload size={32} />
          <p>Click to upload document (PDF, TXT)</p>
          <span className="upload-hint">Insurance policies, denial letters, claim forms</span>
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
          Analyzing document with AI...
        </div>
      )}

      {/* Analysis Results */}
      {analysis && (
        <div className="analysis-results">
          <div className="results-header">
            <h4>Analysis Results: {fileName}</h4>
            <button 
              className="btn-text" 
              onClick={() => {
                setAnalysis(null);
                setFileName('');
              }}
            >
              <X size={20} />
              Clear
            </button>
          </div>

          {/* Coverage Summary */}
          <div className="coverage-summary">
            <h5>Coverage Limits</h5>
            <div className="coverage-grid">
              <div className="coverage-item">
                <span className="coverage-label">Dwelling</span>
                <span className="coverage-amount">{formatCurrency(analysis.coverageLimits.dwelling)}</span>
              </div>
              <div className="coverage-item">
                <span className="coverage-label">Personal Property</span>
                <span className="coverage-amount">{formatCurrency(analysis.coverageLimits.personalProperty)}</span>
              </div>
              <div className="coverage-item">
                <span className="coverage-label">Loss of Use</span>
                <span className="coverage-amount">{formatCurrency(analysis.coverageLimits.lossOfUse)}</span>
              </div>
              <div className="coverage-item">
                <span className="coverage-label">Other Structures</span>
                <span className="coverage-amount">{formatCurrency(analysis.coverageLimits.otherStructures)}</span>
              </div>
              <div className="coverage-item">
                <span className="coverage-label">Debris Removal</span>
                <span className="coverage-amount">{formatCurrency(analysis.coverageLimits.debrisRemoval)}</span>
              </div>
              <div className="coverage-item total">
                <span className="coverage-label">Total Possible Payout</span>
                <span className="coverage-amount">{formatCurrency(analysis.totalPossiblePayout)}</span>
              </div>
            </div>
          </div>

          {/* Key Information */}
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
            <div className="info-item">
              <strong>Additional Living Expenses:</strong> {formatCurrency(analysis.additionalLivingExpense.limit)} for {analysis.additionalLivingExpense.duration}
            </div>
          </div>

          {/* Concerns */}
          {analysis.concerns.length > 0 && (
            <div className="analysis-section concerns">
              <h5>
                <AlertTriangle size={18} />
                Concerns
              </h5>
              <ul>
                {analysis.concerns.map((concern, index) => (
                  <li key={index}>{concern}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Advantages */}
          {analysis.advantages.length > 0 && (
            <div className="analysis-section advantages">
              <h5>
                <CheckCircle size={18} />
                Advantages
              </h5>
              <ul>
                {analysis.advantages.map((advantage, index) => (
                  <li key={index}>{advantage}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Exclusions */}
          {analysis.exclusions.length > 0 && (
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

          {/* Recommendations */}
          {analysis.recommendations.length > 0 && (
            <div className="analysis-section recommendations">
              <h5>
                <AlertCircle size={18} />
                Recommendations
              </h5>
              <ul>
                {analysis.recommendations.map((rec, index) => (
                  <li key={index}>{rec}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Compare to Damages Button */}
          <div className="analysis-actions">
            <button className="btn-primary">
              <DollarSign size={18} />
              Compare to Claimed Damages
            </button>
            <button className="btn-secondary">
              <FileText size={18} />
              Generate Claim Strategy
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default DocumentAnalyzer;
