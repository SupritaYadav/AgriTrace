import test from "node:test";
import assert from "node:assert/strict";
import { parseTelemetryTopic } from "./mqttTopic.js";

test("parses a valid telemetry topic", () => {
  assert.deepEqual(
    parseTelemetryTopic("agr/devices/DEV001/telemetry"),
    { deviceId: "DEV001" }
  );
});

test("rejects malformed telemetry topics", () => {
  assert.equal(parseTelemetryTopic("agr/device/DEV001/telemetry"), null);
  assert.equal(parseTelemetryTopic("agr/devices//telemetry"), null);
  assert.equal(parseTelemetryTopic("agr/devices/DEV001/status"), null);
  assert.equal(parseTelemetryTopic("agr/devices/DEV001/telemetry/extra"), null);
});

test("accepts identifier-compatible device IDs", () => {
  assert.deepEqual(
    parseTelemetryTopic("agr/devices/DEV-001_node/telemetry"),
    { deviceId: "DEV-001_node" }
  );
});