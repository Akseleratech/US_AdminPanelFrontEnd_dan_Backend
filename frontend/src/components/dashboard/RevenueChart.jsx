import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const RevenueChart = ({ data = [], period = 'monthly' }) => {
  const formatCurrency = (value) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const formatPeriod = (value) => {
    if (period === 'monthly') {
      return new Date(value).toLocaleDateString('id-ID', { month: 'short', year: 'numeric' });
    }
    return new Date(value).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
  };

  if (!data || data.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Revenue Trends</h3>
          <div className="text-sm text-gray-500 capitalize">{period} view</div>
        </div>
        <div className="h-300 flex items-center justify-center text-gray-500">
          No revenue data available
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Revenue Trends</h3>
        <div className="text-sm text-gray-500 capitalize">{period} view</div>
      </div>
      
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis 
            dataKey="period" 
            tick={{ fontSize: 12 }}
            tickFormatter={formatPeriod}
            stroke="#6b7280"
          />
          <YAxis 
            tick={{ fontSize: 12 }}
            tickFormatter={formatCurrency}
            stroke="#6b7280"
          />
          <Tooltip 
            formatter={(value) => [formatCurrency(value), 'Revenue']}
            labelFormatter={formatPeriod}
            contentStyle={{
              backgroundColor: '#ffffff',
              border: '1px solid #e5e7eb',
              borderRadius: '0.5rem',
              boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)'
            }}
          />
          <Legend />
          <Line 
            type="monotone" 
            dataKey="revenue" 
            stroke="#3b82f6" 
            strokeWidth={2}
            dot={{ fill: '#3b82f6', strokeWidth: 2, r: 4 }}
            activeDot={{ r: 6, stroke: '#3b82f6', strokeWidth: 2 }}
          />
          <Line 
            type="monotone" 
            dataKey="target" 
            stroke="#ef4444" 
            strokeWidth={2}
            strokeDasharray="5 5"
            dot={{ fill: '#ef4444', strokeWidth: 2, r: 4 }}
            activeDot={{ r: 6, stroke: '#ef4444', strokeWidth: 2 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default RevenueChart;