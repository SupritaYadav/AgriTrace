import { randomBytes } from "crypto";
import QRCode from "qrcode";
import { db } from "../core/firebase.js";
import { getShipmentForUser } from "./shipmentService.js";

const PUBLIC_TRACE_BASE_URL = process.env.PUBLIC_TRACE_BASE_URL || "http://localhost:5174/trace";

function normalizeBaseUrl(baseUrl) {
  return baseUrl.replace(/\/+$/, "");
}

export function buildTraceUrl(trackingId) {
  const normalized = normalizeBaseUrl(PUBLIC_TRACE_BASE_URL);
  return `${normalized}/${trackingId}`;
}

export async function generateShipmentQr(shipmentId, actorUid, actorRole) {
  const shipment = await getShipmentForUser(shipmentId, actorUid, actorRole);
  if (!shipment) {
    return null;
  }

  if (!shipment.trackingId) {
    throw new Error("Shipment does not have a trackingId");
  }

  const traceUrl = buildTraceUrl(shipment.trackingId);
  const qrDataUrl = await QRCode.toDataURL(traceUrl);

  return {
    shipmentId: shipment.shipmentId,
    trackingId: shipment.trackingId,
    traceUrl,
    qrDataUrl,
  };
}

export async function generateShipmentQrPng(shipmentId, actorUid, actorRole) {
  const shipment = await getShipmentForUser(shipmentId, actorUid, actorRole);
  if (!shipment) {
    return null;
  }

  if (!shipment.trackingId) {
    throw new Error("Shipment does not have a trackingId");
  }

  const traceUrl = buildTraceUrl(shipment.trackingId);
  return {
    shipmentId: shipment.shipmentId,
    trackingId: shipment.trackingId,
    traceUrl,
    png: await QRCode.toBuffer(traceUrl),
  };
}

export function generateTrackingId() {
  const token = randomBytes(4).toString("hex").toUpperCase();
  return `AGR-${token}`;
}

export async function ensureUniqueTrackingId() {
  let trackingId = generateTrackingId();
  let exists = true;

  while (exists) {
    const snapshot = await db.collection("shipments").where("trackingId", "==", trackingId).limit(1).get();
    if (snapshot.empty) {
      exists = false;
    } else {
      trackingId = generateTrackingId();
    }
  }

  return trackingId;
}
