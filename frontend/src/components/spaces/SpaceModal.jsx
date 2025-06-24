import React, { useState, useEffect } from 'react';
import { X, Search, ChevronDown, Plus, Trash2, Edit3, MapPin } from 'lucide-react';
import { servicesAPI, citiesAPI, amenitiesAPI } from '../../services/api.jsx';
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
          servicesAPI.getAll(),
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
      if (!event.target.closest('.relative')) {
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

  // Reset form when modal opens/closes or space changes
  useEffect(() => {
    if (isOpen) {
      if (mode === 'edit' && space) {
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
        // Reset form for add mode
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

  // Amenity management functions

  const handleCreateAmenity = async () => {
    try {
      const response = await amenitiesAPI.create(amenityFormData);
      
      if (response.success) {
        // Add to space amenities
        setFormData(prev => ({
          ...prev,
          amenities: [...prev.amenities, amenityFormData.name]
        }));
        
        // Refresh available amenities
        const amenitiesResponse = await amenitiesAPI.getActive();
        if (amenitiesResponse.success) {
          setAvailableAmenities(amenitiesResponse.data || []);
        }

        // Reset form
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
      setError('Failed to create amenity');
    }
  };

  const handleRemoveAmenity = (amenity) => {
    setFormData(prev => ({
      ...prev,
      amenities: prev.amenities.filter(a => a !== amenity)
    }));
  };

  const handleDeleteAmenityFromDatabase = async (amenityName) => {
    if (!confirm(`Are you sure you want to permanently delete "${amenityName}" from the database? This will remove it from all spaces.`)) {
      return;
    }

    setDeletingAmenity(amenityName);
    
    try {
      // Find the amenity ID
      const amenityToDelete = availableAmenities.find(a => a.name === amenityName);
      if (!amenityToDelete) {
        setError('Amenity not found');
        return;
      }

      const response = await amenitiesAPI.delete(amenityToDelete.id);
      
      if (response.success) {
        // Remove from space amenities if it was selected
        setFormData(prev => ({
          ...prev,
          amenities: prev.amenities.filter(a => a !== amenityName)
        }));
        
        // Refresh available amenities
        const amenitiesResponse = await amenitiesAPI.getActive();
        if (amenitiesResponse.success) {
          setAvailableAmenities(amenitiesResponse.data || []);
        }

        // Show success message temporarily
        setError(`✅ Successfully deleted "${amenityName}" from database`);
        setTimeout(() => setError(''), 3000);
      }
    } catch (error) {
      console.error('Error deleting amenity:', error);
      // Handle different error types
      if (error.message && error.message.includes('FAILED_PRECONDITION')) {
        setError('Cannot delete amenity: it is currently being used in spaces');
      } else if (error.message && error.message.includes('404')) {
        setError('Amenity not found');
      } else {
        setError('Failed to delete amenity from database');
      }
    } finally {
      setDeletingAmenity(null);
    }
  };

  const handleEditAmenity = (oldAmenity, newAmenity) => {
    if (newAmenity.trim() && newAmenity.trim() !== oldAmenity) {
      setFormData(prev => ({
        ...prev,
        amenities: prev.amenities.map(a => a === oldAmenity ? newAmenity.trim() : a)
      }));
    }
    setEditingAmenity(null);
    setEditAmenityValue('');
  };

  const startEditAmenity = (amenity) => {
    setEditingAmenity(amenity);
    setEditAmenityValue(amenity);
  };

  const cancelEditAmenity = () => {
    setEditingAmenity(null);
    setEditAmenityValue('');
  };

  // Get all available amenities from database
  const getAllAmenities = () => {
    return availableAmenities.map(amenity => amenity.name);
  };

  // Get amenities by category
  const getAmenitiesByCategory = (category) => {
    return availableAmenities.filter(amenity => amenity.category === category);
  };

  // Handle map location selection with auto-fill
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
        coordinates: locationData.coordinates,
        latitude: locationData.coordinates.lat,
        longitude: locationData.coordinates.lng
      }
    }));
    
    // Show success message for auto-fill
    if (locationData.city || locationData.province) {
      setError(`✅ Location auto-filled: ${locationData.city}${locationData.province ? ', ' + locationData.province : ''}`);
      setTimeout(() => setError(''), 3000);
    }
  };

  // Get current coordinates for map
  const getCurrentCoordinates = () => {
    if (formData.location.latitude && formData.location.longitude) {
      return {
        lat: parseFloat(formData.location.latitude),
        lng: parseFloat(formData.location.longitude)
      };
    }
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Enhanced validation with specific error messages
      const validationErrors = [];
      
      if (!formData.name.trim()) {
        validationErrors.push('Space name is required');
      }
      if (!formData.brand) {
        validationErrors.push('Brand is required');
      }
      if (!formData.category) {
        validationErrors.push('Category is required');
      }
      if (!formData.location.address.trim()) {
        validationErrors.push('Address is required');
      }
      if (!formData.location.city.trim()) {
        validationErrors.push('City is required');
      }
      if (!formData.location.province.trim()) {
        validationErrors.push('Province is required');
      }
      if (!formData.capacity || parseInt(formData.capacity) < 1) {
        validationErrors.push('Capacity must be at least 1');
      }
      
      // Pricing validation - at least one price required
      const hasHourly = formData.pricing.hourly && parseFloat(formData.pricing.hourly) > 0;
      const hasDaily = formData.pricing.daily && parseFloat(formData.pricing.daily) > 0;
      const hasMonthly = formData.pricing.monthly && parseFloat(formData.pricing.monthly) > 0;
      
      if (!hasHourly && !hasDaily && !hasMonthly) {
        validationErrors.push('At least one pricing option (hourly, daily, or monthly) is required');
      }

      if (validationErrors.length > 0) {
        throw new Error('Validation failed:\n• ' + validationErrors.join('\n• '));
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

      console.log('=== SPACE SUBMIT DEBUG ===');
      console.log('FormData before processing:', JSON.stringify(formData, null, 2));
      console.log('SubmitData to API:', JSON.stringify(submitData, null, 2));
      console.log('========================');
      
      await onSave(submitData);
      onClose();
    } catch (err) {
      console.error('SpaceModal: Error saving space:', err);
      setError(err.message || 'Failed to save space');
    } finally {
      setLoading(false);
    }
  };

  // Searchable Dropdown Component
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
      <div className="relative">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {label} {required && '*'}
        </label>
        <div className="relative">
          <button
            type="button"
            onClick={onToggle}
            className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white text-left focus:outline-none focus:ring-2 focus:ring-primary flex items-center justify-between"
          >
            <span className={selectedValue ? 'text-gray-900' : 'text-gray-500'}>
              {selectedValue || placeholder}
            </span>
            <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
          </button>
          
          {isOpen && (
            <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-hidden">
              <div className="p-2 border-b border-gray-200">
                <div className="relative">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    value={searchValue}
                    onChange={(e) => onSearchChange(e.target.value)}
                    placeholder={`Search ${label.toLowerCase()}...`}
                    className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-primary text-sm"
                  />
                </div>
              </div>
              <div className="max-h-48 overflow-y-auto">
                {filteredOptions.length > 0 ? (
                  filteredOptions.map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => onSelect(option.value, option.cityData)}
                      className="w-full text-left px-3 py-2 hover:bg-gray-50 focus:bg-gray-50 focus:outline-none text-sm"
                    >
                      {option.label}
                    </button>
                  ))
                ) : (
                  <div className="px-3 py-2 text-sm text-gray-500">
                    No {label.toLowerCase()} found
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    );
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
                  Layanan *
                  <span className="text-xs text-gray-500">
                    {availableServices.length > 0 ? '(berdasarkan layanan yang tersedia)' : '(loading services...)'}
                  </span>
                </label>
                <select
                  name="category"
                  value={formData.category}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                  required
                >
                  <option value="">Pilih Layanan</option>
                  
                  {/* Use services from database if available */}
                  {availableServices.length > 0 ? (
                    availableServices
                      .filter(service => service.status === 'published') // Only show published services
                      .map(service => (
                        <option key={service.id || service.serviceId} value={service.name}>
                          {service.name}
                        </option>
                      ))
                  ) : (
                    // Fallback categories if services are not loaded yet
                    fallbackCategories.map(category => (
                      <option key={category.value} value={category.value}>
                        {category.label}
                      </option>
                    ))
                  )}
                </select>
                
                <p className="mt-1 text-xs text-gray-500">
                  {availableServices.length > 0 
                    ? `${availableServices.filter(s => s.status === 'published').length} jenis layanan tersedia`
                    : 'Memuat data layanan dari database...'
                  }
                </p>
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
                  {formData.location.coordinates && formData.location.address && (
                    <span className="text-xs text-green-600 ml-1">(auto-filled from map 📍)</span>
                  )}
                </label>
                <div className="space-y-2">
                  <textarea
                    name="location.address"
                    value={formData.location.address}
                    onChange={handleInputChange}
                    rows={2}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary ${
                      formData.location.coordinates && formData.location.address 
                        ? 'border-green-300 bg-green-50' 
                        : 'border-gray-300'
                    }`}
                    placeholder="Street address"
                  />
                  <button
                    type="button"
                    onClick={() => setShowMapModal(true)}
                    className="w-full px-3 py-2 border border-dashed border-blue-300 text-blue-600 rounded-md hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
                  >
                    <MapPin className="w-4 h-4 inline mr-2" />
                    {getCurrentCoordinates() ? 'Update Location on Map' : 'Set Location on Map'}
                  </button>
                  {getCurrentCoordinates() && (
                    <div className="text-xs text-green-600 bg-green-50 p-2 rounded">
                      <MapPin className="w-3 h-3 inline mr-1" />
                      Location set: {formData.location.latitude?.toFixed(6)}, {formData.location.longitude?.toFixed(6)}
                    </div>
                  )}
                </div>
              </div>

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
              {formData.location.country && (
                <div className="relative">
                  <SearchableDropdown
                    isOpen={provinceDropdownOpen}
                    onToggle={() => handleDropdownToggle('province')}
                    options={getProvincesForCountry(formData.location.country)}
                    selectedValue={formData.location.province}
                    onSelect={(value) => handleLocationChange('province', value)}
                    searchValue={provinceSearch}
                    onSearchChange={setProvinceSearch}
                    placeholder="Select Province"
                    label={
                      <span>
                        Province
                        {formData.location.coordinates && formData.location.province && (
                          <span className="text-xs text-green-600 ml-1 font-normal">
                            (auto-filled from map 📍)
                          </span>
                        )}
                      </span>
                    }
                    required
                  />
                </div>
              )}

              {/* City Dropdown */}
              {formData.location.country && formData.location.province && (
                <div className="relative">
                  <SearchableDropdown
                    isOpen={cityDropdownOpen}
                    onToggle={() => handleDropdownToggle('city')}
                    options={getCitiesForProvince(formData.location.country, formData.location.province)}
                    selectedValue={formData.location.city}
                    onSelect={(value, cityData) => handleLocationChange('city', value, cityData)}
                    searchValue={citySearch}
                    onSearchChange={setCitySearch}
                    placeholder="Select City"
                    label={
                      <span>
                        City/Regency
                        {formData.location.coordinates && formData.location.city && (
                          <span className="text-xs text-green-600 ml-1 font-normal">
                            (auto-filled from map 📍)
                          </span>
                        )}
                      </span>
                    }
                    required
                  />
                </div>
              )}

              {/* Postal Code and Address */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Postal Code
                    {formData.location.coordinates && formData.location.postalCode && (
                      <span className="text-xs text-green-600 ml-1">(auto-filled from map 📍)</span>
                    )}
                  </label>
                  <input
                    type="text"
                    name="location.postalCode"
                    value={formData.location.postalCode}
                    onChange={handleInputChange}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary ${
                      formData.location.coordinates && formData.location.postalCode 
                        ? 'border-green-300 bg-green-50' 
                        : 'border-gray-300'
                    }`}
                    placeholder="e.g., 10220"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Google Maps Status
                  </label>
                  <div className="flex items-center space-x-2 pt-2">
                    {formData.location.coordinates ? (
                      <span className="text-xs text-green-600 bg-green-50 px-2 py-1 rounded">
                        ✓ Location set on map
                      </span>
                    ) : (
                      <span className="text-xs text-orange-600 bg-orange-50 px-2 py-1 rounded">
                        📍 Click "Set Location on Map" for auto-fill
                      </span>
                    )}
                  </div>
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
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium text-gray-900">Amenities</h3>
              <button
                type="button"
                onClick={() => setShowAmenityModal(true)}
                className="px-3 py-1 bg-green-600 text-white text-sm rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                <Plus className="w-4 h-4 inline mr-1" />
                Create New
              </button>
            </div>
            
            {/* Amenities by Category */}
            {amenityCategories.map(category => {
              const categoryAmenities = getAmenitiesByCategory(category.value);
              if (categoryAmenities.length === 0) return null;
              
              return (
                <div key={category.value}>
                  <h4 className="text-sm font-medium text-gray-700 mb-2 capitalize">
                    {category.label} ({categoryAmenities.length})
                  </h4>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                    {categoryAmenities.map(amenity => (
                      <div key={amenity.id} className="flex items-center p-2 border border-gray-200 rounded-md hover:bg-gray-50 group">
                        <input
                          type="checkbox"
                          checked={formData.amenities.includes(amenity.name)}
                          onChange={() => handleAmenityToggle(amenity.name)}
                          className="rounded border-gray-300 text-primary focus:ring-primary"
                        />
                        <div className="ml-2 flex-1">
                          <span className="text-sm text-gray-700">{amenity.name}</span>
                          {amenity.description && (
                            <div className="text-xs text-gray-500">{amenity.description}</div>
                          )}
                        </div>
                        <span className={`ml-1 px-2 py-0.5 text-xs rounded-full ${
                          amenity.type === 'premium' ? 'bg-purple-100 text-purple-700' :
                          amenity.type === 'specialized' ? 'bg-blue-100 text-blue-700' :
                          'bg-gray-100 text-gray-700'
                        }`}>
                          {amenity.type}
                        </span>
                        <div className="ml-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            type="button"
                            onClick={() => handleDeleteAmenityFromDatabase(amenity.name)}
                            disabled={deletingAmenity === amenity.name}
                            className="p-1 text-red-500 hover:text-red-700 hover:bg-red-50 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                            title="Delete amenity from database permanently"
                          >
                            {deletingAmenity === amenity.name ? (
                              <div className="w-3 h-3 border border-red-500 border-t-transparent rounded-full animate-spin"></div>
                            ) : (
                              <Trash2 className="w-3 h-3" />
                            )}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}

            {/* Selected Amenities Summary */}
            {formData.amenities.length > 0 && (
              <div className="bg-blue-50 p-3 rounded-md">
                <h4 className="text-sm font-medium text-blue-800 mb-2">Selected Amenities ({formData.amenities.length})</h4>
                <div className="flex flex-wrap gap-1">
                  {formData.amenities.map(amenityName => {
                    const amenityData = availableAmenities.find(a => a.name === amenityName);
                    return (
                      <span
                        key={amenityName}
                        className="inline-flex items-center px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full"
                      >
                        {amenityName}
                        <button
                          type="button"
                          onClick={() => handleRemoveAmenity(amenityName)}
                          className="ml-1 text-blue-600 hover:text-blue-800"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    );
                  })}
                </div>
              </div>
            )}
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

      {/* Amenity Creation Modal */}
      {showAmenityModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-60 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Create New Amenity</h3>
              <button
                onClick={() => setShowAmenityModal(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Name *
                </label>
                <input
                  type="text"
                  value={amenityFormData.name}
                  onChange={(e) => setAmenityFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g., High-Speed WiFi"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  value={amenityFormData.description}
                  onChange={(e) => setAmenityFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Brief description of the amenity"
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Category
                </label>
                <select
                  value={amenityFormData.category}
                  onChange={(e) => setAmenityFormData(prev => ({ ...prev, category: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
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
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
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
                  Icon (Optional)
                </label>
                <input
                  type="text"
                  value={amenityFormData.icon}
                  onChange={(e) => setAmenityFormData(prev => ({ ...prev, icon: e.target.value }))}
                  placeholder="e.g., wifi, coffee, parking"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                />
                <div className="text-xs text-gray-500 mt-1">
                  This can be used for icon mapping in the future
                </div>
              </div>
            </div>

            <div className="flex justify-end space-x-3 p-4 border-t border-gray-200">
              <button
                type="button"
                onClick={() => setShowAmenityModal(false)}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleCreateAmenity}
                disabled={!amenityFormData.name.trim()}
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Create & Add
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Google Maps Modal */}
      {showMapModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-60 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                <MapPin className="w-5 h-5 mr-2" />
                Set Space Location
              </h3>
              <button
                onClick={() => setShowMapModal(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-4">
              <div className="mb-4">
                <p className="text-sm text-gray-600 mb-2">
                  Click on the map or search for a location to set the space coordinates.
                </p>
                {formData.location.address && (
                  <div className="text-sm text-gray-700 bg-gray-50 p-2 rounded">
                    <strong>Current Address:</strong> {formData.location.address}
                  </div>
                )}
              </div>
              
              <GoogleMap
                coordinates={getCurrentCoordinates()}
                onLocationSelect={handleLocationSelect}
                height="500px"
                zoom={15}
                showSearchBox={false}
              />
            </div>

            <div className="flex justify-between items-center p-4 border-t border-gray-200">
              <div className="text-sm text-gray-600">
                {getCurrentCoordinates() ? (
                  <span className="text-green-600">
                    ✓ Location set: {formData.location.latitude?.toFixed(6)}, {formData.location.longitude?.toFixed(6)}
                  </span>
                ) : (
                  <span className="text-gray-500">No location selected</span>
                )}
              </div>
              
              <div className="space-x-3">
                <button
                  type="button"
                  onClick={() => setShowMapModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => setShowMapModal(false)}
                  disabled={!getCurrentCoordinates()}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Set Location
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SpaceModal; 