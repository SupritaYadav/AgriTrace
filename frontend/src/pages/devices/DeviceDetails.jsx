import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { getDevice, getDeviceHealth } from "../../api/deviceApi";
import { getLatestDeviceTelemetry } from "../../api/telemetryApi";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import ErrorState from "../../components/common/ErrorState";
import Badge from "../../components/common/Badge";

function DeviceDetails() {
  const { id } = useParams();
  const [device, setDevice] = useState(null);
  const [health, setHealth] = useState(null);
  const [telemetry, setTelemetry] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [deviceRes, healthRes, telemetryRes] = await Promise.all([
          getDevice(id),
          getDeviceHealth(id),
          getLatestDeviceTelemetry(id),
        ]);
        setDevice(deviceRes ?? {});
        setHealth(healthRes ?? {});
        setTelemetry(telemetryRes ?? null);
      } catch (err) {
        console.error(err);
        setError(err.message || "Error fetching device");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorState message={error} />;

  const deviceStatus = health?.status ?? device?.status ?? "Unknown";
  const isOnline = deviceStatus === "ONLINE";

  return (
    <div className="device-detail container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Device {device?.deviceId ?? id}</h1>
      <p>Status: <Badge variant={isOnline ? "online" : "offline"}>{deviceStatus}</Badge></p>
      <p>Battery: {health?.battery != null ? `${health.battery}%` : "N/A"}</p>
      <p>Last Seen: {health?.lastSeenAt ? new Date(health.lastSeenAt).toLocaleString() : "Location unavailable"}</p>
      <p>Current Shipment: {health?.currentShipmentId ?? device?.currentShipmentId ?? "Not assigned"}</p>
      <p>Firmware: {health?.firmwareVersion ?? device?.firmwareVersion ?? "—"}</p>
      <p>Temperature: {telemetry?.temperature != null ? `${telemetry.temperature}°C` : "No telemetry available"}</p>
      <p>Humidity: {telemetry?.humidity != null ? `${telemetry.humidity}%` : "No telemetry available"}</p>
      <p>Gas Level: {telemetry?.gasLevel != null ? `${telemetry.gasLevel}` : "No telemetry available"}</p>
      <p>Latitude: {telemetry?.latitude != null ? telemetry.latitude.toFixed(5) : "Location unavailable"}</p>
      <p>Longitude: {telemetry?.longitude != null ? telemetry.longitude.toFixed(5) : "Location unavailable"}</p>
      <p>Telemetry Timestamp: {telemetry?.timestamp ? new Date(telemetry.timestamp).toLocaleString() : "No telemetry available"}</p>
      <Link to={`/devices/assign?deviceId=${device?.deviceId ?? id}`} className="btn btn-primary mt-4">Assign to Shipment</Link>
    </div>
  );
}

export default DeviceDetails;