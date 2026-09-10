import { randomUUID } from "crypto";
import { db } from "../core/firebase.js";

export async function addTimelineEvent(shipmentId, type, actorId, metadata = {}) {
  const eventId = randomUUID();
  const event = {
    eventId,
    shipmentId,
    type,
    timestamp: new Date().toISOString(),
    actorId,
    metadata,
  };
  await db.collection("timeline").doc(eventId).set(event);
  return event;
}

export async function getTimeline(shipmentId) {
  const snapshot = await db.collection("timeline")
    .where("shipmentId", "==", shipmentId)
    .get();
  return snapshot.docs.map(doc => doc.data()).sort((a, b) =>
    new Date(a.timestamp) - new Date(b.timestamp)
  );
}