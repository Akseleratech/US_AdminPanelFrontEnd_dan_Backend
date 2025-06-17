import React from 'react';
import { Eye, Edit, Trash2 } from 'lucide-react';
import { getStatusColor, getStatusIcon } from '../../utils/helpers';

const ServicesTable = ({ services, onEdit, onDelete }) => {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nama Layanan</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Deskripsi</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Harga Dasar</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {services.map((service) => (
            <tr key={service.id} className="hover:bg-gray-50">
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{service.name}</td>
              <td className="px-6 py-4 text-sm text-gray-900 max-w-xs truncate">{service.description}</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">Rp {service.price.toLocaleString()}</td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(service.status)}`}>
                  {getStatusIcon(service.status)}
                  <span className="ml-1 capitalize">{service.status}</span>
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                <div className="flex space-x-2">
                  <button className="text-blue-600 hover:text-blue-900">
                    <Eye className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => onEdit(service)}
                    className="text-green-600 hover:text-green-900"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={() => onDelete('service', service.id)}
                    className="text-red-600 hover:text-red-900"
                  >
                    <Trash2 className="w-4 h-4" />
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

export default ServicesTable; 