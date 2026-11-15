import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('user');
    return saved ? JSON.parse(saved) : null;
  });
  const [token, setToken] = useState(() => localStorage.getItem('token') || null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCurrentUser = async () => {
      if (token) {
        try {
          const res = await api.get('/auth/me');
          if (res.data?.success && res.data.data) {
            setUser(res.data.data);
            localStorage.setItem('user', JSON.stringify(res.data.data));
          }
        } catch (err) {
          console.warn('Could not refresh profile from server, using cached session:', err.message);
          const cachedUser = localStorage.getItem('user');
          if (cachedUser) {
            try {
              setUser(JSON.parse(cachedUser));
            } catch (_) {
              logout();
            }
          } else {
            logout();
          }
        }
      }
      setLoading(false);
    };

    fetchCurrentUser();
  }, [token]);

  const login = async (email, password) => {
    const res = await api.post('/auth/login', { email, password });
    if (res.data?.success) {
      const { user: userData, accessToken } = res.data.data;
      setUser(userData);
      setToken(accessToken);
      localStorage.setItem('token', accessToken);
      localStorage.setItem('user', JSON.stringify(userData));
      return userData;
    }
    throw new Error(res.data?.message || 'Login failed');
  };

  const loginWithGoogle = async (credential, demoUser = null, oauthData = null) => {
    const res = await api.post('/auth/google', { credential, demoUser, oauthData });
    if (res.data?.success) {
      const { user: userData, accessToken } = res.data.data;
      if (oauthData?.accessToken && !userData.googleAccessToken) {
        userData.googleAccessToken = oauthData.accessToken;
      }
      setUser(userData);
      setToken(accessToken);
      localStorage.setItem('token', accessToken);
      localStorage.setItem('user', JSON.stringify(userData));
      if (oauthData?.accessToken) {
        localStorage.setItem('google_access_token', oauthData.accessToken);
      }
      return userData;
    }
    throw new Error(res.data?.message || 'Google sign-in failed');
  };

  const connectGoogle = async (tokenData) => {
    const res = await api.post('/auth/google/connect', tokenData);
    if (res.data?.success) {
      updateUserState(res.data.data);
      if (tokenData?.accessToken) {
        localStorage.setItem('google_access_token', tokenData.accessToken);
      }
      return res.data.data;
    }
    throw new Error(res.data?.message || 'Failed to connect Google account');
  };

  const register = async (email, password, role = 'USER') => {
    const res = await api.post('/auth/register', { email, password, role });
    return res.data;
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('google_access_token');
    api.post('/auth/logout').catch(() => {});
  };

  const updateUserState = (updatedFields) => {
    setUser((prev) => {
      const merged = { ...prev, ...updatedFields };
      localStorage.setItem('user', JSON.stringify(merged));
      return merged;
    });
  };

  const isAdmin = user?.role === 'ADMIN';
  const isEmployee = user?.role === 'EMPLOYEE';

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        isAuthenticated: !!token && !!user,
        isAdmin,
        isEmployee,
        login,
        loginWithGoogle,
        connectGoogle,
        register,
        logout,
        updateUserState,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};

