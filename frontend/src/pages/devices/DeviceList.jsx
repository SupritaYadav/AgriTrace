import React, { useEffect, useState } from "react";
import { listDevices, assignDeviceToShipment, registerDevice } from "../../api/deviceApi";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import EmptyState from "../../components/common/EmptyState";
import { useAuth } from "../../context/AuthContext";
import Badge from "../../components/common/Badge";

function DeviceList() {
  const { role } = useAuth();
  const canManage = role === "ADMIN" || role === "FARMER";
  const [devices, setDevices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newDevice, setNewDevice] = useState({ serialNumber: "", location: "", type: "Sensor" });

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

  const handleAddDevice = async () => {
    if (!newDevice.serialNumber.trim()) return;
    setActionLoading(true);
    setActionError(null);
    try {
      await registerDevice({
        deviceId: newDevice.serialNumber.trim(),
        location: newDevice.location.trim(),
        type: newDevice.type,
      });
      setShowAddForm(false);
      setNewDevice({ serialNumber: "", location: "", type: "Sensor" });
      fetchDevices();
    } catch (err) {
      console.error(err);
      setActionError(err);
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) return <LoadingSpinner />;
  if (error) return <EmptyState message="Failed to load devices" retry={fetchDevices} />;

  return (
    <div className="page-container">
      {actionError && <EmptyState message="Action failed" retry={() => setActionError(null)} />}
      <section className="panel">
        <div className="panel-header">
          <h3>Device List</h3>
          {canManage && (
            <button
              className="btn primary small"
              onClick={() => setShowAddForm(!showAddForm)}
            >
              <i className="fa-solid fa-plus"></i> Add Device
            </button>
          )}
        </div>
        {showAddForm && (
          <div className="card" style={{ padding: 16, marginBottom: 16 }}>
            <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
              <input
                type="text"
                placeholder="Serial Number"
                value={newDevice.serialNumber}
                onChange={(e) => setNewDevice((prev) => ({ ...prev, serialNumber: e.target.value }))}
                style={{ padding: "8px 12px", borderRadius: 8, border: "1px solid var(--border)", flex: 1, minWidth: 200 }}
              />
              <input
                type="text"
                placeholder="Location"
                value={newDevice.location}
                onChange={(e) => setNewDevice((prev) => ({ ...prev, location: e.target.value }))}
                style={{ padding: "8px 12px", borderRadius: 8, border: "1px solid var(--border)", flex: 1, minWidth: 200 }}
              />
              <select
                value={newDevice.type}
                onChange={(e) => setNewDevice((prev) => ({ ...prev, type: e.target.value }))}
                style={{ padding: "8px 12px", borderRadius: 8, border: "1px solid var(--border)" }}
              >
                <option>Sensor</option>
                <option>Gateway</option>
                <option>Tracker</option>
              </select>
              <button
                className="btn primary small"
                onClick={handleAddDevice}
                disabled={actionLoading}
              >
                {actionLoading ? "Adding..." : "Add"}
              </button>
              <button
                className="btn secondary small"
                onClick={() => setShowAddForm(false)}
              >
                Cancel
              </button>
            </div>
          </div>
        )}
        <table className="responsive-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Status</th>
              <th>Battery</th>
              <th>Last Seen</th>
              <th>Shipment</th>
              <th>Firmware</th>
              {canManage && <th>Actions</th>}
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
                  {canManage && (
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