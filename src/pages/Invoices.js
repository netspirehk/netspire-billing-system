import React, { useState } from 'react';
import { Plus, Search, Edit, Trash2, Calendar, DollarSign, Send } from 'lucide-react';
import { useBilling } from '../context/AmplifyBillingContext';
import { format } from 'date-fns';

const Invoices = () => {
  const { state, api } = useBilling();
  const { invoices: rawInvoices, customers: rawCustomers, products: rawProducts, loading, error } = state;
  
  // Ensure all arrays are safe with valid objects
  const products = (rawProducts || []).filter(p => p && p.name);
  const invoices = (rawInvoices || []).filter(inv => inv && inv.customerId && inv.invoiceNumber);
  const customers = (rawCustomers || []).filter(c => c && c.id && c.name);
  const [showModal, setShowModal] = useState(false);
  const [editingInvoice, setEditingInvoice] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [formData, setFormData] = useState({
    customerId: '',
    number: '',
    issueDate: '',
    dueDate: '',
    items: [{ productId: '', quantity: 1, rate: 0, description: '' }],
    notes: '',
    terms: ''
  });

  const getInvoiceStatus = (invoice) => {
    if (!invoice || !invoice.dueDate || typeof invoice.total !== 'number') {
      return 'unknown';
    }
    
    const today = new Date();
    const dueDate = new Date(invoice.dueDate);
    
    if (invoice.total === 0) return 'paid';
    if (dueDate < today) return 'overdue';
    return 'pending';
  };

  const getFilteredInvoices = () => {
    return invoices.filter(invoice => {
      // Add null safety check
      if (!invoice || !invoice.customerId || !invoice.invoiceNumber) return false;
      
      const customer = customers.find(c => c && c.id === invoice.customerId);
      const matchesSearch = invoice.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (customer && customer.name && customer.name.toLowerCase().includes(searchTerm.toLowerCase()));
      
      if (statusFilter === 'all') return matchesSearch;
      return matchesSearch && getInvoiceStatus(invoice) === statusFilter;
    });
  };

  const getCustomerInfo = (customerId) => {
    if (!customerId) return null;
    return customers.find(c => c && c.id === customerId);
  };

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const filteredInvoices = getFilteredInvoices();

  const resetForm = () => {
    setFormData({
      customerId: '',
      number: '',
      issueDate: '',
      dueDate: '',
      items: [{ productId: '', quantity: 1, rate: 0, description: '' }],
      notes: '',
      terms: ''
    });
    setEditingInvoice(null);
  };

  const calculateTotal = (items) => {
    return items.reduce((sum, item) => sum + (item.quantity * item.rate), 0);
  };

  const addItem = () => {
    setFormData({
      ...formData,
      items: [...formData.items, { productId: '', quantity: 1, rate: 0, description: '' }]
    });
  };

  const removeItem = (index) => {
    const newItems = formData.items.filter((_, i) => i !== index);
    setFormData({ ...formData, items: newItems });
  };

  const updateItem = (index, field, value) => {
    const newItems = [...formData.items];
    newItems[index] = { ...newItems[index], [field]: value };
    
    // Auto-fill rate if product is selected
    if (field === 'productId' && value) {
      const product = products.find(p => p && p.id === value);
      if (product && product.name) {
        newItems[index].rate = product.price || 0;
        newItems[index].description = product.description || product.name || '';
      }
    }
    
    setFormData({ ...formData, items: newItems });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate required fields
    if (!formData.customerId) {
      alert('Please select a customer');
      return;
    }
    
    if (!formData.number) {
      alert('Please enter an invoice number');
      return;
    }
    
    if (!formData.issueDate || !formData.dueDate) {
      alert('Please enter both issue date and due date');
      return;
    }
    
    if (!formData.items || formData.items.length === 0) {
      alert('Please add at least one item to the invoice');
      return;
    }
    
    const total = calculateTotal(formData.items);
    const invoiceData = {
      invoiceNumber: formData.number,
      customerId: formData.customerId,
      issueDate: formData.issueDate,
      dueDate: formData.dueDate,
      status: editingInvoice ? editingInvoice.status : 'draft',
      subtotal: total,
      taxAmount: 0, // Schema expects taxAmount, not tax
      discountAmount: 0,
      total,
      notes: formData.notes || '',
      terms: formData.terms || ''
      // Don't send items directly - they will be created separately
    };

    try {
      console.log('Submitting invoice data:', invoiceData);
      
      if (editingInvoice) {
        await api.invoices.update(editingInvoice.id, invoiceData, formData.items);
      } else {
        await api.invoices.create(invoiceData, formData.items);
      }
      
      resetForm();
      setShowModal(false);
    } catch (error) {
      console.error('Error saving invoice:', error);
      alert('Failed to save invoice. Please try again.');
    }
  };

  const handleEdit = (invoice) => {
    setEditingInvoice(invoice);
    setFormData(invoice);
    setShowModal(true);
  };

  const handleDelete = async (invoiceId) => {
    if (window.confirm('Are you sure you want to delete this invoice?')) {
      try {
        await api.invoices.delete(invoiceId);
      } catch (error) {
        console.error('Error deleting invoice:', error);
        alert('Failed to delete invoice. Please try again.');
      }
    }
  };

  const handleSendEmail = async (invoice) => {
    const customer = getCustomerInfo(invoice.customerId);
    const confirmMessage = `Send invoice #${invoice.invoiceNumber} to ${customer?.email || customer?.name || 'customer'}?`;
    if (!window.confirm(confirmMessage)) return;

    try {
      await api.invoices.send(invoice.id);
      alert('Invoice marked as sent.');
    } catch (error) {
      console.error('Error sending invoice email:', error);
      alert('Failed to mark invoice as sent.');
    }
  };



  return (
    <div>
      <div style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h1 style={{ fontSize: '24px', fontWeight: '700', color: '#1f2937' }}>Invoices</h1>
          <button
            onClick={() => {
              resetForm();
              setShowModal(true);
            }}
            className="btn btn-primary"
          >
            <Plus size={20} />
            Create Invoice
          </button>
        </div>
        <p style={{ color: '#6b7280', margin: '0' }}>Create and manage customer invoices</p>

        {/* Error Display */}
        {error && (
          <div style={{ 
            backgroundColor: '#fee2e2', 
            border: '1px solid #fecaca', 
            borderRadius: '6px', 
            padding: '12px', 
            marginTop: '16px',
            color: '#dc2626'
          }}>
            <strong>Error:</strong> {error}
          </div>
        )}

        <div style={{ display: 'flex', gap: '16px', alignItems: 'center', flexWrap: 'wrap', marginTop: '16px' }}>
          <div style={{ position: 'relative', flex: 1, maxWidth: '400px' }}>
            <Search size={20} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }} />
            <input
              type="text"
              placeholder="Search invoices by number or customer..."
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
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            style={{
              padding: '8px 12px',
              border: '1px solid #d1d5db',
              borderRadius: '8px',
              fontSize: '14px',
              backgroundColor: 'white',
              minWidth: '150px'
            }}
          >
            <option value="all">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="overdue">Overdue</option>
            <option value="paid">Paid</option>
          </select>
        </div>
      </div>

      {/* Invoices Table */}
      <div className="card">
        <div style={{ padding: '24px 24px 0 24px', borderBottom: '1px solid #e5e7eb' }}>
          <h2 style={{ fontSize: '18px', fontWeight: '600', color: '#1f2937', margin: '0 0 24px 0' }}>
            Invoices ({filteredInvoices.length})
          </h2>
        </div>
        
        {loading ? (
          <div style={{ padding: '48px', textAlign: 'center', color: '#6b7280' }}>
            <div style={{ fontSize: '18px' }}>Loading invoices...</div>
          </div>
        ) : filteredInvoices.length === 0 ? (
          <div style={{ padding: '48px', textAlign: 'center', color: '#6b7280' }}>
            <h3 style={{ fontSize: '18px', fontWeight: '500', marginBottom: '8px' }}>No invoices found</h3>
            <p style={{ margin: '0' }}>Get started by creating your first invoice.</p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #e5e7eb' }}>
                  <th style={{ padding: '12px 24px', textAlign: 'left', fontSize: '12px', fontWeight: '500', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Invoice</th>
                  <th style={{ padding: '12px 24px', textAlign: 'left', fontSize: '12px', fontWeight: '500', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Customer</th>
                  <th style={{ padding: '12px 24px', textAlign: 'left', fontSize: '12px', fontWeight: '500', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Issue Date</th>
                  <th style={{ padding: '12px 24px', textAlign: 'left', fontSize: '12px', fontWeight: '500', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Due Date</th>
                  <th style={{ padding: '12px 24px', textAlign: 'left', fontSize: '12px', fontWeight: '500', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Amount</th>
                  <th style={{ padding: '12px 24px', textAlign: 'left', fontSize: '12px', fontWeight: '500', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Status</th>
                  <th style={{ padding: '12px 24px', textAlign: 'left', fontSize: '12px', fontWeight: '500', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredInvoices.map((invoice) => {
                  const customer = getCustomerInfo(invoice.customerId);
                  const status = getInvoiceStatus(invoice);
                  
                  return (
                    <tr key={invoice.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                      <td style={{ padding: '16px 24px', fontSize: '14px', color: '#1f2937', fontWeight: '500' }}>
                        #{invoice.invoiceNumber}
                      </td>
                      <td style={{ padding: '16px 24px', fontSize: '14px', color: '#1f2937' }}>
                        {customer ? customer.name : 'Unknown Customer'}
                      </td>
                      <td style={{ padding: '16px 24px', fontSize: '14px', color: '#6b7280' }}>
                        {format(new Date(invoice.issueDate), 'MMM dd, yyyy')}
                      </td>
                      <td style={{ padding: '16px 24px', fontSize: '14px', color: '#6b7280' }}>
                        {format(new Date(invoice.dueDate), 'MMM dd, yyyy')}
                      </td>
                      <td style={{ padding: '16px 24px', fontSize: '14px', color: '#1f2937', fontWeight: '500' }}>
                        ${invoice.total.toFixed(2)}
                      </td>
                      <td style={{ padding: '16px 24px' }}>
                        <span style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          padding: '4px 8px',
                          borderRadius: '4px',
                          fontSize: '12px',
                          fontWeight: '500',
                          textTransform: 'capitalize',
                          backgroundColor: 
                            status === 'paid' ? '#dcfce7' : 
                            status === 'overdue' ? '#fee2e2' : 
                            status === 'unknown' ? '#f3f4f6' : '#fef3c7',
                          color: 
                            status === 'paid' ? '#16a34a' : 
                            status === 'overdue' ? '#dc2626' : 
                            status === 'unknown' ? '#6b7280' : '#d97706'
                        }}>
                          {status}
                        </span>
                      </td>
                      <td style={{ padding: '16px 24px' }}>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <button
                            onClick={() => handleEdit(invoice)}
                            style={{
                              padding: '6px',
                              border: 'none',
                              borderRadius: '4px',
                              backgroundColor: '#f3f4f6',
                              color: '#6b7280',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center'
                            }}
                            title="Edit Invoice"
                            onMouseOver={(e) => e.target.style.backgroundColor = '#e5e7eb'}
                            onMouseOut={(e) => e.target.style.backgroundColor = '#f3f4f6'}
                          >
                            <Edit size={16} />
                          </button>
                          <button
                            onClick={() => handleDelete(invoice.id)}
                            style={{
                              padding: '6px',
                              border: 'none',
                              borderRadius: '4px',
                              backgroundColor: '#fee2e2',
                              color: '#dc2626',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center'
                            }}
                            title="Delete Invoice"
                            onMouseOver={(e) => e.target.style.backgroundColor = '#fecaca'}
                            onMouseOut={(e) => e.target.style.backgroundColor = '#fee2e2'}
                          >
                            <Trash2 size={16} />
                          </button>
                          <button
                            onClick={() => handleSendEmail(invoice)}
                            style={{
                              padding: '6px',
                              border: 'none',
                              borderRadius: '4px',
                              backgroundColor: '#e0f2fe',
                              color: '#0284c7',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center'
                            }}
                            title="Send Invoice Email"
                            onMouseOver={(e) => e.target.style.backgroundColor = '#bae6fd'}
                            onMouseOut={(e) => e.target.style.backgroundColor = '#e0f2fe'}
                          >
                            <Send size={16} />
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
        <div 
          style={{
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
          }}
          onClick={() => setShowModal(false)}
        >
          <div 
            style={{
              backgroundColor: 'white',
              borderRadius: '8px',
              padding: '24px',
              width: '100%',
              maxWidth: '800px',
              maxHeight: '90vh',
              overflow: 'auto'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h2 style={{ fontSize: '20px', fontWeight: '600', color: '#1f2937', margin: '0' }}>
                {editingInvoice ? 'Edit Invoice' : 'Create New Invoice'}
              </h2>
              <button 
                type="button"
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '24px',
                  color: '#6b7280',
                  cursor: 'pointer',
                  padding: '4px'
                }}
                onClick={() => setShowModal(false)}
              >
                ×
              </button>
            </div>
            
            <form onSubmit={handleSubmit}>
              <div>
                {/* Basic Invoice Information */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px' }}>
                  <div className="form-group">
                    <label className="form-label">Customer *</label>
                    <select
                      name="customerId"
                      value={formData.customerId}
                      onChange={handleInputChange}
                      className="form-control"
                      required
                    >
                      <option value="">Select a customer</option>
                      {customers.filter(customer => customer && customer.id && customer.name).map(customer => (
                        <option key={customer.id} value={customer.id}>
                          {customer.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Invoice Number *</label>
                    <input
                      type="text"
                      name="number"
                      value={formData.number}
                      onChange={handleInputChange}
                      className="form-control"
                      required
                    />
                  </div>
                </div>
                
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px' }}>
                  <div className="form-group">
                    <label className="form-label">Issue Date *</label>
                    <input
                      type="date"
                      name="issueDate"
                      value={formData.issueDate}
                      onChange={handleInputChange}
                      className="form-control"
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Due Date *</label>
                    <input
                      type="date"
                      name="dueDate"
                      value={formData.dueDate}
                      onChange={handleInputChange}
                      className="form-control"
                      required
                    />
                  </div>
                </div>

                {/* Invoice Items */}
                <div style={{ marginBottom: '24px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                    <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#1f2937', margin: '0' }}>Invoice Items</h3>
                    <button
                      type="button"
                      onClick={addItem}
                      className="btn btn-secondary"
                      style={{ fontSize: '14px', padding: '8px 12px' }}
                    >
                      <Plus size={16} />
                      Add Item
                    </button>
                  </div>
                  <div style={{ border: '1px solid #e5e7eb', borderRadius: '8px', padding: '16px' }}>
                    {formData.items.map((item, index) => (
                      <div key={index} style={{ 
                        padding: '16px', 
                        borderBottom: index < formData.items.length - 1 ? '1px solid #f3f4f6' : 'none',
                        display: 'grid',
                        gridTemplateColumns: '1fr 2fr 80px 100px 100px 40px',
                        gap: '12px',
                        alignItems: 'end'
                      }}>
                        <div className="form-group">
                          <label className="form-label">Product</label>
                          <select
                            value={item.productId}
                            onChange={(e) => updateItem(index, 'productId', e.target.value)}
                            className="form-control"
                          >
                            <option value="">Select product</option>
                            {products.filter(product => product && product.name).map(product => (
                              <option key={product.id} value={product.id}>
                                {product.name}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div className="form-group">
                          <label className="form-label">Description</label>
                          <input
                            type="text"
                            value={item.description}
                            onChange={(e) => updateItem(index, 'description', e.target.value)}
                            className="form-control"
                          />
                        </div>
                        <div className="form-group">
                          <label className="form-label">Qty</label>
                          <input
                            type="number"
                            min="1"
                            value={item.quantity}
                            onChange={(e) => updateItem(index, 'quantity', parseInt(e.target.value) || 1)}
                            className="form-control"
                          />
                        </div>
                        <div className="form-group">
                          <label className="form-label">Rate</label>
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            value={item.rate}
                            onChange={(e) => updateItem(index, 'rate', parseFloat(e.target.value) || 0)}
                            className="form-control"
                          />
                        </div>
                        <div className="form-group">
                          <label className="form-label">Total</label>
                          <div className="item-total">
                            ${(item.quantity * item.rate).toFixed(2)}
                          </div>
                        </div>
                        <div className="item-actions">
                          <button
                            type="button"
                            onClick={() => removeItem(index)}
                            className="btn-icon delete"
                            disabled={formData.items.length === 1}
                            title="Remove Item"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="invoice-total">
                    <div className="total-row">
                      <span>Subtotal:</span>
                      <span>${calculateTotal(formData.items).toFixed(2)}</span>
                    </div>
                    <div className="total-row grand-total">
                      <span>Total:</span>
                      <span>${calculateTotal(formData.items).toFixed(2)}</span>
                    </div>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px' }}>
                  <div className="form-group">
                    <label className="form-label">Notes</label>
                    <textarea
                      name="notes"
                      value={formData.notes}
                      onChange={handleInputChange}
                      className="form-control"
                      rows="3"
                      placeholder="Additional notes about this invoice..."
                    ></textarea>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Terms & Conditions</label>
                    <textarea
                      name="terms"
                      value={formData.terms}
                      onChange={handleInputChange}
                      className="form-control"
                      rows="3"
                      placeholder="Payment terms and conditions..."
                    ></textarea>
                  </div>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '24px' }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => {
                    setShowModal(false);
                    resetForm();
                  }}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  {editingInvoice ? 'Update' : 'Create'} Invoice
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Invoices;