import React, { useState } from 'react';
import { Routes, Route, NavLink, Navigate } from 'react-router-dom';
import { FileText, BarChart3, PieChart } from 'lucide-react';
import FinanceDashboard from './FinanceDashboard';
import Invoices from './Invoices';
import Reports from './Reports';

const Finance = () => {
  const subNavLinks = [
    {
      name: 'Dashboard',
      path: '/finance/dashboard',
      icon: PieChart
    },
    {
      name: 'Invoices',
      path: '/finance/invoices',
      icon: FileText
    },
    {
      name: 'Reports',
      path: '/finance/reports',
      icon: BarChart3
    }
  ];

  const SubNavItem = ({ to, icon: Icon, children }) => {
    return (
      <NavLink
        to={to}
        className={({ isActive }) =>
          `flex items-center px-4 py-2 text-sm font-medium rounded-md transition-colors ${
            isActive
              ? 'bg-primary text-white'
              : 'text-gray-700 hover:text-primary hover:bg-gray-100'
          }`
        }
      >
        <Icon className="w-4 h-4 mr-2" />
        {children}
      </NavLink>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200 px-6 py-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Finance</h1>
            <p className="text-sm text-gray-500">Manage invoices, payments, and financial reports</p>
          </div>
        </div>
      </div>

      {/* Sub Navigation */}
      <div className="bg-white shadow-sm border-b border-gray-200 px-6 py-3">
        <nav className="flex space-x-4">
          {subNavLinks.map((link) => (
            <SubNavItem key={link.path} to={link.path} icon={link.icon}>
              {link.name}
            </SubNavItem>
          ))}
        </nav>
      </div>

      {/* Content */}
      <div className="px-6">
        <Routes>
          <Route path="/" element={<Navigate to="/finance/dashboard" replace />} />
          <Route path="/dashboard" element={<FinanceDashboard />} />
          <Route path="/invoices" element={<Invoices />} />
          <Route path="/reports" element={<Reports />} />
        </Routes>
      </div>
    </div>
  );
};

export default Finance; 