import { getCollection } from "../core/mongo.js";
import { broadcastToAll } from "../core/websocket.js";
import { TimelineEventType } from "../core/timelineEvents.js";
import { addTimelineEvent } from "./timelineService.js";
import { getAccessibleShipmentIds, getAccessibleDeviceIds } from "../core/accessControl.js";

export async function createSystemAlert({
  deviceId,
  shipmentId,
  type,
  severity,
  value,
}) {
  const existing = await getCollection("alerts").findOne({
    deviceId,
    type,
    status: "OPEN",
  });

  if (existing) {
    return existing;
  }

  const alertId = `${deviceId}_${type}_${Date.now()}`;
  const now = new Date().toISOString();
  const alert = {
    alertId,
    deviceId,
    shipmentId,
    type,
    severity,
    value,
    timestamp: now,
    createdAt: now,
    status: "OPEN",
    acknowledgedAt: null,
    resolvedAt: null,
  };

  await getCollection("alerts").insertOne(alert);
  return alert;
}

export async function resolveSystemAlert(deviceId, type, actorId = "SYSTEM") {
  const now = new Date().toISOString();
  const result = await getCollection("alerts").findOneAndUpdate(
    { deviceId, type, status: "OPEN" },
    { $set: { status: "RESOLVED", resolvedAt: now, resolvedBy: actorId } },
    { sort: { createdAt: 1 }, returnDocument: "after" }
  );

  if (!result) return null;
  return { ...result, id: result._id?.toString() };
}

export const DEFAULT_BATTERY_MIN = 15;

export const alertRules = [
  {
    type: "HIGH_TEMP",
    isSupported: (r, thresholds) =>
      Number.isFinite(r.temperature) &&
      Number.isFinite(thresholds?.temperature?.max),
    check: (r, thresholds) =>
      r.temperature > thresholds.temperature.max,
    value: (r) => r.temperature,
    threshold: (thresholds) => ({
      operator: ">",
      limit: thresholds.temperature.max,
      field: "temperature",
    }),
    severity: "CRITICAL",
  },
  {
    type: "LOW_TEMP",
    isSupported: (r, thresholds) =>
      Number.isFinite(r.temperature) &&
      Number.isFinite(thresholds?.temperature?.min),
    check: (r, thresholds) =>
      r.temperature < thresholds.temperature.min,
    value: (r) => r.temperature,
    threshold: (thresholds) => ({
      operator: "<",
      limit: thresholds.temperature.min,
      field: "temperature",
    }),
    severity: "WARNING",
  },
  {
    type: "HIGH_HUMIDITY",
    isSupported: (r, thresholds) =>
      Number.isFinite(r.humidity) &&
      Number.isFinite(thresholds?.humidity?.max),
    check: (r, thresholds) =>
      r.humidity > thresholds.humidity.max,
    value: (r) => r.humidity,
    threshold: (thresholds) => ({
      operator: ">",
      limit: thresholds.humidity.max,
      field: "humidity",
    }),
    severity: "WARNING",
  },
  {
    type: "LOW_HUMIDITY",
    isSupported: (r, thresholds) =>
      Number.isFinite(r.humidity) &&
      Number.isFinite(thresholds?.humidity?.min),
    check: (r, thresholds) =>
      r.humidity < thresholds.humidity.min,
    value: (r) => r.humidity,
    threshold: (thresholds) => ({
      operator: "<",
      limit: thresholds.humidity.min,
      field: "humidity",
    }),
    severity: "WARNING",
  },
  {
    type: "LOW_BATTERY",
    isSupported: (r, thresholds) =>
      Number.isFinite(r.battery) &&
      Number.isFinite(thresholds?.battery?.min ?? DEFAULT_BATTERY_MIN),
    check: (r, thresholds) =>
      r.battery < (thresholds.battery?.min ?? DEFAULT_BATTERY_MIN),
    value: (r) => r.battery,
    threshold: (thresholds) => ({
      operator: "<",
      limit: thresholds.battery?.min ?? DEFAULT_BATTERY_MIN,
      field: "battery",
    }),
    severity: "WARNING",
  },
  {
    type: "GAS_ALERT",
    isSupported: (r, thresholds) =>
      Number.isFinite(r.gasLevel) &&
      Number.isFinite(thresholds?.gasLevel?.max),
    check: (r, thresholds) =>
      r.gasLevel > thresholds.gasLevel.max,
    value: (r) => r.gasLevel,
    threshold: (thresholds) => ({
      operator: ">",
      limit: thresholds.gasLevel.max,
      field: "gasLevel",
    }),
    severity: "CRITICAL",
  },
  {
    type: "DEVICE_OFFLINE",
    isSupported: (r) => typeof r.deviceOffline === "boolean",
    check: (r) => r.deviceOffline === true,
    value: (r) => r.deviceOffline,
    threshold: () => ({ operator: "===", limit: true, field: "deviceOffline" }),
    severity: "CRITICAL",
  },
  {
    type: "TAMPER_ALERT",
    isSupported: (r) => typeof r.tamperDetected === "boolean",
    check: (r) => r.tamperDetected === true,
    value: (r) => r.tamperDetected,
    threshold: () => ({ operator: "===", limit: true, field: "tamperDetected" }),
    severity: "CRITICAL",
  },
];

function getActiveAlertId(reading, rule) {
  const shipmentId = reading.shipmentId || "NO_SHIPMENT";
  return `active__${[shipmentId, reading.deviceId, rule.type]
    .map((value) => encodeURIComponent(value))
    .join("__")}`;
}

function createAlert(reading, rule, thresholds, now) {
  return {
    alertId: getActiveAlertId(reading, rule),
    shipmentId: reading.shipmentId || null,
    deviceId: reading.deviceId,
    type: rule.type,
    severity: rule.severity,
    value: rule.value(reading),
    actualValue: rule.value(reading),
    threshold: rule.threshold(thresholds),
    createdAt: now,
    timestamp: now,
    status: "OPEN",
    acknowledgedAt: null,
    resolvedAt: null,
  };
}

function stripMongoId(doc) {
  if (!doc) return null;
  const { _id, ...rest } = doc;
  return rest;
}

async function transitionAlert(reading, rule, thresholds) {
  const activeId = getActiveAlertId(reading, rule);
  const alertsCollection = getCollection("alerts");
  const now = new Date().toISOString();
  const violating = rule.check(reading, thresholds);

  let currentAlert = await alertsCollection.findOne({
    deviceId: reading.deviceId,
    type: rule.type,
    status: "OPEN",
    shipmentId: reading.shipmentId || null,
  });

  if (!currentAlert && violating) {
    const legacyAlert = await alertsCollection.findOne({
      alertId: activeId,
    });

    if (legacyAlert && legacyAlert.status !== "OPEN") {
      return { action: "unchanged", alert: legacyAlert };
    }
  }

  if (!currentAlert) {
    currentAlert = await alertsCollection.findOne({ alertId: activeId });
  }

  if (violating) {
    if (currentAlert?.status === "OPEN") {
      await alertsCollection.updateOne(
        { _id: currentAlert._id },
        { $set: { value: rule.value(reading), actualValue: rule.value(reading), lastSeenAt: now } }
      );
      return { action: "unchanged", alert: { ...currentAlert, lastSeenAt: now } };
    }

    if (currentAlert?.status === "RESOLVED") {
      const historyEntry = {
        ...stripMongoId(currentAlert),
        historical: true,
        archivedAt: now,
      };
      await alertsCollection.insertOne(historyEntry);
    }

    const alert = createAlert(reading, rule, thresholds, now);
    await alertsCollection.replaceOne(
      { alertId: activeId },
      alert,
      { upsert: true }
    );
    return { action: "created", alert };
  }

  if (currentAlert?.status !== "OPEN") {
    return { action: "unchanged", alert: currentAlert };
  }

  const resolvedAlert = {
    ...currentAlert,
    status: "RESOLVED",
    resolvedAt: now,
    lastSeenAt: now,
  };
  await alertsCollection.updateOne(
    { _id: currentAlert._id },
    { $set: { status: "RESOLVED", resolvedAt: now, lastSeenAt: now } }
  );
  return { action: "resolved", alert: resolvedAlert };
}

export async function evaluateAlerts(reading, shipment = null) {
  if (!reading?.deviceId) return;

  const thresholds = shipment?.thresholds || {};

  for (const rule of alertRules) {
    if (!rule.isSupported(reading, thresholds)) continue;

    try {
      const transition = await transitionAlert(reading, rule, thresholds);

      if (transition.action === "created") {
        console.log(`ALERT triggered: ${rule.type} for device ${reading.deviceId}`);

        if (reading.shipmentId) {
          try {
            await addTimelineEvent(
              reading.shipmentId,
              rule.type,
              "SYSTEM",
              {
                deviceId: reading.deviceId,
                severity: transition.alert.severity,
                value: transition.alert.value,
              }
            );
          } catch (error) {
            console.error("Alert timeline error:", error.message);
          }
        }

        if (rule.type === "HIGH_TEMP" && reading.shipmentId) {
          try {
            await addTimelineEvent(
              reading.shipmentId,
              TimelineEventType.TEMPERATURE_EXCURSION,
              "SYSTEM",
              {
                deviceId: reading.deviceId,
                temperature: reading.temperature,
                threshold: transition.alert.threshold.limit,
                severity: transition.alert.severity,
              }
            );
          } catch (error) {
            console.error("Temperature excursion timeline error:", error.message);
          }
        }

        if (rule.type === "DEVICE_OFFLINE" && reading.shipmentId) {
          try {
            await addTimelineEvent(
              reading.shipmentId,
              TimelineEventType.DEVICE_OFFLINE,
              "SYSTEM",
              {
                deviceId: reading.deviceId,
                severity: transition.alert.severity,
              }
            );
          } catch (error) {
            console.error("Device offline timeline error:", error.message);
          }
        }

        broadcastToAll({ type: "alert.created", data: transition.alert });
      } else if (transition.action === "resolved") {
        console.log(`ALERT resolved: ${rule.type} for device ${reading.deviceId}`);
        broadcastToAll({ type: "alert.resolved", data: transition.alert });
      }
    } catch (error) {
      console.error(
        `Alert evaluation failed for ${rule.type} on device ${reading.deviceId}:`,
        error.message
      );
    }
  }
}

async function buildAlertAccessFilter(user) {
  if (!user || !user.role) return { _id: null };
  if (user.role === "ADMIN") return {};

  const [shipmentIds, deviceIds] = await Promise.all([
    getAccessibleShipmentIds(user),
    getAccessibleDeviceIds(user),
  ]);

  const orClauses = [];
  if (shipmentIds.length > 0) {
    orClauses.push({ shipmentId: { $in: shipmentIds } });
  }
  if (deviceIds.length > 0) {
    orClauses.push({ deviceId: { $in: deviceIds } });
  }

  if (orClauses.length === 0) return { _id: null };
  return { $or: orClauses };
}

export async function listAlertsForUser(user, filters = {}) {
  const {
    status,
    severity,
    shipmentId,
    deviceId,
    page = 1,
    limit = 20,
  } = filters;

  const parsedPage = Number.parseInt(page, 10);
  const parsedLimit = Number.parseInt(limit, 10);

  const safePage =
    Number.isInteger(parsedPage) && parsedPage > 0 ? parsedPage : 1;

  const safeLimit =
    Number.isInteger(parsedLimit) && parsedLimit > 0 ? parsedLimit : 20;

  const accessFilter = await buildAlertAccessFilter(user);
  let query = { ...accessFilter };

  if (status) {
    query.status = status;
  }

  if (severity) {
    query.severity = severity;
  }

  if (shipmentId) {
    query.shipmentId = shipmentId;
  }

  if (deviceId) {
    query.deviceId = deviceId;
  }

  const offset = (safePage - 1) * safeLimit;
  const alertsCollection = getCollection("alerts");

  const [alerts, total] = await Promise.all([
    alertsCollection
      .find(query)
      .sort({ createdAt: -1 })
      .skip(offset)
      .limit(safeLimit)
      .toArray(),
    alertsCollection.countDocuments(query),
  ]);

  return {
    alerts: alerts.map((doc) => ({ id: doc._id?.toString(), ...doc })),
    pagination: {
      page: safePage,
      limit: safeLimit,
      total,
      pages: Math.ceil(total / safeLimit),
    },
  };
}

export async function listAlerts(filters = {}) {
  return listAlertsForUser({ role: "ADMIN" }, filters);
}

export async function getAlertByIdForUser(alertId, user) {
  const alert = await getCollection("alerts").findOne({ alertId });
  if (!alert) return null;

  const accessFilter = await buildAlertAccessFilter(user);
  const accessible = await getCollection("alerts").findOne({ alertId, ...accessFilter });
  if (!accessible) return null;

  return { id: alert._id?.toString(), ...alert };
}

export async function getAlertById(alertId) {
  const doc = await getCollection("alerts").findOne({ alertId });
  if (!doc) return null;
  return { id: doc._id?.toString(), ...doc };
}

export async function acknowledgeAlert(alertId, userId) {
  const now = new Date().toISOString();
  const result = await getCollection("alerts").findOneAndUpdate(
    { alertId },
    { $set: { status: "ACKNOWLEDGED", acknowledgedAt: now, acknowledgedBy: userId } },
    { returnDocument: "after" }
  );
  if (!result) return null;
  return { id: result._id?.toString(), ...result };
}

export async function resolveAlert(alertId, userId) {
  const now = new Date().toISOString();
  const result = await getCollection("alerts").findOneAndUpdate(
    { alertId },
    { $set: { status: "RESOLVED", resolvedAt: now, resolvedBy: userId } },
    { returnDocument: "after" }
  );
  if (!result) return null;
  return { id: result._id?.toString(), ...result };
}
