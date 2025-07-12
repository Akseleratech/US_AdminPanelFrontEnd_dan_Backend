import { useState, useEffect, useRef } from 'react';
import { invoicesAPI } from '../services/api';

const useInvoices = () => {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const intervalRef = useRef(null);

  const fetchInvoices = async (isBackgroundRefresh = false) => {
    try {
      if (!isBackgroundRefresh) {
        setLoading(true);
      }
      setError(null);
      const response = await invoicesAPI.getAll();
      setInvoices(response.data?.invoices || response.invoices || []);
    } catch (err) {
      setError(err.message);
      console.error('Error fetching invoices:', err);
    } finally {
      if (!isBackgroundRefresh) {
        setLoading(false);
      }
    }
  };

  // Auto-refresh every 30 seconds for webhook updates
  useEffect(() => {
    fetchInvoices();
    
    // Set up auto-refresh interval
    intervalRef.current = setInterval(() => {
      fetchInvoices(true); // Background refresh
    }, 30000); // 30 seconds

    // Cleanup interval on unmount
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  const createInvoice = async (invoiceData) => {
    try {
      const response = await invoicesAPI.create(invoiceData);
      // Handle response structure consistently
      const newInvoice = response.data?.invoice || response.invoice || response.data || response;
      
      if (!newInvoice || !newInvoice.id) {
        console.error('Invalid invoice response:', response);
        throw new Error('Invalid invoice data received from server');
      }
      
      setInvoices(prev => [newInvoice, ...prev]);
      return newInvoice;
    } catch (err) {
      console.error('Error creating invoice:', err);
      throw new Error(err.message);
    }
  };

  const updateInvoice = async (id, invoiceData) => {
    try {
      const response = await invoicesAPI.update(id, invoiceData);
      // Handle response structure consistently with getAll
      const updatedInvoice = response.data?.invoice || response.invoice || response.data || response;
      
      // Validate that we have a proper invoice object
      if (!updatedInvoice || !updatedInvoice.id) {
        console.error('Invalid invoice response:', response);
        throw new Error('Invalid invoice data received from server');
      }
      
      setInvoices(prev => 
        prev.map(invoice => 
          invoice.id === id ? updatedInvoice : invoice
        )
      );
      return updatedInvoice;
    } catch (err) {
      console.error('Error updating invoice:', err);
      throw new Error(err.message);
    }
  };

  const deleteInvoice = async (id) => {
    try {
      await invoicesAPI.delete(id);
      setInvoices(prev => prev.filter(invoice => invoice.id !== id));
    } catch (err) {
      throw new Error(err.message);
    }
  };

  const generateInvoiceFromOrder = async (order) => {
    try {
      const response = await invoicesAPI.generateFromOrder(order.id);
      // Handle response structure consistently
      const newInvoice = response.data?.invoice || response.invoice || response.data || response;
      
      if (!newInvoice || !newInvoice.id) {
        console.error('Invalid invoice response:', response);
        throw new Error('Invalid invoice data received from server');
      }
      
      setInvoices(prev => [newInvoice, ...prev]);
      return newInvoice;
    } catch (err) {
      console.error('Error generating invoice from order:', err);
      throw new Error(err.message);
    }
  };

  const getInvoicesByOrderId = (orderId) => {
    return invoices.filter(invoice => 
      invoice.orderId === orderId || invoice.orderIds?.includes(orderId)
    );
  };

  const getInvoiceStats = () => {
    const totalRevenue = invoices.reduce((sum, invoice) => sum + invoice.total, 0);
    const paidInvoices = invoices.filter(invoice => invoice.status === 'paid');
    const overdueInvoices = invoices.filter(invoice => 
      invoice.status !== 'paid' && new Date(invoice.dueDate) < new Date()
    );
    
    return {
      totalRevenue,
      paidCount: paidInvoices.length,
      paidAmount: paidInvoices.reduce((sum, invoice) => sum + invoice.total, 0),
      overdueCount: overdueInvoices.length,
      overdueAmount: overdueInvoices.reduce((sum, invoice) => sum + invoice.total, 0),
      totalCount: invoices.length
    };
  };

  return {
    invoices,
    loading,
    error,
    createInvoice,
    updateInvoice,
    deleteInvoice,
    generateInvoiceFromOrder,
    getInvoicesByOrderId,
    getInvoiceStats,
    refresh: () => fetchInvoices()
  };
};

export default useInvoices; 