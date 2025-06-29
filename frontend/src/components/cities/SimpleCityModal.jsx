import React, { useState, useRef, useEffect } from 'react';
import { Upload, X, Image } from 'lucide-react';

const SimpleCityModal = ({ isOpen, onClose, onSubmit, initialData, isEditing }) => {
  const [formData, setFormData] = useState(() => ({
    name: initialData?.name || '',
    province: initialData?.province || '',
    country: initialData?.country || 'Indonesia',
    postalCode: initialData?.postalCodes?.[0] || '',
    thumbnail: null // Don't include existing URL as File object
  }));
  
  const [imagePreview, setImagePreview] = useState(initialData?.thumbnail || null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const fileInputRef = useRef(null);

  const [errors, setErrors] = useState({});

  // Update form data when initialData changes (for edit mode)
  useEffect(() => {
    console.log('SimpleCityModal: useEffect triggered', { initialData, isEditing, isOpen });
    
    if (initialData && isEditing) {
      console.log('SimpleCityModal: Setting form data for edit mode', initialData);
      setFormData({
        name: initialData.name || '',
        province: initialData.province || '',
        country: initialData.country || 'Indonesia',
        postalCode: initialData.postalCodes?.[0] || '',
        thumbnail: null
      });
      setImagePreview(initialData.thumbnail || null);
    } else {
      // Reset form for add mode
      console.log('SimpleCityModal: Resetting form for add mode');
      setFormData({
        name: '',
        province: '',
        country: 'Indonesia',
        postalCode: '',
        thumbnail: null
      });
      setImagePreview(null);
    }
    setErrors({});
  }, [initialData, isEditing, isOpen]);

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

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    console.log('🖼️ SimpleCityModal: Image upload started', {
      fileName: file.name,
      fileSize: file.size,
      fileType: file.type
    });

    // Validate file type
    if (!file.type.startsWith('image/')) {
      console.error('❌ SimpleCityModal: Invalid file type:', file.type);
      setErrors(prev => ({
        ...prev,
        thumbnail: 'File harus berupa gambar (JPG, PNG, WebP, GIF)'
      }));
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      console.error('❌ SimpleCityModal: File too large:', file.size);
      setErrors(prev => ({
        ...prev,
        thumbnail: 'Ukuran file maksimal 5MB'
      }));
      return;
    }

    try {
      setUploadingImage(true);
      setErrors(prev => ({ ...prev, thumbnail: '' }));
      console.log('📤 SimpleCityModal: Processing image upload...');

      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        console.log('✅ SimpleCityModal: Image preview created');
        setImagePreview(e.target.result);
      };
      reader.onerror = (error) => {
        console.error('❌ SimpleCityModal: Error creating preview:', error);
        setErrors(prev => ({
          ...prev,
          thumbnail: 'Gagal membuat preview gambar'
        }));
      };
      reader.readAsDataURL(file);

      // Store the file object for upload in backend
      setFormData(prev => ({
        ...prev,
        thumbnail: file
      }));
      
      console.log('✅ SimpleCityModal: File stored in formData, ready for upload');

    } catch (error) {
      console.error('💥 SimpleCityModal: Error handling image:', error);
      setErrors(prev => ({
        ...prev,
        thumbnail: 'Gagal memproses gambar: ' + error.message
      }));
    } finally {
      setUploadingImage(false);
    }
  };

  const removeImage = () => {
    setImagePreview(null);
    setFormData(prev => ({
      ...prev,
      thumbnail: null
    }));
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    console.log('🚀 SimpleCityModal: Form submission started');
    console.log('📝 SimpleCityModal: Current formData:', {
      name: formData.name,
      province: formData.province,
      country: formData.country,
      postalCode: formData.postalCode,
      hasThumbnail: !!formData.thumbnail,
      thumbnailType: formData.thumbnail ? formData.thumbnail.type : null,
      thumbnailSize: formData.thumbnail ? formData.thumbnail.size : null
    });
    
    if (!validateForm()) {
      console.error('❌ SimpleCityModal: Form validation failed');
      return;
    }

    try {
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
        thumbnail: formData.thumbnail, // File object will be handled by cityApi.createFormData()
        isActive: true
      };
      
      console.log('📤 SimpleCityModal: Submitting city data:', {
        ...cityData,
        thumbnail: cityData.thumbnail ? 'FILE_OBJECT' : null
      });
      
      await onSubmit(cityData);
      console.log('✅ SimpleCityModal: City submitted successfully');
      
    } catch (error) {
      console.error('💥 SimpleCityModal: Error during submission:', error);
      setErrors(prev => ({
        ...prev,
        submit: 'Gagal menyimpan data: ' + error.message
      }));
    }
  };

  const handleClose = () => {
    setFormData({
      name: '',
      province: '',
      country: 'Indonesia',
      postalCode: '',
      thumbnail: null
    });
    setImagePreview(null);
    setErrors({});
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-900/75 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-xl shadow-2xl border border-gray-200 w-full max-w-md mx-4 animate-in zoom-in-95 duration-200">
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
          {/* Display submit error */}
          {errors.submit && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
              <div className="flex items-center">
                <X className="w-5 h-5 text-red-500 mr-2" />
                <span className="text-red-700 text-sm">{errors.submit}</span>
              </div>
            </div>
          )}

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

            {/* Upload Thumbnail */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Thumbnail Kota
              </label>
              <div className="mt-1">
                {imagePreview ? (
                  <div className="relative">
                    <img
                      src={imagePreview}
                      alt="Preview thumbnail"
                      className="w-full h-32 object-cover rounded-md border border-gray-300"
                    />
                    <button
                      type="button"
                      onClick={removeImage}
                      className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full h-32 border-2 border-dashed border-gray-300 rounded-md flex flex-col items-center justify-center cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-colors"
                  >
                    {uploadingImage ? (
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                    ) : (
                      <>
                        <Upload className="w-8 h-8 text-gray-400 mb-2" />
                        <p className="text-sm text-gray-500 text-center">
                          Klik untuk upload thumbnail
                        </p>
                        <p className="text-xs text-gray-400 text-center mt-1">
                          PNG, JPG, GIF (Max 5MB)
                        </p>
                      </>
                    )}
                  </div>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />
                {errors.thumbnail && (
                  <p className="text-red-500 text-sm mt-1">{errors.thumbnail}</p>
                )}
                <p className="text-gray-500 text-xs mt-1">
                  Thumbnail ini akan digunakan di aplikasi mobile
                </p>
              </div>
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