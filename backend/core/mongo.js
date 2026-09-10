  import { MongoClient } from "mongodb";
  import { config } from "./config.js";

  const client = new MongoClient(config.mongoUri);

   let telemetryCollection;

   export async function connectMongo() {
     await client.connect();
    const db = client.db(config.mongoDbName);
     telemetryCollection = db.collection("telemetry");

     await telemetryCollection.createIndex({ deviceId: 1 });
     await telemetryCollection.createIndex({ shipmentId: 1 });
     await telemetryCollection.createIndex({ timestamp: 1 });
     await telemetryCollection.createIndex({ shipmentId: 1, deviceId: 1, checkpointed: 1, timestamp: 1 });
     await telemetryCollection.createIndex({ deviceId: 1, timestamp: -1 });
     await telemetryCollection.createIndex({ shipmentId: 1, timestamp: -1 });
     await telemetryCollection.createIndex({ shipmentId: 1, deviceId: 1, checkpointId: 1 });

     console.log("MongoDB connected and indexes created");
   }

   export function getTelemetryCollection() {
     return telemetryCollection;
   }