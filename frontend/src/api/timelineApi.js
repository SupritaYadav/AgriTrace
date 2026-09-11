import apiClient from './axios';

/**
 * Get timeline events for a shipment.
 * Endpoint: GET /shipments/:shipmentId/timeline
 * Returns a bare array of timeline events.
 */
export const getShipmentTimeline = async (shipmentId) => {
  const response = await apiClient.get(`/shipments/${shipmentId}/timeline`);
  return Array.isArray(response.data) ? response.data : [];
};

/**
 * Add a timeline event to a shipment.
 * Endpoint: POST /shipments/:shipmentId/timeline { type, metadata }
 */
export const addShipmentTimelineEvent = async (shipmentId, type, metadata = {}) => {
  const response = await apiClient.post(`/shipments/${shipmentId}/timeline`, { type, metadata });
  return response.data ?? null;
};
