import { useState } from "react";

const Reports = () => {
  const [dateRange, setDateRange] = useState("Last 30 days");
  const [product, setProduct] = useState("All Products");
  const [shipment, setShipment] = useState("All Shipments");
  const [organization, setOrganization] = useState("All Organizations");

  const handleAction = (reportName, actionType) => {
    alert(`${actionType} for ${reportName}`);
  };

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
        /* Explicit Button Overrides to match Image 1 */
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
        @media (max-width: 1024px) {
          .report-filter {
            grid-template-columns: repeat(2, 1fr);
          }
          .report-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>

      <div className="page-header">
        <div>
          <h1>Reports</h1>
          <p>Generate and download compliance reports</p>
        </div>
      </div>

      <div className="content-card report-filter">
        <div className="form-group">
          <label>Date Range</label>
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="form-select"
          >
            <option>Last 30 days</option>
            <option>Last 7 days</option>
            <option>Last 90 days</option>
            <option>This Year</option>
          </select>
        </div>

        <div className="form-group">
          <label>Product</label>
          <select
            value={product}
            onChange={(e) => setProduct(e.target.value)}
            className="form-select"
          >
            <option>All Products</option>
            <option>Dairy</option>
            <option>Produce</option>
            <option>Meat</option>
            <option>Pharma</option>
          </select>
        </div>

        <div className="form-group">
          <label>Shipment</label>
          <select
            value={shipment}
            onChange={(e) => setShipment(e.target.value)}
            className="form-select"
          >
            <option>All Shipments</option>
            <option>Active</option>
            <option>Completed</option>
            <option>Delayed</option>
          </select>
        </div>

        <div className="form-group">
          <label>Organization</label>
          <select
            value={organization}
            onChange={(e) => setOrganization(e.target.value)}
            className="form-select"
          >
            <option>All Organizations</option>
            <option>Org A</option>
            <option>Org B</option>
          </select>
        </div>
      </div>

      <div className="report-grid">
        <div className="report-card">
          <div className="rc-icon">
            <i className="fa-solid fa-file-lines"></i>
          </div>
          <h4>Shipment Summary Report</h4>
          <p>Overview of all shipments, statuses, and delivery performance.</p>
          <div className="report-actions">
            <button
              className="custom-secondary-btn"
              onClick={() => handleAction("Shipment Summary Report", "Generate Report")}
            >
              Generate Report
            </button>
            <button
              className="custom-primary-btn"
              onClick={() => handleAction("Shipment Summary Report", "Download PDF")}
            >
              Download PDF
            </button>
          </div>
        </div>

        <div className="report-card">
          <div className="rc-icon">
            <i className="fa-solid fa-temperature-low"></i>
          </div>
          <h4>Environmental Compliance Report</h4>
          <p>Temperature, humidity, and gas threshold compliance across shipments.</p>
          <div className="report-actions">
            <button
              className="custom-secondary-btn"
              onClick={() => handleAction("Environmental Compliance Report", "Generate Report")}
            >
              Generate Report
            </button>
            <button
              className="custom-primary-btn"
              onClick={() => handleAction("Environmental Compliance Report", "Download PDF")}
            >
              Download PDF
            </button>
          </div>
        </div>

        <div className="report-card">
          <div className="rc-icon">
            <i className="fa-solid fa-microchip"></i>
          </div>
          <h4>Device Health Report</h4>
          <p>Battery health, uptime, and connectivity for all IoT nodes.</p>
          <div className="report-actions">
            <button
              className="custom-secondary-btn"
              onClick={() => handleAction("Device Health Report", "Generate Report")}
            >
              Generate Report
            </button>
            <button
              className="custom-primary-btn"
              onClick={() => handleAction("Device Health Report", "Download PDF")}
            >
              Download PDF
            </button>
          </div>
        </div>

        <div className="report-card">
          <div className="rc-icon">
            <i className="fa-solid fa-route"></i>
          </div>
          <h4>Traceability Report</h4>
          <p>Complete farm-to-fork audit trail for selected batches.</p>
          <div className="report-actions">
            <button
              className="custom-secondary-btn"
              onClick={() => handleAction("Traceability Report", "Generate Report")}
            >
              Generate Report
            </button>
            <button
              className="custom-primary-btn"
              onClick={() => handleAction("Traceability Report", "Download PDF")}
            >
              Download PDF
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Reports;