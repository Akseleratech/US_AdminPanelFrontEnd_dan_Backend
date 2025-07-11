import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const CityPerformanceChart = ({ data }) => {
  const formatCurrency = (value) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-medium text-gray-900">{label}</p>
          <p className="text-sm text-blue-600">
            Revenue: {formatCurrency(payload[0].value)}
          </p>
          <p className="text-sm text-green-600">
            Bookings: {payload[1].value}
          </p>
          <p className="text-sm text-purple-600">
            Spaces: {payload[2].value}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">City Performance</h3>
      
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data} barCategoryGap="20%">
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis 
            dataKey="cityName" 
            tick={{ fontSize: 12 }}
            stroke="#6b7280"
          />
          <YAxis 
            yAxisId="left"
            tick={{ fontSize: 12 }}
            stroke="#6b7280"
            tickFormatter={formatCurrency}
          />
          <YAxis 
            yAxisId="right"
            orientation="right"
            tick={{ fontSize: 12 }}
            stroke="#6b7280"
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend />
          <Bar 
            yAxisId="left"
            dataKey="revenue" 
            fill="#3b82f6" 
            name="Revenue"
            radius={[4, 4, 0, 0]}
          />
          <Bar 
            yAxisId="right"
            dataKey="bookings" 
            fill="#10b981" 
            name="Bookings"
            radius={[4, 4, 0, 0]}
          />
          <Bar 
            yAxisId="right"
            dataKey="spaces" 
            fill="#8b5cf6" 
            name="Active Spaces"
            radius={[4, 4, 0, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default CityPerformanceChart;