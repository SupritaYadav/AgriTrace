import { getTelemetryCollection } from "../core/mongo.js";

function getCollection() {
  const collection = getTelemetryCollection();

  if (!collection) {
    const error = new Error("Telemetry database is not initialized");
    error.code = "TELEMETRY_DATABASE_UNAVAILABLE";
    throw error;
  }

  return collection;
}

function buildHistoryQuery(field, value, filters = {}) {
  const query = { [field]: value };

  if (filters.from || filters.to) {
    query.timestamp = {};

    if (filters.from) query.timestamp.$gte = filters.from;
    if (filters.to) query.timestamp.$lte = filters.to;
  }

  return query;
}

export async function getLatestTelemetryByDevice(deviceId) {
  return getCollection().findOne(
    { deviceId },
    { sort: { timestamp: -1 } }
  );
}

export async function getTelemetryHistoryByDevice(deviceId, filters) {
  return getCollection()
    .find(buildHistoryQuery("deviceId", deviceId, filters))
    .sort({ timestamp: -1 })
    .limit(filters.limit)
    .toArray();
}

export async function getLatestTelemetryByShipment(shipmentId) {
  return getCollection().findOne(
    { shipmentId },
    { sort: { timestamp: -1 } }
  );
}

export async function getTelemetryHistoryByShipment(shipmentId, filters) {
  return getCollection()
    .find(buildHistoryQuery("shipmentId", shipmentId, filters))
    .sort({ timestamp: -1 })
    .limit(filters.limit)
    .toArray();
}
