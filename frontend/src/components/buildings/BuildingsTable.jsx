import React, { useState, useMemo } from 'react';
import { Eye, Edit, Trash2, MapPin, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, ChevronUp, ChevronDown } from 'lucide-react';
import { getStatusColor, getStatusIcon } from '../../utils/helpers.jsx';
import { useAuth } from '../auth/AuthContext.jsx';

const BuildingsTable = ({ buildings, onEdit, onDelete, loading, usedBuildingIds }) => {
  // Debug log to see building data
  console.log('🏢 BuildingsTable: Received buildings data:', buildings);
  
  const { userRole } = useAuth();

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 15;

  // Sorting state
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });

  // Sort buildings
  const sortedBuildings = useMemo(() => {
    if (!sortConfig.key || !buildings) return buildings || [];
    
    return [...buildings].sort((a, b) => {
      let aValue = a[sortConfig.key];
      let bValue = b[sortConfig.key];
      
      // Handle special cases for sorting
      if (sortConfig.key === 'location') {
        aValue = `${a.location?.city || ''}, ${a.location?.province || ''}`;
        bValue = `${b.location?.city || ''}, ${b.location?.province || ''}`;
      } else if (sortConfig.key === 'totalSpaces') {
        aValue = a.statistics?.totalSpaces || 0;
        bValue = b.statistics?.totalSpaces || 0;
      } else if (sortConfig.key === 'isActive') {
        aValue = a.isActive ? 1 : 0;
        bValue = b.isActive ? 1 : 0;
      }
      
      if (aValue < bValue) {
        return sortConfig.direction === 'asc' ? -1 : 1;
      }
      if (aValue > bValue) {
        return sortConfig.direction === 'asc' ? 1 : -1;
      }
      return 0;
    });
  }, [buildings, sortConfig]);

  // Calculate pagination values
  const totalItems = sortedBuildings?.length || 0;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentBuildings = sortedBuildings?.slice(startIndex, endIndex) || [];

  // Pagination handlers
  const goToFirstPage = () => setCurrentPage(1);
  const goToLastPage = () => setCurrentPage(totalPages);
  const goToPreviousPage = () => setCurrentPage(prev => Math.max(prev - 1, 1));
  const goToNextPage = () => setCurrentPage(prev => Math.min(prev + 1, totalPages));
  const goToPage = (pageNumber) => setCurrentPage(pageNumber);

  // Reset to first page when buildings change
  React.useEffect(() => {
    setCurrentPage(1);
  }, [buildings?.length]);

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
              <span className="font-medium">{totalItems}</span> gedung
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
  
  return (
    <div className="bg-white border border-primary-200 table-green-theme rounded-lg overflow-hidden">
      <div className="overflow-x-auto">
        <table className="table-auto min-w-full divide-y divide-primary-200">
          <thead className="bg-primary-50 border-b border-primary-200">
            <tr>
              <th className="px-3 md:px-6 py-3 text-left text-xs font-medium text-primary-700 uppercase tracking-wider min-w-[5rem]">
                Image
              </th>
              <th className="px-3 md:px-6 py-3 text-left text-xs font-medium text-primary-700 uppercase tracking-wider max-w-[200px]">
                <button 
                  onClick={() => handleSort('name')}
                  className="group flex items-center space-x-1 hover:text-primary-900"
                >
                  <span>Nama Gedung</span>
                  <SortIcon column="name" />
                </button>
              </th>
              <th className="px-3 md:px-6 py-3 text-left text-xs font-medium text-primary-700 uppercase tracking-wider min-w-[7rem]">
                <button 
                  onClick={() => handleSort('brand')}
                  className="group flex items-center space-x-1 hover:text-primary-900"
                >
                  <span>Brand</span>
                  <SortIcon column="brand" />
                </button>
              </th>
              <th className="px-3 md:px-6 py-3 text-left text-xs font-medium text-primary-700 uppercase tracking-wider max-w-[300px]">
                <button 
                  onClick={() => handleSort('location')}
                  className="group flex items-center space-x-1 hover:text-primary-900"
                >
                  <span>Lokasi</span>
                  <SortIcon column="location" />
                </button>
              </th>
              <th className="px-3 md:px-6 py-3 text-center text-xs font-medium text-primary-700 uppercase tracking-wider min-w-[7rem]">
                <button 
                  onClick={() => handleSort('totalSpaces')}
                  className="group flex items-center space-x-1 hover:text-primary-900"
                >
                  <span>Total Spaces</span>
                  <SortIcon column="totalSpaces" />
                </button>
              </th>
              <th className="px-3 md:px-6 py-3 text-left text-xs font-medium text-primary-700 uppercase tracking-wider min-w-[7rem]">
                <button 
                  onClick={() => handleSort('isActive')}
                  className="group flex items-center space-x-1 hover:text-primary-900"
                >
                  <span>Status</span>
                  <SortIcon column="isActive" />
                </button>
              </th>
              <th className="px-3 md:px-6 py-3 text-left text-xs font-medium text-primary-700 uppercase tracking-wider min-w-[7rem]">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-primary-100">
            {loading ? (
              <tr>
                <td colSpan="7" className="px-6 py-8 text-center">
                  <div className="flex flex-col items-center justify-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mb-4"></div>
                    <p className="text-gray-500 font-medium">Memuat gedung...</p>
                  </div>
                </td>
              </tr>
            ) : currentBuildings && currentBuildings.length > 0 ? (
              currentBuildings.map((building) => {
                // Debug log for each building
                console.log(`🏢 Building ${building.name}:`, {
                  id: building.id,
                  name: building.name,
                  hasImage: !!building.image,
                  imageUrl: building.image,
                  fullBuilding: building
                });
                
                return (
                <tr key={building.id} className="hover:bg-primary-50 transition-colors duration-150">
                  <td className="px-3 md:px-6 py-4">
                    <div className="w-12 h-12 rounded-lg overflow-hidden bg-gray-100 flex items-center justify-center">
                      {building.image ? (
                        <img
                          src={building.image}
                          alt={building.name}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            console.error('❌ Image failed to load:', building.image);
                            console.error('Error event:', e);
                          }}
                          onLoad={() => {
                            console.log('✅ Image loaded successfully:', building.image);
                          }}
                        />
                      ) : (
                        <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                        </svg>
                      )}
                    </div>
                  </td>
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
                      <MapPin className="w-4 h-4 mr-2 text-gray-400 flex-shrink-0 mt-0.5" />
                      <div className="min-w-0 max-w-[260px]">
                        <div className="font-medium text-gray-900 leading-tight mb-1 truncate">
                          {building.location?.city}, {building.location?.province}
                          {building.location?.country && building.location?.country !== 'Indonesia' && (
                            <span className="text-xs text-gray-400 ml-1">({building.location?.country})</span>
                          )}
                        </div>
                        {building.location?.address && (
                          <div className="text-xs text-gray-500 leading-tight truncate">
                            {building.location.address}
                          </div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-3 md:px-6 py-4 whitespace-nowrap text-center">
                    <div className="text-sm font-medium text-gray-900">
                      {building.statistics?.totalSpaces || 0}
                    </div>
                    <div className="text-xs text-gray-500">
                      {building.statistics?.activeSpaces || 0} active
                    </div>
                  </td>
                  <td className="px-3 md:px-6 py-4 whitespace-nowrap">
                    <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(building.isActive ? 'active' : 'inactive')}`}>
                      {getStatusIcon(building.isActive ? 'active' : 'inactive')}
                      <span className="ml-1 capitalize">{building.isActive ? 'Active' : 'Inactive'}</span>
                    </div>
                  </td>
                  <td className="px-3 md:px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex items-center space-x-2">
                      <button className="text-primary-600 hover:text-primary-800 p-1" title="View Detail">
                        <Eye className="w-4 h-4" />
                      </button>
                      {userRole === 'admin' && (
                        <>
                        <button
                          onClick={() => onEdit(building)}
                          className="text-green-600 hover:text-green-900 p-1"
                          title="Edit Gedung"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <div className="relative group">
                          <button 
                            onClick={() => onDelete('building', building.id)}
                            className={`text-red-600 hover:text-red-900 p-1 ${usedBuildingIds.has(building.id) ? 'opacity-50 cursor-not-allowed' : ''}`}
                            disabled={usedBuildingIds.has(building.id)}
                            title="Delete Gedung"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                          {usedBuildingIds.has(building.id) && (
                            <div className="absolute left-1/2 -translate-x-1/2 -top-10 w-max max-w-xs p-2 text-xs text-white bg-gray-800 rounded-md hidden group-hover:block pointer-events-none z-10">
                              Gedung ini tidak bisa dihapus karena sedang digunakan oleh satu atau lebih space.
                            </div>
                          )}
                        </div>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan="7" className="px-3 md:px-6 py-8 text-center text-sm text-gray-500">
                  <div className="flex flex-col items-center justify-center">
                    <svg className="w-12 h-12 text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                    <p className="text-gray-500 font-medium">Tidak ada gedung</p>
                    <p className="text-gray-400 text-xs mt-1">Mulai dengan menambah gedung baru</p>
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

export default BuildingsTable; 