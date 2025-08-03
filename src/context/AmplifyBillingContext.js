import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { generateClient } from 'aws-amplify/data';
import { getCurrentUser, fetchAuthSession } from 'aws-amplify/auth';

const BillingContext = createContext();

// Generate the GraphQL client
const client = generateClient();

// Initial state
const initialState = {
  customers: [],
  products: [],
  invoices: [],
  payments: [],
  loading: false,
  error: null,
  user: null,
  userGroups: [],
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

    // Customer actions
    case 'SET_CUSTOMERS':
      return { ...state, customers: action.payload, loading: false };
    
    case 'ADD_CUSTOMER':
      return { ...state, customers: [...state.customers, action.payload] };
    
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

    // Product actions
    case 'SET_PRODUCTS':
      return { ...state, products: action.payload, loading: false };
    
    case 'ADD_PRODUCT':
      return { ...state, products: [...state.products, action.payload] };
    
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

    // Invoice actions
    case 'SET_INVOICES':
      return { ...state, invoices: action.payload, loading: false };
    
    case 'ADD_INVOICE':
      return { ...state, invoices: [...state.invoices, action.payload] };
    
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

    // Payment actions
    case 'SET_PAYMENTS':
      return { ...state, payments: action.payload, loading: false };
    
    case 'ADD_PAYMENT':
      return { ...state, payments: [...state.payments, action.payload] };
    
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

  // Load user and user groups
  useEffect(() => {
    loadUserInfo();
  }, []);

  // Load all data when component mounts
  useEffect(() => {
    if (state.user) {
      loadAllData();
    }
  }, [state.user]);

  const loadUserInfo = async () => {
    try {
      const user = await getCurrentUser();
      const session = await fetchAuthSession();
      const groups = session.tokens?.accessToken?.payload['cognito:groups'] || [];
      
      dispatch({
        type: 'SET_USER',
        payload: { user, groups }
      });
    } catch (error) {
      console.error('Error loading user info:', error);
      dispatch({ type: 'SET_ERROR', payload: error.message });
    }
  };

  const loadAllData = async () => {
    dispatch({ type: 'SET_LOADING', payload: true });
    
    try {
      // Load all data in parallel
      const [customersResult, productsResult, invoicesResult, paymentsResult] = await Promise.all([
        client.models.Customer.list(),
        client.models.Product.list(),
        client.models.Invoice.list(),
        client.models.Payment.list()
      ]);

      dispatch({ type: 'SET_CUSTOMERS', payload: customersResult.data });
      dispatch({ type: 'SET_PRODUCTS', payload: productsResult.data });
      dispatch({ type: 'SET_INVOICES', payload: invoicesResult.data });
      dispatch({ type: 'SET_PAYMENTS', payload: paymentsResult.data });
      
    } catch (error) {
      console.error('Error loading data:', error);
      dispatch({ type: 'SET_ERROR', payload: error.message });
    }
  };

  // Enhanced API functions
  const api = {
    // Customer operations
    customers: {
      create: async (customerData) => {
        try {
          const result = await client.models.Customer.create(customerData);
          dispatch({ type: 'ADD_CUSTOMER', payload: result.data });
          return result.data;
        } catch (error) {
          dispatch({ type: 'SET_ERROR', payload: error.message });
          throw error;
        }
      },
      
      update: async (id, customerData) => {
        try {
          const result = await client.models.Customer.update({ id, ...customerData });
          dispatch({ type: 'UPDATE_CUSTOMER', payload: result.data });
          return result.data;
        } catch (error) {
          dispatch({ type: 'SET_ERROR', payload: error.message });
          throw error;
        }
      },
      
      delete: async (id) => {
        try {
          await client.models.Customer.delete({ id });
          dispatch({ type: 'DELETE_CUSTOMER', payload: id });
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
          const result = await client.models.Product.create(productData);
          dispatch({ type: 'ADD_PRODUCT', payload: result.data });
          return result.data;
        } catch (error) {
          dispatch({ type: 'SET_ERROR', payload: error.message });
          throw error;
        }
      },
      
      update: async (id, productData) => {
        try {
          const result = await client.models.Product.update({ id, ...productData });
          dispatch({ type: 'UPDATE_PRODUCT', payload: result.data });
          return result.data;
        } catch (error) {
          dispatch({ type: 'SET_ERROR', payload: error.message });
          throw error;
        }
      },
      
      delete: async (id) => {
        try {
          await client.models.Product.delete({ id });
          dispatch({ type: 'DELETE_PRODUCT', payload: id });
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
          const result = await client.models.Invoice.create(invoiceData);
          dispatch({ type: 'ADD_INVOICE', payload: result.data });
          return result.data;
        } catch (error) {
          dispatch({ type: 'SET_ERROR', payload: error.message });
          throw error;
        }
      },
      
      update: async (id, invoiceData) => {
        try {
          const result = await client.models.Invoice.update({ id, ...invoiceData });
          dispatch({ type: 'UPDATE_INVOICE', payload: result.data });
          return result.data;
        } catch (error) {
          dispatch({ type: 'SET_ERROR', payload: error.message });
          throw error;
        }
      },
      
      delete: async (id) => {
        try {
          await client.models.Invoice.delete({ id });
          dispatch({ type: 'DELETE_INVOICE', payload: id });
        } catch (error) {
          dispatch({ type: 'SET_ERROR', payload: error.message });
          throw error;
        }
      },

      // Send invoice via email
      send: async (invoiceId) => {
        try {
          // This would trigger a Lambda function to send email
          const result = await client.models.Invoice.update({ 
            id: invoiceId, 
            status: 'sent',
            sentAt: new Date().toISOString()
          });
          dispatch({ type: 'UPDATE_INVOICE', payload: result.data });
          return result.data;
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
          const result = await client.models.Payment.create(paymentData);
          dispatch({ type: 'ADD_PAYMENT', payload: result.data });
          
          // Update invoice status if fully paid
          const invoice = state.invoices.find(inv => inv.id === paymentData.invoiceId);
          if (invoice) {
            const totalPaid = state.payments
              .filter(p => p.invoiceId === paymentData.invoiceId)
              .reduce((sum, p) => sum + p.amount, 0) + paymentData.amount;
            
            if (totalPaid >= invoice.total) {
              api.invoices.update(invoice.id, { status: 'paid' });
            }
          }
          
          return result.data;
        } catch (error) {
          dispatch({ type: 'SET_ERROR', payload: error.message });
          throw error;
        }
      },
      
      update: async (id, paymentData) => {
        try {
          const result = await client.models.Payment.update({ id, ...paymentData });
          dispatch({ type: 'UPDATE_PAYMENT', payload: result.data });
          return result.data;
        } catch (error) {
          dispatch({ type: 'SET_ERROR', payload: error.message });
          throw error;
        }
      },
      
      delete: async (id) => {
        try {
          await client.models.Payment.delete({ id });
          dispatch({ type: 'DELETE_PAYMENT', payload: id });
        } catch (error) {
          dispatch({ type: 'SET_ERROR', payload: error.message });
          throw error;
        }
      }
    },

    // Utility functions
    refresh: loadAllData,
    clearError: () => dispatch({ type: 'SET_ERROR', payload: null })
  };

  // Real-time subscriptions
  useEffect(() => {
    if (!state.user) return;

    // Subscribe to real-time updates
    const subscriptions = [
      client.models.Customer.onCreate().subscribe(({ data }) => {
        dispatch({ type: 'ADD_CUSTOMER', payload: data });
      }),
      client.models.Customer.onUpdate().subscribe(({ data }) => {
        dispatch({ type: 'UPDATE_CUSTOMER', payload: data });
      }),
      client.models.Customer.onDelete().subscribe(({ data }) => {
        dispatch({ type: 'DELETE_CUSTOMER', payload: data.id });
      }),
      
      client.models.Invoice.onCreate().subscribe(({ data }) => {
        dispatch({ type: 'ADD_INVOICE', payload: data });
      }),
      client.models.Invoice.onUpdate().subscribe(({ data }) => {
        dispatch({ type: 'UPDATE_INVOICE', payload: data });
      }),
      
      client.models.Payment.onCreate().subscribe(({ data }) => {
        dispatch({ type: 'ADD_PAYMENT', payload: data });
      }),
    ];

    // Cleanup subscriptions
    return () => {
      subscriptions.forEach(sub => sub.unsubscribe());
    };
  }, [state.user]);

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

// Permission helpers
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