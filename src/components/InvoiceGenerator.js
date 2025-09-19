import React, { useState, useEffect } from 'react';
import { jsPDF } from 'jspdf';
import { DollarSign, Download, FileText, Clock, Calculator, Edit2, Plus, X } from 'lucide-react';
import { format } from 'date-fns';
import { useData } from '../context/DataContext';
import toast from 'react-hot-toast';

const InvoiceGenerator = ({ clientId, clientName }) => {
  const { addInvoice, getClientTasks, tasks, updateTask } = useData();
  const [invoiceData, setInvoiceData] = useState({
    invoiceNumber: `INV-${Date.now().toString().slice(-6)}`,
    hourlyRate: 350,
    invoiceDate: format(new Date(), 'yyyy-MM-dd'),
    dueDate: format(new Date(Date.now() + 15 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd'), // Changed to 15 days
    lineItems: [],
    notes: '',
    paymentTerms: 'Net 15' // Changed to Net 15
  });
  
  const [showAddItem, setShowAddItem] = useState(false);
  const [newItem, setNewItem] = useState({
    description: '',
    hours: 0,
    rate: 350
  });
  
  const [editingItem, setEditingItem] = useState(null);
  
  // Get tasks with time tracking for this client
  const clientTasks = getClientTasks(clientId);
  
  // Load time entries from ActivityLog
  useEffect(() => {
    const activityLog = JSON.parse(localStorage.getItem('activityLog') || '[]');
    const unbilledActivities = activityLog.filter(
      activity => activity.clientId === clientId && !activity.billed
    );
    
    // Group activities by task
    const taskGroups = {};
    unbilledActivities.forEach(activity => {
      const task = clientTasks.find(t => t.id === activity.taskId);
      const taskName = task ? task.title : 'General Legal Services';
      
      if (!taskGroups[activity.taskId || 'general']) {
        taskGroups[activity.taskId || 'general'] = {
          taskId: activity.taskId || 'general',
          description: activity.description || taskName,
          details: [],
          totalHours: 0,
          rate: invoiceData.hourlyRate
        };
      }
      
      taskGroups[activity.taskId || 'general'].details.push({
        date: activity.date,
        hours: activity.duration || 0,
        notes: activity.notes || ''
      });
      taskGroups[activity.taskId || 'general'].totalHours += activity.duration || 0;
    });
    
    // Convert to line items
    const items = Object.values(taskGroups).map(group => ({
      id: `item-${Date.now()}-${Math.random()}`,
      taskId: group.taskId,
      description: group.description,
      details: group.details,
      hours: group.totalHours,
      rate: group.rate,
      amount: group.totalHours * group.rate,
      editable: true
    }));
    
    if (items.length > 0) {
      setInvoiceData(prev => ({ ...prev, lineItems: items }));
    }
  }, [clientId, clientTasks]);

  const addLineItem = () => {
    if (!newItem.description || newItem.hours <= 0) {
      toast.error('Please enter description and hours');
      return;
    }
    
    const item = {
      id: `item-${Date.now()}`,
      description: newItem.description,
      hours: parseFloat(newItem.hours),
      rate: parseFloat(newItem.rate),
      amount: parseFloat(newItem.hours) * parseFloat(newItem.rate),
      custom: true
    };
    
    setInvoiceData(prev => ({
      ...prev,
      lineItems: [...prev.lineItems, item]
    }));
    
    setNewItem({ description: '', hours: 0, rate: 350 });
    setShowAddItem(false);
  };

  const updateLineItem = (itemId, field, value) => {
    setInvoiceData(prev => ({
      ...prev,
      lineItems: prev.lineItems.map(item => {
        if (item.id === itemId) {
          const updated = { ...item, [field]: value };
          if (field === 'hours' || field === 'rate') {
            updated.amount = parseFloat(updated.hours) * parseFloat(updated.rate);
          }
          return updated;
        }
        return item;
      })
    }));
  };

  const removeLineItem = (itemId) => {
    setInvoiceData(prev => ({
      ...prev,
      lineItems: prev.lineItems.filter(item => item.id !== itemId)
    }));
  };

  const calculateTotal = () => {
    return invoiceData.lineItems.reduce((sum, item) => sum + item.amount, 0);
  };

  const calculateTotalHours = () => {
    return invoiceData.lineItems.reduce((sum, item) => sum + parseFloat(item.hours), 0);
  };

  const generatePDF = () => {
    if (invoiceData.lineItems.length === 0) {
      toast.error('Please add items to the invoice');
      return;
    }

    const doc = new jsPDF();
    
    // Header - Law Offices of Rozsa Gyene
    doc.setFontSize(16);
    doc.setFont(undefined, 'bold');
    doc.text('Law Offices of Rozsa Gyene', 20, 20);
    doc.setFont(undefined, 'normal');
    doc.setFontSize(10);
    doc.text('450 N Brand Blvd. Suite 600', 20, 27);
    doc.text('Glendale, CA 91203', 20, 32);
    doc.text('Phone: (818) 291-6217', 20, 37);
    doc.text('Email: rozsagyenelaw@yahoo.com', 20, 42);
    
    // Invoice Title
    doc.setFontSize(24);
    doc.setFont(undefined, 'bold');
    doc.text('INVOICE', 190, 30, { align: 'right' });
    
    // Invoice Info
    doc.setFont(undefined, 'normal');
    doc.setFontSize(10);
    doc.text(`Invoice #: ${invoiceData.invoiceNumber}`, 190, 40, { align: 'right' });
    doc.text(`Date: ${format(new Date(invoiceData.invoiceDate), 'MMM dd, yyyy')}`, 190, 45, { align: 'right' });
    doc.text(`Due Date: ${format(new Date(invoiceData.dueDate), 'MMM dd, yyyy')}`, 190, 50, { align: 'right' });
    
    // Bill To
    doc.setFontSize(12);
    doc.setFont(undefined, 'bold');
    doc.text('Bill To:', 20, 60);
    doc.setFont(undefined, 'normal');
    doc.text(clientName, 20, 67);
    
    // Table Header
    const tableTop = 85;
    doc.setFillColor(240, 240, 240);
    doc.rect(20, tableTop - 5, 170, 8, 'F');
    
    doc.setFontSize(10);
    doc.setFont(undefined, 'bold');
    doc.text('Description', 22, tableTop);
    doc.text('Hours', 120, tableTop, { align: 'right' });
    doc.text('Rate', 145, tableTop, { align: 'right' });
    doc.text('Amount', 185, tableTop, { align: 'right' });
    
    // Line Items
    doc.setFont(undefined, 'normal');
    let yPosition = tableTop + 10;
    
    invoiceData.lineItems.forEach(item => {
      // Check if we need a new page
      if (yPosition > 250) {
        doc.addPage();
        yPosition = 20;
      }
      
      // Description (wrap long text)
      const lines = doc.splitTextToSize(item.description, 90);
      doc.text(lines, 22, yPosition);
      
      // Hours, Rate, Amount on the first line
      doc.text(item.hours.toFixed(2), 120, yPosition, { align: 'right' });
      doc.text(`$${item.rate.toFixed(2)}`, 145, yPosition, { align: 'right' });
      doc.text(`$${item.amount.toFixed(2)}`, 185, yPosition, { align: 'right' });
      
      yPosition += lines.length * 5 + 5;
    });
    
    // Total section
    yPosition += 5;
    doc.line(120, yPosition, 190, yPosition);
    yPosition += 7;
    
    doc.setFont(undefined, 'bold');
    doc.text('Total Hours:', 120, yPosition, { align: 'right' });
    doc.text(calculateTotalHours().toFixed(2), 185, yPosition, { align: 'right' });
    
    yPosition += 7;
    doc.setFontSize(12);
    doc.text('Total Amount:', 120, yPosition, { align: 'right' });
    doc.text(`$${calculateTotal().toFixed(2)}`, 185, yPosition, { align: 'right' });
    
    // Payment Terms and Notes
    yPosition += 15;
    doc.setFontSize(10);
    doc.setFont(undefined, 'normal');
    
    // Payment Terms
    doc.text(`Payment Terms: ${invoiceData.paymentTerms}`, 20, yPosition);
    yPosition += 7;
    doc.text('Payment is due within 15 days of invoice date.', 20, yPosition);
    yPosition += 7;
    
    // Payment Instructions
    doc.text('Please make checks payable to: Law Offices of Rozsa Gyene', 20, yPosition);
    yPosition += 7;
    doc.text('Mail to: 450 N Brand Blvd. Suite 600, Glendale, CA 91203', 20, yPosition);
    
    // Additional Notes
    if (invoiceData.notes) {
      yPosition += 10;
      doc.text('Additional Notes:', 20, yPosition);
      yPosition += 5;
      const noteLines = doc.splitTextToSize(invoiceData.notes, 170);
      doc.text(noteLines, 20, yPosition);
    }
    
    // Thank you message
    yPosition += 15;
    doc.setFont(undefined, 'italic');
    doc.text('Thank you for your business!', 20, yPosition);
    
    // Save the PDF
    doc.save(`invoice-${clientName}-${invoiceData.invoiceNumber}.pdf`);
    
    // Mark activities as billed
    const activityLog = JSON.parse(localStorage.getItem('activityLog') || '[]');
    const updatedLog = activityLog.map(activity => {
      if (activity.clientId === clientId && !activity.billed) {
        const itemWithTask = invoiceData.lineItems.find(item => item.taskId === activity.taskId);
        if (itemWithTask) {
          return { ...activity, billed: true, invoiceNumber: invoiceData.invoiceNumber };
        }
      }
      return activity;
    });
    localStorage.setItem('activityLog', JSON.stringify(updatedLog));
    
    // Save invoice record
    addInvoice({
      clientId,
      clientName,
      invoiceNumber: invoiceData.invoiceNumber,
      amount: calculateTotal(),
      hours: calculateTotalHours(),
      status: 'sent',
      items: invoiceData.lineItems,
      invoiceDate: invoiceData.invoiceDate,
      dueDate: invoiceData.dueDate
    });
    
    toast.success('Invoice generated successfully!');
  };

  return (
    <div className="invoice-generator">
      <div className="invoice-header">
        <h3>Generate Invoice</h3>
        <div className="invoice-meta">
          <div className="invoice-field">
            <label>Invoice #</label>
            <input
              type="text"
              value={invoiceData.invoiceNumber}
              onChange={(e) => setInvoiceData({...invoiceData, invoiceNumber: e.target.value})}
            />
          </div>
          <div className="invoice-field">
            <label>Invoice Date</label>
            <input
              type="date"
              value={invoiceData.invoiceDate}
              onChange={(e) => setInvoiceData({...invoiceData, invoiceDate: e.target.value})}
            />
          </div>
          <div className="invoice-field">
            <label>Due Date (Net 15)</label>
            <input
              type="date"
              value={invoiceData.dueDate}
              onChange={(e) => setInvoiceData({...invoiceData, dueDate: e.target.value})}
            />
          </div>
        </div>
      </div>
      
      <div className="invoice-items">
        <div className="items-header">
          <h4>Invoice Items</h4>
          <button 
            className="btn-secondary"
            onClick={() => setShowAddItem(true)}
          >
            <Plus size={16} />
            Add Custom Item
          </button>
        </div>
        
        {showAddItem && (
          <div className="add-item-form">
            <input
              type="text"
              placeholder="Description of services..."
              value={newItem.description}
              onChange={(e) => setNewItem({...newItem, description: e.target.value})}
            />
            <input
              type="number"
              placeholder="Hours"
              value={newItem.hours}
              onChange={(e) => setNewItem({...newItem, hours: e.target.value})}
              step="0.1"
            />
            <input
              type="number"
              placeholder="Rate"
              value={newItem.rate}
              onChange={(e) => setNewItem({...newItem, rate: e.target.value})}
            />
            <button className="btn-primary" onClick={addLineItem}>Add</button>
            <button className="btn-text" onClick={() => setShowAddItem(false)}>Cancel</button>
          </div>
        )}
        
        <div className="line-items">
          {invoiceData.lineItems.map(item => (
            <div key={item.id} className="line-item">
              <div className="item-description">
                {editingItem === item.id ? (
                  <input
                    type="text"
                    value={item.description}
                    onChange={(e) => updateLineItem(item.id, 'description', e.target.value)}
                    onBlur={() => setEditingItem(null)}
                    autoFocus
                  />
                ) : (
                  <div onClick={() => setEditingItem(item.id)}>
                    <span>{item.description}</span>
                    <Edit2 size={14} className="edit-icon" />
                  </div>
                )}
              </div>
              <div className="item-details">
                <input
                  type="number"
                  value={item.hours}
                  onChange={(e) => updateLineItem(item.id, 'hours', e.target.value)}
                  step="0.1"
                  className="hours-input"
                />
                <span>hrs × </span>
                <input
                  type="number"
                  value={item.rate}
                  onChange={(e) => updateLineItem(item.id, 'rate', e.target.value)}
                  className="rate-input"
                />
                <span className="item-amount">${item.amount.toFixed(2)}</span>
                <button 
                  className="btn-icon"
                  onClick={() => removeLineItem(item.id)}
                >
                  <X size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
      
      <div className="invoice-footer">
        <div className="invoice-notes">
          <label>Notes (Optional)</label>
          <textarea
            value={invoiceData.notes}
            onChange={(e) => setInvoiceData({...invoiceData, notes: e.target.value})}
            placeholder="Additional notes or special instructions..."
            rows="3"
          />
        </div>
        
        <div className="invoice-summary">
          <div className="summary-row">
            <span>Total Hours:</span>
            <strong>{calculateTotalHours().toFixed(2)}</strong>
          </div>
          <div className="summary-row total">
            <span>Total Amount:</span>
            <strong>${calculateTotal().toFixed(2)}</strong>
          </div>
          
          <button 
            className="btn-primary"
            onClick={generatePDF}
            disabled={invoiceData.lineItems.length === 0}
          >
            <Download size={18} />
            Generate Invoice PDF
          </button>
        </div>
      </div>
    </div>
  );
};

export default InvoiceGenerator;
