import express from "express";
import { getCurrentUser, requireRole } from "../core/deps.js";
import { Role } from "../core/roles.js";
import { getShipmentForUser } from "../services/shipmentService.js";
import {
  optimizeRoute,
  generateAlternatives,
  saveRoutePlan,
  getRoutePlanByShipment,
  updateRoutePlanSelectedMode,
  validateRouteInput,
} from "../services/routeService.js";
import { TimelineEventType } from "../core/timelineEvents.js";
import { addTimelineEvent } from "../services/timelineService.js";
import { success, error as errorRes } from "../utils/apiResponse.js";

const router = express.Router();

router.post("/optimize", getCurrentUser, requireRole(Role.TRANSPORTER, Role.ADMIN), async (req, res) => {
  try {
    const { startPoint, stops, denseAreas, optimizationMode, densityWeight, shipmentId } = req.body;

    try {
      validateRouteInput({ startPoint, stops, denseAreas, optimizationMode, densityWeight });
    } catch (err) {
      return errorRes(res, 400, err.message, "INVALID_COORDINATES");
    }

    if (shipmentId) {
      try {
        const shipment = await getShipmentForUser(shipmentId, req.user.uid, req.user.role);
        if (!shipment) {
          return errorRes(res, 404, "Shipment not found or access denied");
        }
      } catch (err) {
        return errorRes(res, 403, "Not authorized to access this shipment");
      }
    }

    const result = generateAlternatives(startPoint, stops, {
      denseAreas,
      densityWeight,
      optimizationMode,
    });

    let routePlan = null;
    if (shipmentId) {
      routePlan = await saveRoutePlan(shipmentId, req.user.uid, {
        startPoint,
        stops,
        selectedMode: result.recommendedMode,
        recommendedRoute: result.recommendedRoute,
        alternatives: result.alternatives,
      });

      await addTimelineEvent(shipmentId, TimelineEventType.ROUTE_OPTIMIZED, req.user.uid, {
        optimizationMode: result.recommendedMode,
        totalDistanceKm: result.recommendedRoute.totalDistanceKm,
        routePlanId: routePlan.routePlanId,
      });
    }

    return success(res, { ...result, routePlanId: routePlan?.routePlanId || null }, "Route optimized successfully");
  } catch (err) {
    console.error("Optimize route error:", err);
    return errorRes(res, 500, "Failed to optimize route");
  }
});

router.post("/:shipmentId/select", getCurrentUser, requireRole(Role.TRANSPORTER, Role.ADMIN), async (req, res) => {
  try {
    const { routePlanId, selectedOption } = req.body;

    if (!routePlanId) {
      return errorRes(res, 400, "routePlanId is required");
    }

    if (!selectedOption || !["SHORTEST", "BALANCED", "LOW_DENSITY"].includes(selectedOption)) {
      return errorRes(res, 400, "selectedOption must be SHORTEST, BALANCED, or LOW_DENSITY");
    }

    const shipment = await getShipmentForUser(req.params.shipmentId, req.user.uid, req.user.role);
    if (!shipment) {
      return errorRes(res, 404, "Shipment not found or access denied");
    }

    const updated = await updateRoutePlanSelectedMode(routePlanId, selectedOption);
    if (!updated) {
      return errorRes(res, 404, "Route plan not found");
    }

    await addTimelineEvent(req.params.shipmentId, TimelineEventType.ROUTE_SELECTED, req.user.uid, {
      selectedMode: selectedOption,
      routePlanId,
    });

    return success(res, updated, "Route selected and saved successfully");
  } catch (err) {
    console.error("Select route error:", err);
    return errorRes(res, 500, "Failed to select route");
  }
});

router.get("/shipment/:shipmentId", getCurrentUser, requireRole(Role.TRANSPORTER, Role.ADMIN), async (req, res) => {
  try {
    const shipment = await getShipmentForUser(req.params.shipmentId, req.user.uid, req.user.role);
    if (!shipment) {
      return errorRes(res, 404, "Shipment not found or access denied");
    }

    const routePlan = await getRoutePlanByShipment(req.params.shipmentId);
    if (!routePlan) {
      return errorRes(res, 404, "No route plan found for this shipment");
    }

    return success(res, routePlan, "Route plan retrieved successfully");
  } catch (err) {
    console.error("Get route plan error:", err);
    return errorRes(res, 500, "Failed to retrieve route plan");
  }
});

export default router;
