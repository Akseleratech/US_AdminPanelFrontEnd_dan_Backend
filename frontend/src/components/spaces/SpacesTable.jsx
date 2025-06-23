import React from 'react';
import { Eye, Edit, Trash2, MapPin } from 'lucide-react';
import { getStatusColor, getStatusIcon } from '../../utils/helpers.jsx';

const SpacesTable = ({ spaces, onEdit, onDelete, loading }) => {
  return (
    <div className="bg-white border border-primary-200 table-green-theme rounded-lg overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-primary-200">
        <thead className="bg-primary-50 border-b border-primary-200">
          <tr>
            <th className="px-3 md:px-6 py-3 text-left text-xs font-medium text-primary-700 uppercase tracking-wider min-w-[120px]">Name</th>
            <th className="px-3 md:px-6 py-3 text-left text-xs font-medium text-primary-700 uppercase tracking-wider min-w-[100px]">Brand</th>
            <th className="px-3 md:px-6 py-3 text-left text-xs font-medium text-primary-700 uppercase tracking-wider min-w-[100px]">Category</th>
            <th className="px-3 md:px-6 py-3 text-left text-xs font-medium text-primary-700 uppercase tracking-wider min-w-[200px]">Location</th>
            <th className="px-3 md:px-6 py-3 text-left text-xs font-medium text-primary-700 uppercase tracking-wider min-w-[80px]">Capacity</th>
            <th className="px-3 md:px-6 py-3 text-left text-xs font-medium text-primary-700 uppercase tracking-wider min-w-[120px]">Daily Price</th>
            <th className="px-3 md:px-6 py-3 text-left text-xs font-medium text-primary-700 uppercase tracking-wider min-w-[100px]">Status</th>
            <th className="px-3 md:px-6 py-3 text-left text-xs font-medium text-primary-700 uppercase tracking-wider min-w-[120px]">Actions</th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-primary-100">
          {loading ? (
            <tr>
              <td colSpan="8" className="px-3 md:px-6 py-8 text-center">
                <div className="flex flex-col items-center justify-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mb-4"></div>
                  <p className="text-gray-500 font-medium">Loading spaces...</p>
                </div>
              </td>
            </tr>
          ) : spaces && spaces.length > 0 ? (
            spaces.map((space) => (
              <tr key={space.id} className="hover:bg-primary-50 transition-colors duration-150">
                <td className="px-3 md:px-6 py-4 text-sm font-medium text-gray-900">
                  <div className="min-w-0 break-words">{space.name}</div>
                </td>
                <td className="px-3 md:px-6 py-4 text-sm text-gray-900">
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-primary-100 text-primary-800 whitespace-nowrap">
                    {space.brand}
                  </span>
                </td>
                <td className="px-3 md:px-6 py-4 text-sm text-gray-900">
                  <span className="capitalize whitespace-nowrap">{space.category}</span>
                </td>
                <td className="px-3 md:px-6 py-4 text-sm text-gray-900">
                  <div className="flex items-start min-w-0">
                    <MapPin className="w-4 h-4 mr-1 text-gray-400 flex-shrink-0 mt-0.5" />
                    <div className="min-w-0">
                      <div className="font-medium truncate">{space.location?.city}</div>
                      <div className="text-xs text-gray-500 truncate">{space.location?.address}</div>
                    </div>
                  </div>
                </td>
                <td className="px-3 md:px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {space.capacity} orang
                </td>
                <td className="px-3 md:px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  <div className="truncate">Rp {space.pricing?.daily?.toLocaleString() || 0}</div>
                </td>
                <td className="px-3 md:px-6 py-4 whitespace-nowrap">
                  <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(space.isActive ? 'active' : 'inactive')}`}>
                    {getStatusIcon(space.isActive ? 'active' : 'inactive')}
                    <span className="ml-1 capitalize">{space.isActive ? 'Active' : 'Inactive'}</span>
                  </div>
                </td>
                <td className="px-3 md:px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <div className="flex space-x-1 md:space-x-2">
                    <button className="text-primary-600 hover:text-primary-800 p-1">
                      <Eye className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => onEdit(space)}
                      className="text-green-600 hover:text-green-900 p-1"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => onDelete('space', space.id)}
                      className="text-red-600 hover:text-red-900 p-1"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan="8" className="px-3 md:px-6 py-8 text-center text-sm text-gray-500">
                <div className="flex flex-col items-center justify-center">
                  <svg className="w-12 h-12 text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                  <p className="text-gray-500 font-medium">No spaces found</p>
                  <p className="text-gray-400 text-xs mt-1">Add your first space to get started</p>
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

export default SpacesTable; 