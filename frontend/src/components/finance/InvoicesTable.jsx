import React, { useState } from 'react';
import { Eye, Edit, Send, Download, CheckCircle, Clock, AlertCircle, FileText, DollarSign } from 'lucide-react';
import PaymentModal from './PaymentModal';

const InvoicesTable = ({ 
  invoices = [], 
  selectedInvoices = [], 
  onSelectionChange, 
  onView, 
  onEdit, 
  onSend, 
  onDownload,
  onRecordPayment
}) => {
  const [paymentModal, setPaymentModal] = useState({
    isOpen: false,
    invoice: null
  });
  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('id-ID');
  };

  const formatCurrency = (amount) => {
    if (!amount) return 'Rp 0';
    return `Rp ${Number(amount).toLocaleString('id-ID')}`;
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'paid':
        return 'bg-green-100 text-green-800';
      case 'sent':
        return 'bg-blue-100 text-blue-800';
      case 'overdue':
        return 'bg-red-100 text-red-800';
      case 'draft':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'paid':
        return <CheckCircle className="w-3 h-3 mr-1" />;
      case 'sent':
        return <Clock className="w-3 h-3 mr-1" />;
      case 'overdue':
        return <AlertCircle className="w-3 h-3 mr-1" />;
      case 'draft':
        return <FileText className="w-3 h-3 mr-1" />;
      default:
        return <FileText className="w-3 h-3 mr-1" />;
    }
  };

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      onSelectionChange(invoices.map(invoice => invoice.id));
    } else {
      onSelectionChange([]);
    }
  };

  const handleSelectInvoice = (invoiceId, checked) => {
    if (checked) {
      onSelectionChange([...selectedInvoices, invoiceId]);
    } else {
      onSelectionChange(selectedInvoices.filter(id => id !== invoiceId));
    }
  };

  const isAllSelected = invoices.length > 0 && selectedInvoices.length === invoices.length;
  const isIndeterminate = selectedInvoices.length > 0 && selectedInvoices.length < invoices.length;

  const handleRecordPayment = (invoice) => {
    setPaymentModal({
      isOpen: true,
      invoice: invoice
    });
  };

  const handlePaymentSave = async (paymentData) => {
    try {
      await onRecordPayment(paymentData);
      setPaymentModal({ isOpen: false, invoice: null });
    } catch (error) {
      throw error;
    }
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left">
                <input
                  type="checkbox"
                  checked={isAllSelected}
                  ref={input => {
                    if (input) input.indeterminate = isIndeterminate;
                  }}
                  onChange={handleSelectAll}
                  className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
                />
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Invoice ID
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Customer
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Order ID
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Amount
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Issue Date
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Due Date
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Payment Method
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {invoices && invoices.length > 0 ? (
              invoices.map((invoice) => (
                <tr key={invoice.id} className="hover:bg-gray-50 transition-colors duration-150">
                  {/* Checkbox */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <input
                      type="checkbox"
                      checked={selectedInvoices.includes(invoice.id)}
                      onChange={(e) => handleSelectInvoice(invoice.id, e.target.checked)}
                      className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
                    />
                  </td>

                  {/* Invoice ID */}
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {invoice.id}
                  </td>

                  {/* Customer */}
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <div className="max-w-[200px]">
                      <div className="font-medium truncate" title={invoice.customerName}>
                        {invoice.customerName}
                      </div>
                      <div className="text-xs text-gray-500 truncate" title={invoice.customerEmail}>
                        {invoice.customerEmail}
                      </div>
                    </div>
                  </td>

                  {/* Order ID */}
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <span className="font-mono text-xs bg-gray-100 px-2 py-1 rounded">
                      {invoice.orderId}
                    </span>
                  </td>

                  {/* Amount */}
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <div>
                      <div className="font-medium">{formatCurrency(invoice.total)}</div>
                      <div className="text-xs text-gray-500">
                        Base: {formatCurrency(invoice.amountBase)}
                      </div>
                      <div className="text-xs text-gray-500">
                        Tax: {formatCurrency(invoice.taxAmount)}
                      </div>
                    </div>
                  </td>

                  {/* Status */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(invoice.status)}`}>
                      {getStatusIcon(invoice.status)}
                      {invoice.status}
                    </span>
                  </td>

                  {/* Issue Date */}
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {formatDate(invoice.issueDate)}
                  </td>

                  {/* Due Date */}
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <div>
                      <div>{formatDate(invoice.dueDate)}</div>
                      {invoice.status === 'overdue' && (
                        <div className="text-xs text-red-600 font-medium">
                          Overdue
                        </div>
                      )}
                      {invoice.paidDate && (
                        <div className="text-xs text-green-600">
                          Paid: {formatDate(invoice.paidDate)}
                        </div>
                      )}
                    </div>
                  </td>

                  {/* Payment Method */}
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {invoice.paymentMethod || '-'}
                  </td>

                  {/* Actions */}
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      <button 
                        onClick={() => onView && onView(invoice)}
                        className="text-blue-600 hover:text-blue-900 transition-colors"
                        title="View Invoice"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      
                      <button 
                        onClick={() => onEdit && onEdit(invoice)}
                        className="text-green-600 hover:text-green-900 transition-colors"
                        title="Edit Invoice"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      
                      {invoice.status !== 'draft' && (
                        <button 
                          onClick={() => onSend && onSend(invoice)}
                          className="text-purple-600 hover:text-purple-900 transition-colors"
                          title="Send Invoice"
                        >
                          <Send className="w-4 h-4" />
                        </button>
                      )}
                      
                      <button 
                        onClick={() => onDownload && onDownload(invoice)}
                        className="text-gray-600 hover:text-gray-900 transition-colors"
                        title="Download Invoice"
                      >
                        <Download className="w-4 h-4" />
                      </button>
                      
                      {invoice.status !== 'paid' && (
                        <button 
                          onClick={() => handleRecordPayment(invoice)}
                          className="text-indigo-600 hover:text-indigo-900 transition-colors"
                          title="Record Payment"
                        >
                          <DollarSign className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="10" className="px-6 py-8 text-center text-sm text-gray-500">
                  <div className="flex flex-col items-center justify-center">
                    <div className="text-gray-400 text-lg mb-2">📄</div>
                    <p className="text-gray-500 font-medium">No invoices found</p>
                    <p className="text-gray-400 text-xs mt-1">Invoices will appear here when available.</p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      
      {/* Payment Modal */}
      <PaymentModal
        isOpen={paymentModal.isOpen}
        onClose={() => setPaymentModal({ isOpen: false, invoice: null })}
        onSave={handlePaymentSave}
        invoice={paymentModal.invoice}
      />
    </div>
  );
};

export default InvoicesTable; 