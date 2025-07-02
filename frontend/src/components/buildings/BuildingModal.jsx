import React, { useState, useEffect } from 'react';
import { X, MapPin, Upload } from 'lucide-react';
import GoogleMap from '../common/GoogleMap.jsx';
import buildingApiService from '../../services/buildingApi.js';

const BuildingModal = ({ isOpen, onClose, onSave, building, mode }) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    brand: '',
    location: {
      address: '',
      city: '',
      province: '',
      postalCode: '',
      country: 'Indonesia',
      coordinates: null,
      latitude: null,
      longitude: null
    },
    isActive: true,
    image: null
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showMapModal, setShowMapModal] = useState(false);
  const [previewLocationData, setPreviewLocationData] = useState(null);
  
  // Image upload states
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [imageError, setImageError] = useState('');

  const brands = [
    { value: 'UnionSpace', label: 'UnionSpace' },
    { value: 'NextSpace', label: 'NextSpace' },
    { value: 'CoSpace', label: 'CoSpace' }
  ];



  // Initialize form data when building changes
  useEffect(() => {
    if (building && mode === 'edit') {
      setFormData({
        name: building.name || '',
        description: building.description || '',
        brand: building.brand || '',
        location: {
          address: building.location?.address || '',
          city: building.location?.city || '',
          province: building.location?.province || '',
          postalCode: building.location?.postalCode || '',
          country: building.location?.country || 'Indonesia',
          coordinates: building.location?.coordinates || null,
          latitude: building.location?.latitude || null,
          longitude: building.location?.longitude || null
        },
        isActive: building.isActive !== undefined ? building.isActive : true,
        image: building.image || null
      });
      
      // Set existing image if available
      if (building.image) {
        setImagePreview(building.image);
      }
    } else {
      // Reset form for add mode
      setFormData({
        name: '',
        description: '',
        brand: '',
        location: {
          address: '',
          city: '',
          province: '',
          postalCode: '',
          country: 'Indonesia',
          coordinates: null,
          latitude: null,
          longitude: null
        },
        isActive: true,
        image: null
      });
      setImagePreview(null);
      setImageFile(null);
    }
    setError('');
    setImageError('');
  }, [building, mode, isOpen]);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: type === 'checkbox' ? checked : value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: type === 'checkbox' ? checked : value
      }));
    }
  };



  const handleLocationPreview = (locationData) => {
    setPreviewLocationData(locationData);
  };

  const handleLocationSelect = (locationData) => {
    setFormData(prev => ({
      ...prev,
      location: {
        ...prev.location,
        address: locationData.address || prev.location.address,
        city: locationData.city || prev.location.city,
        province: locationData.province || prev.location.province,
        postalCode: locationData.postalCode || prev.location.postalCode,
        country: locationData.country || prev.location.country,
        latitude: locationData.coordinates?.lat || prev.location.latitude,
        longitude: locationData.coordinates?.lng || prev.location.longitude
      }
    }));
    setShowMapModal(false);
    setPreviewLocationData(null);
  };

  // Handle image upload
  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    console.log('🖼️ BuildingModal: Image upload started', {
      fileName: file.name,
      fileSize: file.size,
      fileType: file.type
    });

    // Validate file type
    if (!file.type.startsWith('image/')) {
      console.error('❌ BuildingModal: Invalid file type:', file.type);
      setImageError('File harus berupa gambar (JPG, PNG, WebP, GIF)');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      console.error('❌ BuildingModal: File too large:', file.size);
      setImageError('Ukuran file maksimal 5MB');
      return;
    }

    try {
      setUploadingImage(true);
      setImageError('');
      console.log('📤 BuildingModal: Processing image upload...');

      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        console.log('✅ BuildingModal: Image preview created');
        setImagePreview(e.target.result);
      };
      reader.onerror = (error) => {
        console.error('❌ BuildingModal: Error creating preview:', error);
        setImageError('Gagal membuat preview gambar');
      };
      reader.readAsDataURL(file);

      // Store the file object for upload after building is saved
      setImageFile(file);
      
      console.log('✅ BuildingModal: File stored, ready for upload after save');
    } catch (error) {
      console.error('❌ BuildingModal: Error processing image:', error);
      setImageError('Gagal memproses gambar');
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Validate required fields
      if (!formData.name.trim()) {
        throw new Error('Nama gedung harus diisi');
      }
      if (!formData.brand) {
        throw new Error('Brand harus dipilih');
      }
      if (!formData.location.address.trim()) {
        throw new Error('Alamat harus diisi');
      }
      if (!formData.location.city.trim()) {
        throw new Error('Kota harus diisi');
      }
      if (!formData.location.province.trim()) {
        throw new Error('Provinsi harus diisi');
      }
      if (!formData.location.country.trim()) {
        throw new Error('Negara harus diisi');
      }

      // Prepare data for submission
      const submissionData = {
        ...formData
      };

      const savedBuilding = await onSave(submissionData);
      
      // Upload image if there's a new one
      if (imageFile && (savedBuilding?.id || (mode === 'edit' && building?.id))) {
        try {
          const buildingId = savedBuilding?.id || building?.id;
          console.log('📤 BuildingModal: Uploading image for building:', buildingId);
          await buildingApiService.uploadBuildingImage(buildingId, imageFile);
          console.log('✅ BuildingModal: Image uploaded successfully');
        } catch (imageError) {
          console.error('❌ BuildingModal: Error uploading image:', imageError);
          setError(`Gedung berhasil disimpan, tetapi gagal mengupload gambar: ${imageError.message}`);
          return; // Don't close modal so user can see the error
        }
      }
      
      onClose();
    } catch (error) {
      setError(error.message || 'Terjadi kesalahan saat menyimpan data');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-900/75 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-xl shadow-2xl border border-gray-200 w-full max-w-4xl max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">
            {mode === 'edit' ? 'Edit Lokasi/Gedung' : 'Tambah Lokasi/Gedung Baru'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {error && (
            <div className={`${error.includes('✅') ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'} border rounded-md p-3`}>
              <div className="flex">
                <div className="flex-shrink-0">
                  {error.includes('✅') ? (
                    <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  ) : (
                    <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                  )}
                </div>
                <div className="ml-3">
                  <h3 className={`text-sm font-medium ${error.includes('✅') ? 'text-green-800' : 'text-red-800'}`}>
                    {error.includes('✅') ? 'Success' : 'Error'}
                  </h3>
                  <div className={`mt-2 text-sm ${error.includes('✅') ? 'text-green-700' : 'text-red-700'}`}>
                    {error}
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Basic Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900">Informasi Dasar</h3>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nama Gedung *
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="e.g., Gedung Perkantoran Central"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Deskripsi
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="Deskripsi singkat tentang gedung..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Brand *
                </label>
                <select
                  name="brand"
                  value={formData.brand}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                  required
                >
                  <option value="">Pilih Brand</option>
                  {brands.map(brand => (
                    <option key={brand.value} value={brand.value}>
                      {brand.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Hero Image/Thumbnail
                </label>
                <div className="space-y-3">
                  {/* Image Preview */}
                  {imagePreview && (
                    <div className="relative w-full h-48 border-2 border-gray-200 rounded-lg overflow-hidden">
                      <img
                        src={imagePreview}
                        alt="Building preview"
                        className="w-full h-full object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          setImagePreview(null);
                          setImageFile(null);
                        }}
                        className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                  
                  {/* Upload Button */}
                  <div className="flex items-center justify-center w-full">
                    <label
                      htmlFor="building-image-upload"
                      className={`flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100 transition-colors ${uploadingImage ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      <div className="flex flex-col items-center justify-center pt-5 pb-6">
                        <Upload className="w-8 h-8 mb-4 text-gray-500" />
                        <p className="mb-2 text-sm text-gray-500">
                          <span className="font-semibold">Click to upload</span> building image
                        </p>
                        <p className="text-xs text-gray-500">PNG, JPG, WebP up to 5MB</p>
                      </div>
                      <input
                        id="building-image-upload"
                        type="file"
                        className="hidden"
                        accept="image/*"
                        onChange={handleImageUpload}
                        disabled={uploadingImage}
                      />
                    </label>
                  </div>
                  
                  {/* Image Error */}
                  {imageError && (
                    <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md p-2">
                      {imageError}
                    </div>
                  )}
                  
                  {/* Upload Progress */}
                  {uploadingImage && (
                    <div className="text-sm text-blue-600 bg-blue-50 border border-blue-200 rounded-md p-2">
                      Processing image...
                    </div>
                  )}
                </div>
              </div>

            </div>

            {/* Location */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900">Lokasi</h3>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Alamat Lengkap*
                </label>
                <div className="space-y-2">
                  <textarea
                    name="location.address"
                    value={formData.location.address}
                    onChange={handleInputChange}
                    rows={2}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder="Alamat lengkap gedung"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowMapModal(true)}
                    className="w-full px-3 py-2 border border-dashed border-blue-300 text-blue-600 rounded-md hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
                  >
                    <MapPin className="w-4 h-4 inline mr-2" />
                    Pilih Lokasi di Peta
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Kabupaten/Kota *
                  </label>
                  <input
                    type="text"
                    name="location.city"
                    value={formData.location.city}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder="e.g., Jakarta"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Provinsi *
                  </label>
                  <input
                    type="text"
                    name="location.province"
                    value={formData.location.province}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder="e.g., DKI Jakarta"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Negara *
                  </label>
                  <input
                    type="text"
                    name="location.country"
                    value={formData.location.country}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder="e.g., Indonesia"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Kode Pos
                  </label>
                  <input
                    type="text"
                    name="location.postalCode"
                    value={formData.location.postalCode}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder="e.g., 12345"
                  />
                </div>
              </div>


            </div>
          </div>



          {/* Status */}
          <div className="flex items-center">
            <input
              type="checkbox"
              name="isActive"
              checked={formData.isActive}
              onChange={handleInputChange}
              className="rounded border-gray-300 text-primary focus:ring-primary"
            />
            <label className="ml-2 text-sm font-medium text-gray-700">
              Gedung Aktif
            </label>
          </div>

          {/* Actions */}
          <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary"
              disabled={loading}
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-gradient-primary text-white rounded-md hover:bg-gradient-primary-hover focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Menyimpan...' : (mode === 'edit' ? 'Update Gedung' : 'Simpan Gedung')}
            </button>
          </div>
        </form>
      </div>

      {/* Google Maps Modal */}
      {showMapModal && (
        <div className="fixed inset-0 bg-gray-900/75 backdrop-blur-sm flex items-center justify-center z-60 p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-xl shadow-2xl border border-gray-200 w-full max-w-6xl max-h-[95vh] overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                <MapPin className="w-5 h-5 mr-2" />
                Set Lokasi Gedung
              </h3>
              <button
                onClick={() => {
                  setShowMapModal(false);
                  setPreviewLocationData(null);
                }}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-4">
              <div className="mb-4">
                <p className="text-sm text-gray-600 mb-2">
                  Klik pada peta untuk memilih lokasi gedung, lalu tekan tombol "Set Lokasi".
                </p>
                {formData.location.address && (
                  <div className="text-sm text-gray-700 bg-gray-50 p-2 rounded">
                    <strong>Alamat Saat Ini:</strong> {formData.location.address}
                  </div>
                )}
              </div>
              
              <GoogleMap
                coordinates={formData.location.latitude && formData.location.longitude ? {
                  lat: formData.location.latitude,
                  lng: formData.location.longitude
                } : null}
                onLocationSelect={handleLocationSelect}
                onLocationPreview={handleLocationPreview}
                enableManualSet={true}
                height="500px"
                className="border border-gray-300 rounded-md"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BuildingModal; 