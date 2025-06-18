# Firebase Setup Guide - UnionSpace CRM

Panduan lengkap untuk menghubungkan project UnionSpace CRM dengan Firebase.

## Prerequisites

1. Akun Google/Firebase
2. Node.js terinstall
3. Project UnionSpace CRM sudah di-clone

## Langkah 1: Setup Firebase Project

### 1.1 Buat Firebase Project
1. Kunjungi [Firebase Console](https://console.firebase.google.com/)
2. Klik "Create a project" atau "Add project"
3. Masukkan nama project: `unionspace-crm`
4. Aktifkan Google Analytics (opsional)
5. Klik "Create project"

### 1.2 Setup Authentication
1. Di Firebase Console, pilih project Anda
2. Klik "Authentication" di sidebar kiri
3. Klik tab "Sign-in method"
4. Aktifkan "Email/Password"
5. Klik "Save"

### 1.3 Setup Firestore Database
1. Klik "Firestore Database" di sidebar
2. Klik "Create database"
3. Pilih "Start in test mode" (untuk development)
4. Pilih lokasi server (pilih yang terdekat dengan Indonesia, misal: asia-southeast1)
5. Klik "Done"

### 1.4 Setup Web App
1. Di Project Overview, klik ikon web (`</>`)
2. Masukkan app nickname: `unionspace-crm-web`
3. Centang "Also set up Firebase Hosting" (opsional)
4. Klik "Register app"
5. **SIMPAN** konfigurasi Firebase yang ditampilkan (akan digunakan di langkah berikutnya)

### 1.5 Generate Service Account Key (untuk Backend)
1. Klik ikon gear (⚙️) di sidebar → "Project settings"
2. Klik tab "Service accounts"
3. Klik "Generate new private key"
4. Klik "Generate key"
5. **SIMPAN** file JSON yang didownload dengan aman

## Langkah 2: Konfigurasi Environment Variables

### 2.1 Frontend Environment (.env)
Buat atau edit file `frontend/.env`:

```env
# Firebase Configuration
VITE_FIREBASE_API_KEY=your_api_key_here
VITE_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id_here
VITE_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id_here
VITE_FIREBASE_APP_ID=your_app_id_here

# Optional - hanya jika menggunakan Google Analytics
VITE_FIREBASE_MEASUREMENT_ID=your_measurement_id_here
```

**Cara mendapatkan nilai-nilai ini:**
- Dari konfigurasi web app yang Anda simpan di langkah 1.4
- Contoh:
  ```javascript
  const firebaseConfig = {
    apiKey: "AIzaSyC...", // ← VITE_FIREBASE_API_KEY
    authDomain: "unionspace-crm.firebaseapp.com", // ← VITE_FIREBASE_AUTH_DOMAIN
    projectId: "unionspace-crm", // ← VITE_FIREBASE_PROJECT_ID
    storageBucket: "unionspace-crm.appspot.com", // ← VITE_FIREBASE_STORAGE_BUCKET
    messagingSenderId: "123456789", // ← VITE_FIREBASE_MESSAGING_SENDER_ID
    appId: "1:123456789:web:abcdef", // ← VITE_FIREBASE_APP_ID
    measurementId: "G-XXXXXXXXXX" // ← VITE_FIREBASE_MEASUREMENT_ID (optional)
  };
  ```

**📝 Note tentang Measurement ID:**
- `measurementId` **TIDAK WAJIB** dan hanya muncul jika Anda mengaktifkan Google Analytics
- Jika saat setup Firebase project Anda **tidak mengaktifkan Analytics**, maka `measurementId` tidak akan ada
- CRM tetap bisa berjalan normal tanpa `measurementId`
- Jika ada, copy nilai `measurementId` ke `VITE_FIREBASE_MEASUREMENT_ID`
- Jika tidak ada, **skip variable ini** dan jangan masukkan ke `.env`

### 2.2 Backend Environment (.env)
Buat atau edit file `backend/.env`:

```env
# Firebase Admin Configuration
FIREBASE_PROJECT_ID=your_project_id_here
FIREBASE_PRIVATE_KEY_ID=your_private_key_id_here
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nyour_private_key_here\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@your_project_id.iam.gserviceaccount.com
FIREBASE_CLIENT_ID=your_client_id_here
FIREBASE_AUTH_URI=https://accounts.google.com/o/oauth2/auth
FIREBASE_TOKEN_URI=https://oauth2.googleapis.com/token
FIREBASE_AUTH_PROVIDER_X509_CERT_URL=https://www.googleapis.com/oauth2/v1/certs
FIREBASE_CLIENT_X509_CERT_URL=https://www.googleapis.com/robot/v1/metadata/x509/firebase-adminsdk-xxxxx%40your_project_id.iam.gserviceaccount.com

# Server Configuration
PORT=5000
```

**Cara mendapatkan nilai-nilai ini:**
- Dari file JSON service account yang Anda download di langkah 1.5
- Buka file JSON dan copy nilai-nilai berikut:
  ```json
  {
    "type": "service_account",
    "project_id": "...", // ← FIREBASE_PROJECT_ID
    "private_key_id": "...", // ← FIREBASE_PRIVATE_KEY_ID
    "private_key": "-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n", // ← FIREBASE_PRIVATE_KEY
    "client_email": "...", // ← FIREBASE_CLIENT_EMAIL
    "client_id": "...", // ← FIREBASE_CLIENT_ID
    "auth_uri": "...", // ← FIREBASE_AUTH_URI
    "token_uri": "...", // ← FIREBASE_TOKEN_URI
    "auth_provider_x509_cert_url": "...", // ← FIREBASE_AUTH_PROVIDER_X509_CERT_URL
    "client_x509_cert_url": "..." // ← FIREBASE_CLIENT_X509_CERT_URL
  }
  ```

## Langkah 3: Setup Firestore Collections

### 3.1 Buat Collections di Firestore
1. Buka Firebase Console → Firestore Database
2. Klik "Start collection"
3. Buat collections berikut:

#### Collection: `orders`
```javascript
// Example document
{
  id: "order_001",
  customer: "John Doe",
  service: "Coworking Space",
  location: "Jakarta",
  status: "completed",
  amount: 500000,
  date: "2024-01-15",
  createdAt: "2024-01-15T10:00:00.000Z",
  updatedAt: "2024-01-15T10:00:00.000Z"
}
```

#### Collection: `services`
```javascript
// Example document
{
  id: "service_001",
  name: "Coworking Space",
  description: "Flexible workspace solution",
  price: 100000,
  category: "workspace",
  available: true,
  createdAt: "2024-01-15T10:00:00.000Z",
  updatedAt: "2024-01-15T10:00:00.000Z"
}
```

#### Collection: `spaces`
```javascript
// Example document
{
  id: "space_001",
  name: "Downtown Office",
  address: "Jl. Sudirman No. 123, Jakarta",
  capacity: 50,
  amenities: ["WiFi", "AC", "Projector"],
  available: true,
  pricePerHour: 50000,
  createdAt: "2024-01-15T10:00:00.000Z",
  updatedAt: "2024-01-15T10:00:00.000Z"
}
```

#### Collection: `cities`
```javascript
// Example document
{
  id: "city_001",
  name: "Jakarta",
  province: "DKI Jakarta",
  country: "Indonesia",
  active: true,
  createdAt: "2024-01-15T10:00:00.000Z",
  updatedAt: "2024-01-15T10:00:00.000Z"
}
```

## Langkah 4: Install Dependencies & Run Project

### 4.1 Install Dependencies
```bash
# Install root dependencies
npm install

# Install all dependencies (frontend + backend)
npm run install-all
```

### 4.2 Run Development Server
```bash
# Run both frontend and backend concurrently
npm run dev

# Atau jalankan secara terpisah:
# Terminal 1 - Backend
npm run server

# Terminal 2 - Frontend
npm run client
```

## Langkah 5: Test Firebase Integration

### 5.1 Test Authentication
1. Buka aplikasi di browser (`http://localhost:3000`)
2. Jika ada komponen login, coba buat akun baru atau login
3. Check Firebase Console → Authentication untuk melihat user yang terdaftar

### 5.2 Test Firestore Operations
1. Coba create, read, update, delete data melalui aplikasi
2. Check Firebase Console → Firestore untuk melihat perubahan data

### 5.3 Test API Endpoints
```bash
# Test orders endpoint
curl http://localhost:5000/api/orders

# Test dengan authentication (jika diperlukan)
curl -H "Authorization: Bearer YOUR_ID_TOKEN" http://localhost:5000/api/orders
```

## Struktur File yang Sudah Dibuat

```
frontend/
├── src/
│   ├── config/
│   │   └── firebase.js           # Firebase config untuk frontend
│   ├── services/
│   │   ├── api.js                # API service dengan auth integration
│   │   └── firebaseService.js    # Firebase operations untuk frontend
│   └── components/
│       └── auth/
│           ├── AuthContext.js    # React Context untuk authentication
│           └── Login.js          # Login component
└── .env                          # Environment variables untuk frontend

backend/
├── config/
│   └── firebase.js               # Firebase Admin config
├── services/
│   └── firebaseService.js        # Firebase operations untuk backend
├── middleware/
│   └── auth.js                   # Authentication middleware
├── routes/
│   └── orders.js                 # Updated orders route dengan Firebase
└── .env                          # Environment variables untuk backend
```

## Troubleshooting

### Error: "Default app already exists"
- Solution: Restart development server

### Error: "Permission denied"
- Check Firestore security rules
- For development, you can use:
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if true; // WARNING: Only for development!
    }
  }
}
```

### Error: "Invalid credentials"
- Double-check environment variables
- Ensure .env files are properly configured
- Restart development server after changing .env

### Error: "Network error"
- Check if Firebase project is active
- Verify project ID in configuration
- Check internet connection

## Security Notes

1. **Jangan commit file .env ke Git!**
2. Untuk production, gunakan proper Firestore security rules
3. Limit API access dengan proper authentication
4. Gunakan environment variables untuk semua sensitive data

## Next Steps

1. Implement proper Firestore security rules
2. Add more authentication methods (Google, Facebook, etc.)
3. Implement role-based access control
4. Add data validation
5. Setup Firebase Hosting untuk deployment
6. Add Firebase Cloud Functions untuk server-side logic

---

**Happy coding! 🚀** 