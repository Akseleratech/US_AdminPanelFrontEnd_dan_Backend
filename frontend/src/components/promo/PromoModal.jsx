import React, { useState, useEffect } from 'react';
import { X, Upload, Image, AlertCircle, Eye, RotateCcw } from 'lucide-react';
import { promosAPI } from '../../services/api';

const PromoModal = ({ isOpen, onClose, promo, onSave }) => {
  // Form state
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    type: 'banner', // Default to banner
    isActive: true,
    order: 0
  });

  // Image state
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [imageError, setImageError] = useState('');

  // UI state
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  // Reset form when modal opens/closes or promo changes
  useEffect(() => {
    if (isOpen) {
      if (promo) {
        // Edit mode
        setFormData({
          title: promo.title || '',
          description: promo.description || '',
          type: promo.type || 'banner',
          isActive: promo.isActive !== undefined ? promo.isActive : true,
          order: promo.order || 0
        });
        setImagePreview(promo.image || null);
      } else {
        // Create mode
        setFormData({
          title: '',
          description: '',
          type: 'banner',
          isActive: true,
          order: 0
        });
        setImagePreview(null);
      }
      setImageFile(null);
      setErrors({});
      setImageError('');
    }
  }, [isOpen, promo]);

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    
    // Clear error for this field
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  // Handle image upload
  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setImageError('Please select a valid image file');
      return;
    }

    // Validate file size (5MB limit)
    if (file.size > 5 * 1024 * 1024) {
      setImageError('Image size must be less than 5MB');
      return;
    }

    setImageError('');
    setImageFile(file);

    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setImagePreview(e.target.result);
    };
    reader.readAsDataURL(file);
  };

  // Remove image
  const removeImage = () => {
    setImageFile(null);
    setImagePreview(promo?.image || null);
    setImageError('');
    
    // Reset file input
    const fileInput = document.getElementById('promo-image-upload');
    if (fileInput) fileInput.value = '';
  };

  // Form validation
  const validateForm = () => {
    const newErrors = {};

    if (!formData.title.trim()) {
      newErrors.title = 'Title is required';
    } else if (formData.title.length < 2 || formData.title.length > 100) {
      newErrors.title = 'Title must be between 2 and 100 characters';
    }

    if (formData.description && formData.description.length > 500) {
      newErrors.description = 'Description must be less than 500 characters';
    }

    if (!['banner', 'section'].includes(formData.type)) {
      newErrors.type = 'Please select a valid promo type';
    }

    if (formData.order < 0) {
      newErrors.order = 'Order must be a non-negative number';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setLoading(true);
    try {
      let savedPromo;
      
      if (promo) {
        // Update existing promo
        savedPromo = await promosAPI.update(promo.id, formData);
      } else {
        // Create new promo
        savedPromo = await promosAPI.create(formData);
      }

      // Upload image if selected
      if (imageFile) {
        setUploadingImage(true);
        try {
          await promosAPI.uploadImage(savedPromo.id, imageFile);
        } catch (imageUploadError) {
          console.error('Image upload failed:', imageUploadError);
          setImageError('Failed to upload image. The promo was saved without image.');
        } finally {
          setUploadingImage(false);
        }
      }

      onSave();
      onClose();
    } catch (error) {
      console.error('Error saving promo:', error);
      if (error.message.includes('errors')) {
        const errorLines = error.message.split('\n');
        const newErrors = {};
        errorLines.forEach(line => {
          if (line.includes('Title')) newErrors.title = line.replace('• ', '');
          if (line.includes('Description')) newErrors.description = line.replace('• ', '');
          if (line.includes('Type')) newErrors.type = line.replace('• ', '');
          if (line.includes('Order')) newErrors.order = line.replace('• ', '');
        });
        setErrors(newErrors);
      }
    } finally {
      setLoading(false);
    }
  };

  const getTypeDescription = (type) => {
    switch (type) {
      case 'banner':
        return 'Banner promosi yang akan ditampilkan di header aplikasi mobile sebagai slideshow yang bergeser otomatis.';
      case 'section':
        return 'Promosi yang akan ditampilkan dalam section khusus di aplikasi mobile.';
      default:
        return '';
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-full max-w-2xl shadow-lg rounded-md bg-white">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-900">
            {promo ? 'Edit Promo' : 'Tambah Promo Baru'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            disabled={loading || uploadingImage}
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Title */}
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
              Judul Promo <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="title"
              name="title"
              value={formData.title}
              onChange={handleInputChange}
              className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.title ? 'border-red-300' : 'border-gray-300'
              }`}
              placeholder="Masukkan judul promo"
              maxLength={100}
              disabled={loading || uploadingImage}
            />
            {errors.title && (
              <p className="mt-1 text-sm text-red-600 flex items-center">
                <AlertCircle className="h-4 w-4 mr-1" />
                {errors.title}
              </p>
            )}
            <p className="mt-1 text-xs text-gray-500">
              {formData.title.length}/100 karakter
            </p>
          </div>

          {/* Description */}
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
              Deskripsi
            </label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              rows={3}
              className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.description ? 'border-red-300' : 'border-gray-300'
              }`}
              placeholder="Deskripsi promo (opsional)"
              maxLength={500}
              disabled={loading || uploadingImage}
            />
            {errors.description && (
              <p className="mt-1 text-sm text-red-600 flex items-center">
                <AlertCircle className="h-4 w-4 mr-1" />
                {errors.description}
              </p>
            )}
            <p className="mt-1 text-xs text-gray-500">
              {formData.description.length}/500 karakter
            </p>
          </div>

          {/* Type */}
          <div>
            <label htmlFor="type" className="block text-sm font-medium text-gray-700 mb-1">
              Tipe Promo <span className="text-red-500">*</span>
            </label>
            <select
              id="type"
              name="type"
              value={formData.type}
              onChange={handleInputChange}
              className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.type ? 'border-red-300' : 'border-gray-300'
              }`}
              disabled={loading || uploadingImage}
            >
              <option value="banner">Banner Header</option>
              <option value="section">Section Promo</option>
            </select>
            {errors.type && (
              <p className="mt-1 text-sm text-red-600 flex items-center">
                <AlertCircle className="h-4 w-4 mr-1" />
                {errors.type}
              </p>
            )}
            <p className="mt-1 text-xs text-gray-600">
              {getTypeDescription(formData.type)}
            </p>
          </div>

          {/* Order and Active Status */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="order" className="block text-sm font-medium text-gray-700 mb-1">
                Urutan
              </label>
              <input
                type="number"
                id="order"
                name="order"
                value={formData.order}
                onChange={handleInputChange}
                min="0"
                className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.order ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="0"
                disabled={loading || uploadingImage}
              />
              {errors.order && (
                <p className="mt-1 text-sm text-red-600 flex items-center">
                  <AlertCircle className="h-4 w-4 mr-1" />
                  {errors.order}
                </p>
              )}
              <p className="mt-1 text-xs text-gray-500">
                Urutan tampil (semakin kecil semakin awal)
              </p>
            </div>

            <div className="flex items-center mt-6">
              <input
                type="checkbox"
                id="isActive"
                name="isActive"
                checked={formData.isActive}
                onChange={handleInputChange}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                disabled={loading || uploadingImage}
              />
              <label htmlFor="isActive" className="ml-2 block text-sm text-gray-700">
                Aktif
              </label>
            </div>
          </div>

          {/* Image Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Gambar Promo
            </label>
            
            {/* Upload Area */}
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors">
              {imagePreview ? (
                <div className="space-y-4">
                  {/* Image Preview */}
                  <div className="relative inline-block">
                    <img
                      src={imagePreview}
                      alt="Preview"
                      className="max-w-full max-h-48 object-contain rounded-lg"
                    />
                    {imageFile && (
                      <div className="absolute top-2 right-2 bg-blue-500 text-white px-2 py-1 rounded text-xs">
                        New
                      </div>
                    )}
                  </div>
                  
                  {/* Image Actions */}
                  <div className="flex justify-center space-x-2">
                    <button
                      type="button"
                      onClick={() => document.getElementById('promo-image-upload').click()}
                      className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors flex items-center"
                      disabled={loading || uploadingImage}
                    >
                      <RotateCcw className="h-4 w-4 mr-2" />
                      Ganti
                    </button>
                    <button
                      type="button"
                      onClick={removeImage}
                      className="px-4 py-2 bg-red-100 text-red-700 rounded-md hover:bg-red-200 transition-colors"
                      disabled={loading || uploadingImage}
                    >
                      Hapus
                    </button>
                  </div>
                </div>
              ) : (
                <div onClick={() => document.getElementById('promo-image-upload').click()} className="cursor-pointer">
                  <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                  <div className="text-sm text-gray-600">
                    <span className="font-medium text-blue-600 hover:text-blue-500">
                      Klik untuk upload
                    </span> atau drag and drop
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    PNG, JPG, JPEG up to 5MB
                  </p>
                </div>
              )}
              
              <input
                id="promo-image-upload"
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
                disabled={loading || uploadingImage}
              />
            </div>

            {imageError && (
              <p className="mt-2 text-sm text-red-600 flex items-center">
                <AlertCircle className="h-4 w-4 mr-1" />
                {imageError}
              </p>
            )}
          </div>

          {/* Form Actions */}
          <div className="flex items-center justify-end space-x-3 pt-6 border-t">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
              disabled={loading || uploadingImage}
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
              disabled={loading || uploadingImage}
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  {promo ? 'Mengupdate...' : 'Menyimpan...'}
                </>
              ) : uploadingImage ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Upload Gambar...
                </>
              ) : (
                promo ? 'Update Promo' : 'Simpan Promo'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PromoModal; 