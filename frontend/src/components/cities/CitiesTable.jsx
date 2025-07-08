import React, { useRef, useState, useMemo } from 'react';
import { Edit, Trash2, MapPin, Image, Upload, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, ChevronUp, ChevronDown } from 'lucide-react';

const CitiesTable = ({ cities, onEdit, onDelete, onUploadImage, loading, usedCityIds }) => {
  const fileInputRefs = useRef({});

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 15;

  // Sorting state
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });

  // Sort cities
  const sortedCities = useMemo(() => {
    if (!sortConfig.key || !cities) return cities || [];
    
    return [...cities].sort((a, b) => {
      let aValue = a[sortConfig.key];
      let bValue = b[sortConfig.key];
      
      // Handle special cases for sorting
      if (sortConfig.key === 'country') {
        aValue = typeof a.country === 'object' ? a.country.name : a.country || '';
        bValue = typeof b.country === 'object' ? b.country.name : b.country || '';
      } else if (sortConfig.key === 'totalSpaces') {
        aValue = Number(a.totalSpaces) || 0;
        bValue = Number(b.totalSpaces) || 0;
      }
      
      if (aValue < bValue) {
        return sortConfig.direction === 'asc' ? -1 : 1;
      }
      if (aValue > bValue) {
        return sortConfig.direction === 'asc' ? 1 : -1;
      }
      return 0;
    });
  }, [cities, sortConfig]);

  // Calculate pagination values
  const totalItems = sortedCities?.length || 0;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentCities = sortedCities?.slice(startIndex, endIndex) || [];

  // Pagination handlers
  const goToFirstPage = () => setCurrentPage(1);
  const goToLastPage = () => setCurrentPage(totalPages);
  const goToPreviousPage = () => setCurrentPage(prev => Math.max(prev - 1, 1));
  const goToNextPage = () => setCurrentPage(prev => Math.min(prev + 1, totalPages));
  const goToPage = (pageNumber) => setCurrentPage(pageNumber);

  // Reset to first page when cities change
  React.useEffect(() => {
    setCurrentPage(1);
  }, [cities?.length]);

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
              <span className="font-medium">{totalItems}</span> kota
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

  const handleImageUpload = async (cityId, file) => {
    if (!file || !onUploadImage) return;
    
    try {
      await onUploadImage(cityId, file);
    } catch (error) {
      console.error('Error uploading image:', error);
    }
  };

  const triggerFileInput = (cityId) => {
    if (fileInputRefs.current[cityId]) {
      fileInputRefs.current[cityId].click();
    }
  };

  return (
    <div className="bg-white border border-primary-200 table-green-theme rounded-lg overflow-hidden">
      <div className="overflow-x-auto">
        <table className=" w-full divide-y">
          <thead className="bg-primary-50">
            <tr>
              <th className="px-3 md:px-6 py-3 text-left text-xs font-medium text-primary-700 uppercase tracking-wider">Thumbnail</th>
              <th className="px-3 md:px-6 py-3 text-left text-xs font-medium text-primary-700 uppercase tracking-wider">
                <button 
                  onClick={() => handleSort('name')}
                  className="group flex items-center space-x-1 hover:text-primary-900"
                >
                  <span>Nama Kota</span>
                  <SortIcon column="name" />
                </button>
              </th>
              <th className="px-3 md:px-6 py-3 text-left text-xs font-medium text-primary-700 uppercase tracking-wider">
                <button 
                  onClick={() => handleSort('province')}
                  className="group flex items-center space-x-1 hover:text-primary-900"
                >
                  <span>Provinsi</span>
                  <SortIcon column="province" />
                </button>
              </th>
              <th className="px-3 md:px-6 py-3 text-left text-xs font-medium text-primary-700 uppercase tracking-wider">
                <button 
                  onClick={() => handleSort('country')}
                  className="group flex items-center space-x-1 hover:text-primary-900"
                >
                  <span>Negara</span>
                  <SortIcon column="country" />
                </button>
              </th>
              <th className="px-3 md:px-6 py-3 text-left text-xs font-medium text-primary-700 uppercase tracking-wider">
                <button 
                  onClick={() => handleSort('locations')}
                  className="group flex items-center space-x-1 hover:text-primary-900"
                >
                  <span>Lokasi</span>
                  <SortIcon column="locations" />
                </button>
              </th>
              <th className="px-3 md:px-6 py-3 text-left text-xs font-medium text-primary-700 uppercase tracking-wider">
                <button 
                  onClick={() => handleSort('totalSpaces')}
                  className="group flex items-center space-x-1 hover:text-primary-900"
                >
                  <span>Spaces</span>
                  <SortIcon column="totalSpaces" />
                </button>
              </th>
              <th className="px-3 md:px-6 py-3 text-left text-xs font-medium text-primary-700 uppercase tracking-wider">Aksi</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-primary-100">
            {loading ? (
              <tr>
                <td colSpan="7" className="px-6 py-8 text-center">
                  <div className="flex flex-col items-center justify-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mb-4"></div>
                    <p className="text-gray-500 font-medium">Memuat kota...</p>
                  </div>
                </td>
              </tr>
            ) : currentCities && currentCities.length > 0 ? (
              currentCities.map((city) => (
                <tr key={city.id} className="hover:bg-primary-50 transition-colors duration-150">
                  <td className="px-3 md:px-6 py-4 align-middle whitespace-nowrap">
                    <div className="relative w-12 h-12 rounded-lg overflow-hidden bg-gray-100 flex items-center justify-center group">
                      {city.thumbnail ? (
                        <img 
                          src={city.thumbnail} 
                          alt={`${city.name} thumbnail`}
                          className="w-full h-full object-cover"
                          crossOrigin="anonymous"
                          referrerPolicy="no-referrer"
                          onError={(e) => {
                            e.target.style.display = 'none';
                            e.target.nextSibling.style.display = 'flex';
                          }}
                        />
                      ) : (
                        <Image className="w-6 h-6 text-gray-400" />
                      )}
                      
                      {/* Upload overlay */}
                      <div 
                        className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                        onClick={() => triggerFileInput(city.id)}
                        title="Upload thumbnail"
                      >
                        <Upload className="w-4 h-4 text-white" />
                      </div>
                      
                      {/* Hidden file input */}
                      <input
                        ref={el => fileInputRefs.current[city.id] = el}
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files[0];
                          if (file) {
                            handleImageUpload(city.id, file);
                          }
                        }}
                        className="hidden"
                      />
                      
                      {/* Error fallback */}
                      <div style={{ display: 'none' }} className="w-6 h-6 text-red-400 flex items-center justify-center">
                        <Image className="w-6 h-6" />
                      </div>
                    </div>
                  </td>
                  <td className="px-3 md:px-6 py-4 align-middle">
                    <p className="text-sm font-medium text-gray-900 break-words" title={city.name}>{city.name}</p>
                  </td>
                  <td className="px-3 md:px-6 py-4 align-middle">
                     <p className="text-sm text-gray-500 break-words" title={city.province || '-'}>{city.province || '-'}</p>
                  </td>
                  <td className="px-3 md:px-6 py-4 align-middle">
                    <p className="text-sm text-gray-500 break-words" title={typeof city.country === 'object' ? city.country.name : city.country || '-'}>
                      {typeof city.country === 'object' ? city.country.name : city.country || '-'}
                    </p>
                  </td>
                  <td className="px-3 md:px-6 py-4 align-middle">
                    <p className="text-sm text-gray-500 break-words" title={city.locations}>{city.locations}</p>
                  </td>
                  <td className="px-3 md:px-6 py-4 text-sm text-gray-900 text-center align-middle whitespace-nowrap">{city.totalSpaces}</td>
                  <td className="px-3 md:px-6 py-4 text-sm font-medium align-middle whitespace-nowrap">
                    <div className="flex items-center justify-start space-x-2">
                      <button
                        onClick={() => onEdit(city)}
                        className="text-green-600 hover:text-blue-900 transition-colors duration-150 p-1"
                        title="Edit kota"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <div className="relative group">
                        <button
                          onClick={() => onDelete('city', city.id)}
                          className={`text-red-600 hover:text-red-900 transition-colors duration-150 p-1 ${usedCityIds.has(city.id) ? 'opacity-50 cursor-not-allowed' : ''}`}
                          title="Hapus kota"
                          disabled={usedCityIds.has(city.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                        {usedCityIds.has(city.id) && (
                          <div className="absolute left-1/2 -translate-x-1/2 -top-10 w-max max-w-xs p-2 text-xs text-white bg-gray-800 rounded-md opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                            Kota ini tidak bisa dihapus karena sedang digunakan oleh satu atau lebih gedung.
                          </div>
                        )}
                      </div>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="7" className="px-6 py-8 text-center text-sm text-gray-500">
                  <div className="flex flex-col items-center justify-center">
                    <MapPin className="mx-auto h-12 w-12 text-gray-400" />
                    <p className="text-gray-500 font-medium">Tidak ada kota</p>
                    <p className="text-gray-400 text-xs mt-1">Mulai dengan menambah kota baru.</p>
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

export default CitiesTable; 