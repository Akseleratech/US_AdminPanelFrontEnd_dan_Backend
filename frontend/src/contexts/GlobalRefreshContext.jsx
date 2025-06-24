import React, { createContext, useContext, useState, useCallback } from 'react';

// Context untuk global refresh state management
const GlobalRefreshContext = createContext();

// Custom hook untuk menggunakan context
export const useGlobalRefresh = () => {
  const context = useContext(GlobalRefreshContext);
  if (!context) {
    throw new Error('useGlobalRefresh must be used within a GlobalRefreshProvider');
  }
  return context;
};

// Provider component
export const GlobalRefreshProvider = ({ children }) => {
  const [refreshTriggers, setRefreshTriggers] = useState({
    cities: 0,
    spaces: 0,
    services: 0,
    orders: 0
  });

  // Generic refresh trigger untuk semua components
  const triggerRefresh = useCallback((componentNames) => {
    const names = Array.isArray(componentNames) ? componentNames : [componentNames];
    
    setRefreshTriggers(prev => {
      const newTriggers = { ...prev };
      names.forEach(name => {
        if (newTriggers.hasOwnProperty(name)) {
          newTriggers[name] = prev[name] + 1;
          console.log(`🔄 Global refresh triggered for: ${name} (count: ${newTriggers[name]})`);
        }
      });
      return newTriggers;
    });
  }, []);

  // Specific refresh functions untuk convenience
  const refreshCities = useCallback(() => {
    triggerRefresh('cities');
  }, [triggerRefresh]);

  const refreshSpaces = useCallback(() => {
    triggerRefresh('spaces');
  }, [triggerRefresh]);

  const refreshServices = useCallback(() => {
    triggerRefresh('services');
  }, [triggerRefresh]);

  const refreshOrders = useCallback(() => {
    triggerRefresh('orders');
  }, [triggerRefresh]);

  // Cross-component refresh untuk related data
  const refreshRelatedToSpaces = useCallback(() => {
    triggerRefresh(['cities', 'spaces']); // Ketika space dibuat, refresh cities juga
  }, [triggerRefresh]);

  const refreshRelatedToCities = useCallback(() => {
    triggerRefresh(['cities', 'spaces']); // Ketika city diupdate, refresh spaces juga
  }, [triggerRefresh]);

  const value = {
    // Refresh triggers (untuk useEffect dependencies)
    refreshTriggers,
    
    // Generic refresh function
    triggerRefresh,
    
    // Specific refresh functions
    refreshCities,
    refreshSpaces,
    refreshServices,
    refreshOrders,
    
    // Cross-component refresh functions
    refreshRelatedToSpaces,
    refreshRelatedToCities
  };

  return (
    <GlobalRefreshContext.Provider value={value}>
      {children}
    </GlobalRefreshContext.Provider>
  );
};

export default GlobalRefreshContext; 