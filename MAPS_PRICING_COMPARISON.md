# Maps Pricing Comparison: Google Maps vs Mapbox

## 📋 Overview
This document provides a detailed comparison between Google Maps Platform and Mapbox for UnionSpace CRM implementation across mobile apps and web admin interface.

---

## 🗺️ Google Maps Platform

### **Web Admin Interface**

#### Required SKUs:
| Service | SKU | Use Case | Pricing | Free Tier |
|---------|-----|----------|---------|-----------|
| Maps JavaScript API | `maps-js-api` | Interactive map display | $7 per 1,000 loads | 28,000 loads/month |
| Places API (New) | `places-api-new` | Location search & autocomplete | $17 per 1,000 requests | Included in $200 credit |
| Geocoding API | `geocoding-api` | Address to coordinates conversion | $5 per 1,000 requests | Included in $200 credit |
| Elevation API | `elevation-api` | Elevation data (optional) | $5 per 1,000 requests | Included in $200 credit |
| Time Zone API | `timezone-api` | Timezone info (optional) | $5 per 1,000 requests | Included in $200 credit |

### **Mobile Apps**

#### Android App SKUs:
| Service | SKU | Use Case | Pricing | Free Tier |
|---------|-----|----------|---------|-----------|
| Maps SDK for Android | `maps-android-sdk` | Native map display | $7 per 1,000 loads | 28,000 loads/month |
| Places SDK for Android | `places-android-sdk` | Location search & autocomplete | $17 per 1,000 requests | Included in $200 credit |
| Geocoding API | `geocoding-api` | Address conversion | $5 per 1,000 requests | Included in $200 credit |

#### iOS App SKUs:
| Service | SKU | Use Case | Pricing | Free Tier |
|---------|-----|----------|---------|-----------|
| Maps SDK for iOS | `maps-ios-sdk` | Native map display | $7 per 1,000 loads | 28,000 loads/month |
| Places SDK for iOS | `places-ios-sdk` | Location search & autocomplete | $17 per 1,000 requests | Included in $200 credit |
| Geocoding API | `geocoding-api` | Address conversion | $5 per 1,000 requests | Included in $200 credit |

### **Google Maps - Cost Scenarios**

#### Scenario 1: Light Usage (Small Business)
```
Monthly Usage:
- Web Admin: 500 map loads + 200 API calls
- Android: 2,000 map loads + 300 API calls  
- iOS: 1,500 map loads + 250 API calls

Costs:
- Maps loads: (500 + 2,000 + 1,500) × $7/1,000 = $28
- API calls: (200 + 300 + 250) × $17/1,000 = $12.75
- Geocoding: 100 × $5/1,000 = $0.50

Monthly Total: $41.25
Less Free Credit: -$200
Actual Cost: $0 (covered by free tier)
```

#### Scenario 2: Medium Usage (Growing Business)
```
Monthly Usage:
- Web Admin: 2,000 map loads + 800 API calls
- Android: 8,000 map loads + 1,200 API calls
- iOS: 6,000 map loads + 900 API calls

Costs:
- Maps loads: (2,000 + 8,000 + 6,000) × $7/1,000 = $112
- API calls: (800 + 1,200 + 900) × $17/1,000 = $49.30
- Geocoding: 500 × $5/1,000 = $2.50

Monthly Total: $163.80
Less Free Credit: -$200
Actual Cost: $0 (still covered)
```

#### Scenario 3: High Usage (Enterprise)
```
Monthly Usage:
- Web Admin: 5,000 map loads + 2,000 API calls
- Android: 25,000 map loads + 4,000 API calls
- iOS: 20,000 map loads + 3,500 API calls

Costs:
- Maps loads: (5,000 + 25,000 + 20,000) × $7/1,000 = $350
- API calls: (2,000 + 4,000 + 3,500) × $17/1,000 = $161.50
- Geocoding: 1,500 × $5/1,000 = $7.50

Monthly Total: $519
Less Free Credit: -$200
Actual Cost: $319/month
```

---

## 🗺️ Mapbox

### **Web Admin Interface**

#### Required Services:
| Service | Use Case | Pricing | Free Tier |
|---------|----------|---------|-----------|
| Maps SDK for Web | Interactive map display | $5 per 1,000 loads | 50,000 loads/month |
| Geocoding API | Search & autocomplete | $5 per 1,000 requests | 100,000 requests/month |
| Directions API | Navigation (optional) | $5 per 1,000 requests | 100,000 requests/month |
| Static Images API | Map thumbnails | $2 per 1,000 requests | 100,000 requests/month |

### **Mobile Apps**

#### Android & iOS SDKs:
| Service | Use Case | Pricing | Free Tier |
|---------|----------|---------|-----------|
| Maps SDK for Android | Native map display | $5 per 1,000 loads | 50,000 loads/month |
| Maps SDK for iOS | Native map display | $5 per 1,000 loads | 50,000 loads/month |
| Search API | Location search | $5 per 1,000 requests | 100,000 requests/month |
| Navigation SDK | Turn-by-turn navigation | $10 per 1,000 requests | 1,000 requests/month |

### **Mapbox - Cost Scenarios**

#### Scenario 1: Light Usage
```
Monthly Usage:
- Web Admin: 500 map loads + 200 API calls
- Android: 2,000 map loads + 300 API calls
- iOS: 1,500 map loads + 250 API calls

Costs:
- Maps loads: (500 + 2,000 + 1,500) × $5/1,000 = $20
- API calls: (200 + 300 + 250) × $5/1,000 = $3.75

Monthly Total: $23.75
Less Free Tier: All covered
Actual Cost: $0
```

#### Scenario 2: Medium Usage
```
Monthly Usage:
- Web Admin: 2,000 map loads + 800 API calls
- Android: 8,000 map loads + 1,200 API calls
- iOS: 6,000 map loads + 900 API calls

Costs:
- Maps loads: (2,000 + 8,000 + 6,000) × $5/1,000 = $80
- API calls: (800 + 1,200 + 900) × $5/1,000 = $14.50

Monthly Total: $94.50
Less Free Tier: All covered
Actual Cost: $0
```

#### Scenario 3: High Usage
```
Monthly Usage:
- Web Admin: 5,000 map loads + 2,000 API calls
- Android: 25,000 map loads + 4,000 API calls
- iOS: 20,000 map loads + 3,500 API calls

Costs:
- Maps loads: (5,000 + 25,000 + 20,000) × $5/1,000 = $250
- API calls: (2,000 + 4,000 + 3,500) × $5/1,000 = $47.50

Monthly Total: $297.50
Less Free Tier: -$250 (50k loads) - $500 (100k API calls)
Actual Cost: $47.50/month
```

---

## 📊 Direct Comparison

### **Pricing per 1,000 Requests**
| Service | Google Maps | Mapbox | Difference |
|---------|-------------|---------|------------|
| Map Loads | $7 | $5 | Google 40% more expensive |
| Search/Places API | $17 | $5 | Google 240% more expensive |
| Geocoding | $5 | $5 | Same price |
| Navigation | $5 | $10 | Mapbox 100% more expensive |

### **Free Tiers Comparison**
| Service | Google Maps | Mapbox | Winner |
|---------|-------------|---------|---------|
| Map Loads | 28,000/month | 50,000/month | Mapbox |
| API Credit | $200/month | 100,000 requests/month | Mapbox |
| Total Value | ~$200 | ~$750 | Mapbox |

### **Cost Summary by Usage Level**

| Usage Level | Google Maps | Mapbox | Savings with Mapbox |
|-------------|-------------|---------|-------------------|
| Light | $0 (free) | $0 (free) | $0 |
| Medium | $0 (free) | $0 (free) | $0 |
| High | $319/month | $47.50/month | $271.50/month (85% savings) |

---

## 🎯 Recommendations

### **For UnionSpace CRM:**

#### **Phase 1: Start with Mapbox** ✅
**Reasons:**
- 85% cost savings at scale
- Better free tier coverage
- Sufficient features for our use case
- Easier integration

#### **Phase 2: Consider Google Maps if needed**
**Only if you need:**
- Superior Places API quality in Indonesia
- Advanced features like Street View
- Better business listings integration

### **Implementation Strategy:**

#### **Immediate (Web Admin):**
```javascript
// Start with Mapbox
- Maps SDK for Web
- Geocoding API
- Search API
```

#### **Next (Mobile Apps):**
```javascript
// Continue with Mapbox
- Maps SDK for Android
- Maps SDK for iOS  
- Unified API backend
```

#### **Future (If needed):**
```javascript
// Hybrid approach
- Mapbox for map display (cheaper)
- Google Places API for search quality
- Backend caching to reduce API calls
```

---

## 🔧 Implementation Notes

### **API Keys Management:**
```
Production Setup:
├── Mapbox Account
│   ├── Web Restricted Key (admin.unionspace.com)
│   ├── Android Key (package: com.unionspace.crm)
│   └── iOS Key (bundle: com.unionspace.crm)
└── Google Account (backup/hybrid)
    ├── Web Key (restricted to domains)
    ├── Android Key
    └── iOS Key
```

### **Security Best Practices:**
- Restrict API keys by platform/domain
- Implement usage quotas
- Monitor usage regularly
- Cache geocoding results in database

### **Cost Optimization:**
- Implement backend geocoding cache
- Use static maps for thumbnails
- Batch API requests when possible
- Monitor and set usage alerts

---

## 📈 Monthly Cost Projection (Year 1)

| Month | Usage Level | Google Maps Cost | Mapbox Cost | Savings |
|-------|-------------|------------------|-------------|---------|
| 1-3 | Light | $0 | $0 | $0 |
| 4-6 | Medium | $0 | $0 | $0 |
| 7-9 | Medium-High | $150 | $0 | $150 |
| 10-12 | High | $319 | $47.50 | $271.50 |

**Total Year 1 Savings with Mapbox: ~$2,500**

---

## 🚀 Next Steps

1. **Setup Mapbox account** and create project
2. **Implement basic maps** in SpaceModal (web admin)
3. **Test geocoding accuracy** for Indonesian addresses
4. **Evaluate user experience** vs Google Maps
5. **Scale to mobile apps** using same Mapbox account
6. **Consider hybrid approach** if needed later

---

*Last updated: January 2025*
*For questions: Contact development team* 