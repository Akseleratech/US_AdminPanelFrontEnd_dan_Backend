import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';

/**
 * BookingStatusChart Component
 * 
 * Displays booking status distribution in a pie chart
 * 
 * Expected data format:
 * [
 *   { status: 'pending', value: 15, total: 100 },      // Menunggu konfirmasi/pembayaran
 *   { status: 'confirmed', value: 25, total: 100 },    // Sudah dikonfirmasi, menunggu tanggal
 *   { status: 'active', value: 20, total: 100 },       // Sedang berlangsung
 *   { status: 'completed', value: 35, total: 100 },    // Selesai
 *   { status: 'cancelled', value: 5, total: 100 }      // Dibatalkan
 * ]
 * 
 * Status values must match order status from OrdersTable.jsx:
 * - pending: Menunggu konfirmasi/pembayaran
 * - confirmed: Sudah dikonfirmasi, menunggu tanggal
 * - active: Sedang berlangsung
 * - completed: Selesai
 * - cancelled: Dibatalkan
 * 
 * Colors are consistent with getStatusColor() in utils/helpers.jsx:
 * - pending: Yellow (#d97706)
 * - confirmed: Green (#059669)
 * - active: Green (#059669)
 * - completed: Sky Blue (#0ea5e9)
 * - cancelled: Red (#dc2626)
 * 
 * Example implementation in Dashboard.jsx:
 * const bookingStatusData = generateBookingStatusData();
 * <BookingStatusChart data={bookingStatusData} />
 */
const BookingStatusChart = ({ data = [] }) => {
  const COLORS = {
    pending: '#ca8a04',      // yellow-600 to match helpers.jsx
    confirmed: '#059669',    // green-600 to match helpers.jsx  
    active: '#059669',       // green-600 to match helpers.jsx
    completed: '#2563eb',    // primary-600 (blue-600) to match helpers.jsx
    cancelled: '#dc2626'     // red-600 to match helpers.jsx
  };

  const RADIAN = Math.PI / 180;
  const renderCustomizedLabel = ({
    cx, cy, midAngle, innerRadius, outerRadius, percent
  }) => {
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    return (
      <text 
        x={x} 
        y={y} 
        fill="white" 
        textAnchor={x > cx ? 'start' : 'end'} 
        dominantBaseline="central"
        fontSize="12"
        fontWeight="bold"
      >
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    );
  };

  const getStatusLabel = (status) => {
    const labels = {
      'pending': 'Menunggu Konfirmasi',
      'confirmed': 'Sudah Dikonfirmasi',
      'active': 'Sedang Berlangsung',
      'completed': 'Selesai',
      'cancelled': 'Dibatalkan'
    };
    return labels[status] || status;
  };

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-medium text-gray-900">{getStatusLabel(data.status)}</p>
          <p className="text-sm text-gray-600">
            {data.value} bookings ({((data.value / data.total) * 100).toFixed(1)}%)
          </p>
        </div>
      );
    }
    return null;
  };

  if (!data || data.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Booking Status Distribution</h3>
        <div className="h-300 flex items-center justify-center text-gray-500">
          No booking data available
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Booking Status Distribution</h3>
      
      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={renderCustomizedLabel}
            outerRadius={80}
            fill="#8884d8"
            dataKey="value"
            nameKey="status"
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[entry.status]} />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
          <Legend 
            verticalAlign="bottom" 
            height={36}
            formatter={(value) => <span className="text-sm">{getStatusLabel(value)}</span>}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
};

export default BookingStatusChart;