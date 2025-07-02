import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2, Edit3, Upload, Image } from 'lucide-react';
import { layananAPI, amenitiesAPI, buildingsAPI, spacesAPI } from '../../services/api.jsx';
import { useGlobalRefresh } from '../../contexts/GlobalRefreshContext.jsx';

const SpaceModal = ({ isOpen, onClose, onSave, space, mode }) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    layanan: '',
    capacity: '',
    buildingId: '',
    operationalHours: {
      isAlwaysOpen: false,
      schedule: {
        monday: { isOpen: true, openTime: '08:00', closeTime: '17:00' },
        tuesday: { isOpen: true, openTime: '08:00', closeTime: '17:00' },
        wednesday: { isOpen: true, openTime: '08:00', closeTime: '17:00' },
        thursday: { isOpen: true, openTime: '08:00', closeTime: '17:00' },
        friday: { isOpen: true, openTime: '08:00', closeTime: '17:00' },
        saturday: { isOpen: true, openTime: '09:00', closeTime: '15:00' },
        sunday: { isOpen: false, openTime: '09:00', closeTime: '15:00' }
      }
    },
    pricing: {
      hourly: '',
      halfday: '',
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
  const [availableBuildings, setAvailableBuildings] = useState([]);
  const [availableAmenities, setAvailableAmenities] = useState([]);

  // Global refresh context
  const { refreshTriggers } = useGlobalRefresh();
  
  const [amenitySearchTerm, setAmenitySearchTerm] = useState('');

  // Image upload states
  const [imageFiles, setImageFiles] = useState([]);
  const [imagePreviews, setImagePreviews] = useState([]);
  const [uploadingImages, setUploadingImages] = useState(false);
  const [imageError, setImageError] = useState('');

  // Fallback layanan if no services available
  const fallbackLayanan = [
    { value: 'co-working', label: 'Co-working Space' },
    { value: 'meeting-room', label: 'Meeting Room' },
    { value: 'private-office', label: 'Private Office' },
    { value: 'event-space', label: 'Event Space' },
    { value: 'phone-booth', label: 'Phone Booth' }
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

  // Fetch available services, buildings, and amenities
  const fetchData = async () => {
    try {
      console.log('🔄 SpaceModal: Fetching layanan, buildings, and amenities...');
      
      // Test API calls individually for comparison
      console.log('🔄 SpaceModal: Testing layananAPI.getAll() first...');
      const servicesResponse = await layananAPI.getAll();
      console.log('📊 SpaceModal: Services API response:', servicesResponse);
      
      // Also test manual /api/services for comparison
      console.log('🔄 SpaceModal: Testing manual /api/services for comparison...');
      try {
        const servicesManualResponse = await fetch('/api/services');
        const servicesManualData = await servicesManualResponse.json();
        console.log('📊 SpaceModal: Manual services fetch result:', servicesManualData);
      } catch (error) {
        console.error('💥 SpaceModal: Manual services fetch failed:', error);
      }
      
      console.log('🔄 SpaceModal: Testing buildingsAPI.getAll()...');
      console.log('🔍 SpaceModal: buildingsAPI object:', buildingsAPI);
      console.log('🔍 SpaceModal: buildingsAPI.getAll function:', typeof buildingsAPI.getAll);
      console.log('🔄 SpaceModal: Using UPDATED buildingsAPI.getAll() with query params...');
      
      let buildingsResponse;
      try {
        console.log('🔄 SpaceModal: Making buildingsAPI.getAll() call...');
        buildingsResponse = await buildingsAPI.getAll();
        console.log('🏢 SpaceModal: Buildings API call successful:', buildingsResponse);
      } catch (buildingsError) {
        console.error('💥 SpaceModal: Buildings API failed:', buildingsError);
        console.log('🔄 SpaceModal: Trying manual fetch to /api/buildings...');
        
        // Fallback: Try manual fetch
        try {
          const manualResponse = await fetch('/api/buildings');
          console.log('🔄 SpaceModal: Manual fetch response status:', manualResponse.status);
          const manualData = await manualResponse.json();
          console.log('🔄 SpaceModal: Manual fetch result:', manualData);
          buildingsResponse = manualData;
        } catch (manualError) {
          console.error('💥 SpaceModal: Manual fetch also failed:', manualError);
          buildingsResponse = { success: false, error: buildingsError.message };
        }
      }
      
      console.log('🔄 SpaceModal: Testing amenitiesAPI.getActive()...');
      const amenitiesResponse = await amenitiesAPI.getActive();
      
      console.log('📊 SpaceModal: Services response:', servicesResponse);
      console.log('🏢 SpaceModal: Buildings response:', buildingsResponse);
      console.log('🛠️ SpaceModal: Amenities response:', amenitiesResponse);
      
      if (servicesResponse && servicesResponse.success) {
        // API returns data in response.data.services format
        const servicesData = servicesResponse.data?.services || [];
        console.log('✅ SpaceModal: Layanan data loaded:', servicesData);
        setAvailableServices(Array.isArray(servicesData) ? servicesData : []);
      } else {
        console.log('❌ SpaceModal: No layanan data or failed response');
        setAvailableServices([]);
      }
      
      if (buildingsResponse && buildingsResponse.success) {
        // API returns data in response.data.buildings format (similar to services)
        const buildingsData = buildingsResponse.data?.buildings || [];
        console.log('✅ SpaceModal: Buildings data loaded:', buildingsData.length, 'buildings');
        console.log('🔍 SpaceModal: Full buildings response structure:', {
          success: buildingsResponse.success,
          data: buildingsResponse.data,
          buildingsArray: buildingsData,
          dataLength: buildingsData.length,
          isArray: Array.isArray(buildingsData),
          firstBuilding: buildingsData[0]
        });
        setAvailableBuildings(Array.isArray(buildingsData) ? buildingsData : []);
      } else {
        console.log('❌ SpaceModal: No buildings data or failed response:', buildingsResponse);
        setAvailableBuildings([]);
      }

      if (amenitiesResponse && amenitiesResponse.success) {
        // Check if amenities has similar structure to services/buildings
        const amenitiesData = amenitiesResponse.data?.amenities || amenitiesResponse.data || [];
        console.log('✅ SpaceModal: Amenities data loaded:', Array.isArray(amenitiesData) ? amenitiesData.length : 'unknown', 'amenities');
        console.log('🔍 SpaceModal: Amenities response structure:', {
          success: amenitiesResponse.success,
          data: amenitiesResponse.data,
          amenitiesArray: amenitiesData,
          isArray: Array.isArray(amenitiesData)
        });
        setAvailableAmenities(Array.isArray(amenitiesData) ? amenitiesData : []);
      } else {
        console.log('❌ SpaceModal: No amenities data or failed response');
        setAvailableAmenities([]);
      }
    } catch (error) {
      console.error('💥 SpaceModal: Error fetching data:', error);
      setAvailableServices([]);
      setAvailableBuildings([]);
      setAvailableAmenities([]);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchData();
    }
  }, [isOpen]);

  // Listen to global refresh triggers for buildings
  useEffect(() => {
    if (refreshTriggers.buildings > 0 && isOpen) {
      console.log('🔄 SpaceModal: Buildings refresh triggered, refreshing data...');
      fetchData();
    }
  }, [refreshTriggers.buildings, isOpen]);

  // Get available buildings
  const getAvailableBuildings = () => {
    console.log('🏗️ getAvailableBuildings called, availableBuildings:', availableBuildings);
    
    if (Array.isArray(availableBuildings) && availableBuildings.length > 0) {
      const buildingOptions = availableBuildings.map(building => ({
        value: building.id || building.buildingId,
        label: building.name,
        buildingData: building
      }));
      console.log('✅ Building options created:', buildingOptions);
      return buildingOptions;
    }
    
    console.log('⚠️ No buildings available for dropdown');
    return [];
  };

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      if (space && mode === 'edit') {
        setFormData({
          name: space.name || '',
          description: space.description || '',
          layanan: space.category || space.layanan || '',
          capacity: space.capacity || '',
          buildingId: space.buildingId || '',
          operationalHours: {
            isAlwaysOpen: space.operationalHours?.isAlwaysOpen || false,
            schedule: space.operationalHours?.schedule || {
              monday: { isOpen: true, openTime: '08:00', closeTime: '17:00' },
              tuesday: { isOpen: true, openTime: '08:00', closeTime: '17:00' },
              wednesday: { isOpen: true, openTime: '08:00', closeTime: '17:00' },
              thursday: { isOpen: true, openTime: '08:00', closeTime: '17:00' },
              friday: { isOpen: true, openTime: '08:00', closeTime: '17:00' },
              saturday: { isOpen: true, openTime: '09:00', closeTime: '15:00' },
              sunday: { isOpen: false, openTime: '09:00', closeTime: '15:00' }
            }
          },
          pricing: {
            hourly: space.pricing?.hourly || '',
            halfday: space.pricing?.halfday || '',
            daily: space.pricing?.daily || '',
            monthly: space.pricing?.monthly || '',
            currency: space.pricing?.currency || 'IDR'
          },
          amenities: space.amenities || [],
          isActive: space.isActive !== undefined ? space.isActive : true
        });
        
        // Set existing images if available
        if (space.images && Array.isArray(space.images) && space.images.length > 0) {
          setImagePreviews(space.images);
        } else {
          setImagePreviews([]);
        }
      } else {
        setFormData({
          name: '',
          description: '',
          layanan: '',
          capacity: '',
          buildingId: '',
          operationalHours: {
            isAlwaysOpen: false,
            schedule: {
              monday: { isOpen: true, openTime: '08:00', closeTime: '17:00' },
              tuesday: { isOpen: true, openTime: '08:00', closeTime: '17:00' },
              wednesday: { isOpen: true, openTime: '08:00', closeTime: '17:00' },
              thursday: { isOpen: true, openTime: '08:00', closeTime: '17:00' },
              friday: { isOpen: true, openTime: '08:00', closeTime: '17:00' },
              saturday: { isOpen: true, openTime: '09:00', closeTime: '15:00' },
              sunday: { isOpen: false, openTime: '09:00', closeTime: '15:00' }
            }
          },
          pricing: {
            hourly: '',
            halfday: '',
            daily: '',
            monthly: '',
            currency: 'IDR'
          },
          amenities: [],
          isActive: true
        });
        
        // Reset image states for new space
        setImagePreviews([]);
        setImageFiles([]);
      }
      setError('');
      setImageError('');
    }
  }, [isOpen, space, mode]);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    if (name.includes('.')) {
      const [section, field, subfield] = name.split('.');
      
      // Handle schedule updates (operationalHours.schedule.monday.isOpen)
      if (section === 'operationalHours' && field === 'schedule') {
        const [day, property] = [subfield, e.target.dataset.property];
        setFormData(prev => ({
          ...prev,
          operationalHours: {
            ...prev.operationalHours,
            schedule: {
              ...prev.operationalHours.schedule,
              [day]: {
                ...prev.operationalHours.schedule[day],
                [property]: type === 'checkbox' ? checked : value
              }
            }
          }
        }));
      } else {
        // Handle other nested fields (pricing.hourly, etc.)
        setFormData(prev => ({
          ...prev,
          [section]: {
            ...prev[section],
            [field]: type === 'checkbox' ? checked : value
          }
        }));
      }
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

  // Handle multiple image uploads
  const handleImageUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;

    console.log('🖼️ SpaceModal: Image upload started', {
      fileCount: files.length,
      files: files.map(f => ({ name: f.name, size: f.size, type: f.type }))
    });

    // Validate files
    const validFiles = [];
    const errors = [];

    for (let file of files) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        errors.push(`${file.name}: File harus berupa gambar (JPG, PNG, WebP, GIF)`);
        continue;
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        errors.push(`${file.name}: Ukuran file maksimal 5MB`);
        continue;
      }

      validFiles.push(file);
    }

    if (errors.length > 0) {
      setImageError(errors.join(', '));
      return;
    }

    try {
      setUploadingImages(true);
      setImageError('');

      // Create previews for valid files
      const newPreviews = [];
      for (let file of validFiles) {
        const preview = await new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = (e) => resolve(e.target.result);
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });
        newPreviews.push(preview);
      }

      // Add new files and previews to existing ones
      setImageFiles(prev => [...prev, ...validFiles]);
      setImagePreviews(prev => [...prev, ...newPreviews]);

      console.log('✅ SpaceModal: Images processed successfully');
    } catch (error) {
      console.error('❌ SpaceModal: Error processing images:', error);
      setImageError('Gagal memproses gambar');
    } finally {
      setUploadingImages(false);
    }
  };

  // Remove image
  const removeImage = (index) => {
    setImageFiles(prev => prev.filter((_, i) => i !== index));
    setImagePreviews(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Basic validation
    if (!formData.name.trim()) {
      setError('Space name is required');
      return;
    }
    
    if (!formData.layanan) {
      setError('Layanan is required');
      return;
    }

    if (!formData.buildingId) {
      setError('Building selection is required');
      return;
    }

    if (!formData.capacity || parseInt(formData.capacity) <= 0) {
      setError('Valid capacity is required');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Log the raw form data
      console.log('Raw form data:', formData);

      // Prepare data for submission
      const submitData = {
        name: formData.name.trim(),
        description: formData.description.trim(),
        category: formData.layanan, // Backend expects 'category' field
        buildingId: formData.buildingId,
        capacity: parseInt(formData.capacity),
        operationalHours: {
          isAlwaysOpen: formData.operationalHours.isAlwaysOpen,
          schedule: formData.operationalHours.schedule
        },
        pricing: {
          hourly: formData.pricing.hourly ? parseFloat(formData.pricing.hourly) : null,
          halfday: formData.pricing.halfday ? parseFloat(formData.pricing.halfday) : null,
          daily: formData.pricing.daily ? parseFloat(formData.pricing.daily) : null,
          monthly: formData.pricing.monthly ? parseFloat(formData.pricing.monthly) : null,
          currency: formData.pricing.currency
        },
        amenities: formData.amenities,
        isActive: formData.isActive
      };

      // Log the prepared data
      console.log('Prepared submit data:', submitData);

      const savedSpace = await onSave(submitData);
      
      // Upload images if there are new ones
      if (imageFiles.length > 0 && (savedSpace?.id || (mode === 'edit' && space?.id))) {
        try {
          const spaceId = savedSpace?.id || space?.id;
          console.log('📤 SpaceModal: Uploading images for space:', spaceId);
          const result = await spacesAPI.uploadImages(spaceId, imageFiles);
          console.log('✅ SpaceModal: Images uploaded successfully:', result);
        } catch (imageError) {
          console.error('❌ SpaceModal: Error uploading images:', imageError);
          setError(`Space berhasil disimpan, tetapi gagal mengupload gambar: ${imageError.message}`);
          return; // Don't close modal so user can see the error
        }
      }
      
      onClose();
    } catch (error) {
      console.error('Error in handleSubmit:', error);
      setError(error.message || 'An error occurred while saving');
    } finally {
      setLoading(false);
    }
  };

  // Filter amenities
  const filteredAmenities = Array.isArray(availableAmenities)
    ? availableAmenities.filter(amenity =>
        amenity.name.toLowerCase().includes(amenitySearchTerm.toLowerCase())
      )
    : [];

  // Get available layanan (from services table)
  const getAvailableLayanan = () => {
    console.log('🎯 getAvailableLayanan called, availableServices:', availableServices);
    
    if (Array.isArray(availableServices) && availableServices.length > 0) {
      const layananOptions = availableServices.map(service => ({
        value: service.layananId || service.id || service.slug || service.name.toLowerCase().replace(/\s+/g, '-'),
        label: service.name,
        serviceData: service // Include full service data for reference
      }));
      console.log('✅ Using layanan from database:', layananOptions);
      return layananOptions;
    }
    
    console.log('⚠️ No layanan from database, using fallback:', fallbackLayanan);
    return fallbackLayanan;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-900/75 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-xl shadow-2xl border border-gray-200 w-full max-w-4xl max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-gray-200 sticky top-0 bg-gray-50/50 z-10">
          <h2 className="text-xl font-semibold text-gray-900">
            {mode === 'edit' ? 'Edit Space' : 'Add New Space'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-all duration-200"
          >
            <X className="w-5 h-5" />
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
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 ring-primary"
                placeholder="Enter space name"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Layanan <span className="text-red-500">*</span>
              </label>
              <select
                name="layanan"
                value={formData.layanan}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 ring-primary"
                required
              >
                <option value="">Select Layanan</option>
                {getAvailableLayanan().map(layanan => (
                  <option key={layanan.value} value={layanan.value}>
                    {layanan.label}
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
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 ring-primary"
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
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 ring-primary"
              placeholder="Enter space description"
            />
          </div>

          {/* Building Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Building <span className="text-red-500">*</span>
            </label>
            <select
              name="buildingId"
              value={formData.buildingId}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 ring-primary"
              required
            >
              <option value="">Select Building</option>
              {getAvailableBuildings().map(building => (
                <option key={building.value} value={building.value}>
                  {building.label}
                </option>
              ))}
            </select>
          </div>

          {/* Space Images */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900">Space Images</h3>
            
            {/* Image Upload Area */}
            <div className="space-y-4">
              <div className="flex items-center justify-center w-full">
                <label
                  htmlFor="space-images-upload"
                  className={`flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100 transition-colors ${uploadingImages ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    <Upload className="w-8 h-8 mb-4 text-gray-500" />
                    <p className="mb-2 text-sm text-gray-500">
                      <span className="font-semibold">Click to upload</span> multiple space images
                    </p>
                    <p className="text-xs text-gray-500">PNG, JPG, WebP up to 5MB each</p>
                  </div>
                  <input
                    id="space-images-upload"
                    type="file"
                    className="hidden"
                    accept="image/*"
                    multiple
                    onChange={handleImageUpload}
                    disabled={uploadingImages}
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
              {uploadingImages && (
                <div className="text-sm text-blue-600 bg-blue-50 border border-blue-200 rounded-md p-2">
                  Processing images...
                </div>
              )}

              {/* Image Previews Grid */}
              {imagePreviews.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-sm font-medium text-gray-700">
                    Uploaded Images ({imagePreviews.length})
                  </h4>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                    {imagePreviews.map((preview, index) => (
                      <div key={index} className="relative group">
                        <div className="aspect-square w-full border-2 border-gray-200 rounded-lg overflow-hidden">
                          <img
                            src={preview}
                            alt={`Space image ${index + 1}`}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <button
                          type="button"
                          onClick={() => removeImage(index)}
                          className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                        >
                          <X className="w-3 h-3" />
                        </button>
                        <div className="absolute bottom-1 left-1 bg-black/50 text-white text-xs px-2 py-1 rounded">
                          {index + 1}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Operational Hours */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900">Jam Operasional</h3>
            
            {/* Always Open Checkbox */}
            <div className="flex items-center">
              <input
                type="checkbox"
                name="operationalHours.isAlwaysOpen"
                checked={formData.operationalHours.isAlwaysOpen}
                onChange={handleInputChange}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <label className="ml-2 text-sm text-gray-700">
                Buka 24 Jam
              </label>
            </div>

            {/* Daily Schedule - only show if not always open */}
            {!formData.operationalHours.isAlwaysOpen && (
              <div className="space-y-3">
                <p className="text-sm text-gray-600">Atur jam operasional per hari:</p>
                
                {Object.entries(formData.operationalHours.schedule).map(([day, daySchedule]) => {
                  const dayNames = {
                    monday: 'Senin',
                    tuesday: 'Selasa', 
                    wednesday: 'Rabu',
                    thursday: 'Kamis',
                    friday: 'Jumat',
                    saturday: 'Sabtu',
                    sunday: 'Minggu'
                  };

                  return (
                    <div key={day} className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg">
                      {/* Day Name */}
                      <div className="w-20 text-sm font-medium text-gray-700">
                        {dayNames[day]}
                      </div>

                      {/* Open/Closed Toggle */}
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          name={`operationalHours.schedule.${day}`}
                          data-property="isOpen"
                          checked={daySchedule.isOpen}
                          onChange={handleInputChange}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <label className="ml-2 text-sm text-gray-600">
                          Buka
                        </label>
                      </div>

                      {/* Time inputs - only show if day is open */}
                      {daySchedule.isOpen && (
                        <>
                          <div className="flex items-center gap-2">
                            <label className="text-sm text-gray-600">Dari:</label>
                            <input
                              type="time"
                              name={`operationalHours.schedule.${day}`}
                              data-property="openTime"
                              value={daySchedule.openTime}
                              onChange={handleInputChange}
                              className="px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-1 ring-primary text-sm"
                            />
                          </div>

                          <div className="flex items-center gap-2">
                            <label className="text-sm text-gray-600">Sampai:</label>
                            <input
                              type="time"
                              name={`operationalHours.schedule.${day}`}
                              data-property="closeTime"
                              value={daySchedule.closeTime}
                              onChange={handleInputChange}
                              className="px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-1 ring-primary text-sm"
                            />
                          </div>
                        </>
                      )}

                      {/* Closed indicator */}
                      {!daySchedule.isOpen && (
                        <span className="text-sm text-gray-500 italic">Tutup</span>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Pricing */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900">Pricing</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Currency
                </label>
                <select
                  name="pricing.currency"
                  value={formData.pricing.currency}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 ring-primary"
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
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 ring-primary"
                  placeholder="0.00"
                  step="0.01"
                  min="0"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Halfday Rate
                </label>
                <input
                  type="number"
                  name="pricing.halfday"
                  value={formData.pricing.halfday}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 ring-primary"
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
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 ring-primary"
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
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 ring-primary"
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
              <h3 className="text-lg font-medium text-gray-900">Fasilitas Tersedia:</h3>
            </div>
            
            {/* Amenity Search */}
            <div className="relative">
              <input
                type="text"
                placeholder="Cari fasilitas..."
                value={amenitySearchTerm}
                onChange={(e) => setAmenitySearchTerm(e.target.value)}
                className="w-full pl-4 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 ring-primary"
              />
            </div>

            {/* Available Amenities */}
            {Array.isArray(availableAmenities) && availableAmenities.length > 0 && (
              <div>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                  {filteredAmenities.map((amenity) => (
                    <label key={amenity.id} className="flex items-center p-2 rounded-md bg-gray-100 hover:bg-gray-200 cursor-pointer">
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
          </div>

          {/* Active Status */}
          <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
            <h3 className="text-lg font-medium text-gray-900 mb-3">Status Manual</h3>
            <div className="flex items-center">
              <input
                type="checkbox"
                name="isActive"
                checked={formData.isActive}
                onChange={handleInputChange}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <label className="ml-2 text-sm text-gray-700">
                <span className="font-medium">Aktifkan ruang secara manual</span>
                <p className="text-xs text-gray-500 mt-1">
                  Ruang tetap harus mengikuti jam operasional meskipun diaktifkan manual
                </p>
              </label>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200 bg-gray-50/50 -mx-6 px-6 pb-6 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2.5 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 hover:border-gray-400 focus:outline-none focus:ring-2 ring-primary transition-all duration-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2.5 bg-gradient-primary text-white rounded-lg hover:bg-gradient-primary-hover focus:outline-none focus:ring-2 ring-primary shadow-primary transition-all duration-200 disabled:opacity-50"
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