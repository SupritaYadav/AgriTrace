import api from "./api";

const shipmentService = {
  getAllShipments: async () => {
    const response = await api.get("/shipments");
    return response.data;
  },

  getActiveShipments: async () => {
    const response = await api.get("/shipments/active");
    return response.data;
  },

  getShipmentById: async (shipmentId) => {
    const response = await api.get(`/shipments/${shipmentId}`);
    return response.data;
  },

  createShipment: async (shipmentData) => {
    const response = await api.post("/shipments", shipmentData);
    return response.data;
  },

  updateShipment: async (shipmentId, shipmentData) => {
    const response = await api.put(
      `/shipments/${shipmentId}`,
      shipmentData
    );

    return response.data;
  },

  deleteShipment: async (shipmentId) => {
    const response = await api.delete(`/shipments/${shipmentId}`);
    return response.data;
  },

  assignDevice: async (shipmentId, deviceId) => {
    const response = await api.patch(
      `/shipments/${shipmentId}/device`,
      {
        deviceId,
      }
    );

    return response.data;
  },

  getShipmentHistory: async () => {
    const response = await api.get("/shipments/history");
    return response.data;
  },

  getPublicTrace: async (trackingId) => {
    const response = await api.get(`/trace/${trackingId}`);
    return response.data;
  },
};

export default shipmentService;