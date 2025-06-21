import React, { useState, useEffect } from 'react';
import indonesiaData from '../../data/indonesia.json';

// Data referensi dari JSON
const COUNTRIES = indonesiaData.countries;
const PROVINCES = indonesiaData.provinces;

const CITIES = indonesiaData.cities;

const SimpleCityModal = ({ isOpen, onClose, onSubmit, city = null, loading = false }) => {
  const [formData, setFormData] = useState({
    country: {
      id: 'ID',
      name: 'Indonesia',
      code: 'IDN',
      phoneCode: '+62'
    },
    province: '',
    name: '',
    location: {
      coordinates: {
        latitude: -6.2088,
        longitude: 106.8456
      },
      area: 0,
      elevation: 0
    },
    timezone: 'Asia/Jakarta',
    utcOffset: '+07:00'
  });

  const [errors, setErrors] = useState({});
  const [availableProvinces, setAvailableProvinces] = useState([]);
  const [availableCities, setAvailableCities] = useState([]);



  useEffect(() => {
    if (city) {
      const selectedCountry = COUNTRIES.find(c => c.name === city.country?.name) || COUNTRIES[0];
      setFormData({
        country: selectedCountry,
        province: city.province || '',
        name: city.name || '',
        location: {
          coordinates: {
            latitude: city.location?.coordinates?.latitude || city.location?.latitude || -6.2088,
            longitude: city.location?.coordinates?.longitude || city.location?.longitude || 106.8456
          },
          area: city.location?.area || 0,
          elevation: city.location?.elevation || 0
        },
        timezone: city.timezone || 'Asia/Jakarta',
        utcOffset: city.utcOffset || '+07:00'
      });

      // Set available provinces for the selected country
      setAvailableProvinces(PROVINCES[selectedCountry.id] || []);
      
      // Set available cities for the selected province
      if (city.province) {
        setAvailableCities(CITIES[city.province] || []);
      }
    } else {
      // Reset form for new city
      const defaultCountry = COUNTRIES[0];
      const newFormData = {
        country: defaultCountry,
        province: '',
        name: '',
        location: {
          coordinates: {
            latitude: -6.2088,
            longitude: 106.8456
          },
          area: 0,
          elevation: 0
        },
        timezone: 'Asia/Jakarta',
        utcOffset: '+07:00'
      };
      setFormData(newFormData);
      setAvailableProvinces(PROVINCES[defaultCountry.id] || []);
      setAvailableCities([]);
    }
    setErrors({});
  }, [city]);

  const validateForm = () => {
    const newErrors = {};

    if (!formData.country.name) {
      newErrors.country = 'Country is required';
    }

    if (!formData.province.trim()) {
      newErrors.province = 'Province is required';
    }

    if (!formData.name.trim()) {
      newErrors.name = 'City/Regency name is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleCountryChange = (e) => {
    const selectedCountryName = e.target.value;
    const selectedCountry = COUNTRIES.find(c => c.name === selectedCountryName) || COUNTRIES[0];
    
    setFormData(prev => ({
      ...prev,
      country: selectedCountry,
      province: '', // Reset province when country changes
      name: '' // Reset city when country changes
    }));

    // Update available provinces
    setAvailableProvinces(PROVINCES[selectedCountry.id] || []);
    setAvailableCities([]); // Clear cities when country changes
  };

  const handleProvinceChange = (e) => {
    const selectedProvince = e.target.value;
    
    setFormData(prev => ({
      ...prev,
      province: selectedProvince,
      name: '' // Reset city when province changes
    }));

    // Update available cities
    setAvailableCities(CITIES[selectedProvince] || []);
  };

  const handleCityChange = (e) => {
    const selectedCityName = e.target.value;
    
    // Find the selected city data
    const selectedCityData = availableCities.find(city => city.name === selectedCityName);
    
    if (selectedCityData) {
      setFormData(prev => ({
        ...prev,
        name: selectedCityName,
        location: {
          coordinates: {
            latitude: selectedCityData.coordinates.latitude,
            longitude: selectedCityData.coordinates.longitude
          },
          area: selectedCityData.area,
          elevation: selectedCityData.elevation
        },
        timezone: selectedCityData.timezone,
        utcOffset: selectedCityData.utcOffset
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        name: selectedCityName
      }));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validateForm()) {
      // Create the simplified data structure
      const completeData = {
        ...formData,
        // Add minimal required fields
        postalCodes: [],
        statistics: {
          totalSpaces: 0,
          activeSpaces: 0
        },
        search: {
          keywords: [formData.name.toLowerCase()],
          aliases: [],
          slug: formData.name.toLowerCase().replace(/\s+/g, '-'),
          metaTitle: `Co-working Spaces in ${formData.name}`,
          metaDescription: `Find and book workspaces in ${formData.name}`
        },
        isActive: true
      };
      
      onSubmit(completeData);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-900/75 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-xl shadow-2xl border border-gray-200 w-full max-w-md max-h-[90vh] overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="flex justify-between items-center p-6 border-b border-gray-200 bg-gray-50/50">
          <h2 className="text-xl font-semibold text-gray-900">
            {city ? 'Edit City/Regency' : 'Add New City/Regency'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-all duration-200"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-6 overflow-y-auto max-h-[75vh]">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Location Selection */}
            <div>
              <h3 className="text-lg font-medium mb-4">Location Selection</h3>
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Country *
                  </label>
                  <select
                    value={formData.country.name}
                    onChange={handleCountryChange}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      errors.country ? 'border-red-300' : 'border-gray-300'
                    }`}
                  >
                    <option value="">Select Country</option>
                    {COUNTRIES.map(country => (
                      <option key={country.id} value={country.name}>
                        {country.name}
                      </option>
                    ))}
                  </select>
                  {errors.country && <p className="text-red-500 text-sm mt-1">{errors.country}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Province *
                  </label>
                  <select
                    value={formData.province}
                    onChange={handleProvinceChange}
                    disabled={!formData.country.name}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed ${
                      errors.province ? 'border-red-300' : 'border-gray-300'
                    }`}
                  >
                    <option value="">Select Province</option>
                    {availableProvinces.map(province => (
                      <option key={province} value={province}>
                        {province}
                      </option>
                    ))}
                  </select>
                  {errors.province && <p className="text-red-500 text-sm mt-1">{errors.province}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    City/Regency *
                  </label>
                  <select
                    value={formData.name}
                    onChange={handleCityChange}
                    disabled={!formData.province}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed ${
                      errors.name ? 'border-red-300' : 'border-gray-300'
                    }`}
                  >
                    <option value="">Select City/Regency</option>
                    {availableCities.map(cityData => (
                      <option key={cityData.name} value={cityData.name}>
                        {cityData.name}
                      </option>
                    ))}
                  </select>
                  {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
                </div>
              </div>
            </div>

            {/* Auto-filled Information (Read-only display) */}
            {formData.name && (
              <div>
                <h3 className="text-lg font-medium mb-4">Location Details</h3>
                <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-1">Latitude</label>
                      <div className="text-sm text-gray-900">{formData.location.coordinates.latitude}</div>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-1">Longitude</label>
                      <div className="text-sm text-gray-900">{formData.location.coordinates.longitude}</div>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-1">Area</label>
                      <div className="text-sm text-gray-900">{formData.location.area} km²</div>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-1">Elevation</label>
                      <div className="text-sm text-gray-900">{formData.location.elevation} m</div>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-1">Timezone</label>
                      <div className="text-sm text-gray-900">{formData.timezone}</div>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-1">UTC Offset</label>
                      <div className="text-sm text-gray-900">{formData.utcOffset}</div>
                    </div>
                  </div>
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  ℹ️ Location details are automatically filled based on your city selection.
                </p>
              </div>
            )}
          </form>
        </div>

        <div className="flex justify-end space-x-3 p-6 border-t border-gray-200 bg-gray-50/50">
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-2.5 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200"
            disabled={loading}
          >
            Cancel
          </button>
          <button
            type="submit"
            onClick={handleSubmit}
            disabled={loading}
            className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-blue-500/25 transition-all duration-200"
          >
            {loading ? 'Saving...' : (city ? 'Update City' : 'Create City')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default SimpleCityModal; 