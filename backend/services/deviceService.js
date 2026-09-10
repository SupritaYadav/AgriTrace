import { db } from "../core/firebase.js";
import { getTelemetryCollection } from "../core/mongo.js";
import { TimelineEventType } from "../core/timelineEvents.js";
import { addTimelineEvent } from "./timelineService.js";

export async function registerDevice(data) {
  const deviceRef = db.collection("devices").doc(data.deviceId);
  const deviceData = {
    deviceId: data.deviceId,
    status: "OFFLINE",
    currentShipmentId: null,
    battery: null,
    firmwareVersion: data.firmwareVersion || null,
    lastSeenAt: null,
  };
  await deviceRef.set(deviceData);
  return deviceData;
}

export async function listDevices() {
  const snapshot = await db.collection("devices").get();
  return snapshot.docs.map((doc) => doc.data());
}

export async function getDevice(deviceId) {
  const doc = await db.collection("devices").doc(deviceId).get();
  return doc.exists ? doc.data() : null;
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
  const deviceRef = db.collection("devices").doc(deviceId);
  const shipmentRef = db.collection("shipments").doc(shipmentId);

  const result = await db.runTransaction(async (transaction) => {
    const [deviceDoc, shipmentDoc] = await Promise.all([
      transaction.get(deviceRef),
      transaction.get(shipmentRef),
    ]);

    if (!deviceDoc.exists) {
      const error = new Error("Device not found");
      error.code = "DEVICE_NOT_FOUND";
      throw error;
    }

    if (!shipmentDoc.exists) {
      const error = new Error("Shipment not found");
      error.code = "SHIPMENT_NOT_FOUND";
      throw error;
    }

    const device = deviceDoc.data();
    const shipment = shipmentDoc.data();
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

    transaction.update(deviceRef, {
      currentShipmentId: shipmentId,
    });
    transaction.update(shipmentRef, {
      assignedDevice: deviceId,
    });

    return {
      deviceId,
      shipmentId,
      status: "ASSIGNED",
      idempotent: false,
    };
  });

  if (!result.idempotent) {
    try {
      await addTimelineEvent(
        shipmentId,
        TimelineEventType.DEVICE_ASSIGNED,
        actorId,
        { deviceId }
      );
    } catch (error) {
      console.error("Device assignment timeline error:", error.message);
    }
  }

  return result;
}