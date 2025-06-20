import React from 'react';
import { LayoutDashboard, ShoppingCart, Building2, MapPin, Settings } from 'lucide-react';

const Sidebar = ({ activeTab, setActiveTab }) => {
  return (
    <div className="w-80 bg-white shadow-lg">
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-center">
          <img 
            src="/images/logo.png" 
            alt="NextSpace Admin" 
            className="h-8 w-auto max-w-full object-contain"
            onError={(e) => {
              e.target.style.display = 'none';
              e.target.nextSibling.style.display = 'block';
            }}
          />
          <h2 className="text-xl font-bold text-gray-800 hidden">NextSpace Admin</h2>
        </div>
      </div>
      
      <nav className="mt-4">
        <button
          onClick={() => setActiveTab('dashboard')}
          className={`rounded-xl w-full flex items-center px-4 py-3 text-left hover:bg-[#87AB5A] ${
            activeTab === 'dashboard' ? 'rounded-xl bg-[#B5CB9980] text-[#445D48] border-r-2' : 'text-gray-700'
          }`}
        >
          <LayoutDashboard className="w-5 h-5 mr-3" />
          Dashboard
        </button>
        
        <button
          onClick={() => setActiveTab('orders')}
          className={`rounded-xl w-full flex items-center px-4 py-3 text-left hover:bg-[#87AB5A] ${
            activeTab === 'orders' ? 'rounded-xl bg-[#B5CB9980] text-[#445D48] border-r-2' : 'text-gray-700'
          }`}
        >
          <ShoppingCart className="w-5 h-5 mr-3" />
          Orders
        </button>
        
        <button
          onClick={() => setActiveTab('spaces')}
          className={`rounded-xl w-full flex items-center px-4 py-3 text-left hover:bg-[#87AB5A] ${
            activeTab === 'spaces' ? 'rounded-xl bg-[#B5CB9980] text-[#445D48] border-r-2' : 'text-gray-700'
          }`}
        >
          <Building2 className="w-5 h-5 mr-3" />
          Spaces
        </button>
        
        <button
          onClick={() => setActiveTab('cities')}
          className={`rounded-xl w-full flex items-center px-4 py-3 text-left hover:bg-[#87AB5A] ${
            activeTab === 'cities' ? 'rounded-xl bg-[#B5CB9980] text-[#445D48] border-r-2' : 'text-gray-700'
          }`}
        >
          <MapPin className="w-5 h-5 mr-3" />
          Kota
        </button>
        
        <button
          onClick={() => setActiveTab('services')}
          className={`rounded-xl w-full flex items-center px-4 py-3 text-left hover:bg-[#87AB5A] ${
            activeTab === 'services' ? 'rounded-xl bg-[#B5CB9980] text-[#445D48] border-r-2' : 'text-gray-700'
          }`}
        >
          <Settings className="w-5 h-5 mr-3" />
          Layanan
        </button>
      </nav>
    </div>
  );
};

export default Sidebar; 