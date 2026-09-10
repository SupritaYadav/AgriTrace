import apiClient from './axios';

/**
 * Retrieves dashboard summary data.
 * Endpoint: GET /dashboard/summary
 */
export const getDashboardSummary = async () => {
  const response = await apiClient.get('/dashboard/summary');
  return response.data;
};
