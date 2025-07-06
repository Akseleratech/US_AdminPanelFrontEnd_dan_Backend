import React, { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, DollarSign, FileText, Clock, CheckCircle, AlertCircle } from 'lucide-react';
import StatCard from '../common/StatCard';
import LoadingSpinner from '../common/LoadingSpinner';

const FinanceDashboard = () => {
  const [dashboardData, setDashboardData] = useState({
    totalRevenue: 0,
    paidInvoices: 0,
    outstandingAmount: 0,
    overdueAmount: 0,
    totalInvoices: 0,
    recentInvoices: [],
    topCustomers: []
  });
  const [loading, setLoading] = useState(true);

  // Mock data for now - will be replaced with real API calls
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        setDashboardData({
          totalRevenue: 125000000,
          paidInvoices: 45,
          outstandingAmount: 35000000,
          overdueAmount: 8500000,
          totalInvoices: 52,
          recentInvoices: [
            { id: 'INV/2024/05/001', customer: 'PT. Teknologi Maju', amount: 2500000, status: 'paid', dueDate: '2024-05-15' },
            { id: 'INV/2024/05/002', customer: 'CV. Kreatif Digital', amount: 1800000, status: 'sent', dueDate: '2024-05-20' },
            { id: 'INV/2024/05/003', customer: 'Startup Inovasi', amount: 3200000, status: 'overdue', dueDate: '2024-05-10' }
          ],
          topCustomers: [
            { name: 'PT. Teknologi Maju', revenue: 15000000, invoices: 8 },
            { name: 'CV. Kreatif Digital', revenue: 12500000, invoices: 6 },
            { name: 'Startup Inovasi', revenue: 9800000, invoices: 5 }
          ]
        });
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const formatCurrency = (amount) => {
    return `Rp ${Number(amount).toLocaleString('id-ID')}`;
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'paid':
        return 'bg-green-100 text-green-800';
      case 'sent':
        return 'bg-blue-100 text-blue-800';
      case 'overdue':
        return 'bg-red-100 text-red-800';
      case 'draft':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'paid':
        return <CheckCircle className="w-3 h-3 mr-1" />;
      case 'sent':
        return <Clock className="w-3 h-3 mr-1" />;
      case 'overdue':
        return <AlertCircle className="w-3 h-3 mr-1" />;
      default:
        return <FileText className="w-3 h-3 mr-1" />;
    }
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Revenue"
          value={formatCurrency(dashboardData.totalRevenue)}
          icon={DollarSign}
          trend="up"
          trendValue="12.5%"
          color="green"
        />
        <StatCard
          title="Paid Invoices"
          value={dashboardData.paidInvoices}
          icon={CheckCircle}
          trend="up"
          trendValue="8.2%"
          color="blue"
        />
        <StatCard
          title="Outstanding"
          value={formatCurrency(dashboardData.outstandingAmount)}
          icon={Clock}
          trend="down"
          trendValue="3.1%"
          color="yellow"
        />
        <StatCard
          title="Overdue"
          value={formatCurrency(dashboardData.overdueAmount)}
          icon={AlertCircle}
          trend="down"
          trendValue="15.3%"
          color="red"
        />
      </div>

      {/* Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Invoices */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Invoices</h3>
          <div className="space-y-3">
            {dashboardData.recentInvoices.map((invoice) => (
              <div key={invoice.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-gray-900">{invoice.id}</span>
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(invoice.status)}`}>
                      {getStatusIcon(invoice.status)}
                      {invoice.status}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600">{invoice.customer}</p>
                  <div className="flex items-center justify-between mt-1">
                    <span className="text-sm font-medium text-gray-900">{formatCurrency(invoice.amount)}</span>
                    <span className="text-xs text-gray-500">Due: {invoice.dueDate}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Top Customers */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Customers by Revenue</h3>
          <div className="space-y-3">
            {dashboardData.topCustomers.map((customer, index) => (
              <div key={customer.name} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center">
                  <div className="w-8 h-8 bg-primary text-white rounded-full flex items-center justify-center text-sm font-medium mr-3">
                    {index + 1}
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{customer.name}</p>
                    <p className="text-sm text-gray-600">{customer.invoices} invoices</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-medium text-gray-900">{formatCurrency(customer.revenue)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button className="flex items-center justify-center px-4 py-3 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors">
            <FileText className="w-5 h-5 mr-2" />
            Create Invoice
          </button>
          <button className="flex items-center justify-center px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
            <DollarSign className="w-5 h-5 mr-2" />
            Record Payment
          </button>
          <button className="flex items-center justify-center px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
            <TrendingUp className="w-5 h-5 mr-2" />
            View Reports
          </button>
        </div>
      </div>
    </div>
  );
};

export default FinanceDashboard; 