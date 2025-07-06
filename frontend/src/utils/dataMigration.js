/**
 * Data Migration Utility
 * Clears old data that might conflict with new schema
 */

export const clearLegacyData = () => {
  console.log('🧹 Clearing legacy data...');
  
  // Clear localStorage data that might use old schema
  const keysToCheck = [
    'orders',
    'invoices', 
    'payments',
    'finance_data',
    'order_cache',
    'invoice_cache'
  ];
  
  keysToCheck.forEach(key => {
    if (localStorage.getItem(key)) {
      localStorage.removeItem(key);
      console.log(`✅ Cleared localStorage: ${key}`);
    }
  });
  
  // Clear sessionStorage data
  keysToCheck.forEach(key => {
    if (sessionStorage.getItem(key)) {
      sessionStorage.removeItem(key);
      console.log(`✅ Cleared sessionStorage: ${key}`);
    }
  });
  
  console.log('✨ Legacy data cleanup completed!');
};

export const migrateOrderData = (orders) => {
  console.log('🔄 Migrating order data to new schema...');
  
  if (!Array.isArray(orders)) {
    console.log('❌ Invalid orders data, skipping migration');
    return [];
  }
  
  const migratedOrders = orders.map(order => {
    // If order has old 'amount' field but no 'amountBase', migrate it
    if (order.amount && !order.amountBase) {
      console.log(`🔄 Migrating order ${order.id}: amount -> amountBase`);
      return {
        ...order,
        amountBase: order.amount,
        invoiceId: order.invoiceId || null,
        // Remove old amount field
        amount: undefined
      };
    }
    
    // If order already has amountBase, ensure it has invoiceId
    if (order.amountBase && !order.invoiceId) {
      return {
        ...order,
        invoiceId: null
      };
    }
    
    return order;
  });
  
  console.log(`✅ Migrated ${migratedOrders.length} orders`);
  return migratedOrders;
};

export const validateNewSchema = (data, type = 'order') => {
  if (type === 'order') {
    const requiredFields = ['amountBase'];
    const optionalFields = ['invoiceId'];
    
    const hasRequired = requiredFields.every(field => 
      data.hasOwnProperty(field) && data[field] !== undefined
    );
    
    if (!hasRequired) {
      console.warn('⚠️ Order missing required fields:', requiredFields.filter(field => !data[field]));
      return false;
    }
    
    // Warn if using old fields
    if (data.amount && !data.amountBase) {
      console.warn('⚠️ Order using deprecated "amount" field, should use "amountBase"');
      return false;
    }
    
    return true;
  }
  
  if (type === 'invoice') {
    const requiredFields = ['amountBase', 'taxRate', 'taxAmount', 'total'];
    
    const hasRequired = requiredFields.every(field => 
      data.hasOwnProperty(field) && data[field] !== undefined
    );
    
    if (!hasRequired) {
      console.warn('⚠️ Invoice missing required fields:', requiredFields.filter(field => !data[field]));
      return false;
    }
    
    return true;
  }
  
  return true;
};

// Auto-run cleanup on import
if (typeof window !== 'undefined') {
  // Only run in browser environment
  clearLegacyData();
} 