import React from 'react';
import { Activity, MapPin, Star, DollarSign } from 'lucide-react';

const QuickStats = ({ quickStats }) => {
  const statItems = [
    {
      label: 'Occupancy Rate',
      value: quickStats?.occupancyRate || 'N/A',
      icon: Activity,
      color: 'text-blue-600'
    },
    {
      label: 'Avg Booking Value',
      value: quickStats?.averageBookingValue || 'N/A',
      icon: DollarSign,
      color: 'text-green-600'
    },
    {
      label: 'Customer Satisfaction',
      value: quickStats?.customerSatisfaction || 'N/A',
      icon: Star,
      color: 'text-yellow-600'
    },
    {
      label: 'Active Locations',
      value: quickStats?.activeLocations || 'N/A',
      icon: MapPin,
      color: 'text-purple-600'
    }
  ];

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <h3 className="text-lg font-semibold mb-4">Quick Stats</h3>
      <div className="space-y-4">
        {statItems.map((item, index) => (
          <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center space-x-3">
              <div className={`flex-shrink-0 w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center`}>
                <item.icon className={`w-4 h-4 ${item.color}`} />
              </div>
              <span className="text-gray-700 font-medium">{item.label}</span>
            </div>
            <div className="text-right">
              <div className="font-semibold text-gray-900">{item.value}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default QuickStats; 