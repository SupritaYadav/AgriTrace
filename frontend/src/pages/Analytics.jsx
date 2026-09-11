import { useEffect, useState } from "react";

import { getDashboardSummary } from "../api/dashboardApi";
import { listShipments } from "../api/shipmentApi";
import { listDevices } from "../api/deviceApi";
import { listAlerts } from "../api/alertApi";

const Analytics = () => {
  const [summary, setSummary] = useState(null);
  const [shipmentCounts, setShipmentCounts] = useState({});
  const [deviceStatus, setDeviceStatus] = useState({ online: 0, offline: 0, total: 0 });
  const [alertCounts, setAlertCounts] = useState({ open: 0, resolved: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dashboardAvgDeliveryTime, setDashboardAvgDeliveryTime] = useState("—");

  useEffect(() => {
    const loadAnalytics = async () => {
      try {
        setLoading(true);
        setError(null);
        const [summaryRes, shipmentsRes, devicesRes, alertsRes] = await Promise.all([
          getDashboardSummary(),
          listShipments(),
          listDevices(),
          listAlerts({ limit: 100 }),
        ]);
        setSummary(summaryRes ?? null);

         const allShipments = Array.isArray(shipmentsRes) ? shipmentsRes : [];
        const counts = { total: allShipments.length };
        for (const s of allShipments) {
          const st = s.status || "Unknown";
          counts[st] = (counts[st] || 0) + 1;
        }
        setShipmentCounts(counts);

        const delivered = allShipments.filter(
          (s) => s.status === "DELIVERED" && s.createdAt && s.updatedAt
        );
        if (delivered.length > 0) {
          const totalHours = delivered.reduce((sum, s) => {
            const start = new Date(s.createdAt).getTime();
            const end = new Date(s.updatedAt).getTime();
            return sum + (end - start) / (1000 * 3600);
          }, 0);
          const avg = (totalHours / delivered.length).toFixed(1);
          setDashboardAvgDeliveryTime(`${avg} hr`);
        } else {
          setDashboardAvgDeliveryTime("—");
        }

        const allDevices = Array.isArray(devicesRes) ? devicesRes : [];
        setDeviceStatus({
          online: allDevices.filter((d) => d.status === "ONLINE").length,
          offline: allDevices.filter((d) => d.status === "OFFLINE").length,
          total: allDevices.length,
        });

        const alertData = alertsRes?.alerts || alertsRes?.data || [];
        const alertsArr = Array.isArray(alertData) ? alertData : [];
        setAlertCounts({
          open: alertsArr.filter((a) => (a.status || a.state || "").toLowerCase() === "open").length,
          resolved: alertsArr.filter((a) => (a.status || a.state || "").toLowerCase() === "resolved").length,
        });
      } catch (err) {
        console.error("Failed to load analytics", err);
        setError(err.message || "Failed to load analytics");
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

  if (loading) {
    return <div style={{ padding: 24 }}>Loading analytics…</div>;
  }

  if (error) {
    return <div style={{ padding: 24, color: "red" }}>Failed to load analytics: {error}</div>;
  }

  const statusDistribution = Object.entries(shipmentCounts)
    .filter(([key]) => key !== "total")
    .map(([label, value]) => {
      const colors = {
        PENDING: "#f59e0b",
        DEVICE_ASSIGNED: "#6366f1",
        READY_FOR_DISPATCH: "#3b82f6",
        IN_TRANSIT: "#8b5cf6",
        AT_WAREHOUSE: "#06b6d4",
        DELIVERED: "#10b981",
        CANCELLED: "#ef4444",
      };
      return { label, value, color: colors[label] || "#94a3b8" };
    });

  const computeShipmentTrend = (shipments) => {
    if (!shipments || shipments.length === 0) return [];
    const now = new Date();
    const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const weeksAgo = 7;
    const buckets = Array.from({ length: weeksAgo }, (_, i) => {
      const d = new Date(now);
      d.setDate(d.getDate() - (weeksAgo - 1 - i) * 7);
      d.setHours(0, 0, 0, 0);
      return { start: d, count: 0 };
    });
    const bucketSizeMs = 7 * 24 * 60 * 60 * 1000;
    for (const s of shipments) {
      const ts = new Date(s.createdAt || s.timestamp || 0).getTime();
      for (const bucket of buckets) {
        if (ts >= bucket.start.getTime() && ts < bucket.start.getTime() + bucketSizeMs) {
          bucket.count++;
          break;
        }
      }
    }
    return buckets.map((b, i) => ({
      label: days[b.start.getDay()],
      value: b.count,
    }));
  };

  const shipmentsPerWeek = computeShipmentTrend(
    Array.isArray(summary?.recentShipments) ? summary.recentShipments : []
  );

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
        .analytics-no-data {
          padding: 20px;
          text-align: center;
          color: var(--text-muted);
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

      {!summary && !error && (
        <p className="analytics-no-data">No analytics data available yet.</p>
      )}

      {/* Top Stat Cards Grid */}
      {summary && (
        <div className="analytics-stats-grid">
          <div className="analytics-stat-card">
            <div className="analytics-stat-icon blue">
              <i className="fa-solid fa-box-open"></i>
            </div>
            <div className="analytics-stat-content">
              <span className="analytics-stat-label">Total Shipments</span>
              <h2>{summary.activeShipments ?? shipmentCounts.total ?? 0}</h2>
            </div>
          </div>

          <div className="analytics-stat-card">
            <div className="analytics-stat-icon green">
              <i className="fa-solid fa-circle-check"></i>
            </div>
            <div className="analytics-stat-content">
              <span className="analytics-stat-label">Successful Deliveries</span>
              <h2>{summary.completedShipments ?? shipmentCounts.DELIVERED ?? 0}</h2>
            </div>
          </div>

          <div className="analytics-stat-card">
            <div className="analytics-stat-icon indigo">
              <i className="fa-solid fa-shield-heart"></i>
            </div>
            <div className="analytics-stat-content">
              <span className="analytics-stat-label">Alert-Free Shipments</span>
              <h2>{summary.openAlerts != null ? Math.max(0, (summary.activeShipments || 0) - summary.openAlerts) : "—"}</h2>
            </div>
          </div>

          <div className="analytics-stat-card">
          <div className="analytics-stat-icon cyan">
            <i className="fa-solid fa-clock"></i>
          </div>
          <div className="analytics-stat-content">
            <span className="analytics-stat-label">Average Delivery Time</span>
            <h2>{dashboardAvgDeliveryTime}</h2>
          </div>
          </div>

          <div className="analytics-stat-card">
            <div className="analytics-stat-icon purple">
              <i className="fa-solid fa-tower-broadcast"></i>
            </div>
            <div className="analytics-stat-content">
              <span className="analytics-stat-label">Device Uptime</span>
              <h2>{deviceStatus.total > 0 ? Math.round((deviceStatus.online / deviceStatus.total) * 100) : 0}%</h2>
            </div>
          </div>

          <div className="analytics-stat-card">
            <div className="analytics-stat-icon orange">
              <i className="fa-solid fa-truck-fast"></i>
            </div>
            <div className="analytics-stat-content">
              <span className="analytics-stat-label">Active Now</span>
              <h2>{deviceStatus.online}</h2>
            </div>
          </div>
        </div>
      )}

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
                points={getLinePoints(shipmentsPerWeek, 160, null)}
              />
              {(shipmentsPerWeek || []).map((item, idx) => {
                const x = 40 + (idx / (shipmentsPerWeek.length - 1)) * 420;
                const y = 160 - 30 - ((item.value - 0) / (Math.max(...shipmentsPerWeek.map((d) => d.value), 1) - 0)) * 100;
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
            {(statusDistribution.length ? statusDistribution : []).map((item) => (
              <div className="analytics-dist-item" key={item.label}>
                <div className="analytics-dist-info">
                  <span>{item.label}</span>
                  <strong>{item.value}%</strong>
                </div>
                <div className="analytics-progress-track">
                  <div
                    className="analytics-progress-fill"
                    style={{ width: `${Math.min(item.value, 100)}%`, backgroundColor: item.color }}
                  />
                </div>
              </div>
            ))}
            {statusDistribution.length === 0 && <p className="analytics-muted-text">No data yet</p>}
          </div>
        </div>
      </div>

      {/* Charts Grid Row 2 */}
      <div className="analytics-grid-row">
        <div className="analytics-content-card">
          <div className="analytics-card-header">
            <h3>Alerts Overview</h3>
          </div>
          <div className="analytics-distribution-bars">
            <div className="analytics-dist-item">
              <div className="analytics-dist-info">
                <span>Open</span>
                <strong>{alertCounts.open}</strong>
              </div>
              <div className="analytics-progress-track">
                <div className="analytics-progress-fill" style={{ width: `${Math.min(alertCounts.open * 10, 100)}%`, backgroundColor: "#ef4444" }} />
              </div>
            </div>
            <div className="analytics-dist-item">
              <div className="analytics-dist-info">
                <span>Resolved</span>
                <strong>{alertCounts.resolved}</strong>
              </div>
              <div className="analytics-progress-track">
                <div className="analytics-progress-fill" style={{ width: `${Math.min(alertCounts.resolved * 10, 100)}%`, backgroundColor: "#10b981" }} />
              </div>
            </div>
          </div>
        </div>

        <div className="analytics-content-card">
          <div className="analytics-card-header">
            <h3>Device Status</h3>
          </div>
          <div className="analytics-distribution-bars">
            <div className="analytics-dist-item">
              <div className="analytics-dist-info">
                <span>Online</span>
                <strong>{deviceStatus.online}</strong>
              </div>
              <div className="analytics-progress-track">
                <div className="analytics-progress-fill" style={{ width: `${deviceStatus.total > 0 ? Math.round((deviceStatus.online / deviceStatus.total) * 100) : 0}%`, backgroundColor: "#10b981" }} />
              </div>
            </div>
            <div className="analytics-dist-item">
              <div className="analytics-dist-info">
                <span>Offline</span>
                <strong>{deviceStatus.offline}</strong>
              </div>
              <div className="analytics-progress-track">
                <div className="analytics-progress-fill" style={{ width: `${deviceStatus.total > 0 ? Math.round((deviceStatus.offline / deviceStatus.total) * 100) : 0}%`, backgroundColor: "#ef4444" }} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Analytics;
