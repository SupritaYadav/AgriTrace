import { randomUUID } from "crypto";
import { getCollection } from "../core/mongo.js";
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

  await getCollection("integrityCheckpoints").insertOne(checkpoint);
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
  return getCollection("integrityCheckpoints").findOne({ checkpointId });
}

export async function verifyShipmentCheckpoints(shipmentId) {
  const checkpoints = await getCollection("integrityCheckpoints")
    .find({ shipmentId })
    .sort({ createdAt: 1 })
    .toArray();

  const results = [];
  for (const checkpoint of checkpoints) {
    const readings = await getTelemetryCollection()
      .find({ checkpointId: checkpoint.checkpointId })
      .sort({ timestamp: 1 })
      .toArray();
    const verified = verifyCheckpoint(checkpoint, readings);
    const blockchain = await verifyCheckpointHash(checkpoint);
    results.push({ ...checkpoint, verified, blockchainVerified: blockchain.verified });
  }

  return {
    shipmentId,
    checkpointCount: results.length,
    verified: results.length > 0 && results.every((c) => c.verified && c.blockchainVerified),
    checkpoints: results,
  };
}

export async function retryCheckpoint(checkpointId) {
  const checkpoint = await getCheckpoint(checkpointId);
  if (!checkpoint) return null;
  const blockchain = await storeCheckpointHash(checkpoint.checkpointHash);
  const updated = { ...checkpoint, blockchain, status: "CONFIRMED", updatedAt: new Date().toISOString() };
  await getCollection("integrityCheckpoints").updateOne(
    { checkpointId },
    { $set: { blockchain, status: "CONFIRMED", updatedAt: updated.updatedAt } }
  );
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