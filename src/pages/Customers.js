import React, { useState } from 'react';
import { Plus, Search, Edit, Trash2, Mail, Phone, MapPin, Hash } from 'lucide-react';
import { useBilling } from '../context/BillingContext';
import { format } from 'date-fns';

const Customers = () => {
  const { state, dispatch } = useBilling();
  const { customers } = state;
  const [showModal, setShowModal] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    taxId: ''
  });

  const getFilteredCustomers = () => {
    return customers.filter(customer =>
      customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.phone.includes(searchTerm)
    );
  };

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    const customerData = {
      ...formData,
      createdAt: editingCustomer ? editingCustomer.createdAt : new Date().toISOString().split('T')[0]
    };

    if (editingCustomer) {
      dispatch({
        type: 'UPDATE_CUSTOMER',
        payload: { ...customerData, id: editingCustomer.id }
      });
    } else {
      dispatch({
        type: 'ADD_CUSTOMER',
        payload: customerData
      });
    }

    resetForm();
  };

  const handleEdit = (customer) => {
    setEditingCustomer(customer);
    setFormData({
      name: customer.name,
      email: customer.email,
      phone: customer.phone,
      address: customer.address,
      taxId: customer.taxId
    });
    setShowModal(true);
  };

  const handleDelete = (customerId) => {
    if (window.confirm('Are you sure you want to delete this customer?')) {
      dispatch({
        type: 'DELETE_CUSTOMER',
        payload: customerId
      });
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      email: '',
      phone: '',
      address: '',
      taxId: ''
    });
    setEditingCustomer(null);
    setShowModal(false);
  };

  const filteredCustomers = getFilteredCustomers();

  return (
    <div>
      <div style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h1 style={{ fontSize: '24px', fontWeight: '700', color: '#1f2937' }}>Customers</h1>
          <button 
            className="btn btn-primary"
            onClick={() => setShowModal(true)}
          >
            <Plus size={20} />
            Add Customer
          </button>
        </div>

        <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
          <div style={{ position: 'relative', flex: 1, maxWidth: '400px' }}>
            <Search size={20} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }} />
            <input
              type="text"
              placeholder="Search customers..."
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
        </div>
      </div>

      <div className="card">
        {filteredCustomers.length === 0 ? (
          <div style={{ padding: '48px', textAlign: 'center', color: '#6b7280' }}>
            <h3>No customers found</h3>
            <p>Get started by adding your first customer.</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gap: '16px', padding: '24px' }}>
            {filteredCustomers.map((customer) => (
              <div
                key={customer.id}
                style={{
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  padding: '20px',
                  backgroundColor: 'white'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                  <div style={{ flex: 1 }}>
                    <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#1f2937', marginBottom: '8px' }}>
                      {customer.name}
                    </h3>
                    
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '12px', marginBottom: '16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#6b7280' }}>
                        <Mail size={16} />
                        <span>{customer.email}</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#6b7280' }}>
                        <Phone size={16} />
                        <span>{customer.phone}</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#6b7280' }}>
                        <Hash size={16} />
                        <span>Tax ID: {customer.taxId}</span>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'start', gap: '8px', color: '#6b7280', marginBottom: '12px' }}>
                      <MapPin size={16} style={{ marginTop: '2px', flexShrink: 0 }} />
                      <span>{customer.address}</span>
                    </div>

                    <div style={{ fontSize: '14px', color: '#9ca3af' }}>
                      Customer since {format(new Date(customer.createdAt), 'MMM dd, yyyy')}
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                      className="btn btn-secondary"
                      onClick={() => handleEdit(customer)}
                      style={{ padding: '8px' }}
                    >
                      <Edit size={16} />
                    </button>
                    <button
                      className="btn btn-danger"
                      onClick={() => handleDelete(customer.id)}
                      style={{ padding: '8px' }}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
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
              {editingCustomer ? 'Edit Customer' : 'Add New Customer'}
            </h2>

            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label">Customer Name *</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className="form-control"
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Email *</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className="form-control"
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Phone *</label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  className="form-control"
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Address *</label>
                <textarea
                  name="address"
                  value={formData.address}
                  onChange={handleInputChange}
                  className="form-control"
                  rows="3"
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Tax ID</label>
                <input
                  type="text"
                  name="taxId"
                  value={formData.taxId}
                  onChange={handleInputChange}
                  className="form-control"
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
                  {editingCustomer ? 'Update Customer' : 'Add Customer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Customers;