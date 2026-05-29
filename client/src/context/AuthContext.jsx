import { createContext, useContext, useState, useCallback } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser]   = useState(() => {
    const stored = localStorage.getItem('user');
    return stored ? JSON.parse(stored) : null;
  });
  const [token, setToken] = useState(() => localStorage.getItem('token') || null);
  const [loading, setLoading] = useState(false);
  const [error, setError]   = useState(null);

  const persist = (userData, tokenValue) => {
    localStorage.setItem('user',  JSON.stringify(userData));
    localStorage.setItem('token', tokenValue);
    setUser(userData);
    setToken(tokenValue);
  };

  const clearAuth = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    setUser(null);
    setToken(null);
  };

  const register = useCallback(async (name, email, password) => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await api.post('/auth/register', { name, email, password });
      if (data.success) {
        persist(
          { _id: data.data._id, name: data.data.name, email: data.data.email, createdAt: data.data.createdAt },
          data.data.token
        );
        return { success: true };
      }
      setError(data.message || 'Registration failed');
      return { success: false, message: data.message };
    } catch (err) {
      const message = err.response?.data?.message || 'Registration failed';
      setError(message);
      return { success: false, message };
    } finally {
      setLoading(false);
    }
  }, []);

  const login = useCallback(async (email, password) => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await api.post('/auth/login', { email, password });
      if (data.success) {
        persist(
          { _id: data.data._id, name: data.data.name, email: data.data.email, createdAt: data.data.createdAt },
          data.data.token
        );
        return { success: true };
      }
      setError(data.message || 'Login failed');
      return { success: false, message: data.message };
    } catch (err) {
      const message = err.response?.data?.message || 'Invalid credentials';
      setError(message);
      return { success: false, message };
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(() => {
    clearAuth();
  }, []);

  return (
    <AuthContext.Provider value={{ user, token, loading, error, login, logout, register, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
};

export default AuthContext;
