import React from 'react';
import { Activity, MapPin, Star, DollarSign } from 'lucide-react';

const QuickStats = ({ quickStats }) => {
  const statItems = [
    {
      label: 'Tingkat hunian',
      value: quickStats?.occupancyRate || 'N/A',
      icon: Activity,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50'
    },
    {
      label: 'Nilai Rata-rata Pesanan',
      value: quickStats?.averageBookingValue || 'N/A',
      icon: DollarSign,
      color: 'text-green-600',
      bgColor: 'bg-green-50'
    },

    {
      label: 'Active Locations',
      value: quickStats?.activeLocations || 'N/A',
      icon: MapPin,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50'
    }
  ];

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 h-full">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Stats</h3>
      <div className="space-y-3">
        {statItems.map((item, index) => (
          <div key={index} className={`flex items-center justify-between p-3 ${item.bgColor} rounded-lg border border-gray-100`}>
            <div className="flex items-center space-x-3">
              <div className={`flex-shrink-0 w-8 h-8 rounded-full bg-white flex items-center justify-center border border-gray-200`}>
                <item.icon className={`w-4 h-4 ${item.color}`} />
              </div>
              <span className="text-gray-700 font-medium text-sm">{item.label}</span>
            </div>
            <div className="text-right">
              <div className="font-semibold text-gray-900 text-sm">{item.value}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default QuickStats; 