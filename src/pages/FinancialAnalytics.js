import React, { useState, useEffect } from 'react';
import { DollarSign, TrendingUp, TrendingDown, Calendar, PieChart, BarChart3, AlertCircle, Download } from 'lucide-react';
import { format, startOfMonth, endOfMonth, subMonths, startOfYear } from 'date-fns';
import { useData } from '../context/DataContext';
import { BarChart, Bar, LineChart, Line, PieChart as RePieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const FinancialAnalytics = () => {
  const { 
    clients, 
    invoices, 
    payments, 
    trustAccounts 
  } = useData();
  
  const [dateRange, setDateRange] = useState('thisMonth');
  const [selectedCategory, setSelectedCategory] = useState('all');
  
  // Calculate date ranges
  const getDateRange = () => {
    const now = new Date();
    switch(dateRange) {
      case 'thisMonth':
        return { start: startOfMonth(now), end: endOfMonth(now) };
      case 'lastMonth':
        const lastMonth = subMonths(now, 1);
        return { start: startOfMonth(lastMonth), end: endOfMonth(lastMonth) };
      case 'thisYear':
        return { start: startOfYear(now), end: now };
      case 'last90days':
        const ninetyDaysAgo = new Date(now.setDate(now.getDate() - 90));
        return { start: ninetyDaysAgo, end: new Date() };
      default:
        return { start: startOfMonth(now), end: endOfMonth(now) };
    }
  };
  
  const { start: startDate, end: endDate } = getDateRange();
  
  // Filter invoices by date range
  const filteredInvoices = invoices.filter(invoice => {
    const invoiceDate = new Date(invoice.createdAt);
    return invoiceDate >= startDate && invoiceDate <= endDate;
  });
  
  // Calculate metrics by practice area
  const practiceAreaMetrics = {
    'estate-planning': { name: 'Estate Planning', revenue: 0, outstanding: 0, clients: 0, invoices: 0 },
    'probate': { name: 'Probate', revenue: 0, outstanding: 0, clients: 0, invoices: 0 },
    'trust-litigation': { name: 'Trust Litigation', revenue: 0, outstanding: 0, clients: 0, invoices: 0 },
    'conservatorship': { name: 'Conservatorship', revenue: 0, outstanding: 0, clients: 0, invoices: 0 },
    'guardianship': { name: 'Guardianship', revenue: 0, outstanding: 0, clients: 0, invoices: 0 },
    'fire-victim': { name: 'Fire Victim', revenue: 0, outstanding: 0, clients: 0, invoices: 0 }
  };
  
  // Calculate revenue and outstanding by practice area
  invoices.forEach(invoice => {
    const client = clients.find(c => c.id === invoice.clientId);
    if (client && practiceAreaMetrics[client.category]) {
      const area = practiceAreaMetrics[client.category];
      area.invoices++;
      
      const paidAmount = invoice.totalPaid || 0;
      const totalAmount = invoice.amount || 0;
      const outstanding = totalAmount - paidAmount;
      
      area.revenue += paidAmount;
      area.outstanding += outstanding;
    }
  });
  
  // Count unique clients per practice area
  clients.forEach(client => {
    if (practiceAreaMetrics[client.category]) {
      practiceAreaMetrics[client.category].clients++;
    }
  });
  
  // Calculate totals
  const totalRevenue = Object.values(practiceAreaMetrics).reduce((sum, area) => sum + area.revenue, 0);
  const totalOutstanding = Object.values(practiceAreaMetrics).reduce((sum, area) => sum + area.outstanding, 0);
  const totalInTrust = trustAccounts.reduce((sum, account) => sum + account.balance, 0);
  
  // Calculate collection rate
  const totalBilled = invoices.reduce((sum, inv) => sum + (inv.amount || 0), 0);
  const totalCollected = invoices.reduce((sum, inv) => sum + (inv.totalPaid || 0), 0);
  const collectionRate = totalBilled > 0 ? (totalCollected / totalBilled * 100).toFixed(1) : 0;
  
  // Prepare data for charts
  const revenueByAreaData = Object.entries(practiceAreaMetrics)
    .filter(([key, data]) => data.revenue > 0)
    .map(([key, data]) => ({
      name: data.name,
      revenue: data.revenue,
      outstanding: data.outstanding
    }));
  
  const pieChartData = Object.entries(practiceAreaMetrics)
    .filter(([key, data]) => data.revenue > 0)
    .map(([key, data]) => ({
      name: data.name,
      value: data.revenue
    }));
  
  const COLORS = ['#667eea', '#f093fb', '#4facfe', '#43e97b', '#fa709a', '#feca57'];
  
  // Monthly revenue trend (last 6 months)
  const monthlyRevenue = [];
  for (let i = 5; i >= 0; i--) {
    const monthStart = startOfMonth(subMonths(new Date(), i));
    const monthEnd = endOfMonth(subMonths(new Date(), i));
    
    const monthRevenue = payments
      .filter(payment => {
        const paymentDate = new Date(payment.createdAt);
        return paymentDate >= monthStart && paymentDate <= monthEnd && 
               payment.type !== 'retainer_refund';
      })
      .reduce((sum, payment) => sum + payment.amount, 0);
    
    monthlyRevenue.push({
      month: format(monthStart, 'MMM'),
      revenue: monthRevenue
    });
  }
  
  // Outstanding invoices by age
  const agingReport = {
    current: 0,
    thirtyDays: 0,
    sixtyDays: 0,
    ninetyPlus: 0
  };
  
  const now = new Date();
  invoices.forEach(invoice => {
    if (invoice.status !== 'paid') {
      const outstanding = (invoice.amount || 0) - (invoice.totalPaid || 0);
      const invoiceDate = new Date(invoice.createdAt);
      const daysOld = Math.floor((now - invoiceDate) / (1000 * 60 * 60 * 24));
      
      if (daysOld <= 30) agingReport.current += outstanding;
      else if (daysOld <= 60) agingReport.thirtyDays += outstanding;
      else if (daysOld <= 90) agingReport.sixtyDays += outstanding;
      else agingReport.ninetyPlus += outstanding;
    }
  });
  
  const agingData = [
    { name: 'Current', amount: agingReport.current },
    { name: '31-60 Days', amount: agingReport.thirtyDays },
    { name: '61-90 Days', amount: agingReport.sixtyDays },
    { name: '90+ Days', amount: agingReport.ninetyPlus }
  ];
  
  // Top clients by revenue
  const clientRevenue = {};
  invoices.forEach(invoice => {
    const client = clients.find(c => c.id === invoice.clientId);
    if (client) {
      if (!clientRevenue[client.id]) {
        clientRevenue[client.id] = {
          name: client.name,
          revenue: 0,
          outstanding: 0
        };
      }
      clientRevenue[client.id].revenue += invoice.totalPaid || 0;
      clientRevenue[client.id].outstanding += (invoice.amount || 0) - (invoice.totalPaid || 0);
    }
  });
  
  const topClients = Object.values(clientRevenue)
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 10);
  
  // Export to CSV
  const exportToCSV = () => {
    const headers = ['Practice Area', 'Revenue', 'Outstanding', 'Clients', 'Invoices'];
    const rows = Object.values(practiceAreaMetrics).map(area => [
      area.name,
      area.revenue.toFixed(2),
      area.outstanding.toFixed(2),
      area.clients,
      area.invoices
    ]);
    
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `financial-report-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
  };
  
  return (
    <div className="financial-analytics">
      <div className="page-header">
        <div>
          <h1>Financial Analytics</h1>
          <p>Revenue analysis and financial insights</p>
        </div>
        <div className="header-actions">
          <select 
            value={dateRange} 
            onChange={(e) => setDateRange(e.target.value)}
            className="date-range-selector"
          >
            <option value="thisMonth">This Month</option>
            <option value="lastMonth">Last Month</option>
            <option value="last90days">Last 90 Days</option>
            <option value="thisYear">This Year</option>
          </select>
          <button className="btn-primary" onClick={exportToCSV}>
            <Download size={18} />
            Export Report
          </button>
        </div>
      </div>
      
      {/* Key Metrics */}
      <div className="metrics-grid">
        <div className="metric-card">
          <div className="metric-icon revenue">
            <DollarSign size={24} />
          </div>
          <div className="metric-content">
            <span className="metric-label">Total Revenue</span>
            <span className="metric-value">${totalRevenue.toFixed(2)}</span>
            <span className="metric-subtext">All time collected</span>
          </div>
        </div>
        
        <div className="metric-card">
          <div className="metric-icon outstanding">
            <AlertCircle size={24} />
          </div>
          <div className="metric-content">
            <span className="metric-label">Outstanding</span>
            <span className="metric-value">${totalOutstanding.toFixed(2)}</span>
            <span className="metric-subtext">Pending payments</span>
          </div>
        </div>
        
        <div className="metric-card">
          <div className="metric-icon trust">
            <DollarSign size={24} />
          </div>
          <div className="metric-content">
            <span className="metric-label">Trust Accounts</span>
            <span className="metric-value">${totalInTrust.toFixed(2)}</span>
            <span className="metric-subtext">Total in trust</span>
          </div>
        </div>
        
        <div className="metric-card">
          <div className="metric-icon rate">
            <TrendingUp size={24} />
          </div>
          <div className="metric-content">
            <span className="metric-label">Collection Rate</span>
            <span className="metric-value">{collectionRate}%</span>
            <span className="metric-subtext">Of billed amount</span>
          </div>
        </div>
      </div>
      
      {/* Charts Row 1 */}
      <div className="charts-row">
        <div className="chart-card">
          <h3>Revenue by Practice Area</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={revenueByAreaData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
              <YAxis />
              <Tooltip formatter={(value) => `$${value.toFixed(2)}`} />
              <Legend />
              <Bar dataKey="revenue" fill="#667eea" name="Revenue" />
              <Bar dataKey="outstanding" fill="#f093fb" name="Outstanding" />
            </BarChart>
          </ResponsiveContainer>
        </div>
        
        <div className="chart-card">
          <h3>Revenue Distribution</h3>
          <ResponsiveContainer width="100%" height={300}>
            <RePieChart>
              <Pie
                data={pieChartData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({name, percent}) => `${name} ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {pieChartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(value) => `$${value.toFixed(2)}`} />
            </RePieChart>
          </ResponsiveContainer>
        </div>
      </div>
      
      {/* Charts Row 2 */}
      <div className="charts-row">
        <div className="chart-card">
          <h3>Monthly Revenue Trend</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={monthlyRevenue}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip formatter={(value) => `$${value.toFixed(2)}`} />
              <Line type="monotone" dataKey="revenue" stroke="#667eea" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>
        
        <div className="chart-card">
          <h3>Accounts Receivable Aging</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={agingData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip formatter={(value) => `$${value.toFixed(2)}`} />
              <Bar dataKey="amount" fill="#f093fb" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
      
      {/* Practice Area Table */}
      <div className="analytics-table-section">
        <h3>Practice Area Performance</h3>
        <table className="analytics-table">
          <thead>
            <tr>
              <th>Practice Area</th>
              <th>Clients</th>
              <th>Invoices</th>
              <th>Revenue</th>
              <th>Outstanding</th>
              <th>Avg per Client</th>
            </tr>
          </thead>
          <tbody>
            {Object.values(practiceAreaMetrics).map(area => (
              <tr key={area.name}>
                <td>{area.name}</td>
                <td>{area.clients}</td>
                <td>{area.invoices}</td>
                <td className="amount">${area.revenue.toFixed(2)}</td>
                <td className="amount outstanding">${area.outstanding.toFixed(2)}</td>
                <td className="amount">
                  ${area.clients > 0 ? (area.revenue / area.clients).toFixed(2) : '0.00'}
                </td>
              </tr>
            ))}
            <tr className="total-row">
              <td>Total</td>
              <td>{clients.length}</td>
              <td>{invoices.length}</td>
              <td className="amount">${totalRevenue.toFixed(2)}</td>
              <td className="amount outstanding">${totalOutstanding.toFixed(2)}</td>
              <td className="amount">
                ${clients.length > 0 ? (totalRevenue / clients.length).toFixed(2) : '0.00'}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      
      {/* Top Clients Table */}
      <div className="analytics-table-section">
        <h3>Top Clients by Revenue</h3>
        <table className="analytics-table">
          <thead>
            <tr>
              <th>Client</th>
              <th>Total Revenue</th>
              <th>Outstanding</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {topClients.map((client, index) => (
              <tr key={index}>
                <td>{client.name}</td>
                <td className="amount">${client.revenue.toFixed(2)}</td>
                <td className="amount outstanding">${client.outstanding.toFixed(2)}</td>
                <td>
                  {client.outstanding > 0 ? (
                    <span className="status-badge pending">Has Outstanding</span>
                  ) : (
                    <span className="status-badge paid">All Paid</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      {/* Outstanding Invoices Alert */}
      {agingReport.ninetyPlus > 0 && (
        <div className="alert-warning">
          <AlertCircle size={20} />
          <div>
            <strong>Attention Required</strong>
            <p>You have ${agingReport.ninetyPlus.toFixed(2)} in invoices over 90 days old. Consider following up with clients.</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default FinancialAnalytics;
