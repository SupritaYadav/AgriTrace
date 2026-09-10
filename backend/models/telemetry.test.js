import test from "node:test";
import assert from "node:assert/strict";
import { normalizeTelemetry, validateReading } from "./telemetry.js";

const validReading = {
  deviceId: "DEV001",
  temperature: 25,
  humidity: 55,
  battery: 80,
  gasLevel: 10,
  latitude: 25.3176,
  longitude: 82.9739,
  timestamp: "2026-09-10T12:00:00Z",
};

test("accepts valid telemetry without shipmentId", () => {
  assert.deepEqual(validateReading(validReading), []);
});

test("accepts a structurally valid optional shipmentId", () => {
  assert.deepEqual(validateReading({ ...validReading, shipmentId: "SHP001" }), []);
});

test("rejects missing deviceId", () => {
  const errors = validateReading({ ...validReading, deviceId: "" });
  assert.ok(errors.includes("deviceId required"));
});

test("rejects non-finite sensor values", () => {
  assert.ok(validateReading({ ...validReading, temperature: Number.NaN }).length > 0);
  assert.ok(validateReading({ ...validReading, battery: Number.POSITIVE_INFINITY }).length > 0);
});

test("rejects invalid ranges and gas values", () => {
  assert.ok(validateReading({ ...validReading, humidity: 120 }).length > 0);
  assert.ok(validateReading({ ...validReading, battery: -5 }).length > 0);
  assert.ok(validateReading({ ...validReading, gasLevel: -1 }).length > 0);
  assert.ok(validateReading({ ...validReading, gasLevel: "50" }).length > 0);
});

test("rejects incomplete or invalid GPS coordinates", () => {
  assert.ok(validateReading({ ...validReading, latitude: 91 }).length > 0);
  assert.ok(validateReading({ ...validReading, longitude: 181 }).length > 0);
  assert.ok(validateReading({ ...validReading, longitude: undefined }).length > 0);
});

test("rejects malformed timestamps and shipment IDs", () => {
  assert.ok(validateReading({ ...validReading, timestamp: "invalid" }).length > 0);
  assert.ok(validateReading({ ...validReading, shipmentId: "" }).length > 0);
});

test("normalizes shipment identity from backend assignment", () => {
  const normalized = normalizeTelemetry(
    { ...validReading, deviceId: "DEV999", shipmentId: "SHP999" },
    "DEV001",
    "SHP005"
  );

  assert.equal(normalized.deviceId, "DEV001");
  assert.equal(normalized.shipmentId, "SHP005");
});

test("normalizes unassigned devices to a null shipment", () => {
  const normalized = normalizeTelemetry(validReading, "DEV001", null);
  assert.equal(normalized.shipmentId, null);
});