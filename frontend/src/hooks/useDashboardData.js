import { useState, useEffect, useCallback, useRef } from 'react';
import { dashboardAPI } from '../services/api';

const useDashboardData = () => {
  const [stats, setStats] = useState(null);
  const [recentOrders, setRecentOrders] = useState([]);
  const [quickStats, setQuickStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const intervalRef = useRef(null);

  const fetchData = useCallback(async (isBackgroundRefresh = false) => {
    if (!isBackgroundRefresh) {
      setLoading(true);
    }
    setError(null);
    try {
      // Fetch all dashboard data in parallel
      const [statsRes, recentOrdersRes, quickStatsRes] = await Promise.all([
        dashboardAPI.getStats(),
        dashboardAPI.getRecentOrders(),
        dashboardAPI.getQuickStats()
      ]);

      setStats(statsRes.data);
      setRecentOrders(recentOrdersRes.data);
      setQuickStats(quickStatsRes.data);

    } catch (err) {
      setError('Failed to fetch dashboard data. Please try again later.');
      console.error(err);
    } finally {
      if (!isBackgroundRefresh) {
        setLoading(false);
      }
    }
  }, []);

  // Auto-refresh every 30 seconds for webhook updates
  useEffect(() => {
    fetchData();
    
    // Set up auto-refresh interval
    intervalRef.current = setInterval(() => {
      fetchData(true); // Background refresh
    }, 30000); // 30 seconds

    // Cleanup interval on unmount
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [fetchData]);

  return { stats, recentOrders, quickStats, loading, error, refreshData: fetchData };
};

export default useDashboardData;
