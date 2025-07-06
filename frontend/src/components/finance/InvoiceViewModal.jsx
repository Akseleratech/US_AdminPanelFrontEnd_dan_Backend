import React from 'react';
import { X, Download, Send, Printer, Calendar, User, Mail, Phone, MapPin, DollarSign, Receipt, Clock } from 'lucide-react';

const InvoiceViewModal = ({ isOpen, onClose, invoice }) => {
  if (!isOpen || !invoice) return null;

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('id-ID', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatCurrency = (amount) => {
    if (!amount) return 'Rp 0';
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'paid':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'overdue':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'sent':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'draft':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'paid':
        return <DollarSign className="w-3 h-3 mr-1" />;
      case 'overdue':
        return <Clock className="w-3 h-3 mr-1" />;
      case 'sent':
        return <Send className="w-3 h-3 mr-1" />;
      case 'draft':
        return <Receipt className="w-3 h-3 mr-1" />;
      default:
        return <Receipt className="w-3 h-3 mr-1" />;
    }
  };

  const calculateDaysOverdue = () => {
    if (!invoice.dueDate || invoice.status === 'paid') return 0;
    const today = new Date();
    const dueDate = new Date(invoice.dueDate);
    const diffTime = today - dueDate;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays : 0;
  };

  const daysOverdue = calculateDaysOverdue();

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Receipt className="w-6 h-6 text-blue-600" />
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Invoice Details</h2>
              <p className="text-sm text-gray-500">Invoice ID: {invoice.id}</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => {/* Handle download */}}
              className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <Download className="w-4 h-4 mr-2" />
              Download PDF
            </button>
            <button
              onClick={() => {/* Handle print */}}
              className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <Printer className="w-4 h-4 mr-2" />
              Print
            </button>
            {invoice.status !== 'sent' && invoice.status !== 'paid' && (
              <button
                onClick={() => {/* Handle send */}}
                className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <Send className="w-4 h-4 mr-2" />
                Send Invoice
              </button>
            )}
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Invoice Content */}
        <div className="px-6 py-6">
          {/* Status Banner */}
          {invoice.status === 'overdue' && daysOverdue > 0 && (
            <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-center">
                <Clock className="w-5 h-5 text-red-600 mr-2" />
                <div>
                  <p className="text-sm font-medium text-red-800">
                    Invoice Overdue
                  </p>
                  <p className="text-sm text-red-600">
                    This invoice is {daysOverdue} day{daysOverdue > 1 ? 's' : ''} overdue
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Company Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">INVOICE</h1>
                <div className="text-sm text-gray-600">
                  <p className="font-medium">UnionSpace CRM</p>
                  <p>Jl. Sudirman No. 123</p>
                  <p>Jakarta Pusat, DKI Jakarta 10110</p>
                  <p>Indonesia</p>
                </div>
              </div>
              <div className="text-right">
                <div className="mb-4">
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(invoice.status)}`}>
                    {getStatusIcon(invoice.status)}
                    {invoice.status.toUpperCase()}
                  </span>
                </div>
                <div className="text-sm text-gray-600">
                  <p><strong>Invoice ID:</strong> {invoice.id}</p>
                  <p><strong>Order ID:</strong> {invoice.orderId}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Invoice Details Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
            {/* Bill To */}
            <div className="bg-gray-50 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <User className="w-5 h-5 mr-2 text-blue-600" />
                Bill To
              </h3>
              <div className="space-y-2 text-sm">
                <p className="font-medium text-gray-900">{invoice.customerName}</p>
                <div className="flex items-center text-gray-600">
                  <Mail className="w-4 h-4 mr-2" />
                  <span>{invoice.customerEmail}</span>
                </div>
                {invoice.customerPhone && (
                  <div className="flex items-center text-gray-600">
                    <Phone className="w-4 h-4 mr-2" />
                    <span>{invoice.customerPhone}</span>
                  </div>
                )}
                {invoice.customerAddress && (
                  <div className="flex items-start text-gray-600">
                    <MapPin className="w-4 h-4 mr-2 mt-0.5 flex-shrink-0" />
                    <span>{invoice.customerAddress}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Invoice Information */}
            <div className="bg-blue-50 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <Calendar className="w-5 h-5 mr-2 text-blue-600" />
                Invoice Information
              </h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Issue Date:</span>
                  <span className="font-medium">{formatDate(invoice.issuedDate)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Due Date:</span>
                  <span className="font-medium">{formatDate(invoice.dueDate)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Payment Terms:</span>
                  <span className="font-medium">{invoice.paymentTerms} days</span>
                </div>
                {invoice.paidDate && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Paid Date:</span>
                    <span className="font-medium text-green-600">{formatDate(invoice.paidDate)}</span>
                  </div>
                )}
                {invoice.paymentMethod && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Payment Method:</span>
                    <span className="font-medium">{invoice.paymentMethod}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Service Details */}
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Service Details</h3>
            <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Description
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Amount
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  <tr>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <div>
                        <div className="font-medium">
                          {invoice.notes || 'Space Booking Service'}
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          Order ID: {invoice.orderId}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                      {formatCurrency(invoice.amountBase)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Amount Summary */}
          <div className="flex justify-end">
            <div className="w-full max-w-md">
              <div className="bg-gray-50 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Amount Summary</h3>
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Subtotal:</span>
                    <span className="font-medium">{formatCurrency(invoice.amountBase)}</span>
                  </div>
                  
                  {invoice.discountAmount > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Discount ({(invoice.discountRate * 100).toFixed(1)}%):</span>
                      <span className="font-medium text-green-600">-{formatCurrency(invoice.discountAmount)}</span>
                    </div>
                  )}
                  
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Tax/PPN ({(invoice.taxRate * 100).toFixed(1)}%):</span>
                    <span className="font-medium">{formatCurrency(invoice.taxAmount)}</span>
                  </div>
                  
                  <div className="border-t border-gray-200 pt-3">
                    <div className="flex justify-between text-lg font-semibold">
                      <span className="text-gray-900">Total:</span>
                      <span className="text-gray-900">{formatCurrency(invoice.total)}</span>
                    </div>
                  </div>
                  
                  {invoice.status === 'paid' && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Paid Amount:</span>
                      <span className="font-medium text-green-600">{formatCurrency(invoice.paidAmount || invoice.total)}</span>
                    </div>
                  )}
                  
                  {invoice.status !== 'paid' && invoice.total > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Outstanding:</span>
                      <span className="font-medium text-red-600">{formatCurrency(invoice.total - (invoice.paidAmount || 0))}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Notes */}
          {invoice.notes && (
            <div className="mt-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Notes</h3>
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <p className="text-sm text-gray-700 whitespace-pre-wrap">{invoice.notes}</p>
              </div>
            </div>
          )}

          {/* Footer */}
          <div className="mt-8 pt-6 border-t border-gray-200">
            <div className="text-center text-sm text-gray-500">
              <p>Thank you for your business!</p>
              <p className="mt-2">
                For any questions regarding this invoice, please contact us at{' '}
                <a href="mailto:billing@unionspace.com" className="text-blue-600 hover:underline">
                  billing@unionspace.com
                </a>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InvoiceViewModal; 