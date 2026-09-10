const DEVICE_ID_PATTERN = /^[A-Za-z0-9][A-Za-z0-9_-]{0,127}$/;

export function parseTelemetryTopic(topic) {
  if (typeof topic !== "string") return null;

  const parts = topic.split("/");
  if (parts.length !== 4 || parts[0] !== "agr" || parts[1] !== "devices" || parts[3] !== "telemetry") {
    return null;
  }

  const deviceId = parts[2];
  if (!DEVICE_ID_PATTERN.test(deviceId)) return null;

  return { deviceId };
}
