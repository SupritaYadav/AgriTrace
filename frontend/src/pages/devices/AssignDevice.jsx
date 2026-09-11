import React, { useEffect, useState } from "react";
import { FaMicrochip, FaBoxOpen, FaArrowRightArrowLeft } from "react-icons/fa6";
import { listDevices } from "../../api/deviceApi";
import { listShipments } from "../../api/shipmentApi";
import { assignDeviceToShipment } from "../../api/deviceApi";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import EmptyState from "../../components/common/EmptyState";

function AssignDevice() {
  const [devices, setDevices] = useState([]);
  const [shipments, setShipments] = useState([]);
  const [selectedDevice, setSelectedDevice] = useState("");
  const [selectedShipment, setSelectedShipment] = useState("");
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [assignLoading, setAssignLoading] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const [devicesRes, shipmentsRes] = await Promise.all([
          listDevices(),
          listShipments(),
        ]);
        setDevices(Array.isArray(devicesRes) ? devicesRes : []);
        setShipments(Array.isArray(shipmentsRes) ? shipmentsRes : []);
      } catch (err) {
        console.error(err);
        setError(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const availableDevices = devices.filter(
    (device) => device.status === "AVAILABLE" || !device.currentShipmentId
  );

  const unassignedShipments = shipments.filter(
    (shipment) => !shipment.deviceId && !shipment.currentDeviceId
  );

  const handleAssign = async () => {
    if (!selectedDevice || !selectedShipment) {
      setMessage("Select both a device and shipment.");
      setMessageType("error");
      return;
    }

    setAssignLoading(true);
    setMessage("");
    try {
      await assignDeviceToShipment(selectedDevice, selectedShipment);
      setMessage(`Device ${selectedDevice} assigned to shipment ${selectedShipment}.`);
      setMessageType("success");
      setSelectedDevice("");
      setSelectedShipment("");
      const [devicesRes, shipmentsRes] = await Promise.all([
        listDevices(),
        listShipments(),
      ]);
      setDevices(Array.isArray(devicesRes) ? devicesRes : []);
      setShipments(Array.isArray(shipmentsRes) ? shipmentsRes : []);
    } catch (err) {
      console.error(err);
      setMessage(err.message || "Failed to assign device");
      setMessageType("error");
    } finally {
      setAssignLoading(false);
    }
  };

  if (loading) return <LoadingSpinner />;
  if (error) return <EmptyState message="Failed to load data" retry={() => window.location.reload()} />;

  return (
    <div className="page-container">
      {message && (
        <div className={`status-banner ${messageType === "success" ? "safe" : "warning"}`}>
          {message}
        </div>
      )}

      <section className="assign-grid">
        <article className="panel">
          <div className="panel-header">
            <h3>Available Devices</h3>
          </div>
          <div className="pick-list">
            {availableDevices.length === 0 ? (
              <EmptyState message="No available devices" icon="⚙️" />
            ) : (
              availableDevices.map((device) => (
                <button
                  key={device.deviceId}
                  className={`pick-item ${selectedDevice === device.deviceId ? "selected" : ""}`}
                  onClick={() => setSelectedDevice(device.deviceId)}
                >
                  <FaMicrochip />
                  <div>
                    <div className="pi-title">{device.deviceId}</div>
                    <div className="pi-sub">
                      Battery {device.battery != null ? `${device.battery}%` : "N/A"} ·
                      Last seen {device.lastSeenAt ? new Date(device.lastSeenAt).toLocaleString() : "Location unavailable"}
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>
        </article>

        <div className="assign-center">
          <FaArrowRightArrowLeft />
          <button
            className="btn primary"
            onClick={handleAssign}
            disabled={!selectedDevice || !selectedShipment || assignLoading}
          >
            {assignLoading ? "Assigning..." : "Assign Device"}
          </button>
        </div>

        <article className="panel">
          <div className="panel-header">
            <h3>Active Shipments Without Devices</h3>
          </div>
          <div className="pick-list">
            {unassignedShipments.length === 0 ? (
              <EmptyState message="No unassigned shipments" icon="📦" />
            ) : (
              unassignedShipments.map((shipment) => (
                <button
                  key={shipment.shipmentId ?? shipment.id}
                  className={`pick-item ${selectedShipment === (shipment.shipmentId ?? shipment.id) ? "selected" : ""}`}
                  onClick={() => setSelectedShipment(shipment.shipmentId ?? shipment.id)}
                >
                  <FaBoxOpen />
                  <div>
                    <div className="pi-title">{shipment.shipmentId ?? shipment.id}</div>
                    <div className="pi-sub">
                      {shipment.product ?? "Unknown product"} ·{" "}
                      {shipment.source ?? "Unknown"} →{" "}
                      {shipment.destination ?? "Unknown"}
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>
        </article>
      </section>
    </div>
  );
}

export default AssignDevice;