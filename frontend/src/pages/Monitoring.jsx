import React, { useEffect, useState } from "react";
import { FaTemperatureHalf, FaDroplet, FaLeaf, FaBatteryThreeQuarters } from "react-icons/fa6";

import { listShipments } from "../api/shipmentApi";
import { listDevices } from "../api/deviceApi";
import { getLatestDeviceTelemetry, getDeviceTelemetryHistory } from "../api/telemetryApi";
import websocketService from "../services/websocketService";

import SensorCard from "../components/common/SensorCard";
import LoadingSpinner from "../components/common/LoadingSpinner";
import EmptyState from "../components/common/EmptyState";

const HISTORY_LENGTH = 20;

function Monitoring() {
  const [shipmentId, setShipmentId] = useState("");
  const [selectedDeviceId, setSelectedDeviceId] = useState("");

  const [shipments, setShipments] = useState([]);
  const [devices, setDevices] = useState([]);
  const [telemetry, setTelemetry] = useState(null);
  const [history, setHistory] = useState({ temperature: [], humidity: [], battery: [] });

  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchInitial = async () => {
      try {
        const [shipRes, devRes] = await Promise.all([listShipments(), listDevices()]);
        setShipments(shipRes ?? []);
        setDevices(devRes ?? []);
        if (shipRes && shipRes.length > 0 && !shipmentId) {
          setShipmentId(shipRes[0].shipmentId || shipRes[0].id || "");
        }
      } catch (err) {
        console.error(err);
        setError(err.message || "Failed to load shipments/devices");
      } finally {
        setLoading(false);
      }
    };
    fetchInitial();
  }, []);

  useEffect(() => {
    const loadTelemetry = async () => {
      if (!shipmentId) return;
      const shipment = shipments.find(s => (s.shipmentId || s.id) === shipmentId);
      const deviceId = shipment?.assignedDevice || shipment?.device || "";
      setSelectedDeviceId(deviceId);
      setTelemetry(null);
      setHistory({ temperature: [], humidity: [], battery: [] });
      if (!deviceId) {
        return;
      }
      try {
        const [latestRes, historyRes] = await Promise.all([
          getLatestDeviceTelemetry(deviceId),
          getDeviceTelemetryHistory(deviceId, { limit, page })
        ]);
        setTelemetry(latestRes ?? null);
        const histData = Array.isArray(historyRes) ? historyRes : [];
        setHistory({
          temperature: histData.map(d => d.temperature),
          humidity: histData.map(d => d.humidity),
          battery: histData.map(d => d.battery)
        });
      } catch (err) {
        console.error(err);
        setError(err.message || "Failed to load telemetry");
      }
    };
    loadTelemetry();
  }, [shipmentId, shipments, page, limit]);

  useEffect(() => {
    if (!selectedDeviceId || !shipmentId) return;
    const wsUrl = import.meta.env.VITE_WS_URL;
    if (!wsUrl) return;
    websocketService.connect(wsUrl);
    const unsubscribe = websocketService.on("telemetry.updated", payload => {
      if (payload.deviceId === selectedDeviceId && payload.shipmentId === shipmentId) {
        setTelemetry(payload);
        setHistory(prev => ({
          temperature: [...prev.temperature.slice(-HISTORY_LENGTH + 1), payload.temperature],
          humidity: [...prev.humidity.slice(-HISTORY_LENGTH + 1), payload.humidity],
          battery: [...prev.battery.slice(-HISTORY_LENGTH + 1), payload.battery]
        }));
      }
    });
    return () => {
      unsubscribe();
    };
  }, [selectedDeviceId, shipmentId]);

  if (loading) return <LoadingSpinner />;
  if (error) return <EmptyState message={error} />;

  const hasDevice = !!selectedDeviceId;
  const hasTelemetry = telemetry != null;
  const unsafe = hasTelemetry && (telemetry.temperature > 28 || telemetry.humidity > 80 || telemetry.gasLevel !== "Safe");

  const handlePrevPage = () => setPage(p => Math.max(p - 1, 1));
  const handleNextPage = () => setPage(p => p + 1);

  let statusMessage;
  let statusClass;
  if (!hasDevice) {
    statusMessage = "No monitoring device assigned";
    statusClass = "idle";
  } else if (!hasTelemetry) {
    statusMessage = "Waiting for first telemetry reading...";
    statusClass = "idle";
  } else if (unsafe) {
    statusMessage = "Warning: One or more environmental parameters are outside the configured safety range.";
    statusClass = "warning";
  } else {
    statusMessage = "All environmental parameters are currently within safe limits.";
    statusClass = "safe";
  }

  return (
    <div className="page-container">
      <section className="toolbar">
        <label>
          Select Shipment
          <select value={shipmentId} onChange={e => setShipmentId(e.target.value)}>
            {shipments.map(shp => (
              <option key={shp.shipmentId || shp.id} value={shp.shipmentId || shp.id}>{shp.shipmentId || shp.id} — {shp.product}</option>
            ))}
          </select>
        </label>
        <label>
          Select Device
          <select value={selectedDeviceId} onChange={e => setSelectedDeviceId(e.target.value)}>
            <option value="">No device</option>
            {devices.map(dev => (
              <option key={dev.deviceId || dev.id} value={dev.deviceId || dev.id}>{dev.deviceId || dev.id}</option>
            ))}
          </select>
        </label>
        <label>
          Limit per page
          <select value={limit} onChange={e => setLimit(Number(e.target.value))}>
            <option value={10}>10</option>
            <option value={20}>20</option>
            <option value={50}>50</option>
          </select>
        </label>
        <div className="live-pill"><span />LIVE</div>
      </section>

      <section className={`status-banner ${statusClass}`}>
        {statusMessage}
      </section>

      <section className="sensor-grid">
        <SensorCard
          icon={<FaTemperatureHalf />}
          title="Temperature"
          value={hasTelemetry && telemetry.temperature != null ? `${telemetry.temperature}°C` : "—"}
          subtitle="8°C – 28°C"
          status={hasTelemetry && telemetry.temperature > 28 ? "warning" : hasTelemetry ? "safe" : "idle"}
          history={history.temperature}
        />
        <SensorCard
          icon={<FaDroplet />}
          title="Humidity"
          value={hasTelemetry && telemetry.humidity != null ? `${telemetry.humidity}%` : "—"}
          subtitle="40% – 80%"
          status={hasTelemetry && telemetry.humidity > 80 ? "warning" : hasTelemetry ? "safe" : "idle"}
          history={history.humidity}
        />
        <SensorCard
          icon={<FaLeaf />}
          title="Gas Level"
          value={hasTelemetry && telemetry.gasLevel != null ? `${telemetry.gasLevel}` : "—"}
          subtitle="Environmental safety"
          status={hasTelemetry && telemetry.gasLevel !== "Safe" ? "warning" : hasTelemetry ? "safe" : "idle"}
        />
        <SensorCard
          icon={<FaBatteryThreeQuarters />}
          title="Battery"
          value={hasTelemetry && telemetry.battery != null ? `${telemetry.battery}%` : "—"}
          subtitle={hasDevice ? selectedDeviceId : "No device"}
          status={hasTelemetry && telemetry.battery < 25 ? "warning" : hasTelemetry ? "safe" : "idle"}
          history={history.battery}
        />
      </section>

      <section className="card panel">
        <div className="panel-header">
          <div>
            <h3>Telemetry History</h3>
            <button onClick={handlePrevPage} disabled={page === 1}>Prev</button>
            <span> Page {page} </span>
            <button onClick={handleNextPage}>Next</button>
          </div>
        </div>
        {/* Raw history UI could be added here */}
      </section>
    </div>
  );
}

export default Monitoring;