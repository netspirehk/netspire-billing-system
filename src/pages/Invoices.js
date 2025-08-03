import React, { useState } from 'react';
import { Plus, Search, Edit, Trash2, Calendar, DollarSign } from 'lucide-react';
import { useBilling } from '../context/BillingContext';
import { format } from 'date-fns';

const Invoices = () => {
  const { state, dispatch } = useBilling();
  const { invoices, customers, products } = state;
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
    const today = new Date();
    const dueDate = new Date(invoice.dueDate);
    
    if (invoice.total === 0) return 'paid';
    if (dueDate < today) return 'overdue';
    return 'pending';
  };

  const getFilteredInvoices = () => {
    return invoices.filter(invoice => {
      const customer = customers.find(c => c.id === invoice.customerId);
      const matchesSearch = invoice.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (customer && customer.name.toLowerCase().includes(searchTerm.toLowerCase()));
      
      if (statusFilter === 'all') return matchesSearch;
      return matchesSearch && getInvoiceStatus(invoice) === statusFilter;
    });
  };

  const getCustomerInfo = (customerId) => {
    return customers.find(c => c.id === customerId);
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
      const product = products.find(p => p.id === value);
      if (product) {
        newItems[index].rate = product.price;
        newItems[index].description = product.description || product.name;
      }
    }
    
    setFormData({ ...formData, items: newItems });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    const total = calculateTotal(formData.items);
    const invoiceData = {
      ...formData,
      total,
      subtotal: total,
      tax: 0, // Can be enhanced later
    };

    if (editingInvoice) {
      dispatch({
        type: 'UPDATE_INVOICE',
        payload: { ...invoiceData, id: editingInvoice.id }
      });
    } else {
      const newInvoice = {
        ...invoiceData,
        id: Date.now(),
        createdAt: new Date().toISOString(),
        status: 'draft'
      };
      dispatch({ type: 'ADD_INVOICE', payload: newInvoice });
    }
    
    resetForm();
    setShowModal(false);
  };

  const handleEdit = (invoice) => {
    setEditingInvoice(invoice);
    setFormData(invoice);
    setShowModal(true);
  };

  const handleDelete = (invoiceId) => {
    if (window.confirm('Are you sure you want to delete this invoice?')) {
      dispatch({ type: 'DELETE_INVOICE', payload: invoiceId });
    }
  };



  return (
    <div className="invoices-page">
      <div className="page-header">
        <div>
          <h1>Invoices</h1>
          <p>Create and manage customer invoices</p>
        </div>
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

      {/* Search and Filters */}
      <div className="search-filters card">
        <div className="search-bar">
          <Search size={20} />
          <input
            type="text"
            placeholder="Search invoices by number or customer..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="form-control"
          />
        </div>
        <div className="filter-controls">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="form-control"
          >
            <option value="all">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="overdue">Overdue</option>
            <option value="paid">Paid</option>
          </select>
        </div>
      </div>

      {/* Invoices Table */}
      <div className="invoices-table card">
        <div className="table-header">
          <h2>Invoices ({filteredInvoices.length})</h2>
        </div>
        <table className="table">
          <thead>
            <tr>
              <th>Invoice</th>
              <th>Customer</th>
              <th>Issue Date</th>
              <th>Due Date</th>
              <th>Amount</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredInvoices.map((invoice) => {
              const customer = getCustomerInfo(invoice.customerId);
              const status = getInvoiceStatus(invoice);
              
              return (
                <tr key={invoice.id}>
                  <td>#{invoice.invoiceNumber}</td>
                  <td>{customer ? customer.name : 'Unknown Customer'}</td>
                  <td>{format(new Date(invoice.issueDate), 'MMM dd, yyyy')}</td>
                  <td>{format(new Date(invoice.dueDate), 'MMM dd, yyyy')}</td>
                  <td className="amount">${invoice.total.toFixed(2)}</td>
                  <td>
                    <span className={`status-badge status-${status}`}>
                      {status}
                    </span>
                  </td>
                  <td>
                    <div className="action-buttons">
                      <button
                        onClick={() => handleEdit(invoice)}
                        className="btn-icon edit"
                        title="Edit Invoice"
                      >
                        <Edit size={16} />
                      </button>
                      <button
                        onClick={() => handleDelete(invoice.id)}
                        className="btn-icon delete"
                        title="Delete Invoice"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {filteredInvoices.length === 0 && (
          <div className="empty-state">
            <p>No invoices found.</p>
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal large" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editingInvoice ? 'Edit Invoice' : 'Create New Invoice'}</h2>
              <button 
                className="modal-close"
                onClick={() => setShowModal(false)}
              >
                ×
              </button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className="form-row">
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
                      {customers.map(customer => (
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
                <div className="form-row">
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
                <div className="invoice-items-section">
                  <div className="section-header">
                    <h3>Invoice Items</h3>
                    <button
                      type="button"
                      onClick={addItem}
                      className="btn btn-secondary"
                    >
                      Add Item
                    </button>
                  </div>
                  <div className="items-list">
                    {formData.items.map((item, index) => (
                      <div key={index} className="item-row">
                        <div className="form-group">
                          <label className="form-label">Product</label>
                          <select
                            value={item.productId}
                            onChange={(e) => updateItem(index, 'productId', e.target.value)}
                            className="form-control"
                          >
                            <option value="">Select product</option>
                            {products.map(product => (
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

                <div className="form-row">
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
              <div className="modal-actions">
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