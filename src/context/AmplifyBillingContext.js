import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { generateClient } from 'aws-amplify/data';
import { getCurrentUser, fetchAuthSession } from 'aws-amplify/auth';

import outputs from '../amplify_outputs.json';

const BillingContext = createContext();

// Initialize GraphQL client following official Amplify Gen 2 documentation
const client = generateClient();
console.log('✅ GraphQL client initialized successfully');

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
      return { ...state, customers: (action.payload || []).filter(c => c && c.id && c.name), loading: false };
    
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
      return { ...state, products: (action.payload || []).filter(p => p && p.name), loading: false };
    
    case 'ADD_PRODUCT':
      return { ...state, products: [...state.products, action.payload].filter(p => p && p.name) };
    
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
      return { ...state, invoices: (action.payload || []).filter(inv => inv && inv.customerId && inv.invoiceNumber), loading: false };
    
    case 'ADD_INVOICE':
      return { 
        ...state, 
        invoices: [...state.invoices, action.payload].filter(inv => inv && inv.customerId && inv.invoiceNumber)
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

    // Payment actions
    case 'SET_PAYMENTS':
      return { ...state, payments: (action.payload || []).filter(pay => pay && pay.invoiceId), loading: false };
    
    case 'ADD_PAYMENT':
      return { 
        ...state, 
        payments: [...state.payments, action.payload].filter(pay => pay && pay.invoiceId)
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

  // Load data immediately (skip Amplify auth since using SimpleAuth)
  useEffect(() => {
    // Set default user for permissions
    dispatch({
      type: 'SET_USER',
      payload: { 
        user: { username: 'admin' }, 
        groups: ['admin'] // Default to admin permissions
      }
    });
    loadAllData();
  }, []);

  const loadUserInfo = async () => {
    // This function is not needed with SimpleAuth
    // User info is handled by SimpleAuthContext
  };

  const loadAllData = async () => {
    dispatch({ type: 'SET_LOADING', payload: true });
    
    try {
      // Load all data in parallel
      const [customersResult, productsResult, invoicesResult, paymentsResult, invoiceItemsResult] = await Promise.all([
        client.models.Customer.list(),
        client.models.Product.list(),
        client.models.Invoice.list(),
        client.models.Payment.list(),
        client.models.InvoiceItem.list()
      ]);

      // Combine invoices with their items
      const invoices = (invoicesResult.data || []).filter(inv => inv && inv.customerId && inv.invoiceNumber);
      const invoiceItems = invoiceItemsResult.data || [];
      
      // Group items by invoice ID
      const itemsByInvoiceId = {};
      invoiceItems.forEach(item => {
        if (item && item.invoiceId) {
          if (!itemsByInvoiceId[item.invoiceId]) {
            itemsByInvoiceId[item.invoiceId] = [];
          }
          itemsByInvoiceId[item.invoiceId].push(item);
        }
      });
      
      // Attach items to invoices
      const invoicesWithItems = invoices.map(invoice => ({
        ...invoice,
        items: itemsByInvoiceId[invoice.id] || []
      }));

      dispatch({ type: 'SET_CUSTOMERS', payload: (customersResult.data || []).filter(c => c && c.id && c.name) });
      dispatch({ type: 'SET_PRODUCTS', payload: (productsResult.data || []).filter(p => p && p.name) });
      dispatch({ type: 'SET_INVOICES', payload: invoicesWithItems });
      dispatch({ type: 'SET_PAYMENTS', payload: (paymentsResult.data || []).filter(pay => pay && pay.invoiceId) });
      
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
          dispatch({ type: 'SET_LOADING', payload: true });
          console.log('Creating product:', productData);
          
          const result = await client.models.Product.create(productData);
          console.log('Product creation result:', result);
          
          dispatch({ type: 'ADD_PRODUCT', payload: result.data });
          dispatch({ type: 'SET_LOADING', payload: false });
          return result.data;
        } catch (error) {
          console.error('Product creation error:', error);
          dispatch({ type: 'SET_ERROR', payload: error.message });
          dispatch({ type: 'SET_LOADING', payload: false });
          throw error;
        }
      },
      
      update: async (id, productData) => {
        try {
          dispatch({ type: 'SET_LOADING', payload: true });
          console.log('Updating product:', id, productData);
          
          const result = await client.models.Product.update({ id, ...productData });
          console.log('Product update result:', result);
          
          dispatch({ type: 'UPDATE_PRODUCT', payload: result.data });
          dispatch({ type: 'SET_LOADING', payload: false });
          return result.data;
        } catch (error) {
          console.error('Product update error:', error);
          dispatch({ type: 'SET_ERROR', payload: error.message });
          dispatch({ type: 'SET_LOADING', payload: false });
          throw error;
        }
      },
      
      delete: async (id) => {
        try {
          dispatch({ type: 'SET_LOADING', payload: true });
          console.log('Deleting product:', id);
          
          await client.models.Product.delete({ id });
          dispatch({ type: 'DELETE_PRODUCT', payload: id });
          dispatch({ type: 'SET_LOADING', payload: false });
        } catch (error) {
          console.error('Product delete error:', error);
          dispatch({ type: 'SET_ERROR', payload: error.message });
          dispatch({ type: 'SET_LOADING', payload: false });
          throw error;
        }
      }
    },

    // Invoice operations
    invoices: {
      create: async (invoiceData, items = []) => {
        try {
          dispatch({ type: 'SET_LOADING', payload: true });
          console.log('Creating invoice:', invoiceData);
          
          // Create the invoice first
          const invoiceResult = await client.models.Invoice.create(invoiceData);
          console.log('Invoice created:', invoiceResult);
          
          if (!invoiceResult.data) {
            throw new Error('Failed to create invoice');
          }

          const createdInvoice = invoiceResult.data;
          
          // Create invoice items if provided
          const createdItems = [];
          if (items && items.length > 0) {
            console.log('Creating invoice items:', items);
            
            for (const item of items) {
              const itemData = {
                invoiceId: createdInvoice.id,
                productId: item.productId || null,
                description: item.description || '',
                quantity: parseFloat(item.quantity) || 1,
                rate: parseFloat(item.rate) || 0,
                amount: (parseFloat(item.quantity) || 1) * (parseFloat(item.rate) || 0),
                taxRate: 0
              };
              
              const itemResult = await client.models.InvoiceItem.create(itemData);
              if (itemResult.data) {
                createdItems.push(itemResult.data);
              }
            }
          }
          
          // Combine invoice with items for state
          const completeInvoice = {
            ...createdInvoice,
            items: createdItems
          };
          
          dispatch({ type: 'ADD_INVOICE', payload: completeInvoice });
          dispatch({ type: 'SET_LOADING', payload: false });
          return completeInvoice;
        } catch (error) {
          console.error('Invoice creation error:', error);
          dispatch({ type: 'SET_ERROR', payload: error.message });
          dispatch({ type: 'SET_LOADING', payload: false });
          throw error;
        }
      },
      
      update: async (id, invoiceData, items = []) => {
        try {
          dispatch({ type: 'SET_LOADING', payload: true });
          console.log('Updating invoice:', id, invoiceData);
          
          // Update the invoice
          const invoiceResult = await client.models.Invoice.update({ id, ...invoiceData });
          console.log('Invoice updated:', invoiceResult);
          
          if (!invoiceResult.data) {
            throw new Error('Failed to update invoice');
          }

          // Handle items update (delete existing and recreate)
          // Note: This is a simplified approach. In production, you might want more sophisticated item management
          const updatedItems = [];
          if (items && items.length > 0) {
            console.log('Updating invoice items:', items);
            
            // Delete existing items (simplified approach)
            try {
              const existingItems = await client.models.InvoiceItem.list({
                filter: { invoiceId: { eq: id } }
              });
              
              for (const existingItem of existingItems.data || []) {
                await client.models.InvoiceItem.delete({ id: existingItem.id });
              }
            } catch (deleteError) {
              console.warn('Error deleting existing items:', deleteError);
            }
            
            // Create new items
            for (const item of items) {
              const itemData = {
                invoiceId: id,
                productId: item.productId || null,
                description: item.description || '',
                quantity: parseFloat(item.quantity) || 1,
                rate: parseFloat(item.rate) || 0,
                amount: (parseFloat(item.quantity) || 1) * (parseFloat(item.rate) || 0),
                taxRate: 0
              };
              
              const itemResult = await client.models.InvoiceItem.create(itemData);
              if (itemResult.data) {
                updatedItems.push(itemResult.data);
              }
            }
          }
          
          // Combine invoice with items for state
          const completeInvoice = {
            ...invoiceResult.data,
            items: updatedItems
          };
          
          dispatch({ type: 'UPDATE_INVOICE', payload: completeInvoice });
          dispatch({ type: 'SET_LOADING', payload: false });
          return completeInvoice;
        } catch (error) {
          console.error('Invoice update error:', error);
          dispatch({ type: 'SET_ERROR', payload: error.message });
          dispatch({ type: 'SET_LOADING', payload: false });
          throw error;
        }
      },
      
      delete: async (id) => {
        try {
          dispatch({ type: 'SET_LOADING', payload: true });
          console.log('Deleting invoice:', id);
          
          // Delete invoice items first
          try {
            const existingItems = await client.models.InvoiceItem.list({
              filter: { invoiceId: { eq: id } }
            });
            
            for (const item of existingItems.data || []) {
              await client.models.InvoiceItem.delete({ id: item.id });
            }
          } catch (deleteItemsError) {
            console.warn('Error deleting invoice items:', deleteItemsError);
          }
          
          // Delete the invoice
          await client.models.Invoice.delete({ id });
          dispatch({ type: 'DELETE_INVOICE', payload: id });
          dispatch({ type: 'SET_LOADING', payload: false });
        } catch (error) {
          console.error('Invoice delete error:', error);
          dispatch({ type: 'SET_ERROR', payload: error.message });
          dispatch({ type: 'SET_LOADING', payload: false });
          throw error;
        }
      },

      // Send invoice via email
      send: async (invoiceId, payload = {}) => {
        try {
          const invoice = state.invoices.find(inv => inv && inv.id === invoiceId);
          if (!invoice) throw new Error('Invoice not found');
          const customer = state.customers.find(c => c && c.id === invoice.customerId);
          if (!customer || !customer.email) throw new Error('Customer email not found');

          const fromEmail = process.env.REACT_APP_FROM_EMAIL || 'billing@yourdomain.com';
          const subject = `Invoice #${invoice.invoiceNumber} from Netspire`;
          const html = `
            <p>Dear ${customer.name || 'Customer'},</p>
            <p>Please find your invoice details below:</p>
            <ul>
              <li>Invoice Number: ${invoice.invoiceNumber}</li>
              <li>Issue Date: ${invoice.issueDate}</li>
              <li>Due Date: ${invoice.dueDate}</li>
              <li>Amount Due: $${Number(invoice.total || 0).toFixed(2)}</li>
            </ul>
            <p><strong>Your invoice PDF is attached to this email.</strong></p>
            ${invoice.pdfUrl ? `<p>You can also download your invoice PDF here: <a href="${invoice.pdfUrl}">Download PDF</a></p>` : ''}
            <p>Thank you for your business.</p>
          `;

          const response = await fetch(getEmailFunctionUrl(), {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              from: fromEmail,
              to: customer.email,
              subject,
              html,
              generatePdf: true,
              invoice: {
                id: invoice.id,
                invoiceNumber: invoice.invoiceNumber,
                issueDate: invoice.issueDate,
                dueDate: invoice.dueDate,
                subtotal: invoice.subtotal || 0,
                taxAmount: invoice.taxAmount || 0,
                discountAmount: invoice.discountAmount || 0,
                total: invoice.total || 0,
                terms: invoice.terms,
                notes: invoice.notes,
                items: invoice.items || []
              },
              customer: {
                name: customer.name,
                email: customer.email,
                address: customer.address
              },
              ...payload, // allow overrides (e.g., custom subject/html)
            }),
          });

          if (!response.ok) {
            const text = await response.text();
            throw new Error(text || 'Email send failed');
          }

          const result = await client.models.Invoice.update({
            id: invoiceId,
            status: 'sent',
            sentAt: new Date().toISOString(),
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
          dispatch({ type: 'SET_LOADING', payload: true });
          console.log('Creating payment:', paymentData);
          
          // Ensure status is set (default to completed for manual entries)
          const enhancedPaymentData = {
            ...paymentData,
            status: paymentData.status || 'completed'
          };
          
          const result = await client.models.Payment.create(enhancedPaymentData);
          console.log('Payment created:', result);
          
          if (!result.data) {
            throw new Error('Failed to create payment');
          }
          
          dispatch({ type: 'ADD_PAYMENT', payload: result.data });
          
          // Update invoice status if fully paid
          const invoice = state.invoices.find(inv => inv.id === paymentData.invoiceId);
          if (invoice) {
            const totalPaid = state.payments
              .filter(p => p && p.invoiceId === paymentData.invoiceId)
              .reduce((sum, p) => sum + (p.amount || 0), 0) + (paymentData.amount || 0);
            
            if (totalPaid >= invoice.total) {
              api.invoices.update(invoice.id, { status: 'paid' });
            }
          }
          
          dispatch({ type: 'SET_LOADING', payload: false });
          return result.data;
        } catch (error) {
          console.error('Payment creation error:', error);
          dispatch({ type: 'SET_ERROR', payload: error.message });
          dispatch({ type: 'SET_LOADING', payload: false });
          throw error;
        }
      },
      
      update: async (id, paymentData) => {
        try {
          dispatch({ type: 'SET_LOADING', payload: true });
          console.log('Updating payment:', id, paymentData);
          
          const result = await client.models.Payment.update({ id, ...paymentData });
          console.log('Payment updated:', result);
          
          dispatch({ type: 'UPDATE_PAYMENT', payload: result.data });
          dispatch({ type: 'SET_LOADING', payload: false });
          return result.data;
        } catch (error) {
          console.error('Payment update error:', error);
          dispatch({ type: 'SET_ERROR', payload: error.message });
          dispatch({ type: 'SET_LOADING', payload: false });
          throw error;
        }
      },
      
      delete: async (id) => {
        try {
          dispatch({ type: 'SET_LOADING', payload: true });
          console.log('Deleting payment:', id);
          
          await client.models.Payment.delete({ id });
          dispatch({ type: 'DELETE_PAYMENT', payload: id });
          dispatch({ type: 'SET_LOADING', payload: false });
        } catch (error) {
          console.error('Payment delete error:', error);
          dispatch({ type: 'SET_ERROR', payload: error.message });
          dispatch({ type: 'SET_LOADING', payload: false });
          throw error;
        }
      }
    },

    // Utility functions
    refresh: loadAllData,
    clearError: () => dispatch({ type: 'SET_ERROR', payload: null })
  };

  function getEmailFunctionUrl() {
    // Prefer env override, then Amplify outputs if present
    const envUrl = process.env.REACT_APP_EMAIL_FUNCTION_URL;
    const outputsUrl = outputs?.custom?.sendEmailFunctionUrl || outputs?.functions?.sendEmail?.url;
    const finalUrl = envUrl || outputsUrl;
    if (!finalUrl) {
      throw new Error('Email function URL is not configured. Set REACT_APP_EMAIL_FUNCTION_URL in your .env to the Lambda Function URL, then restart the dev server.');
    }
    return finalUrl;
  }

  // Real-time subscriptions (disabled for SimpleAuth compatibility)
  // TODO: Re-enable when using full Amplify authentication
  /*
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
  */

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