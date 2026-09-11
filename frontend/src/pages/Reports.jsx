import { useState, useEffect } from "react";

import { listShipments } from "../api/shipmentApi";
import { listAlerts } from "../api/alertApi";
import { listDevices } from "../api/deviceApi";
import { getDashboardSummary } from "../api/dashboardApi";

const Reports = () => {
  const [dateRange, setDateRange] = useState("Last 30 days");
  const [product, setProduct] = useState("All Products");
  const [shipmentFilter, setShipmentFilter] = useState("All Shipments");
  const [organization, setOrganization] = useState("All Organizations");

  const [shipments, setShipments] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [devices, setDevices] = useState([]);
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        setError(null);
        const [shipRes, alertRes, devRes, dashRes] = await Promise.all([
          listShipments(),
          listAlerts({ limit: 100 }),
          listDevices(),
          getDashboardSummary(),
        ]);
        setShipments(Array.isArray(shipRes) ? shipRes : []);
        const alertData = alertRes?.alerts || alertRes?.data || [];
        setAlerts(Array.isArray(alertData) ? alertData : []);
        setDevices(Array.isArray(devRes) ? devRes : []);
        setDashboardData(dashRes ?? null);
      } catch (err) {
        console.error("Failed to load report data", err);
        setError(err.message || "Failed to load report data");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const downloadReport = (reportName) => {
    const shipmentData = JSON.stringify(shipments, null, 2);
    const alertData = JSON.stringify(alerts, null, 2);
    const deviceData = JSON.stringify(devices, null, 2);
    const dashData = JSON.stringify(dashboardData, null, 2);

    let content = "";
    content += `=== ${reportName} ===\n`;
    content += `Date Range: ${dateRange}\n`;
    content += `Product: ${product}\n`;
    content += `Shipment Filter: ${shipmentFilter}\n`;
    content += `Organization: ${organization}\n`;
    content += `Generated: ${new Date().toISOString()}\n\n`;

    if (reportName.includes("Shipment Summary")) {
      content += `--- Shipment Summary ---\n`;
      content += `Total Shipments: ${shipments.length}\n`;
      const byStatus = {};
      shipments.forEach((s) => {
        const st = s.status || "Unknown";
        byStatus[st] = (byStatus[st] || 0) + 1;
      });
      content += `By Status: ${JSON.stringify(byStatus)}\n\n`;
      content += shipmentData;
    } else if (reportName.includes("Environmental")) {
      content += `--- Environmental Compliance ---\n`;
      content += `Total Devices: ${devices.length}\n`;
      content += `Open Alerts: ${alerts.filter((a) => (a.status || "").toLowerCase() === "open").length}\n`;
      content += `Dashboard: ${JSON.stringify(dashboardData)}\n\n`;
      content += alertData;
    } else if (reportName.includes("Device")) {
      content += `--- Device Health ---\n`;
      content += `Total Devices: ${devices.length}\n`;
      content += `Online: ${devices.filter((d) => d.status === "ONLINE").length}\n`;
      content += `Offline: ${devices.filter((d) => d.status === "OFFLINE").length}\n\n`;
      content += deviceData;
    } else if (reportName.includes("Traceability")) {
      content += `--- Traceability Report ---\n`;
      content += `Dashboard Summary: ${JSON.stringify(dashboardData)}\n`;
      content += `Total Shipments: ${shipments.length}\n`;
      content += `Total Alerts: ${alerts.length}\n\n`;
      content += shipmentData;
    }

    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${reportName.replace(/\s+/g, "_")}_${Date.now()}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return <div style={{ padding: 24 }}>Loading reports…</div>;
  }

  if (error) {
    return <div style={{ padding: 24, color: "red" }}>Failed to load reports: {error}</div>;
  }

  const reports = [
    { title: "Shipment Summary Report", desc: "Overview of all shipments, statuses, and delivery performance." },
    { title: "Environmental Compliance Report", desc: "Temperature, humidity, and gas threshold compliance across shipments." },
    { title: "Device Health Report", desc: "Battery health, uptime, and connectivity for all IoT nodes." },
    { title: "Traceability Report", desc: "Complete farm-to-fork audit trail for selected batches." },
  ];

  return (
    <div className="page-container">
      <style>{`
        .report-filter {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 16px;
          align-items: center;
          background: var(--card-bg);
          border: 1px solid var(--border);
          border-radius: 12px;
          padding: 20px;
          margin-bottom: 20px;
        }
        .report-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 18px;
        }
        .report-card {
          background: var(--card-bg);
          border: 1px solid var(--border);
          border-radius: 12px;
          padding: 20px;
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        .rc-icon {
          width: 40px;
          height: 40px;
          border-radius: 10px;
          background: var(--bg-secondary);
          color: #10b981;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 17px;
        }
        .report-card h4 {
          font-size: 14.5px;
          margin: 0;
          color: var(--text);
        }
        .report-card p {
          font-size: 12.5px;
          color: var(--text-muted);
          margin: 0;
        }
        .report-actions {
          display: flex;
          gap: 10px;
          margin-top: 6px;
        }
        .report-actions .custom-secondary-btn {
          background-color: var(--bg-secondary);
          color: var(--text);
          border: 1px solid var(--border);
          padding: 8px 16px;
          border-radius: 8px;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
        }
        .report-actions .custom-primary-btn {
          background-color: #1b658a;
          color: #ffffff;
          border: none;
          padding: 8px 16px;
          border-radius: 8px;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
        }
        .report-data-summary {
          font-size: 12px;
          color: var(--text-muted);
          padding: 8px 0;
        }
        @media (max-width: 1024px) {
          .report-filter { grid-template-columns: repeat(2, 1fr); }
          .report-grid { grid-template-columns: 1fr; }
        }
      `}</style>

      <div className="page-header">
        <div>
          <h1>Reports</h1>
          <p>Generate and download compliance reports</p>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 text-red-700 rounded">
          Failed to load some report data
        </div>
      )}

      <div className="content-card report-filter">
        <div className="form-group">
          <label>Date Range</label>
          <select value={dateRange} onChange={(e) => setDateRange(e.target.value)} className="form-select">
            <option>Last 30 days</option>
            <option>Last 7 days</option>
            <option>Last 90 days</option>
            <option>This Year</option>
          </select>
        </div>
        <div className="form-group">
          <label>Product</label>
          <select value={product} onChange={(e) => setProduct(e.target.value)} className="form-select">
            <option>All Products</option>
            <option>Dairy</option>
            <option>Produce</option>
            <option>Meat</option>
            <option>Pharma</option>
          </select>
        </div>
        <div className="form-group">
          <label>Shipment</label>
          <select value={shipmentFilter} onChange={(e) => setShipmentFilter(e.target.value)} className="form-select">
            <option>All Shipments</option>
            <option>Active</option>
            <option>Completed</option>
            <option>Delayed</option>
          </select>
        </div>
        <div className="form-group">
          <label>Organization</label>
          <select value={organization} onChange={(e) => setOrganization(e.target.value)} className="form-select">
            <option>All Organizations</option>
            <option>Org A</option>
            <option>Org B</option>
          </select>
        </div>
      </div>

      <div className="report-data-summary">
        {dashboardData && (
          <>
            Active Shipments: {dashboardData.activeShipments ?? "—"} |
            Completed: {dashboardData.completedShipments ?? "—"} |
            Online Devices: {dashboardData.onlineDevices ?? "—"} |
            Open Alerts: {dashboardData.openAlerts ?? "—"}
          </>
        )}
      </div>

      <div className="report-grid">
        {reports.map((report) => (
          <div className="report-card" key={report.title}>
            <div className="rc-icon">
              <i className="fa-solid fa-file-lines"></i>
            </div>
            <h4>{report.title}</h4>
            <p>{report.desc}</p>
            <div className="report-actions">
              <button
                className="custom-secondary-btn"
                onClick={() => downloadReport(report.title)}
              >
                Generate Report
              </button>
              <button
                className="custom-primary-btn"
                onClick={() => downloadReport(report.title)}
              >
                Download PDF
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Reports;
