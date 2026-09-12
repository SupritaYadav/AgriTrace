// routes/alertRoutes.js
import express from "express";
import { getCurrentUser, requireRole } from "../core/deps.js";
import { Role } from "../core/roles.js";
import { listAlertsForUser, getAlertByIdForUser, acknowledgeAlert, resolveAlert } from "../services/alertService.js";
import { success, error } from "../utils/apiResponse.js";

const router = express.Router();
const alertReadRoles = [Role.ADMIN, Role.FARMER, Role.TRANSPORTER, Role.WAREHOUSE, Role.RETAILER];

// List alerts with filters & pagination
router.get("/", getCurrentUser, requireRole(...alertReadRoles), async (req, res) => {
  try {
    const { status, severity, shipmentId, deviceId, page, limit } = req.query;
    const result = await listAlertsForUser(req.user, { status, severity, shipmentId, deviceId, page: Number(page), limit: Number(limit) });
    return success(res, result);
  } catch (e) {
    console.error("Alert list error:", e);
    return error(res, 500, "Failed to list alerts");
  }
});

// Get single alert
router.get("/:alertId", getCurrentUser, requireRole(...alertReadRoles), async (req, res) => {
  try {
    const alert = await getAlertByIdForUser(req.params.alertId, req.user);
    if (!alert) return error(res, 404, "Alert not found");
    return success(res, alert);
  } catch (e) {
    console.error("Get alert error:", e);
    return error(res, 500, "Failed to retrieve alert");
  }
});

// Acknowledge alert
router.patch("/:alertId/acknowledge", getCurrentUser, requireRole(Role.ADMIN), async (req, res) => {
  try {
    const updated = await acknowledgeAlert(req.params.alertId, req.user.uid);
    return success(res, updated, "Alert acknowledged");
  } catch (e) {
    console.error("Acknowledge alert error:", e);
    const status = e.code === "not-found" ? 404 : 500;
    return error(res, status, "Failed to acknowledge alert");
  }
});

// Resolve alert
router.patch("/:alertId/resolve", getCurrentUser, requireRole(Role.ADMIN), async (req, res) => {
  try {
    const updated = await resolveAlert(req.params.alertId, req.user.uid);
    return success(res, updated, "Alert resolved");
  } catch (e) {
    console.error("Resolve alert error:", e);
    const status = e.code === "not-found" ? 404 : 500;
    return error(res, status, "Failed to resolve alert");
  }
});

export default router;
