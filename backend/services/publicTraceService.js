import { db } from "../core/firebase.js";
import { getTelemetryCollection } from "../core/mongo.js";
import { getTimeline } from "./timelineService.js";
import { getShipmentEnvironmentSummary } from "./environmentSummaryService.js";

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
      verified: false,
      status: "NOT_IMPLEMENTED_YET",
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
