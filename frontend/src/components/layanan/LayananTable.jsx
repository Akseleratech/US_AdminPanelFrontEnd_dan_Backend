import React from 'react';
import { Eye, Edit, Trash2, Loader2 } from 'lucide-react';
import { getStatusColor, getStatusIcon } from '../../utils/helpers.jsx';

const LayananTable = ({ layananList, onEdit, onDelete, loading = false, usedLayananIds }) => {
  if (loading) {
    return (
      <div className="bg-white border border-primary-200 table-green-theme rounded-lg overflow-hidden">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
          <span className="ml-3 text-gray-500">Memuat layanan...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white border border-primary-200 table-green-theme rounded-lg overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full table-auto divide-y divide-primary-200">
          <thead className="bg-primary-50 border-b border-primary-200">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-primary-700 uppercase tracking-wider">Nama Layanan</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-primary-700 uppercase tracking-wider">Deskripsi</th>
              <th className="px-6 py-3 text-center text-xs font-medium text-primary-700 uppercase tracking-wider">Total Spaces</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-primary-700 uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-primary-700 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-primary-100">
            {layananList && layananList.length > 0 ? (
              layananList.map((layanan) => (
                <tr key={layanan.id} className="hover:bg-primary-50 transition-colors duration-150">
                  <td className="px-6 py-4 align-middle">
                    <div className="text-sm font-medium text-gray-900 break-words" title={layanan.name}>{layanan.name}</div>
                  </td>
                  <td className="px-6 py-4 align-middle">
                    <p className="text-sm text-gray-500 break-words" title={typeof layanan.description === 'object' ? layanan.description?.short || layanan.description?.long || '' : layanan.description || ''}>
                      {typeof layanan.description === 'object' 
                        ? layanan.description?.short || layanan.description?.long || ''
                        : layanan.description || ''
                      }
                    </p>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900 align-middle whitespace-nowrap text-center">
                    <div 
                      className="cursor-help" 
                      title={`Total: ${layanan.spaceCount?.total || 0} | Active: ${layanan.spaceCount?.active || 0}`}
                    >
                      <div className="text-sm font-medium text-gray-900">
                        {layanan.spaceCount?.total || 0}
                      </div>
                      <div className="text-xs text-gray-500">
                        {layanan.spaceCount?.active || 0} active
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 align-middle whitespace-nowrap">
                    <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(layanan.status)}`}>
                      {getStatusIcon(layanan.status)}
                      <span className="ml-1 capitalize">{layanan.status}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm font-medium align-middle whitespace-nowrap">
                    <div className="flex items-center justify-start space-x-2">
                      <button 
                        className="text-primary-600 hover:text-primary-800 p-1"
                        title="Lihat Detail"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => onEdit(layanan)}
                        className="text-green-600 hover:text-green-900 p-1"
                        title="Edit Layanan"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <div className="relative group">
                        <button 
                          onClick={() => onDelete('layanan', layanan.id)}
                          className={`text-red-600 hover:text-red-900 p-1 ${usedLayananIds.has(layanan.id) ? 'opacity-50 cursor-not-allowed' : ''}`}
                          title="Hapus Layanan"
                          disabled={usedLayananIds.has(layanan.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                        {usedLayananIds.has(layanan.id) && (
                          <div className="absolute left-1/2 -translate-x-1/2 -top-10 w-max max-w-xs p-2 text-xs text-white bg-gray-800 rounded-md opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                            Layanan ini tidak bisa dihapus karena sedang digunakan oleh satu atau lebih space.
                          </div>
                        )}
                      </div>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="5" className="px-6 py-12 text-center text-sm text-gray-500">
                  <div className="flex flex-col items-center">
                    <svg className="w-12 h-12 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                    <p className="text-lg font-medium">Belum ada layanan</p>
                    <p className="text-sm">Tambahkan layanan pertama Anda untuk mulai mengelola bisnis</p>
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

export default LayananTable; 