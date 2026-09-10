// utils/apiResponse.js
// Helper functions to ensure consistent API responses across the backend.

/**
 * Send a successful JSON response.
 * @param {object} res Express response object
 * @param {any} data Payload to include in the response (usually an object or array)
 * @param {string} [message] Optional human‑readable message
 */
export function success(res, data = null, message = "") {
  return res.json({
    success: true,
    message,
    data,
  });
}

/**
 * Send an error JSON response.
 * @param {object} res Express response object
 * @param {number} statusCode HTTP status code (e.g., 400, 404, 500)
 * @param {string} message Human‑readable error description
 * @param {string} [errorCode] Optional machine‑readable error identifier
 */
export function error(res, statusCode, message, errorCode = undefined) {
  const payload = {
    success: false,
    message,
  };
  if (errorCode) payload.errorCode = errorCode;
  return res.status(statusCode).json(payload);
}
