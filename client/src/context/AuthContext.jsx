import React, { createContext, useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { signInWithPopup } from 'firebase/auth';
import { auth, googleProvider } from '../firebase';

const AuthContext = createContext(null);

export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Set default authorization header for Axios
  useEffect(() => {
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      localStorage.setItem('token', token);
    } else {
      delete axios.defaults.headers.common['Authorization'];
      localStorage.removeItem('token');
    }
  }, [token]);

  // Load user profile on mount if token exists
  useEffect(() => {
    const loadUser = async () => {
      if (!token) {
        setLoading(false);
        return;
      }
      try {
        const response = await axios.get(`${API_URL}/api/auth/profile`);
        setUser(response.data);
      } catch (err) {
        console.error('Failed to load user profile', err);
        // If token is invalid/expired
        setToken(null);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };
    loadUser();
  }, [token]);

  // Register User
  const register = async (name, email, password) => {
    setError(null);
    setLoading(true);
    try {
      const response = await axios.post(`${API_URL}/api/auth/register`, {
        name,
        email,
        password,
      });
      const { token: userToken, ...userData } = response.data;
      setToken(userToken);
      setUser(userData);
      return userData;
    } catch (err) {
      const errMsg = err.response?.data?.message || 'Registration failed';
      setError(errMsg);
      throw new Error(errMsg);
    } finally {
      setLoading(false);
    }
  };

  // Login User
  const login = async (email, password) => {
    setError(null);
    setLoading(true);
    try {
      const response = await axios.post(`${API_URL}/api/auth/login`, {
        email,
        password,
      });
      const { token: userToken, ...userData } = response.data;
      setToken(userToken);
      setUser(userData);
      return userData;
    } catch (err) {
      const errMsg = err.response?.data?.message || 'Login failed. Check your credentials.';
      setError(errMsg);
      throw new Error(errMsg);
    } finally {
      setLoading(false);
    }
  };

  // Update Profile
  const updateProfile = async (profileData) => {
    setError(null);
    setLoading(true);
    try {
      const response = await axios.put(`${API_URL}/api/auth/profile`, profileData);
      const { token: userToken, ...userData } = response.data;
      if (userToken) {
        setToken(userToken);
      }
      setUser(userData);
      return userData;
    } catch (err) {
      const errMsg = err.response?.data?.message || 'Failed to update profile';
      setError(errMsg);
      throw new Error(errMsg);
    } finally {
      setLoading(false);
    }
  };

  // Logout User
  const logout = () => {
    setToken(null);
    setUser(null);
    setError(null);
    localStorage.removeItem('token');
  };

  // Login with Google
  const loginWithGoogle = async () => {
    setError(null);
    setLoading(true);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const firebaseUser = result.user;

      const response = await axios.post(`${API_URL}/api/auth/google`, {
        name: firebaseUser.displayName,
        email: firebaseUser.email,
        googleId: firebaseUser.uid,
      });

      const { token: userToken, ...userData } = response.data;
      setToken(userToken);
      setUser(userData);
      return userData;
    } catch (err) {
      if (err.code === 'auth/popup-closed-by-user') {
        setLoading(false);
        return null;
      }
      if (err.code === 'auth/popup-blocked') {
        const errMsg = 'Popup blocked by browser. Please allow popups for this site in your browser settings/address bar.';
        setError(errMsg);
        throw new Error(errMsg);
      }
      const errMsg = err.response?.data?.message || err.message || 'Google authentication failed';
      setError(errMsg);
      throw new Error(errMsg);
    } finally {
      setLoading(false);
    }
  };

  const value = {
    user,
    token,
    loading,
    error,
    register,
    login,
    logout,
    updateProfile,
    setError,
    loginWithGoogle,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
