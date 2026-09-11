import apiClient from "./axios";

// Device endpoints are relative to VITE_API_URL (which already includes /api/v1).
// Functions unwrap the { success, message, data } envelope.

/** List all devices. Returns an array of device objects. */
export const listDevices = async () => {
  const response = await apiClient.get("/devices");
  return response.data ?? [];
};

/** Get a device by its deviceId. */
export const getDevice = async (deviceId) => {
  const response = await apiClient.get(`/devices/${deviceId}`);
  return response.data ?? null;
};

/**
 * Assign a device to a shipment (FARMER/ADMIN only).
 * Backend endpoint: POST /devices/:deviceId/assign { shipmentId }.
 */
export const assignDeviceToShipment = async (deviceId, shipmentId) => {
  const response = await apiClient.post(`/devices/${deviceId}/assign`, {
    shipmentId,
  });
  return response.data ?? null;
};

/**
 * Device health. Returns
 * { deviceId, status, battery, lastSeenAt, firmwareVersion,
 *   currentShipmentId, latestTelemetry }.
 */
export const getDeviceHealth = async (deviceId) => {
  const response = await apiClient.get(`/devices/${deviceId}/health`);
  return response.data ?? null;
};

/** Register a device (ADMIN only). */
export const registerDevice = async (payload) => {
  const response = await apiClient.post("/devices", payload);
  return response.data ?? null;
};
