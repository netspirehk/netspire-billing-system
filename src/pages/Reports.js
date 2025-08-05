import React, { useState } from 'react';
import { BarChart3, TrendingUp, Download, Calendar } from 'lucide-react';
import { useBilling } from '../context/AmplifyBillingContext';
import { format, startOfMonth, endOfMonth, subMonths } from 'date-fns';

const Reports = () => {
  const { state } = useBilling();
  const { invoices, payments, customers, products } = state;
  const [selectedPeriod, setSelectedPeriod] = useState('thisMonth');

  // Date range calculations
  const getDateRange = (period) => {
    const now = new Date();
    switch (period) {
      case 'thisMonth':
        return {
          start: startOfMonth(now),
          end: endOfMonth(now),
          label: 'This Month'
        };
      case 'lastMonth':
        return {
          start: startOfMonth(subMonths(now, 1)),
          end: endOfMonth(subMonths(now, 1)),
          label: 'Last Month'
        };
      case 'last3Months':
        return {
          start: startOfMonth(subMonths(now, 2)),
          end: endOfMonth(now),
          label: 'Last 3 Months'
        };
      case 'thisYear':
        return {
          start: new Date(now.getFullYear(), 0, 1),
          end: new Date(now.getFullYear(), 11, 31),
          label: 'This Year'
        };
      default:
        return {
          start: startOfMonth(now),
          end: endOfMonth(now),
          label: 'This Month'
        };
    }
  };

  const { start, end, label } = getDateRange(selectedPeriod);

  // Filter data by date range
  const filteredInvoices = invoices.filter(invoice => {
    const invoiceDate = new Date(invoice.issueDate);
    return invoiceDate >= start && invoiceDate <= end;
  });

  const filteredPayments = payments.filter(payment => {
    const paymentDate = new Date(payment.paymentDate);
    return paymentDate >= start && paymentDate <= end;
  });

  // Calculate metrics
  const totalRevenue = filteredPayments.reduce((sum, payment) => sum + payment.amount, 0);
  const totalInvoiced = filteredInvoices.reduce((sum, invoice) => sum + invoice.total, 0);
  const averageInvoiceValue = filteredInvoices.length > 0 ? totalInvoiced / filteredInvoices.length : 0;
  const paidInvoices = filteredInvoices.filter(inv => inv.status === 'paid').length;
  const paymentRate = filteredInvoices.length > 0 ? (paidInvoices / filteredInvoices.length) * 100 : 0;

  // Top customers by revenue
  const customerRevenue = {};
  filteredPayments.forEach(payment => {
    const invoice = invoices.find(inv => inv.id === payment.invoiceId);
    if (invoice) {
      const customer = customers.find(c => c.id === invoice.customerId);
      if (customer) {
        customerRevenue[customer.name] = (customerRevenue[customer.name] || 0) + payment.amount;
      }
    }
  });

  const topCustomers = Object.entries(customerRevenue)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 5);

  // Product/service performance
  const productRevenue = {};
  filteredInvoices.forEach(invoice => {
    invoice.items.forEach(item => {
      const product = products.find(p => p.id === item.productId);
      if (product) {
        const revenue = item.quantity * item.rate;
        productRevenue[product.name] = (productRevenue[product.name] || 0) + revenue;
      }
    });
  });

  const topProducts = Object.entries(productRevenue)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 5);

  // Monthly trends (for last 6 months)
  const monthlyTrends = [];
  for (let i = 5; i >= 0; i--) {
    const monthStart = startOfMonth(subMonths(new Date(), i));
    const monthEnd = endOfMonth(subMonths(new Date(), i));
    
    const monthInvoices = invoices.filter(inv => {
      const invDate = new Date(inv.issueDate);
      return invDate >= monthStart && invDate <= monthEnd;
    });
    
    const monthPayments = payments.filter(payment => {
      const payDate = new Date(payment.paymentDate);
      return payDate >= monthStart && payDate <= monthEnd;
    });
    
    monthlyTrends.push({
      month: format(monthStart, 'MMM yyyy'),
      invoiced: monthInvoices.reduce((sum, inv) => sum + inv.total, 0),
      received: monthPayments.reduce((sum, pay) => sum + pay.amount, 0)
    });
  }

  return (
    <div className="reports-page">
      <div className="page-header">
        <div>
          <h1>Reports & Analytics</h1>
          <p>Analyze your business performance and trends</p>
        </div>
        <div className="header-actions">
          <select
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value)}
            className="form-control period-select"
          >
            <option value="thisMonth">This Month</option>
            <option value="lastMonth">Last Month</option>
            <option value="last3Months">Last 3 Months</option>
            <option value="thisYear">This Year</option>
          </select>
          <button className="btn btn-primary">
            <Download size={20} />
            Export Report
          </button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="metrics-grid">
        <div className="metric-card">
          <div className="metric-icon revenue">
            <TrendingUp size={24} />
          </div>
          <div className="metric-content">
            <h3>Revenue ({label})</h3>
            <p className="metric-value">${totalRevenue.toFixed(2)}</p>
            <span className="metric-change positive">+15.3% vs previous period</span>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon invoiced">
            <BarChart3 size={24} />
          </div>
          <div className="metric-content">
            <h3>Total Invoiced</h3>
            <p className="metric-value">${totalInvoiced.toFixed(2)}</p>
            <span className="metric-change neutral">{filteredInvoices.length} invoices</span>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon average">
            <Calendar size={24} />
          </div>
          <div className="metric-content">
            <h3>Avg Invoice Value</h3>
            <p className="metric-value">${averageInvoiceValue.toFixed(2)}</p>
            <span className="metric-change positive">+8.2% improvement</span>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon payment-rate">
            <TrendingUp size={24} />
          </div>
          <div className="metric-content">
            <h3>Payment Rate</h3>
            <p className="metric-value">{paymentRate.toFixed(1)}%</p>
            <span className="metric-change positive">Above industry avg</span>
          </div>
        </div>
      </div>

      {/* Charts and Tables */}
      <div className="reports-content">
        {/* Monthly Trends */}
        <div className="report-section">
          <div className="section-header">
            <h2>Revenue Trends (Last 6 Months)</h2>
          </div>
          <div className="card chart-card">
            <div className="simple-chart">
              {monthlyTrends.map((month, index) => (
                <div key={index} className="chart-bar">
                  <div className="bar-container">
                    <div 
                      className="bar invoiced-bar"
                      style={{ 
                        height: `${(month.invoiced / Math.max(...monthlyTrends.map(m => m.invoiced)) * 100) || 0}%` 
                      }}
                    ></div>
                    <div 
                      className="bar received-bar"
                      style={{ 
                        height: `${(month.received / Math.max(...monthlyTrends.map(m => m.received)) * 100) || 0}%` 
                      }}
                    ></div>
                  </div>
                  <div className="chart-label">{month.month}</div>
                  <div className="chart-values">
                    <div className="chart-value invoiced">I: ${month.invoiced.toFixed(0)}</div>
                    <div className="chart-value received">R: ${month.received.toFixed(0)}</div>
                  </div>
                </div>
              ))}
            </div>
            <div className="chart-legend">
              <div className="legend-item">
                <div className="legend-color invoiced"></div>
                <span>Invoiced</span>
              </div>
              <div className="legend-item">
                <div className="legend-color received"></div>
                <span>Received</span>
              </div>
            </div>
          </div>
        </div>

        <div className="reports-grid">
          {/* Top Customers */}
          <div className="report-section">
            <div className="section-header">
              <h2>Top Customers</h2>
            </div>
            <div className="card">
              <div className="ranking-list">
                {topCustomers.map(([customer, revenue], index) => (
                  <div key={customer} className="ranking-item">
                    <div className="rank">#{index + 1}</div>
                    <div className="ranking-content">
                      <div className="ranking-name">{customer}</div>
                      <div className="ranking-value">${revenue.toFixed(2)}</div>
                    </div>
                    <div className="ranking-bar">
                      <div 
                        className="ranking-fill"
                        style={{ 
                          width: `${(revenue / topCustomers[0][1]) * 100}%` 
                        }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Top Products/Services */}
          <div className="report-section">
            <div className="section-header">
              <h2>Top Products/Services</h2>
            </div>
            <div className="card">
              <div className="ranking-list">
                {topProducts.map(([product, revenue], index) => (
                  <div key={product} className="ranking-item">
                    <div className="rank">#{index + 1}</div>
                    <div className="ranking-content">
                      <div className="ranking-name">{product}</div>
                      <div className="ranking-value">${revenue.toFixed(2)}</div>
                    </div>
                    <div className="ranking-bar">
                      <div 
                        className="ranking-fill product"
                        style={{ 
                          width: `${(revenue / topProducts[0][1]) * 100}%` 
                        }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        .reports-page {
          max-width: 1200px;
        }

        .page-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 24px;
        }

        .page-header h1 {
          font-size: 28px;
          font-weight: 700;
          color: #1f2937;
          margin-bottom: 8px;
        }

        .page-header p {
          color: #6b7280;
          font-size: 16px;
        }

        .header-actions {
          display: flex;
          gap: 12px;
          align-items: center;
        }

        .period-select {
          min-width: 150px;
        }

        .metrics-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 20px;
          margin-bottom: 32px;
        }

        .metric-card {
          background: white;
          padding: 24px;
          border-radius: 12px;
          border: 1px solid #e5e7eb;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
          display: flex;
          align-items: center;
          gap: 16px;
        }

        .metric-icon {
          width: 48px;
          height: 48px;
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
        }

        .metric-icon.revenue { background: linear-gradient(135deg, #10b981, #059669); }
        .metric-icon.invoiced { background: linear-gradient(135deg, #3b82f6, #2563eb); }
        .metric-icon.average { background: linear-gradient(135deg, #f59e0b, #d97706); }
        .metric-icon.payment-rate { background: linear-gradient(135deg, #8b5cf6, #7c3aed); }

        .metric-content h3 {
          font-size: 14px;
          font-weight: 500;
          color: #6b7280;
          margin-bottom: 4px;
        }

        .metric-value {
          font-size: 24px;
          font-weight: 700;
          color: #1f2937;
          margin-bottom: 4px;
        }

        .metric-change {
          font-size: 12px;
          font-weight: 500;
        }

        .metric-change.positive { color: #10b981; }
        .metric-change.negative { color: #ef4444; }
        .metric-change.neutral { color: #6b7280; }

        .reports-content {
          display: flex;
          flex-direction: column;
          gap: 32px;
        }

        .reports-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 24px;
        }

        .section-header {
          margin-bottom: 16px;
        }

        .section-header h2 {
          font-size: 20px;
          font-weight: 600;
          color: #1f2937;
        }

        .chart-card {
          padding: 24px;
        }

        .simple-chart {
          display: flex;
          align-items: end;
          gap: 16px;
          height: 200px;
          margin-bottom: 16px;
        }

        .chart-bar {
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 8px;
        }

        .bar-container {
          display: flex;
          align-items: end;
          gap: 4px;
          height: 150px;
        }

        .bar {
          width: 20px;
          min-height: 10px;
          border-radius: 4px 4px 0 0;
        }

        .invoiced-bar {
          background: #3b82f6;
        }

        .received-bar {
          background: #10b981;
        }

        .chart-label {
          font-size: 12px;
          color: #6b7280;
          font-weight: 500;
        }

        .chart-values {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .chart-value {
          font-size: 10px;
          color: #9ca3af;
        }

        .chart-legend {
          display: flex;
          gap: 16px;
          justify-content: center;
        }

        .legend-item {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 12px;
          color: #6b7280;
        }

        .legend-color {
          width: 12px;
          height: 12px;
          border-radius: 2px;
        }

        .legend-color.invoiced {
          background: #3b82f6;
        }

        .legend-color.received {
          background: #10b981;
        }

        .ranking-list {
          padding: 24px;
        }

        .ranking-item {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px 0;
          border-bottom: 1px solid #f3f4f6;
        }

        .ranking-item:last-child {
          border-bottom: none;
        }

        .rank {
          width: 24px;
          height: 24px;
          background: #f3f4f6;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 12px;
          font-weight: 600;
          color: #6b7280;
        }

        .ranking-content {
          flex: 1;
          min-width: 0;
        }

        .ranking-name {
          font-weight: 500;
          color: #1f2937;
          font-size: 14px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .ranking-value {
          font-size: 12px;
          color: #6b7280;
        }

        .ranking-bar {
          width: 60px;
          height: 6px;
          background: #f3f4f6;
          border-radius: 3px;
          overflow: hidden;
        }

        .ranking-fill {
          height: 100%;
          background: #3b82f6;
          border-radius: 3px;
        }

        .ranking-fill.product {
          background: #10b981;
        }

        @media (max-width: 768px) {
          .page-header {
            flex-direction: column;
            gap: 16px;
            align-items: stretch;
          }
          
          .header-actions {
            flex-direction: column;
          }
          
          .reports-grid {
            grid-template-columns: 1fr;
          }
          
          .simple-chart {
            gap: 8px;
          }
          
          .bar {
            width: 16px;
          }
        }
      `}</style>
    </div>
  );
};

export default Reports;