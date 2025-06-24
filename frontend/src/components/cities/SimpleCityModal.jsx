import React, { useState } from 'react';

const SimpleCityModal = ({ isOpen, onClose, onSubmit, initialData, isEditing }) => {
  const [formData, setFormData] = useState({
    name: initialData?.name || '',
    province: initialData?.province || '',
    country: initialData?.country || 'Indonesia',
    postalCode: initialData?.postalCodes?.[0] || '',
    ...initialData
  });

  const [errors, setErrors] = useState({});

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.name.trim()) {
      newErrors.name = 'Nama kota wajib diisi';
    }
    
    if (!formData.province.trim()) {
      newErrors.province = 'Provinsi wajib diisi';
    }
    
    if (!formData.country.trim()) {
      newErrors.country = 'Negara wajib diisi';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validateForm()) {
      // Create simplified data structure - hanya yang essential
      const cityData = {
        name: formData.name.trim(),
        province: formData.province.trim(),
        country: formData.country.trim(),
        postalCodes: formData.postalCode ? [formData.postalCode.trim()] : [],
        timezone: 'Asia/Jakarta', // Default timezone Indonesia
        utcOffset: '+07:00',
        statistics: {
          totalSpaces: 0,
          activeSpaces: 0
        },
        search: {
          keywords: [formData.name.toLowerCase().trim()],
          aliases: [],
          slug: formData.name.toLowerCase().replace(/\s+/g, '-'),
          metaTitle: `Co-working Spaces in ${formData.name}`,
          metaDescription: `Find and book workspaces in ${formData.name}`
        },
        isActive: true
      };
      
      onSubmit(cityData);
    }
  };

  const handleClose = () => {
    setFormData({
      name: '',
      province: '',
      country: 'Indonesia',
      postalCode: ''
    });
    setErrors({});
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-full max-w-md mx-4">
        <div className="flex justify-between items-center p-6 border-b">
          <h2 className="text-xl font-semibold">
            {isEditing ? 'Edit Kota' : 'Tambah Kota Baru'}
          </h2>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          <div className="space-y-4">
            {/* Nama Kota */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nama Kota *
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.name ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Contoh: Yogyakarta"
              />
              {errors.name && (
                <p className="text-red-500 text-sm mt-1">{errors.name}</p>
              )}
            </div>

            {/* Provinsi */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Provinsi *
              </label>
              <input
                type="text"
                name="province"
                value={formData.province}
                onChange={handleInputChange}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.province ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Contoh: DI Yogyakarta"
              />
              {errors.province && (
                <p className="text-red-500 text-sm mt-1">{errors.province}</p>
              )}
            </div>

            {/* Negara */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Negara *
              </label>
              <input
                type="text"
                name="country"
                value={formData.country}
                onChange={handleInputChange}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.country ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Indonesia"
              />
              {errors.country && (
                <p className="text-red-500 text-sm mt-1">{errors.country}</p>
              )}
            </div>

            {/* Kode Pos (Optional) */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Kode Pos
              </label>
              <input
                type="text"
                name="postalCode"
                value={formData.postalCode}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Contoh: 55182"
              />
              <p className="text-gray-500 text-xs mt-1">
                Opsional - dapat ditambahkan nanti
              </p>
            </div>
          </div>

          {/* Note untuk user */}
          <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
            <p className="text-blue-700 text-sm">
              💡 <strong>Tips:</strong> Sebagian besar kota akan dibuat otomatis saat menambah space. 
              Gunakan form ini hanya untuk kota yang tidak otomatis terbuat.
            </p>
          </div>

          <div className="flex gap-3 pt-6">
            <button
              type="button"
              onClick={handleClose}
              className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500"
            >
              Batal
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {isEditing ? 'Update' : 'Tambah'} Kota
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SimpleCityModal; 