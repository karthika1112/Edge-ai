import React, { createContext, useContext, useState, useEffect } from 'react';
import { API_URL, WS_URL } from '../config/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(null);

  const decodeToken = (token) => {
    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
          return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
      }).join(''));
      return JSON.parse(jsonPayload);
    } catch (e) {
      return null;
    }
  };

  useEffect(() => {
    // Check local storage for active session on load
    const savedToken = localStorage.getItem('es_auth_token');
    if (savedToken) {
      setToken(savedToken);
      
      // Decode JWT token for quick extraction
      const decoded = decodeToken(savedToken);
      if (decoded && decoded.role) {
        const initialUserData = {
          email: decoded.sub,
          name: decoded.name || decoded.sub.split('@')[0].toUpperCase(),
          role: decoded.role,
          facility: 'Detroit Hub #4',
          dept: decoded.dept
        };
        setUser(initialUserData);
      } else {
        const savedUser = localStorage.getItem('es_user');
        if (savedUser) {
          setUser(JSON.parse(savedUser));
        }
      }

      // Fetch from /api/me to synchronize/refresh
      fetch(`${API_URL}/api/me`, {
        headers: { 'Authorization': `Bearer ${savedToken}` }
      })
      .then(res => {
        if (res.ok) return res.json();
        throw new Error('Session invalid');
      })
      .then(data => {
        const userData = {
          email: data.email,
          name: data.name,
          role: data.role,
          facility: 'Detroit Hub #4',
          dept: data.dept
        };
        setUser(userData);
        localStorage.setItem('es_user', JSON.stringify(userData));
        setLoading(false);
      })
      .catch(() => {
        setLoading(false);
      });
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (email, password) => {
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.detail || 'Invalid email or password.');
      }

      const userData = {
        email: data.user.email,
        name: data.user.name || email.split('@')[0].toUpperCase(),
        role: data.user.role,
        facility: 'Detroit Hub #4',
        dept: data.user.dept
      };

      localStorage.setItem('es_auth_token', data.access_token);
      localStorage.setItem('es_user', JSON.stringify(userData));
      
      setUser(userData);
      setToken(data.access_token);
      setLoading(false);
      return userData;
    } catch (err) {
      setLoading(false);
      throw err;
    }
  };

  const logout = () => {
    localStorage.removeItem('es_auth_token');
    localStorage.removeItem('es_user');
    setUser(null);
    setToken(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, logout }}>
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
