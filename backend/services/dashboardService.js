import { getTelemetryCollection } from "../core/mongo.js";
import { listShipments } from "./shipmentService.js";
import { listDevices } from "./deviceService.js";
import { listAlerts } from "./alertService.js";

export async function getDashboardSummary(uid, role) {
  // --------------------------------------------------
  // 1. Get shipments accessible to current user
  // --------------------------------------------------
  const shipmentsResult = await listShipments(uid, role);

  const shipments = Array.isArray(shipmentsResult)
    ? shipmentsResult
    : shipmentsResult?.data || [];

  const shipmentIds = shipments.map((s) => s.shipmentId);

  // --------------------------------------------------
  // 2. Shipment counts
  // --------------------------------------------------
  const completedShipments = shipments.filter(
    (s) => s.status === "DELIVERED"
  ).length;

  const activeShipments = shipments.filter(
    (s) =>
      !["DELIVERED", "CANCELLED"].includes(s.status)
  ).length;

  // --------------------------------------------------
  // 3. Devices
  // --------------------------------------------------
  const allDevicesResult = await listDevices();

  const allDevices = Array.isArray(allDevicesResult)
    ? allDevicesResult
    : allDevicesResult?.data || [];

  let devices;

  if (role === "ADMIN") {
    devices = allDevices;
  } else {
    devices = allDevices.filter(
      (device) =>
        device.currentShipmentId &&
        shipmentIds.includes(device.currentShipmentId)
    );
  }

  const onlineDevices = devices.filter(
    (device) => device.status === "ONLINE"
  ).length;

  const offlineDevices = devices.filter(
    (device) => device.status === "OFFLINE"
  ).length;

  // --------------------------------------------------
  // 4. Alerts
  // --------------------------------------------------
  const alertResult = await listAlerts({
    status: "OPEN",
    limit: 100,
  });

  const rawAlerts = Array.isArray(alertResult)
    ? alertResult
    : alertResult?.data || alertResult?.alerts || [];

  const alerts =
    role === "ADMIN"
      ? rawAlerts
      : rawAlerts.filter(
          (alert) =>
            alert.shipmentId &&
            shipmentIds.includes(alert.shipmentId)
        );

  const openAlerts = alerts.filter(
    (alert) => alert.status === "OPEN"
  ).length;

  const criticalAlerts = alerts.filter(
    (alert) =>
      alert.status === "OPEN" &&
      alert.severity === "CRITICAL"
  ).length;

  // --------------------------------------------------
  // 5. Telemetry averages
  // --------------------------------------------------
  const telemetryCollection = getTelemetryCollection();

  let averageTemperature = 0;
  let averageHumidity = 0;

  if (role === "ADMIN" || shipmentIds.length > 0) {
    const match =
      role === "ADMIN"
        ? {}
        : {
            shipmentId: {
              $in: shipmentIds,
            },
          };

    const aggregate = await telemetryCollection
      .aggregate([
        {
          $match: match,
        },
        {
          $group: {
            _id: null,
            averageTemperature: {
              $avg: "$temperature",
            },
            averageHumidity: {
              $avg: "$humidity",
            },
          },
        },
      ])
      .toArray();

    if (aggregate.length > 0) {
      averageTemperature =
        aggregate[0].averageTemperature || 0;

      averageHumidity =
        aggregate[0].averageHumidity || 0;
    }
  }

  // --------------------------------------------------
  // 6. Recent shipments
  // --------------------------------------------------
  const recentShipments = [...shipments]
    .sort(
      (a, b) =>
        new Date(b.createdAt || 0) -
        new Date(a.createdAt || 0)
    )
    .slice(0, 5);

  // --------------------------------------------------
  // 7. Recent alerts
  // --------------------------------------------------
  const recentAlerts = [...alerts]
    .sort(
      (a, b) =>
        new Date(b.timestamp || 0) -
        new Date(a.timestamp || 0)
    )
    .slice(0, 5);

  return {
    activeShipments,
    completedShipments,
    onlineDevices,
    offlineDevices,
    openAlerts,
    criticalAlerts,
    averageTemperature:
      Number(averageTemperature.toFixed(2)),
    averageHumidity:
      Number(averageHumidity.toFixed(2)),
    recentShipments,
    recentAlerts,
  };
}