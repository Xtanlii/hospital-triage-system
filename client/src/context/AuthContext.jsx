import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authService, normalizeRole } from '../services/authService';
import { getToken } from '../services/apiClient';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  // Initialize user from localStorage if token and user data exist, otherwise start unauthenticated
  const [currentUser, setCurrentUser] = useState(() => {
    const token = getToken();
    const saved = localStorage.getItem('hospital_current_user');
    if (token && saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed?.role) {
          parsed.role = normalizeRole(parsed.role);
        }
        return parsed;
      } catch (e) {
        // Fallback to unauthenticated
      }
    }
    return null;
  });

  const [isLoading, setIsLoading] = useState(true);

  // Verify session on mount if token is present
  useEffect(() => {
    let isMounted = true;
    const verifySession = async () => {
      const token = getToken();
      if (!token) {
        if (isMounted) {
          setCurrentUser(null);
          setIsLoading(false);
        }
        return;
      }

      try {
        const user = await authService.getMe();
        if (isMounted && user) {
          setCurrentUser(user);
        }
      } catch (err) {
        console.warn('Session verification failed, logging out:', err.message);
        if (isMounted) {
          authService.logout();
          setCurrentUser(null);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    verifySession();
    return () => { isMounted = false; };
  }, []);

  // Sync currentUser changes to localStorage
  useEffect(() => {
    if (currentUser) {
      localStorage.setItem('hospital_current_user', JSON.stringify(currentUser));
    } else {
      localStorage.removeItem('hospital_current_user');
    }
  }, [currentUser]);

  const login = async (username, password) => {
    const result = await authService.login(username, password);
    if (result.success && result.user) {
      setCurrentUser(result.user);
    }
    return result;
  };

  const logout = useCallback(() => {
    authService.logout();
    setCurrentUser(null);
  }, []);

  const updateCurrentUser = (fields) => {
    setCurrentUser(prev => {
      if (!prev) return null;
      const updated = { ...prev, ...fields };
      if (fields.role) {
        updated.role = normalizeRole(fields.role);
      }
      return updated;
    });
  };

  return (
    <AuthContext.Provider value={{
      currentUser,
      isAuthenticated: Boolean(currentUser),
      role: currentUser?.role || null,
      isLoading,
      login,
      logout,
      updateCurrentUser
    }}>
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

export default AuthContext;
