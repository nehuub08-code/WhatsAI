import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../api/client';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [admin, setAdmin] = useState(() => {
    const saved = localStorage.getItem('whatsai_admin');
    return saved ? JSON.parse(saved) : null;
  });
  const [token, setToken] = useState(() => localStorage.getItem('whatsai_token') || null);
  const [loading, setLoading] = useState(true);
  const [autoReplyEnabled, setAutoReplyEnabled] = useState(true);
  const [simulatorOpen, setSimulatorOpen] = useState(false);

  useEffect(() => {
    const verifySession = async () => {
      if (token) {
        try {
          const res = await api.get('/api/auth/me');
          setAdmin(res.data);
          localStorage.setItem('whatsai_admin', JSON.stringify(res.data));
          
          // Also fetch auto-reply state
          const settingsRes = await api.get('/api/settings');
          setAutoReplyEnabled(settingsRes.data.auto_reply);
        } catch (err) {
          console.error("Session verification failed", err);
          logout();
        }
      }
      setLoading(false);
    };

    verifySession();
  }, [token]);

  const login = async (username, password) => {
    const res = await api.post('/api/auth/login', { username, password });
    const { access_token, admin: adminData } = res.data;
    localStorage.setItem('whatsai_token', access_token);
    localStorage.setItem('whatsai_admin', JSON.stringify(adminData));
    setToken(access_token);
    setAdmin(adminData);
    return adminData;
  };

  const logout = () => {
    localStorage.removeItem('whatsai_token');
    localStorage.removeItem('whatsai_admin');
    setToken(null);
    setAdmin(null);
  };

  const toggleAutoReply = async (newState) => {
    try {
      setAutoReplyEnabled(newState);
      await api.put('/api/settings', { auto_reply: newState });
    } catch (err) {
      console.error("Failed to toggle auto-reply", err);
      // Revert on error
      setAutoReplyEnabled(!newState);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        admin,
        token,
        loading,
        login,
        logout,
        autoReplyEnabled,
        toggleAutoReply,
        simulatorOpen,
        setSimulatorOpen
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
