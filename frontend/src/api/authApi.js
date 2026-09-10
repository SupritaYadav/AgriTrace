import apiClient from './axios';

/**
 * Fetches the current authenticated user's profile from the backend.
 * The backend endpoint is `/api/v1/me` which returns user details including role.
 */
export const getCurrentUser = async () => {
  const response = await apiClient.get('/me');
  return response.data;
};
