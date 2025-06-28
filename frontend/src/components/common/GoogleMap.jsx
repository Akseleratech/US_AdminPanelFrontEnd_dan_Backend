import React, { useEffect, useRef, useState, useCallback } from 'react';
import { MapPin, Navigation } from 'lucide-react';

// Global flag to track if Google Maps is being loaded
let isGoogleMapsLoading = false;
let loadPromise = null;

const GoogleMap = ({ 
  coordinates, 
  onLocationSelect, 
  height = '400px',
  zoom = 13,
  className = '',
  showSearchBox = false, // Default to false since we disabled Places API
  enableManualSet = false, // New prop to enable manual set mode
  onLocationPreview = null // Callback for preview position before setting
}) => {
  const mapRef = useRef(null);
  const [map, setMap] = useState(null);
  const [marker, setMarker] = useState(null);
  const [geocoder, setGeocoder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isInitialized, setIsInitialized] = useState(false);
  const [previewPosition, setPreviewPosition] = useState(null);
  const [previewLocationData, setPreviewLocationData] = useState(null);

  // Default coordinates (Jakarta, Indonesia)
  const defaultCenter = { lat: -6.2088, lng: 106.8456 };

  // Check if Google Maps is fully loaded
  const isGoogleMapsReady = () => {
    return window.google && 
           window.google.maps && 
           window.google.maps.Map && 
           window.google.maps.Marker && 
           window.google.maps.Geocoder &&
           typeof window.google.maps.Map === 'function';
  };

  // Wait for Google Maps to be ready
  const waitForGoogleMaps = (timeout = 15000) => {
    return new Promise((resolve, reject) => {
      if (isGoogleMapsReady()) {
        resolve();
        return;
      }

      const startTime = Date.now();
      const checkInterval = setInterval(() => {
        if (isGoogleMapsReady()) {
          clearInterval(checkInterval);
          resolve();
        } else if (Date.now() - startTime > timeout) {
          clearInterval(checkInterval);
          reject(new Error(`Google Maps API failed to load within ${timeout}ms. Please check your internet connection and API key permissions.`));
        }
      }, 200);
    });
  };

  // Load Google Maps Script with proper management
  const loadGoogleMaps = useCallback(async () => {
    try {
      // Check if Google Maps is already loaded and ready
      if (isGoogleMapsReady()) {
        return Promise.resolve();
      }

      // If already loading, return the existing promise
      if (isGoogleMapsLoading && loadPromise) {
        return loadPromise;
      }

      // Get API key from environment
      const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
      
      if (!apiKey) {
        throw new Error('Google Maps API key is not configured. Please add VITE_GOOGLE_MAPS_API_KEY to your environment variables.');
      }

      // Set loading flag
      isGoogleMapsLoading = true;

      // Create promise for script loading
      loadPromise = new Promise((resolve, reject) => {
        // Check if script already exists
        const existingScript = document.querySelector('script[src*="maps.googleapis.com"]');
        if (existingScript) {
          // If script exists and Google Maps is ready, resolve
          if (isGoogleMapsReady()) {
            isGoogleMapsLoading = false;
            resolve();
            return;
          }
          
          // If script exists but not ready, wait for it
          existingScript.onload = async () => {
            try {
              await waitForGoogleMaps();
              isGoogleMapsLoading = false;
              resolve();
            } catch (error) {
              isGoogleMapsLoading = false;
              reject(error);
            }
          };
          
          existingScript.onerror = () => {
            isGoogleMapsLoading = false;
            reject(new Error('Failed to load Google Maps script'));
          };
          return;
        }

        // Create new script element
        const script = document.createElement('script');
        script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&loading=async`;
        script.async = true;
        script.defer = true;

        // Handle script load
        script.onload = async () => {
          try {
            await waitForGoogleMaps();
            isGoogleMapsLoading = false;
            resolve();
          } catch (error) {
            isGoogleMapsLoading = false;
            reject(error);
          }
        };

        script.onerror = (event) => {
          isGoogleMapsLoading = false;
          reject(new Error('Failed to load Google Maps. Please check your API key and internet connection.'));
        };

        document.head.appendChild(script);
      });

      return loadPromise;
    } catch (error) {
      isGoogleMapsLoading = false;
      throw error;
    }
  }, []);

  // Handle location change
  const handleLocationChange = useCallback((position, geocoderInstance, providedAddress = null) => {
    if (enableManualSet) {
      // In manual set mode, just update preview position
      setPreviewPosition(position);
      
      // Reverse geocode to get preview data
      if (geocoderInstance) {
        geocoderInstance.geocode(
          { location: position },
          (results, status) => {
            if (status === 'OK' && results[0]) {
              const locationData = buildLocationData(results[0], position);
              setPreviewLocationData(locationData);
              onLocationPreview && onLocationPreview(locationData);
            }
          }
        );
      }
    } else {
      // Normal mode - immediately set location
      if (providedAddress) {
        // Use provided address (from search) - parse it
        parseAddressComponents(providedAddress, position);
      } else {
        // Reverse geocode to get detailed address
        geocoderInstance.geocode(
          { location: position },
          (results, status) => {
            if (status === 'OK' && results[0]) {
              parseAddressComponents(results[0], position);
            } else {
              // Fallback with basic coordinate info
              onLocationSelect && onLocationSelect({
                coordinates: position,
                address: `${position.lat.toFixed(6)}, ${position.lng.toFixed(6)}`,
                city: '',
                province: '',
                postalCode: '',
                country: 'Indonesia'
              });
            }
          }
        );
      }
    }
  }, [onLocationSelect, onLocationPreview, enableManualSet]);

  // Function to clean city/regency names by removing administrative prefixes
  const cleanCityName = (rawCityName) => {
    if (!rawCityName) return '';
    
    // List of prefixes to remove (case insensitive)
    const prefixesToRemove = [
      'Kabupaten ', 'Kab. ', 'Kab ', 
      'Kota ', 'Kotamadya ',
      'Provinsi ', 'Prov. ', 'Prov ',
      'Daerah Istimewa ', 'DI ', 
      'Daerah Khusus Ibukota ', 'DKI '
    ];
    
    let cleanedName = rawCityName;
    
    // Remove prefixes (case insensitive)
    prefixesToRemove.forEach(prefix => {
      const regex = new RegExp(`^${prefix}`, 'i');
      cleanedName = cleanedName.replace(regex, '');
    });
    
    // Trim any extra spaces
    cleanedName = cleanedName.trim();
    
    console.log(`🧹 City name cleaned: "${rawCityName}" → "${cleanedName}"`);
    return cleanedName;
  };

  // Function to clean province names
  const cleanProvinceName = (rawProvinceName) => {
    if (!rawProvinceName) return '';
    
    // List of prefixes to remove for provinces
    const prefixesToRemove = [
      'Provinsi ', 'Prov. ', 'Prov ',
      'Daerah Istimewa ', 'DI ',
      'Daerah Khusus Ibukota ', 'DKI '
    ];
    
    let cleanedName = rawProvinceName;
    
    // Remove prefixes (case insensitive) 
    prefixesToRemove.forEach(prefix => {
      const regex = new RegExp(`^${prefix}`, 'i');
      cleanedName = cleanedName.replace(regex, '');
    });
    
    // Special cases for common Indonesian provinces
    const specialCases = {
      'Jakarta': 'DKI Jakarta',
      'Yogyakarta': 'DI Yogyakarta',
      'Aceh': 'Aceh'
    };
    
    // Check if cleaned name matches special cases
    if (specialCases[cleanedName]) {
      cleanedName = specialCases[cleanedName];
    }
    
    cleanedName = cleanedName.trim();
    console.log(`🧹 Province name processed: "${rawProvinceName}" → "${cleanedName}"`);
    return cleanedName;
  };

  // Build location data from geocoding result
  const buildLocationData = (geocodeResult, position) => {
    let address = '';
    let city = '';
    let province = '';
    let postalCode = '';
    let country = 'Indonesia';

    if (typeof geocodeResult === 'string') {
      // If it's just a string address
      address = geocodeResult;
    } else if (geocodeResult.formatted_address) {
      // If it's a full geocoding result object
      address = geocodeResult.formatted_address;
      
      // Parse address components
      if (geocodeResult.address_components) {
        geocodeResult.address_components.forEach(component => {
          const types = component.types;
          
          if (types.includes('administrative_area_level_2') || types.includes('locality')) {
            // City/Kabupaten - clean the name
            city = cleanCityName(component.long_name);
          } else if (types.includes('administrative_area_level_1')) {
            // Province/State - clean the name  
            province = cleanProvinceName(component.long_name);
          } else if (types.includes('postal_code')) {
            // Postal Code
            postalCode = component.long_name;
          } else if (types.includes('country')) {
            // Country
            country = component.long_name;
          }
        });
      }
    }

    // Clean up address by removing country if it's at the end
    if (country && address.endsWith(`, ${country}`)) {
      address = address.replace(`, ${country}`, '');
    }

    return {
      coordinates: position,
      address: address,
      city: city,
      province: province,
      postalCode: postalCode,
      country: country
    };
  };

  // Parse address components from Google Geocoding result
  const parseAddressComponents = (geocodeResult, position) => {
    const locationData = buildLocationData(geocodeResult, position);

    // Debug logging
    console.log('📍 Google Maps Location Data:', {
      originalAddress: geocodeResult.formatted_address,
      cleanedAddress: locationData.address,
      city: locationData.city,
      province: locationData.province,
      postalCode: locationData.postalCode,
      country: locationData.country,
      coordinates: position
    });

    // Send complete location data
    onLocationSelect && onLocationSelect(locationData);
  };

  // Initialize map
  const initializeMap = useCallback(async () => {
    try {
      if (!mapRef.current || isInitialized) return;

      // Wait for Google Maps to load
      await loadGoogleMaps();

      // Double check that Google Maps is ready
      if (!isGoogleMapsReady()) {
        throw new Error('Google Maps API is not ready');
      }

      const center = coordinates || defaultCenter;
      
      // Create map
      const mapInstance = new window.google.maps.Map(mapRef.current, {
        center,
        zoom,
        mapTypeControl: true,
        streetViewControl: false,
        fullscreenControl: false,
        zoomControl: true,
      });

      // Create geocoder
      const geocoderInstance = new window.google.maps.Geocoder();

      // Create marker using the current (deprecated but working) API
      // Note: We'll migrate to AdvancedMarkerElement in a future update
      const markerInstance = new window.google.maps.Marker({
        position: center,
        map: mapInstance,
        draggable: true,
        title: 'Space Location'
      });

      // Add click listener to map
      mapInstance.addListener('click', (event) => {
        const newPosition = {
          lat: event.latLng.lat(),
          lng: event.latLng.lng()
        };
        
        markerInstance.setPosition(newPosition);
        handleLocationChange(newPosition, geocoderInstance);
      });

      // Add drag listener to marker
      markerInstance.addListener('dragend', (event) => {
        const newPosition = {
          lat: event.latLng.lat(),
          lng: event.latLng.lng()
        };
        
        handleLocationChange(newPosition, geocoderInstance);
      });

      setMap(mapInstance);
      setMarker(markerInstance);
      setGeocoder(geocoderInstance);
      setLoading(false);
      setIsInitialized(true);

      // If initial coordinates provided, reverse geocode to get address
      if (coordinates) {
        handleLocationChange(coordinates, geocoderInstance);
      }

    } catch (error) {
      console.error('Error initializing map:', error);
      setError(error.message);
      setLoading(false);
    }
  }, [loadGoogleMaps, handleLocationChange, coordinates, zoom]);

  // Update marker position when coordinates prop changes
  useEffect(() => {
    if (map && marker && coordinates && isInitialized) {
      const newPosition = coordinates;
      map.setCenter(newPosition);
      marker.setPosition(newPosition);
    }
  }, [map, marker, coordinates, isInitialized]);

  // Confirm set location (for manual set mode)
  const confirmSetLocation = () => {
    if (previewLocationData) {
      onLocationSelect && onLocationSelect(previewLocationData);
      setPreviewPosition(null);
      setPreviewLocationData(null);
    }
  };

  // Cancel location selection (for manual set mode)
  const cancelLocationSelection = () => {
    setPreviewPosition(null);
    setPreviewLocationData(null);
    
    // Reset marker to original position
    if (marker && coordinates) {
      marker.setPosition(coordinates);
      map.setCenter(coordinates);
    }
  };

  // Get current location
  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by this browser');
      return;
    }

    setLoading(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const newPosition = {
          lat: position.coords.latitude,
          lng: position.coords.longitude
        };

        if (map && marker) {
          map.setCenter(newPosition);
          map.setZoom(15);
          marker.setPosition(newPosition);
          handleLocationChange(newPosition, geocoder);
        }
        setLoading(false);
      },
      (error) => {
        console.error('Error getting current location:', error);
        setError('Failed to get current location');
        setLoading(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000
      }
    );
  };

  // Initialize map when component mounts - only once
  useEffect(() => {
    if (!isInitialized) {
      initializeMap();
    }
  }, [initializeMap, isInitialized]);

  return (
    <div className={`relative ${className}`}>
      {/* Current Location Button */}
      <div className="absolute top-2 right-2 z-10">
        <button
          type="button"
          onClick={getCurrentLocation}
          disabled={loading}
          className="px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
          title="Get current location"
        >
          {loading ? (
            <div className="w-4 h-4 border border-white border-t-transparent rounded-full animate-spin"></div>
          ) : (
            <Navigation className="w-4 h-4" />
          )}
        </button>
      </div>

      {/* Map Container */}
      <div 
        ref={mapRef} 
        style={{ height }} 
        className="w-full rounded-md border border-gray-300"
      />

      {/* Loading State */}
      {loading && (
        <div className="absolute inset-0 bg-gray-100 flex items-center justify-center rounded-md">
          <div className="text-center">
            <div className="w-8 h-8 border border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
            <p className="text-sm text-gray-600">Loading map...</p>
          </div>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="absolute inset-0 bg-red-50 flex items-center justify-center rounded-md border border-red-200">
          <div className="text-center p-4">
            <MapPin className="w-8 h-8 text-red-500 mx-auto mb-2" />
            <p className="text-sm text-red-700 font-medium">Map Error</p>
            <p className="text-xs text-red-600 mt-1">{error}</p>
          </div>
        </div>
      )}

      {/* Manual Set Controls */}
      {enableManualSet && previewPosition && !loading && !error && (
        <div className="absolute bottom-2 left-2 right-2 z-10">
          <div className="bg-white bg-opacity-95 px-4 py-3 rounded-md shadow-lg border border-gray-200">
            <div className="text-center mb-3">
              <p className="text-sm font-medium text-gray-700">Lokasi Dipilih</p>
              <p className="text-xs text-gray-500 mt-1">
                {previewLocationData?.address || `${previewPosition.lat.toFixed(6)}, ${previewPosition.lng.toFixed(6)}`}
              </p>
              {previewLocationData?.city && (
                <p className="text-xs text-gray-500">
                  {previewLocationData.city}, {previewLocationData.province}
                </p>
              )}
            </div>
            <div className="flex space-x-2">
              <button
                type="button"
                onClick={cancelLocationSelection}
                className="flex-1 px-3 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 text-sm font-medium"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={confirmSetLocation}
                className="flex-1 px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm font-medium"
              >
                Set Lokasi
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Instructions */}
      {!loading && !error && (
        <div className="absolute bottom-2 left-2 right-2 z-10">
          <div className={`bg-white bg-opacity-90 px-3 py-2 rounded-md text-xs text-gray-600 text-center ${enableManualSet && previewPosition ? 'hidden' : ''}`}>
            <MapPin className="w-3 h-3 inline mr-1" />
            {enableManualSet ? 'Klik pada peta atau drag marker untuk memilih lokasi' : 'Click on the map or drag the marker to set location'}
          </div>
        </div>
      )}
    </div>
  );
};

export default GoogleMap; 