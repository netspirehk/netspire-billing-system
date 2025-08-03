import React, { createContext, useContext, useReducer, useEffect } from 'react';

const BillingContext = createContext();

// Initial state
const initialState = {
  customers: [
    {
      id: 1,
      name: 'Acme Corporation',
      email: 'billing@acme.com',
      phone: '+1 (555) 123-4567',
      address: '123 Business St, Suite 100, New York, NY 10001',
      taxId: 'US123456789',
      createdAt: '2024-01-15'
    },
    {
      id: 2,
      name: 'TechStart Inc',
      email: 'finance@techstart.com',
      phone: '+1 (555) 987-6543',
      address: '456 Innovation Ave, San Francisco, CA 94105',
      taxId: 'US987654321',
      createdAt: '2024-02-20'
    }
  ],
  products: [
    {
      id: 1,
      name: 'Web Development Service',
      description: 'Custom website development and design',
      price: 150.00,
      category: 'Services',
      taxRate: 0.08
    },
    {
      id: 2,
      name: 'Monthly Website Maintenance',
      description: 'Ongoing website maintenance and updates',
      price: 99.00,
      category: 'Subscription',
      taxRate: 0.08
    },
    {
      id: 3,
      name: 'Logo Design',
      description: 'Custom logo design and branding',
      price: 299.00,
      category: 'Design',
      taxRate: 0.08
    }
  ],
  invoices: [
    {
      id: 1,
      customerId: 1,
      invoiceNumber: 'INV-2024-001',
      issueDate: '2024-01-15',
      dueDate: '2024-02-14',
      status: 'paid',
      items: [
        { productId: 1, quantity: 40, rate: 150.00 },
        { productId: 3, quantity: 1, rate: 299.00 }
      ],
      subtotal: 6299.00,
      tax: 503.92,
      total: 6802.92,
      notes: 'Thank you for your business!'
    },
    {
      id: 2,
      customerId: 2,
      invoiceNumber: 'INV-2024-002',
      issueDate: '2024-02-01',
      dueDate: '2024-03-03',
      status: 'pending',
      items: [
        { productId: 2, quantity: 3, rate: 99.00 }
      ],
      subtotal: 297.00,
      tax: 23.76,
      total: 320.76,
      notes: 'Net 30 payment terms'
    }
  ],
  payments: [
    {
      id: 1,
      invoiceId: 1,
      amount: 6802.92,
      paymentDate: '2024-01-30',
      method: 'Bank Transfer',
      reference: 'TXN-001234',
      notes: 'Received via wire transfer'
    }
  ]
};

// Reducer function
function billingReducer(state, action) {
  switch (action.type) {
    case 'ADD_CUSTOMER':
      return {
        ...state,
        customers: [...state.customers, { ...action.payload, id: Date.now() }]
      };
    
    case 'UPDATE_CUSTOMER':
      return {
        ...state,
        customers: state.customers.map(customer =>
          customer.id === action.payload.id ? action.payload : customer
        )
      };
    
    case 'DELETE_CUSTOMER':
      return {
        ...state,
        customers: state.customers.filter(customer => customer.id !== action.payload)
      };
    
    case 'ADD_PRODUCT':
      return {
        ...state,
        products: [...state.products, { ...action.payload, id: Date.now() }]
      };
    
    case 'UPDATE_PRODUCT':
      return {
        ...state,
        products: state.products.map(product =>
          product.id === action.payload.id ? action.payload : product
        )
      };
    
    case 'DELETE_PRODUCT':
      return {
        ...state,
        products: state.products.filter(product => product.id !== action.payload)
      };
    
    case 'ADD_INVOICE':
      return {
        ...state,
        invoices: [...state.invoices, { ...action.payload, id: Date.now() }]
      };
    
    case 'UPDATE_INVOICE':
      return {
        ...state,
        invoices: state.invoices.map(invoice =>
          invoice.id === action.payload.id ? action.payload : invoice
        )
      };
    
    case 'DELETE_INVOICE':
      return {
        ...state,
        invoices: state.invoices.filter(invoice => invoice.id !== action.payload)
      };
    
    case 'ADD_PAYMENT':
      return {
        ...state,
        payments: [...state.payments, { ...action.payload, id: Date.now() }]
      };
    
    case 'UPDATE_PAYMENT':
      return {
        ...state,
        payments: state.payments.map(payment =>
          payment.id === action.payload.id ? action.payload : payment
        )
      };
    
    case 'DELETE_PAYMENT':
      return {
        ...state,
        payments: state.payments.filter(payment => payment.id !== action.payload)
      };
    
    default:
      return state;
  }
}

export function BillingProvider({ children }) {
  const [state, dispatch] = useReducer(billingReducer, initialState);

  // Load data from localStorage on mount
  useEffect(() => {
    const savedData = localStorage.getItem('billingSystemData');
    if (savedData) {
      try {
        const parsedData = JSON.parse(savedData);
        // You could dispatch actions to restore state here
      } catch (error) {
        console.error('Error loading saved data:', error);
      }
    }
  }, []);

  // Save data to localStorage whenever state changes
  useEffect(() => {
    localStorage.setItem('billingSystemData', JSON.stringify(state));
  }, [state]);

  return (
    <BillingContext.Provider value={{ state, dispatch }}>
      {children}
    </BillingContext.Provider>
  );
}

export function useBilling() {
  const context = useContext(BillingContext);
  if (!context) {
    throw new Error('useBilling must be used within a BillingProvider');
  }
  return context;
}