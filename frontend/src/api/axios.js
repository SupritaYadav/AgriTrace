import axios from 'axios';
import { auth } from '../config/firebase';

// Single shared Axios client for the whole app.
//
// VITE_API_URL already contains the versioned prefix, e.g.
// "http://localhost:8000/api/v1". Every API module must therefore use
// paths RELATIVE to that prefix (e.g. "/shipments"), never "/api/v1/...".
const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Attach the Firebase ID token to every outgoing request.
apiClient.interceptors.request.use(
  async (config) => {
    const user = auth.currentUser;
    if (user) {
      try {
        // getIdToken is an instance method on the User object.
        const token = await user.getIdToken();
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
      } catch (err) {
        // Proceed without a token; downstream will surface a 401.
        console.warn('Failed to retrieve Firebase ID token', err);
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// On a 401, retry once with a force-refreshed token before giving up.
// 403 is an authorization error (not a session error) and never logs out.
apiClient.interceptors.response.use(
  (response) => {
    const data = response.data;
    if (
      data &&
      typeof data === 'object' &&
      data.success &&
      Object.prototype.hasOwn.call(data, 'data')
    ) {
      response.data = data.data;
    }
    return response;
  },
  async (error) => {
    const { response, config } = error;

    if (response && response.status === 403) {
      return Promise.reject(normalizeError(error));
    }

    const isRetryable =
      response &&
      response.status === 401 &&
      config &&
      !config._retry &&
      auth.currentUser;

    if (isRetryable) {
      config._retry = true;
      try {
        const token = await auth.currentUser.getIdToken(true);
        config.headers = config.headers || {};
        config.headers.Authorization = `Bearer ${token}`;
        return apiClient.request(config);
      } catch (refreshErr) {
        console.warn('Token refresh failed after 401', refreshErr);
      }
    }

    if (response && response.status === 401 && auth.currentUser) {
      try {
        const { logoutUser } = await import('../services/authService');
        await logoutUser();
      } catch (e) {
        console.error('Failed to logout on auth error', e);
      }
    }

    return Promise.reject(normalizeError(error));
  }
);

/**
 * Normalize any axios failure into a predictable error object so UI
 * components never render "[object Object]" / "AxiosError" / "undefined".
 *
 * Backend error envelope: { success: false, message: "..." }.
 */
function normalizeError(error) {
  const response = error.response;
  const status = response?.status ?? null;
  const backendMessage =
    response?.data?.message ||
    response?.data?.detail ||
    null;

  let message = backendMessage;
  if (!message) {
    if (status === null) {
      message = 'Network error - please check your connection.';
    } else if (status === 400) {
      message = 'Invalid request. Please check your input.';
    } else if (status === 401) {
      message = 'Your session has expired. Please log in again.';
    } else if (status === 403) {
      message = 'You do not have permission to perform this action.';
    } else if (status === 404) {
      message = 'The requested resource was not found.';
    } else if (status === 409) {
      message = 'This action conflicts with the current state.';
    } else if (status >= 500) {
      message = 'Server error - please try again later.';
    } else {
      message = error.message || 'Something went wrong.';
    }
  }

  const normalized = new Error(message);
  normalized.status = status;
  normalized.data = response?.data;
  return normalized;
}

export default apiClient;
