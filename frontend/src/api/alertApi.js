import apiClient from "./axios";

// baseURL already includes /api/v1 - paths must be relative to it.
// Functions unwrap the { success, message, data } envelope.

/**
 * List alerts with optional filters (status, severity, shipmentId, deviceId,
 * page, limit). Returns { alerts: [...], pagination: {...} }.
 */
export const listAlerts = async (params = {}) => {
  const response = await apiClient.get("/alerts", { params });
  return response.data ?? { alerts: [], pagination: null };
};

/** Get a single alert by its alertId. */
export const getAlert = async (alertId) => {
  const response = await apiClient.get(`/alerts/${alertId}`);
  return response.data ?? null;
};

/** Acknowledge an alert (ADMIN only). */
export const acknowledgeAlert = async (alertId) => {
  const response = await apiClient.patch(`/alerts/${alertId}/acknowledge`);
  return response.data ?? null;
};

/** Resolve an alert (ADMIN only). */
export const resolveAlert = async (alertId) => {
  const response = await apiClient.patch(`/alerts/${alertId}/resolve`);
  return response.data ?? null;
};
