import express from "express";
import { getCurrentUser, requireRole } from "../core/deps.js";
import { Role } from "../core/roles.js";
import { getShipmentForUser } from "../services/shipmentService.js";
import { getShipmentEnvironmentSummary } from "../services/environmentSummaryService.js";
import { success, error } from "../utils/apiResponse.js";

const router = express.Router();
const envSummaryRoles = [Role.FARMER, Role.TRANSPORTER, Role.WAREHOUSE, Role.RETAILER, Role.ADMIN];

router.get(
  "/:shipmentId/environment-summary",
  getCurrentUser,
  requireRole(...envSummaryRoles),
  async (req, res) => {
    try {
      const shipment = await getShipmentForUser(req.params.shipmentId, req.user.uid, req.user.role);
      if (!shipment) {
        return error(res, 404, "Shipment not found");
      }

      const summary = await getShipmentEnvironmentSummary(req.params.shipmentId);
      if (!summary) {
        return error(res, 404, "Shipment not found");
      }

      return success(res, summary, "Environmental summary retrieved successfully");
    } catch (err) {
      if (err.code === "SHIPMENT_ACCESS_DENIED") {
        return error(res, 403, err.message);
      }

      console.error("Environment summary error:", err);
      return error(res, 500, "Failed to retrieve environmental summary");
    }
  }
);

export default router;
