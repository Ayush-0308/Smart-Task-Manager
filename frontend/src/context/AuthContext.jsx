/**
 * Auth Context - Global authentication state
 * Stores user info and JWT token in localStorage
 */
import { createContext, useContext, useState, useEffect } from 'react';
import { getMe } from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // On app load, check if token exists and fetch user profile
  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem('token');
      const savedUser = localStorage.getItem('user');

      if (token && savedUser) {
        try {
          setUser(JSON.parse(savedUser));
          // Optionally verify token with backend
          const res = await getMe();
          const userData = {
            ...res.data.data,
            onboarding_completed: !!res.data.data.onboarding_completed,
          };
          setUser(userData);
          localStorage.setItem('user', JSON.stringify(userData));
        } catch {
          logout();
        }
      }
      setLoading(false);
    };

    initAuth();
  }, []);

  const login = (userData, token) => {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(userData));
    setUser(userData);
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  };

  const isAuthenticated = !!user && !!localStorage.getItem('token');

  const setUserState = (userData) => {
    setUser(userData);
    if (userData) localStorage.setItem('user', JSON.stringify(userData));
  };

  return (
    <AuthContext.Provider
      value={{ user, loading, login, logout, isAuthenticated, setUser: setUserState }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
