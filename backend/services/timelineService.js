import { randomUUID } from "crypto";
import { getCollection } from "../core/mongo.js";

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
  await getCollection("timeline").insertOne(event);
  return event;
}

export async function getTimeline(shipmentId) {
  return getCollection("timeline")
    .find({ shipmentId })
    .sort({ timestamp: 1 })
    .toArray();
}