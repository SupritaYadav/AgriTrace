// src/services/websocketService.js
//
// WebSocket client for the AgriTrace backend (raw `ws` server mounted on the
// same Express HTTP server as the REST API).
//
// Contract derived from backend/core/websocket.js:
//   - Connect URL: ws(s)://host?token=<firebase-id-token>
//     (auth is QUERY-PARAM based; connections without a token are closed 4001)
//   - Server -> client messages are JSON: { type, data? , code?, message? }
//       device.online     { deviceId }
//       device.offline    { deviceId, shipmentId }
//       telemetry.updated { ...normalizedReading }   (only to shipment subs)
//       alert.created     { ...alert }
//       alert.resolved    { ...alert }
//       shipment.subscribed / shipment.unsubscribed { shipmentId }
//       error             { code, message }
//   - Client -> server messages:
//       { type: "shipment.subscribe",   shipmentId }
//       { type: "shipment.unsubscribe", shipmentId }
//
// The service keeps exactly ONE socket, one reconnect timer, and one set of
// listeners, and cleanly tears everything down on logout.

import { auth } from '../config/firebase';

let socket = null;
let reconnectAttempts = 0;
let reconnectTimer = null;
let manualClose = false;
let currentUrl = null;

const MAX_RECONNECT = 5;
const BASE_RECONNECT_DELAY = 3000; // ms (exponential backoff capped)

// eventName -> Set<callback>
const listeners = {};
// shipmentIds this client wants to stay subscribed to across reconnects
const desiredSubscriptions = new Set();

function emit(eventName, payload) {
  const set = listeners[eventName];
  if (!set) return;
  set.forEach((cb) => {
    try {
      cb(payload);
    } catch (e) {
      console.error('WebSocket listener error', e);
    }
  });
}

async function getAuthToken() {
  try {
    if (!auth.currentUser) return null;
    return await auth.currentUser.getIdToken();
  } catch (e) {
    console.warn('WebSocket: unable to get Firebase token', e);
    return null;
  }
}

function clearReconnectTimer() {
  if (reconnectTimer) {
    clearTimeout(reconnectTimer);
    reconnectTimer = null;
  }
}

function sendRaw(obj) {
  if (socket && socket.readyState === WebSocket.OPEN) {
    socket.send(JSON.stringify(obj));
    return true;
  }
  return false;
}

/**
 * Connect to the backend WebSocket server.
 * @param {string} [url] defaults to VITE_WS_URL.
 */
const connect = async (url) => {
  const targetUrl = url || import.meta.env.VITE_WS_URL;
  if (!targetUrl) return;

  currentUrl = targetUrl;
  manualClose = false;

  if (
    socket &&
    (socket.readyState === WebSocket.OPEN ||
      socket.readyState === WebSocket.CONNECTING)
  ) {
    return; // already connected / connecting
  }

  const token = await getAuthToken();
  if (!token) {
    console.warn('WebSocket: no auth token, skipping connect');
    return;
  }

  const wsUrl = `${targetUrl}?token=${encodeURIComponent(token)}`;
  socket = new WebSocket(wsUrl);

  socket.onopen = () => {
    reconnectAttempts = 0;
    emit('ws:open');
    // Re-establish any shipment subscriptions after (re)connect.
    desiredSubscriptions.forEach((shipmentId) => {
      sendRaw({ type: 'shipment.subscribe', shipmentId });
    });
  };

  socket.onmessage = (event) => {
    let message;
    try {
      message = JSON.parse(event.data);
    } catch {
      console.warn('WebSocket: failed to parse message');
      return;
    }
    if (message && typeof message.type === 'string') {
      // Emit by exact backend event type, plus a generic catch-all.
      emit(message.type, message.data ?? message);
      emit('ws:message', message);
    }
  };

  socket.onclose = (event) => {
    emit('ws:close', event);
    socket = null;
    if (manualClose) return;

    if (reconnectAttempts < MAX_RECONNECT) {
      const delay = BASE_RECONNECT_DELAY * (reconnectAttempts + 1);
      reconnectAttempts += 1;
      clearReconnectTimer();
      reconnectTimer = setTimeout(() => connect(currentUrl), delay);
    } else {
      emit('ws:error', { message: 'WebSocket reconnection limit reached' });
    }
  };

  socket.onerror = (err) => {
    emit('ws:error', err);
  };
};

/**
 * Subscribe to live updates for a shipment. Backend verifies the caller has
 * access to the shipment before accepting the subscription.
 */
const subscribeToShipment = (shipmentId) => {
  if (!shipmentId) return;
  desiredSubscriptions.add(shipmentId);
  sendRaw({ type: 'shipment.subscribe', shipmentId });
};

const unsubscribeFromShipment = (shipmentId) => {
  if (!shipmentId) return;
  desiredSubscriptions.delete(shipmentId);
  sendRaw({ type: 'shipment.unsubscribe', shipmentId });
};

/**
 * Register a listener for a backend event type (e.g. 'telemetry.updated',
 * 'alert.created', 'device.online'). Returns an unsubscribe function.
 */
const on = (eventName, callback) => {
  if (!listeners[eventName]) listeners[eventName] = new Set();
  listeners[eventName].add(callback);
  return () => {
    listeners[eventName]?.delete(callback);
    if (listeners[eventName]?.size === 0) delete listeners[eventName];
  };
};

const off = (eventName, callback) => {
  listeners[eventName]?.delete(callback);
  if (listeners[eventName]?.size === 0) delete listeners[eventName];
};

/**
 * Fully close the socket, cancel reconnects, and drop all listeners and
 * subscriptions. Call this on logout.
 */
const disconnect = () => {
  manualClose = true;
  clearReconnectTimer();
  reconnectAttempts = 0;
  desiredSubscriptions.clear();

  if (socket) {
    try {
      socket.close();
    } catch {
      /* ignore */
    }
    socket = null;
  }
  Object.keys(listeners).forEach((key) => listeners[key].clear());
};

export default {
  connect,
  disconnect,
  on,
  off,
  subscribeToShipment,
  unsubscribeFromShipment,
};
