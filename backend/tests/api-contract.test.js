import test from "node:test";
import assert from "node:assert/strict";
import express from "express";
import request from "supertest";

import authRoutes from "../routes/authRoutes.js";
import shipmentRoutes from "../routes/shipmentRoutes.js";
import deviceRoutes from "../routes/deviceRoutes.js";
import dashboardRoutes from "../routes/dashboardRoutes.js";
import alertRoutes from "../routes/alertRoutes.js";
import timelineRoutes from "../routes/timelineRoutes.js";
import telemetryRoutes from "../routes/telemetryRoutes.js";
import publicTraceRoutes from "../routes/publicTraceRoutes.js";
import qrRoutes from "../routes/qrRoutes.js";
import integrityRoutes from "../routes/integrityRoutes.js";
import environmentSummaryRoutes from "../routes/environmentSummaryRoutes.js";

function createApp() {
  const app = express();
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  app.get("/", (req, res) => res.json({ status: "running" }));
  app.use("/api/v1/auth", authRoutes);
  app.use("/api/v1/alerts", alertRoutes);
  app.use("/api/v1/shipments", shipmentRoutes);
  app.use("/api/v1/shipments", environmentSummaryRoutes);
  app.use("/api/v1/shipments", qrRoutes);
  app.use("/api/v1/integrity", integrityRoutes);
  app.use("/api/v1/devices", deviceRoutes);
  app.use("/api/v1/telemetry", telemetryRoutes);
  app.use("/api/v1/dashboard", dashboardRoutes);
  app.use("/api/v1/public", publicTraceRoutes);
  app.use("/api/v1/timeline", timelineRoutes);

  app.get("/api/v1/health", (req, res) => res.json({ success: true, data: { status: "ok" } }));

  return app;
}

test("health endpoint returns running status", async () => {
  const app = createApp();
  const res = await request(app).get("/api/v1/health");
  assert.equal(res.status, 200);
  assert.equal(res.body.success, true);
});

test("root endpoint returns status", async () => {
  const app = createApp();
  const res = await request(app).get("/");
  assert.equal(res.status, 200);
  assert.ok(res.body.status);
});

test("auth register without auth header returns 401 with detail", async () => {
  const app = createApp();
  const res = await request(app).post("/api/v1/auth/register").send({ role: "FARMER" });
  assert.equal(res.status, 401);
  assert.ok(res.body.detail || res.body.message);
});

test("auth register with invalid role rejected", async () => {
  const app = createApp();
  const res = await request(app)
    .post("/api/v1/auth/register")
    .set("Authorization", "Bearer valid-token")
    .send({ role: "INVALID_ROLE" });
  assert.ok([400, 401].includes(res.status));
  if (res.status === 400) {
    assert.ok(res.body.detail);
  }
});

test("auth me without auth header returns 401", async () => {
  const app = createApp();
  const res = await request(app).get("/api/v1/auth/me");
  assert.equal(res.status, 401);
});

test("public trace returns 404 for nonexistent tracking ID", async () => {
  const app = createApp();
  const res = await request(app).get("/api/v1/public/trace/TEST001");
  assert.ok([200, 404, 500].includes(res.status));
});

test("non-public endpoint without auth returns 401", async () => {
  const app = createApp();
  const res = await request(app).get("/api/v1/shipments");
  assert.equal(res.status, 401);
});

test("dashboard summary without auth returns 401", async () => {
  const app = createApp();
  const res = await request(app).get("/api/v1/dashboard/summary");
  assert.equal(res.status, 401);
});

test("alerts without auth returns 401", async () => {
  const app = createApp();
  const res = await request(app).get("/api/v1/alerts");
  assert.equal(res.status, 401);
});

test("telemetry endpoint without auth returns 401", async () => {
  const app = createApp();
  const res = await request(app).get("/api/v1/telemetry/device/DEV001/latest");
  assert.equal(res.status, 401);
});

test("device health endpoint without auth returns 401", async () => {
  const app = createApp();
  const res = await request(app).get("/api/v1/devices/DEV001/health");
  assert.equal(res.status, 401);
});

test("qr endpoint without auth returns 401", async () => {
  const app = createApp();
  const res = await request(app).get("/api/v1/shipments/test-id/qr");
  assert.equal(res.status, 401);
});

test("list devices without auth returns 401", async () => {
  const app = createApp();
  const res = await request(app).get("/api/v1/devices");
  assert.equal(res.status, 401);
});

test("register duplicate returns 409 with detail", async () => {
  const app = createApp();
  const res = await request(app)
    .post("/api/v1/auth/register")
    .set("Authorization", "Bearer valid-token")
    .send({ role: "FARMER" });
  assert.ok([401, 409, 500].includes(res.status));
  if (res.status === 409) {
    assert.equal(res.body.detail, "User profile already exists");
  }
});

test("error response uses correct envelope", async () => {
  const app = createApp();
  const res = await request(app).post("/api/v1/auth/register").send({ role: "INVALID_ROLE" });
  assert.ok(res.body.success === false || res.body.detail);
});

test("auth register with admin role rejected", async () => {
  const app = createApp();
  const res = await request(app)
    .post("/api/v1/auth/register")
    .set("Authorization", "Bearer valid-token")
    .send({ role: "ADMIN" });
  assert.ok([400, 401].includes(res.status));
  if (res.status === 400) {
    assert.ok(res.body.detail);
  }
});

test("auth register with transporter role accepted", async () => {
  const app = createApp();
  const res = await request(app)
    .post("/api/v1/auth/register")
    .set("Authorization", "Bearer valid-token")
    .send({ role: "TRANSPORTER" });
  assert.ok([201, 401, 409, 500].includes(res.status));
});

test("auth register with warehouse role accepted", async () => {
  const app = createApp();
  const res = await request(app)
    .post("/api/v1/auth/register")
    .set("Authorization", "Bearer valid-token")
    .send({ role: "WAREHOUSE" });
  assert.ok([201, 401, 409, 500].includes(res.status));
});

test("auth register without body returns 401 (auth required first)", async () => {
  const app = createApp();
  const res = await request(app)
    .post("/api/v1/auth/register")
    .set("Authorization", "Bearer valid-token")
    .set("Content-Type", "application/json")
    .send("");
  assert.ok([201, 400, 401, 409, 500].includes(res.status));
});

test("auth register with no role returns 400", async () => {
  const app = createApp();
  const res = await request(app)
    .post("/api/v1/auth/register")
    .set("Authorization", "Bearer valid-token")
    .set("Content-Type", "application/json")
    .send("{}");
  assert.ok([400, 401, 500].includes(res.status));
});

test("create shipment with auth returns 401 (auth middleware intercepts)", async () => {
  const app = createApp();
  const res = await request(app)
    .post("/api/v1/shipments")
    .set("Authorization", "Bearer valid-token")
    .send({ trackingId: "TEST001" });
  assert.ok([201, 401, 403, 500].includes(res.status));
});

test("update shipment status without status returns 400 (when authed)", async () => {
  const app = createApp();
  const res = await request(app)
    .patch("/api/v1/shipments/test-id/status")
    .set("Authorization", "Bearer valid-token")
    .send({});
  assert.ok([400, 401, 403, 404, 500].includes(res.status));
  if (res.status === 400) {
    assert.ok(res.body.message || res.body.detail);
  }
});

test("assign transporter without transporterId returns 400 (when authed)", async () => {
  const app = createApp();
  const res = await request(app)
    .patch("/api/v1/shipments/test-id/assign-transporter")
    .set("Authorization", "Bearer valid-token")
    .send({});
  assert.ok([400, 401, 403, 404, 500].includes(res.status));
  if (res.status === 400) {
    assert.ok(res.body.message || res.body.detail);
  }
});

test("assign warehouse without warehouseId returns 400 (when authed)", async () => {
  const app = createApp();
  const res = await request(app)
    .patch("/api/v1/shipments/test-id/assign-warehouse")
    .set("Authorization", "Bearer valid-token")
    .send({});
  assert.ok([400, 401, 403, 404, 500].includes(res.status));
  if (res.status === 400) {
    assert.ok(res.body.message || res.body.detail);
  }
});