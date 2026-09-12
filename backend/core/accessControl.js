import { getCollection } from "./mongo.js";
import { Role } from "./roles.js";

export function buildShipmentAccessFilter(user) {
  if (!user || !user.role) {
    return { _id: null };
  }

  if (user.role === Role.ADMIN) {
    return {};
  }

  switch (user.role) {
    case Role.FARMER:
      return {
        $or: [
          { createdBy: user.uid },
          { farmerId: user.uid },
        ],
      };

    case Role.TRANSPORTER:
      return { transporterId: user.uid };

    case Role.WAREHOUSE:
      return { warehouseId: user.uid };

    case Role.RETAILER:
      return { retailerId: user.uid };

    default:
      return { _id: null };
  }
}

export function canAccessShipment(user, shipment) {
  if (!user || !user.role) return false;
  if (user.role === Role.ADMIN) return true;

  switch (user.role) {
    case Role.FARMER:
      return shipment.farmerId === user.uid || shipment.createdBy === user.uid;

    case Role.TRANSPORTER:
      return shipment.transporterId === user.uid;

    case Role.WAREHOUSE:
      return shipment.warehouseId === user.uid;

    case Role.RETAILER:
      return shipment.retailerId === user.uid;

    default:
      return false;
  }
}

export async function getAccessibleShipmentDocs(user) {
  if (!user || !user.role) return [];
  if (user.role === Role.ADMIN) {
    return getCollection("shipments")
      .find({}, { projection: { _id: 0, shipmentId: 1, assignedDevice: 1 } })
      .toArray();
  }

  const filter = buildShipmentAccessFilter(user);
  return getCollection("shipments")
    .find(filter, { projection: { _id: 0, shipmentId: 1, assignedDevice: 1 } })
    .toArray();
}

export async function getAccessibleShipmentIds(user) {
  const docs = await getAccessibleShipmentDocs(user);
  return docs.map((d) => d.shipmentId);
}

export async function getAccessibleDeviceIds(user) {
  if (!user || !user.role) return [];

  if (user.role === Role.ADMIN) {
    const docs = await getCollection("devices")
      .find({}, { projection: { _id: 0, deviceId: 1 } })
      .toArray();
    return docs.map((d) => d.deviceId);
  }

  const shipmentDocs = await getAccessibleShipmentDocs(user);
  const assignedDeviceIds = shipmentDocs
    .map((s) => s.assignedDevice)
    .filter(Boolean);

  const ownedDeviceFilter = { ownerId: user.uid };
  const assignedDeviceFilter =
    assignedDeviceIds.length > 0
      ? { deviceId: { $in: assignedDeviceIds } }
      : { _id: null };

  const devices = await getCollection("devices")
    .find({ $or: [ownedDeviceFilter, assignedDeviceFilter] }, { projection: { _id: 0, deviceId: 1 } })
    .toArray();

  return devices.map((d) => d.deviceId);
}

export async function buildDeviceAccessFilter(user) {
  if (!user || !user.role) {
    return { _id: null };
  }

  if (user.role === Role.ADMIN) {
    return {};
  }

  const accessibleDeviceIds = await getAccessibleDeviceIds(user);
  if (accessibleDeviceIds.length === 0) {
    return { _id: null };
  }
  return { deviceId: { $in: accessibleDeviceIds } };
}

export async function canAccessDevice(user, device) {
  if (!user || !user.role) return false;
  if (user.role === Role.ADMIN) return true;

  const allowedIds = await getAccessibleDeviceIds(user);
  return allowedIds.includes(device.deviceId);
}
