import React from 'react';
import { useData } from '../context/DataContext';
import { FileText, DollarSign, Calendar } from 'lucide-react';
import { format } from 'date-fns';

const Invoices = () => {
  const { invoices, clients } = useData();

  return (
    <div className="invoices-page">
      <div className="page-header">
        <h1>Invoices</h1>
        <p>View all generated invoices</p>
      </div>
      
      <div className="invoices-list">
        {invoices.length > 0 ? (
          invoices.map(invoice => (
            <div key={invoice.id} className="invoice-card">
              <div className="invoice-header">
                <FileText size={20} />
                <h3>{invoice.invoiceNumber}</h3>
                <span className={`status-badge ${invoice.status}`}>
                  {invoice.status}
                </span>
              </div>
              <div className="invoice-details">
                <div className="detail-item">
                  <span>Client: {invoice.clientName}</span>
                </div>
                <div className="detail-item">
                  <DollarSign size={16} />
                  <span>${invoice.amount.toFixed(2)}</span>
                </div>
                <div className="detail-item">
                  <Calendar size={16} />
                  <span>{format(new Date(invoice.createdAt), 'MMM dd, yyyy')}</span>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="empty-state">
            <p>No invoices generated yet</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Invoices;
