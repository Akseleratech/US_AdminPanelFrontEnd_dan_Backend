import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Building2, 
  Map, 
  Users, 
  ClipboardList, 
  Ticket,
  Settings,
  Briefcase,
  Wrench,
  ChevronDown,
  LogOut,
  Newspaper,
  CreditCard
} from 'lucide-react';
import { useAuth } from '../auth/AuthContext.jsx';

const Sidebar = () => {
  const { user, userRole, logout } = useAuth();
  const location = useLocation();

  const navLinks = [
    {
      name: 'Dashboard',
      path: '/',
      icon: LayoutDashboard
    },
    {
      name: 'Orders',
      path: '/orders',
      icon: ClipboardList
    },
    {
      name: 'Spaces',
      path: '/spaces',
      icon: Building2
    },
    {
      name: 'Gedung',
      path: '/buildings',
      icon: Building2
    },
    {
      name: 'Kota',
      path: '/cities',
      icon: Map
    },
    {
      name: 'Layanan',
      path: '/layanan',
      icon: Briefcase
    },
    {
      name: 'Fasilitas',
      path: '/amenities',
      icon: Wrench
    },
    {
      name: 'Promo',
      path: '/promo',
      icon: Ticket
    },
    {
      name: 'Artikel',
      path: '/articles',
      icon: Newspaper
    },
    {
      name: 'Pelanggan',
      path: '/customers',
      icon: Users
    },
    {
      name: 'Keuangan',
      path: '/finance',
      icon: CreditCard
    },
    {
      name: 'Pengaturan',
      path: '/settings',
      icon: Settings
    }
  ];

  // Restrict certain nav items based on role
  const restrictedForStaff = ['/promo', '/articles', '/finance', '/settings'];
  const restrictedForFinance = ['/promo', '/articles', '/settings'];

  const filteredLinks = navLinks.filter(link => {
    if (userRole === 'staff' && restrictedForStaff.includes(link.path)) {
      return false;
    }
    if (userRole === 'finance' && restrictedForFinance.includes(link.path)) {
      return false;
    }
    return true;
  });

  const NavItem = ({ to, icon: Icon, children }) => {
    const isActive = location.pathname === to;
    return (
      <NavLink
        to={to}
        className={`group w-full flex items-center px-4 py-3.5 text-left rounded-xl transition-all duration-200 ${
          isActive
            ? 'bg-gradient-primary text-white shadow-lg transform scale-105 sidebar-active-glow'
            : 'text-primary-100 hover:text-white hover:bg-primary-600/30 hover:backdrop-blur-sm sidebar-hover-glow'
        }`}
      >
        <Icon className={`w-5 h-5 mr-4 ${isActive ? 'text-white' : 'text-primary-300 group-hover:text-white'}`} />
        <span className="font-medium">{children}</span>
      </NavLink>
    );
  };
  

  return (
    <div className="w-80 bg-gradient-to-b from-primary-700 to-primary-800 shadow-2xl relative min-h-screen flex flex-col">
      <div className="p-6 border-b border-primary-600/30">
        <div className="flex items-center justify-center">
          <img 
            src="/images/logo.png" 
            alt="UnionSpace Admin" 
            className="h-10 w-auto max-w-full object-contain brightness-0 invert"
          />
        </div>
        <div className="mt-3 text-center">
          <p className="text-primary-200 text-sm font-medium tracking-wide">Admin Panel</p>
          <div className="mt-2 w-16 h-0.5 bg-gradient-primary mx-auto rounded-full opacity-60"></div>
        </div>
      </div>
      
      <nav className="flex-grow p-4 space-y-2 overflow-y-auto">
        {filteredLinks.map((link) => (
          <NavItem key={link.path} to={link.path} icon={link.icon}>
            {link.name}
          </NavItem>
        ))}
      </nav>
      
      {/* Footer with User Profile */}
      <div className="p-4 border-t border-primary-600/30 bg-gradient-to-t from-primary-900/50 to-transparent">
        <div className="w-full p-3 rounded-lg bg-primary-600/20">
          <div className="flex items-center">
            <div className="w-10 h-10 rounded-full bg-gradient-primary flex items-center justify-center">
              <span className="text-white font-bold">{user?.email?.[0]?.toUpperCase() || 'A'}</span>
            </div>
            <div className="flex-1 ml-3">
              <p className="text-sm font-semibold text-white truncate">{user?.displayName || user?.email}</p>
              <p className="text-xs text-primary-300">Administrator</p>
            </div>
            <button onClick={logout} className="p-2 text-primary-200 hover:text-white hover:bg-primary-600/50 rounded-lg">
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Sidebar; 