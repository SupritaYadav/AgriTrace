import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { listAlerts, acknowledgeAlert, resolveAlert } from "../api/alertApi";
import { useAuth } from "../context/AuthContext";
import LoadingSpinner from "../components/common/LoadingSpinner";
import EmptyState from "../components/common/EmptyState";
import Badge from "../components/common/Badge";

const FILTERS = [
  "All",
  "Critical",
  "Warning",
  "Device",
  "Environmental",
  "Resolved",
];

function Alerts() {
  const navigate = useNavigate();
  const { role } = useAuth();
  const [alerts, setAlerts] = useState([]);
  const [filter, setFilter] = useState("All");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState(null);

  const fetchAlerts = () => {
    setLoading(true);
    setError(null);
    const params = {};
    if (filter !== "All") {
      if (filter === "Critical") params.severity = "CRITICAL";
      else if (filter === "Warning") params.severity = "WARNING";
      else if (filter === "Device") params.type = "DEVICE_OFFLINE";
      else if (filter === "Environmental") params.type = "HIGH_TEMP,HIGH_HUMIDITY,HIGH_GAS";
      else if (filter === "Resolved") params.status = "RESOLVED";
    }
    listAlerts(params)
      .then((data) => {
        const list = data?.alerts ?? data ?? [];
        setAlerts(list);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setError(err);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchAlerts();
  }, [filter]);

  const handleAcknowledge = (alertId) => {
    setActionLoading(true);
    setActionError(null);
    acknowledgeAlert(alertId)
      .then(() => {
        setActionLoading(false);
        fetchAlerts();
      })
      .catch((err) => {
        console.error(err);
        setActionError(err);
        setActionLoading(false);
      });
  };

  const handleResolve = (alertId) => {
    if (role !== "ADMIN") return;
    setActionLoading(true);
    setActionError(null);
    resolveAlert(alertId)
      .then(() => {
        setActionLoading(false);
        fetchAlerts();
      })
      .catch((err) => {
        console.error(err);
        setActionError(err);
        setActionLoading(false);
      });
  };

  const handleViewShipment = (shipmentId) => {
    if (shipmentId) {
      navigate(`/shipments/${shipmentId}`);
    }
  };

  const getSeverityClass = (severity) => {
    switch (severity) {
      case "CRITICAL": return "critical";
      case "WARNING": return "warning";
      default: return "warning";
    }
  };

  const getTypeIcon = (type) => {
    if (type === "DEVICE_OFFLINE") return "🔌";
    return "⚠️";
  };

  if (loading) return <LoadingSpinner />;
  if (error) return <EmptyState message="Failed to load alerts" retry={fetchAlerts} />;

  return (
    <div className="page-container">
      {actionError && <EmptyState message="Action failed" retry={() => setActionError(null)} />}

      <section className="card panel alert-filter-row">
        {FILTERS.map((item) => (
          <button
            key={item}
            onClick={() => setFilter(item)}
            className={`chip ${filter === item ? "active" : ""}`}
          >
            {item}
          </button>
        ))}
      </section>

      <section className="alert-center-list">
        {alerts.length === 0 ? (
          <EmptyState message="No alerts found" icon="✅" />
        ) : (
          alerts.map((alert) => (
            <article
              className={`alert-card ${getSeverityClass(alert.severity)} ${alert.status === "RESOLVED" ? "resolved" : ""}`}
              key={alert.alertId}
            >
              <div className="ai">
                {getTypeIcon(alert.type)}
              </div>

              <div className="alert-body">
                <div className="alert-card-title">
                  <span className={`tag-${alert.severity.toLowerCase()}`}>
                    {alert.severity}
                  </span>
                  {alert.message || alert.type}
                </div>

                <div className="alert-card-sub">
                  {alert.deviceId ? `Device: ${alert.deviceId}` : "No device"} ·{" "}
                  {alert.shipmentId ? `Shipment: ${alert.shipmentId}` : "No shipment"}
                  {alert.value != null && alert.threshold != null && (
                    <>
                      · Value: {alert.value} · Threshold: {alert.threshold}
                    </>
                  )}
                </div>

                <div className="alert-card-time">
                  {alert.status === "RESOLVED"
                    ? `Resolved · ${alert.createdAt ? new Date(alert.createdAt).toLocaleString() : "Unknown"}`
                    : alert.createdAt ? new Date(alert.createdAt).toLocaleString() : "Unknown"}
                </div>

                <div className="alert-card-actions">
                  {alert.shipmentId && (
                    <button
                      className="btn ghost small"
                      onClick={() => handleViewShipment(alert.shipmentId)}
                    >
                      View Shipment
                    </button>
                  )}

                  {alert.status !== "ACKNOWLEDGED" && role === "ADMIN" && (
                    <button
                      className="btn primary small"
                      disabled={actionLoading}
                      onClick={() => handleAcknowledge(alert.alertId)}
                    >
                      Acknowledge
                    </button>
                  )}

                  {alert.status !== "RESOLVED" && role === "ADMIN" && (
                    <button
                      className="btn secondary small"
                      disabled={actionLoading}
                      onClick={() => handleResolve(alert.alertId)}
                    >
                      Resolve
                    </button>
                  )}

                  <button
                    className="btn ghost small"
                    onClick={() => {
                      if (window.confirm("Dismiss this alert from view?")) {
                        setAlerts((prev) => prev.filter((a) => a.alertId !== alert.alertId));
                      }
                    }}
                  >
                    Dismiss
                  </button>
                </div>
              </div>
            </article>
          ))
        )}
      </section>
    </div>
  );
}

export default Alerts;