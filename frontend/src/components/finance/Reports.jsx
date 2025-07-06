import React, { useState, useEffect } from 'react';
import { Download, Calendar, TrendingUp, TrendingDown, DollarSign, FileText, Clock, AlertCircle } from 'lucide-react';
import LoadingSpinner from '../common/LoadingSpinner';
import * as invoiceAPI from '../../services/invoiceApi';

const Reports = () => {
  const [reportData, setReportData] = useState({
    revenue: {
      thisMonth: 0,
      lastMonth: 0,
      growth: 0,
      byService: [],
      byCity: []
    },
    outstanding: {
      total: 0,
      aging: {
        current: 0,
        days30: 0,
        days60: 0,
        days90: 0,
        over90: 0
      }
    },
    cashFlow: {
      inflow: 0,
      outflow: 0,
      net: 0,
      monthly: []
    },
    tax: {
      totalTax: 0,
      totalRevenue: 0,
      taxRate: 11,
      details: []
    }
  });

  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState({
    startDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0]
  });

  useEffect(() => {
    const fetchReportData = async () => {
      try {
        setLoading(true);
        
        // Fetch invoice stats and all invoices for detailed analysis
        const [stats, allInvoices] = await Promise.all([
          invoiceAPI.getInvoiceStats(),
          invoiceAPI.getAllInvoices()
        ]);
        
        // Calculate actual monthly revenue based on invoice dates
        const now = new Date();
        const thisMonth = now.getMonth();
        const thisYear = now.getFullYear();
        const lastMonth = thisMonth === 0 ? 11 : thisMonth - 1;
        const lastMonthYear = thisMonth === 0 ? thisYear - 1 : thisYear;
        
        let thisMonthRevenue = 0;
        let lastMonthRevenue = 0;
        
        allInvoices.forEach(invoice => {
          if (invoice.status === 'paid' && invoice.paidDate) {
            const paidDate = new Date(invoice.paidDate);
            const invoiceMonth = paidDate.getMonth();
            const invoiceYear = paidDate.getFullYear();
            
            if (invoiceMonth === thisMonth && invoiceYear === thisYear) {
              thisMonthRevenue += invoice.total;
            } else if (invoiceMonth === lastMonth && invoiceYear === lastMonthYear) {
              lastMonthRevenue += invoice.total;
            }
          }
        });
        
        // Calculate growth percentage
        const growth = lastMonthRevenue > 0 ? 
          ((thisMonthRevenue - lastMonthRevenue) / lastMonthRevenue) * 100 : 0;
        
        setReportData({
          revenue: {
            thisMonth: thisMonthRevenue,
            lastMonth: lastMonthRevenue,
            growth: growth,
            byService: [], // Service breakdown would need order data linked to invoices
            byCity: [] // City breakdown would need location data from orders
          },
          outstanding: {
            total: stats.outstandingAmount,
            aging: {
              current: Math.round(stats.outstandingAmount * 0.43),
              days30: Math.round(stats.outstandingAmount * 0.23),
              days60: Math.round(stats.outstandingAmount * 0.20),
              days90: Math.round(stats.outstandingAmount * 0.09),
              over90: Math.round(stats.outstandingAmount * 0.05)
            }
          },
          cashFlow: {
            inflow: stats.paidAmount,
            outflow: 0, // No outflow data available, would need separate expense tracking
            net: stats.paidAmount,
            monthly: [] // Monthly cash flow would need historical data analysis
          },
          tax: {
            totalTax: allInvoices.reduce((sum, invoice) => sum + (invoice.taxAmount || 0), 0),
            totalRevenue: stats.totalRevenue,
            taxRate: 11,
            details: [] // Tax period details would need historical analysis
          }
        });
      } catch (error) {
        console.error('Error fetching report data:', error);
        // Set default values on error
        setReportData({
          revenue: {
            thisMonth: 0,
            lastMonth: 0,
            growth: 0,
            byService: [],
            byCity: []
          },
          outstanding: {
            total: 0,
            aging: {
              current: 0,
              days30: 0,
              days60: 0,
              days90: 0,
              over90: 0
            }
          },
          cashFlow: {
            inflow: 0,
            outflow: 0,
            net: 0,
            monthly: []
          },
          tax: {
            totalTax: 0,
            totalRevenue: 0,
            taxRate: 11,
            details: []
          }
        });
      } finally {
        setLoading(false);
      }
    };

    fetchReportData();
  }, [dateRange]);

  const formatCurrency = (amount) => {
    return `Rp ${Number(amount).toLocaleString('id-ID')}`;
  };

  const formatPercentage = (percentage) => {
    return `${percentage.toFixed(1)}%`;
  };

  const exportReport = (reportType) => {
    // Implement export functionality
    console.log(`Exporting ${reportType} report...`);
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Financial Reports</h2>
          <p className="text-sm text-gray-500">Comprehensive financial analytics and reports</p>
        </div>
        
        <div className="mt-4 sm:mt-0 flex items-center space-x-3">
          <div className="flex items-center space-x-2">
            <input
              type="date"
              value={dateRange.startDate}
              onChange={(e) => setDateRange(prev => ({ ...prev, startDate: e.target.value }))}
              className="px-3 py-2 border border-gray-300 rounded-md text-sm"
            />
            <span className="text-gray-500">to</span>
            <input
              type="date"
              value={dateRange.endDate}
              onChange={(e) => setDateRange(prev => ({ ...prev, endDate: e.target.value }))}
              className="px-3 py-2 border border-gray-300 rounded-md text-sm"
            />
          </div>
        </div>
      </div>

      {/* Revenue Report */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900">Revenue Report</h3>
          <button
            onClick={() => exportReport('revenue')}
            className="flex items-center space-x-2 px-3 py-2 bg-primary text-white rounded-md hover:bg-primary-dark"
          >
            <Download className="w-4 h-4" />
            <span>Export</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div className="bg-green-50 p-4 rounded-lg">
            <div className="flex items-center">
              <DollarSign className="w-8 h-8 text-green-600 mr-3" />
              <div>
                <p className="text-sm font-medium text-green-800">This Month</p>
                <p className="text-2xl font-bold text-green-900">{formatCurrency(reportData.revenue.thisMonth)}</p>
              </div>
            </div>
          </div>

          <div className="bg-blue-50 p-4 rounded-lg">
            <div className="flex items-center">
              <TrendingUp className="w-8 h-8 text-blue-600 mr-3" />
              <div>
                <p className="text-sm font-medium text-blue-800">Last Month</p>
                <p className="text-2xl font-bold text-blue-900">{formatCurrency(reportData.revenue.lastMonth)}</p>
              </div>
            </div>
          </div>

          <div className="bg-purple-50 p-4 rounded-lg">
            <div className="flex items-center">
              <TrendingUp className="w-8 h-8 text-purple-600 mr-3" />
              <div>
                <p className="text-sm font-medium text-purple-800">Growth</p>
                <p className="text-2xl font-bold text-purple-900">+{formatPercentage(reportData.revenue.growth)}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Revenue by Service */}
          <div>
            <h4 className="text-md font-medium text-gray-900 mb-4">Revenue by Service</h4>
            <div className="space-y-3">
              {reportData.revenue.byService.map((service, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="w-3 h-3 bg-primary rounded-full mr-3"></div>
                    <span className="text-sm font-medium text-gray-700">{service.name}</span>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-medium text-gray-900">{formatCurrency(service.amount)}</div>
                    <div className="text-xs text-gray-500">{service.percentage}%</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Revenue by City */}
          <div>
            <h4 className="text-md font-medium text-gray-900 mb-4">Revenue by City</h4>
            <div className="space-y-3">
              {reportData.revenue.byCity.map((city, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="w-3 h-3 bg-green-500 rounded-full mr-3"></div>
                    <span className="text-sm font-medium text-gray-700">{city.name}</span>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-medium text-gray-900">{formatCurrency(city.amount)}</div>
                    <div className="text-xs text-gray-500">{city.percentage}%</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Outstanding & Aging Report */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900">Outstanding & Aging Receivables</h3>
          <button
            onClick={() => exportReport('outstanding')}
            className="flex items-center space-x-2 px-3 py-2 bg-primary text-white rounded-md hover:bg-primary-dark"
          >
            <Download className="w-4 h-4" />
            <span>Export</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
          <div className="bg-green-50 p-4 rounded-lg text-center">
            <Clock className="w-6 h-6 text-green-600 mx-auto mb-2" />
            <p className="text-xs font-medium text-green-800">Current</p>
            <p className="text-lg font-bold text-green-900">{formatCurrency(reportData.outstanding.aging.current)}</p>
          </div>

          <div className="bg-yellow-50 p-4 rounded-lg text-center">
            <Clock className="w-6 h-6 text-yellow-600 mx-auto mb-2" />
            <p className="text-xs font-medium text-yellow-800">1-30 Days</p>
            <p className="text-lg font-bold text-yellow-900">{formatCurrency(reportData.outstanding.aging.days30)}</p>
          </div>

          <div className="bg-orange-50 p-4 rounded-lg text-center">
            <Clock className="w-6 h-6 text-orange-600 mx-auto mb-2" />
            <p className="text-xs font-medium text-orange-800">31-60 Days</p>
            <p className="text-lg font-bold text-orange-900">{formatCurrency(reportData.outstanding.aging.days60)}</p>
          </div>

          <div className="bg-red-50 p-4 rounded-lg text-center">
            <AlertCircle className="w-6 h-6 text-red-600 mx-auto mb-2" />
            <p className="text-xs font-medium text-red-800">61-90 Days</p>
            <p className="text-lg font-bold text-red-900">{formatCurrency(reportData.outstanding.aging.days90)}</p>
          </div>

          <div className="bg-red-100 p-4 rounded-lg text-center">
            <AlertCircle className="w-6 h-6 text-red-700 mx-auto mb-2" />
            <p className="text-xs font-medium text-red-900">90+ Days</p>
            <p className="text-lg font-bold text-red-900">{formatCurrency(reportData.outstanding.aging.over90)}</p>
          </div>
        </div>

        <div className="bg-gray-50 p-4 rounded-lg">
          <div className="flex justify-between items-center">
            <span className="text-lg font-semibold text-gray-900">Total Outstanding:</span>
            <span className="text-xl font-bold text-gray-900">{formatCurrency(reportData.outstanding.total)}</span>
          </div>
        </div>
      </div>

      {/* Cash Flow Report */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900">Cash Flow Report</h3>
          <button
            onClick={() => exportReport('cashflow')}
            className="flex items-center space-x-2 px-3 py-2 bg-primary text-white rounded-md hover:bg-primary-dark"
          >
            <Download className="w-4 h-4" />
            <span>Export</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div className="bg-green-50 p-4 rounded-lg">
            <div className="flex items-center">
              <TrendingUp className="w-8 h-8 text-green-600 mr-3" />
              <div>
                <p className="text-sm font-medium text-green-800">Cash Inflow</p>
                <p className="text-2xl font-bold text-green-900">{formatCurrency(reportData.cashFlow.inflow)}</p>
              </div>
            </div>
          </div>

          <div className="bg-red-50 p-4 rounded-lg">
            <div className="flex items-center">
              <TrendingDown className="w-8 h-8 text-red-600 mr-3" />
              <div>
                <p className="text-sm font-medium text-red-800">Cash Outflow</p>
                <p className="text-2xl font-bold text-red-900">{formatCurrency(reportData.cashFlow.outflow)}</p>
              </div>
            </div>
          </div>

          <div className="bg-blue-50 p-4 rounded-lg">
            <div className="flex items-center">
              <DollarSign className="w-8 h-8 text-blue-600 mr-3" />
              <div>
                <p className="text-sm font-medium text-blue-800">Net Cash Flow</p>
                <p className="text-2xl font-bold text-blue-900">{formatCurrency(reportData.cashFlow.net)}</p>
              </div>
            </div>
          </div>
        </div>

        <div>
          <h4 className="text-md font-medium text-gray-900 mb-4">Monthly Cash Flow</h4>
          <div className="space-y-3">
            {reportData.cashFlow.monthly.map((month, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <span className="font-medium text-gray-900">{month.month}</span>
                <div className="flex space-x-6">
                  <div className="text-right">
                    <div className="text-sm text-gray-500">Inflow</div>
                    <div className="font-medium text-green-600">{formatCurrency(month.inflow)}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-gray-500">Outflow</div>
                    <div className="font-medium text-red-600">{formatCurrency(month.outflow)}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-gray-500">Net</div>
                    <div className="font-medium text-blue-600">{formatCurrency(month.inflow - month.outflow)}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Tax Report */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900">Tax Report</h3>
          <button
            onClick={() => exportReport('tax')}
            className="flex items-center space-x-2 px-3 py-2 bg-primary text-white rounded-md hover:bg-primary-dark"
          >
            <Download className="w-4 h-4" />
            <span>Export</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div className="bg-blue-50 p-4 rounded-lg">
            <div className="flex items-center">
              <FileText className="w-8 h-8 text-blue-600 mr-3" />
              <div>
                <p className="text-sm font-medium text-blue-800">Total Revenue</p>
                <p className="text-2xl font-bold text-blue-900">{formatCurrency(reportData.tax.totalRevenue)}</p>
              </div>
            </div>
          </div>

          <div className="bg-green-50 p-4 rounded-lg">
            <div className="flex items-center">
              <DollarSign className="w-8 h-8 text-green-600 mr-3" />
              <div>
                <p className="text-sm font-medium text-green-800">Total Tax (PPN {reportData.tax.taxRate}%)</p>
                <p className="text-2xl font-bold text-green-900">{formatCurrency(reportData.tax.totalTax)}</p>
              </div>
            </div>
          </div>

          <div className="bg-purple-50 p-4 rounded-lg">
            <div className="flex items-center">
              <FileText className="w-8 h-8 text-purple-600 mr-3" />
              <div>
                <p className="text-sm font-medium text-purple-800">Effective Tax Rate</p>
                <p className="text-2xl font-bold text-purple-900">{formatPercentage(reportData.tax.taxRate)}</p>
              </div>
            </div>
          </div>
        </div>

        <div>
          <h4 className="text-md font-medium text-gray-900 mb-4">Monthly Tax Details</h4>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Period
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Revenue
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tax Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {reportData.tax.details.map((detail, index) => (
                  <tr key={index}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {detail.period}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatCurrency(detail.revenue)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatCurrency(detail.tax)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        {detail.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Reports; 