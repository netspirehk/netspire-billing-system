import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Amplify } from 'aws-amplify';

// Import Amplify configuration - MUST be done before any other Amplify imports
try {
  // Try multiple possible locations for the amplify_outputs.json file
  let outputs;
  try {
    outputs = require('./amplify_outputs.json');
  } catch {
    try {
      outputs = require('../amplify_outputs.json');
    } catch {
      outputs = require('./aws-exports.js').default;
    }
  }
  Amplify.configure(outputs);
  console.log('✅ Amplify configured successfully');
} catch (error) {
  console.error('❌ Failed to configure Amplify:', error);
  console.warn('Please ensure amplify_outputs.json is in the src/ directory or project root');
}

import Layout from './components/Layout/Layout';
import Login from './components/Login/Login';
import Dashboard from './pages/Dashboard';
import Customers from './pages/Customers';
import Invoices from './pages/Invoices';
import Products from './pages/Products';
import Payments from './pages/Payments';
import Reports from './pages/Reports';
import { BillingProvider } from './context/AmplifyBillingContext';
import { AuthProvider, useAuth } from './context/SimpleAuthContext';

// Main App component with authentication
const AppContent = () => {
  const { isAuthenticated, user, logout, loading } = useAuth();

  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        fontSize: '18px'
      }}>
        Loading...
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Login />;
  }

  return (
    <BillingProvider>
      <Router>
        <Layout user={user} onLogout={logout}>
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
  );
};

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;