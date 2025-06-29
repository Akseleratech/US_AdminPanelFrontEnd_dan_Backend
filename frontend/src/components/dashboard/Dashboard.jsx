import React from 'react';
import { Calendar, DollarSign, Building2, Users, RefreshCw } from 'lucide-react';
import StatCard from '../common/StatCard.jsx';
import RecentOrders from './RecentOrders.jsx';
import QuickStats from './QuickStats.jsx';
import useDashboardData from '../../hooks/useDashboardData.js';
import LoadingSpinner from '../common/LoadingSpinner.jsx';

const Dashboard = () => {
  const { stats, recentOrders, quickStats, loading, error, refreshData } = useDashboardData();

  if (loading) {
    return <LoadingSpinner />;
  }

  if (error) {
    return (
      <div className="text-center py-10">
        <p className="text-red-500">{error}</p>
        <button 
          onClick={refreshData} 
          className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-md flex items-center mx-auto"
        >
          <RefreshCw className="w-4 h-4 mr-2" />
          Try Again
        </button>
      </div>
    );
  }

  // Fallback to default values if data is not available
  const dashboardStats = stats || {};
  const orders = recentOrders || [];
  const qStats = quickStats || {};

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Bookings"
          value={dashboardStats.totalBookings || 0}
          icon={Calendar}
          color="bg-gradient-primary"
        />
        <StatCard
          title="Total Revenue"
          value={`Rp ${(dashboardStats.totalRevenue || 0).toLocaleString()}`}
          icon={DollarSign}
          color="bg-green-500"
        />
        <StatCard
          title="Active Spaces"
          value={dashboardStats.activeSpaces || 0}
          icon={Building2}
          color="bg-purple-500"
        />
        <StatCard
          title="Total Users"
          value={dashboardStats.totalUsers || 0}
          icon={Users}
          color="bg-orange-500"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <RecentOrders recentOrders={orders} />
        <QuickStats quickStats={qStats} />
      </div>
    </div>
  );
};

export default Dashboard; 