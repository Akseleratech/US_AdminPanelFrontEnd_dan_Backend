import React, { useState, useMemo, useEffect } from 'react';
import { Edit, Trash2, Calendar, MapPin, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';
import { 
  getStatusColor, 
  getStatusIcon, 
  parseOrderId, 
  getServiceTypeColor, 
  getSourceColor 
} from '../../utils/helpers.jsx';
import useSpaces from '../../hooks/useSpaces';
import useLayanan from '../../hooks/useLayanan';
import useInvoices from '../../hooks/useInvoices';
import { ordersAPI } from '../../services/api.jsx';
import { useAuth } from '../auth/AuthContext.jsx';

const OrdersTable = ({ orders = [], onEdit, onDelete, onViewInvoice, onOrdersRefresh }) => {
  const { spaces, loading: spacesLoading } = useSpaces();
  const { layananList } = useLayanan();
  const { generateInvoiceFromOrder } = useInvoices();
  const { userRole } = useAuth();

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 15;

  // Calculate pagination values
  const totalItems = orders.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentOrders = orders.slice(startIndex, endIndex);

  // Pagination handlers
  const goToFirstPage = () => setCurrentPage(1);
  const goToLastPage = () => setCurrentPage(totalPages);
  const goToPreviousPage = () => setCurrentPage(prev => Math.max(prev - 1, 1));
  const goToNextPage = () => setCurrentPage(prev => Math.min(prev + 1, totalPages));
  const goToPage = (pageNumber) => setCurrentPage(pageNumber);

  // Reset to first page when orders change
  React.useEffect(() => {
    setCurrentPage(1);
  }, [orders.length]);

  // Generate page numbers for pagination
  const getPageNumbers = () => {
    const pages = [];
    const maxVisiblePages = 5;
    
    if (totalPages <= maxVisiblePages) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      let startPage = Math.max(1, currentPage - 2);
      let endPage = Math.min(totalPages, currentPage + 2);
      
      if (currentPage <= 3) {
        endPage = Math.min(maxVisiblePages, totalPages);
      } else if (currentPage >= totalPages - 2) {
        startPage = Math.max(1, totalPages - maxVisiblePages + 1);
      }
      
      for (let i = startPage; i <= endPage; i++) {
        pages.push(i);
      }
    }
    
    return pages;
  };

  const layananMap = {};
  if (Array.isArray(layananList)) {
    layananList.forEach((lay) => {
      if (lay && lay.id) {
        layananMap[lay.id] = lay.name;
      }
    });
  }

  const getLayananName = (spaceId) => {
    const space = spaces?.find((s) => s.id === spaceId);
    if (!space) return '-';
    return layananMap[space.category] || space.category || '-';
  };

  // Get city/regency name for a given spaceId
  const getCityProvince = (spaceId) => {
    const space = spaces?.find((s) => s.id === spaceId);
    if (!space) return '-';
    const city = space.location?.city || space.location?.regency || '';
    const province = space.location?.province || '';
    if (city && province) return `${city}, ${province}`;
    return city || province || '-';
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('id-ID');
  };

  const formatTime = (dateString) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleTimeString('id-ID', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatDateRange = (order) => {
    if (!order.startDate || !order.endDate) return '-';
    
    const startDate = new Date(order.startDate);
    const endDate = new Date(order.endDate);
    const pricingType = order.pricingType || 'daily';
    
    // Check if it's the same day
    const isSameDay = startDate.toDateString() === endDate.toDateString();
    
    // Calculate duration for display
    const getDurationInfo = () => {
      if (pricingType === 'hourly') {
        const hours = Math.ceil((endDate - startDate) / (1000 * 60 * 60));
        return `${hours} jam`;
      } else if (pricingType === 'daily') {
        const days = Math.floor((endDate - startDate) / (1000 * 60 * 60 * 24)) + 1;
        return days === 1 ? '1 hari' : `${days} hari`;
      } else if (pricingType === 'halfday') {
        const days = Math.floor((endDate - startDate) / (1000 * 60 * 60 * 24)) + 1;
        const sessions = days * 2;
        return `${sessions} sesi`;
      } else if (pricingType === 'monthly') {
        const months = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24 * 30));
        return months === 1 ? '1 bulan' : `${months} bulan`;
      }
      return '';
    };
    
    if (pricingType === 'hourly') {
      // For hourly: show date and time range
      if (isSameDay) {
        return (
          <div>
            <div className="font-medium">{formatDate(order.startDate)}</div>
            <div className="text-xs text-blue-600">
              🕐 {formatTime(order.startDate)} - {formatTime(order.endDate)}
            </div>
            <div className="text-xs text-blue-500 font-medium">
              ⏱️ {getDurationInfo()}
            </div>
          </div>
        );
      } else {
        // Hourly booking across multiple days (rare case)
        return (
          <div>
            <div className="text-xs">
              {formatDate(order.startDate)} {formatTime(order.startDate)}
            </div>
            <div className="text-xs">
              - {formatDate(order.endDate)} {formatTime(order.endDate)}
            </div>
            <div className="text-xs text-blue-500 font-medium">
              ⏱️ {getDurationInfo()}
            </div>
          </div>
        );
      }
    } else {
      // For daily, halfday, monthly: show date range
      if (isSameDay) {
        return (
          <div>
            <div className="font-medium">{formatDate(order.startDate)}</div>
            <div className="text-xs text-gray-600">
              {pricingType === 'halfday' && '🌅 Half Day'}
              {pricingType === 'daily' && '📅 Full Day'}
              {pricingType === 'monthly' && '📆 Monthly'}
            </div>
          </div>
        );
      } else {
        return (
          <div>
            <div className="text-xs font-medium">{formatDate(order.startDate)}</div>
            <div className="text-xs font-medium">- {formatDate(order.endDate)}</div>
            <div className="text-xs text-gray-600">
              {pricingType === 'halfday' && `🌅 ${getDurationInfo()}`}
              {pricingType === 'daily' && `📅 ${getDurationInfo()}`}
              {pricingType === 'monthly' && `📆 ${getDurationInfo()}`}
            </div>
          </div>
        );
      }
    }
  };

  const formatCurrency = (amount) => {
    if (!amount) return 'Rp 0';
    return `Rp ${Number(amount).toLocaleString('id-ID')}`;
  };

  // Keep track of orders we have already processed to avoid duplicate invoice creation
  const [processedOrders, setProcessedOrders] = useState(new Set());

  // Auto-generate invoice when an order moves to "confirmed" and has no invoice yet
  useEffect(() => {
    // Only auto-generate invoice for admin users
    if (userRole !== 'admin') return;

    if (!Array.isArray(orders)) return;

    const unprocessedConfirmed = orders.filter(
      (o) => o.status === 'confirmed' && !o.invoiceId && !processedOrders.has(o.id)
    );

    if (unprocessedConfirmed.length === 0) return;

    const runGeneration = async () => {
      for (const order of unprocessedConfirmed) {
        try {
          const invoice = await generateInvoiceFromOrder(order);

          // Mark as processed no matter success/fail to prevent infinite loops on permanent errors
          setProcessedOrders((prev) => new Set(prev).add(order.id));

          // Inform parent so orders list can refresh without reopening modal
          if (invoice && invoice.id && typeof onOrdersRefresh === 'function') {
            onOrdersRefresh();
          }
        } catch (err) {
          console.error('❌ Auto-generate invoice failed for order', order.id, err);
        }
      }
    };

    runGeneration();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orders]);

  // Component for displaying structured OrderID
  const StructuredOrderId = ({ orderId }) => {
    const parsed = parseOrderId(orderId);
    
    if (!parsed) {
      // Fallback for non-structured IDs
      return (
        <div className="font-mono text-sm" title={orderId}>
          <div className="truncate max-w-[180px]">{orderId}</div>
        </div>
      );
    }

    return (
      <div className="space-y-1">
        {/* Main ID Display */}
        <div className="font-mono text-sm font-medium text-gray-900" title={parsed.full}>
          {parsed.serviceType ? (
            `${parsed.prefix}-${parsed.date}-${parsed.serviceType}-${parsed.source}-${parsed.sequence}`
          ) : (
            `${parsed.prefix}-${parsed.date}-${parsed.source}-${parsed.sequence}`
          )}
        </div>
        
        {/* Badges */}
        <div className="flex flex-wrap gap-1">
          {/* Date Badge */}
          <span 
            className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-700"
            title={`Tanggal: ${parsed.formattedDate}`}
          >
            {parsed.formattedDate}
          </span>
          
          {/* Service Type Badge (show only if present) */}
          {parsed.serviceType && (
            <span 
              className={`inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium ${getServiceTypeColor(parsed.serviceType)}`}
              title={`Tipe Layanan: ${parsed.serviceTypeLabel}`}
            >
              {parsed.serviceType}
            </span>
          )}
          
          {/* Source Badge */}
          <span 
            className={`inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium ${getSourceColor(parsed.source)}`}
            title={`Sumber: ${parsed.sourceLabel}`}
          >
            {parsed.source}
          </span>
        </div>
      </div>
    );
  };

  // Pagination Controls Component
  const PaginationControls = () => {
    if (totalPages <= 1) return null;

    return (
      <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-primary-200 sm:px-6">
        <div className="flex-1 flex justify-between sm:hidden">
          <button
            onClick={goToPreviousPage}
            disabled={currentPage === 1}
            className={`relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md ${
              currentPage === 1 
                ? 'text-gray-400 bg-gray-100 cursor-not-allowed' 
                : 'text-gray-700 bg-white hover:bg-gray-50'
            }`}
          >
            Previous
          </button>
          <button
            onClick={goToNextPage}
            disabled={currentPage === totalPages}
            className={`ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md ${
              currentPage === totalPages 
                ? 'text-gray-400 bg-gray-100 cursor-not-allowed' 
                : 'text-gray-700 bg-white hover:bg-gray-50'
            }`}
          >
            Next
          </button>
        </div>
        
        <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
          <div>
            <p className="text-sm text-gray-700">
              Menampilkan{' '}
              <span className="font-medium">{startIndex + 1}</span> sampai{' '}
              <span className="font-medium">{Math.min(endIndex, totalItems)}</span> dari{' '}
              <span className="font-medium">{totalItems}</span> hasil
            </p>
          </div>
          
          <div>
            <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
              {/* First Page Button */}
              <button
                onClick={goToFirstPage}
                disabled={currentPage === 1}
                className={`relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 text-sm font-medium ${
                  currentPage === 1 
                    ? 'text-gray-400 bg-gray-100 cursor-not-allowed' 
                    : 'text-gray-500 bg-white hover:bg-gray-50'
                }`}
                title="Halaman Pertama"
              >
                <ChevronsLeft className="h-4 w-4" />
              </button>
              
              {/* Previous Page Button */}
              <button
                onClick={goToPreviousPage}
                disabled={currentPage === 1}
                className={`relative inline-flex items-center px-2 py-2 border border-gray-300 text-sm font-medium ${
                  currentPage === 1 
                    ? 'text-gray-400 bg-gray-100 cursor-not-allowed' 
                    : 'text-gray-500 bg-white hover:bg-gray-50'
                }`}
                title="Halaman Sebelumnya"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              
              {/* Page Numbers */}
              {getPageNumbers().map((pageNumber) => (
                <button
                  key={pageNumber}
                  onClick={() => goToPage(pageNumber)}
                  className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                    pageNumber === currentPage
                      ? 'z-10 bg-primary-50 border-primary-500 text-primary-600'
                      : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                  }`}
                >
                  {pageNumber}
                </button>
              ))}
              
              {/* Next Page Button */}
              <button
                onClick={goToNextPage}
                disabled={currentPage === totalPages}
                className={`relative inline-flex items-center px-2 py-2 border border-gray-300 text-sm font-medium ${
                  currentPage === totalPages 
                    ? 'text-gray-400 bg-gray-100 cursor-not-allowed' 
                    : 'text-gray-500 bg-white hover:bg-gray-50'
                }`}
                title="Halaman Selanjutnya"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
              
              {/* Last Page Button */}
              <button
                onClick={goToLastPage}
                disabled={currentPage === totalPages}
                className={`relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 text-sm font-medium ${
                  currentPage === totalPages 
                    ? 'text-gray-400 bg-gray-100 cursor-not-allowed' 
                    : 'text-gray-500 bg-white hover:bg-gray-50'
                }`}
                title="Halaman Terakhir"
              >
                <ChevronsRight className="h-4 w-4" />
              </button>
            </nav>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="bg-white border border-primary-200 table-green-theme">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-primary-200">
          <thead className="bg-primary-50 border-b border-primary-200">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-primary-700 uppercase tracking-wider min-w-[200px]">Order ID</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-primary-700 uppercase tracking-wider min-w-[180px]">Rentang Tanggal</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-primary-700 uppercase tracking-wider min-w-[180px]">Nama</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-primary-700 uppercase tracking-wider min-w-[140px]">Space</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-primary-700 uppercase tracking-wider min-w-[120px]">Layanan</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-primary-700 uppercase tracking-wider min-w-[120px]">Base Price</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-primary-700 uppercase tracking-wider min-w-[120px]">Invoice</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-primary-700 uppercase tracking-wider min-w-[200px]">Status Order</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-primary-700 uppercase tracking-wider min-w-[100px]">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-primary-100">
            {currentOrders && currentOrders.length > 0 ? (
              currentOrders.map((order) => (
                <tr key={order.id} className="hover:bg-primary-50 transition-colors duration-150">
                  {/* Order ID */}
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">
                    <StructuredOrderId orderId={order.orderId || order.id} />
                  </td>

                  {/* Date Range */}
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <div className="max-w-[180px]">
                      <div className="flex items-start">
                        <Calendar className="w-3 h-3 text-gray-400 mr-1 flex-shrink-0 mt-0.5" />
                        <div className="flex-1 min-w-0">
                          {formatDateRange(order)}
                        </div>
                      </div>
                      {order.notes && (
                        <div className="text-xs text-gray-500 truncate mt-1 ml-4" title={order.notes}>
                          💬 {order.notes}
                        </div>
                      )}
                    </div>
                  </td>

                  {/* Customer */}
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <div className="max-w-[160px]">
                      <div className="font-medium truncate" title={order.customerName || order.customer}>
                        {order.customerName || order.customer}
                      </div>
                      <div className="text-xs text-gray-500 truncate" title={order.customerEmail}>
                        {order.customerEmail}
                      </div>
                    </div>
                  </td>

                  {/* Space */}
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <div className="max-w-[160px]">
                      <div className="flex items-center">
                        <MapPin className="w-3 h-3 text-gray-400 mr-1 flex-shrink-0" />
                        <span className="truncate" title={order.spaceName || order.location}>
                          {order.spaceName || order.location}
                        </span>
                      </div>
                      {/* City/Regency */}
                      <div className="text-xs text-gray-500 ml-4 truncate" title={spacesLoading ? '-' : getCityProvince(order.spaceId)}>
                        {spacesLoading ? '-' : getCityProvince(order.spaceId)}
                      </div>
                    </div>
                  </td>

                  {/* Layanan */}
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {spacesLoading ? '-' : getLayananName(order.spaceId)}
                  </td>

                  {/* Base Price */}
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">
                    {formatCurrency(order.amountBase)}
                  </td>

                  {/* Invoice */}
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {order.invoiceId ? (
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => onViewInvoice && onViewInvoice(order)}
                          className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 hover:bg-green-200 transition-colors"
                          title="Lihat Invoice"
                        >
                          Generated
                        </button>
                      </div>
                    ) : (
                      <button 
                        onClick={() => handleGenerateInvoice(order)}
                        className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 hover:bg-blue-200 transition-colors"
                        title="Generate Invoice"
                      >
                        Generate
                      </button>
                    )}
                  </td>

                  {/* Status */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                      {getStatusIcon(order.status)}
                      <span className="ml-1 capitalize">{order.status}</span>
                    </div>
                  </td>

                  {/* Actions */}
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      <button 
                        onClick={() => onEdit && onEdit(order)}
                        className="text-green-600 hover:text-green-900 transition-colors"
                        title="Edit Order"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => onDelete && onDelete(order.id)}
                        className="text-red-600 hover:text-red-900 transition-colors"
                        title="Delete Order"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="9" className="px-6 py-8 text-center text-sm text-gray-500">
                  <div className="flex flex-col items-center justify-center">
                    <div className="text-gray-400 text-lg mb-2">📦</div>
                    <p className="text-gray-500 font-medium">No orders found</p>
                    <p className="text-gray-400 text-xs mt-1">Orders will appear here when available.</p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      
      {/* Pagination Controls */}
      <PaginationControls />
    </div>
  );
};

export default OrdersTable; 