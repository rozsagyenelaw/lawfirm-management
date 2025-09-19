import React, { useState } from 'react';
import { DollarSign, CreditCard, FileText, RefreshCw, AlertCircle, TrendingDown, TrendingUp } from 'lucide-react';
import { format } from 'date-fns';
import { useData } from '../context/DataContext';
import toast from 'react-hot-toast';

const PaymentManager = ({ clientId, clientName }) => {
  const { 
    addPayment, 
    getClientPayments, 
    getClientTrustBalance,
    getClientInvoices,
    applyRetainerToInvoice,
    refundRetainer,
    transferTrustToOperating
  } = useData();
  
  const [activeTab, setActiveTab] = useState('overview');
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showRefundModal, setShowRefundModal] = useState(false);
  const [showTransferModal, setShowTransferModal] = useState(false);
  
  const [paymentData, setPaymentData] = useState({
    amount: '',
    type: 'retainer',
    account: 'trust',
    method: 'check',
    referenceNumber: '',
    description: '',
    date: format(new Date(), 'yyyy-MM-dd')
  });
  
  const [refundData, setRefundData] = useState({
    amount: '',
    reason: '',
    method: 'check',
    referenceNumber: ''
  });
  
  const [transferData, setTransferData] = useState({
    amount: '',
    invoiceId: '',
    description: ''
  });
  
  const clientPayments = getClientPayments(clientId);
  const trustBalance = getClientTrustBalance(clientId);
  const clientInvoices = getClientInvoices(clientId);
  const unpaidInvoices = clientInvoices.filter(inv => inv.status !== 'paid');
  
  // Calculate totals
  const totalRetainersReceived = clientPayments
    .filter(p => p.type === 'retainer')
    .reduce((sum, p) => sum + p.amount, 0);
    
  const totalAppliedToInvoices = clientPayments
    .filter(p => p.type === 'retainer_applied')
    .reduce((sum, p) => sum + p.amount, 0);
    
  const totalRefunded = clientPayments
    .filter(p => p.type === 'retainer_refund')
    .reduce((sum, p) => sum + p.amount, 0);
  
  const handleAddPayment = () => {
    if (!paymentData.amount || parseFloat(paymentData.amount) <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }
    
    addPayment({
      clientId,
      clientName,
      ...paymentData,
      amount: parseFloat(paymentData.amount)
    });
    
    setShowPaymentModal(false);
    setPaymentData({
      amount: '',
      type: 'retainer',
      account: 'trust',
      method: 'check',
      referenceNumber: '',
      description: '',
      date: format(new Date(), 'yyyy-MM-dd')
    });
  };
  
  const handleRefund = () => {
    if (!refundData.amount || parseFloat(refundData.amount) <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }
    
    if (parseFloat(refundData.amount) > trustBalance) {
      toast.error('Refund amount exceeds trust account balance');
      return;
    }
    
    refundRetainer(clientId, parseFloat(refundData.amount), refundData.reason);
    
    setShowRefundModal(false);
    setRefundData({
      amount: '',
      reason: '',
      method: 'check',
      referenceNumber: ''
    });
  };
  
  const handleTransfer = () => {
    if (!transferData.amount || parseFloat(transferData.amount) <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }
    
    if (parseFloat(transferData.amount) > trustBalance) {
      toast.error('Transfer amount exceeds trust account balance');
      return;
    }
    
    if (transferData.invoiceId) {
      applyRetainerToInvoice(clientId, transferData.invoiceId, parseFloat(transferData.amount));
    } else {
      transferTrustToOperating(clientId, parseFloat(transferData.amount));
    }
    
    setShowTransferModal(false);
    setTransferData({
      amount: '',
      invoiceId: '',
      description: ''
    });
  };
  
  return (
    <div className="payment-manager">
      <div className="payment-header">
        <h3>Payment Management</h3>
        <div className="payment-actions">
          <button className="btn-primary" onClick={() => setShowPaymentModal(true)}>
            <DollarSign size={16} />
            Record Payment
          </button>
          {trustBalance > 0 && (
            <>
              <button className="btn-secondary" onClick={() => setShowTransferModal(true)}>
                <RefreshCw size={16} />
                Apply Retainer
              </button>
              <button className="btn-secondary" onClick={() => setShowRefundModal(true)}>
                <TrendingDown size={16} />
                Refund Retainer
              </button>
            </>
          )}
        </div>
      </div>
      
      <div className="payment-tabs">
        <button 
          className={`tab ${activeTab === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          Overview
        </button>
        <button 
          className={`tab ${activeTab === 'trust' ? 'active' : ''}`}
          onClick={() => setActiveTab('trust')}
        >
          Trust Account
        </button>
        <button 
          className={`tab ${activeTab === 'history' ? 'active' : ''}`}
          onClick={() => setActiveTab('history')}
        >
          Payment History
        </button>
      </div>
      
      {activeTab === 'overview' && (
        <div className="payment-overview">
          <div className="balance-cards">
            <div className="balance-card trust">
              <h4>Trust Account Balance</h4>
              <div className="balance-amount">
                ${trustBalance.toFixed(2)}
              </div>
              <small>Available in trust</small>
            </div>
            
            <div className="balance-card retainers">
              <h4>Total Retainers</h4>
              <div className="balance-amount">
                ${totalRetainersReceived.toFixed(2)}
              </div>
              <small>All retainers received</small>
            </div>
            
            <div className="balance-card applied">
              <h4>Applied to Invoices</h4>
              <div className="balance-amount">
                ${totalAppliedToInvoices.toFixed(2)}
              </div>
              <small>Retainers used</small>
            </div>
            
            <div className="balance-card refunded">
              <h4>Refunded</h4>
              <div className="balance-amount">
                ${totalRefunded.toFixed(2)}
              </div>
              <small>Returned to client</small>
            </div>
          </div>
          
          {trustBalance > 0 && unpaidInvoices.length > 0 && (
            <div className="alert-info">
              <AlertCircle size={20} />
              <div>
                <strong>Retainer Available</strong>
                <p>You have ${trustBalance.toFixed(2)} in trust that can be applied to unpaid invoices.</p>
              </div>
            </div>
          )}
        </div>
      )}
      
      {activeTab === 'trust' && (
        <div className="trust-account-detail">
          <div className="trust-summary">
            <h4>Trust Account Summary</h4>
            <div className="trust-flow">
              <div className="flow-item">
                <span>Deposits</span>
                <strong className="positive">+${totalRetainersReceived.toFixed(2)}</strong>
              </div>
              <div className="flow-item">
                <span>Applied to Invoices</span>
                <strong className="negative">-${totalAppliedToInvoices.toFixed(2)}</strong>
              </div>
              <div className="flow-item">
                <span>Refunds</span>
                <strong className="negative">-${totalRefunded.toFixed(2)}</strong>
              </div>
              <div className="flow-item total">
                <span>Current Balance</span>
                <strong>${trustBalance.toFixed(2)}</strong>
              </div>
            </div>
          </div>
          
          <div className="trust-transactions">
            <h4>Trust Account Transactions</h4>
            {clientPayments
              .filter(p => p.account === 'trust' || p.fromAccount === 'trust')
              .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
              .map(payment => (
                <div key={payment.id} className="transaction-item">
                  <div className="transaction-info">
                    <span className="transaction-date">
                      {format(new Date(payment.createdAt), 'MMM dd, yyyy')}
                    </span>
                    <span className="transaction-type">
                      {payment.type === 'retainer' ? 'Retainer Deposit' :
                       payment.type === 'retainer_refund' ? 'Refund' :
                       payment.type === 'retainer_applied' ? 'Applied to Invoice' :
                       payment.type === 'trust_transfer' ? 'Transfer to Operating' : payment.type}
                    </span>
                    {payment.description && (
                      <span className="transaction-description">{payment.description}</span>
                    )}
                  </div>
                  <div className={`transaction-amount ${
                    payment.type === 'retainer' ? 'positive' : 'negative'
                  }`}>
                    {payment.type === 'retainer' ? '+' : '-'}${payment.amount.toFixed(2)}
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}
      
      {activeTab === 'history' && (
        <div className="payment-history">
          <h4>All Payments</h4>
          {clientPayments.length > 0 ? (
            <div className="payment-list">
              {clientPayments
                .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
                .map(payment => (
                  <div key={payment.id} className="payment-item">
                    <div className="payment-date">
                      {format(new Date(payment.createdAt), 'MMM dd, yyyy')}
                    </div>
                    <div className="payment-details">
                      <span className="payment-type">
                        {payment.type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                      </span>
                      <span className="payment-method">{payment.method}</span>
                      {payment.referenceNumber && (
                        <span className="payment-ref">Ref: {payment.referenceNumber}</span>
                      )}
                    </div>
                    <div className="payment-amount">
                      ${payment.amount.toFixed(2)}
                    </div>
                    <div className="payment-account">
                      {payment.account === 'trust' ? 
                        <span className="badge trust">Trust</span> : 
                        <span className="badge operating">Operating</span>
                      }
                    </div>
                  </div>
                ))}
            </div>
          ) : (
            <div className="empty-state">
              <p>No payments recorded yet</p>
            </div>
          )}
        </div>
      )}
      
      {/* Add Payment Modal */}
      {showPaymentModal && (
        <div className="modal-overlay" onClick={() => setShowPaymentModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Record Payment</h3>
              <button className="btn-icon" onClick={() => setShowPaymentModal(false)}>×</button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label>Payment Type</label>
                <select
                  value={paymentData.type}
                  onChange={(e) => {
                    const type = e.target.value;
                    setPaymentData({
                      ...paymentData, 
                      type,
                      account: type === 'retainer' ? 'trust' : 'operating'
                    });
                  }}
                >
                  <option value="retainer">Retainer (Trust Account)</option>
                  <option value="consultation">Consultation Fee</option>
                  <option value="expense_reimbursement">Expense Reimbursement</option>
                  <option value="other">Other Payment</option>
                </select>
              </div>
              
              <div className="form-group">
                <label>Amount</label>
                <input
                  type="number"
                  value={paymentData.amount}
                  onChange={(e) => setPaymentData({...paymentData, amount: e.target.value})}
                  placeholder="0.00"
                  step="0.01"
                />
              </div>
              
              <div className="form-group">
                <label>Payment Method</label>
                <select
                  value={paymentData.method}
                  onChange={(e) => setPaymentData({...paymentData, method: e.target.value})}
                >
                  <option value="check">Check</option>
                  <option value="wire">Wire Transfer</option>
                  <option value="ach">ACH Transfer</option>
                  <option value="credit_card">Credit Card</option>
                  <option value="cash">Cash</option>
                </select>
              </div>
              
              <div className="form-group">
                <label>Reference Number</label>
                <input
                  type="text"
                  value={paymentData.referenceNumber}
                  onChange={(e) => setPaymentData({...paymentData, referenceNumber: e.target.value})}
                  placeholder="Check # or Transaction ID"
                />
              </div>
              
              <div className="form-group">
                <label>Date Received</label>
                <input
                  type="date"
                  value={paymentData.date}
                  onChange={(e) => setPaymentData({...paymentData, date: e.target.value})}
                />
              </div>
              
              <div className="form-group">
                <label>Description</label>
                <textarea
                  value={paymentData.description}
                  onChange={(e) => setPaymentData({...paymentData, description: e.target.value})}
                  placeholder="Additional notes..."
                  rows="3"
                />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-secondary" onClick={() => setShowPaymentModal(false)}>
                Cancel
              </button>
              <button className="btn-primary" onClick={handleAddPayment}>
                Record Payment
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Apply Retainer Modal */}
      {showTransferModal && (
        <div className="modal-overlay" onClick={() => setShowTransferModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Apply Retainer to Invoice</h3>
              <button className="btn-icon" onClick={() => setShowTransferModal(false)}>×</button>
            </div>
            <div className="modal-body">
              <div className="balance-info">
                <p>Available Trust Balance: <strong>${trustBalance.toFixed(2)}</strong></p>
              </div>
              
              {unpaidInvoices.length > 0 && (
                <div className="form-group">
                  <label>Select Invoice (Optional)</label>
                  <select
                    value={transferData.invoiceId}
                    onChange={(e) => setTransferData({...transferData, invoiceId: e.target.value})}
                  >
                    <option value="">Transfer to Operating (No specific invoice)</option>
                    {unpaidInvoices.map(invoice => (
                      <option key={invoice.id} value={invoice.id}>
                        {invoice.invoiceNumber} - ${invoice.balance || invoice.amount} due
                      </option>
                    ))}
                  </select>
                </div>
              )}
              
              <div className="form-group">
                <label>Amount to Apply</label>
                <input
                  type="number"
                  value={transferData.amount}
                  onChange={(e) => setTransferData({...transferData, amount: e.target.value})}
                  placeholder="0.00"
                  step="0.01"
                  max={trustBalance}
                />
              </div>
              
              <div className="form-group">
                <label>Description</label>
                <textarea
                  value={transferData.description}
                  onChange={(e) => setTransferData({...transferData, description: e.target.value})}
                  placeholder="Reason for transfer..."
                  rows="3"
                />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-secondary" onClick={() => setShowTransferModal(false)}>
                Cancel
              </button>
              <button className="btn-primary" onClick={handleTransfer}>
                Apply Retainer
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Refund Modal */}
      {showRefundModal && (
        <div className="modal-overlay" onClick={() => setShowRefundModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Refund Retainer</h3>
              <button className="btn-icon" onClick={() => setShowRefundModal(false)}>×</button>
            </div>
            <div className="modal-body">
              <div className="balance-info">
                <p>Available Trust Balance: <strong>${trustBalance.toFixed(2)}</strong></p>
              </div>
              
              <div className="form-group">
                <label>Refund Amount</label>
                <input
                  type="number"
                  value={refundData.amount}
                  onChange={(e) => setRefundData({...refundData, amount: e.target.value})}
                  placeholder="0.00"
                  step="0.01"
                  max={trustBalance}
                />
              </div>
              
              <div className="form-group">
                <label>Refund Method</label>
                <select
                  value={refundData.method}
                  onChange={(e) => setRefundData({...refundData, method: e.target.value})}
                >
                  <option value="check">Check</option>
                  <option value="wire">Wire Transfer</option>
                  <option value="ach">ACH Transfer</option>
                </select>
              </div>
              
              <div className="form-group">
                <label>Reference Number</label>
                <input
                  type="text"
                  value={refundData.referenceNumber}
                  onChange={(e) => setRefundData({...refundData, referenceNumber: e.target.value})}
                  placeholder="Check # or Transaction ID"
                />
              </div>
              
              <div className="form-group">
                <label>Reason for Refund</label>
                <textarea
                  value={refundData.reason}
                  onChange={(e) => setRefundData({...refundData, reason: e.target.value})}
                  placeholder="Matter concluded, unused retainer, etc..."
                  rows="3"
                />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-secondary" onClick={() => setShowRefundModal(false)}>
                Cancel
              </button>
              <button className="btn-primary" onClick={handleRefund}>
                Process Refund
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PaymentManager;
