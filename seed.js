import { db } from "./backend/core/firebase.js";
import {
  SHIPMENT_STATUS,
} from "./backend/utils/constants.js";
import { TimelineEventType } from "./backend/core/timelineEvents.js";
import { randomUUID } from "crypto";

const NOW = new Date().toISOString();
const PAST = (d) => new Date(Date.now() - d * 86400000).toISOString();

async function docExists(col, id) {
  const snap = await db.collection(col).doc(id).get();
  return snap.exists;
}

async function seedUsers() {
  const users = [
    {
      uid: "seeds-farmer-001",
      email: "farmer@agritrace.demo",
      role: "FARMER",
      name: "Kritika Gupta",
      phone: "+91 98765 43210",
      organisation: "AgriTrace Demo Network",
      orgType: "Multi-stakeholder Supply Chain",
      state: "Uttar Pradesh",
      district: "Lucknow",
      createdAt: PAST(30),
      updatedAt: NOW,
    },
    {
      uid: "seeds-transporter-001",
      email: "transporter@agritrace.demo",
      role: "TRANSPORTER",
      name: "Rajesh Kumar",
      phone: "+91 98765 43211",
      organisation: "QuickTrans Logistics",
      orgType: "Transport",
      state: "Uttar Pradesh",
      district: "Noida",
      createdAt: PAST(28),
      updatedAt: NOW,
    },
    {
      uid: "seeds-warehouse-001",
      email: "warehouse@agritrace.demo",
      role: "WAREHOUSE",
      name: "Sunita Devi",
      phone: "+91 98765 43212",
      organisation: "ColdStore Agri Hub",
      orgType: "Warehousing",
      state: "Rajasthan",
      district: "Jaipur",
      createdAt: PAST(25),
      updatedAt: NOW,
    },
    {
      uid: "seeds-admin-001",
      email: "admin@agritrace.demo",
      role: "ADMIN",
      name: "Admin User",
      phone: "+91 98765 43213",
      organisation: "AgriTrace Platform",
      orgType: "Platform",
      state: "Delhi",
      district: "New Delhi",
      createdAt: PAST(365),
      updatedAt: NOW,
    },
  ];

  for (const u of users) {
    if (!(await docExists("users", u.uid))) {
      await db.collection("users").doc(u.uid).set(u);
      console.log(`  User: ${u.email} (${u.role})`);
    } else {
      console.log(`  User skipped (exists): ${u.email}`);
    }
  }
}

async function seedDevices() {
  const devices = [
    {
      deviceId: "DEV-001",
      serialNumber: "SN-DEV-001",
      status: "ONLINE",
      battery: 87,
      firmwareVersion: "2.1.4",
      currentShipmentId: "seed-ship-001",
      location: "Lucknow, UP",
      type: "Sensor",
      lastSeenAt: NOW,
      createdAt: NOW,
    },
    {
      deviceId: "DEV-002",
      serialNumber: "SN-DEV-002",
      status: "ONLINE",
      battery: 64,
      firmwareVersion: "2.1.3",
      currentShipmentId: "seed-ship-002",
      location: "Noida, UP",
      type: "Sensor",
      lastSeenAt: NOW,
      createdAt: NOW,
    },
    {
      deviceId: "DEV-003",
      serialNumber: "SN-DEV-003",
      status: "OFFLINE",
      battery: 12,
      firmwareVersion: "2.0.1",
      currentShipmentId: "seed-ship-003",
      location: "Jaipur, RJ",
      type: "Gateway",
      lastSeenAt: PAST(2),
      createdAt: PAST(10),
    },
    {
      deviceId: "DEV-004",
      serialNumber: "SN-DEV-004",
      status: "ONLINE",
      battery: 92,
      firmwareVersion: "2.1.4",
      currentShipmentId: null,
      location: "Delhi, DL",
      type: "Tracker",
      lastSeenAt: NOW,
      createdAt: NOW,
    },
    {
      deviceId: "DEV-005",
      serialNumber: "SN-DEV-005",
      status: "ONLINE",
      battery: 45,
      firmwareVersion: "2.1.2",
      currentShipmentId: "seed-ship-005",
      location: "Mumbai, MH",
      type: "Sensor",
      lastSeenAt: NOW,
      createdAt: PAST(15),
    },
  ];

  for (const d of devices) {
    if (!(await docExists("devices", d.deviceId))) {
      await db.collection("devices").doc(d.deviceId).set(d);
      console.log(`  Device: ${d.deviceId}`);
    } else {
      console.log(`  Device skipped (exists): ${d.deviceId}`);
    }
  }
}

async function seedShipments() {
  const shipments = [
    {
      shipmentId: "seed-ship-001",
      trackingId: "AGT-2026-00001",
      product: "Fresh Tomatoes",
      category: "Vegetables",
      batchId: "BATCH-001",
      quantity: 500,
      unit: "kg",
      grade: "Grade A",
      source: "Lucknow",
      sourceDistrict: "Lucknow",
      sourceState: "Uttar Pradesh",
      destination: "Delhi",
      destinationState: "Delhi",
      pickupLocation: "Farm A, Lucknow",
      receiverOrganization: "Delhi Retailers Assoc.",
      receiverName: "Vikash Singh",
      contactPerson: "Vikash Singh",
      phone: "+91 98765 43220",
      departureDate: PAST(2),
      departureTime: "08:00",
      deliveryDate: PAST(1),
      transportType: "Refrigerated Truck",
      vehicleNumber: "UP14-AB-1234",
      driverName: "Mohammad Ali",
      status: SHIPMENT_STATUS.IN_TRANSIT,
      assignedDevice: "DEV-001",
      farmerId: "seeds-farmer-001",
      createdBy: "seeds-farmer-001",
      transporterId: "seeds-transporter-001",
      thresholds: {
        temperature: { min: 8, max: 28 },
        humidity: { min: 40, max: 80 },
        gasLevel: { max: 50 },
      },
      temperature: 22.5,
      humidity: 65,
      gas: "Safe",
      battery: 87,
      device: "DEV-001",
      progress: 65,
      stage: 3,
      createdAt: PAST(5),
      updatedAt: PAST(1),
    },
    {
      shipmentId: "seed-ship-002",
      trackingId: "AGT-2026-00002",
      product: "Organic Bananas",
      category: "Fruits",
      batchId: "BATCH-002",
      quantity: 300,
      unit: "kg",
      grade: "Grade A",
      source: "Noida",
      sourceDistrict: "Noida",
      sourceState: "Uttar Pradesh",
      destination: "Mumbai",
      destinationState: "Maharashtra",
      pickupLocation: "Farm B, Noida",
      receiverOrganization: "Mumbai Grocers",
      receiverName: "Priya Sharma",
      contactPerson: "Priya Sharma",
      phone: "+91 98765 43221",
      departureDate: PAST(3),
      departureTime: "06:00",
      deliveryDate: PAST(0),
      transportType: "Refrigerated Truck",
      vehicleNumber: "UP14-CD-5678",
      driverName: "Rajesh Verma",
      status: SHIPMENT_STATUS.AT_WAREHOUSE,
      assignedDevice: "DEV-002",
      farmerId: "seeds-farmer-001",
      createdBy: "seeds-farmer-001",
      transporterId: "seeds-transporter-001",
      thresholds: {
        temperature: { min: 10, max: 25 },
        humidity: { min: 45, max: 85 },
        gasLevel: { max: 50 },
      },
      temperature: 18.2,
      humidity: 72,
      gas: "Safe",
      battery: 64,
      device: "DEV-002",
      progress: 85,
      stage: 4,
      createdAt: PAST(7),
      updatedAt: PAST(1),
    },
    {
      shipmentId: "seed-ship-003",
      trackingId: "AGT-2026-00003",
      product: "Basmati Rice",
      category: "Grains",
      batchId: "BATCH-003",
      quantity: 1000,
      unit: "kg",
      grade: "Grade B",
      source: "Jaipur",
      sourceDistrict: "Jaipur",
      sourceState: "Rajasthan",
      destination: "Delhi",
      destinationState: "Delhi",
      pickupLocation: "Warehouse A, Jaipur",
      receiverOrganization: "Delhi Distributors",
      receiverName: "Amit Patel",
      contactPerson: "Amit Patel",
      phone: "+91 98765 43222",
      departureDate: PAST(4),
      departureTime: "10:00",
      deliveryDate: PAST(2),
      transportType: "Open Truck",
      vehicleNumber: "RJ14-EF-9012",
      driverName: "Suresh Yadav",
      status: SHIPMENT_STATUS.DELIVERED,
      assignedDevice: "DEV-003",
      farmerId: "seeds-farmer-001",
      createdBy: "seeds-farmer-001",
      transporterId: "seeds-transporter-001",
      thresholds: {
        temperature: { min: 5, max: 30 },
        humidity: { min: 30, max: 70 },
        gasLevel: { max: 50 },
      },
      temperature: 25.1,
      humidity: 55,
      gas: "Safe",
      battery: 12,
      device: "DEV-003",
      progress: 100,
      stage: 5,
      createdAt: PAST(10),
      updatedAt: PAST(2),
    },
    {
      shipmentId: "seed-ship-004",
      trackingId: "AGT-2026-00004",
      product: "Dairy Milk",
      category: "Dairy",
      batchId: "BATCH-004",
      quantity: 200,
      unit: "litres",
      grade: "Grade A",
      source: "Meerut",
      sourceDistrict: "Meerut",
      sourceState: "Uttar Pradesh",
      destination: "Noida",
      destinationState: "Uttar Pradesh",
      pickupLocation: "Dairy Farm, Meerut",
      receiverOrganization: "Noida Supermarket",
      receiverName: "Neha Gupta",
      contactPerson: "Neha Gupta",
      phone: "+91 98765 43223",
      departureDate: PAST(1),
      departureTime: "05:00",
      deliveryDate: PAST(0),
      transportType: "Van",
      vehicleNumber: "UP14-GH-3456",
      driverName: "Ajay Kumar",
      status: SHIPMENT_STATUS.IN_TRANSIT,
      assignedDevice: "DEV-004",
      farmerId: "seeds-farmer-001",
      createdBy: "seeds-farmer-001",
      transporterId: "seeds-transporter-001",
      thresholds: {
        temperature: { min: 2, max: 8 },
        humidity: { min: 30, max: 60 },
        gasLevel: { max: 50 },
      },
      temperature: 6.5,
      humidity: 42,
      gas: "Safe",
      battery: 92,
      device: "DEV-004",
      progress: 50,
      stage: 3,
      createdAt: PAST(3),
      updatedAt: PAST(0),
    },
    {
      shipmentId: "seed-ship-005",
      trackingId: "AGT-2026-00005",
      product: "Mixed Spices",
      category: "Spices",
      batchId: "BATCH-005",
      quantity: 150,
      unit: "kg",
      grade: "Grade C",
      source: "Gwalior",
      sourceDistrict: "Gwalior",
      sourceState: "Madhya Pradesh",
      destination: "Pune",
      destinationState: "Maharashtra",
      pickupLocation: "Spice Market, Gwalior",
      receiverOrganization: "Pune Food Corp.",
      receiverName: "Deepak Joshi",
      contactPerson: "Deepak Joshi",
      phone: "+91 98765 43224",
      departureDate: PAST(6),
      departureTime: "12:00",
      deliveryDate: PAST(3),
      transportType: "Refrigerated Truck",
      vehicleNumber: "MP14-IJ-7890",
      driverName: "Sanjay Rathore",
      status: SHIPMENT_STATUS.DELIVERED,
      assignedDevice: "DEV-005",
      farmerId: "seeds-farmer-001",
      createdBy: "seeds-farmer-001",
      transporterId: "seeds-transporter-001",
      thresholds: {
        temperature: { min: 10, max: 25 },
        humidity: { min: 35, max: 75 },
        gasLevel: { max: 50 },
      },
      temperature: 20.8,
      humidity: 58,
      gas: "Safe",
      battery: 45,
      device: "DEV-005",
      progress: 100,
      stage: 5,
      createdAt: PAST(12),
      updatedAt: PAST(3),
    },
  ];

  for (const s of shipments) {
    if (!(await docExists("shipments", s.shipmentId))) {
      await db.collection("shipments").doc(s.shipmentId).set(s);
      console.log(`  Shipment: ${s.trackingId} (${s.status})`);
    } else {
      console.log(`  Shipment skipped (exists): ${s.trackingId}`);
    }
  }
}

async function seedAlerts() {
  const alerts = [
    {
      alertId: "DEV-001_HIGH_TEMP_1",
      deviceId: "DEV-001",
      shipmentId: "seed-ship-001",
      type: "HIGH_TEMP",
      severity: "CRITICAL",
      value: 31.5,
      actualValue: 31.5,
      threshold: { operator: ">", limit: 28, field: "temperature" },
      status: "OPEN",
      acknowledgedAt: null,
      resolvedAt: null,
      timestamp: PAST(6),
      createdAt: PAST(6),
    },
    {
      alertId: "DEV-003_LOW_BATTERY_1",
      deviceId: "DEV-003",
      shipmentId: "seed-ship-003",
      type: "LOW_BATTERY",
      severity: "WARNING",
      value: 12,
      actualValue: 12,
      threshold: { operator: "<", limit: 15, field: "battery" },
      status: "OPEN",
      acknowledgedAt: null,
      resolvedAt: null,
      timestamp: PAST(4),
      createdAt: PAST(4),
    },
    {
      alertId: "DEV-002_HIGH_HUMIDITY_1",
      deviceId: "DEV-002",
      shipmentId: "seed-ship-002",
      type: "HIGH_HUMIDITY",
      severity: "WARNING",
      value: 82,
      actualValue: 82,
      threshold: { operator: ">", limit: 80, field: "humidity" },
      status: "RESOLVED",
      acknowledgedAt: PAST(3),
      resolvedAt: PAST(2),
      resolvedBy: "seeds-admin-001",
      timestamp: PAST(5),
      createdAt: PAST(5),
    },
    {
      alertId: "DEV-001_DEVICE_OFFLINE_1",
      deviceId: "DEV-003",
      shipmentId: null,
      type: "DEVICE_OFFLINE",
      severity: "CRITICAL",
      value: true,
      actualValue: true,
      threshold: { operator: "===", limit: true, field: "deviceOffline" },
      status: "OPEN",
      acknowledgedAt: null,
      resolvedAt: null,
      timestamp: PAST(1),
      createdAt: PAST(1),
    },
    {
      alertId: "DEV-005_GAS_ALERT_1",
      deviceId: "DEV-005",
      shipmentId: "seed-ship-005",
      type: "GAS_ALERT",
      severity: "CRITICAL",
      value: 58,
      actualValue: 58,
      threshold: { operator: ">", limit: 50, field: "gasLevel" },
      status: "RESOLVED",
      acknowledgedAt: PAST(5),
      resolvedAt: PAST(4),
      resolvedBy: "seeds-transporter-001",
      timestamp: PAST(6),
      createdAt: PAST(6),
    },
  ];

  for (const a of alerts) {
    if (!(await docExists("alerts", a.alertId))) {
      await db.collection("alerts").doc(a.alertId).set(a);
      console.log(`  Alert: ${a.alertId} (${a.type}/${a.status})`);
    } else {
      console.log(`  Alert skipped (exists): ${a.alertId}`);
    }
  }
}

async function seedTimeline() {
  const events = [
    {
      shipmentId: "seed-ship-001",
      type: TimelineEventType.SHIPMENT_CREATED,
      timestamp: PAST(5),
      actorId: "seeds-farmer-001",
      metadata: { status: "PENDING" },
    },
    {
      shipmentId: "seed-ship-001",
      type: TimelineEventType.DEVICE_ASSIGNED,
      timestamp: PAST(4),
      actorId: "seeds-farmer-001",
      metadata: { deviceId: "DEV-001" },
    },
    {
      shipmentId: "seed-ship-001",
      type: TimelineEventType.READY_FOR_DISPATCH,
      timestamp: PAST(3),
      actorId: "seeds-farmer-001",
      metadata: { status: "READY_FOR_DISPATCH" },
    },
    {
      shipmentId: "seed-ship-001",
      type: TimelineEventType.SHIPMENT_DISPATCHED,
      timestamp: PAST(2),
      actorId: "seeds-transporter-001",
      metadata: { status: "IN_TRANSIT" },
    },
    {
      shipmentId: "seed-ship-001",
      type: TimelineEventType.TEMPERATURE_EXCURSION,
      timestamp: PAST(1),
      actorId: "SYSTEM",
      metadata: { deviceId: "DEV-001", temperature: 31.5, threshold: 28, severity: "CRITICAL" },
    },
    {
      shipmentId: "seed-ship-002",
      type: TimelineEventType.SHIPMENT_CREATED,
      timestamp: PAST(7),
      actorId: "seeds-farmer-001",
      metadata: { status: "PENDING" },
    },
    {
      shipmentId: "seed-ship-002",
      type: TimelineEventType.DEVICE_ASSIGNED,
      timestamp: PAST(6),
      actorId: "seeds-farmer-001",
      metadata: { deviceId: "DEV-002" },
    },
    {
      shipmentId: "seed-ship-002",
      type: TimelineEventType.READY_FOR_DISPATCH,
      timestamp: PAST(5),
      actorId: "seeds-farmer-001",
      metadata: { status: "READY_FOR_DISPATCH" },
    },
    {
      shipmentId: "seed-ship-002",
      type: TimelineEventType.SHIPMENT_DISPATCHED,
      timestamp: PAST(4),
      actorId: "seeds-transporter-001",
      metadata: { status: "IN_TRANSIT" },
    },
    {
      shipmentId: "seed-ship-002",
      type: TimelineEventType.WAREHOUSE_RECEIVED,
      timestamp: PAST(2),
      actorId: "seeds-warehouse-001",
      metadata: { status: "AT_WAREHOUSE" },
    },
    {
      shipmentId: "seed-ship-003",
      type: TimelineEventType.SHIPMENT_CREATED,
      timestamp: PAST(10),
      actorId: "seeds-farmer-001",
      metadata: { status: "PENDING" },
    },
    {
      shipmentId: "seed-ship-003",
      type: TimelineEventType.DEVICE_ASSIGNED,
      timestamp: PAST(9),
      actorId: "seeds-farmer-001",
      metadata: { deviceId: "DEV-003" },
    },
    {
      shipmentId: "seed-ship-003",
      type: TimelineEventType.READY_FOR_DISPATCH,
      timestamp: PAST(8),
      actorId: "seeds-farmer-001",
      metadata: { status: "READY_FOR_DISPATCH" },
    },
    {
      shipmentId: "seed-ship-003",
      type: TimelineEventType.SHIPMENT_DISPATCHED,
      timestamp: PAST(7),
      actorId: "seeds-transporter-001",
      metadata: { status: "IN_TRANSIT" },
    },
    {
      shipmentId: "seed-ship-003",
      type: TimelineEventType.WAREHOUSE_RECEIVED,
      timestamp: PAST(5),
      actorId: "seeds-warehouse-001",
      metadata: { status: "AT_WAREHOUSE" },
    },
    {
      shipmentId: "seed-ship-003",
      type: TimelineEventType.DELIVERY_COMPLETED,
      timestamp: PAST(2),
      actorId: "seeds-warehouse-001",
      metadata: { status: "DELIVERED" },
    },
    {
      shipmentId: "seed-ship-004",
      type: TimelineEventType.SHIPMENT_CREATED,
      timestamp: PAST(3),
      actorId: "seeds-farmer-001",
      metadata: { status: "PENDING" },
    },
    {
      shipmentId: "seed-ship-004",
      type: TimelineEventType.DEVICE_ASSIGNED,
      timestamp: PAST(2),
      actorId: "seeds-farmer-001",
      metadata: { deviceId: "DEV-004" },
    },
    {
      shipmentId: "seed-ship-004",
      type: TimelineEventType.SHIPMENT_DISPATCHED,
      timestamp: PAST(1),
      actorId: "seeds-transporter-001",
      metadata: { status: "IN_TRANSIT" },
    },
    {
      shipmentId: "seed-ship-005",
      type: TimelineEventType.SHIPMENT_CREATED,
      timestamp: PAST(12),
      actorId: "seeds-farmer-001",
      metadata: { status: "PENDING" },
    },
    {
      shipmentId: "seed-ship-005",
      type: TimelineEventType.DEVICE_ASSIGNED,
      timestamp: PAST(11),
      actorId: "seeds-farmer-001",
      metadata: { deviceId: "DEV-005" },
    },
    {
      shipmentId: "seed-ship-005",
      type: TimelineEventType.READY_FOR_DISPATCH,
      timestamp: PAST(10),
      actorId: "seeds-farmer-001",
      metadata: { status: "READY_FOR_DISPATCH" },
    },
    {
      shipmentId: "seed-ship-005",
      type: TimelineEventType.SHIPMENT_DISPATCHED,
      timestamp: PAST(9),
      actorId: "seeds-transporter-001",
      metadata: { status: "IN_TRANSIT" },
    },
    {
      shipmentId: "seed-ship-005",
      type: TimelineEventType.WAREHOUSE_RECEIVED,
      timestamp: PAST(6),
      actorId: "seeds-warehouse-001",
      metadata: { status: "AT_WAREHOUSE" },
    },
    {
      shipmentId: "seed-ship-005",
      type: TimelineEventType.DELIVERY_COMPLETED,
      timestamp: PAST(3),
      actorId: "seeds-warehouse-001",
      metadata: { status: "DELIVERED" },
    },
  ];

  let count = 0;
  for (const e of events) {
    const eventId = randomUUID();
    if (!(await docExists("timeline", eventId))) {
      await db.collection("timeline").doc(eventId).set({ ...e, eventId });
      count++;
    }
  }
  console.log(`  Timeline events: ${count} added`);
}

async function main() {
  console.log("Seeding AgriTrace demo data...\n");

  console.log("Users:");
  await seedUsers();
  console.log();

  console.log("Devices:");
  await seedDevices();
  console.log();

  console.log("Shipments:");
  await seedShipments();
  console.log();

  console.log("Alerts:");
  await seedAlerts();
  console.log();

  console.log("Timeline:");
  await seedTimeline();
  console.log();

  console.log("Seed complete! Data ready for demo.");
}

main().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
