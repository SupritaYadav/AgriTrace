import apiClient from './axios';

/**
 * Public, unauthenticated trace by tracking ID.
 * Endpoint: GET /public/trace/:trackingId (resolves to
 * /api/v1/public/trace/:trackingId). No Authorization header is required.
 *
 * Returns the sanitized public payload (shipmentId, trackingId, productName,
 * origin, destination, status, createdAt, environment, device, timeline,
 * integrity, latestTelemetry).
 */
export const getPublicTrace = async (trackingId) => {
  const response = await apiClient.get(`/public/trace/${trackingId}`);
  return response.data ?? null;
};

/**
 * Verify integrity checkpoints for a shipment (FARMER/TRANSPORTER/WAREHOUSE/ADMIN).
 * Endpoint: GET /shipments/:shipmentId/integrity/verify.
 * Returns { shipmentId, checkpointCount, verified, checkpoints: [...] }.
 */
export const verifyShipmentIntegrity = async (shipmentId) => {
  const response = await apiClient.get(
    `/shipments/${shipmentId}/integrity/verify`
  );
  return response.data ?? null;
};

/**
 * Create an integrity checkpoint for a shipment.
 * Endpoint: POST /shipments/:shipmentId/integrity/checkpoint.
 */
export const createIntegrityCheckpoint = async (shipmentId) => {
  const response = await apiClient.post(
    `/shipments/${shipmentId}/integrity/checkpoint`
  );
  return response.data ?? null;
};
