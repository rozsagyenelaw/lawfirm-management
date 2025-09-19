import React, { useState } from 'react';
import { DollarSign, TrendingUp, TrendingDown, AlertCircle, Search } from 'lucide-react';
import { format } from 'date-fns';
import { useData } from '../context/DataContext';

const Payments = () => {
  const { payments, trustAccounts, clients } = useData();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [filterAccount, setFilterAccount] = useState('all');
  
  // Calculate totals
  const totalInTrust = trustAccounts.reduce((sum, account) => sum + account.balance, 0);
  const totalRetainers = payments
    .filter(p => p.type === 'retainer')
    .reduce((sum, p) => sum + p.amount, 0);
  const totalOperating = payments
    .filter(p => p.account === 'operating')
    .reduce((sum, p) => sum + p.amount, 0);
  
  // Filter payments
  const filteredPayments = payments.filter(payment => {
    const client = clients.find(c => c.id === payment.clientId);
    const clientName = client ? client.name : '';
    
    const matchesSearch = clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          payment.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          payment.referenceNumber?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesType = filterType === 'all' || payment.type === filterType;
    const matchesAccount = filterAccount === 'all' || payment.account === filterAccount;
    
    return matchesSearch && matchesType && matchesAccount;
  });
  
  return (
    <div className="payments-page">
      <div className="page-header">
        <h1>Payment Management</h1>
        <p>Track all client payments and trust accounts</p>
      </div>
      
      <div className="payment-stats">
        <div className="stat-card">
          <div className="stat-icon trust">
            <DollarSign size={24} />
          </div>
          <div className="stat-content">
            <span className="stat-label">Total in Trust</span>
            <span className="stat-value">${totalInTrust.toFixed(2)}</span>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon retainer">
            <TrendingUp size={24} />
          </div>
          <div className="stat-content">
            <span className="stat-label">Total Retainers</span>
            <span className="stat-value">${totalRetainers.toFixed(2)}</span>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon operating">
            <TrendingDown size={24} />
          </div>
          <div className="stat-content">
            <span className="stat-label">Operating Account</span>
            <span className="stat-value">${totalOperating.toFixed(2)}</span>
          </div>
        </div>
      </div>
      
      <div className="trust-accounts-summary">
        <h3>Client Trust Balances</h3>
        <div className="trust-list">
          {trustAccounts
            .filter(account => account.balance > 0)
            .map(account => {
              const client = clients.find(c => c.id === account.clientId);
              return (
                <div key={account.id} className="trust-item">
                  <div className="trust-client">
                    {client ? client.name : 'Unknown Client'}
                  </div>
                  <div className="trust-balance">
                    ${account.balance.toFixed(2)}
                  </div>
                </div>
              );
            })}
          {trustAccounts.filter(account => account.balance > 0).length === 0 && (
            <div className="empty-state">
              <p>No active trust account balances</p>
            </div>
          )}
        </div>
      </div>
      
      <div className="payments-section">
        <div className="section-header">
          <h3>Payment History</h3>
          <div className="filters">
            <div className="search-box">
              <Search size={20} />
              <input
                type="text"
                placeholder="Search payments..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
            >
              <option value="all">All Types</option>
              <option value="retainer">Retainers</option>
              <option value="invoice_payment">Invoice Payments</option>
              <option value="consultation">Consultations</option>
              <option value="retainer_applied">Applied Retainers</option>
              <option value="retainer_refund">Refunds</option>
            </select>
            <select
              value={filterAccount}
              onChange={(e) => setFilterAccount(e.target.value)}
            >
              <option value="all">All Accounts</option>
              <option value="trust">Trust Account</option>
              <option value="operating">Operating Account</option>
            </select>
          </div>
        </div>
        
        <div className="payments-table">
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Client</th>
                <th>Type</th>
                <th>Description</th>
                <th>Account</th>
                <th>Amount</th>
              </tr>
            </thead>
            <tbody>
              {filteredPayments
                .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
                .map(payment => {
                  const client = clients.find(c => c.id === payment.clientId);
                  return (
                    <tr key={payment.id}>
                      <td>{format(new Date(payment.createdAt), 'MM/dd/yyyy')}</td>
                      <td>{client ? client.name : 'Unknown'}</td>
                      <td>{payment.type.replace(/_/g, ' ')}</td>
                      <td>{payment.description || '-'}</td>
                      <td>
                        <span className={`badge ${payment.account}`}>
                          {payment.account}
                        </span>
                      </td>
                      <td className={payment.type === 'retainer_refund' ? 'negative' : 'positive'}>
                        ${payment.amount.toFixed(2)}
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
          {filteredPayments.length === 0 && (
            <div className="empty-state">
              <p>No payments found</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Payments;
