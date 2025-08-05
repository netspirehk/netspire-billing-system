import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

// Fixed credentials
const FIXED_CREDENTIALS = {
  username: 'admin',
  password: 'password123'
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Check if user is already logged in on page load
  useEffect(() => {
    const savedAuth = localStorage.getItem('netspire_auth');
    if (savedAuth) {
      const authData = JSON.parse(savedAuth);
      setIsAuthenticated(true);
      setUser(authData.user);
    }
    setLoading(false);
  }, []);

  const login = (username, password) => {
    if (username === FIXED_CREDENTIALS.username && password === FIXED_CREDENTIALS.password) {
      const userData = {
        username: username,
        name: 'Administrator',
        role: 'admin'
      };
      
      setIsAuthenticated(true);
      setUser(userData);
      
      // Save to localStorage for persistence
      localStorage.setItem('netspire_auth', JSON.stringify({
        isAuthenticated: true,
        user: userData
      }));
      
      return { success: true };
    } else {
      return { success: false, error: 'Invalid username or password' };
    }
  };

  const logout = () => {
    setIsAuthenticated(false);
    setUser(null);
    localStorage.removeItem('netspire_auth');
  };

  const value = {
    isAuthenticated,
    user,
    login,
    logout,
    loading
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};