# Layanan CRUD System

Sistem CRUD (Create, Read, Update, Delete) untuk mengelola layanan UnionSpace yang lengkap dan terintegrasi dengan database structure yang sudah didefinisikan.

## Komponen Utama

### 1. ServiceModal.jsx
Modal komprehensif untuk menambah dan mengedit layanan dengan semua field sesuai database structure:

**Fitur:**
- Form validation lengkap
- Auto-generation slug dari nama
- Support untuk bilingual descriptions (ID & EN)
- Input untuk semua metrics dan analytics
- Error handling dan loading states
- Mode add/edit yang terintegrasi

**Database Fields yang Didukung:**
- `serviceId` - ID unik layanan
- `name` - Nama layanan
- `slug` - URL-friendly identifier
- `category` - Kategori (office, workspace, event, legal, business-support)
- `type` - Tipe layanan (virtual-office, private-office, dll)
- `description` - Object dengan short/long dalam ID & EN
- `metrics` - Object dengan analytics lengkap
- `status` - Status publikasi (draft, published, archived)

### 2. useServices.js Hook
Custom React hook untuk state management dan operasi CRUD:

**Fungsi Utama:**
- `createService(data)` - Menambah layanan baru
- `updateService(id, data)` - Update layanan existing
- `deleteService(id)` - Hapus layanan
- `searchServices(term, filters)` - Pencarian dengan filter
- `filterByCategory/Type/Status` - Filter berdasarkan criteria
- `bulkUpdateStatus/bulkDelete` - Operasi batch

**State Management:**
- Loading states untuk semua operasi
- Error handling dengan pesan yang jelas
- Auto-refresh data setelah operasi
- Debounced search (300ms)

### 3. serviceApi.js Service
Lapisan API service untuk komunikasi dengan backend:

**Endpoints yang Didukung:**
- `GET /api/services` - Fetch semua layanan dengan filter
- `GET /api/services/:id` - Fetch layanan spesifik
- `POST /api/services` - Create layanan baru
- `PUT /api/services/:id` - Update layanan
- `DELETE /api/services/:id` - Delete layanan

**Transformasi Data:**
- Auto-convert form data ke format backend
- Validation dan sanitization
- Type conversion untuk numeric fields

### 4. LayananWithCRUD.jsx
Komponen utama yang mengintegrasikan semua fitur CRUD:

**Fitur:**
- Tab navigation (Spaces, Cities, Services)
- Search dengan debouncing
- Filter dropdown dengan kategori/tipe/status
- CRUD operations untuk services
- Notification system
- Delete confirmation modal
- Loading states dan error handling

## Cara Penggunaan

### 1. Implementasi di App Component

```jsx
import LayananWithCRUD from './components/layanan/LayananWithCRUD.jsx';

// Di dalam component
const [layananSubTab, setLayananSubTab] = useState('services');

<LayananWithCRUD
  layananSubTab={layananSubTab}
  setLayananSubTab={setLayananSubTab}
  spaces={spaces}
  cities={cities}
  onEdit={handleEdit} // untuk spaces/cities
  onDelete={handleDelete} // untuk spaces/cities
  onAddNew={handleAddNew} // untuk spaces/cities
/>
```

### 2. Menambah Layanan Baru

```jsx
// Data yang dikirim ke backend
const serviceData = {
  name: "Virtual Office Premium",
  category: "office",
  type: "virtual-office",
  description: {
    short: "Alamat bisnis prestisius",
    long: "Solusi virtual office lengkap...",
    shortEn: "Prestigious business address",
    longEn: "Complete virtual office solution..."
  },
  metrics: {
    totalSubscribers: 0,
    activeSubscribers: 0,
    monthlySignups: 0,
    churnRate: 0,
    averageLifetimeValue: 1800000,
    customerSatisfactionScore: 0,
    netPromoterScore: 0
  },
  status: "draft"
};

// Hook akan otomatis handle API call dan state update
const { createService } = useServices();
await createService(serviceData);
```

### 3. Search dan Filter

```jsx
const { 
  searchServices, 
  filterByCategory, 
  filterByType, 
  filterByStatus 
} = useServices();

// Search dengan debouncing otomatis
setSearchTerm("virtual office");

// Filter berdasarkan kategori
await filterByCategory("office");

// Filter berdasarkan tipe
await filterByType("virtual-office");

// Filter berdasarkan status
await filterByStatus("published");
```

## Database Structure Compliance

Sistem ini sepenuhnya mengikuti struktur database yang didefinisikan di `databasestructureref/layanan.json`:

### Field Mapping:
- ✅ `serviceId` - Auto-generated atau custom
- ✅ `name` - Nama layanan
- ✅ `slug` - Auto-generated dari nama
- ✅ `category` - Dropdown dengan opsi yang sesuai
- ✅ `type` - Dropdown dengan opsi yang sesuai
- ✅ `description` - Object dengan 4 field (short/long, ID/EN)
- ✅ `metrics` - Object lengkap dengan semua analytics
- ✅ `status` - Dropdown (draft/published/archived)
- ✅ `createdAt/updatedAt` - Auto-managed oleh backend
- ✅ `createdBy/lastModifiedBy` - Set oleh backend

### Validation Rules:
- Nama layanan wajib diisi
- Kategori dan tipe wajib dipilih
- Deskripsi singkat (ID) wajib diisi
- Churn rate 0-100%
- Customer satisfaction score 0-5
- Net promoter score 0-100
- Average lifetime value tidak boleh negatif

## Notification System

Sistem notifikasi terintegrasi untuk semua operasi:

```jsx
// Success notifications
showNotification('Layanan berhasil ditambahkan', 'success');

// Error notifications  
showNotification('Gagal menyimpan layanan', 'error');

// Auto-dismiss setelah 5 detik
// Manual dismiss dengan tombol X
```

## Error Handling

Comprehensive error handling di semua level:

1. **Form Level** - Validation errors dengan pesan spesifik
2. **API Level** - Network dan server errors
3. **State Level** - Loading dan error states
4. **User Level** - Friendly error messages dan recovery options

## Performance Optimizations

- **Debounced Search** - 300ms delay untuk mengurangi API calls
- **Optimistic Updates** - UI update sebelum API response
- **Memoized Components** - Prevent unnecessary re-renders
- **Lazy Loading** - Modal hanya render saat dibuka
- **Bulk Operations** - Support untuk operasi batch

## Future Enhancements

1. **Bulk Edit** - Edit multiple services sekaligus
2. **Export/Import** - CSV/Excel export dan import
3. **Advanced Filters** - Date range, custom queries
4. **Audit Log** - Track semua perubahan data
5. **Real-time Updates** - WebSocket untuk collaborative editing
6. **Template System** - Service templates untuk quick creation 