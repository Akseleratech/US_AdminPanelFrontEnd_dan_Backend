import React, { useState, useEffect } from 'react';
import { X, Save, Loader2 } from 'lucide-react';

const ServiceModal = ({ 
  isOpen, 
  onClose, 
  onSave, 
  service = null, 
  mode = 'add' // 'add' or 'edit'
}) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    serviceId: '',
    name: '',
    slug: '',
    description: '',
    status: 'draft'
  });

  const [errors, setErrors] = useState({});



  const statusOptions = [
    { value: 'draft', label: 'Draft' },
    { value: 'published', label: 'Published' },
    { value: 'archived', label: 'Archived' }
  ];

  // Auto-generate serviceId when name changes
  useEffect(() => {
    if (formData.name && mode === 'add') {
      const slug = generateSlug(formData.name);
      const serviceId = `SVC${Date.now().toString().slice(-6)}`;
      
      setFormData(prev => ({
        ...prev,
        serviceId: serviceId,
        slug: slug
      }));
    }
  }, [formData.name, mode]);

  useEffect(() => {
    if (service && mode === 'edit') {
      setFormData({
        serviceId: service.serviceId || service.id || '',
        name: service.name || '',
        slug: service.slug || '',
        description: typeof service.description === 'object' 
          ? service.description.short || service.description.long || ''
          : service.description || '',
        status: service.status || 'draft'
      });
    } else {
      // Reset form for add mode
      setFormData({
        serviceId: '',
        name: '',
        slug: '',
        description: '',
        status: 'draft'
      });
    }
    setErrors({});
  }, [service, mode, isOpen]);

  const generateSlug = (name) => {
    return name
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '');
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));

    // Clear error for this field
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Nama layanan wajib diisi';
    }

    if (!formData.description.trim()) {
      newErrors.description = 'Deskripsi wajib diisi';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    try {
      console.log('ServiceModal: Submitting form data:', formData);
      
      // Prepare data in the format expected by backend
      const submitData = {
        ...formData,
        // Convert simple description to complex format for backend compatibility
        description: {
          short: formData.description,
          long: formData.description,
          shortEn: formData.description,
          longEn: formData.description
        },
        // Add required metrics with default values
        metrics: {
          totalSubscribers: 0,
          activeSubscribers: 0,
          monthlySignups: 0,
          churnRate: 0,
          averageLifetimeValue: 0,
          customerSatisfactionScore: 0,
          netPromoterScore: 0
        }
      };
      
      const result = await onSave(submitData);
      console.log('ServiceModal: Save result:', result);
      onClose();
    } catch (error) {
      console.error('ServiceModal: Error saving service:', error);
      console.error('ServiceModal: Error details:', error.response?.data);
      setErrors({ submit: `Gagal menyimpan layanan: ${error.message}` });
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-gray-200 sticky top-0 bg-white z-10">
          <h2 className="text-xl font-semibold text-gray-900">
            {mode === 'add' ? 'Tambah Layanan Baru' : 'Edit Layanan'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            disabled={loading}
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {errors.submit && (
            <div className="bg-red-50 border border-red-200 rounded-md p-3">
              <p className="text-sm text-red-600">{errors.submit}</p>
            </div>
          )}

          {/* Service ID - Auto Generated */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Service ID {mode === 'add' && <span className="text-gray-500">(otomatis dibuat)</span>}
            </label>
            <input
              type="text"
              value={formData.serviceId}
              className="w-full border border-gray-300 rounded-md px-3 py-2 bg-gray-50 focus:outline-none"
              placeholder="Service ID akan dibuat otomatis"
              disabled
            />
          </div>

          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nama Layanan *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              className={`w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.name ? 'border-red-300' : 'border-gray-300'
              }`}
              placeholder="Masukkan nama layanan"
            />
            {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name}</p>}
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Deskripsi Layanan *
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              rows={4}
              className={`w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.description ? 'border-red-300' : 'border-gray-300'
              }`}
              placeholder="Masukkan deskripsi layanan"
            />
            {errors.description && <p className="mt-1 text-sm text-red-600">{errors.description}</p>}
          </div>

          {/* Status */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Status
            </label>
            <select
              value={formData.status}
              onChange={(e) => handleInputChange('status', e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {statusOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          {/* Form Actions */}
          <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={loading}
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 flex items-center"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Menyimpan...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  {mode === 'add' ? 'Tambah Layanan' : 'Simpan Perubahan'}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ServiceModal; 