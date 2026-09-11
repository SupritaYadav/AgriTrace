import React, { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  FaTemperatureHalf,
  FaDroplet,
  FaLeaf,
  FaBatteryThreeQuarters,
  FaMicrochip,
  FaLocationDot,
} from "react-icons/fa6";

import { getShipment, updateShipmentStatus, assignTransporter, assignWarehouse, updateShipmentThresholds } from "../../api/shipmentApi";
import { assignDeviceToShipment } from "../../api/deviceApi";
import { getShipmentTimeline } from "../../api/timelineApi";
import { verifyShipmentIntegrity, createIntegrityCheckpoint } from "../../api/traceabilityApi";
import { getShipmentQr } from "../../api/shipmentApi";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import EmptyState from "../../components/common/EmptyState";
import ErrorState from "../../components/common/ErrorState";
import { useAuth } from "../../context/AuthContext";

const ALLOWED_TRANSITIONS = {
  PENDING: ["DEVICE_ASSIGNED", "CANCELLED"],
  DEVICE_ASSIGNED: ["READY_FOR_DISPATCH", "CANCELLED"],
  READY_FOR_DISPATCH: ["IN_TRANSIT", "CANCELLED"],
  IN_TRANSIT: ["AT_WAREHOUSE", "CANCELLED"],
  AT_WAREHOUSE: ["DELIVERED"],
};

const STATUS_LABELS = {
  PENDING: "Pending",
  DEVICE_ASSIGNED: "Device Assigned",
  READY_FOR_DISPATCH: "Ready for Dispatch",
  IN_TRANSIT: "In Transit",
  AT_WAREHOUSE: "At Warehouse",
  DELIVERED: "Delivered",
  CANCELLED: "Cancelled",
};

function ShipmentDetails() {
  const { id } = useParams();
  const { role } = useAuth();
  const [shipment, setShipment] = useState(null);
  const [timeline, setTimeline] = useState([]);
  const [integrity, setIntegrity] = useState(null);
  const [qrData, setQrData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState(null);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [shipmentRes, timelineRes, integrityRes] = await Promise.all([
        getShipment(id),
        getShipmentTimeline(id),
        verifyShipmentIntegrity(id),
      ]);
      setShipment(shipmentRes ?? null);
      setTimeline(Array.isArray(timelineRes) ? timelineRes : []);
      setIntegrity(integrityRes ?? null);
    } catch (err) {
      console.error(err);
      setError(err.message || "Failed to load shipment details");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [id]);

  const handleGenerateQr = async () => {
    setActionLoading(true);
    setActionError(null);
    try {
      const data = await getShipmentQr(id);
      setQrData(data ?? null);
    } catch (err) {
      console.error(err);
      setActionError(err.message || "Failed to generate QR");
    } finally {
      setActionLoading(false);
    }
  };

  const handleCreateCheckpoint = async () => {
    setActionLoading(true);
    setActionError(null);
    try {
      await createIntegrityCheckpoint(id);
      setActionError(null);
      const integrityRes = await verifyShipmentIntegrity(id);
      setIntegrity(integrityRes ?? null);
    } catch (err) {
      console.error(err);
      setActionError(err.message || "Failed to create checkpoint");
    } finally {
      setActionLoading(false);
    }
  };

  const handleUpdateStatus = (status) => {
    setActionLoading(true);
    setActionError(null);
    updateShipmentStatus(id, status)
      .then(() => {
        setActionLoading(false);
        fetchData();
      })
      .catch((err) => {
        console.error(err);
        setActionError(err.message || "Failed to update status");
        setActionLoading(false);
      });
  };

  const handleAssignDevice = () => {
    const deviceId = prompt("Enter device ID to assign:");
    if (!deviceId) return;
    setActionLoading(true);
    setActionError(null);
    assignDeviceToShipment(deviceId, id)
      .then(() => {
        setActionLoading(false);
        fetchData();
      })
      .catch((err) => {
        console.error(err);
        setActionError(err.message || "Failed to assign device");
        setActionLoading(false);
      });
  };

  const handleAssignTransporter = () => {
    const transporterId = prompt("Enter transporter ID:");
    if (!transporterId) return;
    setActionLoading(true);
    setActionError(null);
    assignTransporter(id, transporterId)
      .then(() => {
        setActionLoading(false);
        fetchData();
      })
      .catch((err) => {
        console.error(err);
        setActionError(err.message || "Failed to assign transporter");
        setActionLoading(false);
      });
  };

  const handleAssignWarehouse = () => {
    const warehouseId = prompt("Enter warehouse ID:");
    if (!warehouseId) return;
    setActionLoading(true);
    setActionError(null);
    assignWarehouse(id, warehouseId)
      .then(() => {
        setActionLoading(false);
        fetchData();
      })
      .catch((err) => {
        console.error(err);
        setActionError(err.message || "Failed to assign warehouse");
        setActionLoading(false);
      });
  };

  const handleUpdateThresholds = async () => {
    setActionLoading(true);
    setActionError(null);
    try {
      await updateShipmentThresholds(id, {
        temperature: { min: 8, max: 28 },
        humidity: { min: 40, max: 80 },
        gasLevel: { max: 50 },
      });
      setActionLoading(false);
      fetchData();
    } catch (err) {
      console.error(err);
      setActionError(err.message || "Failed to update thresholds");
      setActionLoading(false);
    }
  };

  if (loading) return <LoadingSpinner />;
  if (error) return <EmptyState message="Failed to load shipment details" retry={fetchData} />;
  if (!shipment) return <EmptyState message="Shipment not found" />;

  const status = shipment.status || "PENDING";
  const nextStatuses = ALLOWED_TRANSITIONS[status] || [];
  const sId = shipment.shipmentId || shipment.id || id;
  const sProduct = shipment.product || shipment.productName || "Unknown";
  const sSource = shipment.source || "Unknown";
  const sDestination = shipment.destination || "Unknown";
  const sDevice = shipment.assignedDevice || shipment.device || "Not assigned";
  const sTrackingId = shipment.trackingId || "—";

  const journeyStages = [
    { name: "Created", done: true },
    { name: "Device Assigned", done: status !== "PENDING" },
    { name: "Ready for Dispatch", done: ["READY_FOR_DISPATCH", "IN_TRANSIT", "AT_WAREHOUSE", "DELIVERED"].includes(status) },
    { name: "In Transit", done: ["IN_TRANSIT", "AT_WAREHOUSE", "DELIVERED"].includes(status) },
    { name: "At Warehouse", done: ["AT_WAREHOUSE", "DELIVERED"].includes(status) },
    { name: "Delivered", done: status === "DELIVERED" },
  ];

  return (
    <div className="page-container">
      <section className="shipment-detail-header panel">
        <div>
          <span className="eyebrow">SHIPMENT DETAILS</span>
          <h2>{sId}</h2>
          <p>{sProduct} &bull; {sSource} &rarr; {sDestination}</p>
        </div>
        <span className={`badge ${nextStatuses.length ? "transit" : "delivered"}`}>
          {STATUS_LABELS[status] || status}
        </span>
      </section>

      {actionError && <ErrorState message="Action failed" retry={() => setActionError(null)} />}

      {/* Sensors */}
      <section className="sensor-grid">
        <span className="sensor-card">
          <FaTemperatureHalf />
          <div className="sensor-card-title">Temperature</div>
          <div className="sensor-card-value">{shipment.thresholds?.temperature?.max != null ? `${shipment.thresholds.temperature.max}°C` : "Unknown"}</div>
          <div className="sensor-card-sub">Safe max threshold</div>
        </span>
        <span className="sensor-card">
          <FaDroplet />
          <div className="sensor-card-title">Humidity</div>
          <div className="sensor-card-value">{shipment.thresholds?.humidity?.max != null ? `${shipment.thresholds.humidity.max}%` : "Unknown"}</div>
          <div className="sensor-card-sub">Safe max threshold</div>
        </span>
        <span className="sensor-card">
          <FaLeaf />
          <div className="sensor-card-title">Gas Threshold</div>
          <div className="sensor-card-value">{shipment.thresholds?.gasLevel?.max != null ? `${shipment.thresholds.gasLevel.max}` : "Unknown"}</div>
          <div className="sensor-card-sub">Max level</div>
        </span>
        <span className="sensor-card">
          <FaBatteryThreeQuarters />
          <div className="sensor-card-title">Device</div>
          <div className="sensor-card-value">{sDevice}</div>
          <div className="sensor-card-sub">Assigned device</div>
        </span>
      </section>

      {/* Timeline */}
      <section className="panel">
        <div className="panel-header">
          <h3>Shipment Progress</h3>
        </div>
        <div className="timeline-horizontal">
          {journeyStages.map((step, index) => (
            <div className="timeline-step" key={step.name}>
              <div className={`timeline-dot ${index < journeyStages.findIndex(s => !s.done) || (index === 0 && journeyStages.every(s => s.done)) ? "completed" : ""}`} />
              <span>{step.name}</span>
              {index < journeyStages.length - 1 && <div className="timeline-connector" />}
            </div>
          ))}
        </div>
      </section>

      {/* Actions */}
      <section className="panel actions-section">
        <div className="actions-grid">
          {nextStatuses.map((st) => (
            <button
              key={st}
              className="btn primary"
              disabled={actionLoading}
              onClick={() => handleUpdateStatus(st)}
            >
              Mark as {STATUS_LABELS[st] || st}
            </button>
          ))}
          {role === "ADMIN" || role === "FARMER" ? (
            <button className="btn secondary" disabled={actionLoading} onClick={handleAssignDevice}>
              Assign Device
            </button>
          ) : null}
          {role === "ADMIN" || role === "FARMER" ? (
            <button className="btn secondary" disabled={actionLoading} onClick={handleAssignTransporter}>
              Assign Transporter
            </button>
          ) : null}
          {role === "ADMIN" || role === "FARMER" ? (
            <button className="btn secondary" disabled={actionLoading} onClick={handleAssignWarehouse}>
              Assign Warehouse
            </button>
          ) : null}
          {role === "ADMIN" || role === "FARMER" ? (
            <button className="btn secondary" disabled={actionLoading} onClick={handleUpdateThresholds}>
              Update Thresholds
            </button>
          ) : null}
        </div>
      </section>

      {/* Shipment Info */}
      <section className="dashboard-two-column">
        <article className="panel">
          <div className="panel-header"><h3>Shipment Information</h3></div>
          <div className="details-grid">
            <span className="detail-item"><span>Shipment ID</span><strong>{sId}</strong></span>
            <span className="detail-item"><span>Product</span><strong>{sProduct}</strong></span>
            <span className="detail-item"><span>Source</span><strong>{sSource}</strong></span>
            <span className="detail-item"><span>Destination</span><strong>{sDestination}</strong></span>
            <span className="detail-item"><span>Tracking ID</span><strong>{sTrackingId}</strong></span>
            <span className="detail-item"><span>Status</span><strong>{STATUS_LABELS[status] || status}</strong></span>
            <span className="detail-item"><span>Device</span><strong>{sDevice}</strong></span>
            <span className="detail-item"><span>Created</span><strong>{shipment.createdAt || "—"}</strong></span>
          </div>
        </article>

        {/* Timeline */}
        <article className="panel">
          <div className="panel-header"><h3>Timeline Events</h3></div>
          {timeline.length === 0 ? (
            <p>No timeline events yet.</p>
          ) : (
            <div className="timeline">
              {timeline.map((event, index) => (
                <div className="timeline-item" key={index}>
                  <div className="timeline-marker">•</div>
                  <div className="timeline-content">
                    <h3>{event.type || "Event"}</h3>
                    <span>{event.timestamp ? new Date(event.timestamp).toLocaleString() : "—"}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </article>

        {/* QR */}
        <article className="panel">
          <div className="panel-header"><h3>QR Code</h3></div>
          <div className="qr-display">
            {qrData?.qrDataUrl ? (
              <img src={qrData.qrDataUrl} alt={`QR for ${sId}`} style={{ maxWidth: 200 }} />
            ) : qrData?.traceUrl ? (
              <img src={qrData.traceUrl} alt={`QR for ${sId}`} style={{ maxWidth: 200 }} />
            ) : (
              <p>Click generate to create QR code</p>
            )}
          </div>
          <button className="btn secondary" onClick={handleGenerateQr} disabled={actionLoading}>
            {actionLoading ? "Generating..." : "Generate QR"}
          </button>
        </article>

        {/* Integrity */}
        <article className="panel">
          <div className="panel-header"><h3>Integrity</h3></div>
          {integrity == null ? (
            <p>Click verify to check integrity</p>
          ) : (
            <div>
              <p>Verified: {integrity.verified ? "Yes" : "No"}</p>
              {integrity.checkpoints && integrity.checkpoints.length > 0 && (
                <p>Checkpoints: {integrity.checkpoints.length}</p>
              )}
            </div>
          )}
          <button className="btn secondary" onClick={handleCreateCheckpoint} disabled={actionLoading}>
            Create Checkpoint
          </button>
        </article>
      </section>
    </div>
  );
}

export default ShipmentDetails;
