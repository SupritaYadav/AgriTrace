import { randomUUID } from "crypto";
import { getCollection } from "../core/mongo.js";
import { Role } from "../core/roles.js";
import { SHIPMENT_STATUS, ALLOWED_STATUS_TRANSITIONS } from "../utils/constants.js";
import { addTimelineEvent } from "./timelineService.js";

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

function isFiniteNumber(value) {
  return typeof value === "number" && Number.isFinite(value);
}

export async function createShipment(data, createdBy, role) {
  const thresholds = data?.thresholds || {
    temperature: { min: null, max: null },
    humidity: { min: null, max: null },
    gasLevel: { max: null },
  };

  validateThresholds(thresholds);

  const shipmentId = randomUUID();

  const { randomBytes } = await import("crypto");
  let trackingId = data?.trackingId;
  if (!trackingId) {
    const shipments = getCollection("shipments");
    let exists = true;
    while (exists) {
      trackingId = `AGR-${randomBytes(4).toString("hex").toUpperCase()}`;
      const existing = await shipments.findOne({ trackingId });
      if (existing) {
        exists = true;
      } else {
        exists = false;
      }
    }
  }
  const now = new Date().toISOString();

  const shipmentData = {
    ...data,
    shipmentId,
    trackingId,
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

  const shipments = getCollection("shipments");
  try {
    await shipments.insertOne(shipmentData);
  } catch (error) {
    if (error.code === 11000) {
      const dupError = new Error("Shipment ID conflict");
      dupError.code = "SHIPMENT_CONFLICT";
      throw dupError;
    }
    throw error;
  }

  try {
    const { TimelineEventType } = await import("../core/timelineEvents.js");
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

  const shipments = getCollection("shipments");
  const result = await shipments.updateOne(
    { shipmentId },
    { $set: { thresholds, updatedAt: new Date().toISOString() } }
  );

  if (result.matchedCount === 0) return null;

  if (actorId) {
    await addTimelineEvent(shipmentId, "THRESHOLDS_UPDATED", actorId, { thresholds });
  }

  return shipments.findOne({ shipmentId });
}

export async function updateShipmentStatus(shipmentId, status, actorId, actorRole = null) {
  if (!Object.values(SHIPMENT_STATUS).includes(status)) {
    throw new Error("Invalid shipment status");
  }

  const shipments = getCollection("shipments");
  const shipment = await shipments.findOne({ shipmentId });

  if (!shipment) return null;

  const currentStatus = shipment.status;
  if (currentStatus === status) {
    return shipment;
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

  await shipments.updateOne(
    { shipmentId },
    { $set: { status, updatedAt: new Date().toISOString() } }
  );

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

  return shipments.findOne({ shipmentId });
}

export async function assignTransporter(shipmentId, transporterId, actorId) {
  const shipments = getCollection("shipments");
  const users = getCollection("users");

  const shipment = await shipments.findOne({ shipmentId });
  if (!shipment) return null;

  const userDoc = await users.findOne({ uid: transporterId });
  if (!userDoc || userDoc.role !== Role.TRANSPORTER) {
    throw new Error("Invalid transporter");
  }

  await shipments.updateOne(
    { shipmentId },
    { $set: { transporterId, updatedAt: new Date().toISOString() } }
  );
  await addTimelineEvent(shipmentId, "TRANSPORTER_ASSIGNED", actorId, { transporterId });

  return shipments.findOne({ shipmentId });
}

export async function assignWarehouse(shipmentId, warehouseId, actorId) {
  const shipments = getCollection("shipments");
  const users = getCollection("users");

  const shipment = await shipments.findOne({ shipmentId });
  if (!shipment) return null;

  const userDoc = await users.findOne({ uid: warehouseId });
  if (!userDoc || userDoc.role !== Role.WAREHOUSE) {
    throw new Error("Invalid warehouse");
  }

  await shipments.updateOne(
    { shipmentId },
    { $set: { warehouseId, updatedAt: new Date().toISOString() } }
  );
  await addTimelineEvent(shipmentId, "WAREHOUSE_ASSIGNED", actorId, { warehouseId });

  return shipments.findOne({ shipmentId });
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

export async function listShipments(uid, role) {
  const shipments = getCollection("shipments");

  if (role === Role.ADMIN) {
    return shipments.find({}).toArray();
  }

  if (role === Role.FARMER) {
    const farmerDocs = await shipments.find({ farmerId: uid }).toArray();
    const creatorDocs = await shipments.find({ createdBy: uid }).toArray();
    const seen = new Set();
    const result = [];
    for (const doc of [...farmerDocs, ...creatorDocs]) {
      if (!seen.has(doc.shipmentId)) {
        seen.add(doc.shipmentId);
        result.push(doc);
      }
    }
    return result;
  }

  if (role === Role.TRANSPORTER) {
    const transporterDocs = await shipments.find({ transporterId: uid }).toArray();
    const assignedDocs = await shipments.find({ assignedTransporter: uid }).toArray();
    const seen = new Set();
    const result = [];
    for (const doc of [...transporterDocs, ...assignedDocs]) {
      if (!seen.has(doc.shipmentId)) {
        seen.add(doc.shipmentId);
        result.push(doc);
      }
    }
    return result;
  }

  if (role === Role.WAREHOUSE) {
    const warehouseDocs = await shipments.find({ warehouseId: uid }).toArray();
    const assignedDocs = await shipments.find({ assignedWarehouse: uid }).toArray();
    const seen = new Set();
    const result = [];
    for (const doc of [...warehouseDocs, ...assignedDocs]) {
      if (!seen.has(doc.shipmentId)) {
        seen.add(doc.shipmentId);
        result.push(doc);
      }
    }
    return result;
  }

  return [];
}

export async function getShipmentForUser(shipmentId, uid, role) {
  const shipment = await getCollection("shipments").findOne({ shipmentId });

  if (!shipment) return null;

  if (!canUserAccessShipment(shipment, uid, role)) {
    const error = new Error("Not authorized to access this shipment");
    error.code = "SHIPMENT_ACCESS_DENIED";
    throw error;
  }

  return shipment;
}

export async function getShipment(shipmentId) {
  return getCollection("shipments").findOne({ shipmentId });
}
