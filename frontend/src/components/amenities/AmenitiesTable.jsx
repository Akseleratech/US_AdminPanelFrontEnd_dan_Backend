import React from 'react';
import { format } from 'date-fns';
import { Edit, Trash2, Image, Package } from 'lucide-react';
import { getStatusColor, getStatusIcon } from '../../utils/helpers.jsx';

const AmenitiesTable = ({ amenities, onEdit, onDelete, onToggleStatus, loading }) => {
  return (
    <div className="bg-white border border-primary-200 table-green-theme rounded-lg overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-primary-200">
          <thead className="bg-primary-50 border-b border-primary-200">
            <tr>
              <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-primary-700 uppercase tracking-wider">Icon</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-primary-700 uppercase tracking-wider">Name</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-primary-700 uppercase tracking-wider">Description</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-primary-700 uppercase tracking-wider">Status</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-primary-700 uppercase tracking-wider">Created At</th>
              <th scope="col" className="relative px-6 py-3 text-right text-xs font-medium text-primary-700 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-primary-100">
            {loading ? (
              <tr>
                <td colSpan="6" className="px-6 py-8 text-center">
                  <div className="flex flex-col items-center justify-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mb-4"></div>
                    <p className="text-gray-500 font-medium">Memuat fasilitas...</p>
                  </div>
                </td>
              </tr>
            ) : amenities && amenities.length > 0 ? (
              amenities.map((amenity) => (
                <tr key={amenity.id} className="hover:bg-primary-50 transition-colors duration-150">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="w-10 h-10 flex items-center justify-center">
                      {amenity.icon ? (
                        <img src={amenity.icon} alt={amenity.name} className="w-full h-full object-contain rounded-md" />
                      ) : (
                        <div className="w-10 h-10 bg-gray-100 rounded-md flex items-center justify-center">
                          <Image className="w-5 h-5 text-gray-400" />
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{amenity.name}</td>
                  <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">{amenity.description}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <button 
                      onClick={() => onToggleStatus(amenity.id)} 
                      className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${getStatusColor(amenity.isActive ? 'active' : 'inactive')}`}
                    >
                      {getStatusIcon(amenity.isActive ? 'active' : 'inactive')}
                      <span className="ml-1 capitalize">{amenity.isActive ? 'Active' : 'Inactive'}</span>
                    </button>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {amenity.createdAt?.seconds ? format(new Date(amenity.createdAt.seconds * 1000), 'd MMM yyyy') : 'N/A'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center justify-end space-x-2">
                      <button
                        onClick={() => onEdit(amenity)}
                        className="text-green-600 hover:text-green-900 p-1 rounded-full hover:bg-green-100"
                        title="Edit Fasilitas"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => onDelete(amenity.id)}
                        className="text-red-600 hover:text-red-900 p-1 rounded-full hover:bg-red-100"
                        title="Hapus Fasilitas"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="6" className="px-6 py-8 text-center text-sm text-gray-500">
                  <div className="flex flex-col items-center justify-center">
                    <Package className="w-12 h-12 text-gray-300 mb-4" />
                    <p className="text-gray-500 font-medium">Fasilitas tidak ditemukan</p>
                    <p className="text-gray-400 text-xs mt-1">Buat fasilitas pertama Anda untuk memulai</p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AmenitiesTable; 