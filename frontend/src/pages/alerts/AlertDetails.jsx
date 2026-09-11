import React, { useEffect, useState } from "react";
import { getAlert, acknowledgeAlert, resolveAlert } from "../../api/alertApi";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import ErrorState from "../../components/common/ErrorState";
import Badge from "../../components/common/Badge";
import { useAuth } from "../../context/AuthContext";

function AlertDetails({ alertId, onClose }) {
  const { role } = useAuth();
  const [alert, setAlert] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState(null);

  const fetchAlert = () => {
    setLoading(true);
    setError(null);
    getAlert(alertId)
      .then((data) => {
        setAlert(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setError(err);
        setLoading(false);
      });
  };

  useEffect(() => {
    if (alertId) {
      fetchAlert();
    }
  }, [alertId]);

  const handleAcknowledge = () => {
    setActionLoading(true);
    setActionError(null);
    acknowledgeAlert(alertId)
      .then(() => {
        setActionLoading(false);
        fetchAlert();
      })
      .catch((err) => {
        console.error(err);
        setActionError(err);
        setActionLoading(false);
      });
  };

  const handleResolve = () => {
    setActionLoading(true);
    setActionError(null);
    resolveAlert(alertId)
      .then(() => {
        setActionLoading(false);
        fetchAlert();
      })
      .catch((err) => {
        console.error(err);
        setActionError(err);
        setActionLoading(false);
      });
  };

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorState message="Failed to load alert" retry={fetchAlert} />;

  return (
    <div className="modal alert-details">
      <div className="modal-header">
        <h3>Alert Details</h3>
        <button className="close-btn" onClick={onClose}>✕</button>
      </div>
      {actionError && <ErrorState message="Action failed" retry={() => setActionError(null)} />}
      <div className="alert-info">
        <p><strong>ID:</strong> {alert.id}</p>
        <p><strong>Type:</strong> {alert.type}</p>
        <p><strong>Severity:</strong> {alert.severity}</p>
        <p><strong>Status:</strong> <Badge status={alert.status} /></p>
        <p><strong>Message:</strong> {alert.message}</p>
        <p><strong>Created At:</strong> {alert.createdAt}</p>
        <p><strong>Shipment:</strong> {alert.shipmentId || "—"}</p>
      </div>
      {role === "ADMIN" && (
        <div className="alert-actions">
          {alert.status !== "acknowledged" && (
            <button className="btn primary" disabled={actionLoading} onClick={handleAcknowledge}>Acknowledge</button>
          )}
          {alert.status !== "resolved" && (
            <button className="btn secondary" disabled={actionLoading} onClick={handleResolve}>Resolve</button>
          )}
        </div>
      )}
    </div>
  );
}

export default AlertDetails;
