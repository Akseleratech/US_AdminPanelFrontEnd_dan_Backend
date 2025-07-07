# UnionSpace CRM - Authentication Setup Guide

## Overview
Panduan lengkap untuk mengatur autentikasi admin pada sistem UnionSpace CRM yang menggunakan Firebase Authentication dan Firestore.

## Prerequisites
- Node.js 20+
- Firebase CLI
- Firebase project sudah dikonfigurasi
- Emulator Firebase sudah running

## Quick Start

### 1. Start Firebase Emulators
```bash
# Di root project
firebase emulators:start
```

### 2. Setup Admin Users
```bash
# Di folder functions/
npm run setup-admin-simple
```

### 3. Login ke Admin Panel
- URL: http://localhost:5173 (atau port Vite yang aktif)
- Email: `admin@unionspace.com`
- Password: `admin123456`

**Atau:**
- Email: `superadmin@unionspace.com`  
- Password: `superadmin123456`

## Admin Setup Script

### Menggunakan setup-admin-simple
Script ini menggunakan Firebase emulator REST API untuk bypass Firestore rules saat setup initial admin:

```bash
cd functions
npm run setup-admin-simple
```

**Output yang diharapkan:**
```
🚀 Setting up admin users for Firebase emulator...
====================================================
🔧 Using Auth emulator at localhost:9099
🔧 Using Firestore emulator at localhost:8888

📝 Processing: admin@unionspace.com
👤 Creating auth user: admin@unionspace.com
✅ Auth user created: admin@unionspace.com (xxx)

📝 Processing: superadmin@unionspace.com
👤 Creating auth user: superadmin@unionspace.com
✅ Auth user created: superadmin@unionspace.com (xxx)

📄 Creating admin documents in Firestore...
⚠️  Note: Using REST API to bypass Firestore rules

📄 Creating admin document: admin@unionspace.com
✅ Admin document created: admin@unionspace.com
📄 Creating admin document: superadmin@unionspace.com
✅ Admin document created: superadmin@unionspace.com

⚙️  Creating default settings...
✅ Default settings created

🎉 Setup completed successfully!
```

### Script Details
- **File**: `functions/src/setupAdminSimple.js`
- **Method**: Firebase Emulator REST API (bypasses Firestore rules)
- **Dependencies**: `node-fetch` untuk HTTP requests
- **Keunggulan**: Tidak memerlukan Google Cloud credentials, bekerja dengan emulator

## Authentication Flow

### 1. Login Process
```
User Input (email/password) 
→ Firebase Auth 
→ Get ID Token 
→ Check admin role in Firestore admins/{uid}
→ Grant/Deny access
```

### 2. Role Verification
```javascript
// AuthContext.jsx
const checkAdminStatus = async (user) => {
  const adminDoc = await getDoc(doc(db, 'admins', user.uid));
  return adminDoc.exists() && adminDoc.data().role === 'admin';
};
```

### 3. API Security
Semua endpoint POST/PUT/DELETE dilindungi dengan middleware:
```javascript
// functions/src/utils/helpers.js
const requireAdmin = async (req, res, next) => {
  const adminUser = await verifyAdminAuth(req);
  if (!adminUser) {
    return res.status(403).json({ error: 'Admin access required' });
  }
  req.adminUser = adminUser;
  next();
};
```

## File Structure

### Frontend Authentication
```
src/
├── components/auth/
│   ├── AuthContext.jsx      # Context untuk state autentikasi
│   └── Login.jsx           # Komponen login
├── components/common/
│   └── PrivateRoute.jsx    # Route protection
```

### Backend Security
```
functions/src/
├── utils/
│   └── helpers.js          # Middleware autentikasi
├── setupAdminSimple.js     # Script setup admin (WORKING)
└── setupAdmin.js           # Script setup admin (Legacy)
```

### Configuration
```
├── firestore.rules         # Rules database Firestore
├── firebase.json          # Konfigurasi Firebase
└── .env                   # Environment variables
```

## Security Features

### Frontend Security
✅ **Auth bypass disabled**: `BYPASS_AUTH_FOR_DEVELOPMENT = false`  
✅ **Role-based routing**: Admin role required untuk akses  
✅ **Token validation**: Firebase ID token diverifikasi  
✅ **Auto logout**: Session expired handling  

### Backend Security  
✅ **Protected endpoints**: Semua write operations memerlukan admin  
✅ **Token verification**: Firebase ID token divalidasi  
✅ **Role checking**: Admin role diverifikasi dari Firestore  
✅ **CORS protection**: Restricted origins untuk development  

### Database Security
✅ **Firestore rules**: Strict rules dengan admin verification  
✅ **Admin collection**: Centralized admin management  
✅ **Read/write separation**: Public read, admin write pattern  

## Production Deployment

### 1. Environment Setup
```bash
# functions/.env
FIREBASE_API_KEY=your_actual_api_key
FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
FIREBASE_PROJECT_ID=your_project_id
# ... other config
```

### 2. Create Production Admin
```bash
# Menggunakan Firebase Console atau Admin SDK
# JANGAN gunakan script emulator untuk production!
```

### 3. Security Checklist
- [ ] Update Firebase project config dari demo project
- [ ] Ganti password default admin accounts  
- [ ] Setup proper CORS origins untuk production domain
- [ ] Review Firestore rules untuk production
- [ ] Setup monitoring dan logging
- [ ] Enable Firebase App Check untuk extra security

## Troubleshooting

### Common Issues

**Issue 1: Emulator tidak bisa connect**
```bash
# Solution: Pastikan emulator berjalan
firebase emulators:start
```

**Issue 2: Permission denied saat setup admin**
```bash
# Solution: Gunakan setup-admin-simple (bukan setup-admin)
npm run setup-admin-simple
```

**Issue 3: Login gagal setelah setup**
```bash
# Check: Pastikan frontend menggunakan emulator config yang benar
# File: src/config/firebase.jsx
```

**Issue 4: "Admin access required" error**
```bash
# Check: Pastikan admin document exists di Firestore
# Visit: http://localhost:4000/firestore
# Collection: admins/{uid}
```

### Debug Commands
```bash
# Check auth users
curl http://localhost:9099/emulator/v1/projects/demo-project/accounts

# Check Firestore data  
curl http://localhost:8888/v1/projects/demo-project/databases/(default)/documents/admins

# Verify emulators running
curl http://localhost:4000/
```

## Advanced Configuration

### Custom Admin Roles
Untuk menambah level admin yang berbeda, edit:

1. **Admin document structure**:
```javascript
// collections/admins/{uid}
{
  email: "admin@domain.com",
  role: "admin", // atau "superadmin", "moderator"
  permissions: ["users:read", "users:write", ...],
  name: "Admin Name",
  createdAt: timestamp,
  updatedAt: timestamp
}
```

2. **Update Firestore rules**:
```javascript
// firestore.rules
function isAdmin() {
  return isAuthenticated() && 
         exists(/databases/$(database)/documents/admins/$(request.auth.uid)) &&
         get(/databases/$(database)/documents/admins/$(request.auth.uid)).data.role in ['admin', 'superadmin'];
}
```

3. **Update middleware**:
```javascript
// functions/src/utils/helpers.js  
const verifyAdminAuth = async (req) => {
  // ... existing code ...
  const allowedRoles = ['admin', 'superadmin'];
  return allowedRoles.includes(adminData.role) ? adminData : null;
};
```

## Support

Jika mengalami masalah:
1. Cek Firebase emulator UI: http://localhost:4000
2. Review console logs di browser developer tools
3. Check Firebase functions logs: `firebase functions:log`
4. Pastikan semua dependencies terinstall: `npm install`

---

**Status**: ✅ Authentication system fully implemented and tested  
**Last Updated**: $(date)  
**Version**: 2.0 (REST API based setup) 