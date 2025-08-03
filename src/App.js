import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Amplify } from 'aws-amplify';
import { Authenticator } from '@aws-amplify/ui-react';
import '@aws-amplify/ui-react/styles.css';

import Layout from './components/Layout/Layout';
import Dashboard from './pages/Dashboard';
import Customers from './pages/Customers';
import Invoices from './pages/Invoices';
import Products from './pages/Products';
import Payments from './pages/Payments';
import Reports from './pages/Reports';
import { BillingProvider } from './context/AmplifyBillingContext';
import outputs from './amplify_outputs.json';

// Configure Amplify
Amplify.configure(outputs);

// Custom Authenticator theme for your billing system
const theme = {
  name: 'netspire-theme',
  tokens: {
    colors: {
      brand: {
        primary: {
          10: '#f0f9ff',
          20: '#e0f2fe',
          40: '#0ea5e9',
          60: '#0284c7',
          80: '#0369a1',
          90: '#0c4a6e',
          100: '#082f49',
        },
      },
    },
    components: {
      authenticator: {
        router: {
          borderWidth: '0',
          backgroundColor: 'var(--amplify-colors-background-secondary)',
        },
        form: {
          padding: '2rem',
        },
      },
      button: {
        primary: {
          backgroundColor: 'var(--amplify-colors-brand-primary-80)',
        },
      },
      fieldcontrol: {
        borderRadius: '8px',
      },
    },
  },
};

// Custom form fields for sign up
const formFields = {
  signUp: {
    name: {
      label: 'Full Name',
      placeholder: 'Enter your full name',
      isRequired: true,
      order: 1,
    },
    email: {
      label: 'Email',
      placeholder: 'Enter your email address',
      isRequired: true,
      order: 2,
    },
    password: {
      label: 'Password',
      placeholder: 'Enter your password',
      isRequired: true,
      order: 3,
    },
    confirm_password: {
      label: 'Confirm Password',
      placeholder: 'Confirm your password',
      isRequired: true,
      order: 4,
    },
  },
};

function App() {
  return (
    <Authenticator theme={theme} formFields={formFields}>
      {({ signOut, user }) => (
        <BillingProvider>
          <Router>
            <Layout signOut={signOut} user={user}>
              <Routes>
                <Route path="/" element={<Dashboard />} />
                <Route path="/customers" element={<Customers />} />
                <Route path="/invoices" element={<Invoices />} />
                <Route path="/products" element={<Products />} />
                <Route path="/payments" element={<Payments />} />
                <Route path="/reports" element={<Reports />} />
              </Routes>
            </Layout>
          </Router>
        </BillingProvider>
      )}
    </Authenticator>
  );
}

export default App;