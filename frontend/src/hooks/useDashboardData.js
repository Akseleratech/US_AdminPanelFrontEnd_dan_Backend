import { useState, useEffect, useCallback } from 'react';
import { dashboardAPI } from '../services/api';

const useDashboardData = () => {
  const [stats, setStats] = useState(null);
  const [recentOrders, setRecentOrders] = useState([]);
  const [quickStats, setQuickStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // Fetch all dashboard data in parallel
      const [statsRes, recentOrdersRes, quickStatsRes] = await Promise.all([
        dashboardAPI.getStats(),
        dashboardAPI.getRecentOrders(),
        dashboardAPI.getQuickStats()
      ]);

      setStats(statsRes.data);
      setRecentOrders(recentOrdersRes.data.orders);
      setQuickStats(quickStatsRes.data);

    } catch (err) {
      setError('Failed to fetch dashboard data. Please try again later.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { stats, recentOrders, quickStats, loading, error, refreshData: fetchData };
};

export default useDashboardData;
