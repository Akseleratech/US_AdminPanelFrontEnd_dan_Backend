// Invoice API Service
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/unionspace-crm/us-central1/api';

class InvoiceAPI {
  constructor() {
    this.baseURL = `${API_BASE_URL}/invoices`;
  }

  // Helper method to handle API responses
  async handleResponse(response) {
    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'An error occurred' }));
      throw new Error(error.message || `HTTP error! status: ${response.status}`);
    }
    return response.json();
  }

  // Get all invoices
  async getAll(params = {}) {
    try {
      const queryParams = new URLSearchParams(params).toString();
      const url = queryParams ? `${this.baseURL}?${queryParams}` : this.baseURL;
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      return await this.handleResponse(response);
    } catch (error) {
      console.error('Error fetching invoices:', error);
      throw error;
    }
  }

  // Get invoice by ID
  async getById(id) {
    try {
      const response = await fetch(`${this.baseURL}/${id}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      return await this.handleResponse(response);
    } catch (error) {
      console.error('Error fetching invoice:', error);
      throw error;
    }
  }

  // Create new invoice
  async create(invoiceData) {
    try {
      const response = await fetch(this.baseURL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(invoiceData),
      });
      
      return await this.handleResponse(response);
    } catch (error) {
      console.error('Error creating invoice:', error);
      throw error;
    }
  }

  // Update invoice
  async update(id, invoiceData) {
    try {
      const response = await fetch(`${this.baseURL}/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(invoiceData),
      });
      
      return await this.handleResponse(response);
    } catch (error) {
      console.error('Error updating invoice:', error);
      throw error;
    }
  }

  // Delete invoice
  async delete(id) {
    try {
      const response = await fetch(`${this.baseURL}/${id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      return await this.handleResponse(response);
    } catch (error) {
      console.error('Error deleting invoice:', error);
      throw error;
    }
  }

  // Generate invoice from order
  async generateFromOrder(orderId) {
    try {
      const response = await fetch(`${this.baseURL}/generate-from-order`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ orderId }),
      });
      
      return await this.handleResponse(response);
    } catch (error) {
      console.error('Error generating invoice from order:', error);
      throw error;
    }
  }

  // Send invoice to customer
  async sendToCustomer(id, emailData = {}) {
    try {
      const response = await fetch(`${this.baseURL}/${id}/send`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(emailData),
      });
      
      return await this.handleResponse(response);
    } catch (error) {
      console.error('Error sending invoice:', error);
      throw error;
    }
  }

  // Download invoice PDF
  async downloadPDF(id) {
    try {
      const response = await fetch(`${this.baseURL}/${id}/pdf`, {
        method: 'GET',
        headers: {
          'Accept': 'application/pdf',
        },
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return response.blob();
    } catch (error) {
      console.error('Error downloading invoice PDF:', error);
      throw error;
    }
  }

  // Record payment
  async recordPayment(id, paymentData) {
    try {
      const response = await fetch(`${this.baseURL}/${id}/payments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(paymentData),
      });
      
      return await this.handleResponse(response);
    } catch (error) {
      console.error('Error recording payment:', error);
      throw error;
    }
  }

  // Get invoice payments
  async getPayments(id) {
    try {
      const response = await fetch(`${this.baseURL}/${id}/payments`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      return await this.handleResponse(response);
    } catch (error) {
      console.error('Error fetching invoice payments:', error);
      throw error;
    }
  }

  // Get invoice statistics
  async getStatistics(params = {}) {
    try {
      const queryParams = new URLSearchParams(params).toString();
      const url = queryParams ? `${this.baseURL}/statistics?${queryParams}` : `${this.baseURL}/statistics`;
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      return await this.handleResponse(response);
    } catch (error) {
      console.error('Error fetching invoice statistics:', error);
      throw error;
    }
  }

  // Get aging report
  async getAgingReport(params = {}) {
    try {
      const queryParams = new URLSearchParams(params).toString();
      const url = queryParams ? `${this.baseURL}/aging-report?${queryParams}` : `${this.baseURL}/aging-report`;
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      return await this.handleResponse(response);
    } catch (error) {
      console.error('Error fetching aging report:', error);
      throw error;
    }
  }

  // Get revenue report
  async getRevenueReport(params = {}) {
    try {
      const queryParams = new URLSearchParams(params).toString();
      const url = queryParams ? `${this.baseURL}/revenue-report?${queryParams}` : `${this.baseURL}/revenue-report`;
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      return await this.handleResponse(response);
    } catch (error) {
      console.error('Error fetching revenue report:', error);
      throw error;
    }
  }

  // Bulk operations
  async bulkSend(invoiceIds, emailData = {}) {
    try {
      const response = await fetch(`${this.baseURL}/bulk-send`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ invoiceIds, ...emailData }),
      });
      
      return await this.handleResponse(response);
    } catch (error) {
      console.error('Error bulk sending invoices:', error);
      throw error;
    }
  }

  async bulkDelete(invoiceIds) {
    try {
      const response = await fetch(`${this.baseURL}/bulk-delete`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ invoiceIds }),
      });
      
      return await this.handleResponse(response);
    } catch (error) {
      console.error('Error bulk deleting invoices:', error);
      throw error;
    }
  }

  // Export functions
  async exportToCSV(params = {}) {
    try {
      const queryParams = new URLSearchParams(params).toString();
      const url = queryParams ? `${this.baseURL}/export/csv?${queryParams}` : `${this.baseURL}/export/csv`;
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Accept': 'text/csv',
        },
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return response.blob();
    } catch (error) {
      console.error('Error exporting invoices to CSV:', error);
      throw error;
    }
  }

  async exportToExcel(params = {}) {
    try {
      const queryParams = new URLSearchParams(params).toString();
      const url = queryParams ? `${this.baseURL}/export/excel?${queryParams}` : `${this.baseURL}/export/excel`;
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Accept': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        },
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return response.blob();
    } catch (error) {
      console.error('Error exporting invoices to Excel:', error);
      throw error;
    }
  }
}

// Create and export a singleton instance
export const invoiceAPI = new InvoiceAPI();
export default invoiceAPI; 