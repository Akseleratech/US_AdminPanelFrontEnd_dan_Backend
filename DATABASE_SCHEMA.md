# Database Schema Documentation - Spaces System

Dokumentasi lengkap struktur database untuk sistem Spaces dalam UnionSpace CRM.

## 🏗️ **Spaces Collection Schema**

### **Collection**: `spaces`

```javascript
{
  // Primary Identifiers
  "spaceId": "space_1703123456789_abc123def", // Unique space identifier
  "id": "auto_generated_firestore_id", // Firestore document ID
  "slug": "nextspace-coworking-jakarta-central", // URL-friendly identifier
  
  // Basic Information
  "name": "NextSpace Coworking Jakarta Central", // Required, 2-100 chars
  "description": "Modern co-working space in the heart of Jakarta with premium amenities", // Max 1000 chars
  "brand": "NextSpace", // Required, enum: ["NextSpace", "UnionSpace", "CoSpace"]
  "category": "co-working", // Required, enum: ["co-working", "meeting-room", "private-office", "event-space", "phone-booth"]
  "spaceType": "open-space", // Required, enum: ["open-space", "private-room", "meeting-room", "event-hall", "phone-booth"]
  "capacity": 50, // Required, number 1-1000
  
  // Location Information (Enhanced with Google Maps)
  "location": {
    "address": "Jl. Sudirman No. 123, Jakarta Pusat", // Required, min 5 chars
    "city": "Jakarta", // Required, min 2 chars
    "province": "DKI Jakarta", // Required, min 2 chars
    "postalCode": "10220", // Optional, 5 digits
    "country": "Indonesia", // Required, default "Indonesia"
    
    // Google Maps Integration
    "coordinates": {
      "lat": -6.2088,
      "lng": 106.8456
    },
    "latitude": -6.2088, // Range: -90 to 90
    "longitude": 106.8456 // Range: -180 to 180
  },
  
  // Pricing Structure
  "pricing": {
    "hourly": 50000, // Optional, min 0
    "daily": 300000, // Optional, min 0
    "monthly": 2000000, // Optional, min 0
    "currency": "IDR" // Required, enum: ["IDR", "USD"]
  },
  
  // Amenities (Database-backed)
  "amenities": [
    "659abc123def456ghi", // Amenity document IDs from amenities collection
    "659abc123def456hij",
    "659abc123def456klm"
  ],
  
  // Operational Information
  "isActive": true, // Boolean, default true
  "operatingHours": {
    "monday": { "open": "08:00", "close": "22:00" },
    "tuesday": { "open": "08:00", "close": "22:00" },
    "wednesday": { "open": "08:00", "close": "22:00" },
    "thursday": { "open": "08:00", "close": "22:00" },
    "friday": { "open": "08:00", "close": "22:00" },
    "saturday": { "open": "09:00", "close": "18:00" },
    "sunday": { "open": "09:00", "close": "18:00" }
  },
  
  // Media Assets
  "images": [
    "https://storage.googleapis.com/bucket/space_1_main.jpg",
    "https://storage.googleapis.com/bucket/space_1_lounge.jpg",
    "https://storage.googleapis.com/bucket/space_1_meeting.jpg"
  ],
  "thumbnail": "https://storage.googleapis.com/bucket/space_1_thumb.jpg",
  
  // SEO & Search Optimization
  "searchKeywords": [
    "nextspace", "coworking", "jakarta", "central", "modern", "wifi", "meeting-room"
  ],
  "priceRange": "IDR 50,000 - 2,000,000", // Computed field
  "hasCoordinates": true, // Computed field
  
  // Versioning & Metadata
  "version": 3, // Incremented on each update
  "createdAt": "2024-01-15T10:00:00.000Z", // Timestamp
  "updatedAt": "2024-01-20T14:30:00.000Z", // Timestamp
  "createdBy": "admin_user_id", // User who created
  "updatedBy": "admin_user_id" // User who last updated
}
```

## 🔗 **Related Collections**

### **1. Amenities Collection** (`amenities`)
```javascript
{
  "id": "659abc123def456ghi",
  "name": "High-Speed WiFi",
  "description": "Fiber optic internet connection up to 1Gbps",
  "category": "technology",
  "type": "common",
  "icon": "wifi",
  "isActive": true,
  "createdAt": "2024-01-15T10:00:00.000Z"
}
```

### **2. Cities Collection** (`cities`)
```javascript
{
  "id": "JKT001",
  "name": "Jakarta",
  "province": "DKI Jakarta",
  "statistics": {
    "totalSpaces": 45, // Auto-updated when spaces added/removed
    "activeSpaces": 42
  },
  "isActive": true
}
```

### **3. Orders Collection** (`orders`)
```javascript
{
  "id": "order_123",
  "spaceId": "space_1703123456789_abc123def", // Reference to spaces
  "status": "confirmed", // ["pending", "confirmed", "active", "completed", "cancelled"]
  "customerId": "customer_456",
  "bookingDate": "2024-02-01",
  "createdAt": "2024-01-15T10:00:00.000Z"
}
```

## 🔍 **Database Indexes (Recommended)**

### **Primary Indexes**
```javascript
// Composite indexes for common queries
db.spaces.createIndex({ "isActive": 1, "location.city": 1, "createdAt": -1 });
db.spaces.createIndex({ "brand": 1, "category": 1, "isActive": 1 });
db.spaces.createIndex({ "location.city": 1, "spaceType": 1, "capacity": 1 });
db.spaces.createIndex({ "searchKeywords": 1, "isActive": 1 });

// Single field indexes
db.spaces.createIndex({ "spaceId": 1 }); // Unique
db.spaces.createIndex({ "slug": 1 }); // Unique
db.spaces.createIndex({ "createdAt": -1 });
db.spaces.createIndex({ "updatedAt": -1 });
```

### **GeoSpatial Index**
```javascript
// For location-based queries
db.spaces.createIndex({ "location.coordinates": "2dsphere" });
```

## ✅ **Data Validation Rules**

### **Required Fields**
- `name` (2-100 characters)
- `brand` (enum validation)
- `category` (enum validation) 
- `spaceType` (enum validation)
- `capacity` (1-1000)
- `location.address` (min 5 characters)
- `location.city` (min 2 characters)
- `location.province` (min 2 characters)
- `pricing` (with currency and at least one price)

### **Business Rules**
1. **Unique Names**: No duplicate space names in same city
2. **City Validation**: City must exist in cities collection
3. **Coordinate Validation**: Lat/Lng must be valid ranges
4. **Pricing Logic**: At least one pricing option required
5. **Deletion Rules**: Cannot delete spaces with active bookings

### **Data Sanitization**
- Trim whitespace from strings
- Parse numbers correctly
- Validate enum values
- Clean array data

## 🚀 **Performance Optimizations**

### **Query Optimization**
1. **Compound Indexes**: Support multi-field queries
2. **Pagination**: Max 100 items per page
3. **Field Selection**: Return only needed fields
4. **Caching**: Cache frequently accessed data

### **Search Optimization**
1. **Search Keywords**: Pre-computed for fast text search
2. **Slug Generation**: SEO-friendly URLs
3. **Computed Fields**: Price ranges, coordinate flags

### **City Statistics Auto-Update**
- Automatically update city space counts
- Maintain data consistency across collections

## 🔐 **Security & Access Control**

### **Data Validation**
- Input sanitization on all fields
- SQL injection prevention
- XSS protection

### **Business Logic Validation**
- Duplicate checking
- Referential integrity
- Business rule enforcement

### **Error Handling**
- Development vs production error messages
- Comprehensive logging
- Graceful failure handling

## 📊 **Analytics & Reporting**

### **Computed Fields**
- `priceRange`: Human-readable price display
- `hasCoordinates`: Location mapping capability
- `slug`: SEO optimization

### **Metrics Tracking**
- Version control for changes
- Creation/update timestamps
- User attribution

### **City-Level Statistics**
- Total spaces per city
- Active spaces per city
- Real-time updates

## 🔄 **Data Migration & Versioning**

### **Schema Versioning**
- `version` field tracks schema changes
- Backward compatibility maintained
- Migration scripts for updates

### **Legacy Data Handling**
- Support for older schema versions
- Graceful field additions
- Data transformation utilities

## 🧪 **Testing & Quality Assurance**

### **Unit Tests**
- Validation function testing
- Business logic verification
- Error handling validation

### **Integration Tests**
- Full CRUD operation testing
- Cross-collection consistency
- Performance benchmarking

### **Data Quality Checks**
- Regular validation runs
- Orphaned data detection
- Consistency verification

---

## 📋 **API Endpoints Summary**

| Method | Endpoint | Description | Validation |
|--------|----------|-------------|------------|
| GET | `/api/spaces` | List spaces with filtering | Query param validation |
| GET | `/api/spaces/:id` | Get single space | ID format validation |
| POST | `/api/spaces` | Create new space | Full schema validation |
| PUT | `/api/spaces/:id` | Update space | Partial schema validation |
| DELETE | `/api/spaces/:id` | Delete space | Business rule validation |
| PATCH | `/api/spaces/:id/toggle-status` | Toggle active status | Status validation |

**🎯 Database sekarang jauh lebih kuat dengan validation, business rules, dan performance optimization yang komprehensif!** 