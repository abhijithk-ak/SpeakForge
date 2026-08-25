// AuthContext makes the current user and auth functions
// available to any component in the app without prop drilling.

import { createContext, useContext, useState, useEffect } from 'react';
import { loginUser, registerUser, getCurrentUser, logoutUser } from '../services/authService';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true); // true while checking existing session

  // On app load, check if there's a saved token and fetch the user
  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem('speakforge_token');
      if (!token) {
        setIsLoading(false);
        return;
      }

      try {
        const { user } = await getCurrentUser();
        setUser(user);
      } catch {
        // Token is invalid or expired — clear it
        localStorage.removeItem('speakforge_token');
        localStorage.removeItem('speakforge_user');
      } finally {
        setIsLoading(false);
      }
    };

    initAuth();
  }, []);

  const login = async (email, password) => {
    const { user, token } = await loginUser(email, password);
    localStorage.setItem('speakforge_token', token);
    setUser(user);
    return user;
  };

  const register = async (email, password) => {
    const { user, token } = await registerUser(email, password);
    localStorage.setItem('speakforge_token', token);
    setUser(user);
    return user;
  };

  const logout = async () => {
    try { await logoutUser(); } catch { /* ignore */ }
    localStorage.removeItem('speakforge_token');
    localStorage.removeItem('speakforge_user');
    setUser(null);
  };

  const updateUser = (updates) => {
    setUser(prev => prev ? { ...prev, ...updates } : prev);
  };

  const isAuthenticated = !!user;

  return (
    <AuthContext.Provider value={{
      user, isAuthenticated, isLoading,
      login, register, logout, updateUser
    }}>
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook so components can call useAuth() instead of useContext(AuthContext)
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used inside AuthProvider');
  return context;
};

export default AuthContext;
