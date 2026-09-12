import express from "express";
import { getCurrentUser, requireRole } from "../core/deps.js";
import { addTimelineEvent, getTimeline } from "../services/timelineService.js";
import { getShipmentForUser } from "../services/shipmentService.js";
import { Role } from "../core/roles.js";

const router = express.Router();
const timelineRoles = [Role.FARMER, Role.TRANSPORTER, Role.WAREHOUSE, Role.RETAILER, Role.ADMIN];

router.post(
  "/:shipmentId/timeline",
  getCurrentUser,
  requireRole(...timelineRoles),
  async (req, res) => {
    try {
      const shipment = await getShipmentForUser(
        req.params.shipmentId,
        req.user.uid,
        req.user.role
      );

      if (!shipment) {
        return res.status(404).json({ detail: "Shipment not found" });
      }

      const { type, metadata } = req.body;
      const event = await addTimelineEvent(
        req.params.shipmentId,
        type,
        req.user.uid,
        metadata
      );

      return res.status(201).json(event);
    } catch (error) {
      if (error.code === "SHIPMENT_ACCESS_DENIED") {
        return res.status(403).json({
          detail: "You are not authorized to access this shipment",
        });
      }

      console.error("Create timeline event error:", error);
      return res.status(500).json({ detail: "Failed to create timeline event" });
    }
  }
);

router.get(
  "/:shipmentId/timeline",
  getCurrentUser,
  requireRole(...timelineRoles),
  async (req, res) => {
    try {
      const shipment = await getShipmentForUser(
        req.params.shipmentId,
        req.user.uid,
        req.user.role
      );

      if (!shipment) {
        return res.status(404).json({ detail: "Shipment not found" });
      }

      const timeline = await getTimeline(req.params.shipmentId);
      return res.json(timeline);
    } catch (error) {
      if (error.code === "SHIPMENT_ACCESS_DENIED") {
        return res.status(403).json({
          detail: "You are not authorized to access this shipment",
        });
      }

      console.error("Get timeline error:", error);
      return res.status(500).json({ detail: "Failed to get timeline" });
    }
  }
);

export default router;