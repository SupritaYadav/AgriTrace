import express from "express";
import { getCurrentUser, requireRole } from "../core/deps.js";
import { Role } from "../core/roles.js";
import { getShipmentForUser } from "../services/shipmentService.js";
import { createCheckpoint, getCheckpoint, retryCheckpoint, verifyShipmentCheckpoints } from "../services/checkpointService.js";
import { getBlockchainHealth } from "../services/blockchainService.js";
import { success, error } from "../utils/apiResponse.js";

const router = express.Router();
const authorized = [Role.FARMER, Role.TRANSPORTER, Role.WAREHOUSE, Role.RETAILER, Role.ADMIN];

router.post("/shipments/:shipmentId/integrity/checkpoint", getCurrentUser, requireRole(...authorized), async (req, res) => {
  try {
    const shipment = await getShipmentForUser(req.params.shipmentId, req.user.uid, req.user.role);
    if (!shipment) return error(res, 404, "Shipment not found");
    const checkpoint = await createCheckpoint(req.params.shipmentId, shipment.assignedDevice, req.user.uid, true);
    return checkpoint ? success(res, checkpoint, "Integrity checkpoint created") : error(res, 404, "No telemetry readings found");
  } catch (err) {
    console.error("Create integrity checkpoint error:", err);
    return error(res, err.code === "TELEMETRY_INTEGRITY_FAILED" ? 409 : 500, err.message);
  }
});

router.get("/shipments/:shipmentId/integrity/verify", getCurrentUser, requireRole(...authorized), async (req, res) => {
  try {
    const shipment = await getShipmentForUser(req.params.shipmentId, req.user.uid, req.user.role);
    if (!shipment) return error(res, 404, "Shipment not found");
    return success(res, await verifyShipmentCheckpoints(req.params.shipmentId), "Integrity verification completed");
  } catch (err) {
    console.error("Verify integrity error:", err);
    return error(res, 500, "Failed to verify integrity");
  }
});

router.get("/integrity/checkpoints/:checkpointId", getCurrentUser, requireRole(...authorized), async (req, res) => {
  try {
    const checkpoint = await getCheckpoint(req.params.checkpointId);
    if (!checkpoint) return error(res, 404, "Checkpoint not found");
    await getShipmentForUser(checkpoint.shipmentId, req.user.uid, req.user.role);
    return success(res, { checkpoint, blockchain: getBlockchainHealth() }, "Checkpoint retrieved");
  } catch (err) {
    return error(res, err.code === "SHIPMENT_ACCESS_DENIED" ? 403 : 500, err.message);
  }
});

router.post("/integrity/checkpoints/:checkpointId/retry", getCurrentUser, requireRole(Role.ADMIN), async (req, res) => {
  try {
    const checkpoint = await getCheckpoint(req.params.checkpointId);
    if (!checkpoint) return error(res, 404, "Checkpoint not found");
    return success(res, await retryCheckpoint(req.params.checkpointId), "Checkpoint retry completed");
  } catch (err) {
    console.error("Retry integrity checkpoint error:", err);
    return error(res, 500, "Failed to retry checkpoint");
  }
});

export default router;