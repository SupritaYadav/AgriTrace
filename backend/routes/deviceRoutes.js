import express from "express";
import { getCurrentUser, requireRole } from "../core/deps.js";
import { Role } from "../core/roles.js";
import { registerDevice, listDevices, assignDevice, getDevice, getDeviceHealth } from "../services/deviceService.js";
import { success, error } from "../utils/apiResponse.js";

const router = express.Router();

router.post("/", getCurrentUser, requireRole(Role.ADMIN), async (req, res) => {
  try {
    const device = await registerDevice(req.body);
    return success(res, device, "Device registered successfully");
  } catch (err) {
    console.error("Register device error:", err);
    return error(res, 500, "Failed to register device");
  }
});

router.get("/", getCurrentUser, requireRole(Role.FARMER, Role.TRANSPORTER, Role.WAREHOUSE, Role.ADMIN), async (req, res) => {
  const devices = await listDevices();
  return success(res, devices, "Devices retrieved successfully");
});

router.get(
  "/:deviceId",
  getCurrentUser,
  requireRole(Role.FARMER, Role.TRANSPORTER, Role.WAREHOUSE, Role.ADMIN),
  async (req, res) => {
    try {
      const device = await getDevice(req.params.deviceId);
      if (!device) {
        return error(res, 404, "Device not found");
      }

      return success(res, device, "Device retrieved successfully");
    } catch (err) {
      console.error("Get device error:", err);
      return error(res, 500, "Failed to retrieve device");
    }
  }
);

router.get(
  "/:deviceId/health",
  getCurrentUser,
  requireRole(Role.FARMER, Role.TRANSPORTER, Role.WAREHOUSE, Role.ADMIN),
  async (req, res) => {
    try {
      const health = await getDeviceHealth(req.params.deviceId);
      if (!health) {
        return error(res, 404, "Device not found");
      }

      return success(res, health, "Device health retrieved successfully");
    } catch (err) {
      console.error("Get device health error:", err);
      return error(res, 500, "Failed to retrieve device health");
    }
  }
);

router.post(
  "/:deviceId/assign",
  getCurrentUser,
  requireRole(Role.FARMER, Role.ADMIN),
  async (req, res) => {
    const { deviceId } = req.params;
    const { shipmentId } = req.body;

    if (!/^[A-Za-z0-9][A-Za-z0-9_-]{0,127}$/.test(deviceId) || typeof shipmentId !== "string" || !/^[A-Za-z0-9][A-Za-z0-9_-]{0,127}$/.test(shipmentId)) {
      return error(res, 400, "Invalid device or shipment ID");
    }

    try {
      const result = await assignDevice(deviceId, shipmentId, req.user.uid);
      return success(res, result, "Device assigned successfully");
    } catch (errorObj) {
      const statusByCode = {
        DEVICE_NOT_FOUND: 404,
        SHIPMENT_NOT_FOUND: 404,
        DEVICE_ALREADY_ASSIGNED: 409,
        SHIPMENT_ALREADY_HAS_DEVICE: 409,
      };
      const status = statusByCode[errorObj.code] || 500;

      if (status === 500) {
        console.error("Device assignment error:", errorObj);
      }

      return error(res, status, errorObj.message || "Failed to assign device");
    }
  }
);

export default router;