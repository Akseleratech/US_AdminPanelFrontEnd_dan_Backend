import { createContext, useContext, useEffect, useState } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../config/firebase';

const TaxRateContext = createContext(11);

export const useTaxRate = () => useContext(TaxRateContext);

export function TaxRateProvider({ children }) {
  const [taxRate, setTaxRate] = useState(11);

  useEffect(() => {
    const unsub = onSnapshot(doc(db, 'settings', 'global'), snap => {
      if (snap.exists()) {
        const data = snap.data();
        setTaxRate(data.taxRate || 11);
      }
    }, (error) => {
      console.error('Error listening to tax rate:', error);
      // Keep default value on error
    });
    
    return unsub;
  }, []);

  return (
    <TaxRateContext.Provider value={taxRate}>
      {children}
    </TaxRateContext.Provider>
  );
} 