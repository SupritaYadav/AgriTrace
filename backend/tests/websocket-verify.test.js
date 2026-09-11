import test from "node:test";
import assert from "node:assert/strict";
import { WebSocket, WebSocketServer } from "ws";
import { createServer } from "http";

test("WebSocket closes connection without token", async () => {
  const server = createServer();
  const wss = new WebSocketServer({ server });

  wss.on("connection", (ws, req) => {
    const url = new URL(req.url, "http://localhost");
    const token = url.searchParams.get("token");
    if (!token) {
      ws.close(4001, "No token provided");
      return;
    }
    ws.on("message", () => {});
  });

  await new Promise((resolve) => server.listen(0, resolve));
  const port = server.address().port;

  await new Promise((resolve) => {
    const ws = new WebSocket(`ws://localhost:${port}`);
    ws.on("close", (code) => {
      assert.equal(code, 4001);
      server.close();
      resolve();
    });
  });
});

test("WebSocket closes with 4002 for invalid token", async () => {
  const server = createServer();
  const wss = new WebSocketServer({ server });

  wss.on("connection", (ws, req) => {
    const url = new URL(req.url, "http://localhost");
    const token = url.searchParams.get("token");
    if (!token) {
      ws.close(4001, "No token provided");
      return;
    }
    if (token !== "valid-token") {
      ws.close(4002, "Invalid token");
      return;
    }
    ws.on("message", () => {});
  });

  await new Promise((resolve) => server.listen(0, resolve));
  const port = server.address().port;

  await new Promise((resolve) => {
    const ws = new WebSocket(`ws://localhost:${port}?token=invalid-token`);
    ws.on("close", (code) => {
      assert.equal(code, 4002);
      server.close();
      resolve();
    });
  });
});

test("WebSocket connection lifecycle: connect, subscribe, unsubscribe", async () => {
  const server = createServer();
  const wss = new WebSocketServer({ server });
  const subscriptions = new Map();

  wss.on("connection", (ws, req) => {
    const url = new URL(req.url, "http://localhost");
    const token = url.searchParams.get("token");
    if (!token || token !== "valid-token") {
      ws.close(4002, "Invalid token");
      return;
    }

    ws.on("message", (data) => {
      const msg = JSON.parse(data.toString());
      if (msg.type === "shipment.subscribe") {
        if (!subscriptions.has(msg.shipmentId)) {
          subscriptions.set(msg.shipmentId, new Set());
        }
        subscriptions.get(msg.shipmentId).add(ws);
        ws.send(JSON.stringify({ type: "shipment.subscribed", shipmentId: msg.shipmentId }));
      }
      if (msg.type === "shipment.unsubscribe") {
        subscriptions.get(msg.shipmentId)?.delete(ws);
        ws.send(JSON.stringify({ type: "shipment.unsubscribed", shipmentId: msg.shipmentId }));
      }
    });
  });

  await new Promise((resolve) => server.listen(0, resolve));
  const port = server.address().port;

  await new Promise((resolve, reject) => {
    const ws = new WebSocket(`ws://localhost:${port}?token=valid-token`);
    let subscribed = false;
    let unsubscribed = false;

    ws.on("open", () => {
      ws.send(JSON.stringify({ type: "shipment.subscribe", shipmentId: "ship-123" }));
    });

    ws.on("message", (data) => {
      const msg = JSON.parse(data.toString());
      if (msg.type === "shipment.subscribed") {
        subscribed = true;
        assert.equal(msg.shipmentId, "ship-123");
        ws.send(JSON.stringify({ type: "shipment.unsubscribe", shipmentId: "ship-123" }));
      }
      if (msg.type === "shipment.unsubscribed") {
        unsubscribed = true;
        assert.equal(msg.shipmentId, "ship-123");
        ws.close();
      }
    });

    ws.on("close", () => {
      assert.ok(subscribed, "Should have subscribed");
      assert.ok(unsubscribed, "Should have unsubscribed");
      server.close();
      resolve();
    });

    ws.on("error", reject);
  });
});

test("broadcast sends to subscribed clients", async () => {
  const server = createServer();
  const wss = new WebSocketServer({ server });
  const subscriptions = new Map();

  wss.on("connection", (ws, req) => {
    const url = new URL(req.url, "http://localhost");
    const token = url.searchParams.get("token");
    if (!token || token !== "valid-token") {
      ws.close(4002, "Invalid token");
      return;
    }
    ws.on("message", (data) => {
      const msg = JSON.parse(data.toString());
      if (msg.type === "shipment.subscribe") {
        if (!subscriptions.has(msg.shipmentId)) {
          subscriptions.set(msg.shipmentId, new Set());
        }
        subscriptions.get(msg.shipmentId).add(ws);
        ws.send(JSON.stringify({ type: "shipment.subscribed", shipmentId: msg.shipmentId }));
      }
    });
  });

  await new Promise((resolve) => server.listen(0, resolve));
  const port = server.address().port;

  const ws = new WebSocket(`ws://localhost:${port}?token=valid-token`);
  let receivedMsg = null;

  await new Promise((resolve) => {
    ws.on("open", () => {
      ws.send(JSON.stringify({ type: "shipment.subscribe", shipmentId: "broadcast-test" }));
    });
    ws.on("message", (data) => {
      const msg = JSON.parse(data.toString());
      if (msg.type === "shipment.subscribed") {
        const sockets = subscriptions.get("broadcast-test");
        assert.ok(sockets && sockets.size > 0, "Should have subscribers");
        for (const s of sockets) {
          if (s.readyState === s.OPEN) {
            s.send(JSON.stringify({ type: "test-event", payload: "hello" }));
          }
        }
      }
      if (msg.type === "test-event") {
        receivedMsg = msg;
        ws.close();
        resolve();
      }
    });
    setTimeout(() => { ws.close(); resolve(); }, 3000);
  });

  assert.ok(receivedMsg !== null, "Should receive broadcast");
  server.close();
});

test("WebSocket rejects invalid JSON", async () => {
  const server = createServer();
  const wss = new WebSocketServer({ server });

  wss.on("connection", (ws) => {
    ws.on("message", (data) => {
      try {
        JSON.parse(data.toString());
      } catch {
        ws.send(JSON.stringify({ type: "error", code: "INVALID_MESSAGE", message: "WebSocket message must be valid JSON." }));
      }
    });
  });

  await new Promise((resolve) => server.listen(0, resolve));
  const port = server.address().port;

  await new Promise((resolve) => {
    const ws = new WebSocket(`ws://localhost:${port}?token=valid-token`);
    ws.on("open", () => {
      ws.send("not-json");
    });
    ws.on("message", (data) => {
      const msg = JSON.parse(data.toString());
      if (msg.type === "error") {
        assert.ok(msg.code === "INVALID_MESSAGE" || msg.code === "SERVER_ERROR");
        ws.close();
        server.close();
        resolve();
      }
    });
  });
});

test("WebSocket rejects unsupported message type", async () => {
  const server = createServer();
  const wss = new WebSocketServer({ server });

  wss.on("connection", (ws) => {
    ws.on("message", (data) => {
      const msg = JSON.parse(data.toString());
      if (msg.type !== "shipment.subscribe" && msg.type !== "shipment.unsubscribe") {
        ws.send(JSON.stringify({ type: "error", code: "UNSUPPORTED_MESSAGE", message: "Unsupported WebSocket message type." }));
      }
    });
  });

  await new Promise((resolve) => server.listen(0, resolve));
  const port = server.address().port;

  await new Promise((resolve) => {
    const ws = new WebSocket(`ws://localhost:${port}?token=valid-token`);
    ws.on("open", () => {
      ws.send(JSON.stringify({ type: "unsupported", shipmentId: "test" }));
    });
    ws.on("message", (data) => {
      const msg = JSON.parse(data.toString());
      if (msg.type === "error") {
        assert.equal(msg.code, "UNSUPPORTED_MESSAGE");
        ws.close();
        server.close();
        resolve();
      }
    });
  });
});

test("WebSocket validates shipment ID format", async () => {
  const server = createServer();
  const wss = new WebSocketServer({ server });

  wss.on("connection", (ws) => {
    ws.on("message", (data) => {
      const msg = JSON.parse(data.toString());
      if (msg.type === "shipment.subscribe") {
        if (typeof msg.shipmentId !== "string" || !/^[A-Za-z0-9][A-Za-z0-9_-]{0,127}$/.test(msg.shipmentId)) {
          ws.send(JSON.stringify({ type: "error", code: "INVALID_SHIPMENT_ID", message: "A valid shipmentId is required." }));
          return;
        }
        ws.send(JSON.stringify({ type: "shipment.subscribed", shipmentId: msg.shipmentId }));
      }
    });
  });

  await new Promise((resolve) => server.listen(0, resolve));
  const port = server.address().port;

  await new Promise((resolve) => {
    const ws = new WebSocket(`ws://localhost:${port}?token=valid-token`);
    ws.on("open", () => {
      ws.send(JSON.stringify({ type: "shipment.subscribe", shipmentId: "invalid!id" }));
    });
    ws.on("message", (data) => {
      const msg = JSON.parse(data.toString());
      if (msg.type === "error") {
        assert.equal(msg.code, "INVALID_SHIPMENT_ID");
        ws.close();
        server.close();
        resolve();
      }
    });
  });
});