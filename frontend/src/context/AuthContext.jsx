import React, { createContext, useState, useEffect, useContext } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token') || null);
  const [loading, setLoading] = useState(true);

  // Validate token and fetch current user profile on load
  useEffect(() => {
    const initAuth = async () => {
      if (token) {
        try {
          const res = await api.get('/auth/me');
          setUser(res.data);
        } catch (error) {
          console.error('Sessão expirada ou token inválido');
          logout();
        }
      }
      setLoading(false);
    };
    initAuth();
  }, [token]);

  const login = async (email, password) => {
    const res = await api.post('/auth/login', { email, password });
    const { token: receivedToken, user: loggedUser } = res.data;
    
    localStorage.setItem('token', receivedToken);
    setToken(receivedToken);
    setUser(loggedUser);
    return loggedUser;
  };

  const registerParent = async (name, email, password) => {
    const res = await api.post('/auth/register', { name, email, password });
    const { token: receivedToken, user: loggedUser } = res.data;
    
    localStorage.setItem('token', receivedToken);
    setToken(receivedToken);
    setUser(loggedUser);
    return loggedUser;
  };

  const logout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
  };

  const refreshUser = async () => {
    try {
      const res = await api.get('/auth/me');
      setUser(res.data);
      return res.data;
    } catch (error) {
      console.error('Erro ao atualizar dados do usuário:', error);
    }
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, registerParent, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider');
  }
  return context;
};
