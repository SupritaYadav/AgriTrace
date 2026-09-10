import { createHash } from "crypto";

function canonicalize(value) {
  if (value instanceof Date) return value.toISOString();
  if (Array.isArray(value)) return value.map(canonicalize);
  if (value && typeof value === "object") {
    return Object.keys(value)
      .sort()
      .reduce((result, key) => {
        if (value[key] !== undefined) result[key] = canonicalize(value[key]);
        return result;
      }, {});
  }
  return value;
}

function hashValue(value) {
  return createHash("sha256")
    .update(JSON.stringify(canonicalize(value)))
    .digest("hex");
}

export function generateTelemetryHash(reading) {
  const { _id, dataHash, checkpointId, checkpointed, ...immutableReading } = reading || {};
  return hashValue(immutableReading);
}

export function verifyTelemetryReading(reading) {
  if (!reading?.dataHash) return false;
  return generateTelemetryHash(reading) === reading.dataHash;
}

export function generateCheckpointHash(readings) {
  return hashValue(
    readings.map((reading) => ({
      id: reading._id?.toString?.() || reading._id || null,
      dataHash: reading.dataHash,
      timestamp: reading.timestamp,
    }))
  );
}

export function verifyCheckpoint(checkpoint, readings) {
  if (!checkpoint?.checkpointHash || !Array.isArray(readings) || readings.length === 0) {
    return false;
  }

  return readings.every(verifyTelemetryReading) &&
    generateCheckpointHash(readings) === checkpoint.checkpointHash;
}