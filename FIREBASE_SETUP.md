# Firebase Setup Guide

## Current Issue Resolution

Jika Anda mengalami error `ERR_CONNECTION_REFUSED` pada port 8088, ini karena:

1. **Port mismatch**: Aplikasi mencoba terhubung ke port yang salah
2. **Emulator configuration**: Emulator tidak berjalan atau salah konfigurasi

## Solution Applied

### 1. Fixed Port Configuration
- Updated `frontend/src/config/firebase.jsx` to use correct ports:
  - Firestore: 8888 (was 8088)
  - Storage: 9999 (was 9199)
  - Auth: 9099 (unchanged)

### 2. Added Environment Variable Control
- Added `VITE_USE_EMULATOR` environment variable to control emulator usage
- Set to `false` by default to use production Firebase

## Usage Options

### Option 1: Use Production Firebase (Recommended for Testing)
Create `frontend/.env` file:
```env
VITE_USE_EMULATOR=false
```

### Option 2: Use Firebase Emulators
Create `frontend/.env` file:
```env
VITE_USE_EMULATOR=true
```

Then run emulators:
```bash
firebase emulators:start
```

### Option 3: Add Your Firebase Config
Create `frontend/.env` file with your actual Firebase project:
```env
VITE_USE_EMULATOR=false
VITE_FIREBASE_API_KEY=your-api-key
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
VITE_FIREBASE_APP_ID=your-app-id
VITE_FIREBASE_MEASUREMENT_ID=your-measurement-id
```

## Testing Tax Rate Feature

### With Production Firebase:
1. Set `VITE_USE_EMULATOR=false` in `.env`
2. Refresh browser
3. Go to `/settings` to test tax rate changes
4. Create new invoice to verify tax rate is applied

### With Emulators:
1. Set `VITE_USE_EMULATOR=true` in `.env`
2. Run `firebase emulators:start`
3. Refresh browser
4. Test the same way as production

## Troubleshooting

### Still getting connection errors?
1. Check if `.env` file exists in `frontend/` directory
2. Verify `VITE_USE_EMULATOR=false` is set
3. Restart development server: `npm run dev`

### Emulator not starting?
1. Check if Firebase CLI is installed: `npm install -g firebase-tools`
2. Login to Firebase: `firebase login`
3. Initialize project: `firebase init`

### Settings not saving?
1. Check browser console for Firebase errors
2. Verify Firestore rules allow write access
3. Check if user is authenticated

## Current Status

✅ **Fixed**: Port configuration corrected
✅ **Added**: Environment variable control
✅ **Ready**: Tax rate feature can be tested with production Firebase

The tax rate management system is now ready to use! 