import React, { useState, useEffect } from 'react';
import { Download, Calendar, TrendingUp, TrendingDown, DollarSign, FileText, Clock, AlertCircle } from 'lucide-react';
import LoadingSpinner from '../common/LoadingSpinner';
import * as invoiceAPI from '../../services/invoiceApi';
import { useTaxRate } from '../../contexts/TaxRateContext.jsx';
import useLayanan from '../../hooks/useLayanan.js';
import useSpaces from '../../hooks/useSpaces.js';

const Reports = () => {
  const currentTaxRate = useTaxRate();
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
      taxRate: currentTaxRate,
      details: []
    }
  });

  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState({
    startDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0]
  });

  // Fetch layanan list for ID→name mapping
  const { layananList } = useLayanan();
  const { spaces } = useSpaces();

  useEffect(() => {
    const fetchReportData = async () => {
      try {
        setLoading(true);
        
        // Fetch all necessary data
        const [invoiceStats, allInvoices] = await Promise.all([
          invoiceAPI.getInvoiceStats(),
          invoiceAPI.getAllInvoices()
        ]);
        
        // Calculate revenue data
        const now = new Date();
        const thisMonth = now.getMonth();
        const thisYear = now.getFullYear();
        const lastMonth = thisMonth === 0 ? 11 : thisMonth - 1;
        const lastMonthYear = thisMonth === 0 ? thisYear - 1 : thisYear;
        
        let thisMonthRevenue = 0;
        let lastMonthRevenue = 0;
        const serviceRevenue = {};
        const cityRevenue = {};
        
        // Calculate revenue by month and collect service/city data
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
        
        // Get service and city data from paid invoices
        allInvoices.forEach(invoice => {
          if (invoice.status === 'paid') {
            // Service revenue - use serviceName from invoice if available
            const serviceName = invoice.serviceName || invoice.spaceName || 'Unknown Service';
            serviceRevenue[serviceName] = (serviceRevenue[serviceName] || 0) + invoice.total;
            
            // City revenue - use cityName from invoice if available
            const cityName = invoice.cityName || 'Unknown City';
            cityRevenue[cityName] = (cityRevenue[cityName] || 0) + invoice.total;
          }
        });
        
        // Convert service and city revenue to arrays with percentages
        const totalPaidRevenue = thisMonthRevenue + lastMonthRevenue;
        
        // Helper to map service ID to readable name
        const mapServiceName = (raw) => {
          console.log('🔍 mapServiceName input:', raw);
          console.log('🔍 layananList available:', layananList?.length || 0, 'items');
          console.log('🔍 spaces available:', spaces?.length || 0, 'items');
          
          // 1) Direct match to layanan ID
          if (Array.isArray(layananList)) {
            const found = layananList.find((l) => l.id === raw);
            if (found && found.name) {
              console.log('✅ Direct layanan match:', found.name);
              return found.name;
            }
          }

          // 2) Interpret as spaceId, resolve to space.category then layanan name
          if (Array.isArray(spaces)) {
            const sp = spaces.find((s) => s.id === raw);
            if (sp) {
              console.log('🔍 Found space:', sp.name, 'category:', sp.category);
              const catId = sp.category || sp.serviceName;
              if (catId && Array.isArray(layananList)) {
                const lay = layananList.find((l) => l.id === catId);
                if (lay && lay.name) {
                  console.log('✅ Space->layanan match:', lay.name);
                  return lay.name;
                }
              }
              // fallback to readable space name without codes
              if (sp.name) {
                console.log('✅ Using space name:', sp.name);
                return sp.name;
              }
            }
          }

          // 3) Fallback original
          console.log('⚠️ No match found, using original:', raw);
          return raw;
        };

        const byService = Object.entries(serviceRevenue)
          .map(([rawName, amount]) => ({
            name: mapServiceName(rawName),
            amount,
            percentage: totalPaidRevenue > 0 ? ((amount / totalPaidRevenue) * 100).toFixed(1) : 0
          }))
          .sort((a, b) => b.amount - a.amount)
          .slice(0, 5); // Top 5 services
          
        const byCity = Object.entries(cityRevenue)
          .map(([name, amount]) => ({
            name,
            amount,
            percentage: totalPaidRevenue > 0 ? ((amount / totalPaidRevenue) * 100).toFixed(1) : 0
          }))
          .sort((a, b) => b.amount - a.amount)
          .slice(0, 5); // Top 5 cities
        
        // Calculate growth percentage
        const growth = lastMonthRevenue > 0 ? 
          ((thisMonthRevenue - lastMonthRevenue) / lastMonthRevenue) * 100 : 0;
        
        // Calculate outstanding aging
        const outstandingInvoices = allInvoices.filter(invoice => 
          invoice.status !== 'paid' && invoice.status !== 'cancelled'
        );
        
        const aging = {
          current: 0,
          days30: 0,
          days60: 0,
          days90: 0,
          over90: 0
        };
        
        outstandingInvoices.forEach(invoice => {
          const dueDate = new Date(invoice.dueDate);
          const daysPastDue = Math.floor((now - dueDate) / (1000 * 60 * 60 * 24));
          
          if (daysPastDue <= 0) {
            aging.current += invoice.total;
          } else if (daysPastDue <= 30) {
            aging.days30 += invoice.total;
          } else if (daysPastDue <= 60) {
            aging.days60 += invoice.total;
          } else if (daysPastDue <= 90) {
            aging.days90 += invoice.total;
          } else {
            aging.over90 += invoice.total;
          }
        });
        
        // Calculate monthly cash flow for the last 6 months
        const monthlyData = [];
        for (let i = 5; i >= 0; i--) {
          const date = new Date(thisYear, thisMonth - i, 1);
          const monthName = date.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });
          
          const monthlyInflow = allInvoices
            .filter(invoice => {
              if (invoice.status !== 'paid' || !invoice.paidDate) return false;
              const paidDate = new Date(invoice.paidDate);
              return paidDate.getMonth() === date.getMonth() && paidDate.getFullYear() === date.getFullYear();
            })
            .reduce((sum, invoice) => sum + invoice.total, 0);
          
          monthlyData.push({
            month: monthName,
            inflow: monthlyInflow,
            outflow: 0, // No outflow data available
            net: monthlyInflow
          });
        }
        
        // Calculate tax data
        const totalTax = allInvoices.reduce((sum, invoice) => sum + (invoice.taxAmount || 0), 0);
        const totalRevenue = allInvoices
          .filter(invoice => invoice.status === 'paid')
          .reduce((sum, invoice) => sum + invoice.total, 0);
        
        // Generate monthly tax details for the last 6 months
        const taxDetails = [];
        for (let i = 5; i >= 0; i--) {
          const date = new Date(thisYear, thisMonth - i, 1);
          const monthName = date.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });
          
          const monthlyRevenue = allInvoices
            .filter(invoice => {
              if (invoice.status !== 'paid' || !invoice.paidDate) return false;
              const paidDate = new Date(invoice.paidDate);
              return paidDate.getMonth() === date.getMonth() && paidDate.getFullYear() === date.getFullYear();
            })
            .reduce((sum, invoice) => sum + invoice.total, 0);
          
          const monthlyTax = allInvoices
            .filter(invoice => {
              if (invoice.status !== 'paid' || !invoice.paidDate) return false;
              const paidDate = new Date(invoice.paidDate);
              return paidDate.getMonth() === date.getMonth() && paidDate.getFullYear() === date.getFullYear();
            })
            .reduce((sum, invoice) => sum + (invoice.taxAmount || 0), 0);
          
          if (monthlyRevenue > 0) {
            taxDetails.push({
              period: monthName,
              revenue: monthlyRevenue,
              tax: monthlyTax,
              status: 'Reported'
            });
          }
        }
        
        setReportData({
          revenue: {
            thisMonth: thisMonthRevenue,
            lastMonth: lastMonthRevenue,
            growth: growth,
            byService: byService,
            byCity: byCity
          },
          outstanding: {
            total: invoiceStats.outstandingAmount,
            aging: aging
          },
          cashFlow: {
            inflow: invoiceStats.paidAmount,
            outflow: 0, // No outflow data available
            net: invoiceStats.paidAmount,
            monthly: monthlyData
          },
          tax: {
            totalTax: totalTax,
            totalRevenue: totalRevenue,
            taxRate: currentTaxRate,
            details: taxDetails
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
            taxRate: currentTaxRate,
            details: []
          }
        });
      } finally {
        setLoading(false);
      }
    };

    fetchReportData();
  }, [dateRange, layananList, spaces]);

  const formatCurrency = (amount) => {
    return `Rp ${Number(amount).toLocaleString('id-ID')}`;
  };

  const formatPercentage = (percentage) => {
    return `${percentage.toFixed(1)}%`;
  };

  const exportReport = (reportType) => {
    // Create CSV content based on report type
    let csvContent = '';
    let filename = '';
    
    switch (reportType) {
      case 'revenue':
        csvContent = 'data:text/csv;charset=utf-8,';
        csvContent += 'Revenue Report\n';
        csvContent += `This Month,${reportData.revenue.thisMonth}\n`;
        csvContent += `Last Month,${reportData.revenue.lastMonth}\n`;
        csvContent += `Growth,${reportData.revenue.growth.toFixed(1)}%\n\n`;
        csvContent += 'Service,Amount,Percentage\n';
        reportData.revenue.byService.forEach(service => {
          csvContent += `${service.name},${service.amount},${service.percentage}%\n`;
        });
        csvContent += '\nCity,Amount,Percentage\n';
        reportData.revenue.byCity.forEach(city => {
          csvContent += `${city.name},${city.amount},${city.percentage}%\n`;
        });
        filename = 'revenue_report.csv';
        break;
      
      case 'outstanding':
        csvContent = 'data:text/csv;charset=utf-8,';
        csvContent += 'Outstanding & Aging Report\n';
        csvContent += `Total Outstanding,${reportData.outstanding.total}\n\n`;
        csvContent += 'Aging Category,Amount\n';
        csvContent += `Current,${reportData.outstanding.aging.current}\n`;
        csvContent += `1-30 Days,${reportData.outstanding.aging.days30}\n`;
        csvContent += `31-60 Days,${reportData.outstanding.aging.days60}\n`;
        csvContent += `61-90 Days,${reportData.outstanding.aging.days90}\n`;
        csvContent += `90+ Days,${reportData.outstanding.aging.over90}\n`;
        filename = 'outstanding_report.csv';
        break;
      
      case 'cashflow':
        csvContent = 'data:text/csv;charset=utf-8,';
        csvContent += 'Cash Flow Report\n';
        csvContent += `Total Inflow,${reportData.cashFlow.inflow}\n`;
        csvContent += `Total Outflow,${reportData.cashFlow.outflow}\n`;
        csvContent += `Net Cash Flow,${reportData.cashFlow.net}\n\n`;
        csvContent += 'Month,Inflow,Outflow,Net\n';
        reportData.cashFlow.monthly.forEach(month => {
          csvContent += `${month.month},${month.inflow},${month.outflow},${month.inflow - month.outflow}\n`;
        });
        filename = 'cashflow_report.csv';
        break;
      
      case 'tax':
        csvContent = 'data:text/csv;charset=utf-8,';
        csvContent += 'Tax Report\n';
        csvContent += `Total Revenue,${reportData.tax.totalRevenue}\n`;
        csvContent += `Total Tax,${reportData.tax.totalTax}\n`;
        csvContent += `Tax Rate,${reportData.tax.taxRate}%\n\n`;
        csvContent += 'Period,Revenue,Tax,Status\n';
        reportData.tax.details.forEach(detail => {
          csvContent += `${detail.period},${detail.revenue},${detail.tax},${detail.status}\n`;
        });
        filename = 'tax_report.csv';
        break;
      
      default:
        console.log(`Exporting ${reportType} report...`);
        return;
    }
    
    // Create and download the file
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Laporan Keuangan</h2>
          <p className="text-sm text-gray-500">Analisis dan laporan keuangan komprehensif</p>
        </div>
        
        <div className="mt-4 sm:mt-0 flex items-center space-x-3 bg-white rounded-lg p-4 shadow-sm border border-gray-200">
          <div className="flex items-center space-x-2">
            <input
              type="date"
              value={dateRange.startDate}
              onChange={(e) => setDateRange(prev => ({ ...prev, startDate: e.target.value }))}
              className="px-3 py-2 border border-gray-300 rounded-md text-sm"
            />
            <span className="text-gray-500">sampai</span>
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
          <h3 className="text-lg font-semibold text-gray-900">Laporan Pendapatan</h3>
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
                <p className="text-sm font-medium text-green-800">Bulan Ini</p>
                <p className="text-2xl font-bold text-green-900">{formatCurrency(reportData.revenue.thisMonth)}</p>
              </div>
            </div>
          </div>

          <div className="bg-blue-50 p-4 rounded-lg">
            <div className="flex items-center">
              <TrendingUp className="w-8 h-8 text-blue-600 mr-3" />
              <div>
                <p className="text-sm font-medium text-blue-800">Bulan Lalu</p>
                <p className="text-2xl font-bold text-blue-900">{formatCurrency(reportData.revenue.lastMonth)}</p>
              </div>
            </div>
          </div>

          <div className="bg-purple-50 p-4 rounded-lg">
            <div className="flex items-center">
              {reportData.revenue.growth >= 0 ? (
                <TrendingUp className="w-8 h-8 text-purple-600 mr-3" />
              ) : (
                <TrendingDown className="w-8 h-8 text-red-600 mr-3" />
              )}
              <div>
                <p className="text-sm font-medium text-purple-800">Pertumbuhan</p>
                <p className={`text-2xl font-bold ${reportData.revenue.growth >= 0 ? 'text-purple-900' : 'text-red-900'}`}>
                  {reportData.revenue.growth >= 0 ? '+' : ''}{formatPercentage(reportData.revenue.growth)}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Revenue by Service */}
          <div>
            <h4 className="text-md font-medium text-gray-900 mb-4">Pendapatan per Layanan</h4>
            <div className="space-y-3">
              {reportData.revenue.byService.length > 0 ? (
                reportData.revenue.byService.map((service, index) => (
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
                ))
              ) : (
                <p className="text-sm text-gray-500">Belum ada data pendapatan per layanan</p>
              )}
            </div>
          </div>

          {/* Revenue by City */}
          <div>
            <h4 className="text-md font-medium text-gray-900 mb-4">Pendapatan per Kota</h4>
            <div className="space-y-3">
              {reportData.revenue.byCity.length > 0 ? (
                reportData.revenue.byCity.map((city, index) => (
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
                ))
              ) : (
                <p className="text-sm text-gray-500">Belum ada data pendapatan per kota</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Outstanding & Aging Report */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900">Piutang & Aging Receivables</h3>
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
            <p className="text-xs font-medium text-green-800">Belum Jatuh Tempo</p>
            <p className="text-lg font-bold text-green-900">{formatCurrency(reportData.outstanding.aging.current)}</p>
          </div>

          <div className="bg-yellow-50 p-4 rounded-lg text-center">
            <Clock className="w-6 h-6 text-yellow-600 mx-auto mb-2" />
            <p className="text-xs font-medium text-yellow-800">1-30 Hari</p>
            <p className="text-lg font-bold text-yellow-900">{formatCurrency(reportData.outstanding.aging.days30)}</p>
          </div>

          <div className="bg-orange-50 p-4 rounded-lg text-center">
            <Clock className="w-6 h-6 text-orange-600 mx-auto mb-2" />
            <p className="text-xs font-medium text-orange-800">31-60 Hari</p>
            <p className="text-lg font-bold text-orange-900">{formatCurrency(reportData.outstanding.aging.days60)}</p>
          </div>

          <div className="bg-red-50 p-4 rounded-lg text-center">
            <AlertCircle className="w-6 h-6 text-red-600 mx-auto mb-2" />
            <p className="text-xs font-medium text-red-800">61-90 Hari</p>
            <p className="text-lg font-bold text-red-900">{formatCurrency(reportData.outstanding.aging.days90)}</p>
          </div>

          <div className="bg-red-100 p-4 rounded-lg text-center">
            <AlertCircle className="w-6 h-6 text-red-700 mx-auto mb-2" />
            <p className="text-xs font-medium text-red-900">90+ Hari</p>
            <p className="text-lg font-bold text-red-900">{formatCurrency(reportData.outstanding.aging.over90)}</p>
          </div>
        </div>

        <div className="bg-gray-50 p-4 rounded-lg">
          <div className="flex justify-between items-center">
            <span className="text-lg font-semibold text-gray-900">Total Piutang:</span>
            <span className="text-xl font-bold text-gray-900">{formatCurrency(reportData.outstanding.total)}</span>
          </div>
        </div>
      </div>

      {/* Cash Flow Report */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900">Laporan Arus Kas</h3>
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
                <p className="text-sm font-medium text-green-800">Kas Masuk</p>
                <p className="text-2xl font-bold text-green-900">{formatCurrency(reportData.cashFlow.inflow)}</p>
              </div>
            </div>
          </div>

          <div className="bg-red-50 p-4 rounded-lg">
            <div className="flex items-center">
              <TrendingDown className="w-8 h-8 text-red-600 mr-3" />
              <div>
                <p className="text-sm font-medium text-red-800">Kas Keluar</p>
                <p className="text-2xl font-bold text-red-900">{formatCurrency(reportData.cashFlow.outflow)}</p>
              </div>
            </div>
          </div>

          <div className="bg-blue-50 p-4 rounded-lg">
            <div className="flex items-center">
              <DollarSign className="w-8 h-8 text-blue-600 mr-3" />
              <div>
                <p className="text-sm font-medium text-blue-800">Arus Kas Bersih</p>
                <p className="text-2xl font-bold text-blue-900">{formatCurrency(reportData.cashFlow.net)}</p>
              </div>
            </div>
          </div>
        </div>

        <div>
          <h4 className="text-md font-medium text-gray-900 mb-4">Arus Kas Bulanan</h4>
          <div className="space-y-3">
            {reportData.cashFlow.monthly.map((month, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <span className="font-medium text-gray-900">{month.month}</span>
                <div className="flex space-x-6">
                  <div className="text-right">
                    <div className="text-sm text-gray-500">Masuk</div>
                    <div className="font-medium text-green-600">{formatCurrency(month.inflow)}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-gray-500">Keluar</div>
                    <div className="font-medium text-red-600">{formatCurrency(month.outflow)}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-gray-500">Bersih</div>
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
          <h3 className="text-lg font-semibold text-gray-900">Laporan Pajak</h3>
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
                <p className="text-sm font-medium text-blue-800">Total Pendapatan</p>
                <p className="text-2xl font-bold text-blue-900">{formatCurrency(reportData.tax.totalRevenue)}</p>
              </div>
            </div>
          </div>

          <div className="bg-green-50 p-4 rounded-lg">
            <div className="flex items-center">
              <DollarSign className="w-8 h-8 text-green-600 mr-3" />
              <div>
                <p className="text-sm font-medium text-green-800">Total Pajak (PPN {reportData.tax.taxRate}%)</p>
                <p className="text-2xl font-bold text-green-900">{formatCurrency(reportData.tax.totalTax)}</p>
              </div>
            </div>
          </div>

          <div className="bg-purple-50 p-4 rounded-lg">
            <div className="flex items-center">
              <FileText className="w-8 h-8 text-purple-600 mr-3" />
              <div>
                <p className="text-sm font-medium text-purple-800">Tarif Pajak Efektif</p>
                <p className="text-2xl font-bold text-purple-900">{formatPercentage(reportData.tax.taxRate)}</p>
              </div>
            </div>
          </div>
        </div>

        <div>
          <h4 className="text-md font-medium text-gray-900 mb-4">Detail Pajak Bulanan</h4>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Periode
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Pendapatan
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Jumlah Pajak
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