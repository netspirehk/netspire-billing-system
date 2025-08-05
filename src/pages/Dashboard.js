import React from 'react';
import { DollarSign, Users, FileText, AlertCircle } from 'lucide-react';
import { useBilling } from '../context/AmplifyBillingContext';
import { format } from 'date-fns';

const Dashboard = () => {
  const { state } = useBilling();
  const { customers, invoices, payments, products } = state;
  
  // Debug logging to check data availability
  console.log('Dashboard data:', { customers, invoices, payments, products });
  console.log('State:', state);

  // Helper functions
  const getTotalRevenue = () => {
    return payments.reduce((sum, payment) => sum + payment.amount, 0);
  };

  const getTotalOutstanding = () => {
    return invoices.reduce((sum, invoice) => {
      const paidAmount = payments
        .filter(payment => payment.invoiceId === invoice.id)
        .reduce((paidSum, payment) => paidSum + payment.amount, 0);
      return sum + Math.max(0, invoice.total - paidAmount);
    }, 0);
  };
  
  const getOverdueInvoices = () => {
    return invoices.filter(invoice => {
      const dueDate = new Date(invoice.dueDate);
      const today = new Date();
      const paidAmount = payments
        .filter(payment => payment.invoiceId === invoice.id)
        .reduce((sum, payment) => sum + payment.amount, 0);
      return dueDate < today && paidAmount < invoice.total;
    });
  };

  const getRecentPayments = () => {
    return payments
      .sort((a, b) => new Date(b.paymentDate) - new Date(a.paymentDate))
      .slice(0, 5);
  };

  const getCustomerInfo = (customerId) => {
    return customers.find(c => c.id === customerId);
  };

  const getInvoiceInfo = (invoiceId) => {
    return invoices.find(inv => inv.id === invoiceId);
  };

  const totalRevenue = getTotalRevenue();
  const totalOutstanding = getTotalOutstanding();
  const overdueInvoices = getOverdueInvoices();
  const recentPayments = getRecentPayments();

  return (
    <div>
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: '700', color: '#1f2937', marginBottom: '8px' }}>Dashboard</h1>
        <p style={{ color: '#6b7280', margin: 0 }}>Welcome back! Here's what's happening with your billing.</p>
      </div>

      {/* Metrics Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px', marginBottom: '32px' }}>
        <div className="card" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ padding: '12px', backgroundColor: '#dcfce7', borderRadius: '8px' }}>
              <DollarSign size={24} style={{ color: '#166534' }} />
            </div>
            <div>
              <h3 style={{ fontSize: '14px', fontWeight: '500', color: '#6b7280', margin: '0 0 4px 0' }}>Total Revenue</h3>
              <p style={{ fontSize: '24px', fontWeight: '700', color: '#1f2937', margin: '0 0 4px 0' }}>${totalRevenue.toFixed(2)}</p>
              <span style={{ fontSize: '12px', color: '#10b981' }}>All time earnings</span>
            </div>
          </div>
        </div>

        <div className="card" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ padding: '12px', backgroundColor: '#dbeafe', borderRadius: '8px' }}>
              <Users size={24} style={{ color: '#1d4ed8' }} />
            </div>
            <div>
              <h3 style={{ fontSize: '14px', fontWeight: '500', color: '#6b7280', margin: '0 0 4px 0' }}>Total Customers</h3>
              <p style={{ fontSize: '24px', fontWeight: '700', color: '#1f2937', margin: '0 0 4px 0' }}>{customers.length}</p>
              <span style={{ fontSize: '12px', color: '#3b82f6' }}>Active accounts</span>
            </div>
          </div>
        </div>

        <div className="card" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ padding: '12px', backgroundColor: '#fef3c7', borderRadius: '8px' }}>
              <FileText size={24} style={{ color: '#92400e' }} />
            </div>
            <div>
              <h3 style={{ fontSize: '14px', fontWeight: '500', color: '#6b7280', margin: '0 0 4px 0' }}>Outstanding Amount</h3>
              <p style={{ fontSize: '24px', fontWeight: '700', color: '#1f2937', margin: '0 0 4px 0' }}>${totalOutstanding.toFixed(2)}</p>
              <span style={{ fontSize: '12px', color: '#f59e0b' }}>Pending collection</span>
            </div>
          </div>
        </div>

        <div className="card" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ padding: '12px', backgroundColor: '#fee2e2', borderRadius: '8px' }}>
              <AlertCircle size={24} style={{ color: '#dc2626' }} />
            </div>
            <div>
              <h3 style={{ fontSize: '14px', fontWeight: '500', color: '#6b7280', margin: '0 0 4px 0' }}>Overdue Invoices</h3>
              <p style={{ fontSize: '24px', fontWeight: '700', color: '#1f2937', margin: '0 0 4px 0' }}>{overdueInvoices.length}</p>
              <span style={{ fontSize: '12px', color: '#ef4444' }}>Needs attention</span>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div style={{ display: 'grid', gap: '24px', gridTemplateColumns: 'repeat(auto-fit, minmax(500px, 1fr))' }}>
        <div>
          <h2 style={{ fontSize: '18px', fontWeight: '600', color: '#1f2937', marginBottom: '16px' }}>Recent Payments</h2>
          <div className="card">
            {recentPayments.length > 0 ? (
              <table className="table">
                <thead>
                  <tr>
                    <th>Payment</th>
                    <th>Invoice</th>
                    <th>Customer</th>
                    <th>Amount</th>
                    <th>Date</th>
                    <th>Method</th>
                  </tr>
                </thead>
                <tbody>
                  {recentPayments.map((payment) => {
                    const invoiceInfo = getInvoiceInfo(payment.invoiceId);
                    const customerInfo = invoiceInfo ? getCustomerInfo(invoiceInfo.customerId) : null;
                    
                    return (
                      <tr key={payment.id}>
                        <td>#{String(payment.id).slice(0, 8)}</td>
                        <td>{invoiceInfo ? invoiceInfo.invoiceNumber : 'Unknown'}</td>
                        <td>{customerInfo ? customerInfo.name : 'Unknown Customer'}</td>
                        <td style={{ fontWeight: '600', color: '#059669' }}>${payment.amount.toFixed(2)}</td>
                        <td>{format(new Date(payment.paymentDate), 'MMM dd, yyyy')}</td>
                        <td>{payment.method}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            ) : (
              <div style={{ padding: '48px', textAlign: 'center', color: '#6b7280' }}>
                <p>No payments recorded yet.</p>
              </div>
            )}
          </div>
        </div>

        <div>
          <h2 style={{ fontSize: '18px', fontWeight: '600', color: '#1f2937', marginBottom: '16px' }}>Overdue Invoices</h2>
          <div className="card">
            {overdueInvoices.length > 0 ? (
              <table className="table">
                <thead>
                  <tr>
                    <th>Invoice</th>
                    <th>Customer</th>
                    <th>Amount</th>
                    <th>Due Date</th>
                    <th>Days Overdue</th>
                  </tr>
                </thead>
                <tbody>
                  {overdueInvoices.slice(0, 5).map((invoice) => {
                    const customerInfo = getCustomerInfo(invoice.customerId);
                    const dueDate = new Date(invoice.dueDate);
                    const today = new Date();
                    const daysOverdue = Math.floor((today - dueDate) / (1000 * 60 * 60 * 24));
                    
                    return (
                      <tr key={invoice.id}>
                        <td>#{invoice.invoiceNumber}</td>
                        <td>{customerInfo ? customerInfo.name : 'Unknown Customer'}</td>
                        <td style={{ fontWeight: '600', color: '#059669' }}>${invoice.total.toFixed(2)}</td>
                        <td>{format(dueDate, 'MMM dd, yyyy')}</td>
                        <td>
                          <span className="status-badge status-overdue">
                            {daysOverdue} days
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            ) : (
              <div style={{ padding: '48px', textAlign: 'center', color: '#6b7280' }}>
                <p>No overdue invoices. Great job!</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;