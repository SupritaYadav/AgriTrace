import axios from 'axios';
import { getIdToken } from 'firebase/auth';
import { auth } from '../config/firebase';

// Create an Axios instance with base URL from Vite env variables
const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  timeout: 15000,
});

// Request interceptor to add Firebase ID token
apiClient.interceptors.request.use(async (config) => {
  try {
    const token = await getIdToken(auth.currentUser, true);
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  } catch (err) {
    // If token retrieval fails, proceed without auth header; downstream will handle 401
    console.warn('Failed to retrieve Firebase ID token for request', err);
  }
  return config;
}, (error) => Promise.reject(error));

// Response interceptor to handle auth errors globally
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && [401, 403].includes(error.response.status)) {
      // Optional: trigger a sign‑out or redirect to login page
      console.error('Authentication error - consider logging out the user');
    }
    return Promise.reject(error);
  }
);

export default apiClient;
