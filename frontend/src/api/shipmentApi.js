import axiosInstance from "./axios";

export const listShipments = (params = {}) =>
  axiosInstance.get("/shipments", { params });

export const getShipment = (id) =>
  axiosInstance.get(`/shipments/${id}`);

export const createShipment = (payload) =>
  axiosInstance.post("/shipments", payload);

export const updateShipmentStatus = (id, status) =>
  axiosInstance.patch(`/shipments/${id}/status`, { status });

export const assignShipment = (id, assignment) =>
  // assignment can contain { transporterId, warehouseId, deviceId }
  axiosInstance.patch(`/shipments/${id}/assign`, assignment);

export const getShipmentHistory = (id, query = {}) =>
  axiosInstance.get(`/shipments/${id}/history`, { params: query });
