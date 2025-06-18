import React, { useState } from 'react';

// Components
import Sidebar from './components/layout/Sidebar.jsx';
import Header from './components/layout/Header.jsx';
import LoadingSpinner from './components/common/LoadingSpinner.jsx';
import Modal from './components/common/Modal.jsx';
import Dashboard from './components/dashboard/Dashboard.jsx';
import Orders from './components/orders/Orders.jsx';
import Layanan from './components/layanan/Layanan.jsx';

// Custom Hook
import { useApi } from './hooks/useApi.jsx';

// Firebase Check
const checkFirebaseConfig = () => {
  // Required Firebase variables
  const requiredFirebaseVars = [
    'VITE_FIREBASE_API_KEY',
    'VITE_FIREBASE_AUTH_DOMAIN',
    'VITE_FIREBASE_PROJECT_ID',
    'VITE_FIREBASE_STORAGE_BUCKET',
    'VITE_FIREBASE_MESSAGING_SENDER_ID',
    'VITE_FIREBASE_APP_ID'
  ];
  
  // Optional Firebase variables
  const optionalFirebaseVars = [
    'VITE_FIREBASE_MEASUREMENT_ID' // Only needed if Google Analytics is enabled
  ];
  
  const missingRequiredVars = requiredFirebaseVars.filter(varName => !import.meta.env[varName]);
  const missingOptionalVars = optionalFirebaseVars.filter(varName => !import.meta.env[varName]);
  
  return {
    isConfigured: missingRequiredVars.length === 0,
    missingVars: missingRequiredVars,
    missingOptionalVars,
    hasAnalytics: !!import.meta.env.VITE_FIREBASE_MEASUREMENT_ID
  };
};

const FirebaseConfigNotice = ({ missingVars, missingOptionalVars, hasAnalytics }) => (
  <div className="max-w-4xl mx-auto mt-10 p-6 bg-yellow-50 border border-yellow-200 rounded-lg">
    <div className="flex items-center mb-4">
      <div className="flex-shrink-0">
        <svg className="h-6 w-6 text-yellow-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.962-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
        </svg>
      </div>
      <div className="ml-3">
        <h3 className="text-lg font-medium text-yellow-800">
          🔧 Firebase Configuration Required
        </h3>
      </div>
    </div>
    
    <div className="text-yellow-700">
      <p className="mb-4">
        UnionSpace CRM membutuhkan konfigurasi Firebase untuk berfungsi penuh. 
        Silakan setup environment variables berikut di file <code className="bg-yellow-100 px-1 rounded">frontend/.env</code>:
      </p>
      
      {missingVars.length > 0 && (
        <div className="mb-4">
          <h4 className="font-medium mb-2">🔴 Required Variables:</h4>
          <div className="bg-gray-800 text-green-400 p-4 rounded-md font-mono text-sm">
            {missingVars.map(varName => (
              <div key={varName}>{varName}=your_value_here</div>
            ))}
          </div>
        </div>
      )}
      
      {missingOptionalVars.length > 0 && (
        <div className="mb-4">
          <h4 className="font-medium mb-2">🔶 Optional Variables (hanya jika menggunakan Google Analytics):</h4>
          <div className="bg-gray-700 text-yellow-300 p-4 rounded-md font-mono text-sm">
            {missingOptionalVars.map(varName => (
              <div key={varName}>{varName}=your_measurement_id_here</div>
            ))}
          </div>
          <p className="text-sm mt-2 text-yellow-600">
            💡 <strong>Note:</strong> MEASUREMENT_ID hanya diperlukan jika Anda mengaktifkan Google Analytics di Firebase project.
          </p>
        </div>
      )}
      
      <div className="space-y-2">
        <p><strong>📚 Panduan lengkap:</strong> Baca file <code className="bg-yellow-100 px-1 rounded">FIREBASE_SETUP.md</code></p>
        <p><strong>⚡ Vite info:</strong> Baca file <code className="bg-yellow-100 px-1 rounded">VITE_MIGRATION.md</code></p>
      </div>
      
      <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded">
        <p className="text-blue-800">
          <strong>💡 Tips:</strong> Sementara Firebase belum dikonfigurasi, CRM akan menggunakan mock data untuk demo.
        </p>
      </div>
      
      {hasAnalytics && (
        <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded">
          <p className="text-green-800">
            ✅ <strong>Google Analytics:</strong> Terdeteksi sudah dikonfigurasi
          </p>
        </div>
      )}
    </div>
  </div>
);

const AdminPanel = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [layananSubTab, setLayananSubTab] = useState('spaces');
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState('');

  // Check Firebase configuration
  const firebaseConfig = checkFirebaseConfig();

  // Using custom hook for API operations (with error handling)
  let apiData;
  try {
    apiData = useApi(activeTab, layananSubTab);
  } catch (error) {
    console.warn('API Hook failed (likely due to Firebase config):', error);
    // Fallback data when Firebase is not configured
    apiData = {
      loading: false,
      dashboardStats: {
        totalRevenue: 0,
        totalOrders: 0,
        totalSpaces: 0,
        totalUsers: 0
      },
      recentOrders: [],
      quickStats: {
        pendingOrders: 0,
        completedToday: 0,
        activeSpaces: 0,
        revenue: 0
      },
      orders: [],
      spaces: [],
      cities: [],
      services: [],
      handleDelete: () => alert('Feature not available without Firebase')
    };
  }

  const {
    loading,
    dashboardStats,
    recentOrders,
    quickStats,
    orders,
    spaces,
    cities,
    services,
    handleDelete
  } = apiData;

  const handleEdit = (item) => {
    setModalType('edit');
    setShowModal(true);
  };

  const handleAddNew = () => {
    setModalType('add');
    setShowModal(true);
  };

  const renderContent = () => {
    // Show Firebase config notice if not configured
    if (!firebaseConfig.isConfigured) {
      return <FirebaseConfigNotice 
        missingVars={firebaseConfig.missingVars} 
        missingOptionalVars={firebaseConfig.missingOptionalVars}
        hasAnalytics={firebaseConfig.hasAnalytics}
      />;
    }

    switch (activeTab) {
      case 'dashboard':
        return (
          <Dashboard 
            dashboardStats={dashboardStats}
            recentOrders={recentOrders}
            quickStats={quickStats}
          />
        );
      case 'orders':
        return <Orders orders={orders} />;
      case 'layanan':
        return (
          <Layanan
            layananSubTab={layananSubTab}
            setLayananSubTab={setLayananSubTab}
            spaces={spaces}
            cities={cities}
            services={services}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onAddNew={handleAddNew}
          />
        );
      default:
        return (
          <Dashboard 
            dashboardStats={dashboardStats}
            recentOrders={recentOrders}
            quickStats={quickStats}
          />
        );
    }
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* Main Content */}
      <div className="flex-1 overflow-hidden">
        <div className="h-full overflow-y-auto">
          {/* Header */}
          <Header activeTab={activeTab} />

          {/* Content */}
          <div className="p-6">
            {/* Firebase Status Indicator */}
            {!firebaseConfig.isConfigured && (
              <div className="mb-4 bg-orange-100 border border-orange-300 text-orange-700 px-4 py-2 rounded">
                ⚠️ Running in Demo Mode - Firebase not configured
              </div>
            )}
            
            {renderContent()}
          </div>
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <Modal 
          type={modalType} 
          layananSubTab={layananSubTab}
          onClose={() => setShowModal(false)} 
        />
      )}
    </div>
  );
};

const App = () => {
  return <AdminPanel />;
};

export default App; 