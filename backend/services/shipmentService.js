import { randomUUID } from "crypto";
import { db } from "../core/firebase.js";
import { Role } from "../core/roles.js";
import { TimelineEventType } from "../core/timelineEvents.js";
import { SHIPMENT_STATUS, ALLOWED_STATUS_TRANSITIONS } from "../utils/constants.js";
import { addTimelineEvent } from "./timelineService.js";

function isFiniteNumber(value) {
  return typeof value === "number" && Number.isFinite(value);
}

export function validateThresholds(thresholds) {
  if (thresholds === undefined || thresholds === null) return;
  if (typeof thresholds !== "object" || Array.isArray(thresholds)) {
    const error = new Error("Invalid thresholds");
    error.code = "INVALID_THRESHOLDS";
    throw error;
  }

  const temperature = thresholds.temperature;
  if (temperature !== undefined && temperature !== null) {
    if (typeof temperature !== "object") {
      const error = new Error("Temperature thresholds must be an object");
      error.code = "INVALID_THRESHOLDS";
      throw error;
    }

    if (temperature.min != null && !isFiniteNumber(temperature.min)) {
      const error = new Error("Temperature minimum must be numeric");
      error.code = "INVALID_THRESHOLDS";
      throw error;
    }

    if (temperature.max != null && !isFiniteNumber(temperature.max)) {
      const error = new Error("Temperature maximum must be numeric");
      error.code = "INVALID_THRESHOLDS";
      throw error;
    }

    if (temperature.min != null && temperature.max != null && temperature.min >= temperature.max) {
      const error = new Error("Temperature minimum must be lower than maximum");
      error.code = "INVALID_THRESHOLDS";
      throw error;
    }
  }

  const humidity = thresholds.humidity;
  if (humidity !== undefined && humidity !== null) {
    if (typeof humidity !== "object") {
      const error = new Error("Humidity thresholds must be an object");
      error.code = "INVALID_THRESHOLDS";
      throw error;
    }

    if (humidity.min != null && (!isFiniteNumber(humidity.min) || humidity.min < 0 || humidity.min > 100)) {
      const error = new Error("Humidity minimum must be between 0 and 100");
      error.code = "INVALID_THRESHOLDS";
      throw error;
    }

    if (humidity.max != null && (!isFiniteNumber(humidity.max) || humidity.max < 0 || humidity.max > 100)) {
      const error = new Error("Humidity maximum must be between 0 and 100");
      error.code = "INVALID_THRESHOLDS";
      throw error;
    }

    if (humidity.min != null && humidity.max != null && humidity.min >= humidity.max) {
      const error = new Error("Humidity minimum must be lower than maximum");
      error.code = "INVALID_THRESHOLDS";
      throw error;
    }
  }

  const gasLevel = thresholds.gasLevel;
  if (gasLevel !== undefined && gasLevel !== null) {
    if (typeof gasLevel !== "object") {
      const error = new Error("Gas threshold must be an object");
      error.code = "INVALID_THRESHOLDS";
      throw error;
    }

    if (gasLevel.max != null && (!isFiniteNumber(gasLevel.max) || gasLevel.max < 0)) {
      const error = new Error("Gas threshold must be a non-negative number");
      error.code = "INVALID_THRESHOLDS";
      throw error;
    }
  }
}

export async function createShipment(data, createdBy, role) {
  const thresholds = data?.thresholds || {
    temperature: { min: null, max: null },
    humidity: { min: null, max: null },
    gasLevel: { max: null },
  };

  validateThresholds(thresholds);

  const shipmentId = randomUUID();
  const now = new Date().toISOString();

  const shipmentData = {
    ...data,
    shipmentId,
    createdBy,
    transporterId: null,
    warehouseId: null,
    assignedDevice: null,
    status: SHIPMENT_STATUS.PENDING,
    thresholds,
    createdAt: now,
    updatedAt: now,
  };

  if (role === Role.FARMER) {
    shipmentData.farmerId = createdBy;
  }

  await db.collection("shipments").doc(shipmentId).set(shipmentData);

  try {
    await addTimelineEvent(
      shipmentId,
      TimelineEventType.SHIPMENT_CREATED,
      createdBy,
      { status: shipmentData.status }
    );
  } catch (error) {
    console.error("Shipment creation timeline error:", error.message);
  }

  return shipmentData;
}

export async function updateShipmentThresholds(shipmentId, thresholds, actorId = null) {
  validateThresholds(thresholds);

  const shipmentRef = db.collection("shipments").doc(shipmentId);
  const shipmentDoc = await shipmentRef.get();
  if (!shipmentDoc.exists) return null;

  const nextThresholds = thresholds || shipmentDoc.data().thresholds || null;
  await shipmentRef.update({ thresholds: nextThresholds, updatedAt: new Date().toISOString() });

  if (actorId) {
    await addTimelineEvent(shipmentId, "THRESHOLDS_UPDATED", actorId, { thresholds: nextThresholds });
  }

  const updated = await shipmentRef.get();
  return updated.data();
}

export async function updateShipmentStatus(shipmentId, status, actorId, actorRole = null) {
  if (!Object.values(SHIPMENT_STATUS).includes(status)) {
    throw new Error("Invalid shipment status");
  }

  const shipmentRef = db.collection("shipments").doc(shipmentId);
  const shipmentDoc = await shipmentRef.get();

  if (!shipmentDoc.exists) return null;

  const currentStatus = shipmentDoc.data().status;
  if (currentStatus === status) {
    return shipmentDoc.data();
  }

  const allowedNextStatuses = ALLOWED_STATUS_TRANSITIONS[currentStatus] || [];
  if (!allowedNextStatuses.includes(status)) {
    throw new Error(`Invalid shipment transition from ${currentStatus} to ${status}`);
  }

  if (actorRole && actorRole !== Role.ADMIN) {
    const roleMap = {
      [Role.FARMER]: [SHIPMENT_STATUS.PENDING, SHIPMENT_STATUS.DEVICE_ASSIGNED, SHIPMENT_STATUS.READY_FOR_DISPATCH],
      [Role.TRANSPORTER]: [SHIPMENT_STATUS.IN_TRANSIT, SHIPMENT_STATUS.AT_WAREHOUSE],
      [Role.WAREHOUSE]: [SHIPMENT_STATUS.AT_WAREHOUSE, SHIPMENT_STATUS.DELIVERED],
    };

    const permittedStatuses = roleMap[actorRole] || [];
    if (!permittedStatuses.includes(status)) {
      throw new Error(`Role ${actorRole} is not allowed to update shipment to ${status}`);
    }
  }

  await shipmentRef.update({ status, updatedAt: new Date().toISOString() });

  const timelineMap = {
    [SHIPMENT_STATUS.PENDING]: "SHIPMENT_PENDING",
    [SHIPMENT_STATUS.DEVICE_ASSIGNED]: "DEVICE_ASSIGNED",
    [SHIPMENT_STATUS.READY_FOR_DISPATCH]: "READY_FOR_DISPATCH",
    [SHIPMENT_STATUS.IN_TRANSIT]: "SHIPMENT_DISPATCHED",
    [SHIPMENT_STATUS.AT_WAREHOUSE]: "WAREHOUSE_RECEIVED",
    [SHIPMENT_STATUS.DELIVERED]: "DELIVERY_COMPLETED",
    [SHIPMENT_STATUS.CANCELLED]: "SHIPMENT_CANCELLED",
  };

  await addTimelineEvent(shipmentId, timelineMap[status], actorId, { status });

  const updated = await shipmentRef.get();
  return updated.data();
}

export async function assignTransporter(shipmentId, transporterId, actorId) {
  const shipmentRef = db.collection("shipments").doc(shipmentId);
  const shipmentDoc = await shipmentRef.get();

  if (!shipmentDoc.exists) return null;

  const userDoc = await db.collection("users").doc(transporterId).get();
  if (!userDoc.exists || userDoc.data().role !== Role.TRANSPORTER) {
    throw new Error("Invalid transporter");
  }

  await shipmentRef.update({ transporterId, updatedAt: new Date().toISOString() });
  await addTimelineEvent(shipmentId, "TRANSPORTER_ASSIGNED", actorId, { transporterId });

  const updated = await shipmentRef.get();
  return updated.data();
}

export async function assignWarehouse(shipmentId, warehouseId, actorId) {
  const shipmentRef = db.collection("shipments").doc(shipmentId);
  const shipmentDoc = await shipmentRef.get();

  if (!shipmentDoc.exists) return null;

  const userDoc = await db.collection("users").doc(warehouseId).get();
  if (!userDoc.exists || userDoc.data().role !== Role.WAREHOUSE) {
    throw new Error("Invalid warehouse");
  }

  await shipmentRef.update({ warehouseId, updatedAt: new Date().toISOString() });
  await addTimelineEvent(shipmentId, "WAREHOUSE_ASSIGNED", actorId, { warehouseId });

  const updated = await shipmentRef.get();
  return updated.data();
}

export function canUserAccessShipment(shipment, uid, role) {
  if (role === Role.ADMIN) return true;

  if (role === Role.FARMER) {
    return shipment.farmerId === uid || shipment.createdBy === uid;
  }

  if (role === Role.TRANSPORTER) {
    return shipment.transporterId === uid || shipment.assignedTransporter === uid;
  }

  if (role === Role.WAREHOUSE) {
    return shipment.warehouseId === uid || shipment.assignedWarehouse === uid;
  }

  return false;
}

async function getUniqueShipmentDocs(queries) {
  const snapshots = await Promise.all(queries.map((query) => query.get()));
  const documents = new Map();

  for (const snapshot of snapshots) {
    for (const document of snapshot.docs) {
      documents.set(document.id, document.data());
    }
  }

  return [...documents.values()];
}

export async function listShipments(uid, role) {
  const collection = db.collection("shipments");

  if (role === Role.ADMIN) {
    const snapshot = await collection.get();
    return snapshot.docs.map((doc) => doc.data());
  }

  if (role === Role.FARMER) {
    return getUniqueShipmentDocs([
      collection.where("farmerId", "==", uid),
      collection.where("createdBy", "==", uid),
    ]);
  }

  if (role === Role.TRANSPORTER) {
    return getUniqueShipmentDocs([
      collection.where("transporterId", "==", uid),
      collection.where("assignedTransporter", "==", uid),
    ]);
  }

  if (role === Role.WAREHOUSE) {
    return getUniqueShipmentDocs([
      collection.where("warehouseId", "==", uid),
      collection.where("assignedWarehouse", "==", uid),
    ]);
  }

  return [];
}

export async function getShipmentForUser(shipmentId, uid, role) {
  const doc = await db.collection("shipments").doc(shipmentId).get();

  if (!doc.exists) return null;

  const shipment = doc.data();
  if (!canUserAccessShipment(shipment, uid, role)) {
    const error = new Error("Not authorized to access this shipment");
    error.code = "SHIPMENT_ACCESS_DENIED";
    throw error;
  }

  return shipment;
}

export async function getShipment(shipmentId) {
  const doc = await db.collection("shipments").doc(shipmentId).get();
  return doc.exists ? doc.data() : null;
}