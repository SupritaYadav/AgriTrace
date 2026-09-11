import apiClient from './axios';

/**
 * Fetch the current authenticated user's profile from the backend.
 *
 * Endpoint: GET /auth/me (resolves to /api/v1/auth/me).
 * NOTE: this route returns a bare object, NOT the { success, message, data }
 * envelope: { uid, email, profile } where `profile` is the Firestore user doc
 * ({ uid, email, role, createdAt, updatedAt }) or null if not yet created.
 */
export const getCurrentUser = async () => {
  const response = await apiClient.get('/auth/me');
  return response.data;
};

/**
 * Create the Firestore user profile after Firebase signup.
 *
 * Endpoint: POST /auth/register { role }.
 * `role` must be one of FARMER | TRANSPORTER | WAREHOUSE.
 * Returns the created profile object.
 */
export const registerProfile = async (role) => {
  const response = await apiClient.post('/auth/register', { role });
  return response.data;
};

