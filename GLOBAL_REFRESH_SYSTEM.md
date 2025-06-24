# Global Refresh System 🔄

Sistem untuk sinkronisasi data antar components ketika terjadi perubahan data yang mempengaruhi multiple components.

## 🎯 **Problem yang Dipecahkan**

### **Before (Problem):**
```javascript
// User membuat space baru dengan lokasi "Kabupaten Sleman"
1. Space berhasil dibuat ✅
2. Backend auto-create city "Sleman" ✅  
3. Cities tab TIDAK menampilkan kota baru ❌ 
   (karena tidak ada refresh mechanism)
```

### **After (Solution):**
```javascript
// Dengan Global Refresh System:
1. Space berhasil dibuat ✅
2. Backend auto-create city "Sleman" ✅
3. Frontend trigger refresh untuk Cities component ✅
4. Cities tab otomatis reload dan menampilkan kota baru ✅
```

## 🏗️ **Arsitektur System**

### **1. GlobalRefreshContext.jsx**
```javascript
// Context provider untuk global state management
const GlobalRefreshProvider = ({ children }) => {
  const [refreshTriggers, setRefreshTriggers] = useState({
    cities: 0,    // Counter untuk cities refresh
    spaces: 0,    // Counter untuk spaces refresh
    services: 0,  // Counter untuk services refresh
    orders: 0     // Counter untuk orders refresh
  });

  // Generic refresh trigger
  const triggerRefresh = (componentNames) => {
    // Increment counter untuk component yang ditentukan
  };

  // Cross-component refresh
  const refreshRelatedToSpaces = () => {
    triggerRefresh(['cities', 'spaces']); // Space creation affects cities
  };
};
```

### **2. Integration dengan Components**

#### **Producer: Spaces Component**
```javascript
// Spaces.jsx - Ketika space dibuat
const { refreshRelatedToSpaces } = useGlobalRefresh();

const handleSaveSpace = async (spaceData) => {
  if (modalMode === 'add') {
    await createSpace(spaceData);
    
    // 🔄 Trigger refresh untuk cities (auto-created city)
    refreshRelatedToSpaces();
  }
};
```

#### **Consumer: Cities Hook**
```javascript
// useCities.js - Mendengarkan refresh signals
const { refreshTriggers } = useGlobalRefresh();

// Listen to global refresh triggers
useEffect(() => {
  if (refreshTriggers.cities > 0) {
    console.log('🔄 useCities: Global refresh triggered, refreshing cities data...');
    refresh(); // Reload cities data
  }
}, [refreshTriggers.cities, refresh]);
```

## 📊 **Data Flow Diagram**

```
Space Creation Flow:
===================

[User creates space] 
        ↓
[Space component calls createSpace()] 
        ↓
[Backend auto-creates city if needed]
        ↓
[Space component calls refreshRelatedToSpaces()]
        ↓
[GlobalRefreshContext increments cities counter]
        ↓
[useCities hook detects counter change]
        ↓
[Cities component reloads data]
        ↓
[New city appears in Cities tab] ✅
```

## 🔧 **Implementation Details**

### **1. Context Provider Setup**
```javascript
// App.jsx
const App = () => {
  return (
    <GlobalRefreshProvider>
      <AdminPanel />
    </GlobalRefreshProvider>
  );
};
```

### **2. Hook Integration**
```javascript
// useCities.js
import { useGlobalRefresh } from '../contexts/GlobalRefreshContext.jsx';

const useCities = () => {
  const { refreshTriggers } = useGlobalRefresh();
  
  // Auto-refresh ketika ada trigger
  useEffect(() => {
    if (refreshTriggers.cities > 0) {
      refresh();
    }
  }, [refreshTriggers.cities, refresh]);
};
```

### **3. Component Integration**
```javascript
// Spaces.jsx
import { useGlobalRefresh } from '../../contexts/GlobalRefreshContext.jsx';

const Spaces = () => {
  const { refreshRelatedToSpaces } = useGlobalRefresh();
  
  const handleSaveSpace = async (spaceData) => {
    if (modalMode === 'add') {
      await createSpace(spaceData);
      refreshRelatedToSpaces(); // Trigger cross-component refresh
    }
  };
};
```

## 🧪 **Test Results**

```bash
🧪 Testing Global Refresh System
================================

Test 1: Space Creation Triggers Cities Refresh
🆕 Creating new space...
🔄 Global refresh triggered for: cities (count: 1)
🔄 Global refresh triggered for: spaces (count: 1)

Test 2: Multiple Space Creations  
🔄 Global refresh triggered for: cities (count: 2)
🔄 Global refresh triggered for: spaces (count: 2)

Test 3: Individual Component Refresh
🔄 Global refresh triggered for: cities (count: 3)

✅ All tests passed!
```

## 🎯 **Use Cases**

### **1. Space Creation → Cities Refresh**
```javascript
// Ketika space dibuat dengan lokasi baru
refreshRelatedToSpaces(); // Refresh cities AND spaces
```

### **2. City Update → Spaces Refresh**
```javascript  
// Ketika city data diupdate
refreshRelatedToCities(); // Refresh spaces yang terkait
```

### **3. Individual Component Refresh**
```javascript
// Refresh specific component saja
refreshCities();   // Hanya cities
refreshSpaces();   // Hanya spaces
refreshServices(); // Hanya services
```

### **4. Custom Multi-Component Refresh**
```javascript
// Refresh multiple components sekaligus
triggerRefresh(['cities', 'spaces', 'services']);
```

## 🔍 **Debug & Monitoring**

### **Console Logs**
```javascript
// Producer side (Spaces component)
console.log('🔄 Spaces: Triggering global refresh for related components (cities)...');

// Consumer side (useCities hook)  
console.log('🔄 useCities: Global refresh triggered, refreshing cities data...');

// Context side (GlobalRefreshContext)
console.log('🔄 Global refresh triggered for: cities (count: 1)');
```

### **React DevTools**
- GlobalRefreshContext state dapat dimonitor
- refreshTriggers counters menunjukkan aktivitas refresh
- Component re-renders dapat ditrack

## 💡 **Best Practices**

### **1. Naming Conventions**
```javascript
// Use descriptive names
refreshRelatedToSpaces()  // ✅ Clear intent
refreshAll()             // ❌ Too generic
```

### **2. Performance Optimization**
```javascript
// Use useCallback untuk prevent unnecessary re-renders
const refreshRelatedToSpaces = useCallback(() => {
  triggerRefresh(['cities', 'spaces']);
}, [triggerRefresh]);
```

### **3. Error Handling**
```javascript
// Graceful degradation if context not available
const useGlobalRefresh = () => {
  const context = useContext(GlobalRefreshContext);
  if (!context) {
    throw new Error('useGlobalRefresh must be used within a GlobalRefreshProvider');
  }
  return context;
};
```

## 🚀 **Future Enhancements**

### **Phase 2: Advanced Features**
- [ ] **Debounced Refresh**: Prevent rapid multiple refreshes
- [ ] **Selective Refresh**: Refresh specific data subset only
- [ ] **Refresh Queuing**: Queue refresh requests untuk better performance
- [ ] **Dependency Mapping**: Automatic cross-component dependency detection

### **Phase 3: Real-time Features**
- [ ] **WebSocket Integration**: Real-time data sync across tabs
- [ ] **Background Refresh**: Auto-refresh based on timer
- [ ] **Conflict Resolution**: Handle concurrent data modifications
- [ ] **Offline Support**: Queue refreshes for when connection restored

## 🎉 **Benefits**

### **1. User Experience**
- ✅ **Real-time Updates**: Data selalu up-to-date antar tabs
- ✅ **No Manual Refresh**: User tidak perlu manual refresh
- ✅ **Instant Feedback**: Changes langsung terlihat di UI

### **2. Developer Experience**  
- ✅ **Declarative API**: Simple dan intuitive interface
- ✅ **Loose Coupling**: Components tidak tightly coupled
- ✅ **Easy Debugging**: Clear logging dan monitoring

### **3. System Architecture**
- ✅ **Scalable**: Easy untuk add new components
- ✅ **Maintainable**: Centralized refresh logic
- ✅ **Testable**: Easy untuk unit test refresh flows

---

**✅ Problem Solved: Cities tab sekarang otomatis menampilkan kota baru ketika space dibuat dengan auto-create cities feature!** 🎯 