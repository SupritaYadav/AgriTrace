import { getCollection } from "../core/mongo.js";
import { getTelemetryCollection } from "../core/mongo.js";

export async function registerDevice(data) {
  const devices = getCollection("devices");
  const deviceData = {
    deviceId: data.deviceId,
    serialNumber: data.serialNumber || data.deviceId,
    location: data.location || null,
    type: data.type || "Sensor",
    ownerId: data.ownerId || null,
    status: "OFFLINE",
    currentShipmentId: null,
    battery: null,
    firmwareVersion: data.firmwareVersion || null,
    lastSeenAt: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  try {
    await devices.insertOne(deviceData);
  } catch (error) {
    if (error.code === 11000 || error.code === "MongoServerError") {
      const dupError = new Error("Device already registered");
      dupError.code = "DEVICE_ALREADY_REGISTERED";
      throw dupError;
    }
    throw error;
  }
  return deviceData;
}

export async function listDevices() {
  const devices = getCollection("devices");
  return devices.find({}).toArray();
}

export async function getDevice(deviceId) {
  return getCollection("devices").findOne({ deviceId });
}

export async function getDeviceHealth(deviceId) {
  const device = await getDevice(deviceId);
  if (!device) return null;

  const telemetryCollection = getTelemetryCollection();
  const latestTelemetry = await telemetryCollection.findOne(
    { deviceId },
    { sort: { timestamp: -1 } }
  );

  let status = "OFFLINE";
  if (device.lastSeenAt) {
    const lastSeen = new Date(device.lastSeenAt).getTime();
    const difference = Date.now() - lastSeen;
    if (difference <= 5 * 60 * 1000) {
      status = "ONLINE";
    }
  }

  return {
    deviceId: device.deviceId,
    status,
    battery: device.battery ?? null,
    lastSeenAt: device.lastSeenAt ?? null,
    firmwareVersion: device.firmwareVersion ?? null,
    currentShipmentId: device.currentShipmentId ?? null,
    latestTelemetry: latestTelemetry || null,
  };
}

export async function assignDevice(deviceId, shipmentId, actorId) {
  const devices = getCollection("devices");
  const shipments = getCollection("shipments");

  const device = await devices.findOne({ deviceId });
  if (!device) {
    const error = new Error("Device not found");
    error.code = "DEVICE_NOT_FOUND";
    throw error;
  }

  const shipment = await shipments.findOne({ shipmentId });
  if (!shipment) {
    const error = new Error("Shipment not found");
    error.code = "SHIPMENT_NOT_FOUND";
    throw error;
  }

  const currentShipmentId = device.currentShipmentId;
  const assignedDevice = shipment.assignedDevice;

  if (currentShipmentId === shipmentId && assignedDevice === deviceId) {
    return {
      deviceId,
      shipmentId,
      status: "ASSIGNED",
      idempotent: true,
    };
  }

  if (currentShipmentId && currentShipmentId !== shipmentId) {
    const error = new Error("Device is already assigned");
    error.code = "DEVICE_ALREADY_ASSIGNED";
    throw error;
  }

  if (assignedDevice && assignedDevice !== deviceId) {
    const error = new Error("Shipment already has a device");
    error.code = "SHIPMENT_ALREADY_HAS_DEVICE";
    throw error;
  }

  await devices.updateOne(
    { deviceId },
    { $set: { currentShipmentId: shipmentId, updatedAt: new Date().toISOString() } }
  );
  await shipments.updateOne(
    { shipmentId },
    { $set: { assignedDevice: deviceId, updatedAt: new Date().toISOString() } }
  );

  // Add timeline event
  try {
    const { addTimelineEvent } = await import("./timelineService.js");
    const { TimelineEventType } = await import("../core/timelineEvents.js");
    await addTimelineEvent(
      shipmentId,
      TimelineEventType.DEVICE_ASSIGNED,
      actorId,
      { deviceId }
    );
  } catch (error) {
    console.error("Device assignment timeline error:", error.message);
  }

  return {
    deviceId,
    shipmentId,
    status: "ASSIGNED",
    idempotent: false,
  };
}
