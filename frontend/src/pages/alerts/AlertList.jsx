import React, { useEffect, useState } from "react";
import { listAlerts, acknowledgeAlert, resolveAlert } from "../../api/alertApi";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import EmptyState from "../../components/common/EmptyState";
import Badge from "../../components/common/Badge";
import { useAuth } from "../../context/AuthContext";

function AlertList({ shipmentId }) {
  const { role } = useAuth();
  const [alerts, setAlerts] = useState([]);
  const [statusFilter, setStatusFilter] = useState("All");
  const [loading, setLoading] = useState(true);
  const [error, setEmpty] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [actionEmpty, setActionEmpty] = useState(null);

  const fetchAlerts = () => {
    setLoading(true);
    setEmpty(null);
    const params = {};
    if (statusFilter !== "All") params.status = statusFilter.toLowerCase();
    if (shipmentId) params.shipmentId = shipmentId;
    listAlerts(params)
      .then((data) => {
        // API may return { alerts: [...] } or an array directly
        const list = data?.alerts ?? data ?? [];
        setAlerts(list);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setEmpty(err);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchAlerts();
    // re-fetch when filter changes
  }, [statusFilter, shipmentId]);

  const handleAcknowledge = (id) => {
    setActionLoading(true);
    setActionEmpty(null);
    acknowledgeAlert(id)
      .then(() => {
        setActionLoading(false);
        fetchAlerts();
      })
      .catch((err) => {
        console.error(err);
        setActionEmpty(err);
        setActionLoading(false);
      });
  };

  const handleResolve = (id) => {
    setActionLoading(true);
    setActionEmpty(null);
    resolveAlert(id)
      .then(() => {
        setActionLoading(false);
        fetchAlerts();
      })
      .catch((err) => {
        console.error(err);
        setActionEmpty(err);
        setActionLoading(false);
      });
  };

  if (loading) return <LoadingSpinner />;
  if (error) return <EmptyState message="Failed to load alerts" retry={fetchAlerts} />;

  return (
    <div className="panel alerts-section">
      <div className="panel-header">
        <h3>Alerts</h3>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="status-filter"
        >
          <option>All</option>
          <option>Active</option>
          <option>Resolved</option>
        </select>
      </div>
      {actionEmpty && <EmptyState message="Action failed" retry={() => setActionEmpty(null)} />}
      <table className="responsive-table">
        <thead>
          <tr>
            <th>ID</th>
            <th>Type</th>
            <th>Severity</th>
            <th>Shipment</th>
            <th>Created</th>
            <th>Status</th>
            {role === "ADMIN" && <th>Actions</th>}
          </tr>
        </thead>
        <tbody>
          {alerts.map((a) => (
            <tr key={a.id}>
              <td>{a.id}</td>
              <td>{a.type}</td>
              <td>{a.severity}</td>
              <td>{a.shipmentId ?? "—"}</td>
              <td>{a.createdAt ?? "—"}</td>
              <td><Badge status={a.status} /></td>
              {role === "ADMIN" && (
                <td>
                  {a.status !== "acknowledged" && (
                    <button
                      className="btn primary"
                      disabled={actionLoading}
                      onClick={() => handleAcknowledge(a.id)}
                    >
                      Ack
                    </button>
                  )}
                  {a.status !== "resolved" && (
                    <button
                      className="btn secondary"
                      disabled={actionLoading}
                      onClick={() => handleResolve(a.id)}
                    >
                      Resolve
                    </button>
                  )}
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default AlertList;
