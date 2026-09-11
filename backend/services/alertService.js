import { randomUUID } from "crypto";
import { db } from "../core/firebase.js";
import { broadcastToAll } from "../core/websocket.js";
import { TimelineEventType } from "../core/timelineEvents.js";
import { addTimelineEvent } from "./timelineService.js";

export async function createSystemAlert({
  deviceId,
  shipmentId,
  type,
  severity,
  value,
}) {
  const existing = await db
    .collection("alerts")
    .where("deviceId", "==", deviceId)
    .where("type", "==", type)
    .where("status", "==", "OPEN")
    .limit(1)
    .get();

  if (!existing.empty) {
    return existing.docs[0].data();
  }

  const alertId = `${deviceId}_${type}_${Date.now()}`;
  const alert = {
    alertId,
    deviceId,
    shipmentId,
    type,
    severity,
    value,
    timestamp: new Date().toISOString(),
    status: "OPEN",
    acknowledgedAt: null,
    resolvedAt: null,
  };

  await db.collection("alerts").doc(alertId).set(alert);
  return alert;
}

export async function resolveSystemAlert(deviceId, type, actorId = "SYSTEM") {
  const snapshot = await db
    .collection("alerts")
    .where("deviceId", "==", deviceId)
    .where("type", "==", type)
    .where("status", "==", "OPEN")
    .limit(1)
    .get();

  if (snapshot.empty) {
    return null;
  }

  const ref = snapshot.docs[0].ref;
  const now = new Date().toISOString();
  await ref.update({
    status: "RESOLVED",
    resolvedAt: now,
    resolvedBy: actorId,
  });

  const updated = await ref.get();
  return { id: updated.id, ...updated.data() };
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

async function transitionAlert(reading, rule, thresholds) {
  const activeRef = db.collection("alerts").doc(getActiveAlertId(reading, rule));
  const now = new Date().toISOString();
  const violating = rule.check(reading, thresholds);

  return db.runTransaction(async (transaction) => {
    const activeSnapshot = await transaction.get(activeRef);
    let alertRef = activeRef;
    let currentAlert = activeSnapshot.exists ? activeSnapshot.data() : null;

    // Read legacy random-ID alerts by device only, then filter the other
    // identity fields locally so this compatibility path needs no composite index.
    if (currentAlert?.status !== "OPEN") {
      const legacySnapshot = await transaction.get(
        db.collection("alerts").where("deviceId", "==", reading.deviceId)
      );
      const legacyAlert = legacySnapshot.docs.find((document) => {
        const alert = document.data();
        return (
          alert.status === "OPEN" &&
          (alert.shipmentId || null) === (reading.shipmentId || null) &&
          alert.type === rule.type
        );
      });

      if (legacyAlert) {
        alertRef = legacyAlert.ref;
        currentAlert = legacyAlert.data();
      }
    }

    if (violating) {
      if (currentAlert?.status === "OPEN") {
        transaction.update(alertRef, {
          value: rule.value(reading),
          actualValue: rule.value(reading),
          lastSeenAt: now,
        });
        return { action: "unchanged", alert: { ...currentAlert, lastSeenAt: now } };
      }

      if (currentAlert?.status === "RESOLVED") {
        const historyRef = db.collection("alerts").doc(`history__${randomUUID()}`);
        transaction.set(historyRef, {
          ...currentAlert,
          historical: true,
          archivedAt: now,
        });
      }

      const alert = createAlert(reading, rule, thresholds, now);
      transaction.set(alertRef, alert);
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
    transaction.update(alertRef, {
      status: "RESOLVED",
      resolvedAt: now,
      lastSeenAt: now,
    });
    return { action: "resolved", alert: resolvedAlert };
  });
}

// Existing evaluateAlerts function retained
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

/**
 * Retrieve alerts with optional filters and pagination.
 * @param {object} filters { status, severity, shipmentId, deviceId, page, limit }
 */
export async function listAlerts(filters = {}) {
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

  let query = db.collection("alerts");

  if (status) {
    query = query.where("status", "==", status);
  }

  if (severity) {
    query = query.where("severity", "==", severity);
  }

  if (shipmentId) {
    query = query.where("shipmentId", "==", shipmentId);
  }

  if (deviceId) {
    query = query.where("deviceId", "==", deviceId);
  }

  const offset = (safePage - 1) * safeLimit;

  const snapshot = await query
    .orderBy("createdAt", "desc")
    .offset(offset)
    .limit(safeLimit)
    .get();

  const alerts = snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  }));

  const totalSnap = await query.get();
  const total = totalSnap.size;

  return {
    alerts,
    pagination: {
      page: safePage,
      limit: safeLimit,
      total,
      pages: Math.ceil(total / safeLimit),
    },
  };
}

/** Retrieve a single alert by its alertId */
export async function getAlertById(alertId) {
  const doc = await db.collection('alerts').doc(alertId).get();
  if (!doc.exists) return null;
  return { id: doc.id, ...doc.data() };
}

/** Acknowledge an alert */
export async function acknowledgeAlert(alertId, userId) {
  const ref = db.collection('alerts').doc(alertId);
  const now = new Date().toISOString();
  await ref.update({ status: 'ACKNOWLEDGED', acknowledgedAt: now, acknowledgedBy: userId });
  const updated = await ref.get();
  return { id: updated.id, ...updated.data() };
}

/** Resolve an alert */
export async function resolveAlert(alertId, userId) {
  const ref = db.collection('alerts').doc(alertId);
  const now = new Date().toISOString();
  await ref.update({ status: 'RESOLVED', resolvedAt: now, resolvedBy: userId });
  const updated = await ref.get();
  return { id: updated.id, ...updated.data() };
}
