import { getCollection } from "../core/mongo.js";
import { broadcastToAll } from "../core/websocket.js";
import { addTimelineEvent } from "./timelineService.js";
import { createSystemAlert } from "./alertService.js";

const OFFLINE_TIMEOUT = 5 * 60 * 1000;

export async function checkOfflineDevices() {
  const devices = await getCollection("devices").find({}).toArray();
  const now = Date.now();

  for (const device of devices) {
    if (!device.lastSeenAt) continue;

    const lastSeen = new Date(device.lastSeenAt).getTime();
    const offline = now - lastSeen > OFFLINE_TIMEOUT;

    if (offline && device.status === "OFFLINE") {
      continue;
    }

    if (offline) {
      await getCollection("devices").updateOne(
        { deviceId: device.deviceId },
        { $set: { status: "OFFLINE" } }
      );

      if (device.currentShipmentId) {
        await addTimelineEvent(device.currentShipmentId, "DEVICE_OFFLINE", "SYSTEM", {
          deviceId: device.deviceId,
        });
      }

      await createSystemAlert({
        deviceId: device.deviceId,
        shipmentId: device.currentShipmentId || null,
        type: "DEVICE_OFFLINE",
        severity: "WARNING",
        value: null,
      });

      broadcastToAll({
        type: "device.offline",
        data: {
          deviceId: device.deviceId,
          shipmentId: device.currentShipmentId || null,
        },
      });

      console.log(`Device offline: ${device.deviceId}`);
    }
  }
}