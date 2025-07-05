import React from 'react';
import { Edit, Trash2, Calendar, MapPin } from 'lucide-react';
import { 
  getStatusColor, 
  getStatusIcon, 
  parseOrderId, 
  getServiceTypeColor, 
  getSourceColor 
} from '../../utils/helpers.jsx';
import useSpaces from '../../hooks/useSpaces';
import useLayanan from '../../hooks/useLayanan';

const OrdersTable = ({ orders = [], onEdit, onDelete }) => {
  const { spaces, loading: spacesLoading } = useSpaces();
  const { layananList } = useLayanan();

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
              <th className="px-6 py-3 text-left text-xs font-medium text-primary-700 uppercase tracking-wider min-w-[120px]">Amount</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-primary-700 uppercase tracking-wider min-w-[200px]">Status Pembayaran</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-primary-700 uppercase tracking-wider min-w-[100px]">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-primary-100">
            {orders && orders.length > 0 ? (
              orders.map((order) => (
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

                  {/* Amount */}
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">
                    {formatCurrency(order.amount)}
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
                <td colSpan="8" className="px-6 py-8 text-center text-sm text-gray-500">
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
    </div>
  );
};

export default OrdersTable; 