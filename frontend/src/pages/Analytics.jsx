import { useEffect, useState } from "react";
import monitoringService from "../services/monitoringService";

const fallbackData = {
  totalShipments: 148,
  successfulDeliveries: 139,
  alertFreeShipments: "91%",
  avgDeliveryTime: "14.2 hr",
  deviceUptime: "96.7%",
  activeNow: 6,

  shipmentsPerWeek: [
    { label: "Mon", value: 18 },
    { label: "Tue", value: 24 },
    { label: "Wed", value: 20 },
    { label: "Thu", value: 32 },
    { label: "Fri", value: 28 },
    { label: "Sat", value: 15 },
    { label: "Sun", value: 11 },
  ],

  statusDistribution: [
    { label: "In Transit", value: 45, color: "#3b82f6" },
    { label: "Delivered", value: 40, color: "#10b981" },
    { label: "Delayed", value: 10, color: "#f59e0b" },
    { label: "Alerted", value: 5, color: "#ef4444" },
  ],

  temperature: [
    { label: "Mon", value: 4.2 },
    { label: "Tue", value: 5.1 },
    { label: "Wed", value: 4.8 },
    { label: "Thu", value: 6.4 },
    { label: "Fri", value: 5.7 },
    { label: "Sat", value: 4.5 },
    { label: "Sun", value: 5.2 },
  ],

  alertFrequency: [
    { label: "Mon", value: 2 },
    { label: "Tue", value: 0 },
    { label: "Wed", value: 1 },
    { label: "Thu", value: 3 },
    { label: "Fri", value: 1 },
    { label: "Sat", value: 0 },
    { label: "Sun", value: 0 },
  ],

  deviceUptimeTrend: [
    { label: "Mon", value: 98.2 },
    { label: "Tue", value: 97.5 },
    { label: "Wed", value: 96.0 },
    { label: "Thu", value: 98.8 },
    { label: "Fri", value: 99.1 },
    { label: "Sat", value: 96.7 },
    { label: "Sun", value: 97.4 },
  ],

  productCategories: [
    { label: "Dairy", value: 35, color: "#6366f1" },
    { label: "Produce", value: 40, color: "#10b981" },
    { label: "Meat", value: 15, color: "#f97316" },
    { label: "Pharma", value: 10, color: "#ec4899" },
  ],
};

const Analytics = () => {
  const [data, setData] = useState(fallbackData);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const loadAnalytics = async () => {
      try {
        setLoading(true);
        const response = await monitoringService.getAnalytics();
        if (response) {
          setData({
            ...fallbackData,
            ...response,
            shipmentsPerWeek: response.shipmentsPerWeek || fallbackData.shipmentsPerWeek,
            statusDistribution: response.statusDistribution || fallbackData.statusDistribution,
            temperature: response.temperature || fallbackData.temperature,
            alertFrequency: response.alertFrequency || fallbackData.alertFrequency,
            deviceUptimeTrend: response.deviceUptimeTrend || fallbackData.deviceUptimeTrend,
            productCategories: response.productCategories || fallbackData.productCategories,
          });
        }
      } catch (error) {
        // Backend not available; using fallback data.
      } finally {
        setLoading(false);
      }
    };
    loadAnalytics();
  }, []);

  const getLinePoints = (dataSet = [], height = 140, maxVal = null) => {
    if (!dataSet || dataSet.length === 0) return "";
    const values = dataSet.map((d) => d.value);
    const max = maxVal !== null ? maxVal : Math.max(...values, 1);
    const min = 0;
    const width = 500;
    const padding = 40;

    return dataSet
      .map((item, index) => {
        const x = padding + (index / (dataSet.length - 1)) * (width - padding * 2);
        const y = height - padding - ((item.value - min) / (max - min)) * (height - padding * 2);
        return `${x},${y}`;
      })
      .join(" ");
  };

  return (
    <div className="analytics-page-container">
      <style>{`
        .analytics-page-container {
          padding: 24px;
          display: flex;
          flex-direction: column;
          gap: 24px;
          background-color: var(--bg);
          min-height: calc(100vh - 72px);
          box-sizing: border-box;
        }
        .analytics-page-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .analytics-page-header h1 {
          font-size: 22px;
          font-weight: 700;
          color: var(--text);
          margin: 0 0 4px 0;
        }
        .analytics-page-header p {
          font-size: 13px;
          color: var(--text-muted);
          margin: 0;
        }
        .analytics-period-select {
          padding: 6px 12px;
          border-radius: 8px;
          border: 1px solid var(--border);
          background-color: var(--card-bg);
          font-size: 13px;
          font-weight: 500;
          color: var(--text);
          outline: none;
        }
        .analytics-stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
          gap: 16px;
        }
        .analytics-stat-card {
          background: var(--card-bg);
          padding: 16px;
          border-radius: 12px;
          border: 1px solid var(--border);
          display: flex;
          flex-direction: column;
          gap: 12px;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.02);
        }
        .analytics-stat-icon {
          width: 36px;
          height: 36px;
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 15px;
        }
        .analytics-stat-icon.blue { background-color: #eff6ff; color: #3b82f6; }
        .analytics-stat-icon.green { background-color: #ecfdf5; color: #10b981; }
        .analytics-stat-icon.indigo { background-color: #eef2ff; color: #6366f1; }
        .analytics-stat-icon.cyan { background-color: #ecfeff; color: #06b6d4; }
        .analytics-stat-icon.purple { background-color: #f5f3ff; color: #8b5cf6; }
        .analytics-stat-icon.orange { background-color: #fff7ed; color: #f97316; }

        .analytics-stat-content {
          display: flex;
          flex-direction: column;
        }
        .analytics-stat-label {
          font-size: 12px;
          color: var(--text-muted);
          font-weight: 500;
        }
        .analytics-stat-card h2 {
          font-size: 20px;
          font-weight: 700;
          color: var(--text);
          margin: 4px 0 0 0;
        }
        .analytics-grid-row {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 20px;
        }
        @media (max-width: 1024px) {
          .analytics-grid-row {
            grid-template-columns: 1fr;
          }
        }
        .analytics-content-card {
          background: var(--card-bg);
          border-radius: 12px;
          border: 1px solid var(--border);
          padding: 20px;
          display: flex;
          flex-direction: column;
          gap: 16px;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.02);
        }
        .analytics-card-header h3 {
          font-size: 15px;
          font-weight: 600;
          color: var(--text);
          margin: 0;
        }
        .analytics-chart-container {
          width: 100%;
          height: 180px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .analytics-line-svg {
          width: 100%;
          height: 100%;
          display: block;
          overflow: visible;
        }
        .analytics-chart-node {
          fill: #3b82f6;
          stroke: var(--card-bg);
          stroke-width: 2px;
        }
        .analytics-chart-node.green { fill: #10b981; }
        .analytics-chart-node.red { fill: #ef4444; }
        .analytics-chart-node.purple { fill: #8b5cf6; }
        .analytics-chart-label {
          font-size: 11px;
          fill: var(--text-muted);
        }
        .analytics-distribution-bars {
          display: flex;
          flex-direction: column;
          gap: 16px;
          padding: 10px 0;
        }
        .analytics-dist-item {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }
        .analytics-dist-info {
          display: flex;
          justify-content: space-between;
          font-size: 13px;
          color: var(--text);
        }
        .analytics-dist-info strong {
          color: var(--text);
        }
        .analytics-progress-track {
          width: 100%;
          height: 8px;
          background-color: var(--bg-secondary);
          border-radius: 9999px;
          overflow: hidden;
        }
        .analytics-progress-fill {
          height: 100%;
          border-radius: 9999px;
          transition: width 0.4s ease;
        }
        .analytics-muted-text {
          font-size: 13px;
          color: var(--text-muted);
          margin: 0;
        }
      `}</style>

      <div className="analytics-page-header">
        <div>
          <h1>Analytics</h1>
          <p>Performance across your supply chain</p>
        </div>

        <select className="analytics-period-select" aria-label="Select Analytics Period">
          <option>Last 7 Days</option>
          <option>Last 30 Days</option>
          <option>Last 3 Months</option>
          <option>Last Year</option>
        </select>
      </div>

      {loading && <p className="analytics-muted-text">Updating analytics...</p>}

      {/* Top Stat Cards Grid */}
      <div className="analytics-stats-grid">
        <div className="analytics-stat-card">
          <div className="analytics-stat-icon blue">
            <i className="fa-solid fa-box-open"></i>
          </div>
          <div className="analytics-stat-content">
            <span className="analytics-stat-label">Total Shipments</span>
            <h2>{data.totalShipments}</h2>
          </div>
        </div>

        <div className="analytics-stat-card">
          <div className="analytics-stat-icon green">
            <i className="fa-solid fa-circle-check"></i>
          </div>
          <div className="analytics-stat-content">
            <span className="analytics-stat-label">Successful Deliveries</span>
            <h2>{data.successfulDeliveries}</h2>
          </div>
        </div>

        <div className="analytics-stat-card">
          <div className="analytics-stat-icon indigo">
            <i className="fa-solid fa-shield-heart"></i>
          </div>
          <div className="analytics-stat-content">
            <span className="analytics-stat-label">Alert-Free Shipments</span>
            <h2>{data.alertFreeShipments}</h2>
          </div>
        </div>

        <div className="analytics-stat-card">
          <div className="analytics-stat-icon cyan">
            <i className="fa-solid fa-clock"></i>
          </div>
          <div className="analytics-stat-content">
            <span className="analytics-stat-label">Average Delivery Time</span>
            <h2>{data.avgDeliveryTime}</h2>
          </div>
        </div>

        <div className="analytics-stat-card">
          <div className="analytics-stat-icon purple">
            <i className="fa-solid fa-tower-broadcast"></i>
          </div>
          <div className="analytics-stat-content">
            <span className="analytics-stat-label">Device Uptime</span>
            <h2>{data.deviceUptime}</h2>
          </div>
        </div>

        <div className="analytics-stat-card">
          <div className="analytics-stat-icon orange">
            <i className="fa-solid fa-truck-fast"></i>
          </div>
          <div className="analytics-stat-content">
            <span className="analytics-stat-label">Active Now</span>
            <h2>{data.activeNow}</h2>
          </div>
        </div>
      </div>

      {/* Charts Grid Row 1 */}
      <div className="analytics-grid-row">
        <div className="analytics-content-card">
          <div className="analytics-card-header">
            <h3>Shipments per Week</h3>
          </div>
          <div className="analytics-chart-container">
            <svg viewBox="0 0 500 160" className="analytics-line-svg">
              <polyline
                fill="none"
                stroke="#3b82f6"
                strokeWidth="3"
                points={getLinePoints(data.shipmentsPerWeek, 160, 40)}
              />
              {(data.shipmentsPerWeek || []).map((item, idx) => {
                const x = 40 + (idx / (data.shipmentsPerWeek.length - 1)) * 420;
                const y = 160 - 30 - ((item.value - 0) / (40 - 0)) * 100;
                return (
                  <g key={idx}>
                    <circle cx={x} cy={y} r="4" className="analytics-chart-node" />
                    <text x={x} y="155" textAnchor="middle" className="analytics-chart-label">
                      {item.label}
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>
        </div>

        <div className="analytics-content-card">
          <div className="analytics-card-header">
            <h3>Shipment Status Distribution</h3>
          </div>
          <div className="analytics-distribution-bars">
            {(data.statusDistribution || []).map((item) => (
              <div className="analytics-dist-item" key={item.label}>
                <div className="analytics-dist-info">
                  <span>{item.label}</span>
                  <strong>{item.value}%</strong>
                </div>
                <div className="analytics-progress-track">
                  <div
                    className="analytics-progress-fill"
                    style={{ width: `${item.value}%`, backgroundColor: item.color }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Charts Grid Row 2 */}
      <div className="analytics-grid-row">
        <div className="analytics-content-card">
          <div className="analytics-card-header">
            <h3>Average Temperature by Shipment</h3>
          </div>
          <div className="analytics-chart-container">
            <svg viewBox="0 0 500 160" className="analytics-line-svg">
              <polyline
                fill="none"
                stroke="#10b981"
                strokeWidth="3"
                points={getLinePoints(data.temperature, 160, 10)}
              />
              {(data.temperature || []).map((item, idx) => {
                const x = 40 + (idx / (data.temperature.length - 1)) * 420;
                const y = 160 - 30 - ((item.value - 0) / (10 - 0)) * 100;
                return (
                  <g key={idx}>
                    <circle cx={x} cy={y} r="4" className="analytics-chart-node green" />
                    <text x={x} y="155" textAnchor="middle" className="analytics-chart-label">
                      {item.label}
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>
        </div>

        <div className="analytics-content-card">
          <div className="analytics-card-header">
            <h3>Alert Frequency</h3>
          </div>
          <div className="analytics-chart-container">
            <svg viewBox="0 0 500 160" className="analytics-line-svg">
              <polyline
                fill="none"
                stroke="#ef4444"
                strokeWidth="3"
                points={getLinePoints(data.alertFrequency, 160, 5)}
              />
              {(data.alertFrequency || []).map((item, idx) => {
                const x = 40 + (idx / (data.alertFrequency.length - 1)) * 420;
                const y = 160 - 30 - ((item.value - 0) / (5 - 0)) * 100;
                return (
                  <g key={idx}>
                    <circle cx={x} cy={y} r="4" className="analytics-chart-node red" />
                    <text x={x} y="155" textAnchor="middle" className="analytics-chart-label">
                      {item.label}
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>
        </div>
      </div>

      {/* Charts Grid Row 3 */}
      <div className="analytics-grid-row">
        <div className="analytics-content-card">
          <div className="analytics-card-header">
            <h3>Device Uptime</h3>
          </div>
          <div className="analytics-chart-container">
            <svg viewBox="0 0 500 160" className="analytics-line-svg">
              <polyline
                fill="none"
                stroke="#8b5cf6"
                strokeWidth="3"
                points={getLinePoints(data.deviceUptimeTrend, 160, 100)}
              />
              {(data.deviceUptimeTrend || []).map((item, idx) => {
                const x = 40 + (idx / (data.deviceUptimeTrend.length - 1)) * 420;
                const y = 160 - 30 - ((item.value - 90) / (100 - 90)) * 100;
                return (
                  <g key={idx}>
                    <circle cx={x} cy={y} r="4" className="analytics-chart-node purple" />
                    <text x={x} y="155" textAnchor="middle" className="analytics-chart-label">
                      {item.label}
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>
        </div>

        <div className="analytics-content-card">
          <div className="analytics-card-header">
            <h3>Product Category Distribution</h3>
          </div>
          <div className="analytics-distribution-bars">
            {(data.productCategories || []).map((item) => (
              <div className="analytics-dist-item" key={item.label}>
                <div className="analytics-dist-info">
                  <span>{item.label}</span>
                  <strong>{item.value}%</strong>
                </div>
                <div className="analytics-progress-track">
                  <div
                    className="analytics-progress-fill"
                    style={{ width: `${item.value}%`, backgroundColor: item.color }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Analytics;