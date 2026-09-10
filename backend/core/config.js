import dotenv from "dotenv";

dotenv.config();

function requireEnv(name) {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

const port = Number(process.env.PORT || 8000);
if (!Number.isInteger(port) || port < 1 || port > 65535) {
  throw new Error("PORT must be a valid TCP port number");
}

export const config = Object.freeze({
  port,
  mongoUri: requireEnv("MONGO_URI"),
  mongoDbName: requireEnv("MONGO_DB_NAME"),
  mqttBrokerUrl: requireEnv("MQTT_BROKER_URL"),
  mqttTopic: requireEnv("MQTT_TOPIC"),
  frontendUrl: process.env.FRONTEND_URL?.trim() || "http://localhost:5173",
});
