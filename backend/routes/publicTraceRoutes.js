import express from "express";
import { getPublicTraceByTrackingId } from "../services/publicTraceService.js";
import { success, error } from "../utils/apiResponse.js";

const router = express.Router();

router.get("/trace/:trackingId", async (req, res) => {
  try {
    const trace = await getPublicTraceByTrackingId(req.params.trackingId);
    if (!trace) {
      return error(res, 404, "Shipment not found");
    }

    return success(res, trace, "Public shipment trace retrieved successfully");
  } catch (err) {
    console.error("Public trace error:", err);
    return error(res, 500, "Failed to retrieve public shipment trace");
  }
});

export default router;
