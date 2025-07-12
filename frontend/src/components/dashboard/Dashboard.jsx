import React from 'react';
import { Calendar, DollarSign, Building2, Users, RefreshCw } from 'lucide-react';
import StatCard from '../common/StatCard.jsx';
import RecentOrders from './RecentOrders.jsx';
import QuickStats from './QuickStats.jsx';
import BookingStatusChart from './BookingStatusChart.jsx';
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


  const generateBookingStatusData = () => {
    const totalOrders = dashboardStats.overview?.totalOrders || 0;
    const pendingOrders = dashboardStats.overview?.pendingOrders || 0;
    const completedOrders = dashboardStats.overview?.completedOrders || 0;
    const confirmedOrders = dashboardStats.overview?.confirmedOrders || 0;
    const activeOrders = dashboardStats.overview?.activeOrders || 0;
    const cancelledOrders = dashboardStats.overview?.cancelledOrders || 0;
    
    if (totalOrders === 0) return [];
    
    // Use real data if available, otherwise fallback to calculation
    const actualTotal = pendingOrders + confirmedOrders + activeOrders + completedOrders + cancelledOrders;
    const useRealData = actualTotal > 0;
    
    if (useRealData) {
      // Use actual data from backend
      return [
        { status: 'pending', value: pendingOrders, total: actualTotal },
        { status: 'confirmed', value: confirmedOrders, total: actualTotal },
        { status: 'active', value: activeOrders, total: actualTotal },
        { status: 'completed', value: completedOrders, total: actualTotal },
        { status: 'cancelled', value: cancelledOrders, total: actualTotal },
      ].filter(item => item.value > 0); // Only show statuses with data
    } else {
      // Fallback calculation for partial data
      const remaining = totalOrders - pendingOrders - completedOrders;
      const confirmed = Math.floor(remaining * 0.6);
      const active = Math.floor(remaining * 0.3);
      const cancelled = remaining - confirmed - active;
      
      return [
        { status: 'pending', value: pendingOrders, total: totalOrders },
        { status: 'confirmed', value: confirmed, total: totalOrders },
        { status: 'active', value: active, total: totalOrders },
        { status: 'completed', value: completedOrders, total: totalOrders },
        { status: 'cancelled', value: Math.max(0, cancelled), total: totalOrders },
      ].filter(item => item.value > 0);
    }
  };


  return (
    <div className="space-y-6">
      {/* Header Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Bookings"
          value={dashboardStats.overview?.totalOrders || 0}
          icon={Calendar}
          color="bg-gradient-primary"
        />
        <StatCard
          title="Total Revenue"
          value={`Rp ${(dashboardStats.overview?.totalRevenue || 0).toLocaleString()}`}
          icon={DollarSign}
          color="bg-green-500"
        />
        <StatCard
          title="Active Spaces"
          value={dashboardStats.overview?.activeSpaces || 0}
          icon={Building2}
          color="bg-purple-500"
        />
        <StatCard
          title="Active Cities"
          value={dashboardStats.overview?.activeCities || 0}
          icon={Users}
          color="bg-orange-500"
        />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <BookingStatusChart data={generateBookingStatusData()} />
      </div>

      {/* Business Metrics */}
      <div className="grid grid-cols-2 xl:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Business Metrics</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 bg-blue-50 rounded-lg">
              <h4 className="font-medium text-blue-900 mb-2">Occupancy Rate</h4>
              <p className="text-2xl font-bold text-blue-600">{dashboardStats.performance?.occupancyRate || 0}%</p>
            </div>
            <div className="p-4 bg-green-50 rounded-lg">
              <h4 className="font-medium text-green-900 mb-2">Completion Rate</h4>
              <p className="text-2xl font-bold text-green-600">{dashboardStats.performance?.completionRate || 0}%</p>
            </div>
            <div className="p-4 bg-purple-50 rounded-lg">
              <h4 className="font-medium text-purple-900 mb-2">Avg Order Value</h4>
              <p className="text-2xl font-bold text-purple-600">Rp {(dashboardStats.performance?.averageOrderValue || 0).toLocaleString()}</p>
            </div>
            <div className="p-4 bg-orange-50 rounded-lg">
              <h4 className="font-medium text-orange-900 mb-2">Published Services</h4>
              <p className="text-2xl font-bold text-orange-600">{dashboardStats.overview?.publishedServices || 0}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Section */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-2">
          <RecentOrders recentOrders={orders} />
        </div>
        <QuickStats quickStats={qStats} />
      </div>

      {/* Performance Insights */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Performance Insights</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="p-4 bg-blue-50 rounded-lg">
            <h4 className="font-medium text-blue-900 mb-2">Revenue Performance</h4>
            <p className="text-sm text-blue-700">
              Total revenue: Rp {(dashboardStats.overview?.totalRevenue || 0).toLocaleString()} 
              from {dashboardStats.overview?.completedOrders || 0} completed orders.
            </p>
          </div>
          <div className="p-4 bg-green-50 rounded-lg">
            <h4 className="font-medium text-green-900 mb-2">Space Utilization</h4>
            <p className="text-sm text-green-700">
              {dashboardStats.overview?.activeSpaces || 0} of {dashboardStats.overview?.totalSpaces || 0} spaces are active 
              with {dashboardStats.performance?.occupancyRate || 0}% occupancy rate.
            </p>
          </div>
          <div className="p-4 bg-purple-50 rounded-lg">
            <h4 className="font-medium text-purple-900 mb-2">Order Management</h4>
            <p className="text-sm text-purple-700">
              {dashboardStats.overview?.pendingOrders || 0} pending orders need attention. 
              {dashboardStats.performance?.completionRate || 0}% completion rate.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard; 