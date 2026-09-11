import React, { useEffect, useState } from "react";
import { listDevices, assignDeviceToShipment } from "../../api/deviceApi";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import EmptyState from "../../components/common/EmptyState";
import { useAuth } from "../../context/AuthContext";
import Badge from "../../components/common/Badge";

function DeviceList() {
  const { role } = useAuth();
  const [devices, setDevices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState(null);

  const fetchDevices = () => {
    setLoading(true);
    setError(null);
    listDevices()
      .then((data) => {
        const list = Array.isArray(data) ? data : [];
        setDevices(list);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setError(err);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchDevices();
  }, []);

  const handleAssign = (deviceId) => {
    const shipmentId = prompt("Enter Shipment ID to assign this device to:");
    if (!shipmentId) return;
    setActionLoading(true);
    setActionError(null);
    assignDeviceToShipment(deviceId, shipmentId)
      .then(() => {
        setActionLoading(false);
        fetchDevices();
      })
      .catch((err) => {
        console.error(err);
        setActionError(err);
        setActionLoading(false);
      });
  };

  if (loading) return <LoadingSpinner />;
  if (error) return <EmptyState message="Failed to load devices" retry={fetchDevices} />;

  return (
    <div className="page-container">
      {actionError && <EmptyState message="Action failed" retry={() => setActionError(null)} />}
      <section className="panel">
        <div className="panel-header"><h3>Device List</h3></div>
        <table className="responsive-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Status</th>
              <th>Battery</th>
              <th>Last Seen</th>
              <th>Shipment</th>
              <th>Firmware</th>
              {role === "ADMIN" && <th>Actions</th>}
            </tr>
          </thead>
          <tbody>
            {devices.map((d) => (
              <tr key={d.deviceId}>
                <td>{d.deviceId ?? "Unknown"}</td>
                <td>
                  <Badge status={d.status === "ONLINE" ? "Online" : "Offline"} />
                </td>
                <td>{d.battery != null ? `${d.battery}%` : "—"}</td>
                <td>{d.lastSeenAt ? new Date(d.lastSeenAt).toLocaleString() : "Location unavailable"}</td>
                <td>{d.currentShipmentId ?? "Not assigned"}</td>
                <td>{d.firmwareVersion ?? "—"}</td>
                {role === "ADMIN" && (
                  <td>
                    <button className="btn secondary" disabled={actionLoading} onClick={() => handleAssign(d.deviceId)}>
                      Assign to Shipment
                    </button>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
        {devices.length === 0 && <EmptyState message="No devices found" />}
      </section>
    </div>
  );
}

export default DeviceList;