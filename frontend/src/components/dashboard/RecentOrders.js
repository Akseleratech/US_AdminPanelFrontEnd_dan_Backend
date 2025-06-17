import React from 'react';
import { getStatusColor, getStatusIcon } from '../../utils/helpers';

const RecentOrders = ({ recentOrders }) => {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <h3 className="text-lg font-semibold mb-4">Recent Orders</h3>
      <div className="space-y-3">
        {recentOrders.map((order) => (
          <div key={order.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div>
              <p className="font-medium text-gray-900">{order.customer}</p>
              <p className="text-sm text-gray-600">{order.service} - {order.location}</p>
            </div>
            <div className="text-right">
              <p className="font-medium text-gray-900">Rp {order.amount.toLocaleString()}</p>
              <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                {getStatusIcon(order.status)}
                <span className="ml-1 capitalize">{order.status}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default RecentOrders; 