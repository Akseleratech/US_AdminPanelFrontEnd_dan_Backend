import React from 'react';
import { Users, DollarSign, Calendar, TrendingUp } from 'lucide-react';

const TopCustomers = ({ customers }) => {
  const formatCurrency = (value) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Top Customers</h3>
        <Users className="w-5 h-5 text-gray-400" />
      </div>
      
      <div className="space-y-4">
        {customers.map((customer, index) => (
          <div key={customer.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
            <div className="flex items-center space-x-3">
              <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                <span className="text-sm font-medium text-blue-600">#{index + 1}</span>
              </div>
              <div>
                <p className="font-medium text-gray-900">{customer.name}</p>
                <p className="text-sm text-gray-600">{customer.email}</p>
              </div>
            </div>
            
            <div className="text-right">
              <div className="flex items-center space-x-4">
                <div className="text-right">
                  <div className="flex items-center text-sm text-gray-600">
                    <DollarSign className="w-4 h-4 mr-1" />
                    {formatCurrency(customer.totalRevenue)}
                  </div>
                  <div className="flex items-center text-sm text-gray-600">
                    <Calendar className="w-4 h-4 mr-1" />
                    {customer.totalBookings} bookings
                  </div>
                </div>
                <div className="flex items-center text-sm text-green-600">
                  <TrendingUp className="w-4 h-4 mr-1" />
                  {customer.growthRate}%
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TopCustomers;