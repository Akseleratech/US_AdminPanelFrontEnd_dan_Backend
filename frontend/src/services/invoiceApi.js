// Invoice API Service
import { API_BASE_URL } from './api.jsx';

const INVOICE_API_URL = `${API_BASE_URL}/invoices`;

// Helper function to handle API responses
const handleResponse = async (response) => {
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || errorData.message || `HTTP ${response.status}: ${response.statusText}`);
  }
  return await response.json();
};

// GET /invoices - Get all invoices with filters
export const getAllInvoices = async (params = {}) => {
  try {
    const queryParams = new URLSearchParams();
    
    // Add filter parameters
    if (params.status) queryParams.append('status', params.status);
    if (params.customerEmail) queryParams.append('customerEmail', params.customerEmail);
    if (params.orderId) queryParams.append('orderId', params.orderId);
    if (params.search) queryParams.append('search', params.search);
    if (params.limit) queryParams.append('limit', params.limit);
    if (params.offset) queryParams.append('offset', params.offset);
    if (params.sortBy) queryParams.append('sortBy', params.sortBy);
    if (params.sortOrder) queryParams.append('sortOrder', params.sortOrder);

    const url = queryParams.toString() ? `${INVOICE_API_URL}?${queryParams}` : INVOICE_API_URL;
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const data = await handleResponse(response);
    return data.data?.invoices || []; // Return just the invoices array from data.data
  } catch (error) {
    console.error('Error fetching invoices:', error);
    throw error;
  }
};

// GET /invoices/:id - Get invoice by ID
export const getInvoiceById = async (invoiceId) => {
  try {
    const response = await fetch(`${INVOICE_API_URL}/${invoiceId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const data = await handleResponse(response);
    return data.data || data; // Return data.data if exists, otherwise return data
  } catch (error) {
    console.error('Error fetching invoice:', error);
    throw error;
  }
};

// POST /invoices - Create new invoice
export const createInvoice = async (invoiceData) => {
  try {
    const response = await fetch(INVOICE_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(invoiceData),
    });

    const data = await handleResponse(response);
    return data.data || data; // Return data.data if exists, otherwise return data
  } catch (error) {
    console.error('Error creating invoice:', error);
    throw error;
  }
};

// POST /invoices/:orderId/generate-from-order - Generate invoice from order
export const generateInvoiceFromOrder = async (orderId) => {
  try {
    const response = await fetch(`${INVOICE_API_URL}/${orderId}/generate-from-order`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const data = await handleResponse(response);
    return data.data || data; // Return data.data if exists, otherwise return data
  } catch (error) {
    console.error('Error generating invoice from order:', error);
    throw error;
  }
};

// PUT /invoices/:id - Update invoice
export const updateInvoice = async (invoiceId, updateData) => {
  try {
    const response = await fetch(`${INVOICE_API_URL}/${invoiceId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(updateData),
    });

    const data = await handleResponse(response);
    return data.data || data; // Return data.data if exists, otherwise return data
  } catch (error) {
    console.error('Error updating invoice:', error);
    throw error;
  }
};

// DELETE /invoices/:id - Delete invoice
export const deleteInvoice = async (invoiceId) => {
  try {
    const response = await fetch(`${INVOICE_API_URL}/${invoiceId}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const data = await handleResponse(response);
    return data.data || data; // Return data.data if exists, otherwise return data
  } catch (error) {
    console.error('Error deleting invoice:', error);
    throw error;
  }
};

// Bulk operations
export const bulkSendInvoices = async (invoiceIds) => {
  try {
    // TODO: Implement bulk send endpoint in backend
    console.log('Bulk sending invoices:', invoiceIds);
    // For now, simulate the operation
    return { success: true, sent: invoiceIds.length };
  } catch (error) {
    console.error('Error bulk sending invoices:', error);
    throw error;
  }
};

export const bulkDownloadInvoices = async (invoiceIds) => {
  try {
    // TODO: Implement bulk download endpoint in backend
    console.log('Bulk downloading invoices:', invoiceIds);
    // For now, simulate the operation
    return { success: true, downloaded: invoiceIds.length };
  } catch (error) {
    console.error('Error bulk downloading invoices:', error);
    throw error;
  }
};

export const bulkDeleteInvoices = async (invoiceIds) => {
  try {
    // Delete each invoice individually for now
    const deletePromises = invoiceIds.map(id => deleteInvoice(id));
    await Promise.all(deletePromises);
    return { success: true, deleted: invoiceIds.length };
  } catch (error) {
    console.error('Error bulk deleting invoices:', error);
    throw error;
  }
};

// Payment operations
export const recordPayment = async (paymentData) => {
  try {
    // TODO: Implement payment recording endpoint in backend
    // For now, update invoice status to paid
    const { invoiceId, amount, paymentDate, paymentMethod, reference, notes } = paymentData;
    
    const updateData = {
      status: 'paid',
      paidDate: paymentDate,
      paidAmount: amount,
      paymentMethod: paymentMethod,
      notes: notes ? `${notes} | Payment ref: ${reference}` : `Payment ref: ${reference}`
    };

    return await updateInvoice(invoiceId, updateData);
  } catch (error) {
    console.error('Error recording payment:', error);
    throw error;
  }
};

// Statistics and dashboard data
export const getInvoiceStats = async () => {
  try {
    const invoices = await getAllInvoices();
    
    const stats = {
      totalRevenue: 0,
      paidCount: 0,
      paidAmount: 0,
      overdueCount: 0,
      overdueAmount: 0,
      outstandingCount: 0,
      outstandingAmount: 0,
      totalCount: invoices.length
    };

    const now = new Date();
    
    invoices.forEach(invoice => {
      stats.totalRevenue += invoice.total;
      
      if (invoice.status === 'paid') {
        stats.paidCount++;
        stats.paidAmount += invoice.total;
      } else if (invoice.status === 'overdue' || (invoice.dueDate && new Date(invoice.dueDate) < now && invoice.status !== 'paid')) {
        stats.overdueCount++;
        stats.overdueAmount += invoice.total;
      } else {
        stats.outstandingCount++;
        stats.outstandingAmount += invoice.total;
      }
    });

    return stats;
  } catch (error) {
    console.error('Error calculating invoice stats:', error);
    throw error;
  }
};

export const getRecentInvoices = async (limit = 5) => {
  try {
    const invoices = await getAllInvoices({
      limit: limit,
      sortBy: 'issuedDate',
      sortOrder: 'desc'
    });
    
    return invoices;
  } catch (error) {
    console.error('Error fetching recent invoices:', error);
    throw error;
  }
};

export default {
  getAllInvoices,
  getInvoiceById,
  createInvoice,
  generateInvoiceFromOrder,
  updateInvoice,
  deleteInvoice,
  bulkSendInvoices,
  bulkDownloadInvoices,
  bulkDeleteInvoices,
  recordPayment,
  getInvoiceStats,
  getRecentInvoices
}; 