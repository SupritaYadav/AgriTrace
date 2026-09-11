import { getCollection } from "../core/mongo.js";

const PUBLIC_TIMELINE_TYPES = new Set([
  "SHIPMENT_CREATED",
  "DEVICE_ASSIGNED",
  "READY_FOR_DISPATCH",
  "SHIPMENT_DISPATCHED",
  "WAREHOUSE_RECEIVED",
  "DELIVERY_COMPLETED",
]);

export async function getPublicTraceByTrackingId(trackingId) {
  if (!trackingId || typeof trackingId !== "string") {
    return null;
  }

  const shipment = await getCollection("shipments").findOne({ trackingId });
  if (!shipment) {
    return null;
  }

  const shipmentId = shipment.shipmentId;
  const telemetryCollection = getCollection("telemetry");

  const latestTelemetry = await telemetryCollection.findOne(
    { shipmentId },
    { sort: { timestamp: -1 }, projection: { temperature: 1, humidity: 1, gasLevel: 1, battery: 1, timestamp: 1 } }
  );

  const { getShipmentEnvironmentSummary } = await import("./environmentSummaryService.js");
  const environmentSummary = await getShipmentEnvironmentSummary(shipmentId);

  const { getTimeline } = await import("./timelineService.js");
  const timeline = await getTimeline(shipmentId);

  const publicTimeline = timeline
    .filter((entry) => PUBLIC_TIMELINE_TYPES.has(entry.type))
    .map((entry) => ({
      type: entry.type,
      timestamp: entry.timestamp,
    }));

  const deviceData = shipment.assignedDevice
    ? await getCollection("devices").findOne({ deviceId: shipment.assignedDevice })
    : null;

  const { verifyShipmentCheckpoints } = await import("./checkpointService.js");
  const integrity = await verifyShipmentCheckpoints(shipmentId);
  const checkpoints = integrity.checkpoints;
  const { BLOCKCHAIN_STATUS } = await import("../utils/constants.js");
  const blockchainStatus = checkpoints.some((entry) => entry.blockchain?.status === BLOCKCHAIN_STATUS.CONFIRMED)
    ? BLOCKCHAIN_STATUS.CONFIRMED
    : checkpoints.some((entry) => entry.blockchain?.status === BLOCKCHAIN_STATUS.MOCK_CONFIRMED || entry.blockchain?.status === BLOCKCHAIN_STATUS.MOCK_VERIFIED)
      ? BLOCKCHAIN_STATUS.MOCK_CONFIRMED
    : "PENDING";

  return {
    shipmentId: shipment.shipmentId,
    trackingId: shipment.trackingId,
    productName: shipment.productName || null,
    origin: shipment.origin || null,
    destination: shipment.destination || null,
    status: shipment.status || null,
    createdAt: shipment.createdAt || null,
    environment: {
      condition: environmentSummary?.condition || "GOOD",
      averageTemperature: environmentSummary?.temperature?.average ?? null,
      averageHumidity: environmentSummary?.humidity?.average ?? null,
      maxGasLevel: environmentSummary?.gasLevel?.max ?? null,
      totalViolations: environmentSummary?.violations?.total ?? 0,
    },
    device: {
      status: deviceData?.status || "OFFLINE",
      lastSeenAt: deviceData?.lastSeenAt || null,
    },
    timeline: publicTimeline,
    integrity: {
      verified: integrity.verified,
      status: integrity.verified ? "DATA_INTEGRITY_VERIFIED" : checkpoints.length > 0 ? "DATA_INTEGRITY_FAILED" : "NO_CHECKPOINTS",
      checkpointCount: checkpoints.length,
      blockchainStatus,
      blockchainMode: process.env.BLOCKCHAIN_MODE || "mock",
    },
    latestTelemetry: latestTelemetry
      ? {
          temperature: latestTelemetry.temperature ?? null,
          humidity: latestTelemetry.humidity ?? null,
          gasLevel: latestTelemetry.gasLevel ?? null,
          battery: latestTelemetry.battery ?? null,
          timestamp: latestTelemetry.timestamp ?? null,
        }
      : null,
  };
}
