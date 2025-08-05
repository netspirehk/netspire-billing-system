import React, { createContext, useContext, useReducer, useEffect } from 'react';

const BillingContext = createContext();

// Initial state with sample data
const initialState = {
  loading: false,
  error: null,
  user: null,
  userGroups: ['admin'],
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

// Enhanced reducer with loading and error states
function billingReducer(state, action) {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    
    case 'SET_ERROR':
      return { ...state, error: action.payload, loading: false };
    
    case 'SET_USER':
      return { ...state, user: action.payload.user, userGroups: action.payload.groups };

    // Data loading actions
    case 'SET_CUSTOMERS':
      return { ...state, customers: action.payload, loading: false };
    
    case 'SET_PRODUCTS':
      return { ...state, products: action.payload, loading: false };
    
    case 'SET_INVOICES':
      return { ...state, invoices: action.payload, loading: false };
    
    case 'SET_PAYMENTS':
      return { ...state, payments: action.payload, loading: false };

    // Customer actions
    case 'ADD_CUSTOMER':
      return {
        ...state,
        customers: [...state.customers, action.payload]
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
        products: [...state.products, action.payload]
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
        invoices: [...state.invoices, action.payload]
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
        payments: [...state.payments, action.payload]
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
        dispatch({ type: 'SET_CUSTOMERS', payload: parsedData.customers || initialState.customers });
        dispatch({ type: 'SET_PRODUCTS', payload: parsedData.products || initialState.products });
        dispatch({ type: 'SET_INVOICES', payload: parsedData.invoices || initialState.invoices });
        dispatch({ type: 'SET_PAYMENTS', payload: parsedData.payments || initialState.payments });
      } catch (error) {
        console.error('Error loading saved data:', error);
        dispatch({ type: 'SET_ERROR', payload: 'Failed to load saved data' });
      }
    } else {
      // First time loading - use initial state data
      console.log('Loading initial data:', initialState);
      dispatch({ type: 'SET_CUSTOMERS', payload: initialState.customers });
      dispatch({ type: 'SET_PRODUCTS', payload: initialState.products });
      dispatch({ type: 'SET_INVOICES', payload: initialState.invoices });
      dispatch({ type: 'SET_PAYMENTS', payload: initialState.payments });
    }
  }, []);

  // Save data to localStorage whenever state changes
  useEffect(() => {
    const { loading, error, user, userGroups, ...dataToSave } = state;
    localStorage.setItem('billingSystemData', JSON.stringify(dataToSave));
  }, [state]);

  // Generate unique ID
  const generateId = () => {
    return Date.now().toString() + Math.random().toString(36).substr(2, 9);
  };

  // Enhanced API functions similar to AmplifyBillingContext
  const api = {
    // Customer operations
    customers: {
      create: async (customerData) => {
        try {
          dispatch({ type: 'SET_LOADING', payload: true });
          
          const newCustomer = {
            ...customerData,
            id: generateId(),
            createdAt: new Date().toISOString().split('T')[0]
          };
          
          dispatch({ type: 'ADD_CUSTOMER', payload: newCustomer });
          dispatch({ type: 'SET_LOADING', payload: false });
          return newCustomer;
        } catch (error) {
          dispatch({ type: 'SET_ERROR', payload: error.message });
          throw error;
        }
      },
      
      update: async (id, customerData) => {
        try {
          dispatch({ type: 'SET_LOADING', payload: true });
          
          const updatedCustomer = { ...customerData, id };
          dispatch({ type: 'UPDATE_CUSTOMER', payload: updatedCustomer });
          dispatch({ type: 'SET_LOADING', payload: false });
          return updatedCustomer;
        } catch (error) {
          dispatch({ type: 'SET_ERROR', payload: error.message });
          throw error;
        }
      },
      
      delete: async (id) => {
        try {
          dispatch({ type: 'SET_LOADING', payload: true });
          dispatch({ type: 'DELETE_CUSTOMER', payload: id });
          dispatch({ type: 'SET_LOADING', payload: false });
        } catch (error) {
          dispatch({ type: 'SET_ERROR', payload: error.message });
          throw error;
        }
      }
    },

    // Product operations
    products: {
      create: async (productData) => {
        try {
          dispatch({ type: 'SET_LOADING', payload: true });
          
          const newProduct = {
            ...productData,
            id: generateId()
          };
          
          dispatch({ type: 'ADD_PRODUCT', payload: newProduct });
          dispatch({ type: 'SET_LOADING', payload: false });
          return newProduct;
        } catch (error) {
          dispatch({ type: 'SET_ERROR', payload: error.message });
          throw error;
        }
      },
      
      update: async (id, productData) => {
        try {
          dispatch({ type: 'SET_LOADING', payload: true });
          
          const updatedProduct = { ...productData, id };
          dispatch({ type: 'UPDATE_PRODUCT', payload: updatedProduct });
          dispatch({ type: 'SET_LOADING', payload: false });
          return updatedProduct;
        } catch (error) {
          dispatch({ type: 'SET_ERROR', payload: error.message });
          throw error;
        }
      },
      
      delete: async (id) => {
        try {
          dispatch({ type: 'SET_LOADING', payload: true });
          dispatch({ type: 'DELETE_PRODUCT', payload: id });
          dispatch({ type: 'SET_LOADING', payload: false });
        } catch (error) {
          dispatch({ type: 'SET_ERROR', payload: error.message });
          throw error;
        }
      }
    },

    // Invoice operations
    invoices: {
      create: async (invoiceData) => {
        try {
          dispatch({ type: 'SET_LOADING', payload: true });
          
          const newInvoice = {
            ...invoiceData,
            id: generateId(),
            invoiceNumber: `INV-${new Date().getFullYear()}-${String(state.invoices.length + 1).padStart(3, '0')}`,
            issueDate: new Date().toISOString().split('T')[0]
          };
          
          dispatch({ type: 'ADD_INVOICE', payload: newInvoice });
          dispatch({ type: 'SET_LOADING', payload: false });
          return newInvoice;
        } catch (error) {
          dispatch({ type: 'SET_ERROR', payload: error.message });
          throw error;
        }
      },
      
      update: async (id, invoiceData) => {
        try {
          dispatch({ type: 'SET_LOADING', payload: true });
          
          const updatedInvoice = { ...invoiceData, id };
          dispatch({ type: 'UPDATE_INVOICE', payload: updatedInvoice });
          dispatch({ type: 'SET_LOADING', payload: false });
          return updatedInvoice;
        } catch (error) {
          dispatch({ type: 'SET_ERROR', payload: error.message });
          throw error;
        }
      },
      
      delete: async (id) => {
        try {
          dispatch({ type: 'SET_LOADING', payload: true });
          dispatch({ type: 'DELETE_INVOICE', payload: id });
          dispatch({ type: 'SET_LOADING', payload: false });
        } catch (error) {
          dispatch({ type: 'SET_ERROR', payload: error.message });
          throw error;
        }
      },

      // Send invoice via email (simulated)
      send: async (invoiceId) => {
        try {
          dispatch({ type: 'SET_LOADING', payload: true });
          
          // Simulate email sending delay
          await new Promise(resolve => setTimeout(resolve, 1000));
          
          const updatedInvoice = {
            ...state.invoices.find(inv => inv.id === invoiceId),
            status: 'sent',
            sentAt: new Date().toISOString()
          };
          
          dispatch({ type: 'UPDATE_INVOICE', payload: updatedInvoice });
          dispatch({ type: 'SET_LOADING', payload: false });
          return updatedInvoice;
        } catch (error) {
          dispatch({ type: 'SET_ERROR', payload: error.message });
          throw error;
        }
      }
    },

    // Payment operations
    payments: {
      create: async (paymentData) => {
        try {
          dispatch({ type: 'SET_LOADING', payload: true });
          
          const newPayment = {
            ...paymentData,
            id: generateId(),
            paymentDate: paymentData.paymentDate || new Date().toISOString().split('T')[0]
          };
          
          dispatch({ type: 'ADD_PAYMENT', payload: newPayment });
          
          // Update invoice status if fully paid
          const invoice = state.invoices.find(inv => inv.id === paymentData.invoiceId);
          if (invoice) {
            const totalPaid = state.payments
              .filter(p => p.invoiceId === paymentData.invoiceId)
              .reduce((sum, p) => sum + p.amount, 0) + paymentData.amount;
            
            if (totalPaid >= invoice.total) {
              const updatedInvoice = { ...invoice, status: 'paid' };
              dispatch({ type: 'UPDATE_INVOICE', payload: updatedInvoice });
            }
          }
          
          dispatch({ type: 'SET_LOADING', payload: false });
          return newPayment;
        } catch (error) {
          dispatch({ type: 'SET_ERROR', payload: error.message });
          throw error;
        }
      },
      
      update: async (id, paymentData) => {
        try {
          dispatch({ type: 'SET_LOADING', payload: true });
          
          const updatedPayment = { ...paymentData, id };
          dispatch({ type: 'UPDATE_PAYMENT', payload: updatedPayment });
          dispatch({ type: 'SET_LOADING', payload: false });
          return updatedPayment;
        } catch (error) {
          dispatch({ type: 'SET_ERROR', payload: error.message });
          throw error;
        }
      },
      
      delete: async (id) => {
        try {
          dispatch({ type: 'SET_LOADING', payload: true });
          dispatch({ type: 'DELETE_PAYMENT', payload: id });
          dispatch({ type: 'SET_LOADING', payload: false });
        } catch (error) {
          dispatch({ type: 'SET_ERROR', payload: error.message });
          throw error;
        }
      }
    },

    // Utility functions
    refresh: async () => {
      // For local storage, just reload from localStorage
      const savedData = localStorage.getItem('billingSystemData');
      if (savedData) {
        try {
          const parsedData = JSON.parse(savedData);
          dispatch({ type: 'SET_CUSTOMERS', payload: parsedData.customers || [] });
          dispatch({ type: 'SET_PRODUCTS', payload: parsedData.products || [] });
          dispatch({ type: 'SET_INVOICES', payload: parsedData.invoices || [] });
          dispatch({ type: 'SET_PAYMENTS', payload: parsedData.payments || [] });
        } catch (error) {
          dispatch({ type: 'SET_ERROR', payload: 'Failed to refresh data' });
        }
      }
    },
    clearError: () => dispatch({ type: 'SET_ERROR', payload: null })
  };

  return (
    <BillingContext.Provider value={{ state, dispatch, api }}>
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

// Permission helpers (compatible with the old AmplifyBillingContext)
export function usePermissions() {
  const { state } = useBilling();
  
  return {
    canCreate: state.userGroups.includes('admin') || state.userGroups.includes('billing'),
    canEdit: state.userGroups.includes('admin') || state.userGroups.includes('billing'),
    canDelete: state.userGroups.includes('admin'),
    canViewReports: state.userGroups.includes('admin') || state.userGroups.includes('billing'),
    isAdmin: state.userGroups.includes('admin'),
    isBilling: state.userGroups.includes('billing'),
    isViewer: state.userGroups.includes('viewer'),
  };
}