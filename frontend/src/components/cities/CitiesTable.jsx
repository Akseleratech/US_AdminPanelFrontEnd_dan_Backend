import React, { useRef } from 'react';
import { Edit2, Trash2, MapPin, Image, Upload } from 'lucide-react';

const CitiesTable = ({ cities, onEdit, onDelete, onUploadImage, loading, usedCityIds }) => {
  const fileInputRefs = useRef({});

  const handleImageUpload = async (cityId, file) => {
    if (!file || !onUploadImage) return;
    
    try {
      await onUploadImage(cityId, file);
    } catch (error) {
      console.error('Error uploading image:', error);
      // Error will be handled by parent component
    }
  };

  const triggerFileInput = (cityId) => {
    if (fileInputRefs.current[cityId]) {
      fileInputRefs.current[cityId].click();
    }
  };

  return (
    <div className="overflow-x-auto bg-white shadow-lg rounded-lg border border-primary-200">
      <table className="min-w-full divide-y divide-primary-200">
        <thead className="bg-primary-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-primary-700 uppercase tracking-wider">
              Thumbnail
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-primary-700 uppercase tracking-wider">
              Nama Kota
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-primary-700 uppercase tracking-wider">
              Provinsi
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-primary-700 uppercase tracking-wider">
              Negara
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-primary-700 uppercase tracking-wider">
              Lokasi
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-primary-700 uppercase tracking-wider">
              Spaces
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-primary-700 uppercase tracking-wider">
              Aksi
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-primary-100">
          {cities.map((city) => (
            <tr key={city.id} className="hover:bg-primary-50 transition-colors duration-150">
              <td className="px-6 py-4 whitespace-nowrap">
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
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{city.name}</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{city.province || '-'}</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                {typeof city.country === 'object' ? city.country.name : city.country || '-'}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{city.locations}</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{city.totalSpaces}</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                <button
                  onClick={() => onEdit(city)}
                  className="text-blue-600 hover:text-blue-900 transition-colors duration-150"
                  title="Edit kota"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                <div className="relative group inline-block">
                  <button
                    onClick={() => onDelete('city', city.id)}
                    className={`text-red-600 hover:text-red-900 transition-colors duration-150 ${usedCityIds.has(city.id) ? 'opacity-50 cursor-not-allowed' : ''}`}
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
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      
      {cities.length === 0 && !loading && (
        <div className="text-center py-12">
          <MapPin className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">Tidak ada kota</h3>
          <p className="mt-1 text-sm text-gray-500">Mulai dengan menambah kota baru.</p>
        </div>
      )}
    </div>
  );
};

export default CitiesTable; 