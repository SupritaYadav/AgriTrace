import apiClient from "./axios";

export const optimizeRoute = async (payload) => {
  const response = await apiClient.post("/routes/optimize", payload);
  return response.data ?? null;
};

export const getShipmentRoute = async (shipmentId) => {
  const response = await apiClient.get(`/routes/shipment/${shipmentId}`);
  return response.data ?? null;
};

export const selectRoute = async (shipmentId, payload) => {
  const response = await apiClient.post(`/routes/${shipmentId}/select`, payload);
  return response.data ?? null;
};
