import apiClient from './axios';

/**
 * Retrieve dashboard summary data.
 *
 * Endpoint: GET /dashboard/summary (resolves to /api/v1/dashboard/summary).
 * Returns the `data` payload:
 * { activeShipments, completedShipments, onlineDevices, offlineDevices,
 *   openAlerts, criticalAlerts, averageTemperature, averageHumidity,
 *   recentShipments, recentAlerts }.
 */
export const getDashboardSummary = async () => {
  const response = await apiClient.get('/dashboard/summary');
  return response.data ?? null;
};
