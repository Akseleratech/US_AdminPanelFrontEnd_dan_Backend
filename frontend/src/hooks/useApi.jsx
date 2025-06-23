import { useState, useEffect, useCallback } from 'react';
import { dashboardAPI, ordersAPI, citiesAPI, servicesAPI } from '../services/api.jsx';

export const useApi = (activeTab) => {
  const [loading, setLoading] = useState(false);
  
  // State for data
  const [dashboardStats, setDashboardStats] = useState({});
  const [recentOrders, setRecentOrders] = useState([]);
  const [quickStats, setQuickStats] = useState({});
  const [orders, setOrders] = useState([]);
  const [cities, setCities] = useState([]);
  const [services, setServices] = useState([]);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      if (activeTab === 'dashboard') {
        const [statsRes, ordersRes, quickStatsRes] = await Promise.all([
          dashboardAPI.getStats(),
          dashboardAPI.getRecentOrders(5),
          dashboardAPI.getQuickStats()
        ]);
        setDashboardStats(statsRes.data);
        setRecentOrders(ordersRes.data);
        setQuickStats(quickStatsRes.data);
      } else if (activeTab === 'orders') {
        const ordersRes = await ordersAPI.getAll();
        setOrders(ordersRes.data);
      } else if (activeTab === 'cities') {
        const citiesRes = await citiesAPI.getAll();
        setCities(citiesRes.data);
      } else if (activeTab === 'services') {
        const servicesRes = await servicesAPI.getAll();
        setServices(servicesRes.data);
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  }, [activeTab]);

  // Load data on component mount and tab change
  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleDelete = async (type, id) => {
    if (!window.confirm('Are you sure you want to delete this item?')) return;
    
    try {
      if (type === 'city') {
        await citiesAPI.delete(id);
        setCities(cities.filter(c => c.id !== id));
      } else if (type === 'service') {
        await servicesAPI.delete(id);
        setServices(services.filter(s => s.id !== id));
      }
    } catch (error) {
      console.error('Error deleting item:', error);
      alert('Failed to delete item');
    }
  };

  return {
    loading,
    dashboardStats,
    recentOrders,
    quickStats,
    orders,
    cities,
    services,
    handleDelete,
    loadData
  };
}; 