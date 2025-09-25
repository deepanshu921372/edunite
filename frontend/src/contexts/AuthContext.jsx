import React, { createContext, useContext, useState, useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth, signInWithGoogle, signOutUser } from '../services/firebase';
import { authAPI } from '../services/api';
import toast from 'react-hot-toast';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [initializing, setInitializing] = useState(true);

  // Load user profile from localStorage on initialization
  useEffect(() => {
    const storedUserProfile = localStorage.getItem('userProfile');
    if (storedUserProfile) {
      try {
        const parsedProfile = JSON.parse(storedUserProfile);
        setUserProfile(parsedProfile);
      } catch (error) {
        console.error('Error parsing stored user profile:', error);
        localStorage.removeItem('userProfile');
      }
    }
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setCurrentUser(firebaseUser);

      if (firebaseUser) {
        try {
          // Get Firebase ID token
          const token = await firebaseUser.getIdToken();
          localStorage.setItem('firebaseToken', token);

          // Send user data to backend and get profile
          const userData = {
            uid: firebaseUser.uid,
            email: firebaseUser.email,
            displayName: firebaseUser.displayName,
            photoURL: firebaseUser.photoURL,
          };

          const response = await authAPI.login(userData);
          setUserProfile(response.user);

          // Store user details in localStorage
          if (response.userForStorage) {
            localStorage.setItem('userProfile', JSON.stringify(response.userForStorage));
          }
        } catch (error) {
          console.error('Error fetching user profile:', error);

          // Handle pending approval case
          if (error.response?.status === 403 && error.response?.data?.userForStorage) {
            setUserProfile(error.response.data.user);
            localStorage.setItem('userProfile', JSON.stringify(error.response.data.userForStorage));
            toast.info(error.response.data.message || 'Account pending approval. You will receive an email when your account is verified.');
          } else if (error.response?.status !== 401) {
            toast.error('Error loading user profile');
          }
        }
      } else {
        localStorage.removeItem('firebaseToken');
        localStorage.removeItem('userProfile');
        setUserProfile(null);
      }

      setLoading(false);
      setInitializing(false);
    });

    return unsubscribe;
  }, []);

  const login = async () => {
    setLoading(true);
    try {
      const result = await signInWithGoogle();
      const token = await result.user.getIdToken();
      localStorage.setItem('firebaseToken', token);

      const userData = {
        uid: result.user.uid,
        email: result.user.email,
        displayName: result.user.displayName,
        photoURL: result.user.photoURL,
      };

      const response = await authAPI.login(userData);
      setUserProfile(response.user);

      // Store user details in localStorage
      if (response.userForStorage) {
        localStorage.setItem('userProfile', JSON.stringify(response.userForStorage));
      }

      toast.success(`Welcome, ${result.user.displayName}!`);
      return response.user;
    } catch (error) {
      console.error('Error signing in:', error);

      // Handle pending approval case
      if (error.response?.status === 403 && error.response?.data?.userForStorage) {
        setUserProfile(error.response.data.user);
        localStorage.setItem('userProfile', JSON.stringify(error.response.data.userForStorage));
        toast.info(error.response.data.message || 'Account pending approval. You will receive an email when your account is verified.');
        return error.response.data.user;
      } else {
        toast.error('Failed to sign in. Please try again.');
        throw error;
      }
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    setLoading(true);
    try {
      await signOutUser();
      localStorage.removeItem('firebaseToken');
      localStorage.removeItem('userProfile');
      setCurrentUser(null);
      setUserProfile(null);
      toast.success('Signed out successfully');
    } catch (error) {
      console.error('Error signing out:', error);
      toast.error('Error signing out');
    } finally {
      setLoading(false);
    }
  };

  const updateUserProfile = async (profileData) => {
    try {
      const response = await authAPI.updateProfile(profileData);
      setUserProfile(response.user);
      toast.success('Profile updated successfully');
      return response.user;
    } catch (error) {
      console.error('Error updating profile:', error);
      throw error;
    }
  };

  const refreshUserProfile = async () => {
    try {
      const response = await authAPI.getUserProfile();
      setUserProfile(response.user);

      // Update localStorage with fresh data
      if (response.userForStorage) {
        localStorage.setItem('userProfile', JSON.stringify(response.userForStorage));
      }

      return response.user;
    } catch (error) {
      console.error('Error refreshing profile:', error);
      throw error;
    }
  };

  const value = {
    currentUser,
    userProfile,
    loading,
    initializing,
    login,
    logout,
    updateUserProfile,
    refreshUserProfile,
  };

  return (
    <AuthContext.Provider value={value}>
      {!initializing && children}
    </AuthContext.Provider>
  );
};