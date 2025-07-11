import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const SpaceUtilizationChart = ({ data = [] }) => {
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-medium text-gray-900">{label}</p>
          <p className="text-sm text-blue-600">
            Occupancy: {payload[0].value}%
          </p>
          <p className="text-sm text-green-600">
            Capacity: {payload[1].value}%
          </p>
        </div>
      );
    }
    return null;
  };

  if (!data || data.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Space Utilization</h3>
        <div className="h-300 flex items-center justify-center text-gray-500">
          No space data available
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Space Utilization</h3>
      
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data} barCategoryGap="20%">
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis 
            dataKey="spaceName" 
            tick={{ fontSize: 12 }}
            stroke="#6b7280"
            angle={-45}
            textAnchor="end"
            height={60}
          />
          <YAxis 
            tick={{ fontSize: 12 }}
            stroke="#6b7280"
            domain={[0, 100]}
            tickFormatter={(value) => `${value}%`}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend />
          <Bar 
            dataKey="occupancy" 
            fill="#3b82f6" 
            name="Occupancy Rate"
            radius={[4, 4, 0, 0]}
          />
          <Bar 
            dataKey="capacity" 
            fill="#10b981" 
            name="Available Capacity"
            radius={[4, 4, 0, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default SpaceUtilizationChart;