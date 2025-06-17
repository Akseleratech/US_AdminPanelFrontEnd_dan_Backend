import React from 'react';

const Header = ({ activeTab }) => {
  const getTitle = () => {
    switch (activeTab) {
      case 'dashboard':
        return 'Dashboard';
      case 'orders':
        return 'Manajemen Orders';
      case 'layanan':
        return 'Manajemen Layanan';
      default:
        return 'Dashboard';
    }
  };

  return (
    <div className="bg-white shadow-sm border-b border-gray-200 p-4">
      <h1 className="text-2xl font-bold text-gray-800">{getTitle()}</h1>
    </div>
  );
};

export default Header; 