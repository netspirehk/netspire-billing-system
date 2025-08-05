import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Amplify } from 'aws-amplify';

// Import Amplify configuration following official Gen 2 documentation
// https://docs.amplify.aws/react/build-a-backend/data/set-up-data/
import outputs from './amplify_outputs.json';

console.log('🔍 Amplify outputs loaded:', {
  hasAuth: !!outputs.auth,
  hasData: !!outputs.data,
  dataUrl: outputs.data?.url,
  hasApiKey: !!outputs.data?.api_key
});

Amplify.configure(outputs);

// Verify configuration was applied
const appliedConfig = Amplify.getConfig();
console.log('✅ Amplify configured successfully');
console.log('🔗 GraphQL API URL:', outputs.data?.url);
console.log('🔑 API Key configured:', !!outputs.data?.api_key);
console.log('🔍 Applied config verification:', {
  hasAPI: !!appliedConfig.API,
  hasGraphQL: !!appliedConfig.API?.GraphQL,
  hasAuth: !!appliedConfig.Auth,
  keys: Object.keys(appliedConfig)
});

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