import mqtt from "mqtt";
import { config } from "./core/config.js";

const client = mqtt.connect(config.mqttBrokerUrl);
const DEVICE_ID = "DEV001";
const SHIPMENT_ID = "c9d67426-21e0-4e71-a9b1-72f7808cc6f9";

const scenarios = {
  normal: () => ({ temperature: 25, humidity: 55, gasLevel: 10, battery: 80 }),
  highTemp: () => ({ temperature: 42, humidity: 55, gasLevel: 10, battery: 80 }),
  abnormalHumidity: () => ({ temperature: 25, humidity: 95, gasLevel: 10, battery: 80 }),
  gasAlert: () => ({ temperature: 25, humidity: 55, gasLevel: 75, battery: 80 }),
  lowBattery: () => ({ temperature: 25, humidity: 55, gasLevel: 10, battery: 8 }),
};

function publishReading(scenarioName) {
  const values = scenarios[scenarioName]();
  const reading = {
    deviceId: DEVICE_ID,
    shipmentId: SHIPMENT_ID,
    timestamp: new Date().toISOString(),
    latitude: 25.3176,
    longitude: 82.9739,
    ...values,
  };
  client.publish(`agr/devices/${DEVICE_ID}/telemetry`, JSON.stringify(reading));
  console.log(`Published [${scenarioName}]:`, reading);
}

client.on("connect", () => {
  console.log("Simulator connected to MQTT broker");

  const scenarioNames = Object.keys(scenarios);
  let i = 0;

  setInterval(() => {
    const scenario = scenarioNames[i % scenarioNames.length];
    publishReading(scenario);
    i++;
  }, 5000);
});