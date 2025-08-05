import React, { useState } from 'react';
import { Plus, Search, Edit, Trash2, CreditCard, Calendar, DollarSign, FileText, User } from 'lucide-react';
import { useBilling } from '../context/AmplifyBillingContext';
import { format } from 'date-fns';

const Payments = () => {
  const { state, api } = useBilling();
  const { payments, invoices, customers, loading } = state;
  const [showModal, setShowModal] = useState(false);
  const [editingPayment, setEditingPayment] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [methodFilter, setMethodFilter] = useState('all');
  const [formData, setFormData] = useState({
    invoiceId: '',
    amount: '',
    paymentDate: new Date().toISOString().split('T')[0],
    method: 'Bank Transfer',
    reference: '',
    notes: ''
  });

  const paymentMethods = ['Bank Transfer', 'Credit Card', 'Check', 'Cash', 'PayPal', 'Wire Transfer', 'ACH'];

  const getInvoiceInfo = (invoiceId) => {
    return invoices.find(inv => inv.id === invoiceId);
  };

  const getCustomerInfo = (customerId) => {
    return customers.find(cust => cust.id === customerId);
  };

  const getUnpaidInvoices = () => {
    return invoices.filter(invoice => {
      const totalPaid = payments
        .filter(payment => payment.invoiceId === invoice.id)
        .reduce((sum, payment) => sum + payment.amount, 0);
      return totalPaid < invoice.total;
    });
  };

  const getFilteredPayments = () => {
    return payments.filter(payment => {
      const invoice = getInvoiceInfo(payment.invoiceId);
      const customer = invoice ? getCustomerInfo(invoice.customerId) : null;
      
      const matchesSearch = 
        payment.reference.toLowerCase().includes(searchTerm.toLowerCase()) ||
        payment.notes.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (customer && customer.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (invoice && invoice.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase()));
      
      if (methodFilter === 'all') return matchesSearch;
      return matchesSearch && payment.method === methodFilter;
    });
  };

  const getUniquePaymentMethods = () => {
    const usedMethods = [...new Set(payments.map(p => p.method))];
    return usedMethods;
  };

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const paymentData = {
      ...formData,
      invoiceId: parseInt(formData.invoiceId),
      amount: parseFloat(formData.amount)
    };

    try {
      if (editingPayment) {
        await api.payments.update(editingPayment.id, paymentData);
      } else {
        // The API automatically handles invoice status updates
        await api.payments.create(paymentData);
      }

      resetForm();
    } catch (error) {
      console.error('Error saving payment:', error);
      alert('Failed to save payment. Please try again.');
    }
  };

  const handleEdit = (payment) => {
    setEditingPayment(payment);
    setFormData({
      invoiceId: payment.invoiceId.toString(),
      amount: payment.amount.toString(),
      paymentDate: payment.paymentDate,
      method: payment.method,
      reference: payment.reference,
      notes: payment.notes
    });
    setShowModal(true);
  };

  const handleDelete = async (paymentId) => {
    if (window.confirm('Are you sure you want to delete this payment?')) {
      try {
        await api.payments.delete(paymentId);
      } catch (error) {
        console.error('Error deleting payment:', error);
        alert('Failed to delete payment. Please try again.');
      }
    }
  };

  const resetForm = () => {
    setFormData({
      invoiceId: '',
      amount: '',
      paymentDate: new Date().toISOString().split('T')[0],
      method: 'Bank Transfer',
      reference: '',
      notes: ''
    });
    setEditingPayment(null);
    setShowModal(false);
  };

  const filteredPayments = getFilteredPayments();
  const uniquePaymentMethods = getUniquePaymentMethods();
  const unpaidInvoices = getUnpaidInvoices();

  // Calculate summary stats
  const totalPayments = payments.reduce((sum, payment) => sum + payment.amount, 0);
  const paymentsThisMonth = payments.filter(payment => {
    const paymentDate = new Date(payment.paymentDate);
    const now = new Date();
    return paymentDate.getMonth() === now.getMonth() && paymentDate.getFullYear() === now.getFullYear();
  }).reduce((sum, payment) => sum + payment.amount, 0);

  return (
    <div>
      {/* Summary Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px', marginBottom: '24px' }}>
        <div className="card" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ padding: '12px', backgroundColor: '#dcfce7', borderRadius: '8px' }}>
              <DollarSign size={24} style={{ color: '#166534' }} />
            </div>
            <div>
              <h3 style={{ fontSize: '24px', fontWeight: '700', color: '#1f2937', margin: 0 }}>
                ${totalPayments.toFixed(2)}
              </h3>
              <p style={{ color: '#6b7280', margin: 0 }}>Total Payments</p>
            </div>
          </div>
        </div>

        <div className="card" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ padding: '12px', backgroundColor: '#dbeafe', borderRadius: '8px' }}>
              <Calendar size={24} style={{ color: '#1d4ed8' }} />
            </div>
            <div>
              <h3 style={{ fontSize: '24px', fontWeight: '700', color: '#1f2937', margin: 0 }}>
                ${paymentsThisMonth.toFixed(2)}
              </h3>
              <p style={{ color: '#6b7280', margin: 0 }}>This Month</p>
            </div>
          </div>
        </div>

        <div className="card" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ padding: '12px', backgroundColor: '#fef3c7', borderRadius: '8px' }}>
              <FileText size={24} style={{ color: '#92400e' }} />
            </div>
            <div>
              <h3 style={{ fontSize: '24px', fontWeight: '700', color: '#1f2937', margin: 0 }}>
                {unpaidInvoices.length}
              </h3>
              <p style={{ color: '#6b7280', margin: 0 }}>Unpaid Invoices</p>
            </div>
          </div>
        </div>
      </div>

      <div style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h1 style={{ fontSize: '24px', fontWeight: '700', color: '#1f2937' }}>Payments</h1>
          <button 
            className="btn btn-primary"
            onClick={() => setShowModal(true)}
          >
            <Plus size={20} />
            Record Payment
          </button>
        </div>

        <div style={{ display: 'flex', gap: '16px', alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ position: 'relative', flex: 1, maxWidth: '400px' }}>
            <Search size={20} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }} />
            <input
              type="text"
              placeholder="Search payments..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                width: '100%',
                padding: '8px 12px 8px 44px',
                border: '1px solid #d1d5db',
                borderRadius: '8px',
                fontSize: '14px'
              }}
            />
          </div>

          <select
            value={methodFilter}
            onChange={(e) => setMethodFilter(e.target.value)}
            style={{
              padding: '8px 12px',
              border: '1px solid #d1d5db',
              borderRadius: '8px',
              fontSize: '14px'
            }}
          >
            <option value="all">All Methods</option>
            {uniquePaymentMethods.map(method => (
              <option key={method} value={method}>{method}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="card">
        {filteredPayments.length === 0 ? (
          <div style={{ padding: '48px', textAlign: 'center', color: '#6b7280' }}>
            <CreditCard size={48} style={{ margin: '0 auto 16px', color: '#d1d5db' }} />
            <h3>No payments found</h3>
            <p>Record your first payment to get started.</p>
          </div>
        ) : (
          <div style={{ overflow: 'auto' }}>
            <table className="table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Invoice</th>
                  <th>Customer</th>
                  <th>Amount</th>
                  <th>Method</th>
                  <th>Reference</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredPayments.map((payment) => {
                  const invoice = getInvoiceInfo(payment.invoiceId);
                  const customer = invoice ? getCustomerInfo(invoice.customerId) : null;
                  
                  return (
                    <tr key={payment.id}>
                      <td>{format(new Date(payment.paymentDate), 'MMM dd, yyyy')}</td>
                      <td>
                        <span style={{ fontWeight: '500' }}>
                          {invoice ? invoice.invoiceNumber : 'N/A'}
                        </span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <User size={16} style={{ color: '#6b7280' }} />
                          <span>{customer ? customer.name : 'Unknown'}</span>
                        </div>
                      </td>
                      <td>
                        <span style={{ fontWeight: '600', color: '#059669' }}>
                          ${payment.amount.toFixed(2)}
                        </span>
                      </td>
                      <td>
                        <span 
                          className="status-badge"
                          style={{
                            backgroundColor: '#f3f4f6',
                            color: '#374151'
                          }}
                        >
                          {payment.method}
                        </span>
                      </td>
                      <td style={{ color: '#6b7280' }}>{payment.reference || '-'}</td>
                      <td>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <button
                            className="btn btn-secondary"
                            onClick={() => handleEdit(payment)}
                            style={{ padding: '4px 8px', fontSize: '12px' }}
                          >
                            <Edit size={14} />
                          </button>
                          <button
                            className="btn btn-danger"
                            onClick={() => handleDelete(payment.id)}
                            style={{ padding: '4px 8px', fontSize: '12px' }}
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: '8px',
            padding: '24px',
            width: '100%',
            maxWidth: '500px',
            maxHeight: '90vh',
            overflow: 'auto'
          }}>
            <h2 style={{ marginBottom: '20px', fontSize: '20px', fontWeight: '600' }}>
              {editingPayment ? 'Edit Payment' : 'Record New Payment'}
            </h2>

            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label">Invoice *</label>
                <select
                  name="invoiceId"
                  value={formData.invoiceId}
                  onChange={handleInputChange}
                  className="form-control"
                  required
                >
                  <option value="">Select an invoice</option>
                  {unpaidInvoices.map(invoice => {
                    const customer = getCustomerInfo(invoice.customerId);
                    const totalPaid = payments
                      .filter(p => p.invoiceId === invoice.id)
                      .reduce((sum, p) => sum + p.amount, 0);
                    const remaining = invoice.total - totalPaid;
                    
                    return (
                      <option key={invoice.id} value={invoice.id}>
                        {invoice.invoiceNumber} - {customer?.name} (${remaining.toFixed(2)} remaining)
                      </option>
                    );
                  })}
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div className="form-group">
                  <label className="form-label">Amount ($) *</label>
                  <input
                    type="number"
                    name="amount"
                    value={formData.amount}
                    onChange={handleInputChange}
                    className="form-control"
                    step="0.01"
                    min="0"
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Payment Date *</label>
                  <input
                    type="date"
                    name="paymentDate"
                    value={formData.paymentDate}
                    onChange={handleInputChange}
                    className="form-control"
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Payment Method *</label>
                <select
                  name="method"
                  value={formData.method}
                  onChange={handleInputChange}
                  className="form-control"
                  required
                >
                  {paymentMethods.map(method => (
                    <option key={method} value={method}>{method}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Reference Number</label>
                <input
                  type="text"
                  name="reference"
                  value={formData.reference}
                  onChange={handleInputChange}
                  className="form-control"
                  placeholder="Transaction ID, check number, etc."
                />
              </div>

              <div className="form-group">
                <label className="form-label">Notes</label>
                <textarea
                  name="notes"
                  value={formData.notes}
                  onChange={handleInputChange}
                  className="form-control"
                  rows="3"
                  placeholder="Additional notes about this payment..."
                />
              </div>

              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '24px' }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={resetForm}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                >
                  {editingPayment ? 'Update Payment' : 'Record Payment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Payments;