import React from 'react';
import { Calendar, DollarSign, Building2, Users } from 'lucide-react';
import StatCard from '../common/StatCard.jsx';
import RecentOrders from './RecentOrders.jsx';
import QuickStats from './QuickStats.jsx';

const Dashboard = ({ dashboardStats, recentOrders, quickStats }) => {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Bookings"
          value={dashboardStats.totalBookings || 0}
          icon={Calendar}
          color="bg-blue-500"
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
        <RecentOrders recentOrders={recentOrders} />
        <QuickStats quickStats={quickStats} />
      </div>
    </div>
  );
};

export default Dashboard; 