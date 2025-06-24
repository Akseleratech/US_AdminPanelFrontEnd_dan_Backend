# Database Schema - UnionSpace CRM

## Overview
Database Firebase Firestore untuk sistem CRM UnionSpace dengan collections utama untuk spaces, orders, cities, services, dan amenities.

---

## 📍 **CITIES Collection** *(Simplified - Auto-Created)*

### Schema Structure
```javascript
{
  "cityId": "CTY1703123456789_abc123",
  "name": "Jakarta",                    // ✅ ESSENTIAL - City name  
  "province": "DKI Jakarta",            // ✅ ESSENTIAL - Province name
  "country": "Indonesia",               // ✅ ESSENTIAL - Country name
  "postalCodes": ["10110", "10220"],    // ✅ OPTIONAL - Array of postal codes
  "timezone": "Asia/Jakarta",           // ✅ AUTO-SET - Timezone (default: Asia/Jakarta)
  "utcOffset": "+07:00",               // ✅ AUTO-SET - UTC offset
  "statistics": {                       // ✅ AUTO-UPDATED - Space statistics
    "totalSpaces": 45,
    "activeSpaces": 42
  },
  "search": {                          // ✅ SEO & SEARCH - Auto-generated
    "keywords": ["jakarta", "dki jakarta"],
    "aliases": [],
    "slug": "jakarta",
    "metaTitle": "Co-working Spaces in Jakarta",
    "metaDescription": "Find and book workspaces in Jakarta, DKI Jakarta"
  },
  "isActive": true,                    // ✅ STATUS - Active/inactive flag
  "createdAt": "2023-12-20T10:30:00.000Z",
  "updatedAt": "2023-12-20T10:30:00.000Z", 
  "createdBy": "auto_maps_api"         // ✅ TRACKING - Creation source
}
```

### Key Changes (SIMPLIFIED):
- ❌ **REMOVED**: `location.coordinates` (latitude/longitude)
- ❌ **REMOVED**: `location.area` and `location.elevation`  
- ❌ **REMOVED**: `location.boundingBox`
- ❌ **REMOVED**: Complex location details
- ✅ **KEPT**: Essential identification fields (name, province, country)
- ✅ **KEPT**: Auto-statistics and search optimization
- ✅ **AUTO-CREATE**: Cities created automatically from Google Maps during space creation

### Creation Methods:
1. **AUTO-CREATE** *(Primary)*: When adding spaces via Google Maps integration
2. **MANUAL** *(Fallback)*: Simple form with name, province, country only

---

## 🏢 **SPACES Collection**

### Schema Structure  
```javascript
{
  "spaceId": "space_1703123456789_abc123",
  "name": "NextSpace Jakarta Central",
  "description": "Modern co-working space in the heart of Jakarta",
  "brand": "NextSpace", // NextSpace | UnionSpace | CoSpace
  "category": "co-working", // co-working | meeting-room | private-office
  "spaceType": "co-working",
  "capacity": 50,
  
  // ✅ LOCATION - Comprehensive location data
  "location": {
    "address": "Jl. Sudirman No. 123, Jakarta",
    "city": "Jakarta",                  // 🔗 Links to Cities collection
    "province": "DKI Jakarta", 
    "country": "Indonesia",
    "postalCode": "10220",
    "coordinates": {                    // 📍 Google Maps coordinates
      "lat": -6.2088,
      "lng": 106.8456
    },
    "latitude": -6.2088,               // ✅ KEPT for Google Maps integration
    "longitude": 106.8456
  },
  
  // Pricing information
  "pricing": {
    "hourly": 50000,
    "daily": 300000, 
    "monthly": 3000000,
    "currency": "IDR"
  },
  
  // Amenities and facilities
  "amenities": ["wifi", "coffee", "printer", "meeting-room"],
  
  // Media assets
  "images": [
    "https://storage.googleapis.com/space-images/img1.jpg",
    "https://storage.googleapis.com/space-images/img2.jpg"
  ],
  "thumbnail": "https://storage.googleapis.com/space-images/thumb.jpg",
  
  // Operating schedule
  "operatingHours": {
    "monday": { "open": "08:00", "close": "22:00" },
    "tuesday": { "open": "08:00", "close": "22:00" },
    "wednesday": { "open": "08:00", "close": "22:00" },
    "thursday": { "open": "08:00", "close": "22:00" },
    "friday": { "open": "08:00", "close": "22:00" },
    "saturday": { "open": "09:00", "close": "18:00" },
    "sunday": { "open": "09:00", "close": "18:00" }
  },
  
  // Status and metadata
  "isActive": true,
  "createdAt": "2023-12-20T10:30:00.000Z",
  "updatedAt": "2023-12-20T10:30:00.000Z", 
  "createdBy": "user123",
  "version": 1,
  
  // SEO and search optimization
  "slug": "nextspace-jakarta-central",
  "searchKeywords": ["nextspace", "jakarta", "co-working", "central", "sudirman"]
}
```

---

## 📋 **ORDERS Collection**

### Schema Structure
```javascript
{
  "orderId": "ORD1703123456789",
  "customerName": "John Doe",
  "customerEmail": "john@example.com", 
  "customerPhone": "+628123456789",
  "spaceId": "space_1703123456789_abc123", // 🔗 Reference to Spaces
  "spaceName": "NextSpace Jakarta Central",
  
  // Booking details
  "bookingType": "hourly", // hourly | daily | monthly
  "startDate": "2023-12-25T09:00:00.000Z",
  "endDate": "2023-12-25T17:00:00.000Z", 
  "duration": 8, // hours/days/months
  "totalAmount": 400000,
  "currency": "IDR",
  
  // Order status and workflow
  "status": "confirmed", // pending | confirmed | completed | cancelled
  "paymentStatus": "paid", // pending | paid | failed | refunded
  "paymentMethod": "bank_transfer",
  
  // Metadata
  "createdAt": "2023-12-20T10:30:00.000Z",
  "updatedAt": "2023-12-20T10:30:00.000Z",
  "notes": "Need projector setup"
}
```

---

## 🛠 **SERVICES Collection**

### Schema Structure
```javascript
{
  "serviceId": "SRV1703123456789",
  "name": "Projector Rental",
  "description": "High-quality projector with wireless connectivity",
  "category": "equipment", // equipment | catering | support
  "price": 100000,
  "currency": "IDR",
  "unit": "day", // hour | day | session
  "isActive": true,
  "createdAt": "2023-12-20T10:30:00.000Z",
  "updatedAt": "2023-12-20T10:30:00.000Z"
}
```

---

## 🎯 **AMENITIES Collection**

### Schema Structure  
```javascript
{
  "amenityId": "AMN1703123456789",
  "name": "High-Speed WiFi",
  "description": "Reliable internet connection up to 100 Mbps",
  "icon": "wifi", // Icon identifier
  "category": "connectivity", // connectivity | facilities | services
  "isActive": true,
  "createdAt": "2023-12-20T10:30:00.000Z",
  "updatedAt": "2023-12-20T10:30:00.000Z"
}
```

---

## 🔄 **Auto-Create Cities Feature**

### How It Works:
1. **User creates space** with Google Maps location selection
2. **System extracts** city, province, country from Google Maps
3. **System checks** if city exists in database:
   - If exists → Use existing city
   - If not exists → Auto-create new city
4. **New city created** with minimal essential data only
5. **City statistics updated** automatically

### Benefits:
- ✅ **Zero manual city setup** required
- ✅ **Accurate location data** from Google Maps
- ✅ **Simplified city management** 
- ✅ **Automatic data consistency**
- ✅ **Reduced user workload**

---

## 📊 **Database Relationships**

```
SPACES ──┐
         ├──→ CITIES (city name reference)
         └──→ AMENITIES (array of amenity IDs)

ORDERS ──→ SPACES (spaceId reference)

SERVICES ←──→ ORDERS (optional services)
```

---

## 🎯 **Key Design Principles**

1. **Simplicity First**: Remove unnecessary complexity
2. **Auto-Generation**: Minimize manual data entry  
3. **Google Maps Integration**: Leverage accurate location data
4. **Essential Data Only**: Focus on business-critical fields
5. **Future-Proof**: Extensible structure for growth 