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
    min: readings > 0 ? toNumberOrNull(baseSummary?.temperatureMin) : null,
    max: readings > 0 ? toNumberOrNull(baseSummary?.temperatureMax) : null,
    average: readings > 0 ? toNumberOrNull(baseSummary?.temperatureAverage) : null,
  };

  const humidity = {
    min: readings > 0 ? toNumberOrNull(baseSummary?.humidityMin) : null,
    max: readings > 0 ? toNumberOrNull(baseSummary?.humidityMax) : null,
    average: readings > 0 ? toNumberOrNull(baseSummary?.humidityAverage) : null,
  };

  const gasLevel = {
    min: readings > 0 ? toNumberOrNull(baseSummary?.gasMin) : null,
    max: readings > 0 ? toNumberOrNull(baseSummary?.gasMax) : null,
    average: readings > 0 ? toNumberOrNull(baseSummary?.gasAverage) : null,
  };

  const battery = {
    min: readings > 0 ? toNumberOrNull(baseSummary?.batteryMin) : null,
    max: readings > 0 ? toNumberOrNull(baseSummary?.batteryMax) : null,
    average: readings > 0 ? toNumberOrNull(baseSummary?.batteryAverage) : null,
    latest: null,
  };

  if (readings > 0) {
    const latestBattery = await telemetryCollection.findOne(
      { shipmentId },
      { sort: { timestamp: -1 }, projection: { battery: 1 } }
    );

    if (latestBattery && Number.isFinite(latestBattery.battery)) {
      battery.latest = Number(latestBattery.battery);
    }
  }

  const tempViolations = readings > 0 ? Number(violationsSummary.temperatureViolations || 0) : 0;
  const humidityViolations = readings > 0 ? Number(violationsSummary.humidityViolations || 0) : 0;
  const gasViolations = readings > 0 ? Number(violationsSummary.gasViolations || 0) : 0;
  const totalViolations = tempViolations + humidityViolations + gasViolations;

  return {
    shipmentId,
    readings,
    readingCount: readings,
    temperature,
    humidity,
    gasLevel,
    battery,
    firstReadingAt: readings > 0 ? (baseSummary?.firstReadingAt || null) : null,
    lastReadingAt: readings > 0 ? (baseSummary?.lastReadingAt || null) : null,
    violations: {
      temperature: tempViolations,
      humidity: humidityViolations,
      gas: gasViolations,
      total: totalViolations,
    },
    condition: readings === 0 ? "NO_DATA" : getCondition(totalViolations),
  };
}