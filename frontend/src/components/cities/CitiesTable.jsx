import React from 'react';
import { Eye, Edit, Trash2 } from 'lucide-react';

const CitiesTable = ({ cities, onEdit, onDelete }) => {
  return (
    <div className="bg-white border border-primary-200 table-green-theme">
      <table className="min-w-full divide-y divide-primary-200">
        <thead className="bg-primary-50 border-b border-primary-200">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-primary-700 uppercase tracking-wider">Kota/Kabupaten</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-primary-700 uppercase tracking-wider">Provinsi</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-primary-700 uppercase tracking-wider">Jumlah Lokasi</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-primary-700 uppercase tracking-wider">Total Spaces</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-primary-700 uppercase tracking-wider">Actions</th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-primary-100">
          {cities.map((city) => (
            <tr key={city.id} className="hover:bg-primary-50 transition-colors duration-150">
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{city.name}</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{city.province || '-'}</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{city.locations}</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{city.totalSpaces}</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                <div className="flex space-x-2">
                  <button className="text-primary-600 hover:text-primary-800">
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