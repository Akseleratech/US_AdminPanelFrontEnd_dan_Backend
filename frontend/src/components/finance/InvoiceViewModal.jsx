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

  // Print functionality
  const handlePrint = () => {
    // Hide the modal temporarily
    const modal = document.querySelector('.invoice-modal');
    const originalDisplay = modal.style.display;
    modal.style.display = 'none';

    // Create a new window for printing
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Invoice ${invoice.id}</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: Arial, sans-serif; font-size: 12px; line-height: 1.4; color: #333; }
          .container { max-width: 800px; margin: 0 auto; padding: 20px; }
          .header { display: flex; justify-content: space-between; margin-bottom: 30px; }
          .company-info h1 { font-size: 28px; font-weight: bold; margin-bottom: 10px; }
          .company-info p { margin: 2px 0; }
          .invoice-info { text-align: right; }
          .status-badge { display: inline-block; padding: 4px 8px; border-radius: 4px; font-size: 10px; font-weight: bold; text-transform: uppercase; }
          .status-paid { background: #d1fae5; color: #065f46; }
          .status-draft { background: #f3f4f6; color: #374151; }
          .status-sent { background: #dbeafe; color: #1e40af; }
          .status-overdue { background: #fee2e2; color: #991b1b; }
          .details-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 30px; margin-bottom: 30px; }
          .detail-section { background: #f9fafb; padding: 15px; border-radius: 8px; }
          .detail-section h3 { font-size: 14px; font-weight: bold; margin-bottom: 10px; }
          .detail-section p { margin: 5px 0; }
          .service-table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
          .service-table th, .service-table td { padding: 10px; text-align: left; border-bottom: 1px solid #e5e7eb; }
          .service-table th { background: #f9fafb; font-weight: bold; }
          .amount-summary { margin-left: auto; width: 300px; background: #f9fafb; padding: 15px; border-radius: 8px; }
          .amount-row { display: flex; justify-content: space-between; margin: 5px 0; }
          .amount-total { border-top: 1px solid #e5e7eb; padding-top: 10px; margin-top: 10px; font-weight: bold; font-size: 14px; }
          .notes { background: #fffbeb; padding: 15px; border-radius: 8px; margin: 20px 0; }
          .footer { text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; color: #6b7280; }
          @media print {
            body { font-size: 11px; }
            .container { padding: 10px; }
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="company-info">
              <h1>Invoice</h1>
              <p><strong>UnionSpace</strong></p>
              <p>CitiHub Harton Tower Lantai 3, Kelapa Gading.</p>
              <p>Jl. Artha Gading Selatan. No.3. Jakarta Utara</p>
              <p>Indonesia</p>
            </div>
            <div class="invoice-info">
              <span class="status-badge status-${invoice.status}">${invoice.status.toUpperCase()}</span>
              <p style="margin-top: 10px;"><strong>ID Invoice:</strong> ${invoice.id}</p>
              <p><strong>ID Pesanan:</strong> ${invoice.orderId}</p>
            </div>
          </div>

          <div class="details-grid">
            <div class="detail-section">
              <h3>Tagihan Kepada</h3>
              <p><strong>${invoice.customerName}</strong></p>
              <p>${invoice.customerEmail}</p>
              ${invoice.customerPhone ? `<p>${invoice.customerPhone}</p>` : ''}
              ${invoice.customerAddress ? `<p>${invoice.customerAddress}</p>` : ''}
            </div>
            <div class="detail-section">
              <h3>Informasi Invoice</h3>
              <p><strong>Tanggal Terbit:</strong> ${formatDate(invoice.issuedDate)}</p>
              <p><strong>Tanggal Jatuh Tempo:</strong> ${formatDate(invoice.dueDate)}</p>
              <p><strong>Jangka Waktu Pembayaran:</strong> ${invoice.paymentTerms} hari</p>
            </div>
          </div>

          <table class="service-table">
            <thead>
              <tr>
                <th>Deskripsi</th>
                <th style="text-align: right;">Jumlah</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>
                  <strong>${invoice.notes || 'Space Booking Service'}</strong><br>
                  <small>Order ID: ${invoice.orderId}</small>
                </td>
                <td style="text-align: right;">${formatCurrency(invoice.amountBase)}</td>
              </tr>
            </tbody>
          </table>

          <div class="amount-summary">
            <h3 style="margin-bottom: 10px;">Ringkasan Biaya</h3>
            <div class="amount-row">
              <span>Subtotal:</span>
              <span>${formatCurrency(invoice.amountBase)}</span>
            </div>
            ${invoice.discountAmount > 0 ? `
            <div class="amount-row">
              <span>Diskon (${(invoice.discountRate * 100).toFixed(1)}%):</span>
              <span>-${formatCurrency(invoice.discountAmount)}</span>
            </div>
            ` : ''}
            <div class="amount-row">
              <span>Pajak/PPN (${(invoice.taxRate * 100).toFixed(1)}%):</span>
              <span>${formatCurrency(invoice.taxAmount)}</span>
            </div>
            <div class="amount-row amount-total">
              <span>Total:</span>
              <span>${formatCurrency(invoice.total)}</span>
            </div>
            ${invoice.status === 'paid' ? `
            <div class="amount-row">
              <span>Jumlah Terbayar:</span>
              <span>${formatCurrency(invoice.paidAmount || invoice.total)}</span>
            </div>
            ` : ''}
            ${invoice.status !== 'paid' && invoice.total > 0 ? `
            <div class="amount-row">
              <span>Sisa Tagihan:</span>
              <span>${formatCurrency(invoice.total - (invoice.paidAmount || 0))}</span>
            </div>
            ` : ''}
          </div>

          ${invoice.notes ? `
          <div class="notes">
            <h3>Catatan</h3>
            <p>${invoice.notes}</p>
          </div>
          ` : ''}

          <div class="footer">
            <p>Terima kasih atas kepercayaan Anda!</p>
            <p>Jika ada pertanyaan mengenai Invoice ini, silakan hubungi kami melalui +628111085505</p>
          </div>
        </div>
      </body>
      </html>
    `);
    
    printWindow.document.close();
    printWindow.focus();
    
    // Wait for content to load then print
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
      // Restore modal display
      modal.style.display = originalDisplay;
    }, 500);
  };

  const daysOverdue = calculateDaysOverdue();

  return (
    <div className="fixed inset-0 bg-gray-900/75 backdrop-blur-sm flex items-center justify-center z-50 p-4 invoice-modal">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Receipt className="w-6 h-6 text-blue-600" />
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Detail Invoice</h2>
              <p className="text-sm text-gray-500">Invoice ID: {invoice.id}</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={handlePrint}
              className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <Printer className="w-4 h-4 mr-2" />
              Cetak
            </button>
            {invoice.status !== 'sent' && invoice.status !== 'paid' && (
              <button
                onClick={() => {/* Handle send */}}
                className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <Send className="w-4 h-4 mr-2" />
                Kirim Invoice
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
                    Invoice Jatuh Tempo
                  </p>
                  <p className="text-sm text-red-600">
                    Invoice ini telah jatuh tempo selama {daysOverdue} hari
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Company Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">Invoice</h1>
                <div className="text-sm text-gray-600">
                  <p className="font-medium">UnionSpace</p>
                  <p>CitiHub Harton Tower Lantai 3, Kelapa Gading.</p>
                  <p>Jl. Artha Gading Selatan. No.3. Jakarta Utara</p>
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
                  <p><strong>ID Invoice:</strong> {invoice.id}</p>
                  <p><strong>ID Pesanan:</strong> {invoice.orderId}</p>
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
                Tagihan Kepada
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
                Informasi Invoice
              </h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Tanggal Terbit:</span>
                  <span className="font-medium">{formatDate(invoice.issuedDate)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Tanggal Jatuh Tempo:</span>
                  <span className="font-medium">{formatDate(invoice.dueDate)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Jangka Waktu Pembayaran:</span>
                  <span className="font-medium">{invoice.paymentTerms} days</span>
                </div>
                {invoice.paidDate && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Tanggal Pembayaran:</span>
                    <span className="font-medium text-green-600">{formatDate(invoice.paidDate)}</span>
                  </div>
                )}
                {invoice.paymentMethod && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Metode Pembayaran:</span>
                    <span className="font-medium">{invoice.paymentMethod}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Service Details */}
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Rincian Layanan</h3>
            <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Deskripsi
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Jumlah
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
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Ringkasan Biaya</h3>
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Subtotal:</span>
                    <span className="font-medium">{formatCurrency(invoice.amountBase)}</span>
                  </div>
                  
                  {invoice.discountAmount > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Diskon ({(invoice.discountRate * 100).toFixed(1)}%):</span>
                      <span className="font-medium text-green-600">-{formatCurrency(invoice.discountAmount)}</span>
                    </div>
                  )}
                  
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Pajak/PPN ({(invoice.taxRate * 100).toFixed(1)}%):</span>
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
                      <span className="text-gray-600">Jumlah Terbayar:</span>
                      <span className="font-medium text-green-600">{formatCurrency(invoice.paidAmount || invoice.total)}</span>
                    </div>
                  )}
                  
                  {invoice.status !== 'paid' && invoice.total > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Sisa Tagihan:</span>
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
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Catatan</h3>
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <p className="text-sm text-gray-700 whitespace-pre-wrap">{invoice.notes}</p>
              </div>
            </div>
          )}

          {/* Footer */}
          <div className="mt-8 pt-6 border-t border-gray-200">
            <div className="text-center text-sm text-gray-500">
              <p>Terima kasih atas kepercayaan Anda!</p>
              <p className="mt-2">
                Jika ada pertanyaan mengenai Invoice ini, silakan hubungi kami melalui{' '}
                <a href="https://wa.me/628111085505" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                +628111085505
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