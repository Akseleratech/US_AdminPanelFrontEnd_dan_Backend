import React, { useState, useEffect } from 'react';
import { Search, Filter, Plus, RefreshCw, Download, Send, Eye, Edit, Trash2 } from 'lucide-react';
import InvoicesTable from './InvoicesTable';
import InvoiceModal from './InvoiceModal';
import InvoiceViewModal from './InvoiceViewModal';
import LoadingSpinner from '../common/LoadingSpinner';
import useInvoices from '../../hooks/useInvoices';
import * as invoiceAPI from '../../services/invoiceApi';

// Utility to download selected invoices as an Excel-compatible file (.xls)
const downloadInvoicesAsExcel = (invoices) => {
  if (!invoices || invoices.length === 0) return;

  // Define columns we want to export
  const columns = [
    'Invoice ID',
    'Order ID',
    'Customer Name',
    'Customer Email',
    'Status',
    'Amount',
    'Issued Date',
    'Due Date',
  ];

  // Build TSV (tab-separated) which Excel opens nicely
  const rows = invoices.map((inv) => [
    inv.id,
    inv.orderId || inv.orderIds?.join(', ') || '',
    inv.customerName || '',
    inv.customerEmail || '',
    inv.status || '',
    inv.total ?? inv.amountBase ?? '',
    inv.issuedDate ? new Date(inv.issuedDate).toLocaleDateString('id-ID') : '',
    inv.dueDate ? new Date(inv.dueDate).toLocaleDateString('id-ID') : '',
  ]);

  const tsvContent = [columns, ...rows]
    .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join('\t'))
    .join('\n');

  const blob = new Blob([tsvContent], {
    type: 'application/vnd.ms-excel;charset=utf-8',
  });

  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  const ts = new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-');
  link.download = `invoices-${ts}.xls`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

const Invoices = () => {
  const { 
    invoices, 
    loading, 
    error, 
    createInvoice, 
    updateInvoice, 
    deleteInvoice, 
    refresh 
  } = useInvoices();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [editingInvoice, setEditingInvoice] = useState(null);
  const [viewingInvoice, setViewingInvoice] = useState(null);
  const [selectedInvoices, setSelectedInvoices] = useState([]);

  // Data is now managed by useInvoices hook

  const handleRefresh = async () => {
    await refresh();
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
    setViewingInvoice(invoice);
    setIsViewModalOpen(true);
  };

  const handleSendInvoice = (invoice) => {
    // Send invoice to customer
    console.log('Send invoice:', invoice);
  };

  const handleDownloadInvoice = (invoice) => {
    // Download invoice PDF
    console.log('Download invoice:', invoice);
  };

  const handleRecordPayment = async (paymentData) => {
    try {
      await invoiceAPI.recordPayment(paymentData);
      alert('Payment recorded successfully!');
      // Refresh data after recording payment
      await handleRefresh();
    } catch (error) {
      throw error;
    }
  };

  const handleBulkAction = async (action) => {
    if (selectedInvoices.length === 0) {
      alert('Please select invoices first');
      return;
    }
    
    try {
      switch (action) {
        case 'send':
          await invoiceAPI.bulkSendInvoices(selectedInvoices);
          alert(`Successfully sent ${selectedInvoices.length} invoices`);
          break;
        case 'download':
          const invoicesToDownload = invoices.filter((inv) => selectedInvoices.includes(inv.id));
          downloadInvoicesAsExcel(invoicesToDownload);
          break;
        case 'delete':
          if (window.confirm(`Are you sure you want to delete ${selectedInvoices.length} invoices?`)) {
            await invoiceAPI.bulkDeleteInvoices(selectedInvoices);
            alert(`Successfully deleted ${selectedInvoices.length} invoices`);
            setSelectedInvoices([]);
            await handleRefresh();
          }
          break;
        default:
          break;
      }
    } catch (error) {
      alert(`Error performing bulk action: ${error.message}`);
    }
  };

  const handleSaveInvoice = async (invoiceData) => {
    try {
      if (editingInvoice) {
        // Update existing invoice
        await updateInvoice(editingInvoice.id, invoiceData);
      } else {
        // Create new invoice
        await createInvoice(invoiceData);
      }
      setIsModalOpen(false);
      setEditingInvoice(null);
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
              <button
                onClick={() => handleBulkAction('delete')}
                className="flex items-center space-x-1 px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700"
              >
                <Trash2 className="w-4 h-4" />
                <span>Delete</span>
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
        onRecordPayment={handleRecordPayment}
      />

      {/* Modals */}
      <InvoiceModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveInvoice}
        editingInvoice={editingInvoice}
      />
      
      <InvoiceViewModal
        isOpen={isViewModalOpen}
        onClose={() => {
          setIsViewModalOpen(false);
          setViewingInvoice(null);
        }}
        invoice={viewingInvoice}
      />
    </div>
  );
};

export default Invoices; 