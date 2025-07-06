import { useState, useEffect } from 'react';
import * as invoiceAPI from '../services/invoiceApi';

const useInvoices = () => {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchInvoices = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await invoiceAPI.getAllInvoices();
        setInvoices(data);
      } catch (err) {
        setError(err.message);
        console.error('Error fetching invoices:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchInvoices();
  }, []);

  const createInvoice = async (invoiceData) => {
    try {
      const newInvoice = await invoiceAPI.createInvoice(invoiceData);
      setInvoices(prev => [newInvoice, ...prev]);
      return newInvoice;
    } catch (err) {
      throw new Error(err.message);
    }
  };

  const updateInvoice = async (id, invoiceData) => {
    try {
      const updatedInvoice = await invoiceAPI.updateInvoice(id, invoiceData);
      setInvoices(prev => 
        prev.map(invoice => 
          invoice.id === id ? updatedInvoice : invoice
        )
      );
      return updatedInvoice;
    } catch (err) {
      throw new Error(err.message);
    }
  };

  const deleteInvoice = async (id) => {
    try {
      await invoiceAPI.deleteInvoice(id);
      setInvoices(prev => prev.filter(invoice => invoice.id !== id));
    } catch (err) {
      throw new Error(err.message);
    }
  };

  const generateInvoiceFromOrder = async (order) => {
    try {
      const newInvoice = await invoiceAPI.generateInvoiceFromOrder(order.id);
      setInvoices(prev => [newInvoice, ...prev]);
      return newInvoice;
    } catch (err) {
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
    refresh: async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await invoiceAPI.getAllInvoices();
        setInvoices(data);
      } catch (err) {
        setError(err.message);
        console.error('Error refreshing invoices:', err);
      } finally {
        setLoading(false);
      }
    }
  };
};

export default useInvoices; 