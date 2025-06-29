import React from 'react';
import { format } from 'date-fns';
import { Edit, Trash2, ToggleLeft, ToggleRight } from 'lucide-react';

const AmenitiesTable = ({ amenities, onEdit, onDelete, onToggleStatus, loading }) => {

  const handleToggle = (id, currentStatus) => {
    onToggleStatus(id, !currentStatus);
  };

  return (
    <div className="overflow-x-auto bg-white rounded-lg shadow">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Icon</th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created At</th>
            <th scope="col" className="relative px-6 py-3">
              <span className="sr-only">Actions</span>
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {loading ? (
            <tr>
              <td colSpan="6" className="text-center py-4">
                <div className="flex justify-center items-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
                </div>
              </td>
            </tr>
          ) : amenities.length === 0 ? (
            <tr>
              <td colSpan="6" className="text-center py-4 text-sm text-gray-500">No amenities found.</td>
            </tr>
          ) : (
            amenities.map((amenity) => (
              <tr key={amenity.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{amenity.name}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{amenity.description}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{amenity.icon}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  <button onClick={() => handleToggle(amenity.id, amenity.isActive)} className={`flex items-center ${amenity.isActive ? 'text-green-600' : 'text-gray-400'}`}>
                    {amenity.isActive ? <ToggleRight size={20} /> : <ToggleLeft size={20} />}
                    <span className="ml-2">{amenity.isActive ? 'Active' : 'Inactive'}</span>
                  </button>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {amenity.createdAt ? format(new Date(amenity.createdAt.seconds * 1000), 'PPpp') : 'N/A'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <div className="flex items-center justify-end space-x-4">
                    <button onClick={() => onEdit(amenity)} className="text-indigo-600 hover:text-indigo-900">
                      <Edit className="w-5 h-5" />
                    </button>
                    <button onClick={() => onDelete(amenity.id)} className="text-red-600 hover:text-red-900">
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
};

export default AmenitiesTable; 