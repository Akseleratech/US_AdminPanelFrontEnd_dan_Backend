# UnionSpace CRM - Mobile App Integration

## Geocoding Cities for Mobile Apps

### Problem
Mobile apps were getting permission denied errors when trying to write directly to the `cities` collection in Firestore. This is because Firestore rules only allow admin users to write to cities.

### Solution
Use the new `/api/cities/geocode` endpoint instead of writing directly to Firestore.

### API Endpoint

**POST** `/api/cities/geocode`

#### Request Body
```json
{
  "cityName": "Yogyakarta",
  "provinceName": "DI Yogyakarta", 
  "countryName": "Indonesia"
}
```

#### Response
```json
{
  "success": true,
  "data": {
    "id": "CIT25001",
    "cityId": "CIT25001",
    "name": "Yogyakarta",
    "province": "DI Yogyakarta",
    "country": "Indonesia",
    "isExisting": false,
    // ... other city fields
  },
  "message": "City created successfully"
}
```

---

## City Coordinates Feature

### Overview
Cities now have coordinates calculated as the centroid (average position) of all buildings within that city. This provides a representative location for each city area.

### Automatic Coordinate Calculation
- **When**: Coordinates are automatically calculated and updated when:
  - A building is created in a city
  - A building is updated (location changes)
  - A building is deleted from a city
- **How**: The system calculates the centroid from all buildings with valid coordinates in that city
- **Data Structure**:
```json
{
  "latitude": -6.2088,
  "longitude": 106.8456,
  "coordinates": {
    "type": "centroid",
    "source": "calculated_from_buildings", 
    "buildingsCount": 15,
    "lastCalculated": "2024-01-15T10:30:00Z"
  }
}
```

### Manual Batch Calculation (Admin Only)

For existing cities that don't have coordinates yet, admins can trigger a batch calculation.

**POST** `/api/cities/calculate-coordinates`

#### Headers
```
Authorization: Bearer <admin_token>
Content-Type: application/json
```

#### Response
```json
{
  "success": true,
  "message": "Batch coordinate calculation completed",
  "results": {
    "total": 50,
    "updated": 35,
    "skipped": 12,
    "errors": 3,
    "details": [
      {
        "city": "Jakarta",
        "status": "updated",
        "coordinates": {
          "latitude": -6.2088,
          "longitude": 106.8456,
          "buildingsCount": 25
        }
      },
      {
        "city": "Surabaya", 
        "status": "skipped",
        "reason": "already_has_coordinates"
      },
      {
        "city": "Medan",
        "status": "skipped", 
        "reason": "no_buildings_with_coordinates"
      }
    ]
  }
}
```

### Coordinate Structure Migration (Admin Only)

For existing cities that have the old coordinate structure (latitude/longitude as sub-attributes), admins can migrate to the new structure.

**POST** `/api/cities/migrate-coordinates`

#### Headers
```
Authorization: Bearer <admin_token>
Content-Type: application/json
```

#### What it does:
- **Old Structure**: `coordinates: { latitude: -6.2088, longitude: 106.8456, type: "centroid" }`
- **New Structure**: `latitude: -6.2088, longitude: 106.8456, coordinates: { type: "centroid" }`

#### Response
```json
{
  "success": true,
  "message": "Coordinate structure migration completed",
  "results": {
    "total": 25,
    "migrated": 18,
    "skipped": 7,
    "errors": 0,
    "details": [
      {
        "city": "Jakarta",
        "status": "migrated",
        "latitude": -6.2088,
        "longitude": 106.8456
      },
      {
        "city": "Bandung",
        "status": "skipped",
        "reason": "already_migrated"
      },
      {
        "city": "Medan",
        "status": "skipped",
        "reason": "no_coordinates"
      }
    ]
  }
}
```

### Usage in Frontend

#### Get Cities with Coordinates
```javascript
// Cities now include coordinates in the response
const cities = await citiesAPI.getAll();

cities.forEach(city => {
  if (city.coordinates) {
    console.log(`${city.name}: ${city.coordinates.latitude}, ${city.coordinates.longitude}`);
    // Can be used for map integration, distance calculations, etc.
  }
});
```

#### Admin Function to Calculate All Coordinates
```javascript
// For admin panel
const calculateAllCoordinates = async () => {
  try {
    const response = await fetch('/api/cities/calculate-coordinates', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${adminToken}`,
        'Content-Type': 'application/json'
      }
    });
    
    const result = await response.json();
    console.log('Batch calculation result:', result.results);
  } catch (error) {
    console.error('Error calculating coordinates:', error);
  }
};
```

### Benefits

1. **Map Integration**: Cities can now be displayed on maps with accurate positions
2. **Distance Calculations**: Can calculate distances between cities
3. **Geographic Analytics**: Better geographic analysis and reporting
4. **Mobile App**: Improved location-based features
5. **Auto-updating**: Coordinates automatically update as buildings are added/removed

### Technical Details

- **Centroid Algorithm**: Simple average of all building coordinates
- **Performance**: Minimal resource usage (< $0.001 per calculation)
- **Fallbacks**: Cities without buildings show null coordinates
- **Validation**: Only buildings with valid lat/lng are included
- **Real-time**: Updates happen automatically via Cloud Functions triggers

---

### Usage in Mobile App

#### Flutter Example
```dart
Future<Map<String, dynamic>> geocodeCity(String cityName, String provinceName) async {
  try {
    final response = await http.post(
      Uri.parse('https://your-domain.com/api/cities/geocode'),
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer $userToken', // Include user auth token
      },
      body: jsonEncode({
        'cityName': cityName,
        'provinceName': provinceName,
        'countryName': 'Indonesia'
      }),
    );

    if (response.statusCode == 200) {
      final data = jsonDecode(response.body);
      return data['data'];
    } else {
      throw Exception('Failed to geocode city');
    }
  } catch (e) {
    print('Error geocoding city: $e');
    rethrow;
  }
}
```

#### React/Web Example
```javascript
import cityAPI from '../services/cityApi';

const geocodeCity = async (cityName, provinceName) => {
  try {
    const result = await cityAPI.geocodeCity(cityName, provinceName, 'Indonesia');
    return result;
  } catch (error) {
    console.error('Error geocoding city:', error);
    throw error;
  }
};
```

### Migration Guide

1. **For existing cities**: Run the batch calculation endpoint to populate coordinates
2. **For new cities**: Coordinates will be calculated automatically when buildings are added
3. **For mobile apps**: Update to use the geocode endpoint instead of direct Firestore writes 