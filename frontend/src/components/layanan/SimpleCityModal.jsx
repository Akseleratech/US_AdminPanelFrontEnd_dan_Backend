import React, { useState, useEffect } from 'react';

const SimpleCityModal = ({ isOpen, onClose, onSubmit, city = null, loading = false }) => {
  const [formData, setFormData] = useState({
    name: '',
    country: {
      id: 'ID',
      name: 'Indonesia',
      code: 'IDN',
      phoneCode: '+62'
    },
    location: {
      coordinates: {
        latitude: -6.2088,
        longitude: 106.8456
      },
      area: 0,
      elevation: 0
    },
    timezone: 'Asia/Jakarta',
    utcOffset: '+07:00',
    businessInfo: {
      isServiceAvailable: true,
      launchDate: new Date().toISOString().split('T')[0],
      currency: 'IDR',
      taxRate: 0.11
    },
    display: {
      featured: false,
      order: 999,
      description: '',
      descriptionEn: ''
    },
    isActive: true,
    isPopular: false,
    hasAirport: false,
    hasPublicTransport: false
  });

  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (city) {
      setFormData({
        name: city.name || '',
        country: {
          id: city.country?.id || 'ID',
          name: city.country?.name || 'Indonesia',
          code: city.country?.code || 'IDN',
          phoneCode: city.country?.phoneCode || '+62'
        },
        location: {
          coordinates: {
            latitude: city.location?.coordinates?.latitude || city.location?.latitude || -6.2088,
            longitude: city.location?.coordinates?.longitude || city.location?.longitude || 106.8456
          },
          area: city.location?.area || 0,
          elevation: city.location?.elevation || 0
        },
        timezone: city.timezone || 'Asia/Jakarta',
        utcOffset: city.utcOffset || '+07:00',
        businessInfo: {
          isServiceAvailable: city.businessInfo?.isServiceAvailable ?? true,
          launchDate: city.businessInfo?.launchDate || new Date().toISOString().split('T')[0],
          currency: city.businessInfo?.currency || 'IDR',
          taxRate: city.businessInfo?.taxRate || 0.11
        },
        display: {
          featured: city.display?.featured ?? false,
          order: city.display?.order || 999,
          description: city.display?.description || '',
          descriptionEn: city.display?.descriptionEn || ''
        },
        isActive: city.isActive ?? true,
        isPopular: city.isPopular ?? false,
        hasAirport: city.hasAirport ?? false,
        hasPublicTransport: city.hasPublicTransport ?? false
      });
    } else {
      // Reset form for new city
      const newFormData = {
        name: '',
        country: {
          id: 'ID',
          name: 'Indonesia',
          code: 'IDN',
          phoneCode: '+62'
        },
        location: {
          coordinates: {
            latitude: -6.2088,
            longitude: 106.8456
          },
          area: 0,
          elevation: 0
        },
        timezone: 'Asia/Jakarta',
        utcOffset: '+07:00',
        businessInfo: {
          isServiceAvailable: true,
          launchDate: new Date().toISOString().split('T')[0],
          currency: 'IDR',
          taxRate: 0.11
        },
        display: {
          featured: false,
          order: 999,
          description: '',
          descriptionEn: ''
        },
        isActive: true,
        isPopular: false,
        hasAirport: false,
        hasPublicTransport: false
      };
      setFormData(newFormData);
    }
    setErrors({});
  }, [city]);

  // Auto-generate descriptions when name changes
  useEffect(() => {
    if (formData.name && !city) {
      setFormData(prev => ({
        ...prev,
        display: {
          ...prev.display,
          description: `Discover workspaces in ${formData.name}`,
          descriptionEn: `Discover workspaces in ${formData.name}`
        }
      }));
    }
  }, [formData.name, city]);

  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = 'City name is required';
    }

    if (!formData.country.name.trim()) {
      newErrors['country.name'] = 'Country name is required';
    }

    if (formData.location.coordinates.latitude < -90 || formData.location.coordinates.latitude > 90) {
      newErrors['location.latitude'] = 'Latitude must be between -90 and 90';
    }

    if (formData.location.coordinates.longitude < -180 || formData.location.coordinates.longitude > 180) {
      newErrors['location.longitude'] = 'Longitude must be between -180 and 180';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    const keys = name.split('.');
    
    setFormData(prev => {
      const newData = { ...prev };
      let current = newData;
      
      for (let i = 0; i < keys.length - 1; i++) {
        current = current[keys[i]];
      }
      
      current[keys[keys.length - 1]] = type === 'checkbox' ? checked : 
                                      type === 'number' ? parseFloat(value) || 0 : value;
      return newData;
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validateForm()) {
      // Create the complete data structure expected by backend
      const completeData = {
        ...formData,
        // Add required fields that might be missing
        postalCodes: [],
        statistics: {
          totalSpaces: 0,
          activeSpaces: 0
        },
        businessInfo: {
          ...formData.businessInfo,
          supportedBrands: ['NextSpace', 'UnionSpace']
        },
        display: {
          ...formData.display,
          heroImage: '',
          thumbnailImage: '',
          tags: []
        },
        search: {
          keywords: [formData.name.toLowerCase()],
          aliases: [],
          slug: formData.name.toLowerCase().replace(/\s+/g, '-'),
          metaTitle: `Co-working Spaces in ${formData.name}`,
          metaDescription: `Find and book workspaces in ${formData.name}`
        }
      };
      
      onSubmit(completeData);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-2xl max-h-[90vh] overflow-hidden">
        <div className="flex justify-between items-center p-6 border-b">
          <h2 className="text-xl font-semibold">
            {city ? 'Edit City' : 'Add New City'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-6 overflow-y-auto max-h-[75vh]">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Information */}
            <div>
              <h3 className="text-lg font-medium mb-4">Basic Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    City Name *
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      errors.name ? 'border-red-300' : 'border-gray-300'
                    }`}
                    placeholder="Enter city name"
                  />
                  {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Country
                  </label>
                  <input
                    type="text"
                    name="country.name"
                    value={formData.country.name}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Indonesia"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Latitude
                  </label>
                  <input
                    type="number"
                    step="any"
                    name="location.coordinates.latitude"
                    value={formData.location.coordinates.latitude}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="-6.2088"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Longitude
                  </label>
                  <input
                    type="number"
                    step="any"
                    name="location.coordinates.longitude"
                    value={formData.location.coordinates.longitude}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="106.8456"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Launch Date
                  </label>
                  <input
                    type="date"
                    name="businessInfo.launchDate"
                    value={formData.businessInfo.launchDate}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Currency
                  </label>
                  <input
                    type="text"
                    name="businessInfo.currency"
                    value={formData.businessInfo.currency}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="IDR"
                  />
                </div>
              </div>
            </div>

            {/* Description */}
            <div>
              <h3 className="text-lg font-medium mb-4">Descriptions</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description (Indonesian)
                  </label>
                  <textarea
                    name="display.description"
                    value={formData.display.description}
                    onChange={handleInputChange}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Discover workspaces in this city"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description (English)
                  </label>
                  <textarea
                    name="display.descriptionEn"
                    value={formData.display.descriptionEn}
                    onChange={handleInputChange}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Discover workspaces in this city"
                  />
                </div>
              </div>
            </div>

            {/* Settings */}
            <div>
              <h3 className="text-lg font-medium mb-4">Settings</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    name="isActive"
                    checked={formData.isActive}
                    onChange={handleInputChange}
                    className="mr-2"
                  />
                  <label className="text-sm font-medium text-gray-700">
                    Active
                  </label>
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    name="isPopular"
                    checked={formData.isPopular}
                    onChange={handleInputChange}
                    className="mr-2"
                  />
                  <label className="text-sm font-medium text-gray-700">
                    Popular
                  </label>
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    name="hasAirport"
                    checked={formData.hasAirport}
                    onChange={handleInputChange}
                    className="mr-2"
                  />
                  <label className="text-sm font-medium text-gray-700">
                    Has Airport
                  </label>
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    name="hasPublicTransport"
                    checked={formData.hasPublicTransport}
                    onChange={handleInputChange}
                    className="mr-2"
                  />
                  <label className="text-sm font-medium text-gray-700">
                    Public Transport
                  </label>
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    name="display.featured"
                    checked={formData.display.featured}
                    onChange={handleInputChange}
                    className="mr-2"
                  />
                  <label className="text-sm font-medium text-gray-700">
                    Featured
                  </label>
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    name="businessInfo.isServiceAvailable"
                    checked={formData.businessInfo.isServiceAvailable}
                    onChange={handleInputChange}
                    className="mr-2"
                  />
                  <label className="text-sm font-medium text-gray-700">
                    Service Available
                  </label>
                </div>
              </div>
            </div>
          </form>
        </div>

        <div className="flex justify-end space-x-4 p-6 border-t bg-gray-50">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={loading}
          >
            Cancel
          </button>
          <button
            type="submit"
            onClick={handleSubmit}
            disabled={loading}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
          >
            {loading ? 'Saving...' : (city ? 'Update City' : 'Create City')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default SimpleCityModal; 