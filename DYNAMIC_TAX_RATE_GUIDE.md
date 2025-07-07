# Dynamic Tax Rate Management

## Overview
Sistem tarif pajak dinamis memungkinkan admin untuk mengubah tarif pajak (PPN) secara real-time melalui Admin Panel tanpa perlu deploy ulang aplikasi. Perubahan akan langsung berlaku untuk:
- Invoice baru yang dibuat
- Laporan keuangan
- Aplikasi mobile (real-time)

## Architecture

### 1. Database Structure
```
settings/global {
  taxRate: 11,          // Percentage (11 = 11%)
  updatedAt: timestamp,
  createdAt: timestamp,
  description: "Global system settings for UnionSpace CRM"
}
```

### 2. Frontend Components

#### TaxRateContext (`frontend/src/contexts/TaxRateContext.jsx`)
- Provides real-time tax rate updates using Firestore listener
- Automatically updates all components when tax rate changes
- Fallback to 11% if settings document doesn't exist

#### Settings Component (`frontend/src/components/settings/Settings.jsx`)
- Admin interface for managing tax rate
- Input validation (0-100%)
- Real-time updates with success/error feedback
- Accessible via `/settings` route

#### Updated Components
- `InvoiceModal.jsx`: Uses dynamic tax rate for new invoices
- `Reports.jsx`: Uses dynamic tax rate for calculations
- `InvoiceViewModal.jsx`: Already uses invoice-specific tax rate

### 3. Backend Functions

#### getCurrentTaxRate (`functions/src/utils/helpers.js`)
```javascript
const getCurrentTaxRate = async () => {
  try {
    const db = getDb();
    const docSnap = await db.collection('settings').doc('global').get();
    
    if (docSnap.exists) {
      const data = docSnap.data();
      return (data.taxRate || 11) / 100; // Convert to decimal
    }
    
    return 0.11; // Fallback to 11%
  } catch (error) {
    console.error('Error getting tax rate:', error);
    return 0.11; // Fallback on error
  }
};
```

#### Updated Invoice Functions
- `createInvoice`: Uses getCurrentTaxRate() if taxRate not provided
- `generateInvoiceFromOrder`: Uses getCurrentTaxRate() for new invoices

## Usage

### Admin Panel
1. Navigate to **Pengaturan** in the sidebar
2. Modify the **Tarif Pajak (PPN) %** field
3. Click **Simpan Pengaturan**
4. Changes take effect immediately

### Mobile App Integration
The mobile app should listen to the same Firestore document:

```javascript
// React Native / Flutter
import { doc, onSnapshot } from 'firebase/firestore';

onSnapshot(doc(db, 'settings', 'global'), (snap) => {
  if (snap.exists()) {
    const taxRate = snap.data().taxRate; // Percentage
    setTaxRate(taxRate / 100); // Convert to decimal
  }
});
```

## Security

### Firestore Rules
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{db}/documents {
    match /settings/global {
      allow read: if true; // Public read for mobile apps
      allow write: if request.auth != null
                   && request.auth.token.admin == true; // Admin only
    }
  }
}
```

## Testing

### Manual Testing
1. **Admin Panel Test**:
   - Go to Settings page
   - Change tax rate from 11% to 10%
   - Verify success message appears

2. **Invoice Creation Test**:
   - Create new invoice after changing tax rate
   - Verify invoice uses new tax rate (10%)

3. **Reports Test**:
   - Check Reports page shows updated tax rate
   - Verify calculations use new rate

4. **Real-time Update Test**:
   - Open two browser tabs
   - Change tax rate in one tab
   - Verify other tab updates automatically

### Automated Testing
```javascript
// Test getCurrentTaxRate function
describe('getCurrentTaxRate', () => {
  it('should return current tax rate from settings', async () => {
    // Mock Firestore response
    const mockDoc = { exists: true, data: () => ({ taxRate: 12 }) };
    
    const result = await getCurrentTaxRate();
    expect(result).toBe(0.12); // 12% as decimal
  });
  
  it('should return fallback rate on error', async () => {
    // Mock Firestore error
    const result = await getCurrentTaxRate();
    expect(result).toBe(0.11); // 11% fallback
  });
});
```

## Migration

### Existing Data
- Existing invoices retain their original tax rates
- Only new invoices use the dynamic tax rate
- No data migration required

### Deployment
1. Deploy backend functions with updated helpers
2. Deploy frontend with new Settings component
3. Initialize settings document (auto-initialized in dev mode)
4. Update mobile app to listen to settings changes

## Troubleshooting

### Common Issues
1. **Settings not loading**: Check Firestore permissions
2. **Tax rate not updating**: Verify TaxRateProvider is wrapping App
3. **Mobile app not syncing**: Ensure Firestore listener is active

### Debug Commands
```javascript
// Check current tax rate in console
import { getCurrentTaxRate } from './utils/helpers';
console.log(await getCurrentTaxRate());

// Check settings document
import { doc, getDoc } from 'firebase/firestore';
import { db } from './config/firebase';
const snap = await getDoc(doc(db, 'settings', 'global'));
console.log(snap.data());
```

## Benefits
- **Real-time updates**: No app restart required
- **Centralized control**: Single source of truth
- **Audit trail**: All changes tracked with timestamps
- **Fallback safety**: System continues working even if settings fail
- **Mobile sync**: Instant updates across all platforms 