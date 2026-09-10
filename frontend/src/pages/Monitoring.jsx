import {
  useEffect,
  useState,
} from "react";

import {
  FaTemperatureHalf,
  FaDroplet,
  FaLeaf,
  FaBatteryThreeQuarters,
} from "react-icons/fa6";

import {
  shipments,
  devices,
} from "../data/mockData";

import SensorCard from "../components/common/SensorCard";

const HISTORY_LENGTH = 20;

function Monitoring() {
  const [shipmentId, setShipmentId] =
    useState("AGR-SHP-001");

  const [selectedDeviceId, setSelectedDeviceId] =
    useState("");

  const [intervalTime, setIntervalTime] =
    useState(5000);

  const shipment = shipments.find(
    (item) => item.id === shipmentId
  );

  // Fallback chain here matters: some mock records may use
  // `temp` instead of `temperature`, and a missing/undefined
  // starting value is what turns into NaN once the interval
  // effect starts doing arithmetic on it below.
  const [sensorData, setSensorData] =
    useState({
      temperature:
        shipment?.temperature ??
        shipment?.temp ??
        24,
      humidity:
        shipment?.humidity ?? 65,
      gas: shipment?.gas || "Safe",
      battery:
        shipment?.battery ?? 80,
    });

  const [history, setHistory] =
    useState({
      temperature: [],
      humidity: [],
      battery: [],
    });

  // Sync sensor data + device + history whenever the selected
  // shipment changes.
  useEffect(() => {
    if (!shipment) return;

    const temperature =
      shipment.temperature ??
      shipment.temp ??
      24;

    const humidity =
      shipment.humidity ?? 65;

    const battery =
      shipment.battery ?? 80;

    setSensorData({
      temperature,
      humidity,
      gas: shipment.gas || "Safe",
      battery,
    });

    setHistory({
      temperature: [temperature],
      humidity: [humidity],
      battery: [battery],
    });

    setSelectedDeviceId(
      shipment.device || ""
    );
  }, [shipment]);

  // Simulated live telemetry tick — updates both the current
  // reading and the rolling history used for the sparklines.
  useEffect(() => {
    const timer = setInterval(() => {
      setSensorData((previous) => {
        const next = {
          ...previous,

          temperature: Number(
            (
              previous.temperature +
              (Math.random() - 0.5) *
                0.8
            ).toFixed(1)
          ),

          humidity: Math.round(
            previous.humidity +
              (Math.random() - 0.5) * 2
          ),

          battery: Math.max(
            0,
            previous.battery -
              (Math.random() > 0.8
                ? 1
                : 0)
          ),
        };

        setHistory((prevHistory) => ({
          temperature: [
            ...prevHistory.temperature,
            next.temperature,
          ].slice(-HISTORY_LENGTH),

          humidity: [
            ...prevHistory.humidity,
            next.humidity,
          ].slice(-HISTORY_LENGTH),

          battery: [
            ...prevHistory.battery,
            next.battery,
          ].slice(-HISTORY_LENGTH),
        }));

        return next;
      });
    }, intervalTime);

    return () => clearInterval(timer);
  }, [intervalTime]);

  const unsafe =
    sensorData.temperature > 28 ||
    sensorData.humidity > 80 ||
    sensorData.gas !== "Safe";

  return (
    <div className="page-container">

      <section className="toolbar">

        <label>
          Select Shipment

          <select
            value={shipmentId}
            onChange={(e) =>
              setShipmentId(
                e.target.value
              )
            }
          >
            {shipments
              .filter(
                (shipment) =>
                  shipment.device
              )
              .map((shipment) => (
                <option
                  value={shipment.id}
                  key={shipment.id}
                >
                  {shipment.id} —{" "}
                  {shipment.product}
                </option>
              ))}
          </select>
        </label>

        <label>
          Select Device

          <select
            value={selectedDeviceId}
            onChange={(e) =>
              setSelectedDeviceId(
                e.target.value
              )
            }
          >
            <option value="">
              No device
            </option>

            {devices.map((device) => (
              <option
                value={device.id}
                key={device.id}
              >
                {device.id}
              </option>
            ))}
          </select>
        </label>

        <label>
          Refresh Interval

          <select
            value={intervalTime}
            onChange={(e) =>
              setIntervalTime(
                Number(
                  e.target.value
                )
              )
            }
          >
            <option value={3000}>
              3 seconds
            </option>

            <option value={5000}>
              5 seconds
            </option>

            <option value={10000}>
              10 seconds
            </option>
          </select>
        </label>

        <div className="live-pill">
          <span />
          LIVE
        </div>

      </section>

      <section className={`status-banner ${unsafe ? "warning" : "safe"}`}>
        {unsafe
          ? "Warning: One or more environmental parameters are outside the configured safety range."
          : "All environmental parameters are currently within safe limits."}
      </section>

      <section className="sensor-grid">

        <SensorCard
          icon={<FaTemperatureHalf />}
          title="Temperature"
          value={`${sensorData.temperature}°C`}
          subtitle="8°C – 28°C"
          status={
            sensorData.temperature > 28
              ? "warning"
              : "safe"
          }
          history={history.temperature}
        />

        <SensorCard
          icon={<FaDroplet />}
          title="Humidity"
          value={`${sensorData.humidity}%`}
          subtitle="40% – 80%"
          status={
            sensorData.humidity > 80
              ? "warning"
              : "safe"
          }
          history={history.humidity}
        />

        <SensorCard
          icon={<FaLeaf />}
          title="Gas Level"
          value={sensorData.gas}
          subtitle="Environmental safety"
          status={
            sensorData.gas === "Safe"
              ? "safe"
              : "warning"
          }
        />

        <SensorCard
          icon={<FaBatteryThreeQuarters />}
          title="Battery"
          value={`${sensorData.battery}%`}
          subtitle={
            selectedDeviceId ||
            "No device"
          }
          status={
            sensorData.battery < 25
              ? "warning"
              : "safe"
          }
          history={history.battery}
        />

      </section>

      <section className="card panel">

        <div className="panel-header">

          <div>
            <h3>
              Live Sensor Stream
            </h3>

            <p>
              Mock values currently simulate
              ESP32 telemetry.
            </p>
          </div>

        </div>

        <div className="mock-chart">

          {[65, 72, 58, 82, 75, 88, 69, 91, 78, 84].map(
            (height, index) => (
              <span
                key={index}
                style={{
                  height: `${height}%`,
                }}
              />
            )
          )}

        </div>

      </section>

    </div>
  );
}

export default Monitoring;