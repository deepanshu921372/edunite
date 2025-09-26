import React, { createContext, useContext, useState, useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth, signInWithGoogle, signOutUser } from '../services/firebase';
import { authAPI } from '../services/api';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

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
  const [pendingToastShown, setPendingToastShown] = useState(false);
  const [initializing, setInitializing] = useState(true);
  const [authProcessingRef] = useState({ current: false });
  const navigate = useNavigate();
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
      // Prevent multiple simultaneous calls using ref
      if (authProcessingRef.current) return;
      authProcessingRef.current = true;

      try {
        setCurrentUser(firebaseUser);

        if (firebaseUser) {
          // Check if we already have this user's profile stored
          const storedProfile = localStorage.getItem('userProfile');
          if (storedProfile) {
            try {
              const profile = JSON.parse(storedProfile);
              if (profile.firebaseUid === firebaseUser.uid) {
                // User profile exists in localStorage
                setUserProfile(profile);

                // If user is not approved, don't make API call and show pending message only once
                if (!profile.isApproved && !pendingToastShown) {
                  setPendingToastShown(true);
                  toast('Account pending approval. You will receive an email when your account is verified.', {
                    icon: 'ℹ️',
                    duration: 4000,
                  });
                }

                setLoading(false);
                setInitializing(false);
                return;
              }
            } catch (e) {
              // Invalid stored profile, remove it
              localStorage.removeItem('userProfile');
            }
          }

          try {
            // Get Firebase ID token
            const token = await firebaseUser.getIdToken();
            localStorage.setItem('firebaseToken', token);

            // Send user data to backend and get profile
            const userData = {
              uid: firebaseUser.uid,
              email: firebaseUser.email,
              displayName: firebaseUser.displayName,
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

              // Only show toast once per session
              if (!pendingToastShown) {
                setPendingToastShown(true);
                toast(error.response.data.message || 'Account pending approval. You will receive an email when your account is verified.', {
                  icon: 'ℹ️',
                  duration: 4000,
                });
              }
            } else if (error.response?.status !== 401) {
              toast.error('Error loading user profile');
            }
          }
        } else {
          localStorage.removeItem('firebaseToken');
          localStorage.removeItem('userProfile');
          setUserProfile(null);
          setPendingToastShown(false); // Reset when no user
        }

        setLoading(false);
        setInitializing(false);
      } finally {
        authProcessingRef.current = false;
      }
    });

    return unsubscribe;
  }, [pendingToastShown]);

  const login = async () => {
    // Prevent login if auth is already processing
    if (authProcessingRef.current) {
      return userProfile;
    }

    // Check if user is already pending approval - don't make API call
    if (userProfile && !userProfile.isApproved) {
      if (!pendingToastShown) {
        setPendingToastShown(true);
        toast('Account pending approval. You will receive an email when your account is verified.', {
          icon: 'ℹ️',
          duration: 4000,
        });
      }
      return userProfile;
    }

    // Check localStorage for existing pending user before making Google sign-in
    const storedProfile = localStorage.getItem('userProfile');
    if (storedProfile) {
      try {
        const profile = JSON.parse(storedProfile);
        if (profile && !profile.isApproved) {
          setUserProfile(profile);
          if (!pendingToastShown) {
            setPendingToastShown(true);
            toast('Account pending approval. You will receive an email when your account is verified.', {
              icon: 'ℹ️',
              duration: 4000,
            });
          }
          return profile;
        }
      } catch (e) {
        localStorage.removeItem('userProfile');
      }
    }

    setLoading(true);
    authProcessingRef.current = true;
    try {
      const result = await signInWithGoogle();
      const token = await result.user.getIdToken();
      localStorage.setItem('firebaseToken', token);

      const userData = {
        uid: result.user.uid,
        email: result.user.email,
        displayName: result.user.displayName,
      };

      const response = await authAPI.login(userData);
      setUserProfile(response.user);

      // Store user details in localStorage
      if (response.userForStorage) {
        localStorage.setItem('userProfile', JSON.stringify(response.userForStorage));
      }

      toast.success(`Welcome, ${result.user.displayName}!`);
      if(response.user.role === 'admin') {
        navigate('/admin');
        window.location.reload();
      }
      else if(response.user.role === 'teacher') {
        navigate('/teacher');
        window.location.reload();
      }
      else if(response.user.role === 'student') {
        navigate('/student');
        window.location.reload();
      }
      return response.user;
    } catch (error) {
      console.error('Error signing in:', error);

      // Handle pending approval case
      if (error.response?.status === 403 && error.response?.data?.userForStorage) {
        setUserProfile(error.response.data.user);
        localStorage.setItem('userProfile', JSON.stringify(error.response.data.userForStorage));

        // Only show toast once per session
        if (!pendingToastShown) {
          setPendingToastShown(true);
          toast(error.response.data.message || 'Account pending approval. You will receive an email when your account is verified.', {
            icon: 'ℹ️',
            duration: 4000,
          });
        }
        return error.response.data.user;
      } else {
        toast.error('Failed to sign in. Please try again.');
        throw error;
      }
    } finally {
      setLoading(false);
      authProcessingRef.current = false;
    }
  };

  const logout = async () => {
    setLoading(true);
    authProcessingRef.current = true;
    try {
      await signOutUser();
      localStorage.removeItem('firebaseToken');
      localStorage.removeItem('userProfile');
      setCurrentUser(null);
      setUserProfile(null);
      setPendingToastShown(false); // Reset toast flag
      toast.success('Signed out successfully');
    } catch (error) {
      console.error('Error signing out:', error);
      toast.error('Error signing out');
    } finally {
      setLoading(false);
      authProcessingRef.current = false;
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