import api from "./api";

const deviceService = {
  getAllDevices: async () => {
    const response = await api.get("/devices");
    return response.data;
  },

  getAvailableDevices: async () => {
    const response = await api.get("/devices/available");
    return response.data;
  },

  getDeviceById: async (deviceId) => {
    const response = await api.get(`/devices/${deviceId}`);
    return response.data;
  },

  registerDevice: async (deviceData) => {
    const response = await api.post("/devices", deviceData);
    return response.data;
  },

  updateDevice: async (deviceId, deviceData) => {
    const response = await api.put(
      `/devices/${deviceId}`,
      deviceData
    );

    return response.data;
  },

  assignDevice: async (deviceId, shipmentId) => {
    const response = await api.patch(
      `/devices/${deviceId}/assign`,
      {
        shipmentId,
      }
    );

    return response.data;
  },

  unassignDevice: async (deviceId) => {
    const response = await api.patch(
      `/devices/${deviceId}/unassign`
    );

    return response.data;
  },

  deleteDevice: async (deviceId) => {
    const response = await api.delete(`/devices/${deviceId}`);
    return response.data;
  },
};

export default deviceService;