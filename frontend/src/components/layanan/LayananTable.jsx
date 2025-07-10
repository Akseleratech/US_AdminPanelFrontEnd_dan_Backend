import React, { useState, useMemo } from 'react';
import { Eye, Edit, Trash2, Loader2, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, ChevronUp, ChevronDown } from 'lucide-react';
import { getStatusColor, getStatusIcon } from '../../utils/helpers.jsx';
import { useAuth } from '../auth/AuthContext.jsx';

const LayananTable = ({ layananList, onEdit, onDelete, loading = false, usedLayananIds }) => {
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);

  const { userRole } = useAuth();
  const itemsPerPage = 15;

  // Sorting state
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });

  // Sort layanan
  const sortedLayanan = useMemo(() => {
    if (!sortConfig.key || !layananList) return layananList || [];
    
    return [...layananList].sort((a, b) => {
      let aValue = a[sortConfig.key];
      let bValue = b[sortConfig.key];
      
      // Handle special cases for sorting
      if (sortConfig.key === 'description') {
        aValue = typeof a.description === 'object' ? a.description?.short || a.description?.long || '' : a.description || '';
        bValue = typeof b.description === 'object' ? b.description?.short || b.description?.long || '' : b.description || '';
      } else if (sortConfig.key === 'totalSpaces') {
        aValue = a.spaceCount?.total || 0;
        bValue = b.spaceCount?.total || 0;
      }
      
      if (aValue < bValue) {
        return sortConfig.direction === 'asc' ? -1 : 1;
      }
      if (aValue > bValue) {
        return sortConfig.direction === 'asc' ? 1 : -1;
      }
      return 0;
    });
  }, [layananList, sortConfig]);

  // Calculate pagination values
  const totalItems = sortedLayanan?.length || 0;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentLayanan = sortedLayanan?.slice(startIndex, endIndex) || [];

  // Pagination handlers
  const goToFirstPage = () => setCurrentPage(1);
  const goToLastPage = () => setCurrentPage(totalPages);
  const goToPreviousPage = () => setCurrentPage(prev => Math.max(prev - 1, 1));
  const goToNextPage = () => setCurrentPage(prev => Math.min(prev + 1, totalPages));
  const goToPage = (pageNumber) => setCurrentPage(pageNumber);

  // Reset to first page when layanan change
  React.useEffect(() => {
    setCurrentPage(1);
  }, [layananList?.length]);

  // Sort function
  const handleSort = (key) => {
    setSortConfig(prevConfig => ({
      key,
      direction: prevConfig.key === key && prevConfig.direction === 'asc' ? 'desc' : 'asc'
    }));
    setCurrentPage(1); // Reset to first page when sorting
  };

  // Sort icon component
  const SortIcon = ({ column }) => {
    if (sortConfig.key !== column) {
      return <ChevronUp className="w-4 h-4 text-gray-400 opacity-0 group-hover:opacity-100" />;
    }
    return sortConfig.direction === 'asc' ? 
      <ChevronUp className="w-4 h-4 text-primary-600" /> : 
      <ChevronDown className="w-4 h-4 text-primary-600" />;
  };

  // Generate page numbers for pagination
  const getPageNumbers = () => {
    const pages = [];
    const maxVisiblePages = 5;
    
    if (totalPages <= maxVisiblePages) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      let startPage = Math.max(1, currentPage - 2);
      let endPage = Math.min(totalPages, currentPage + 2);
      
      if (currentPage <= 3) {
        endPage = Math.min(maxVisiblePages, totalPages);
      } else if (currentPage >= totalPages - 2) {
        startPage = Math.max(1, totalPages - maxVisiblePages + 1);
      }
      
      for (let i = startPage; i <= endPage; i++) {
        pages.push(i);
      }
    }
    
    return pages;
  };

  // Pagination Controls Component
  const PaginationControls = () => {
    if (totalPages <= 1) return null;

    return (
      <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-primary-200 sm:px-6">
        <div className="flex-1 flex justify-between sm:hidden">
          <button
            onClick={goToPreviousPage}
            disabled={currentPage === 1}
            className={`relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md ${
              currentPage === 1 
                ? 'text-gray-400 bg-gray-100 cursor-not-allowed' 
                : 'text-gray-700 bg-white hover:bg-gray-50'
            }`}
          >
            Previous
          </button>
          <button
            onClick={goToNextPage}
            disabled={currentPage === totalPages}
            className={`ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md ${
              currentPage === totalPages 
                ? 'text-gray-400 bg-gray-100 cursor-not-allowed' 
                : 'text-gray-700 bg-white hover:bg-gray-50'
            }`}
          >
            Next
          </button>
        </div>
        
        <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
          <div>
            <p className="text-sm text-gray-700">
              Menampilkan{' '}
              <span className="font-medium">{startIndex + 1}</span> sampai{' '}
              <span className="font-medium">{Math.min(endIndex, totalItems)}</span> dari{' '}
              <span className="font-medium">{totalItems}</span> layanan
            </p>
          </div>
          
          <div>
            <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
              {/* First Page Button */}
              <button
                onClick={goToFirstPage}
                disabled={currentPage === 1}
                className={`relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 text-sm font-medium ${
                  currentPage === 1 
                    ? 'text-gray-400 bg-gray-100 cursor-not-allowed' 
                    : 'text-gray-500 bg-white hover:bg-gray-50'
                }`}
                title="Halaman Pertama"
              >
                <ChevronsLeft className="h-4 w-4" />
              </button>
              
              {/* Previous Page Button */}
              <button
                onClick={goToPreviousPage}
                disabled={currentPage === 1}
                className={`relative inline-flex items-center px-2 py-2 border border-gray-300 text-sm font-medium ${
                  currentPage === 1 
                    ? 'text-gray-400 bg-gray-100 cursor-not-allowed' 
                    : 'text-gray-500 bg-white hover:bg-gray-50'
                }`}
                title="Halaman Sebelumnya"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              
              {/* Page Numbers */}
              {getPageNumbers().map((pageNumber) => (
                <button
                  key={pageNumber}
                  onClick={() => goToPage(pageNumber)}
                  className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                    pageNumber === currentPage
                      ? 'z-10 bg-primary-50 border-primary-500 text-primary-600'
                      : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                  }`}
                >
                  {pageNumber}
                </button>
              ))}
              
              {/* Next Page Button */}
              <button
                onClick={goToNextPage}
                disabled={currentPage === totalPages}
                className={`relative inline-flex items-center px-2 py-2 border border-gray-300 text-sm font-medium ${
                  currentPage === totalPages 
                    ? 'text-gray-400 bg-gray-100 cursor-not-allowed' 
                    : 'text-gray-500 bg-white hover:bg-gray-50'
                }`}
                title="Halaman Selanjutnya"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
              
              {/* Last Page Button */}
              <button
                onClick={goToLastPage}
                disabled={currentPage === totalPages}
                className={`relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 text-sm font-medium ${
                  currentPage === totalPages 
                    ? 'text-gray-400 bg-gray-100 cursor-not-allowed' 
                    : 'text-gray-500 bg-white hover:bg-gray-50'
                }`}
                title="Halaman Terakhir"
              >
                <ChevronsRight className="h-4 w-4" />
              </button>
            </nav>
          </div>
        </div>
      </div>
    );
  };

  // Remove this early return to consolidate loading state in table body

  return (
    <div className="bg-white border border-primary-200 table-green-theme rounded-lg overflow-hidden">
      <div className="overflow-x-auto">
        <table className="table-auto min-w-full divide-y divide-primary-200">
          <thead className="bg-primary-50 border-b border-primary-200">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-primary-700 uppercase tracking-wider">
                <button 
                  onClick={() => handleSort('name')}
                  className="group flex items-center space-x-1 hover:text-primary-900"
                >
                  <span>Nama Layanan</span>
                  <SortIcon column="name" />
                </button>
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-primary-700 uppercase tracking-wider">
                <button 
                  onClick={() => handleSort('description')}
                  className="group flex items-center space-x-1 hover:text-primary-900"
                >
                  <span>Deskripsi</span>
                  <SortIcon column="description" />
                </button>
              </th>
              <th className="px-6 py-3 text-center text-xs font-medium text-primary-700 uppercase tracking-wider">
                <button 
                  onClick={() => handleSort('totalSpaces')}
                  className="group flex items-center space-x-1 hover:text-primary-900"
                >
                  <span>Total Spaces</span>
                  <SortIcon column="totalSpaces" />
                </button>
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-primary-700 uppercase tracking-wider">
                <button 
                  onClick={() => handleSort('status')}
                  className="group flex items-center space-x-1 hover:text-primary-900"
                >
                  <span>Status</span>
                  <SortIcon column="status" />
                </button>
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-primary-700 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-primary-100">
            {loading ? (
              <tr>
                <td colSpan="5" className="px-6 py-8 text-center">
                  <div className="flex flex-col items-center justify-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mb-4"></div>
                    <p className="text-gray-500 font-medium">Memuat layanan...</p>
                  </div>
                </td>
              </tr>
            ) : currentLayanan && currentLayanan.length > 0 ? (
              currentLayanan.map((layanan) => (
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
                      {userRole === 'admin' && (
                        <>
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
                          <div className="absolute left-1/2 -translate-x-1/2 -top-10 w-max max-w-xs p-2 text-xs text-white bg-gray-800 rounded-md hidden group-hover:block pointer-events-none">
                            Layanan ini tidak bisa dihapus karena sedang digunakan oleh satu atau lebih space.
                          </div>
                        )}
                      </div>
                        </>
                      )}
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
      
      {/* Pagination Controls */}
      <PaginationControls />
    </div>
  );
};

export default LayananTable; 