import React, { useState } from 'react';

// Components
import Sidebar from './components/layout/Sidebar';
import Header from './components/layout/Header';
import LoadingSpinner from './components/common/LoadingSpinner';
import Modal from './components/common/Modal';
import Dashboard from './components/dashboard/Dashboard';
import Orders from './components/orders/Orders';
import Layanan from './components/layanan/Layanan';

// Custom Hook
import { useApi } from './hooks/useApi';

const AdminPanel = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [layananSubTab, setLayananSubTab] = useState('spaces');
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState('');

  // Using custom hook for API operations
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
  } = useApi(activeTab, layananSubTab);

  const handleEdit = (item) => {
    setModalType('edit');
    setShowModal(true);
  };

  const handleAddNew = () => {
    setModalType('add');
    setShowModal(true);
  };

  const renderContent = () => {
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

export default AdminPanel; 