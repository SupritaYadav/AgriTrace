import axios from 'axios';
import { auth } from '../config/firebase';

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  timeout: 15000,

  headers: {
    'Content-Type': 'application/json',
  },
});

// ============================================================
// Request interceptor
// ============================================================

apiClient.interceptors.request.use(
  async (config) => {
    const user = auth.currentUser;

    if (user) {
      try {
        const token = await user.getIdToken();

        if (token) {
          config.headers =
            config.headers || {};

          config.headers.Authorization =
            `Bearer ${token}`;
        }
      } catch (err) {
        console.warn(
          'Failed to retrieve Firebase ID token',
          err
        );
      }
    }

    return config;
  },

  (error) => Promise.reject(error)
);

// ============================================================
// Response interceptor
// ============================================================

apiClient.interceptors.response.use(
  (response) => {
    const data = response.data;

    /*
     * Backend successful response:
     *
     * {
     *   success: true,
     *   data: ...
     * }
     *
     * Convert response.data into the actual
     * contained data for API modules.
     */
    if (
      data &&
      typeof data === 'object' &&
      data.success === true &&
      Object.hasOwn(data, 'data')
    ) {
      response.data = data.data;
    }

    return response;
  },

  async (error) => {
    const { response, config } = error;

    // --------------------------------------------------------
    // 403 = authenticated but not authorized
    // --------------------------------------------------------

    if (response?.status === 403) {
      return Promise.reject(
        normalizeError(error)
      );
    }

    // --------------------------------------------------------
    // Retry one time after a 401
    // --------------------------------------------------------

    const isRetryable =
      response?.status === 401 &&
      config &&
      !config._retry &&
      auth.currentUser;

    if (isRetryable) {
      config._retry = true;

      try {
        const token =
          await auth.currentUser.getIdToken(true);

        config.headers =
          config.headers || {};

        config.headers.Authorization =
          `Bearer ${token}`;

        return apiClient.request(config);
      } catch (refreshErr) {
        console.warn(
          'Token refresh failed after 401',
          refreshErr
        );
      }
    }

    // --------------------------------------------------------
    // Token refresh failed → log out
    // --------------------------------------------------------

    if (
      response?.status === 401 &&
      auth.currentUser
    ) {
      try {
        const { logoutUser } =
          await import(
            '../services/authService'
          );

        await logoutUser();
      } catch (logoutError) {
        console.error(
          'Failed to logout on auth error',
          logoutError
        );
      }
    }

    return Promise.reject(
      normalizeError(error)
    );
  }
);

// ============================================================
// Normalize API errors
// ============================================================

function normalizeError(error) {
  const response = error.response;

  const status =
    response?.status ?? null;

  const backendMessage =
    response?.data?.message ||
    response?.data?.detail ||
    null;

  let message = backendMessage;

  if (!message) {
    if (status === null) {
      message =
        'Network error - please check your connection.';
    }

    else if (status === 400) {
      message =
        'Invalid request. Please check your input.';
    }

    else if (status === 401) {
      message =
        'Your session has expired. Please log in again.';
    }

    else if (status === 403) {
      message =
        'You do not have permission to perform this action.';
    }

    else if (status === 404) {
      message =
        'The requested resource was not found.';
    }

    else if (status === 409) {
      message =
        'This action conflicts with the current state.';
    }

    else if (status >= 500) {
      message =
        'Server error - please try again later.';
    }

    else {
      message =
        error.message ||
        'Something went wrong.';
    }
  }

  const normalized =
    new Error(message);

  normalized.status = status;
  normalized.data =
    response?.data;

  return normalized;
}

export default apiClient;