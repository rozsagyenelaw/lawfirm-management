import React, { useState, useEffect } from 'react';
import { jsPDF } from 'jspdf'; // CORRECT IMPORT
import { DollarSign, Download, FileText } from 'lucide-react';
import { format } from 'date-fns';
import { useData } from '../context/DataContext';
import toast from 'react-hot-toast';

const InvoiceGenerator = ({ clientId, clientName }) => {
  const { addInvoice } = useData();
  const [invoiceData, setInvoiceData] = useState({
    invoiceNumber: `INV-${Date.now().toString().slice(-6)}`,
    billableHours: 0,
    hourlyRate: 350,
    description: '',
    items: []
  });

  // Load billable activities from ActivityLog
  useEffect(() => {
    const activityLog = JSON.parse(localStorage.getItem('activityLog') || '[]');
    const clientActivities = activityLog.filter(
      a => a.clientId === clientId && a.billable && !a.invoiced
    );
    
    const totalHours = clientActivities.reduce((sum, a) => sum + (a.duration || 0), 0);
    
    setInvoiceData(prev => ({
      ...prev,
      billableHours: totalHours,
      items: clientActivities
    }));
  }, [clientId]);

  const calculateTotal = () => {
    return invoiceData.billableHours * invoiceData.hourlyRate;
  };

  const generatePDF = () => {
    const doc = new jsPDF();
    
    // Header
    doc.setFontSize(20);
    doc.text('INVOICE', 105, 20, { align: 'center' });
    
    // Invoice Info
    doc.setFontSize(12);
    doc.text(`Invoice #: ${invoiceData.invoiceNumber}`, 20, 40);
    doc.text(`Date: ${format(new Date(), 'MMMM dd, yyyy')}`, 20, 50);
    doc.text(`Client: ${clientName}`, 20, 60);
    
    // Services
    doc.text('Services Rendered:', 20, 80);
    doc.setFontSize(10);
    
    let yPosition = 90;
    invoiceData.items.forEach(item => {
      doc.text(`${item.description || 'Legal Services'} - ${item.duration || 0} hours`, 25, yPosition);
      yPosition += 10;
    });
    
    // Totals
    doc.setFontSize(12);
    doc.text(`Total Hours: ${invoiceData.billableHours}`, 20, yPosition + 10);
    doc.text(`Rate: $${invoiceData.hourlyRate}/hour`, 20, yPosition + 20);
    doc.text(`Total: $${calculateTotal().toFixed(2)}`, 20, yPosition + 30);
    
    // Save
    doc.save(`invoice-${clientName}-${invoiceData.invoiceNumber}.pdf`);
    
    // Mark activities as invoiced
    const activityLog = JSON.parse(localStorage.getItem('activityLog') || '[]');
    const updatedLog = activityLog.map(a => {
      if (invoiceData.items.find(item => item.id === a.id)) {
        return { ...a, invoiced: true, invoiceNumber: invoiceData.invoiceNumber };
      }
      return a;
    });
    localStorage.setItem('activityLog', JSON.stringify(updatedLog));
    
    // Save invoice record
    addInvoice({
      clientId,
      clientName,
      invoiceNumber: invoiceData.invoiceNumber,
      amount: calculateTotal(),
      hours: invoiceData.billableHours,
      rate: invoiceData.hourlyRate,
      status: 'sent'
    });
    
    toast.success('Invoice generated successfully!');
  };

  return (
    <div className="invoice-generator">
      <h3>Invoice Generator</h3>
      
      <div className="invoice-summary">
        <div className="summary-item">
          <FileText size={18} />
          <span>Invoice #: {invoiceData.invoiceNumber}</span>
        </div>
        <div className="summary-item">
          <DollarSign size={18} />
          <span>Total: ${calculateTotal().toFixed(2)}</span>
        </div>
      </div>
      
      <div className="invoice-details">
        <div className="form-group">
          <label>Billable Hours</label>
          <input
            type="number"
            value={invoiceData.billableHours}
            onChange={(e) => setInvoiceData({...invoiceData, billableHours: parseFloat(e.target.value)})}
          />
        </div>
        
        <div className="form-group">
          <label>Hourly Rate ($)</label>
          <input
            type="number"
            value={invoiceData.hourlyRate}
            onChange={(e) => setInvoiceData({...invoiceData, hourlyRate: parseFloat(e.target.value)})}
          />
        </div>
      </div>
      
      <button 
        className="btn-primary"
        onClick={generatePDF}
        disabled={invoiceData.billableHours === 0}
      >
        <Download size={18} />
        Generate Invoice PDF
      </button>
    </div>
  );
};

export default InvoiceGenerator;
