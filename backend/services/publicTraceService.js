import { db } from "../core/firebase.js";
import { getTelemetryCollection } from "../core/mongo.js";
import { getTimeline } from "./timelineService.js";
import { getShipmentEnvironmentSummary } from "./environmentSummaryService.js";
import { verifyShipmentCheckpoints } from "./checkpointService.js";
import { BLOCKCHAIN_STATUS } from "../utils/constants.js";

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

  const shipmentSnapshot = await db
    .collection("shipments")
    .where("trackingId", "==", trackingId)
    .limit(1)
    .get();

  if (shipmentSnapshot.empty) {
    return null;
  }

  const shipment = shipmentSnapshot.docs[0].data();
  const shipmentId = shipment.shipmentId;
  const telemetryCollection = getTelemetryCollection();

  const latestTelemetry = await telemetryCollection.findOne(
    { shipmentId },
    { sort: { timestamp: -1 }, projection: { temperature: 1, humidity: 1, gasLevel: 1, battery: 1, timestamp: 1 } }
  );

  const environmentSummary = await getShipmentEnvironmentSummary(shipmentId);
  const timeline = await getTimeline(shipmentId);

  const publicTimeline = timeline
    .filter((entry) => PUBLIC_TIMELINE_TYPES.has(entry.type))
    .map((entry) => ({
      type: entry.type,
      timestamp: entry.timestamp,
    }));

  const deviceDoc = shipment.assignedDevice
    ? await db.collection("devices").doc(shipment.assignedDevice).get()
    : null;

  const deviceData = deviceDoc?.exists ? deviceDoc.data() : null;
  const integrity = await verifyShipmentCheckpoints(shipmentId);
  const checkpoints = integrity.checkpoints;
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
