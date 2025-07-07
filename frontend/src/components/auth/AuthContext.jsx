import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut as firebaseSignOut,
  onAuthStateChanged,
  sendPasswordResetEmail,
  updateProfile
} from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../../config/firebase.jsx';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// DEVELOPMENT FLAG: Set to true to bypass login and use a mock user
const BYPASS_AUTH_FOR_DEVELOPMENT = false;

const mockUser = {
  uid: 'dev-user-123',
  email: 'dev@unionspace.com',
  displayName: 'Dev User',
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  const signup = async (email, password, displayName) => {
    try {
      const result = await createUserWithEmailAndPassword(auth, email, password);
      if (displayName) {
        await updateProfile(result.user, { displayName });
      }
      return result;
    } catch (error) {
      throw error;
    }
  };

  const login = async (email, password) => {
    try {
      return await signInWithEmailAndPassword(auth, email, password);
    } catch (error) {
      throw error;
    }
  };

  const logout = async () => {
    if (BYPASS_AUTH_FOR_DEVELOPMENT) {
      // In dev mode, "logout" will just reload to the "logged-in" state
      setUser(null); 
      setIsAdmin(false);
      window.location.reload();
      return;
    }
    try {
      await firebaseSignOut(auth);
      setIsAdmin(false);
      // User state will be updated by onAuthStateChanged listener
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  const resetPassword = async (email) => {
    try {
      return await sendPasswordResetEmail(auth, email);
    } catch (error) {
      throw error;
    }
  };

  // Check if user is admin by looking up in Firestore
  const checkAdminStatus = async (user) => {
    if (!user) {
      setIsAdmin(false);
      return false;
    }
    
    try {
      const adminDoc = await getDoc(doc(db, 'admins', user.uid));
      const adminStatus = adminDoc.exists() && adminDoc.data()?.role === 'admin';
      setIsAdmin(adminStatus);
      return adminStatus;
    } catch (error) {
      console.error('Error checking admin status:', error);
      setIsAdmin(false);
      return false;
    }
  };

  useEffect(() => {
    if (BYPASS_AUTH_FOR_DEVELOPMENT) {
      setUser(mockUser);
      setIsAdmin(true); // Mock user is always admin in dev mode
      setLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        await checkAdminStatus(currentUser);
      } else {
        setIsAdmin(false);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const value = {
    user,
    loading,
    isAdmin,
    signup,
    login,
    logout,
    resetPassword,
    checkAdminStatus
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}; 