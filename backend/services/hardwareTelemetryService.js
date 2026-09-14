import {
  getCollection,
} from "../core/mongo.js";


// ==========================================================
// FIND DEVICE
// ==========================================================

export async function findHardwareDevice(
  deviceId
) {
  return getCollection(
    "devices"
  ).findOne({
    deviceId,
  });
}


// ==========================================================
// STORE TELEMETRY
// ==========================================================

export async function storeHardwareTelemetry(
  data,
  device
) {
  const telemetryCollection =
    getCollection("telemetry");


  const shipmentId =
    device.currentShipmentId ||
    device.assignedShipmentId ||
    null;


  const record = {
    ...data,

    shipmentId,

    timestamp:
      new Date(data.timestamp),

    receivedAt:
      new Date(),

    ingestionSource:
      "MQTT",

    firmware:
      data.firmware || null,

    sensorHealth:
      data.sensorHealth || null,

    connectivity:
      data.connectivity || null,
  };


  try {
    await telemetryCollection.insertOne(
      record
    );

    return {
      inserted: true,
      duplicate: false,
      record,
    };
  } catch (error) {

    // Mongo duplicate key
    if (error?.code === 11000) {
      return {
        inserted: false,
        duplicate: true,
        record,
      };
    }

    throw error;
  }
}


// ==========================================================
// UPDATE DEVICE STATE
// ==========================================================

export async function updateDeviceFromTelemetry(
  deviceId,
  data,
  shipmentId
) {
  const update = {
    status: "ONLINE",

    battery:
      data.battery,

    lastSeen:
      new Date(),

    lastSeenAt:
      new Date().toISOString(),

    lastTelemetrySequence:
      data.sequenceNumber,

    firmware:
      data.firmware || null,

    sensorHealth:
      data.sensorHealth || null,

    connectivity:
      data.connectivity || null,
  };


  if (
    typeof data.temperature ===
    "number"
  ) {
    update.lastTemperature =
      data.temperature;
  }


  if (
    typeof data.humidity ===
    "number"
  ) {
    update.lastHumidity =
      data.humidity;
  }


  if (
    typeof data.gasLevel ===
    "number"
  ) {
    update.lastGasLevel =
      data.gasLevel;
  }


  if (
    data.latitude !== undefined &&
    data.longitude !== undefined
  ) {
    update.lastLocation = {
      latitude:
        data.latitude,

      longitude:
        data.longitude,
    };
  }


  if (shipmentId) {
    update.currentShipmentId =
      shipmentId;
  }


  await getCollection(
    "devices"
  ).updateOne(
    {
      deviceId,
    },
    {
      $set: update,
    }
  );
}