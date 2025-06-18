import React from 'react';
import { LayoutDashboard, ShoppingCart, Building2 } from 'lucide-react';

const Sidebar = ({ activeTab, setActiveTab }) => {
  return (
    <div className="w-64 bg-white shadow-lg">
      <div className="p-4 border-b border-gray-200">
        <h2 className="text-xl font-bold text-gray-800">NextSpace Admin</h2>
      </div>
      
      <nav className="mt-4">
        <button
          onClick={() => setActiveTab('dashboard')}
          className={`w-full flex items-center px-4 py-3 text-left hover:bg-gray-50 ${
            activeTab === 'dashboard' ? 'bg-blue-50 text-blue-600 border-r-2 border-blue-600' : 'text-gray-700'
          }`}
        >
          <LayoutDashboard className="w-5 h-5 mr-3" />
          Dashboard
        </button>
        
        <button
          onClick={() => setActiveTab('orders')}
          className={`w-full flex items-center px-4 py-3 text-left hover:bg-gray-50 ${
            activeTab === 'orders' ? 'bg-blue-50 text-blue-600 border-r-2 border-blue-600' : 'text-gray-700'
          }`}
        >
          <ShoppingCart className="w-5 h-5 mr-3" />
          Orders
        </button>
        
        <button
          onClick={() => setActiveTab('layanan')}
          className={`w-full flex items-center px-4 py-3 text-left hover:bg-gray-50 ${
            activeTab === 'layanan' ? 'bg-blue-50 text-blue-600 border-r-2 border-blue-600' : 'text-gray-700'
          }`}
        >
          <Building2 className="w-5 h-5 mr-3" />
          Layanan
        </button>
      </nav>
    </div>
  );
};

export default Sidebar; 