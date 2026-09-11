import mqtt from "mqtt";
import { getTelemetryCollection, getCollection } from "./mongo.js";
import {
  normalizeTelemetry,
  validateReading,
} from "../models/telemetry.js";
import { parseTelemetryTopic } from "../models/mqttTopic.js";
import { evaluateAlerts, resolveSystemAlert } from "../services/alertService.js";
import { broadcastToShipment, broadcastToAll } from "./websocket.js";
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

  const device = await getCollection("devices").findOne({ deviceId: topicDeviceId });
  if (!device) {
    console.log("Rejected: unknown device", topicDeviceId);
    return;
  }

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

  const assignedShipment = assignedShipmentId
    ? await getCollection("shipments").findOne({ shipmentId: assignedShipmentId })
    : null;
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

  await getCollection("devices").updateOne(
    { deviceId: topicDeviceId },
    { $set: {
        status: "ONLINE",
        battery: data.battery,
        lastSeenAt: new Date().toISOString(),
    } }
  );

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

  const mqttOptions = {
    ...(config.mqttUser ? { username: config.mqttUser } : {}),
    ...(config.mqttPassword ? { password: config.mqttPassword } : {}),
    ...(config.mqttProtocol ? { protocol: config.mqttProtocol } : {}),
    ...(config.mqttPort ? { port: config.mqttPort } : {}),
  };

  client = mqtt.connect(config.mqttBrokerUrl, mqttOptions);

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