import React from 'react';
import { Eye, Edit, Trash2, MapPin } from 'lucide-react';
import { getStatusColor, getStatusIcon } from '../../utils/helpers.jsx';

const BuildingsTable = ({ buildings, onEdit, onDelete, loading }) => {
  return (
    <div className="bg-white border border-primary-200 table-green-theme rounded-lg overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-primary-200">
        <thead className="bg-primary-50 border-b border-primary-200">
          <tr>
            <th className="px-3 md:px-6 py-3 text-left text-xs font-medium text-primary-700 uppercase tracking-wider min-w-[120px]">Nama Gedung</th>
            <th className="px-3 md:px-6 py-3 text-left text-xs font-medium text-primary-700 uppercase tracking-wider min-w-[100px]">Brand</th>
            <th className="px-3 md:px-6 py-3 text-left text-xs font-medium text-primary-700 uppercase tracking-wider min-w-[250px]">Lokasi</th>
            <th className="px-3 md:px-6 py-3 text-left text-xs font-medium text-primary-700 uppercase tracking-wider min-w-[100px]">Status</th>
            <th className="px-3 md:px-6 py-3 text-left text-xs font-medium text-primary-700 uppercase tracking-wider min-w-[120px]">Actions</th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-primary-100">
          {loading ? (
            <tr>
              <td colSpan="5" className="px-3 md:px-6 py-8 text-center">
                <div className="flex flex-col items-center justify-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mb-4"></div>
                  <p className="text-gray-500 font-medium">Loading buildings...</p>
                </div>
              </td>
            </tr>
          ) : buildings && buildings.length > 0 ? (
            buildings.map((building) => (
              <tr key={building.id} className="hover:bg-primary-50 transition-colors duration-150">
                <td className="px-3 md:px-6 py-4 text-sm font-medium text-gray-900">
                  <div className="min-w-0 break-words">{building.name}</div>
                </td>
                <td className="px-3 md:px-6 py-4 text-sm text-gray-900">
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-primary-100 text-primary-800 whitespace-nowrap">
                    {building.brand}
                  </span>
                </td>
                <td className="px-3 md:px-6 py-4 text-sm text-gray-900">
                  <div className="flex items-start min-w-0">
                    <MapPin className="w-4 h-4 mr-1 text-gray-400 flex-shrink-0 mt-0.5" />
                    <div className="min-w-0 max-w-[250px]">
                      <div className="font-medium text-gray-900 leading-tight">
                        {building.location?.city}, {building.location?.province}
                      </div>
                      <div className="text-xs text-gray-500 leading-tight mt-1 break-words">
                        {building.location?.address}
                      </div>
                      {building.location?.country && building.location?.country !== 'Indonesia' && (
                        <div className="text-xs text-gray-400 leading-tight mt-0.5">
                          {building.location?.country}
                        </div>
                      )}
                    </div>
                  </div>
                </td>
                <td className="px-3 md:px-6 py-4 whitespace-nowrap">
                  <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(building.isActive ? 'active' : 'inactive')}`}>
                    {getStatusIcon(building.isActive ? 'active' : 'inactive')}
                    <span className="ml-1 capitalize">{building.isActive ? 'Active' : 'Inactive'}</span>
                  </div>
                </td>
                <td className="px-3 md:px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <div className="flex space-x-1 md:space-x-2">
                    <button className="text-primary-600 hover:text-primary-800 p-1">
                      <Eye className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => onEdit(building)}
                      className="text-green-600 hover:text-green-900 p-1"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => onDelete('building', building.id)}
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
              <td colSpan="5" className="px-3 md:px-6 py-8 text-center text-sm text-gray-500">
                <div className="flex flex-col items-center justify-center">
                  <svg className="w-12 h-12 text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                  <p className="text-gray-500 font-medium">No buildings found</p>
                  <p className="text-gray-400 text-xs mt-1">Add your first building to get started</p>
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

export default BuildingsTable; 