# 📁 Component Structure

## Overview
This document describes the organized structure of the frontend components after reorganization.

## 🏗️ Directory Structure

```
src/components/
├── auth/                    # Authentication components
│   ├── AuthContext.jsx     # Authentication context
│   └── Login.jsx           # Login component
│
├── cities/                  # City management components
│   ├── Cities.jsx          # Main cities page with CRUD
│   ├── CitiesTable.jsx     # Cities data table
│   ├── SimpleCityModal.jsx # Modern city modal with cascading dropdowns
│   └── CityModal.jsx       # Legacy city modal (deprecated)
│
├── services/                # Service management components
│   ├── Services.jsx        # Main services page
│   ├── ServicesTable.jsx   # Services data table
│   └── ServiceModal.jsx    # Service modal for add/edit
│
├── spaces/                  # Space management components
│   ├── Spaces.jsx          # Main spaces page
│   └── SpacesTable.jsx     # Spaces data table
│
├── orders/                  # Order management components
│   ├── Orders.jsx          # Main orders page
│   └── OrdersTable.jsx     # Orders data table
│
├── dashboard/               # Dashboard components
│   ├── Dashboard.jsx       # Main dashboard
│   ├── QuickStats.jsx      # Statistics cards
│   └── RecentOrders.jsx    # Recent orders widget
│
├── layout/                  # Layout components
│   ├── Header.jsx          # App header
│   └── Sidebar.jsx         # Navigation sidebar
│
├── common/                  # Shared/common components
│   ├── Modal.jsx           # Generic modal component
│   ├── LoadingSpinner.jsx  # Loading indicator
│   └── StatCard.jsx        # Statistics card component
│
# Legacy layanan/ folder has been removed
# It was replaced by individual service, cities, and spaces folders
```

## 🔄 Recent Reorganization

### Files Moved & Cleanup:
- `layanan/SimpleCityModal.jsx` → `cities/SimpleCityModal.jsx`
- `layanan/CitiesTable.jsx` → `cities/CitiesTable.jsx`
- `layanan/CityModal.jsx` → `cities/CityModal.jsx`
- `layanan/ServicesTable.jsx` → `services/ServicesTable.jsx`
- `layanan/ServiceModal.jsx` → `services/ServiceModal.jsx`
- `layanan/SpacesTable.jsx` → `spaces/SpacesTable.jsx`
- **Removed legacy `layanan/` folder completely** ✅

### Import Paths Updated:
- ✅ `Cities.jsx` - Updated to use local imports
- ✅ `Services.jsx` - Updated to use local imports
- ✅ `Spaces.jsx` - Updated to use local imports

## 📋 Component Responsibilities

### Cities Components
- **Cities.jsx**: Main page with search, filters, stats, and CRUD operations
- **CitiesTable.jsx**: Table component for displaying city data
- **SimpleCityModal.jsx**: Modern modal with cascading dropdowns (Country → Province → City)
- **CityModal.jsx**: Legacy modal (deprecated, use SimpleCityModal instead)

### Services Components
- **Services.jsx**: Main services management page
- **ServicesTable.jsx**: Table for displaying service data
- **ServiceModal.jsx**: Modal for adding/editing services

### Spaces Components
- **Spaces.jsx**: Main spaces management page
- **SpacesTable.jsx**: Table for displaying space data

## 🎯 Best Practices

1. **Folder Organization**: Keep related components in the same folder
2. **Local Imports**: Use relative imports for components in the same folder
3. **Naming Convention**: Use PascalCase for component files
4. **Single Responsibility**: Each component should have a clear, single purpose
5. **Reusability**: Common components go in the `common/` folder

## 📝 Data Flow

```
App.jsx
├── Layout Components (Header, Sidebar)
├── Cities.jsx → CitiesTable.jsx + SimpleCityModal.jsx
├── Services.jsx → ServicesTable.jsx + ServiceModal.jsx
├── Spaces.jsx → SpacesTable.jsx
└── Dashboard.jsx → QuickStats.jsx + RecentOrders.jsx
```

## 🔧 Import Examples

```javascript
// Within cities folder
import CitiesTable from './CitiesTable.jsx';
import SimpleCityModal from './SimpleCityModal.jsx';

// From other folders
import StatCard from '../common/StatCard.jsx';
import useCities from '../../hooks/useCities.js';
```

## 🚀 Future Improvements

1. Create index.js files for cleaner imports
2. Add TypeScript support
3. Implement component lazy loading
4. Add component testing structure
5. Create shared types/interfaces 