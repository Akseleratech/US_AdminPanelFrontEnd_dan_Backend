import React from 'react';
import { Eye, Edit, Trash2 } from 'lucide-react';
import { getStatusColor, getStatusIcon } from '../../utils/helpers';

const CitiesTable = ({ cities, onEdit, onDelete }) => {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nama Kota</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Jumlah Lokasi</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Spaces</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {cities.map((city) => (
            <tr key={city.id} className="hover:bg-gray-50">
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{city.name}</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{city.locations}</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{city.totalSpaces}</td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(city.status)}`}>
                  {getStatusIcon(city.status)}
                  <span className="ml-1 capitalize">{city.status}</span>
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                <div className="flex space-x-2">
                  <button className="text-blue-600 hover:text-blue-900">
                    <Eye className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => onEdit(city)}
                    className="text-green-600 hover:text-green-900"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={() => onDelete('city', city.id)}
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

export default CitiesTable; 