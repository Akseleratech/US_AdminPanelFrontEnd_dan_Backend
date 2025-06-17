import React from 'react';

const QuickStats = ({ quickStats }) => {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <h3 className="text-lg font-semibold mb-4">Quick Stats</h3>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-gray-600">Occupancy Rate</span>
          <span className="font-medium text-gray-900">{quickStats.occupancyRate || 'N/A'}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-gray-600">Average Booking Value</span>
          <span className="font-medium text-gray-900">{quickStats.averageBookingValue || 'N/A'}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-gray-600">Customer Satisfaction</span>
          <span className="font-medium text-gray-900">{quickStats.customerSatisfaction || 'N/A'}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-gray-600">Active Locations</span>
          <span className="font-medium text-gray-900">{quickStats.activeLocations || 'N/A'}</span>
        </div>
      </div>
    </div>
  );
};

export default QuickStats; 