import React from 'react';
import { LayoutDashboard, ShoppingCart, Building2, MapPin, Settings, LayoutGrid, Tag, Users } from 'lucide-react';

const Sidebar = ({ activeTab, setActiveTab }) => {
  return (
    <div className="w-80 bg-gradient-to-b from-primary-700 to-primary-800 shadow-2xl relative min-h-screen">
      <div className="p-6 border-b border-primary-600/30">
        <div className="flex items-center justify-center">
          <img 
            src="/images/logo.png" 
            alt="NextSpace Admin" 
            className="h-10 w-auto max-w-full object-contain brightness-0 invert"
            onError={(e) => {
              e.target.style.display = 'none';
              e.target.nextSibling.style.display = 'block';
            }}
          />
          <h2 className="text-xl font-bold text-white hidden">NextSpace Admin</h2>
        </div>
        <div className="mt-3 text-center">
          <p className="text-primary-200 text-sm font-medium tracking-wide">Admin Panel</p>
          <div className="mt-2 w-16 h-0.5 bg-gradient-primary mx-auto rounded-full opacity-60"></div>
        </div>
      </div>
      
      <nav className="p-4 space-y-2">
        <button
          onClick={() => setActiveTab('dashboard')}
          className={`group w-full flex items-center px-4 py-3.5 text-left rounded-xl transition-all duration-200 ${
            activeTab === 'dashboard' 
              ? 'bg-gradient-primary text-white shadow-lg transform scale-105 sidebar-active-glow' 
              : 'text-primary-100 hover:text-white hover:bg-primary-600/30 hover:backdrop-blur-sm sidebar-hover-glow'
          }`}
        >
          <LayoutDashboard className={`w-5 h-5 mr-4 ${activeTab === 'dashboard' ? 'text-white' : 'text-primary-300 group-hover:text-white'}`} />
          <span className="font-medium">Dashboard</span>
        </button>
        
        <button
          onClick={() => setActiveTab('orders')}
          className={`group w-full flex items-center px-4 py-3.5 text-left rounded-xl transition-all duration-200 ${
            activeTab === 'orders' 
              ? 'bg-gradient-primary text-white shadow-lg transform scale-105 sidebar-active-glow' 
              : 'text-primary-100 hover:text-white hover:bg-primary-600/30 hover:backdrop-blur-sm sidebar-hover-glow'
          }`}
        >
          <ShoppingCart className={`w-5 h-5 mr-4 ${activeTab === 'orders' ? 'text-white' : 'text-primary-300 group-hover:text-white'}`} />
          <span className="font-medium">Orders</span>
        </button>
        
        <button
          onClick={() => setActiveTab('spaces')}
          className={`group w-full flex items-center px-4 py-3.5 text-left rounded-xl transition-all duration-200 ${
            activeTab === 'spaces' 
              ? 'bg-gradient-primary text-white shadow-lg transform scale-105 sidebar-active-glow' 
              : 'text-primary-100 hover:text-white hover:bg-primary-600/30 hover:backdrop-blur-sm sidebar-hover-glow'
          }`}
        >
          <LayoutGrid className={`w-5 h-5 mr-4 ${activeTab === 'spaces' ? 'text-white' : 'text-primary-300 group-hover:text-white'}`} />
          <span className="font-medium">Spaces</span>
        </button>
        
        <button
          onClick={() => setActiveTab('buildings')}
          className={`group w-full flex items-center px-4 py-3.5 text-left rounded-xl transition-all duration-200 ${
            activeTab === 'buildings' 
              ? 'bg-gradient-primary text-white shadow-lg transform scale-105 sidebar-active-glow' 
              : 'text-primary-100 hover:text-white hover:bg-primary-600/30 hover:backdrop-blur-sm sidebar-hover-glow'
          }`}
        >
          <Building2 className={`w-5 h-5 mr-4 ${activeTab === 'buildings' ? 'text-white' : 'text-primary-300 group-hover:text-white'}`} />
          <span className="font-medium">Lokasi/Gedung</span>
        </button>
        
        <button
          onClick={() => setActiveTab('cities')}
          className={`group w-full flex items-center px-4 py-3.5 text-left rounded-xl transition-all duration-200 ${
            activeTab === 'cities' 
              ? 'bg-gradient-primary text-white shadow-lg transform scale-105 sidebar-active-glow' 
              : 'text-primary-100 hover:text-white hover:bg-primary-600/30 hover:backdrop-blur-sm sidebar-hover-glow'
          }`}
        >
          <MapPin className={`w-5 h-5 mr-4 ${activeTab === 'cities' ? 'text-white' : 'text-primary-300 group-hover:text-white'}`} />
          <span className="font-medium">Kota</span>
        </button>
        
        <button
          onClick={() => setActiveTab('services')}
          className={`group w-full flex items-center px-4 py-3.5 text-left rounded-xl transition-all duration-200 ${
            activeTab === 'services' 
              ? 'bg-gradient-primary text-white shadow-lg transform scale-105 sidebar-active-glow' 
              : 'text-primary-100 hover:text-white hover:bg-primary-600/30 hover:backdrop-blur-sm sidebar-hover-glow'
          }`}
        >
          <Settings className={`w-5 h-5 mr-4 ${activeTab === 'services' ? 'text-white' : 'text-primary-300 group-hover:text-white'}`} />
          <span className="font-medium">Layanan</span>
        </button>
        
        <button
          onClick={() => setActiveTab('promo')}
          className={`group w-full flex items-center px-4 py-3.5 text-left rounded-xl transition-all duration-200 ${
            activeTab === 'promo' 
              ? 'bg-gradient-primary text-white shadow-lg transform scale-105 sidebar-active-glow' 
              : 'text-primary-100 hover:text-white hover:bg-primary-600/30 hover:backdrop-blur-sm sidebar-hover-glow'
          }`}
        >
          <Tag className={`w-5 h-5 mr-4 ${activeTab === 'promo' ? 'text-white' : 'text-primary-300 group-hover:text-white'}`} />
          <span className="font-medium">Promo</span>
        </button>
        
        <button
          onClick={() => setActiveTab('users')}
          className={`group w-full flex items-center px-4 py-3.5 text-left rounded-xl transition-all duration-200 ${
            activeTab === 'users' 
              ? 'bg-gradient-primary text-white shadow-lg transform scale-105 sidebar-active-glow' 
              : 'text-primary-100 hover:text-white hover:bg-primary-600/30 hover:backdrop-blur-sm sidebar-hover-glow'
          }`}
        >
          <Users className={`w-5 h-5 mr-4 ${activeTab === 'users' ? 'text-white' : 'text-primary-300 group-hover:text-white'}`} />
          <span className="font-medium">Users</span>
        </button>
      </nav>
      
      {/* Footer */}
      <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-primary-600/30 bg-gradient-to-t from-primary-900/50 to-transparent">
        <div className="text-center">
          <div className="w-12 h-0.5 bg-gradient-primary mx-auto rounded-full opacity-40 mb-3"></div>
          <p className="text-primary-300 text-xs font-medium tracking-wide">
            UnionSpace Admin-Dashboard v0.1
          </p>
          <p className="text-primary-400 text-xs mt-1 opacity-75">
            © 2025 All rights reserved
          </p>
        </div>
      </div>
    </div>
  );
};

export default Sidebar; 