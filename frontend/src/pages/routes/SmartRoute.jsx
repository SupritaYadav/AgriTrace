import { useState, useEffect } from "react";

import { useAuth } from "../../context/AuthContext";
import { optimizeRoute, getShipmentRoute, selectRoute } from "../../api/routeApi";
import { listShipments } from "../../api/shipmentApi";
import LoadingSpinner from "../../components/common/LoadingSpinner";

const OPTIMIZATION_MODES = [
  { value: "SHORTEST", label: "Shortest Route", desc: "Minimize total distance" },
  { value: "BALANCED", label: "Balanced Route", desc: "Balance distance and density" },
  { value: "LOW_DENSITY", label: "Low-Density Route", desc: "Avoid congested areas" },
];

const SmartRoute = () => {
  const { role } = useAuth();
  const [shipments, setShipments] = useState([]);
  const [selectedShipment, setSelectedShipment] = useState("");
  const [startPoint, setStartPoint] = useState({ latitude: "", longitude: "" });
  const [stops, setStops] = useState([{ latitude: "", longitude: "", name: "" }]);
  const [denseAreas, setDenseAreas] = useState([]);
  const [optimizationMode, setOptimizationMode] = useState("BALANCED");
  const [densityWeight, setDensityWeight] = useState(0.15);
  const [results, setResults] = useState(null);
  const [existingRoutePlan, setExistingRoutePlan] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [optimizing, setOptimizing] = useState(false);
  const [savedRouteId, setSavedRouteId] = useState(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const shipmentsData = await listShipments();
        setShipments(Array.isArray(shipmentsData) ? shipmentsData : []);
      } catch (err) {
        console.error("Failed to load shipments", err);
        setError(err.message || "Failed to load shipments");
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  const handleSelectShipment = async (shipmentId) => {
    setSelectedShipment(shipmentId);
    try {
      const plan = await getShipmentRoute(shipmentId);
      if (plan) {
        setExistingRoutePlan(plan);
        setResults(null);
        setSavedRouteId(plan.routePlanId);
        setOptimizationMode(plan.selectedMode || "BALANCED");
      }
    } catch (err) {
      if (err.status === 404) {
        setExistingRoutePlan(null);
      } else {
        console.error("Failed to load route plan", err);
      }
    }
  };

  const addStop = () => {
    setStops([...stops, { latitude: "", longitude: "", name: "" }]);
  };

  const updateStop = (idx, field, value) => {
    const newStops = [...stops];
    newStops[idx] = { ...newStops[idx], [field]: value };
    setStops(newStops);
  };

  const removeStop = (idx) => {
    if (stops.length > 1) {
      setStops(stops.filter((_, i) => i !== idx));
    }
  };

  const handleOptimize = async () => {
    setOptimizing(true);
    setError(null);
    setResults(null);

    try {
      const payload = {
        startPoint: {
          latitude: Number(startPoint.latitude),
          longitude: Number(startPoint.longitude),
          name: startPoint.name || "Start",
        },
        stops: stops.map((s) => ({
          latitude: Number(s.latitude),
          longitude: Number(s.longitude),
          name: s.name || `${s.latitude},${s.longitude}`,
        })),
        denseAreas: denseAreas.length > 0 ? denseAreas : undefined,
        optimizationMode,
        densityWeight: densityWeight || undefined,
        shipmentId: selectedShipment || undefined,
      };

      const result = await optimizeRoute(payload);
      setResults(result);
      if (result.routePlanId) {
        setSavedRouteId(result.routePlanId);
      }
    } catch (err) {
      setError(err.message || "Failed to optimize route");
    } finally {
      setOptimizing(false);
    }
  };

  const handleSelectRoute = async (selectedOption) => {
    if (!results || !selectedShipment) return;

    try {
      const result = await selectRoute(selectedShipment, {
        routePlanId: results.routePlanId,
        selectedOption,
      });
      setExistingRoutePlan(result);
      setSavedRouteId(result.routePlanId);
    } catch (err) {
      setError(err.message || "Failed to select route");
    }
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="page-container">
      <style>{`
        .sr-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
        .sr-header h1 { margin: 0; font-size: 22px; }
        .sr-form { background: var(--card-bg); border: 1px solid var(--border); border-radius: 12px; padding: 16px; margin-bottom: 16px; }
        .sr-form .form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
        .sr-form .form-group { display: flex; flex-direction: column; gap: 4px; }
        .sr-form .form-group label { font-size: 12px; color: var(--text-muted); }
        .sr-form input, .sr-form select { padding: 8px 10px; border: 1px solid var(--border); border-radius: 6px; font-size: 13px; }
        .sr-btn { padding: 8px 16px; border-radius: 8px; border: 1px solid var(--border); background: #1b658a; color: #fff; font-size: 13px; font-weight: 600; cursor: pointer; }
        .sr-btn-secondary { background: var(--bg-secondary); color: var(--text); }
        .sr-btn:disabled { opacity: 0.6; cursor: not-allowed; }
        .sr-mode-card { border: 2px solid var(--border); border-radius: 8px; padding: 12px; cursor: pointer; }
        .sr-mode-card.selected { border-color: #1b658a; background: #eff6ff; }
        .sr-results { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
        .sr-result-card { background: var(--card-bg); border: 1px solid var(--border); border-radius: 12px; padding: 16px; }
        .sr-map { width: 100%; height: 240px; background: var(--bg-secondary); border-radius: 8px; border: 1px solid var(--border); margin: 8px 0; position: relative; }
        .sr-stop-point { position: absolute; width: 12px; height: 12px; border-radius: 50%; background: #10b981; border: 2px solid var(--card-bg); }
        .sr-stop-start { background: #1b658a; }
        .sr-comparison-th { text-align: center; font-size: 12px; }
        .sr-comparison-td { text-align: center; font-size: 13px; }
        @media (max-width: 1024px) { .sr-results { grid-template-columns: 1fr; } }
      `}</style>

      <div className="sr-header">
        <h1>Smart Route Optimizer</h1>
        <span style={{ fontSize: 13, color: "var(--text-muted)" }}>AI-assisted route recommendation</span>
      </div>

      {error && (
        <div style={{ background: "#fef2f2", color: "#991b2b", padding: 12, borderRadius: 8, marginBottom: 12, fontSize: 13 }}>
          {error}
        </div>
      )}

      <div className="sr-form">
        <div className="form-row">
          <div className="form-group">
            <label>Shipment (optional)</label>
            <select value={selectedShipment} onChange={(e) => handleSelectShipment(e.target.value)}>
              <option value="">— Select a shipment —</option>
              {shipments.map((s) => (
                <option key={s.shipmentId || s.id} value={s.shipmentId || s.id}>
                  {s.trackingId || s.shipmentId} — {s.product || "Unknown"}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>Transport Mode</label>
            <select value={optimizationMode} onChange={(e) => setOptimizationMode(e.target.value)}>
              {OPTIMIZATION_MODES.map((mode) => (
                <option key={mode.value} value={mode.value}>
                  {mode.label} — {mode.desc}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="form-row" style={{ marginTop: 12 }}>
          <div className="form-group">
            <label>Start Point (lat, lng)</label>
            <input
              type="number"
              step="0.000001"
              placeholder="Latitude"
              value={startPoint.latitude}
              onChange={(e) => setStartPoint({ ...startPoint, latitude: e.target.value })}
              style={{ marginBottom: 4 }}
            />
            <input
              type="number"
              step="0.000001"
              placeholder="Longitude"
              value={startPoint.longitude}
              onChange={(e) => setStartPoint({ ...startPoint, longitude: e.target.value })}
              style={{ marginTop: 4 }}
            />
          </div>

          <div className="form-group">
            <label>Density Weight (0–1)</label>
            <input
              type="number"
              step="0.01"
              min="0"
              max="1"
              value={densityWeight}
              onChange={(e) => setDensityWeight(Number(e.target.value))}
            />
          </div>
        </div>

        <div style={{ marginTop: 12 }}>
          <label style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 4, display: "block" }}>
            Delivery Stops ({stops.length})
          </label>
          {stops.map((stop, idx) => (
            <div key={idx} className="form-row" style={{ marginTop: 4 }}>
              <div className="form-group">
                <input
                  type="number"
                  step="0.000001"
                  placeholder={`Stop ${idx + 1} Latitude`}
                  value={stop.latitude}
                  onChange={(e) => updateStop(idx, "latitude", e.target.value)}
                />
              </div>
              <div className="form-group" style={{ display: "flex", gap: 4 }}>
                <input
                  type="number"
                  step="0.000001"
                  placeholder={`Stop ${idx + 1} Longitude`}
                  value={stop.longitude}
                  onChange={(e) => updateStop(idx, "longitude", e.target.value)}
                />
                {stops.length > 1 && (
                  <button
                    type="button"
                    className="sr-btn sr-btn-secondary"
                    onClick={() => removeStop(idx)}
                    style={{ padding: "8px 10px" }}
                  >
                    ×
                  </button>
                )}
              </div>
            </div>
          ))}
          <button type="button" className="sr-btn sr-btn-secondary" style={{ marginTop: 8 }} onClick={addStop}>
            + Add Stop
          </button>
        </div>

        <button
          className="sr-btn"
          style={{ marginTop: 12 }}
          onClick={handleOptimize}
          disabled={optimizing || !startPoint.latitude || !startPoint.longitude || stops.some((s) => !s.latitude || !s.longitude)}
        >
          {optimizing ? "Optimizing..." : "Optimize Route"}
        </button>
      </div>

      {existingRoutePlan && (
        <div className="sr-form">
          <h3 style={{ margin: "0 0 8px 0", fontSize: 15 }}>Existing Route Plan</h3>
          <p style={{ margin: 0, fontSize: 13, color: "var(--text-muted)" }}>
            Selected mode: <strong>{existingRoutePlan.selectedMode || "—"}</strong>
            {" · "}
            Created: {new Date(existingRoutePlan.createdAt).toLocaleString()}
          </p>
        </div>
      )}

      {results && (
        <div className="sr-results">
          <div className="sr-result-card">
            <h3 style={{ margin: "0 0 8px 0" }}>Recommended Route</h3>
            <p style={{ margin: "0 0 8px 0", fontSize: 13 }}>{results.explanation || ""}</p>
            {results.routePlanId && (
              <p style={{ margin: "0 0 8px 0", fontSize: 12, color: "var(--text-muted)" }}>
                Plan ID: {results.routePlanId}
              </p>
            )}

            <div className="sr-map">
              {results.recommendedRoute.optimizedRoute.map((stop, idx) => (
                <div
                  key={idx}
                  className={`sr-stop-point sr-stop-${idx === 0 ? "start" : ""}`}
                  style={{
                    left: `${20 + (idx / Math.max(results.recommendedRoute.optimizedRoute.length - 1, 1)) * 80}%`,
                    top: `${30 + (idx % 2) * 40}%`,
                  }}
                  title={stop.name || `${idx + 1}`}
                />
              ))}
              <div style={{ position: "absolute", bottom: 8, left: 8, fontSize: 11, color: "var(--text-muted)" }}>
                Approximate stop order — not turn-by-turn navigation
              </div>
            </div>

            <div style={{ marginTop: 12 }}>
              <div className="sr-stop-list" style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                {results.recommendedRoute.optimizedRoute.map((stop, idx) => (
                  <div key={idx} style={{ fontSize: 12, display: "flex", gap: 8, alignItems: "center" }}>
                    <span style={{ width: 20, height: 20, borderRadius: "50%", background: idx === 0 ? "#1b658a" : "#10b981", color: "white", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10 }}>
                      {idx + 1}
                    </span>
                    <span>{stop.name || `${stop.latitude.toFixed(6)}, ${stop.longitude.toFixed(6)}`}</span>
                    <span style={{ color: "var(--text-muted)", fontSize: 11 }}>({stop.distanceFromPrevious} km)</span>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ marginTop: 12, fontSize: 13 }}>
              <div>Total Distance: <strong>{results.recommendedRoute.totalDistanceKm} km</strong></div>
              <div>Dense Stops: <strong>{results.recommendedRoute.denseStopCount || 0}</strong></div>
              <div>Route Score: <strong>{results.recommendedRoute.routeScore}</strong></div>
            </div>

            {selectedShipment && savedRouteId && (
              <button
                className="sr-btn"
                style={{ marginTop: 12, width: "100%" }}
                onClick={() => handleSelectRoute(results.recommendedMode)}
              >
                Select This Route
              </button>
            )}
          </div>

          <div>
            <div className="sr-result-card" style={{ marginBottom: 12 }}>
              <h4 style={{ margin: "0 0 8px 0", fontSize: 14 }}>Route Comparison</h4>
              <table style={{ width: "100%", fontSize: 13, borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid var(--border)" }}>
                    <th className="sr-comparison-th"></th>
                    <th className="sr-comparison-th">Shortest</th>
                    <th className="sr-comparison-th">Balanced</th>
                    <th className="sr-comparison-th">Low Density</th>
                  </tr>
                </thead>
                <tbody>
                  <tr style={{ borderBottom: "1px solid var(--border)" }}>
                    <td className="sr-comparison-td">Distance (km)</td>
                    <td className="sr-comparison-td">{results.alternatives.shortest?.totalDistanceKm || "—"}</td>
                    <td className="sr-comparison-td">{results.alternatives.balanced?.totalDistanceKm || "—"}</td>
                    <td className="sr-comparison-td">{results.alternatives.low_density?.totalDistanceKm || "—"}</td>
                  </tr>
                  <tr style={{ borderBottom: "1px solid var(--border)" }}>
                    <td className="sr-comparison-td">Dense Stops</td>
                    <td className="sr-comparison-td">{results.alternatives.shortest?.denseStopCount || 0}</td>
                    <td className="sr-comparison-td">{results.alternatives.balanced?.denseStopCount || 0}</td>
                    <td className="sr-comparison-td">{results.alternatives.low_density?.denseStopCount || 0}</td>
                  </tr>
                  <tr>
                    <td className="sr-comparison-td">Route Score</td>
                    <td className="sr-comparison-td">{results.alternatives.shortest?.routeScore || "—"}</td>
                    <td className="sr-comparison-td">{results.alternatives.balanced?.routeScore || "—"}</td>
                    <td className="sr-comparison-td">{results.alternatives.low_density?.routeScore || "—"}</td>
                  </tr>
                </tbody>
              </table>
              <div style={{ marginTop: 8, fontSize: 12, color: "var(--text-muted)" }}>
                Recommended mode: <strong>{results.recommendedMode}</strong>
              </div>
            </div>

            <div className="sr-result-card">
              <h4 style={{ margin: "0 0 8px 0", fontSize: 14 }}>Alternative Options</h4>
              {Object.entries(results.alternatives).map(([key, route]) => (
                <div key={key} style={{ marginBottom: 12, paddingBottom: 8, borderBottom: key !== "low_density" ? "1px solid var(--border)" : "none" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}>
                    <strong>{route.optimizationMode || key.replace("_", " ")}</strong>
                    <span>{route.totalDistanceKm} km</span>
                  </div>
                  <div style={{ fontSize: 11, color: "var(--text-muted)" }}>
                    Dense stops: {route.denseStopCount || 0} | Score: {route.routeScore}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SmartRoute;
