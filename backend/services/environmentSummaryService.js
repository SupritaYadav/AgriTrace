import { getCollection } from "../core/mongo.js";
import { getTelemetryCollection } from "../core/mongo.js";

function toNumberOrNull(value) {
  return Number.isFinite(value) ? Number(value) : null;
}

function getCondition(totalViolations) {
  if (totalViolations === 0) return "GOOD";
  if (totalViolations <= 5) return "WARNING";
  return "CRITICAL";
}

export async function getShipmentEnvironmentSummary(shipmentId) {
  const shipment = await getCollection("shipments").findOne({ shipmentId });
  if (!shipment) {
    return null;
  }

  const telemetryCollection = getTelemetryCollection();

  const summaryPipeline = [
    { $match: { shipmentId } },
    {
      $sort: { timestamp: 1 },
    },
    {
      $group: {
        _id: null,
        readings: { $sum: 1 },
        temperatureMin: { $min: "$temperature" },
        temperatureMax: { $max: "$temperature" },
        temperatureAverage: { $avg: "$temperature" },
        humidityMin: { $min: "$humidity" },
        humidityMax: { $max: "$humidity" },
        humidityAverage: { $avg: "$humidity" },
        gasMin: { $min: "$gasLevel" },
        gasMax: { $max: "$gasLevel" },
        gasAverage: { $avg: "$gasLevel" },
        batteryMin: { $min: "$battery" },
        batteryMax: { $max: "$battery" },
        batteryAverage: { $avg: "$battery" },
        firstReadingAt: { $first: "$timestamp" },
        lastReadingAt: { $last: "$timestamp" },
      },
    },
  ];

  const baseSummary = await telemetryCollection.aggregate(summaryPipeline).next();

  const thresholds = shipment?.thresholds || {};
  const tempMin = Number.isFinite(thresholds?.temperature?.min) ? thresholds.temperature.min : null;
  const tempMax = Number.isFinite(thresholds?.temperature?.max) ? thresholds.temperature.max : null;
  const humidityMin = Number.isFinite(thresholds?.humidity?.min) ? thresholds.humidity.min : null;
  const humidityMax = Number.isFinite(thresholds?.humidity?.max) ? thresholds.humidity.max : null;
  const gasMax = Number.isFinite(thresholds?.gasLevel?.max) ? thresholds.gasLevel.max : null;

  const violationPipeline = [
    { $match: { shipmentId } },
    {
      $group: {
        _id: null,
        temperatureViolations: {
          $sum: {
            $cond: [
              {
                $or: [
                  { $and: [{ $ne: [tempMin, null] }, { $lt: ["$temperature", tempMin] }] },
                  { $and: [{ $ne: [tempMax, null] }, { $gt: ["$temperature", tempMax] }] },
                ],
              },
              1,
              0,
            ],
          },
        },
        humidityViolations: {
          $sum: {
            $cond: [
              {
                $or: [
                  { $and: [{ $ne: [humidityMin, null] }, { $lt: ["$humidity", humidityMin] }] },
                  { $and: [{ $ne: [humidityMax, null] }, { $gt: ["$humidity", humidityMax] }] },
                ],
              },
              1,
              0,
            ],
          },
        },
        gasViolations: {
          $sum: {
            $cond: [
              {
                $and: [{ $ne: [gasMax, null] }, { $gt: ["$gasLevel", gasMax] }],
              },
              1,
              0,
            ],
          },
        },
      },
    },
  ];

  const violationsSummary = (await telemetryCollection.aggregate(violationPipeline).next()) || {
    temperatureViolations: 0,
    humidityViolations: 0,
    gasViolations: 0,
  };

  const readings = baseSummary?.readings || 0;
  const temperature = {
    min: toNumberOrNull(baseSummary?.temperatureMin),
    max: toNumberOrNull(baseSummary?.temperatureMax),
    average: toNumberOrNull(baseSummary?.temperatureAverage),
  };

  const humidity = {
    min: toNumberOrNull(baseSummary?.humidityMin),
    max: toNumberOrNull(baseSummary?.humidityMax),
    average: toNumberOrNull(baseSummary?.humidityAverage),
  };

  const gasLevel = {
    min: toNumberOrNull(baseSummary?.gasMin),
    max: toNumberOrNull(baseSummary?.gasMax),
    average: toNumberOrNull(baseSummary?.gasAverage),
  };

  const battery = {
    min: toNumberOrNull(baseSummary?.batteryMin),
    max: toNumberOrNull(baseSummary?.batteryMax),
    average: toNumberOrNull(baseSummary?.batteryAverage),
    latest: null,
  };

  const latestBattery = await telemetryCollection.findOne(
    { shipmentId },
    { sort: { timestamp: -1 }, projection: { battery: 1 } }
  );

  if (latestBattery && Number.isFinite(latestBattery.battery)) {
    battery.latest = Number(latestBattery.battery);
  }

  const tempViolations = Number(violationsSummary.temperatureViolations || 0);
  const humidityViolations = Number(violationsSummary.humidityViolations || 0);
  const gasViolations = Number(violationsSummary.gasViolations || 0);
  const totalViolations = tempViolations + humidityViolations + gasViolations;

  return {
    shipmentId,
    readings,
    temperature,
    humidity,
    gasLevel,
    battery,
    firstReadingAt: baseSummary?.firstReadingAt || null,
    lastReadingAt: baseSummary?.lastReadingAt || null,
    violations: {
      temperature: tempViolations,
      humidity: humidityViolations,
      gas: gasViolations,
      total: totalViolations,
    },
    condition: getCondition(totalViolations),
  };
}