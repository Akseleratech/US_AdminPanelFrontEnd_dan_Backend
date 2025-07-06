import React, { useState, useEffect } from 'react';
import { Search, Filter, Plus, RefreshCw, Download, Send, Eye, Edit } from 'lucide-react';
import InvoicesTable from './InvoicesTable';
import InvoiceModal from './InvoiceModal';
import LoadingSpinner from '../common/LoadingSpinner';

const Invoices = () => {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingInvoice, setEditingInvoice] = useState(null);
  const [selectedInvoices, setSelectedInvoices] = useState([]);

  // Mock data for now - will be replaced with real API calls
  useEffect(() => {
    const fetchInvoices = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        const mockInvoices = [
          {
            id: 'INV/2024/05/001',
            orderId: 'ORD-20240515-CO-WEB-001',
            customerName: 'PT. Teknologi Maju',
            customerEmail: 'finance@teknologimaju.com',
            amount: 2500000,
            tax: 275000,
            total: 2775000,
            status: 'paid',
            issueDate: '2024-05-01',
            dueDate: '2024-05-15',
            paidDate: '2024-05-14',
            paymentMethod: 'Bank Transfer',
            notes: 'Pembayaran untuk sewa meeting room'
          },
          {
            id: 'INV/2024/05/002',
            orderId: 'ORD-20240516-CO-WEB-002',
            customerName: 'CV. Kreatif Digital',
            customerEmail: 'admin@kreatifdigital.com',
            amount: 1800000,
            tax: 198000,
            total: 1998000,
            status: 'sent',
            issueDate: '2024-05-05',
            dueDate: '2024-05-20',
            paidDate: null,
            paymentMethod: null,
            notes: 'Invoice untuk coworking space'
          },
          {
            id: 'INV/2024/05/003',
            orderId: 'ORD-20240510-CO-WEB-003',
            customerName: 'Startup Inovasi',
            customerEmail: 'billing@startupinovasi.com',
            amount: 3200000,
            tax: 352000,
            total: 3552000,
            status: 'overdue',
            issueDate: '2024-04-25',
            dueDate: '2024-05-10',
            paidDate: null,
            paymentMethod: null,
            notes: 'Invoice overdue - perlu follow up'
          },
          {
            id: 'INV/2024/05/004',
            orderId: 'ORD-20240518-CO-WEB-004',
            customerName: 'PT. Solusi Bisnis',
            customerEmail: 'finance@solusibisnis.com',
            amount: 4500000,
            tax: 495000,
            total: 4995000,
            status: 'draft',
            issueDate: '2024-05-18',
            dueDate: '2024-06-01',
            paidDate: null,
            paymentMethod: null,
            notes: 'Draft invoice - belum dikirim'
          }
        ];
        
        setInvoices(mockInvoices);
      } catch (err) {
        setError(err.message);
        console.error('Error fetching invoices:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchInvoices();
  }, []);

  const handleRefresh = () => {
    // Refresh invoice data
    const event = new Event('refreshInvoices');
    window.dispatchEvent(event);
  };

  const handleAddInvoice = () => {
    setEditingInvoice(null);
    setIsModalOpen(true);
  };

  const handleEditInvoice = (invoice) => {
    setEditingInvoice(invoice);
    setIsModalOpen(true);
  };

  const handleViewInvoice = (invoice) => {
    // Open invoice detail view
    console.log('View invoice:', invoice);
  };

  const handleSendInvoice = (invoice) => {
    // Send invoice to customer
    console.log('Send invoice:', invoice);
  };

  const handleDownloadInvoice = (invoice) => {
    // Download invoice PDF
    console.log('Download invoice:', invoice);
  };

  const handleBulkAction = (action) => {
    if (selectedInvoices.length === 0) {
      alert('Please select invoices first');
      return;
    }
    
    switch (action) {
      case 'send':
        console.log('Bulk send invoices:', selectedInvoices);
        break;
      case 'download':
        console.log('Bulk download invoices:', selectedInvoices);
        break;
      case 'delete':
        if (window.confirm(`Are you sure you want to delete ${selectedInvoices.length} invoices?`)) {
          console.log('Bulk delete invoices:', selectedInvoices);
        }
        break;
      default:
        break;
    }
  };

  const handleSaveInvoice = async (invoiceData) => {
    try {
      if (editingInvoice) {
        // Update existing invoice
        console.log('Update invoice:', invoiceData);
      } else {
        // Create new invoice
        console.log('Create invoice:', invoiceData);
      }
      // Refresh data after save
      handleRefresh();
    } catch (error) {
      throw error;
    }
  };

  // Filter invoices based on search term and status
  const filteredInvoices = invoices.filter(invoice => {
    const matchesSearch = !searchTerm || 
      invoice.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      invoice.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      invoice.customerEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
      invoice.orderId.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || invoice.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Invoices</h2>
          <p className="text-sm text-gray-500">Manage your invoices and billing</p>
        </div>
        
        <div className="mt-4 sm:mt-0 flex items-center space-x-3">
          <button
            onClick={handleRefresh}
            className="flex items-center space-x-2 px-4 py-2 bg-white border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Refresh</span>
          </button>
          
          <button
            onClick={handleAddInvoice}
            className="flex items-center space-x-2 px-4 py-2 bg-primary text-white rounded-md shadow-sm text-sm font-medium hover:bg-primary-dark"
          >
            <Plus className="w-4 h-4" />
            <span>Create Invoice</span>
          </button>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <div className="flex">
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Error</h3>
              <div className="mt-2 text-sm text-red-700">
                <p>{error}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Search and Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-4">
        {/* Search */}
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search invoices by ID, customer, or order..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary focus:border-primary"
            />
          </div>
        </div>

        {/* Status Filter */}
        <div className="relative">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="appearance-none bg-white border border-gray-300 rounded-md px-4 py-2 pr-8 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
          >
            <option value="all">All Status</option>
            <option value="draft">Draft</option>
            <option value="sent">Sent</option>
            <option value="paid">Paid</option>
            <option value="overdue">Overdue</option>
          </select>
        </div>
      </div>

      {/* Bulk Actions */}
      {selectedInvoices.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-blue-800">
              {selectedInvoices.length} invoices selected
            </span>
            <div className="flex space-x-2">
              <button
                onClick={() => handleBulkAction('send')}
                className="flex items-center space-x-1 px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
              >
                <Send className="w-4 h-4" />
                <span>Send</span>
              </button>
              <button
                onClick={() => handleBulkAction('download')}
                className="flex items-center space-x-1 px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700"
              >
                <Download className="w-4 h-4" />
                <span>Download</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Results Summary */}
      <div className="text-sm text-gray-600">
        Showing {filteredInvoices.length} of {invoices.length} invoices
        {searchTerm && <span> matching "{searchTerm}"</span>}
        {statusFilter !== 'all' && <span> with status "{statusFilter}"</span>}
      </div>

      {/* Table */}
      <InvoicesTable 
        invoices={filteredInvoices}
        selectedInvoices={selectedInvoices}
        onSelectionChange={setSelectedInvoices}
        onView={handleViewInvoice}
        onEdit={handleEditInvoice}
        onSend={handleSendInvoice}
        onDownload={handleDownloadInvoice}
      />

      {/* Modal */}
      <InvoiceModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveInvoice}
        editingInvoice={editingInvoice}
      />
    </div>
  );
};

export default Invoices; 