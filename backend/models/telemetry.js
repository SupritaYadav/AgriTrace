export function validateReading(data) {
  const errors = [];

  if (!data || typeof data !== "object" || Array.isArray(data)) {
    return ["telemetry payload must be an object"];
  }

  const hasLatitude = data.latitude !== undefined;
  const hasLongitude = data.longitude !== undefined;

  if (typeof data.deviceId !== "string" || !data.deviceId.trim()) {
    errors.push("deviceId required");
  }

  if (!Number.isFinite(data.temperature)) {
    errors.push("temperature must be a finite number");
  }

  if (!Number.isFinite(data.humidity) || data.humidity < 0 || data.humidity > 100) {
    errors.push("humidity must be between 0 and 100");
  }

  if (!Number.isFinite(data.battery) || data.battery < 0 || data.battery > 100) {
    errors.push("battery must be between 0 and 100");
  }

  if (
    data.gasLevel !== undefined &&
    (!Number.isFinite(data.gasLevel) || data.gasLevel < 0)
  ) {
    errors.push("gasLevel must be a non-negative finite number");
  }

  if (hasLatitude !== hasLongitude) {
    errors.push("latitude and longitude must be provided together");
  } else if (hasLatitude && (!Number.isFinite(data.latitude) || data.latitude < -90 || data.latitude > 90)) {
    errors.push("latitude must be between -90 and 90");
  }

  if (hasLongitude && (!Number.isFinite(data.longitude) || data.longitude < -180 || data.longitude > 180)) {
    errors.push("longitude must be between -180 and 180");
  }

  if (data.shipmentId !== undefined &&
      (typeof data.shipmentId !== "string" ||
        !/^[A-Za-z0-9][A-Za-z0-9_-]{0,127}$/.test(data.shipmentId.trim()))) {
    errors.push("shipmentId must be a non-empty string when provided");
  }

  if (typeof data.timestamp !== "string" || !data.timestamp.trim() || Number.isNaN(Date.parse(data.timestamp))) {
    errors.push("timestamp must be a valid date");
  }

  return errors;
}

export function normalizeTelemetry(data, verifiedDeviceId, shipmentId) {
  return {
    ...data,
    deviceId: verifiedDeviceId,
    shipmentId: shipmentId || null,
    dataHash: null,
    checkpointId: null,
    checkpointed: false,
    timestamp: data.timestamp,
  };
}