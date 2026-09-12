import express from "express";
import { getCurrentUser, requireRole } from "../core/deps.js";
import { Role } from "../core/roles.js";
import { getDashboardSummary } from "../services/dashboardService.js";
import { success, error } from "../utils/apiResponse.js";

const router = express.Router();
const dashboardRoles = [Role.FARMER, Role.TRANSPORTER, Role.WAREHOUSE, Role.RETAILER, Role.ADMIN];

router.get(
  "/summary",
  getCurrentUser,
  requireRole(...dashboardRoles),
  async (req, res) => {
    try {
      const dashboard = await getDashboardSummary(req.user.uid, req.user.role, req.user);
      return success(res, dashboard, "Dashboard summary retrieved successfully");
    } catch (err) {
      console.error("Dashboard summary error:", err);
      return error(res, 500, "Failed to retrieve dashboard summary");
    }
  }
);

export default router;