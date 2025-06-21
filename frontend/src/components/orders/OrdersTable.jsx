import React from 'react';
import { Eye, Edit } from 'lucide-react';
import { getStatusColor, getStatusIcon } from '../../utils/helpers.jsx';

const OrdersTable = ({ orders }) => {
  return (
    <div className="bg-white border border-primary-200 table-green-theme">
      <table className="min-w-full divide-y divide-primary-200">
        <thead className="bg-primary-50 border-b border-primary-200">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-primary-700 uppercase tracking-wider">Order ID</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-primary-700 uppercase tracking-wider">Customer</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-primary-700 uppercase tracking-wider">Service</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-primary-700 uppercase tracking-wider">Location</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-primary-700 uppercase tracking-wider">Amount</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-primary-700 uppercase tracking-wider">Status</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-primary-700 uppercase tracking-wider">Date</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-primary-700 uppercase tracking-wider">Actions</th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-primary-100">
          {orders.map((order) => (
            <tr key={order.id} className="hover:bg-primary-50 transition-colors duration-150">
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{order.id}</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{order.customer}</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{order.service}</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{order.location}</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">Rp {order.amount.toLocaleString()}</td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                  {getStatusIcon(order.status)}
                  <span className="ml-1 capitalize">{order.status}</span>
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{order.date}</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                <div className="flex space-x-2">
                  <button className="text-primary-600 hover:text-primary-800">
                    <Eye className="w-4 h-4" />
                  </button>
                  <button className="text-green-600 hover:text-green-900">
                    <Edit className="w-4 h-4" />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default OrdersTable; 