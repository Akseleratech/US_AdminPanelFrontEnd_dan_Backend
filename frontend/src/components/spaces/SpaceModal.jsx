import React, { useState, useEffect } from 'react';
import { X, Search, ChevronDown, Plus, Trash2, Edit3, MapPin } from 'lucide-react';
import { layananAPI, citiesAPI, amenitiesAPI } from '../../services/api.jsx';
import GoogleMap from '../common/GoogleMap.jsx';

const SpaceModal = ({ isOpen, onClose, onSave, space, mode }) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    brand: '',
    category: '',
    capacity: '',
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
  const [availableServices, setAvailableServices] = useState([]);
  const [availableCities, setAvailableCities] = useState([]);
  const [availableAmenities, setAvailableAmenities] = useState([]);
  
  // Dropdown states for search functionality
  const [countryDropdownOpen, setCountryDropdownOpen] = useState(false);
  const [provinceDropdownOpen, setProvinceDropdownOpen] = useState(false);
  const [cityDropdownOpen, setCityDropdownOpen] = useState(false);
  const [countrySearch, setCountrySearch] = useState('');
  const [provinceSearch, setProvinceSearch] = useState('');
  const [citySearch, setCitySearch] = useState('');
  
  // Custom amenities states
  const [editingAmenity, setEditingAmenity] = useState(null);
  const [editAmenityValue, setEditAmenityValue] = useState('');
  const [showAmenityModal, setShowAmenityModal] = useState(false);
  const [deletingAmenity, setDeletingAmenity] = useState(null);
  const [showMapModal, setShowMapModal] = useState(false);
  const [amenityFormData, setAmenityFormData] = useState({
    name: '',
    description: '',
    category: 'general',
    type: 'common',
    icon: ''
  });

  // Fallback categories if no services available
  const fallbackCategories = [
    { value: 'co-working', label: 'Co-working Space' },
    { value: 'meeting-room', label: 'Meeting Room' },
    { value: 'private-office', label: 'Private Office' },
    { value: 'event-space', label: 'Event Space' },
    { value: 'phone-booth', label: 'Phone Booth' }
  ];

  const brands = [
    { value: 'UnionSpace', label: 'UnionSpace' },
    { value: 'NextSpace', label: 'NextSpace' },
    { value: 'CoSpace', label: 'CoSpace' }
  ];

  // Categories for amenities
  const amenityCategories = [
    { value: 'general', label: 'General' },
    { value: 'technology', label: 'Technology' },
    { value: 'furniture', label: 'Furniture' },
    { value: 'facilities', label: 'Facilities' },
    { value: 'services', label: 'Services' },
    { value: 'safety', label: 'Safety & Security' }
  ];

  const amenityTypes = [
    { value: 'common', label: 'Common' },
    { value: 'premium', label: 'Premium' },
    { value: 'specialized', label: 'Specialized' }
  ];

  // Fetch available services, cities, and amenities
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [servicesResponse, citiesResponse, amenitiesResponse] = await Promise.all([
          layananAPI.getAll(),
          citiesAPI.getAll(),
          amenitiesAPI.getActive()
        ]);
        
        if (servicesResponse.success) {
          setAvailableServices(servicesResponse.data || []);
        }
        
        if (citiesResponse.success) {
          setAvailableCities(citiesResponse.data || []);
        }

        if (amenitiesResponse.success) {
          setAvailableAmenities(amenitiesResponse.data || []);
        }
      } catch (error) {
        console.error('Error fetching data:', error);
        setAvailableServices([]);
        setAvailableCities([]);
        setAvailableAmenities([]);
      }
    };

    if (isOpen) {
      fetchData();
    }
  }, [isOpen]);

  // Get unique countries from cities data
  const getUniqueCountries = () => {
    const countries = [...new Set(availableCities.map(city => 
      typeof city.country === 'object' ? city.country.name : city.country
    ))];
    return countries.filter(Boolean).map(country => ({ value: country, label: country }));
  };

  // Get provinces for selected country
  const getProvincesForCountry = (country) => {
    const provinces = [...new Set(
      availableCities
        .filter(city => {
          const cityCountry = typeof city.country === 'object' ? city.country.name : city.country;
          return cityCountry === country;
        })
        .map(city => city.province)
    )];
    return provinces.filter(Boolean).map(province => ({ value: province, label: province }));
  };

  // Get cities for selected province
  const getCitiesForProvince = (country, province) => {
    return availableCities
      .filter(city => {
        const cityCountry = typeof city.country === 'object' ? city.country.name : city.country;
        return cityCountry === country && city.province === province;
      })
      .map(city => ({ value: city.name, label: city.name, cityData: city }));
  };

  // Handle location selection changes
  const handleLocationChange = (type, value, cityData = null) => {
    setFormData(prev => {
      const newLocation = { ...prev.location };
      
      if (type === 'country') {
        newLocation.country = value;
        newLocation.province = '';
        newLocation.city = '';
        newLocation.postalCode = '';
      } else if (type === 'province') {
        newLocation.province = value;
        newLocation.city = '';
        newLocation.postalCode = '';
      } else if (type === 'city') {
        newLocation.city = value;
        // Auto-fill postal codes if available
        if (cityData && cityData.postalCodes && cityData.postalCodes.length > 0) {
          newLocation.postalCode = cityData.postalCodes[0];
        }
      }
      
      return { ...prev, location: newLocation };
    });
    
    // Close all dropdowns
    setCountryDropdownOpen(false);
    setProvinceDropdownOpen(false);
    setCityDropdownOpen(false);
    
    // Reset search
    setCountrySearch('');
    setProvinceSearch('');
    setCitySearch('');
  };

  // Handle dropdown toggle (close others when one opens)
  const handleDropdownToggle = (dropdownType) => {
    if (dropdownType === 'country') {
      setCountryDropdownOpen(!countryDropdownOpen);
      setProvinceDropdownOpen(false);
      setCityDropdownOpen(false);
    } else if (dropdownType === 'province') {
      setCountryDropdownOpen(false);
      setProvinceDropdownOpen(!provinceDropdownOpen);
      setCityDropdownOpen(false);
    } else if (dropdownType === 'city') {
      setCountryDropdownOpen(false);
      setProvinceDropdownOpen(false);
      setCityDropdownOpen(!cityDropdownOpen);
    }
  };

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!event.target.closest('.dropdown-container')) {
        setCountryDropdownOpen(false);
        setProvinceDropdownOpen(false);
        setCityDropdownOpen(false);
      }
    };

    if (countryDropdownOpen || provinceDropdownOpen || cityDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [countryDropdownOpen, provinceDropdownOpen, cityDropdownOpen]);

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      if (space && mode === 'edit') {
        setFormData({
          name: space.name || '',
          description: space.description || '',
          brand: space.brand || '',
          category: space.category || '',
          capacity: space.capacity || '',
          location: {
            address: space.location?.address || '',
            city: space.location?.city || '',
            province: space.location?.province || '',
            postalCode: space.location?.postalCode || '',
            country: space.location?.country || 'Indonesia',
            coordinates: space.location?.coordinates || null,
            latitude: space.location?.latitude || null,
            longitude: space.location?.longitude || null
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
        setFormData({
          name: '',
          description: '',
          brand: '',
          category: '',
          capacity: '',
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
  }, [isOpen, space, mode]);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    if (name.includes('.')) {
      const [section, field] = name.split('.');
      setFormData(prev => ({
        ...prev,
        [section]: {
          ...prev[section],
          [field]: type === 'checkbox' ? checked : value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: type === 'checkbox' ? checked : value
      }));
    }
  };

  const handleAmenityToggle = (amenityName) => {
    setFormData(prev => ({
      ...prev,
      amenities: prev.amenities.includes(amenityName)
        ? prev.amenities.filter(a => a !== amenityName)
        : [...prev.amenities, amenityName]
    }));
  };

  const handleCustomAmenityAdd = (amenityName) => {
    if (amenityName.trim() && !formData.amenities.includes(amenityName.trim())) {
      setFormData(prev => ({
        ...prev,
        amenities: [...prev.amenities, amenityName.trim()]
      }));
    }
  };

  const handleDeleteCustomAmenity = (amenityToDelete) => {
    setFormData(prev => ({
      ...prev,
      amenities: prev.amenities.filter(amenity => amenity !== amenityToDelete)
    }));
  };

  const handleEditAmenity = (oldAmenity, newAmenity) => {
    if (newAmenity.trim() && newAmenity.trim() !== oldAmenity) {
      setFormData(prev => ({
        ...prev,
        amenities: prev.amenities.map(amenity => 
          amenity === oldAmenity ? newAmenity.trim() : amenity
        )
      }));
    }
    setEditingAmenity(null);
    setEditAmenityValue('');
  };

  const handleCreateAmenity = async () => {
    try {
      const response = await amenitiesAPI.create(amenityFormData);
      if (response.success) {
        // Refresh available amenities
        const amenitiesResponse = await amenitiesAPI.getActive();
        if (amenitiesResponse.success) {
          setAvailableAmenities(amenitiesResponse.data || []);
        }
        
        // Add to current selection
        handleAmenityToggle(amenityFormData.name);
        
        // Reset form and close modal
        setAmenityFormData({
          name: '',
          description: '',
          category: 'general',
          type: 'common',
          icon: ''
        });
        setShowAmenityModal(false);
      }
    } catch (error) {
      console.error('Error creating amenity:', error);
    }
  };

  const handleMapLocationSelect = (location) => {
    if (formData.location.latitude && formData.location.longitude) {
      setFormData(prev => ({
        ...prev,
        location: {
          ...prev.location,
          coordinates: [location.lng, location.lat],
          latitude: location.lat,
          longitude: location.lng
        }
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Basic validation
    if (!formData.name.trim()) {
      setError('Space name is required');
      return;
    }
    
    if (!formData.category) {
      setError('Category is required');
      return;
    }

    if (!formData.capacity || parseInt(formData.capacity) <= 0) {
      setError('Valid capacity is required');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Prepare data for submission
      const submitData = {
        ...formData,
        capacity: parseInt(formData.capacity),
        pricing: {
          ...formData.pricing,
          hourly: formData.pricing.hourly ? parseFloat(formData.pricing.hourly) : null,
          daily: formData.pricing.daily ? parseFloat(formData.pricing.daily) : null,
          monthly: formData.pricing.monthly ? parseFloat(formData.pricing.monthly) : null
        }
      };

      await onSave(submitData);
      onClose();
    } catch (error) {
      setError(error.message || 'An error occurred while saving');
    } finally {
      setLoading(false);
    }
  };

  // Searchable dropdown component
  const SearchableDropdown = ({ 
    isOpen, 
    onToggle, 
    options, 
    selectedValue, 
    onSelect, 
    searchValue, 
    onSearchChange, 
    placeholder, 
    label,
    required = false 
  }) => {
    const filteredOptions = options.filter(option =>
      option.label.toLowerCase().includes(searchValue.toLowerCase())
    );

    return (
      <div className="dropdown-container relative">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
        <button
          type="button"
          onClick={onToggle}
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-white text-left focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        >
          <div className="flex items-center justify-between">
            <span className={selectedValue ? 'text-gray-900' : 'text-gray-500'}>
              {selectedValue || placeholder}
            </span>
            <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
          </div>
        </button>
        
        {isOpen && (
          <div className="absolute z-50 mt-1 w-full bg-white shadow-lg max-h-60 rounded-md py-1 text-base ring-1 ring-black ring-opacity-5 overflow-auto focus:outline-none">
            <div className="sticky top-0 z-10 bg-white p-2 border-b">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Search..."
                  value={searchValue}
                  onChange={(e) => onSearchChange(e.target.value)}
                />
              </div>
            </div>
            
            {filteredOptions.length === 0 ? (
              <div className="px-4 py-2 text-sm text-gray-500">No options found</div>
            ) : (
              filteredOptions.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  className="w-full text-left px-4 py-2 text-sm text-gray-900 hover:bg-gray-100 focus:outline-none focus:bg-gray-100"
                  onClick={() => onSelect(option.value, option.cityData)}
                >
                  {option.label}
                </button>
              ))
            )}
          </div>
        )}
      </div>
    );
  };

  // Get available categories (from services or fallback)
  const getAvailableCategories = () => {
    if (availableServices.length > 0) {
      return availableServices.map(service => ({
        value: service.name.toLowerCase().replace(/\s+/g, '-'),
        label: service.name
      }));
    }
    return fallbackCategories;
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

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}

          {/* Basic Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Space Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter space name"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Brand
              </label>
              <select
                name="brand"
                value={formData.brand}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
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
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Category <span className="text-red-500">*</span>
              </label>
              <select
                name="category"
                value={formData.category}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="">Select Category</option>
                {getAvailableCategories().map(category => (
                  <option key={category.value} value={category.value}>
                    {category.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Capacity <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                name="capacity"
                value={formData.capacity}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter capacity"
                min="1"
                required
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter space description"
            />
          </div>

          {/* Location */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900">Location</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Country Dropdown */}
              <SearchableDropdown
                isOpen={countryDropdownOpen}
                onToggle={() => handleDropdownToggle('country')}
                options={getUniqueCountries()}
                selectedValue={formData.location.country}
                onSelect={(value) => handleLocationChange('country', value)}
                searchValue={countrySearch}
                onSearchChange={setCountrySearch}
                placeholder="Select Country"
                label="Country"
                required
              />

              {/* Province Dropdown */}
              <SearchableDropdown
                isOpen={provinceDropdownOpen}
                onToggle={() => handleDropdownToggle('province')}
                options={getProvincesForCountry(formData.location.country)}
                selectedValue={formData.location.province}
                onSelect={(value) => handleLocationChange('province', value)}
                searchValue={provinceSearch}
                onSearchChange={setProvinceSearch}
                placeholder="Select Province"
                label="Province"
              />

              {/* City Dropdown */}
              <SearchableDropdown
                isOpen={cityDropdownOpen}
                onToggle={() => handleDropdownToggle('city')}
                options={getCitiesForProvince(formData.location.country, formData.location.province)}
                selectedValue={formData.location.city}
                onSelect={(value, cityData) => handleLocationChange('city', value, cityData)}
                searchValue={citySearch}
                onSearchChange={setCitySearch}
                placeholder="Select City"
                label="City"
              />

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Postal Code
                </label>
                <input
                  type="text"
                  name="location.postalCode"
                  value={formData.location.postalCode}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter postal code"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Street Address
              </label>
              <input
                type="text"
                name="location.address"
                value={formData.location.address}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter street address"
              />
            </div>

            {/* Map Integration */}
            <div className="flex items-center space-x-4">
              <button
                type="button"
                onClick={() => setShowMapModal(true)}
                className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                <MapPin className="w-4 h-4 mr-2" />
                Set Location on Map
              </button>
              
              {formData.location.latitude && formData.location.longitude && (
                <span className="text-sm text-green-600">
                  ✓ Location set: {formData.location.latitude.toFixed(6)}, {formData.location.longitude.toFixed(6)}
                </span>
              )}
            </div>
          </div>

          {/* Pricing */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900">Pricing</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Currency
                </label>
                <select
                  name="pricing.currency"
                  value={formData.pricing.currency}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="IDR">IDR</option>
                  <option value="USD">USD</option>
                  <option value="EUR">EUR</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Hourly Rate
                </label>
                <input
                  type="number"
                  name="pricing.hourly"
                  value={formData.pricing.hourly}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="0.00"
                  step="0.01"
                  min="0"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Daily Rate
                </label>
                <input
                  type="number"
                  name="pricing.daily"
                  value={formData.pricing.daily}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="0.00"
                  step="0.01"
                  min="0"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Monthly Rate
                </label>
                <input
                  type="number"
                  name="pricing.monthly"
                  value={formData.pricing.monthly}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="0.00"
                  step="0.01"
                  min="0"
                />
              </div>
            </div>
          </div>

          {/* Amenities */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium text-gray-900">Amenities</h3>
              <button
                type="button"
                onClick={() => setShowAmenityModal(true)}
                className="flex items-center px-3 py-1 bg-green-600 text-white text-sm rounded-md hover:bg-green-700 transition-colors"
              >
                <Plus className="w-4 h-4 mr-1" />
                Add New
              </button>
            </div>
            
            {/* Available Amenities */}
            {availableAmenities.length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-2">Available Amenities:</h4>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                  {availableAmenities.map((amenity) => (
                    <label key={amenity.id} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={formData.amenities.includes(amenity.name)}
                        onChange={() => handleAmenityToggle(amenity.name)}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="ml-2 text-sm text-gray-700">{amenity.name}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            {/* Custom Amenities */}
            {formData.amenities.filter(amenity => 
              !availableAmenities.some(available => available.name === amenity)
            ).length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-2">Custom Amenities:</h4>
                <div className="space-y-2">
                  {formData.amenities
                    .filter(amenity => !availableAmenities.some(available => available.name === amenity))
                    .map((amenity, index) => (
                      <div key={index} className="flex items-center space-x-2">
                        {editingAmenity === amenity ? (
                          <>
                            <input
                              type="text"
                              value={editAmenityValue}
                              onChange={(e) => setEditAmenityValue(e.target.value)}
                              className="flex-1 px-3 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                              onBlur={() => handleEditAmenity(amenity, editAmenityValue)}
                              onKeyPress={(e) => {
                                if (e.key === 'Enter') {
                                  handleEditAmenity(amenity, editAmenityValue);
                                }
                              }}
                              autoFocus
                            />
                          </>
                        ) : (
                          <>
                            <span className="flex-1 px-3 py-1 bg-gray-100 rounded-md text-sm">
                              {amenity}
                            </span>
                            <button
                              type="button"
                              onClick={() => {
                                setEditingAmenity(amenity);
                                setEditAmenityValue(amenity);
                              }}
                              className="p-1 text-blue-600 hover:text-blue-800"
                            >
                              <Edit3 className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteCustomAmenity(amenity)}
                              className="p-1 text-red-600 hover:text-red-800"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </>
                        )}
                      </div>
                    ))}
                </div>
              </div>
            )}

            {/* Add Custom Amenity */}
            <div>
              <input
                type="text"
                placeholder="Add custom amenity and press Enter"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleCustomAmenityAdd(e.target.value);
                    e.target.value = '';
                  }
                }}
              />
            </div>
          </div>

          {/* Active Status */}
          <div className="flex items-center">
            <input
              type="checkbox"
              name="isActive"
              checked={formData.isActive}
              onChange={handleInputChange}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <label className="ml-2 text-sm text-gray-700">
              Active (Space is available for booking)
            </label>
          </div>

          {/* Actions */}
          <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              {loading ? 'Saving...' : (mode === 'edit' ? 'Update Space' : 'Create Space')}
            </button>
          </div>
        </form>
      </div>

      {/* Map Modal */}
      {showMapModal && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-60">
          <div className="bg-white rounded-lg w-full max-w-4xl h-96 m-4">
            <div className="flex justify-between items-center p-4 border-b">
              <h3 className="text-lg font-medium">Select Location</h3>
              <button
                onClick={() => setShowMapModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="h-80">
              <GoogleMap
                onLocationSelect={handleMapLocationSelect}
                initialLocation={
                  formData.location.latitude && formData.location.longitude
                    ? { lat: formData.location.latitude, lng: formData.location.longitude }
                    : null
                }
              />
            </div>
          </div>
        </div>
      )}

      {/* Create Amenity Modal */}
      {showAmenityModal && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-60">
          <div className="bg-white rounded-lg w-full max-w-md m-4">
            <div className="flex justify-between items-center p-4 border-b">
              <h3 className="text-lg font-medium">Create New Amenity</h3>
              <button
                onClick={() => setShowAmenityModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={amenityFormData.name}
                  onChange={(e) => setAmenityFormData(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter amenity name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  value={amenityFormData.description}
                  onChange={(e) => setAmenityFormData(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter description"
                  rows={3}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Category
                </label>
                <select
                  value={amenityFormData.category}
                  onChange={(e) => setAmenityFormData(prev => ({ ...prev, category: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {amenityCategories.map(category => (
                    <option key={category.value} value={category.value}>
                      {category.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Type
                </label>
                <select
                  value={amenityFormData.type}
                  onChange={(e) => setAmenityFormData(prev => ({ ...prev, type: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {amenityTypes.map(type => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Icon
                </label>
                <input
                  type="text"
                  value={amenityFormData.icon}
                  onChange={(e) => setAmenityFormData(prev => ({ ...prev, icon: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter icon name or emoji"
                />
              </div>
            </div>

            <div className="flex justify-end space-x-4 p-4 border-t">
              <button
                onClick={() => setShowAmenityModal(false)}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateAmenity}
                disabled={!amenityFormData.name.trim()}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
              >
                Create
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SpaceModal; 