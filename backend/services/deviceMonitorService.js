import { db } from "../core/firebase.js";
import { broadcastToAll } from "../core/websocket.js";
import { addTimelineEvent } from "./timelineService.js";
import { createSystemAlert } from "./alertService.js";

const OFFLINE_TIMEOUT = 5 * 60 * 1000;

export async function checkOfflineDevices() {
  const snapshot = await db.collection("devices").get();
  const now = Date.now();

  for (const doc of snapshot.docs) {
    const device = doc.data();

    if (!device.lastSeenAt) continue;

    const lastSeen = new Date(device.lastSeenAt).getTime();
    const offline = now - lastSeen > OFFLINE_TIMEOUT;

    if (offline && device.status === "OFFLINE") {
      continue;
    }

    if (offline) {
      await doc.ref.update({ status: "OFFLINE" });

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
