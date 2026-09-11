import apiClient from "../api/axios";

const monitoringService = {
  getLatestReadings: async () => {
    const response = await apiClient.get("/monitoring/latest");
    return response.data;
  },

  getShipmentReadings: async (shipmentId) => {
    const response = await apiClient.get(
      `/monitoring/shipment/${shipmentId}`
    );

    return response.data;
  },

  getDeviceReadings: async (deviceId) => {
    const response = await apiClient.get(
      `/monitoring/device/${deviceId}`
    );

    return response.data;
  },

  getTemperatureHistory: async (shipmentId) => {
    const response = await apiClient.get(
      `/monitoring/${shipmentId}/temperature`
    );

    return response.data;
  },

  getHumidityHistory: async (shipmentId) => {
    const response = await apiClient.get(
      `/monitoring/${shipmentId}/humidity`
    );

    return response.data;
  },

  getEthyleneHistory: async (shipmentId) => {
    const response = await apiClient.get(
      `/monitoring/${shipmentId}/ethylene`
    );

    return response.data;
  },

  getLocationHistory: async (shipmentId) => {
    const response = await apiClient.get(
      `/monitoring/${shipmentId}/location`
    );

    return response.data;
  },

  getAnalytics: async () => {
    const response = await apiClient.get("/monitoring/analytics");
    return response.data;
  },
};

export default monitoringService;