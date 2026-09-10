const normalizeStatus = (
  status = ""
) => {
  return status
    .toString()
    .trim()
    .toLowerCase()
    .replaceAll("_", " ")
    .replaceAll("-", " ");
};


export const getStatusVariant = (
  status
) => {
  const normalized =
    normalizeStatus(status);

  const successStatuses = [
    "active",
    "online",
    "delivered",
    "completed",
    "safe",
    "verified",
    "available",
    "connected",
    "normal",
  ];

  const warningStatuses = [
    "warning",
    "pending",
    "in transit",
    "assigned",
    "delayed",
    "maintenance",
  ];

  const dangerStatuses = [
    "critical",
    "offline",
    "failed",
    "cancelled",
    "damaged",
    "alert",
    "disconnected",
  ];

  const infoStatuses = [
    "created",
    "registered",
    "processing",
    "packed",
    "dispatched",
  ];

  if (
    successStatuses.includes(
      normalized
    )
  ) {
    return "success";
  }

  if (
    warningStatuses.includes(
      normalized
    )
  ) {
    return "warning";
  }

  if (
    dangerStatuses.includes(
      normalized
    )
  ) {
    return "danger";
  }

  if (
    infoStatuses.includes(
      normalized
    )
  ) {
    return "info";
  }

  return "neutral";
};


export const getStatusLabel = (
  status
) => {
  if (!status) {
    return "Unknown";
  }

  return status
    .toString()
    .replaceAll("_", " ")
    .replaceAll("-", " ")
    .split(" ")
    .map(
      (word) =>
        word.charAt(0).toUpperCase() +
        word.slice(1)
    )
    .join(" ");
};


export const isDeviceOnline = (
  lastSeen,
  maxMinutes = 5
) => {
  if (!lastSeen) {
    return false;
  }

  const lastSeenDate =
    new Date(lastSeen);

  const now =
    new Date();

  const differenceMinutes =
    (
      now.getTime() -
      lastSeenDate.getTime()
    ) /
    1000 /
    60;

  return (
    differenceMinutes <=
    maxMinutes
  );
};


export const getDeviceStatus = (
  device
) => {
  if (!device) {
    return "unknown";
  }

  if (
    device.status ===
    "maintenance"
  ) {
    return "maintenance";
  }

  if (
    device.status ===
    "offline"
  ) {
    return "offline";
  }

  if (
    device.lastSeen &&
    isDeviceOnline(
      device.lastSeen
    )
  ) {
    return "online";
  }

  return (
    device.status ||
    "offline"
  );
};


export const getAlertSeverity = (
  value,
  warningThreshold,
  criticalThreshold
) => {
  if (
    value >=
    criticalThreshold
  ) {
    return "critical";
  }

  if (
    value >=
    warningThreshold
  ) {
    return "warning";
  }

  return "safe";
};


export const getTemperatureStatus = (
  temperature,
  min = 2,
  max = 8
) => {
  if (
    temperature ===
      null ||
    temperature ===
      undefined
  ) {
    return "unknown";
  }

  if (
    temperature >= min &&
    temperature <= max
  ) {
    return "safe";
  }

  const difference =
    temperature < min
      ? min - temperature
      : temperature - max;

  if (difference <= 2) {
    return "warning";
  }

  return "critical";
};


export const getHumidityStatus = (
  humidity,
  min = 50,
  max = 80
) => {
  if (
    humidity ===
      null ||
    humidity ===
      undefined
  ) {
    return "unknown";
  }

  if (
    humidity >= min &&
    humidity <= max
  ) {
    return "safe";
  }

  if (
    humidity >= min - 10 &&
    humidity <= max + 10
  ) {
    return "warning";
  }

  return "critical";
};


export default {
  getStatusVariant,
  getStatusLabel,
  isDeviceOnline,
  getDeviceStatus,
  getAlertSeverity,
  getTemperatureStatus,
  getHumidityStatus,
};