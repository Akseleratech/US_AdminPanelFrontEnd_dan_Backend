# Google Maps Integration Setup

Panduan lengkap untuk mengintegrasikan Google Maps ke dalam UnionSpace CRM.

## 🗺️ Fitur Google Maps

### **Space Modal Integration**
- **Interactive Map**: Click atau drag marker untuk set lokasi
- **Current Location**: Tombol untuk detect lokasi saat ini
- **Geocoding**: Otomatis konversi koordinat ke alamat
- **Real-time Updates**: Koordinat tersimpan otomatis
- ~~**Search Box**: Cari lokasi dengan Google Places API~~ ❌ **DISABLED** untuk menghemat biaya

### **Database Storage**
- `latitude` dan `longitude` tersimpan di Firebase
- `coordinates` object untuk format Google Maps
- `address` hasil reverse geocoding

## 🚀 Setup Google Maps API Key

### **Langkah 1: Buat Google Cloud Project**

1. Kunjungi [Google Cloud Console](https://console.cloud.google.com/)
2. Buat project baru atau pilih existing project
3. Enable Google Maps JavaScript API:
   - Navigation menu → APIs & Services → Library
   - Search "Maps JavaScript API"
   - Klik dan enable API

### **Langkah 2: Enable Required APIs**

Enable APIs berikut di Google Cloud Console:

```bash
✅ Maps JavaScript API          # Untuk menampilkan map
❌ Places API                   # DISABLED - Tidak digunakan (menghemat biaya)
✅ Geocoding API               # Untuk konversi koordinat ↔ alamat
```

### **Langkah 3: Buat API Key**

1. Navigation menu → APIs & Services → Credentials
2. Klik "Create Credentials" → API Key
3. Copy API key yang dihasilkan

### **Langkah 4: Restrict API Key (Keamanan)**

**Application Restrictions:**
- HTTP referrers (web sites)
- Add authorized domains:
  ```
  localhost:5173/*
  your-domain.com/*
  ```

**API Restrictions:**
- Restrict key to specific APIs:
  - Maps JavaScript API
  - Geocoding API
  - ~~Places API~~ ❌ **Tidak perlu** (tidak digunakan)

## ⚙️ Konfigurasi Environment

### **Frontend (.env)**

Tambahkan ke file `.env` di folder `frontend/`:

```bash
# Google Maps Configuration
VITE_GOOGLE_MAPS_API_KEY=your_google_maps_api_key_here
```

### **Environment Variables Example**

```bash
# Firebase Configuration
VITE_FIREBASE_API_KEY=your_firebase_api_key_here
VITE_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
VITE_FIREBASE_APP_ID=your_app_id

# Google Maps Configuration
VITE_GOOGLE_MAPS_API_KEY=AIzaSyBxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

## 🎯 Cara Menggunakan

### **1. Membuka Map Modal**
1. Buka Space Modal (Add/Edit Space)
2. Section "Location & Pricing"
3. Klik button "Set Location on Map"

### **2. Setting Lokasi**
- **Click pada map**: Set marker di lokasi yang diklik
- **Drag marker**: Geser marker ke posisi yang diinginkan
- **Current location**: Klik tombol 📍 untuk detect lokasi saat ini
- ~~**Search box**: Ketik nama tempat dan pilih dari hasil~~ ❌ **DISABLED**

### **3. Hasil**
- Koordinat (latitude, longitude) otomatis tersimpan
- Address otomatis ter-update dari reverse geocoding
- Visual indicator menampilkan koordinat yang tersimpan

## 🏗️ Struktur Database

### **Spaces Collection**

```javascript
{
  // ... existing fields
  location: {
    address: "Jl. Sudirman No. 123, Jakarta Pusat",
    city: "Jakarta",
    province: "DKI Jakarta", 
    postalCode: "10220",
    country: "Indonesia",
    
    // Google Maps Integration
    coordinates: {
      lat: -6.2088,
      lng: 106.8456
    },
    latitude: -6.2088,
    longitude: 106.8456
  }
}
```

## 🔧 Komponen yang Dibuat

### **GoogleMap.jsx**
- Reusable map component
- Props: `coordinates`, `onLocationSelect`, `height`, `zoom`
- Features: search, current location, click/drag marker

### **SpaceModal.jsx Updates**
- Import GoogleMap component
- Map modal integration
- State management untuk coordinates
- Location handling functions

## 💰 Pricing Considerations

### **Google Maps API Pricing (Monthly) - OPTIMIZED**

| Usage Level | Map Loads | ~~Places API~~ | Geocoding | Total Est. |
|-------------|-----------|------------|-----------|------------|
| **Development** | $0 (28K free) | ~~$0 (2.8K free)~~ ❌ | $0 (40K free) | **$0** |
| **Small Scale** | $7 (100K loads) | ~~$17 (10K searches)~~ ❌ | $5 (10K requests) | **$12** ✅ |
| **Medium Scale** | $35 (500K loads) | ~~$85 (50K searches)~~ ❌ | $25 (50K requests) | **$60** ✅ |

### **💰 Cost Savings dengan Disable Places API**
- **Small Scale**: $29 → **$12** (hemat **$17/bulan** atau **58%**)
- **Medium Scale**: $145 → **$60** (hemat **$85/bulan** atau **58%**)

### **Free Tier Limits (Per Month)**
- Map Loads: 28,000 free
- ~~Places API: 2,800 free searches~~ ❌ **Tidak digunakan**
- Geocoding: 40,000 free requests

### **Tips Menghemat Cost**
1. **Disable Places API** ✅ **DONE** - hemat 58% biaya!
2. **Cache results**: Simpan hasil geocoding
3. **Optimize usage**: Load map hanya saat diperlukan
4. **Monitor usage**: Set alerts di Google Cloud Console

## 🚨 Troubleshooting

### **Error: API Key Not Configured**
```bash
# Pastikan environment variable set dengan benar
VITE_GOOGLE_MAPS_API_KEY=your_actual_api_key
```

### **Error: Failed to Load Google Maps**
1. Cek API key valid
2. Pastikan APIs sudah di-enable
3. Cek internet connection
4. Verify domain restrictions

### **⚠️ Console Errors (FIXED)**
**❌ "Google Maps JavaScript API has been loaded directly without loading=async"**
- **Fixed**: Added `&loading=async` parameter to script URL
- **Fixed**: Proper script deduplication and loading management

**❌ "Element with name 'gmp-xxx' already defined"**
- **Fixed**: Global loading flags prevent multiple script loads
- **Fixed**: Script existence check before creating new ones

**❌ "Google Maps JavaScript API multiple times on this page"**
- **Fixed**: Promise-based loading system ensures single load
- **Fixed**: Proper cleanup and script management

**❌ "google.maps.Marker is deprecated"**
- **Status**: Known deprecation warning (non-breaking)
- **Future**: Will migrate to AdvancedMarkerElement
- **Current**: Still working, no action needed

**❌ "Cannot read properties of undefined"**
- **Fixed**: Proper Google Maps API loading checks
- **Fixed**: Error handling for undefined objects

### ~~**Error: Places Search Not Working**~~ ❌ **N/A**
~~1. Enable Places API di Google Cloud~~
~~2. Add Places API ke API restrictions~~
~~3. Cek quota limits~~
**Places API disabled untuk menghemat biaya**

### **Error: Geocoding Failed**
1. Enable Geocoding API
2. Cek coordinate format valid
3. Verify API permissions

### **Performance Improvements Applied**
✅ **Script Loading Optimization**
- Single script load per session
- Proper async/defer attributes
- Promise-based coordination
- Deduplication checks

✅ **Error Prevention**
- Global loading state management
- Existing script detection
- Proper error handling
- Component cleanup

## 🔗 Links Penting

- [Google Maps JavaScript API Docs](https://developers.google.com/maps/documentation/javascript)
- [Places API Documentation](https://developers.google.com/maps/documentation/places/web-service)
- [Geocoding API Docs](https://developers.google.com/maps/documentation/geocoding)
- [Google Cloud Console](https://console.cloud.google.com/)
- [API Pricing Calculator](https://mapsplatform.google.com/pricing/)

## ✅ Checklist Setup

- [ ] Google Cloud Project created
- [ ] Maps JavaScript API enabled
- [ ] Places API enabled  
- [ ] Geocoding API enabled
- [ ] API Key created and restricted
- [ ] Environment variable VITE_GOOGLE_MAPS_API_KEY set
- [ ] Domain restrictions configured
- [ ] Test map functionality in Space Modal

---

**🎉 Setelah setup selesai, Anda bisa menggunakan Google Maps untuk set lokasi space dengan mudah!** 