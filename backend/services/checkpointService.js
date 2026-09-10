import { randomUUID } from "crypto";
import { db } from "../core/firebase.js";
import { getTelemetryCollection } from "../core/mongo.js";
import { TimelineEventType } from "../core/timelineEvents.js";
import { addTimelineEvent } from "./timelineService.js";
import { storeCheckpointHash, verifyCheckpointHash } from "./blockchainService.js";
import { generateCheckpointHash, verifyTelemetryReading, verifyCheckpoint } from "./integrityService.js";

const CHECKPOINT_SIZE = 50;
const schedulerState = { timer: null, running: false };

async function getUncheckpointedReadings(shipmentId, deviceId, limit = CHECKPOINT_SIZE) {
  return getTelemetryCollection()
    .find({ shipmentId, deviceId, checkpointed: { $ne: true } })
    .sort({ timestamp: 1 })
    .limit(limit)
    .toArray();
}

export async function createCheckpoint(shipmentId, deviceId, actorId = "SYSTEM", force = false) {
  const readings = await getUncheckpointedReadings(shipmentId, deviceId);
  if ((!force && readings.length < CHECKPOINT_SIZE) || readings.length === 0) return null;

  if (!readings.every(verifyTelemetryReading)) {
    const error = new Error("One or more telemetry readings failed integrity verification");
    error.code = "TELEMETRY_INTEGRITY_FAILED";
    throw error;
  }

  const checkpointId = randomUUID();
  const checkpointHash = generateCheckpointHash(readings);
  const blockchain = await storeCheckpointHash(checkpointHash);
  const checkpoint = {
    checkpointId,
    shipmentId,
    deviceId,
    readingCount: readings.length,
    firstReadingAt: readings[0].timestamp,
    lastReadingAt: readings[readings.length - 1].timestamp,
    checkpointHash,
    blockchain,
    status: "CONFIRMED",
    createdAt: new Date().toISOString(),
    createdBy: actorId,
  };

  await db.collection("integrityCheckpoints").doc(checkpointId).set(checkpoint);
  const ids = readings.map((reading) => reading._id);
  await getTelemetryCollection().updateMany(
    { _id: { $in: ids } },
    { $set: { checkpointed: true, checkpointId } }
  );

  await addTimelineEvent(shipmentId, TimelineEventType.INTEGRITY_CHECKPOINT_CREATED, actorId, {
    checkpointId,
    deviceId,
    readingCount: readings.length,
  });
  return checkpoint;
}

export async function getCheckpoint(checkpointId) {
  const snapshot = await db.collection("integrityCheckpoints").doc(checkpointId).get();
  return snapshot.exists ? snapshot.data() : null;
}

export async function verifyShipmentCheckpoints(shipmentId) {
  const snapshot = await db.collection("integrityCheckpoints").where("shipmentId", "==", shipmentId).get();
  const checkpoints = [];
  for (const document of snapshot.docs) {
    const checkpoint = document.data();
    const readings = await getTelemetryCollection()
      .find({ checkpointId: checkpoint.checkpointId })
      .sort({ timestamp: 1 })
      .toArray();
    const verified = verifyCheckpoint(checkpoint, readings);
    const blockchain = await verifyCheckpointHash(checkpoint);
    checkpoints.push({ ...checkpoint, verified, blockchainVerified: blockchain.verified });
  }

  return {
    shipmentId,
    checkpointCount: checkpoints.length,
    verified: checkpoints.length > 0 && checkpoints.every((checkpoint) => checkpoint.verified && checkpoint.blockchainVerified),
    checkpoints,
  };
}

export async function retryCheckpoint(checkpointId) {
  const checkpoint = await getCheckpoint(checkpointId);
  if (!checkpoint) return null;
  const blockchain = await storeCheckpointHash(checkpoint.checkpointHash);
  const updated = { ...checkpoint, blockchain, status: "CONFIRMED", updatedAt: new Date().toISOString() };
  await db.collection("integrityCheckpoints").doc(checkpointId).set(updated, { merge: true });
  return updated;
}

export async function createScheduledIntegrityCheckpoints() {
  if (schedulerState.running) return;
  schedulerState.running = true;
  try {
    const groups = await getTelemetryCollection().aggregate([
      { $match: { checkpointed: { $ne: true }, shipmentId: { $ne: null }, deviceId: { $ne: null } } },
      { $group: { _id: { shipmentId: "$shipmentId", deviceId: "$deviceId" }, count: { $sum: 1 } } },
      { $match: { count: { $gte: CHECKPOINT_SIZE } } },
    ]).toArray();
    for (const group of groups) {
      await createCheckpoint(group._id.shipmentId, group._id.deviceId);
    }
  } finally {
    schedulerState.running = false;
  }
}

export function startCheckpointScheduler() {
  if (schedulerState.timer) return schedulerState.timer;
  schedulerState.timer = setInterval(() => {
    createScheduledIntegrityCheckpoints().catch((error) => {
      console.error("Integrity checkpoint worker error:", error.message);
    });
  }, 60 * 1000);
  return schedulerState.timer;
}