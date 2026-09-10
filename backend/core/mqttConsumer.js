import mqtt from "mqtt";
import { getTelemetryCollection } from "./mongo.js";
import {
  normalizeTelemetry,
  validateReading,
} from "../models/telemetry.js";
import { parseTelemetryTopic } from "../models/mqttTopic.js";
import { evaluateAlerts, resolveSystemAlert } from "../services/alertService.js";
import { db } from "./firebase.js";
import { broadcastToShipment } from "./websocket.js";
import { config } from "./config.js";
import { generateTelemetryHash } from "../services/integrityService.js";

let client = null;
let lastShipmentMismatchWarning = "";

async function handleMessage(topic, message) {
  let data;
  try {
    data = JSON.parse(message.toString());
  } catch {
    console.warn("Rejected telemetry: malformed JSON");
    return;
  }

  const parsedTopic = parseTelemetryTopic(topic);
  if (!parsedTopic) {
    console.warn(`Rejected telemetry: invalid topic format ${topic}`);
    return;
  }

  const { deviceId: topicDeviceId } = parsedTopic;

  const errors = validateReading(data);
  if (errors.length > 0) {
    console.log("Rejected reading:", errors);
    return;
  }

  if (topicDeviceId !== data.deviceId) {
    console.warn(
      `Rejected telemetry: topic device ${topicDeviceId} does not match payload ${data.deviceId}`
    );
    return;
  }

  const deviceDoc = await db.collection("devices").doc(topicDeviceId).get();
  if (!deviceDoc.exists) {
    console.log("Rejected: unknown device", topicDeviceId);
    return;
  }

  const device = deviceDoc.data();
  const assignedShipmentId = device.currentShipmentId || null;

  if (
    data.shipmentId !== undefined &&
    data.shipmentId !== assignedShipmentId
  ) {
    const warningKey = `${topicDeviceId}:${data.shipmentId}:${assignedShipmentId}`;
    if (warningKey !== lastShipmentMismatchWarning) {
      console.warn(
        `MQTT shipment mismatch for ${topicDeviceId}: payload=${data.shipmentId} backend=${assignedShipmentId}. Using backend assignment.`
      );
      lastShipmentMismatchWarning = warningKey;
    }
  }

  const shipmentDoc = assignedShipmentId
    ? await db.collection("shipments").doc(assignedShipmentId).get()
    : null;
  const assignedShipment = shipmentDoc?.exists ? shipmentDoc.data() : null;
  const normalizedTelemetry = normalizeTelemetry(
    data,
    topicDeviceId,
    assignedShipmentId
  );
  normalizedTelemetry.dataHash = generateTelemetryHash(normalizedTelemetry);
  normalizedTelemetry.checkpointId = null;
  normalizedTelemetry.checkpointed = false;

  const telemetryCollection = getTelemetryCollection();
  await telemetryCollection.insertOne({
    ...normalizedTelemetry,
    timestamp: new Date(normalizedTelemetry.timestamp),
  });

  const previousDeviceState = device.status;

  await db.collection("devices").doc(topicDeviceId).update({
    status: "ONLINE",
    battery: data.battery,
    lastSeenAt: new Date().toISOString(),
  });

  if (previousDeviceState === "OFFLINE") {
    await resolveSystemAlert(topicDeviceId, "DEVICE_OFFLINE", "SYSTEM");
  }

  broadcastToAll({
    type: "device.online",
    data: {
      deviceId: data.deviceId,
    },
  });

  try {
    await evaluateAlerts(normalizedTelemetry, assignedShipment);
  } catch (error) {
    console.error("Alert processing failed:", error.message);
  }

  console.log("Telemetry stored for device:", topicDeviceId);
  if (normalizedTelemetry.shipmentId) {
    broadcastToShipment(normalizedTelemetry.shipmentId, {
      type: "telemetry.updated",
      data: normalizedTelemetry,
    });
  }
}

export function startMqttConsumer() {
  if (client) {
    return client;
  }

  client = mqtt.connect(config.mqttBrokerUrl);

  client.on("connect", () => {
    console.log("MQTT connected, subscribing to telemetry topic");
    client.subscribe(config.mqttTopic, (error) => {
      if (error) {
        console.error("MQTT subscription error:", error.message);
        return;
      }
      console.log(`MQTT subscribed to ${config.mqttTopic}`);
    });
  });

  client.on("error", (error) => {
    console.error("MQTT connection error:", error.message);
  });

  client.on("message", (topic, message) => {
    handleMessage(topic, message).catch((error) => {
      console.error("MQTT telemetry processing failed:", error.message);
    });
  });

  return client;
}

export async function stopMqttConsumer() {
  if (!client) return;

  const activeClient = client;
  client = null;
  await activeClient.endAsync();
  console.log("MQTT consumer stopped");
}