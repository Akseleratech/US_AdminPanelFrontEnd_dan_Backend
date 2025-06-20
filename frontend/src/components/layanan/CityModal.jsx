import React, { useState, useEffect } from 'react';

const CityModal = ({ isOpen, onClose, onSubmit, city = null, loading = false }) => {
  const [formData, setFormData] = useState({
    cityId: '',
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
      boundingBox: {
        northeast: { lat: 0, lng: 0 },
        southwest: { lat: 0, lng: 0 }
      },
      area: 0,
      elevation: 0
    },
    postalCodes: [''],
    timezone: 'Asia/Jakarta',
    utcOffset: '+07:00',
    statistics: {
      totalSpaces: 0,
      activeSpaces: 0
    },
    businessInfo: {
      isServiceAvailable: true,
      launchDate: new Date().toISOString().split('T')[0],
      supportedBrands: ['NextSpace', 'UnionSpace'],
      currency: 'IDR',
      taxRate: 0.11
    },
    display: {
      featured: false,
      order: 999,
      heroImage: '',
      thumbnailImage: '',
      description: '',
      descriptionEn: '',
      tags: ['']
    },
    search: {
      keywords: [''],
      aliases: [''],
      slug: '',
      metaTitle: '',
      metaDescription: ''
    },
    isActive: true,
    isPopular: false,
    hasAirport: false,
    hasPublicTransport: false
  });

  const [errors, setErrors] = useState({});

  // Auto-generate cityId and slug when name changes
  useEffect(() => {
    if (formData.name && !city) {
      const slug = formData.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
      const cityId = slug.toUpperCase().slice(0, 3) + '001';
      
      setFormData(prev => ({
        ...prev,
        cityId: cityId,
        search: {
          ...prev.search,
          slug: slug,
          metaTitle: `Co-working Spaces in ${formData.name} - NextSpace & UnionSpace`,
          metaDescription: `Find and book the best co-working spaces in ${formData.name}`,
          keywords: prev.search.keywords[0] === '' ? [formData.name.toLowerCase()] : [...prev.search.keywords, formData.name.toLowerCase()]
        }
      }));
    }
  }, [formData.name, city]);

  useEffect(() => {
    if (city) {
      setFormData({
        cityId: city.cityId || city.id || '',
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
          boundingBox: {
            northeast: {
              lat: city.location?.boundingBox?.northeast?.lat || 0,
              lng: city.location?.boundingBox?.northeast?.lng || 0
            },
            southwest: {
              lat: city.location?.boundingBox?.southwest?.lat || 0,
              lng: city.location?.boundingBox?.southwest?.lng || 0
            }
          },
          area: city.location?.area || 0,
          elevation: city.location?.elevation || 0
        },
        postalCodes: Array.isArray(city.postalCodes) && city.postalCodes.length > 0 
          ? city.postalCodes 
          : [''],
        timezone: city.timezone || 'Asia/Jakarta',
        utcOffset: city.utcOffset || '+07:00',
        statistics: {
          totalSpaces: city.statistics?.totalSpaces || 0,
          activeSpaces: city.statistics?.activeSpaces || 0
        },
        businessInfo: {
          isServiceAvailable: city.businessInfo?.isServiceAvailable ?? true,
          launchDate: city.businessInfo?.launchDate || new Date().toISOString().split('T')[0],
          supportedBrands: Array.isArray(city.businessInfo?.supportedBrands) 
            ? city.businessInfo.supportedBrands 
            : ['NextSpace', 'UnionSpace'],
          currency: city.businessInfo?.currency || 'IDR',
          taxRate: city.businessInfo?.taxRate || 0.11
        },
        display: {
          featured: city.display?.featured ?? false,
          order: city.display?.order || 999,
          heroImage: city.display?.heroImage || '',
          thumbnailImage: city.display?.thumbnailImage || '',
          description: city.display?.description || '',
          descriptionEn: city.display?.descriptionEn || '',
          tags: Array.isArray(city.display?.tags) && city.display.tags.length > 0 
            ? city.display.tags 
            : ['']
        },
        search: {
          keywords: Array.isArray(city.search?.keywords) && city.search.keywords.length > 0 
            ? city.search.keywords 
            : [''],
          aliases: Array.isArray(city.search?.aliases) && city.search.aliases.length > 0 
            ? city.search.aliases 
            : [''],
          slug: city.search?.slug || '',
          metaTitle: city.search?.metaTitle || '',
          metaDescription: city.search?.metaDescription || ''
        },
        isActive: city.isActive ?? true,
        isPopular: city.isPopular ?? false,
        hasAirport: city.hasAirport ?? false,
        hasPublicTransport: city.hasPublicTransport ?? false
      });
    } else {
      // Reset form for new city
      setFormData({
        cityId: '',
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
          boundingBox: {
            northeast: { lat: 0, lng: 0 },
            southwest: { lat: 0, lng: 0 }
          },
          area: 0,
          elevation: 0
        },
        postalCodes: [''],
        timezone: 'Asia/Jakarta',
        utcOffset: '+07:00',
        statistics: {
          totalSpaces: 0,
          activeSpaces: 0
        },
        businessInfo: {
          isServiceAvailable: true,
          launchDate: new Date().toISOString().split('T')[0],
          supportedBrands: ['NextSpace', 'UnionSpace'],
          currency: 'IDR',
          taxRate: 0.11
        },
        display: {
          featured: false,
          order: 999,
          heroImage: '',
          thumbnailImage: '',
          description: '',
          descriptionEn: '',
          tags: ['']
        },
        search: {
          keywords: [''],
          aliases: [''],
          slug: '',
          metaTitle: '',
          metaDescription: ''
        },
        isActive: true,
        isPopular: false,
        hasAirport: false,
        hasPublicTransport: false
      });
    }
    setErrors({});
  }, [city]);

  // Auto-generate slug when name changes
  useEffect(() => {
    if (formData.name && !city) {
      const slug = formData.name.toLowerCase().replace(/\s+/g, '-');
      setFormData(prev => ({
        ...prev,
        search: {
          ...prev.search,
          slug,
          metaTitle: `Co-working Spaces in ${formData.name}`,
          metaDescription: `Find and book workspaces in ${formData.name}`
        },
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

    if (formData.businessInfo.taxRate < 0 || formData.businessInfo.taxRate > 1) {
      newErrors['businessInfo.taxRate'] = 'Tax rate must be between 0 and 1';
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

  const handleArrayChange = (arrayPath, index, value) => {
    const keys = arrayPath.split('.');
    setFormData(prev => {
      const newData = { ...prev };
      let current = newData;
      
      for (let i = 0; i < keys.length - 1; i++) {
        current = current[keys[i]];
      }
      
      const array = [...current[keys[keys.length - 1]]];
      array[index] = value;
      current[keys[keys.length - 1]] = array;
      
      return newData;
    });
  };

  const addArrayItem = (arrayPath) => {
    const keys = arrayPath.split('.');
    setFormData(prev => {
      const newData = { ...prev };
      let current = newData;
      
      for (let i = 0; i < keys.length - 1; i++) {
        current = current[keys[i]];
      }
      
      current[keys[keys.length - 1]] = [...current[keys[keys.length - 1]], ''];
      return newData;
    });
  };

  const removeArrayItem = (arrayPath, index) => {
    const keys = arrayPath.split('.');
    setFormData(prev => {
      const newData = { ...prev };
      let current = newData;
      
      for (let i = 0; i < keys.length - 1; i++) {
        current = current[keys[i]];
      }
      
      const array = [...current[keys[keys.length - 1]]];
      array.splice(index, 1);
      if (array.length === 0) array.push('');
      current[keys[keys.length - 1]] = array;
      
      return newData;
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log('CityModal: handleSubmit called');
    console.log('CityModal: Form validation:', validateForm());
    console.log('CityModal: formData:', formData);
    
    if (validateForm()) {
      // Clean up empty strings from arrays
      const cleanData = {
        ...formData,
        postalCodes: formData.postalCodes.filter(code => code.trim()),
        businessInfo: {
          ...formData.businessInfo,
          supportedBrands: formData.businessInfo.supportedBrands.filter(brand => brand.trim())
        },
        display: {
          ...formData.display,
          tags: formData.display.tags.filter(tag => tag.trim())
        },
        search: {
          ...formData.search,
          keywords: formData.search.keywords.filter(keyword => keyword.trim()),
          aliases: formData.search.aliases.filter(alias => alias.trim())
        }
      };
      
      console.log('CityModal: Cleaned data to submit:', cleanData);
      onSubmit(cleanData);
    } else {
      console.log('CityModal: Form validation failed, errors:', errors);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] overflow-hidden">
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
            <div className="border-b pb-6">
              <h3 className="text-lg font-medium mb-4">Basic Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    City ID {!city && <span className="text-gray-500">(auto-generated)</span>}
                  </label>
                  <input
                    type="text"
                    name="cityId"
                    value={formData.cityId}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="JKT001"
                    disabled={Boolean(city)}
                  />
                </div>

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
                    Country Name *
                  </label>
                  <input
                    type="text"
                    name="country.name"
                    value={formData.country.name}
                    onChange={handleInputChange}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      errors['country.name'] ? 'border-red-300' : 'border-gray-300'
                    }`}
                    placeholder="Enter country name"
                  />
                  {errors['country.name'] && <p className="text-red-500 text-sm mt-1">{errors['country.name']}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Country Code
                  </label>
                  <input
                    type="text"
                    name="country.code"
                    value={formData.country.code}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="IDN"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Phone Code
                  </label>
                  <input
                    type="text"
                    name="country.phoneCode"
                    value={formData.country.phoneCode}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="+62"
                  />
                </div>
              </div>
            </div>

            {/* Location Information */}
            <div className="border-b pb-6">
              <h3 className="text-lg font-medium mb-4">Location Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      errors['location.latitude'] ? 'border-red-300' : 'border-gray-300'
                    }`}
                    placeholder="-6.2088"
                  />
                  {errors['location.latitude'] && <p className="text-red-500 text-sm mt-1">{errors['location.latitude']}</p>}
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
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      errors['location.longitude'] ? 'border-red-300' : 'border-gray-300'
                    }`}
                    placeholder="106.8456"
                  />
                  {errors['location.longitude'] && <p className="text-red-500 text-sm mt-1">{errors['location.longitude']}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Area (km²)
                  </label>
                  <input
                    type="number"
                    step="any"
                    name="location.area"
                    value={formData.location.area}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="664.01"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Elevation (m)
                  </label>
                  <input
                    type="number"
                    name="location.elevation"
                    value={formData.location.elevation}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="8"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Timezone
                  </label>
                  <input
                    type="text"
                    name="timezone"
                    value={formData.timezone}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Asia/Jakarta"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    UTC Offset
                  </label>
                  <input
                    type="text"
                    name="utcOffset"
                    value={formData.utcOffset}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="+07:00"
                  />
                </div>
              </div>

              {/* Bounding Box */}
              <div className="mt-4">
                <h4 className="text-md font-medium mb-3">Bounding Box (Optional)</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      NE Latitude
                    </label>
                    <input
                      type="number"
                      step="any"
                      name="location.boundingBox.northeast.lat"
                      value={formData.location.boundingBox.northeast.lat}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="-6.0744"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      NE Longitude
                    </label>
                    <input
                      type="number"
                      step="any"
                      name="location.boundingBox.northeast.lng"
                      value={formData.location.boundingBox.northeast.lng}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="106.9758"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      SW Latitude
                    </label>
                    <input
                      type="number"
                      step="any"
                      name="location.boundingBox.southwest.lat"
                      value={formData.location.boundingBox.southwest.lat}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="-6.3676"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      SW Longitude
                    </label>
                    <input
                      type="number"
                      step="any"
                      name="location.boundingBox.southwest.lng"
                      value={formData.location.boundingBox.southwest.lng}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="106.6924"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Postal Codes */}
            <div className="border-b pb-6">
              <h3 className="text-lg font-medium mb-4">Postal Codes</h3>
              {formData.postalCodes.map((code, index) => (
                <div key={index} className="flex gap-2 mb-2">
                  <input
                    type="text"
                    value={code}
                    onChange={(e) => handleArrayChange('postalCodes', index, e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="10110"
                  />
                  <button
                    type="button"
                    onClick={() => removeArrayItem('postalCodes', index)}
                    className="px-3 py-2 text-red-600 hover:text-red-800"
                  >
                    Remove
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={() => addArrayItem('postalCodes')}
                className="text-blue-600 hover:text-blue-800 text-sm"
              >
                + Add Postal Code
              </button>
            </div>

            {/* Business Information */}
            <div className="border-b pb-6">
              <h3 className="text-lg font-medium mb-4">Business Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tax Rate (0-1)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    name="businessInfo.taxRate"
                    value={formData.businessInfo.taxRate}
                    onChange={handleInputChange}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      errors['businessInfo.taxRate'] ? 'border-red-300' : 'border-gray-300'
                    }`}
                    placeholder="0.11"
                  />
                  {errors['businessInfo.taxRate'] && <p className="text-red-500 text-sm mt-1">{errors['businessInfo.taxRate']}</p>}
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

            {/* Display Information */}
            <div className="border-b pb-6">
              <h3 className="text-lg font-medium mb-4">Display Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description (ID)
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
                    Description (EN)
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

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Display Order
                  </label>
                  <input
                    type="number"
                    name="display.order"
                    value={formData.display.order}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="999"
                  />
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
                    Featured City
                  </label>
                </div>
              </div>
            </div>

            {/* SEO Information */}
            <div className="border-b pb-6">
              <h3 className="text-lg font-medium mb-4">SEO Information</h3>
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    URL Slug
                  </label>
                  <input
                    type="text"
                    name="search.slug"
                    value={formData.search.slug}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="city-name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Meta Title
                  </label>
                  <input
                    type="text"
                    name="search.metaTitle"
                    value={formData.search.metaTitle}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Co-working Spaces in City Name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Meta Description
                  </label>
                  <textarea
                    name="search.metaDescription"
                    value={formData.search.metaDescription}
                    onChange={handleInputChange}
                    rows={2}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Find and book workspaces in this city"
                  />
                </div>
              </div>
            </div>

            {/* City Features */}
            <div>
              <h3 className="text-lg font-medium mb-4">City Features</h3>
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

export default CityModal; 