import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';

const SpaceModal = ({ isOpen, onClose, onSave, space, mode }) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    brand: '',
    category: '',
    spaceType: '',
    capacity: '',
    location: {
      address: '',
      city: '',
      province: '',
      postalCode: '',
      country: 'Indonesia'
    },
    pricing: {
      hourly: '',
      daily: '',
      monthly: '',
      currency: 'IDR'
    },
    amenities: [],
    isActive: true
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Categories and space types
  const categories = [
    { value: 'co-working', label: 'Co-working Space' },
    { value: 'meeting-room', label: 'Meeting Room' },
    { value: 'private-office', label: 'Private Office' },
    { value: 'event-space', label: 'Event Space' },
    { value: 'virtual-office', label: 'Virtual Office' }
  ];

  const spaceTypes = [
    { value: 'open-space', label: 'Open Space' },
    { value: 'private-room', label: 'Private Room' },
    { value: 'meeting-room', label: 'Meeting Room' },
    { value: 'conference-room', label: 'Conference Room' }
  ];

  const brands = [
    { value: 'UnionSpace', label: 'UnionSpace' },
    { value: 'NextSpace', label: 'NextSpace' },
    { value: 'Partner', label: 'Partner Space' }
  ];

  const commonAmenities = [
    'WiFi', 'AC', 'Projector', 'Whiteboard', 'Coffee', 'Printer', 
    'Parking', 'Security', 'Kitchen', 'Phone Booth', 'Lounge', 'Garden'
  ];

  // Reset form when modal opens/closes or space changes
  useEffect(() => {
    if (isOpen) {
      if (mode === 'edit' && space) {
        setFormData({
          name: space.name || '',
          description: space.description || '',
          brand: space.brand || '',
          category: space.category || '',
          spaceType: space.spaceType || '',
          capacity: space.capacity || '',
          location: {
            address: space.location?.address || '',
            city: space.location?.city || '',
            province: space.location?.province || '',
            postalCode: space.location?.postalCode || '',
            country: space.location?.country || 'Indonesia'
          },
          pricing: {
            hourly: space.pricing?.hourly || '',
            daily: space.pricing?.daily || '',
            monthly: space.pricing?.monthly || '',
            currency: space.pricing?.currency || 'IDR'
          },
          amenities: space.amenities || [],
          isActive: space.isActive !== undefined ? space.isActive : true
        });
      } else {
        // Reset form for add mode
        setFormData({
          name: '',
          description: '',
          brand: '',
          category: '',
          spaceType: '',
          capacity: '',
          location: {
            address: '',
            city: '',
            province: '',
            postalCode: '',
            country: 'Indonesia'
          },
          pricing: {
            hourly: '',
            daily: '',
            monthly: '',
            currency: 'IDR'
          },
          amenities: [],
          isActive: true
        });
      }
      setError('');
    }
  }, [isOpen, mode, space]);

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

  const handleAmenityToggle = (amenity) => {
    setFormData(prev => ({
      ...prev,
      amenities: prev.amenities.includes(amenity)
        ? prev.amenities.filter(a => a !== amenity)
        : [...prev.amenities, amenity]
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Validate required fields
      if (!formData.name.trim()) {
        throw new Error('Space name is required');
      }
      if (!formData.brand) {
        throw new Error('Brand is required');
      }
      if (!formData.category) {
        throw new Error('Category is required');
      }

      // Prepare data for API
      const submitData = {
        ...formData,
        capacity: parseInt(formData.capacity) || 0,
        pricing: {
          ...formData.pricing,
          hourly: parseFloat(formData.pricing.hourly) || 0,
          daily: parseFloat(formData.pricing.daily) || 0,
          monthly: parseFloat(formData.pricing.monthly) || 0
        }
      };

      await onSave(submitData);
      onClose();
    } catch (err) {
      console.error('SpaceModal: Error saving space:', err);
      setError(err.message || 'Failed to save space');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">
            {mode === 'edit' ? 'Edit Space' : 'Add New Space'}
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
            <div className="bg-red-50 border border-red-200 rounded-md p-3">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-red-800">Error</h3>
                  <div className="mt-2 text-sm text-red-700">{error}</div>
                </div>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Basic Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900">Basic Information</h3>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Space Name *
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="e.g., Downtown Co-working Hub"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="Brief description of the space..."
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
                  <option value="">Select Brand</option>
                  {brands.map(brand => (
                    <option key={brand.value} value={brand.value}>
                      {brand.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Category *
                </label>
                <select
                  name="category"
                  value={formData.category}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                  required
                >
                  <option value="">Select Category</option>
                  {categories.map(category => (
                    <option key={category.value} value={category.value}>
                      {category.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Space Type
                </label>
                <select
                  name="spaceType"
                  value={formData.spaceType}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="">Select Space Type</option>
                  {spaceTypes.map(type => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Capacity (people)
                </label>
                <input
                  type="number"
                  name="capacity"
                  value={formData.capacity}
                  onChange={handleInputChange}
                  min="1"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="e.g., 50"
                />
              </div>
            </div>

            {/* Location & Pricing */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900">Location & Pricing</h3>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Address
                </label>
                <textarea
                  name="location.address"
                  value={formData.location.address}
                  onChange={handleInputChange}
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="Street address"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    City
                  </label>
                  <input
                    type="text"
                    name="location.city"
                    value={formData.location.city}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder="e.g., Jakarta"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Province
                  </label>
                  <input
                    type="text"
                    name="location.province"
                    value={formData.location.province}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder="e.g., DKI Jakarta"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Postal Code
                  </label>
                  <input
                    type="text"
                    name="location.postalCode"
                    value={formData.location.postalCode}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder="e.g., 10220"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Country
                  </label>
                  <input
                    type="text"
                    name="location.country"
                    value={formData.location.country}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                    readOnly
                  />
                </div>
              </div>

              {/* Pricing */}
              <div className="space-y-3">
                <h4 className="font-medium text-gray-900">Pricing (IDR)</h4>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Hourly
                    </label>
                    <input
                      type="number"
                      name="pricing.hourly"
                      value={formData.pricing.hourly}
                      onChange={handleInputChange}
                      min="0"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                      placeholder="50000"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Daily
                    </label>
                    <input
                      type="number"
                      name="pricing.daily"
                      value={formData.pricing.daily}
                      onChange={handleInputChange}
                      min="0"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                      placeholder="300000"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Monthly
                    </label>
                    <input
                      type="number"
                      name="pricing.monthly"
                      value={formData.pricing.monthly}
                      onChange={handleInputChange}
                      min="0"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                      placeholder="2000000"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Amenities */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-3">Amenities</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {commonAmenities.map(amenity => (
                <label key={amenity} className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.amenities.includes(amenity)}
                    onChange={() => handleAmenityToggle(amenity)}
                    className="rounded border-gray-300 text-primary focus:ring-primary"
                  />
                  <span className="ml-2 text-sm text-gray-700">{amenity}</span>
                </label>
              ))}
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
              Active Space
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
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-gradient-primary text-white rounded-md hover:bg-gradient-primary-hover focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Saving...' : (mode === 'edit' ? 'Update Space' : 'Create Space')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SpaceModal; 