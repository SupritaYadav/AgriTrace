import { randomUUID } from "crypto";
import { getCollection } from "../core/mongo.js";

const R = 6371; // Earth radius in km
const MAX_STOPS = 50;
const OPTIMIZATION_MODES = ["SHORTEST", "BALANCED", "LOW_DENSITY"];

export function haversineDistance(lat1, lon1, lat2, lon2) {
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function validateCoordinate(point, name) {
  if (!point || typeof point !== "object") {
    throw new Error(`${name} is required and must be an object`);
  }
  const { latitude, longitude } = point;
  if (typeof latitude !== "number" || Number.isNaN(latitude) || latitude < -90 || latitude > 90) {
    throw new Error(`${name}.latitude must be between -90 and 90`);
  }
  if (typeof longitude !== "number" || Number.isNaN(longitude) || longitude < -180 || longitude > 180) {
    throw new Error(`${name}.longitude must be between -180 and 180`);
  }
}

function validateDenseArea(area) {
  validateCoordinate(area, "denseAreas item");
  if (area.radiusKm !== undefined) {
    if (typeof area.radiusKm !== "number" || Number.isNaN(area.radiusKm) || area.radiusKm < 0) {
      throw new Error("denseAreas.item.radiusKm must be a non-negative number");
    }
  }
  if (area.densityScore !== undefined) {
    if (typeof area.densityScore !== "number" || Number.isNaN(area.densityScore) ||
        area.densityScore < 1 || area.densityScore > 10) {
      throw new Error("denseAreas.item.densityScore must be between 1 and 10");
    }
  }
}

export function validateRouteInput(input) {
  const { startPoint, stops, denseAreas, optimizationMode, densityWeight } = input;

  validateCoordinate(startPoint, "startPoint");

  if (!Array.isArray(stops) || stops.length === 0) {
    throw new Error("stops must be a non-empty array");
  }

  if (stops.length > MAX_STOPS) {
    throw new Error(`stops count exceeds maximum of ${MAX_STOPS}`);
  }

  stops.forEach((stop, i) => validateCoordinate(stop, `stops[${i}]`));

  if (denseAreas !== undefined) {
    if (!Array.isArray(denseAreas)) {
      throw new Error("denseAreas must be an array");
    }
    denseAreas.forEach((area, i) => {
      try {
        validateDenseArea(area);
      } catch (err) {
        err.message = `denseAreas[${i}]: ${err.message}`;
        throw err;
      }
    });
  }

  if (optimizationMode !== undefined && !OPTIMIZATION_MODES.includes(optimizationMode)) {
    throw new Error(`optimizationMode must be one of: ${OPTIMIZATION_MODES.join(", ")}`);
  }

  if (densityWeight !== undefined) {
    if (typeof densityWeight !== "number" || Number.isNaN(densityWeight) || densityWeight < 0 || densityWeight > 1) {
      throw new Error("densityWeight must be between 0 and 1");
    }
  }
}

function getDensityPenalty(lat, lon, denseAreas, defaultWeight) {
  if (!denseAreas || denseAreas.length === 0) return 0;

  let penalty = 0;
  for (const area of denseAreas) {
    const dist = haversineDistance(lat, lon, area.latitude, area.longitude);
    const radius = area.radiusKm || 20;
    if (dist <= radius) {
      const score = area.densityScore || 5;
      const weight = defaultWeight * (score / 5);
      penalty += weight * (score / 10);
    }
  }
  return penalty;
}

function optimizeNearestNeighbor(startPoint, stops, options = {}) {
  const { denseAreas, densityWeight = 0.15 } = options;
  const unvisited = stops.map((s) => ({ ...s }));
  const route = [];
  let current = startPoint;
  let totalDistance = 0;
  let totalDensityPenalty = 0;

  while (unvisited.length > 0) {
    let nearestIdx = 0;
    let nearestCost = Infinity;

    unvisited.forEach((stop, idx) => {
      const dist = haversineDistance(current.latitude, current.longitude, stop.latitude, stop.longitude);
      const densityPenalty = getDensityPenalty(stop.latitude, stop.longitude, denseAreas, densityWeight);
      const cost = dist + densityPenalty;

      if (cost < nearestCost) {
        nearestCost = cost;
        nearestIdx = idx;
      }
    });

    const next = unvisited.splice(nearestIdx, 1)[0];
    const actualDist = haversineDistance(current.latitude, current.longitude, next.latitude, next.longitude);
    const actualPenalty = getDensityPenalty(next.latitude, next.longitude, denseAreas, densityWeight);

    route.push({
      ...next,
      distanceFromPrevious: Number(actualDist.toFixed(2)),
      densityPenalty: Number(actualPenalty.toFixed(4)),
    });

    totalDistance += actualDist;
    totalDensityPenalty += actualPenalty;
    current = next;
  }

  return {
    optimizedRoute: route,
    totalDistanceKm: Number(totalDistance.toFixed(2)),
    totalDensityPenalty: Number(totalDensityPenalty.toFixed(4)),
  };
}

function computeDenseStopCount(route, denseAreas) {
  if (!denseAreas || denseAreas.length === 0) return 0;

  let count = 0;
  for (const stop of route) {
    for (const area of denseAreas) {
      const dist = haversineDistance(stop.latitude, stop.longitude, area.latitude, area.longitude);
      const radius = area.radiusKm || 20;
      if (dist <= radius) {
        count++;
        break;
      }
    }
  }
  return count;
}

export function optimizeRoute(startPoint, stops, options = {}) {
  const { denseAreas, densityWeight, optimizationMode = "BALANCED" } = options;

  validateRouteInput({ startPoint, stops, denseAreas, optimizationMode, densityWeight });

  const validModes = OPTIMIZATION_MODES;
  const mode = validModes.includes(optimizationMode) ? optimizationMode : "BALANCED";

  const modeConfigs = {
    SHORTEST: { densityWeight: 0.02 },
    BALANCED: { densityWeight: densityWeight ?? 0.15 },
    LOW_DENSITY: { densityWeight: (densityWeight ?? 0.15) * 3 },
  };

  const config = modeConfigs[mode];
  const baseResult = optimizeNearestNeighbor(startPoint, stops, { denseAreas, densityWeight: config.densityWeight });
  const denseStopCount = computeDenseStopCount(stops, denseAreas);

  // routeScore: lower is better; distanceCost + densityPenalty
  const routeScore = Number((baseResult.totalDistanceKm * 0.5 + baseResult.totalDensityPenalty * 10).toFixed(4));

  return {
    ...baseResult,
    denseStopCount,
    densityScore: baseResult.totalDensityPenalty,
    routeScore,
    optimizationMode: mode,
  };
}

export function generateAlternatives(startPoint, stops, options = {}) {
  validateRouteInput({ startPoint, stops, denseAreas: options.denseAreas, densityWeight: options.densityWeight });

  const modes = OPTIMIZATION_MODES;

  const alternatives = {};
  const scores = [];

  for (const mode of modes) {
    const result = optimizeRoute(startPoint, stops, {
      ...options,
      optimizationMode: mode,
    });
    alternatives[mode.toLowerCase()] = result;
    scores.push({ mode, routeScore: result.routeScore, totalDistanceKm: result.totalDistanceKm, denseStopCount: result.denseStopCount });
  }

  const recommended = scores.reduce((best, current) =>
    current.routeScore < best.routeScore ? current : best
  );

  const recommendedRoute = alternatives[recommended.mode.toLowerCase()];

  const allDistances = scores.map((s) => s.totalDistanceKm);
  const allDensities = scores.map((s) => s.denseStopCount);
  const minDist = Math.min(...allDistances);
  const maxDist = Math.max(...allDistances);
  const minDense = Math.min(...allDensities);

  let explanation = "";
  if (recommended.mode === "SHORTEST") {
    explanation = `Recommended because it is the shortest at ${recommended.totalDistanceKm} km.`;
  } else if (recommended.mode === "LOW_DENSITY") {
    const extraDist = recommended.totalDistanceKm - alternatives["shortest"].totalDistanceKm;
    explanation = `Recommended because it avoids ${recommended.denseStopCount} dense-area stop(s) while adding only ${extraDist.toFixed(2)} km compared to the shortest route.`;
  } else {
    explanation = `Recommended because it balances distance (${recommended.totalDistanceKm} km) and density (${recommended.denseStopCount} dense stops).`;
  }

  return {
    recommendedRoute,
    alternatives,
    recommendedMode: recommended.mode,
    explanation,
  };
}

export async function saveRoutePlan(shipmentId, transporterId, routeData) {
  const routePlans = getCollection("routePlans");
  const now = new Date().toISOString();

  const routePlan = {
    routePlanId: randomUUID(),
    shipmentId,
    transporterId,
    startPoint: routeData.startPoint,
    stops: routeData.stops,
    selectedMode: routeData.selectedMode,
    recommendedRoute: routeData.recommendedRoute,
    alternatives: routeData.alternatives,
    createdAt: now,
    updatedAt: now,
  };

  await routePlans.insertOne(routePlan);
  return routePlan;
}

export async function getRoutePlanByShipment(shipmentId) {
  const doc = await getCollection("routePlans").findOne({ shipmentId });
  if (!doc) return null;
  const { _id, ...rest } = doc;
  return rest;
}

export async function updateRoutePlanSelectedMode(routePlanId, selectedOption) {
  const routePlans = getCollection("routePlans");
  const now = new Date().toISOString();

  const result = await routePlans.findOneAndUpdate(
    { routePlanId },
    { $set: { selectedMode: selectedOption, updatedAt: now } },
    { returnDocument: "after" }
  );

  if (!result) return null;
  const { _id, ...doc } = result;
  return doc;
}

export async function getHistoricalRoutePoints() {
  const telemetry = getCollection("telemetry");
  const pipeline = [
    { $match: { latitude: { $exists: true }, longitude: { $exists: true } } },
    { $group: {
      _id: {
        lat: { $round: ["$latitude", 4] },
        lon: { $round: ["$longitude", 4] },
      },
      count: { $sum: 1 },
      lastSeen: { $max: "$timestamp" },
    } },
    { $sort: { count: -1 } },
    { $limit: 100 },
  ];

  return telemetry.aggregate(pipeline).toArray();
}
