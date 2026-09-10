import axiosInstance from "./axios";

export const listDevices = (params = {}) =>
  axiosInstance.get("/devices", { params });

export const getDevice = (id) =>
  axiosInstance.get(`/devices/${id}`);

export const assignDeviceToShipment = (deviceId, shipmentId) =>
  axiosInstance.patch(`/devices/${deviceId}/assign`, { shipmentId });
