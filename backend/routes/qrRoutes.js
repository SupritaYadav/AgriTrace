import express from "express";
import { getCurrentUser, requireRole } from "../core/deps.js";
import { Role } from "../core/roles.js";
import { generateShipmentQr, generateShipmentQrPng } from "../services/qrService.js";
import { success, error } from "../utils/apiResponse.js";

const router = express.Router();
const qrRoles = [Role.FARMER, Role.TRANSPORTER, Role.WAREHOUSE, Role.RETAILER, Role.ADMIN];

router.get(
  "/:shipmentId/qr",
  getCurrentUser,
  requireRole(...qrRoles),
  async (req, res) => {
    try {
      const { format } = req.query;

      const result = await generateShipmentQr(req.params.shipmentId, req.user.uid, req.user.role);
      if (!result) {
        return error(res, 404, "Shipment not found");
      }

      if (format === "png") {
        const pngResult = await generateShipmentQrPng(req.params.shipmentId, req.user.uid, req.user.role);
        if (!pngResult) {
          return error(res, 404, "Shipment not found");
        }

        res.setHeader("Content-Type", "image/png");
        return res.send(pngResult.png);
      }

      return success(res, result, "QR generated successfully");
    } catch (err) {
      console.error("QR generation error:", err);
      return error(res, 500, "Failed to generate QR code");
    }
  }
);

export default router;
