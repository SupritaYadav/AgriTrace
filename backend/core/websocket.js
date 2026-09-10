import { WebSocketServer } from "ws";
import { verifyToken, db } from "./firebase.js";
import { getShipmentForUser } from "../services/shipmentService.js";

const clients = new Map();
const shipmentSubscriptions = new Map();
const socketSubscriptions = new Map();

function send(ws, event) {
  if (ws.readyState === ws.OPEN) ws.send(JSON.stringify(event));
}

function sendError(ws, code, message) {
  send(ws, { type: "error", code, message });
}

function removeSocketFromSubscriptions(ws) {
  const subscriptions = socketSubscriptions.get(ws) || new Set();
  for (const shipmentId of subscriptions) {
    const sockets = shipmentSubscriptions.get(shipmentId);
    sockets?.delete(ws);
    if (sockets?.size === 0) shipmentSubscriptions.delete(shipmentId);
  }
  socketSubscriptions.delete(ws);
}

async function handleSocketMessage(ws, rawMessage) {
  let message;
  try {
    message = JSON.parse(rawMessage.toString());
  } catch {
    sendError(ws, "INVALID_MESSAGE", "WebSocket message must be valid JSON.");
    return;
  }

  if (!message || typeof message.type !== "string") {
    sendError(ws, "INVALID_MESSAGE", "WebSocket message type is required.");
    return;
  }

  if (message.type !== "shipment.subscribe" && message.type !== "shipment.unsubscribe") {
    sendError(ws, "UNSUPPORTED_MESSAGE", "Unsupported WebSocket message type.");
    return;
  }

  if (
    typeof message.shipmentId !== "string" ||
    !/^[A-Za-z0-9][A-Za-z0-9_-]{0,127}$/.test(message.shipmentId)
  ) {
    sendError(ws, "INVALID_SHIPMENT_ID", "A valid shipmentId is required.");
    return;
  }

  const shipmentId = message.shipmentId;
  const subscriptions = socketSubscriptions.get(ws) || new Set();

  if (message.type === "shipment.unsubscribe") {
    subscriptions.delete(shipmentId);
    shipmentSubscriptions.get(shipmentId)?.delete(ws);
    if (shipmentSubscriptions.get(shipmentId)?.size === 0) {
      shipmentSubscriptions.delete(shipmentId);
    }
    send(ws, { type: "shipment.unsubscribed", shipmentId });
    return;
  }

  try {
    const shipment = await getShipmentForUser(shipmentId, ws.user.uid, ws.user.role);
    if (!shipment) {
      sendError(ws, "SHIPMENT_NOT_FOUND", "Shipment not found.");
      return;
    }
  } catch (error) {
    if (error.code === "SHIPMENT_ACCESS_DENIED") {
      sendError(ws, "SHIPMENT_ACCESS_DENIED", "You are not authorized to access this shipment.");
      return;
    }
    console.error("WebSocket shipment authorization failed:", error.message);
    sendError(ws, "SERVER_ERROR", "Unable to verify shipment access.");
    return;
  }

  subscriptions.add(shipmentId);
  socketSubscriptions.set(ws, subscriptions);
  if (!shipmentSubscriptions.has(shipmentId)) shipmentSubscriptions.set(shipmentId, new Set());
  shipmentSubscriptions.get(shipmentId).add(ws);
  send(ws, { type: "shipment.subscribed", shipmentId });
}

export function setupWebSocket(server) {
  const wss = new WebSocketServer({ server });

  wss.on("connection", async (ws, req) => {
    console.log("WebSocket connection attempt");
    const url = new URL(req.url, "http://localhost");
    const token = url.searchParams.get("token");

    if (!token) {
      ws.close(4001, "No token provided");
      return;
    }

    try {
      const decoded = await verifyToken(token);
      const userDoc = await db.collection("users").doc(decoded.uid).get();
      const role = userDoc.exists ? userDoc.data().role : null;

      if (!role) {
        ws.close(4003, "User profile not found");
        return;
      }

      ws.user = { uid: decoded.uid, role };
      if (!clients.has(decoded.uid)) clients.set(decoded.uid, new Set());
      clients.get(decoded.uid).add(ws);
      socketSubscriptions.set(ws, new Set());

      ws.on("message", (message) => {
        handleSocketMessage(ws, message).catch((error) => {
          console.error("WebSocket message handling failed:", error.message);
          sendError(ws, "SERVER_ERROR", "Unable to process WebSocket message.");
        });
      });

      ws.on("close", () => {
        clients.get(decoded.uid)?.delete(ws);
        if (clients.get(decoded.uid)?.size === 0) clients.delete(decoded.uid);
        removeSocketFromSubscriptions(ws);
        console.log(`WebSocket disconnected: ${decoded.uid}`);
      });

      console.log(`WebSocket authenticated for user ${decoded.uid}`);
    } catch {
      console.log("WebSocket authentication failed");
      ws.close(4002, "Invalid token");
    }
  });
}

export function broadcastToShipment(shipmentId, event) {
  if (!shipmentId) return;
  const sockets = shipmentSubscriptions.get(shipmentId);
  if (!sockets) return;

  for (const ws of sockets) {
    if (ws.readyState === ws.OPEN) {
      ws.send(JSON.stringify(event));
    } else {
      sockets.delete(ws);
      socketSubscriptions.get(ws)?.delete(shipmentId);
    }
  }

  if (sockets.size === 0) shipmentSubscriptions.delete(shipmentId);
}

export function broadcastToAll(event) {
  const message = JSON.stringify(event);
  for (const sockets of clients.values()) {
    for (const ws of sockets) {
      if (ws.readyState === ws.OPEN) ws.send(message);
    }
  }
}
