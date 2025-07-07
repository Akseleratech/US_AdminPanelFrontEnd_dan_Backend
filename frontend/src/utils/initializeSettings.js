import { doc, setDoc, getDoc } from 'firebase/firestore';
import { db } from '../config/firebase';

/**
 * Initialize settings document in Firestore if it doesn't exist
 */
export const initializeSettings = async () => {
  try {
    const settingsRef = doc(db, 'settings', 'global');
    const settingsDoc = await getDoc(settingsRef);
    
    if (!settingsDoc.exists()) {
      console.log('Initializing settings document...');
      await setDoc(settingsRef, {
        taxRate: 11, // Default 11% PPN
        updatedAt: new Date(),
        createdAt: new Date(),
        description: 'Global system settings for UnionSpace CRM'
      });
      console.log('Settings document initialized successfully');
    } else {
      console.log('Settings document already exists');
    }
  } catch (error) {
    console.error('Error initializing settings:', error);
  }
};

// Auto-initialize on import in development
if (import.meta.env.MODE === 'development') {
  initializeSettings();
} 