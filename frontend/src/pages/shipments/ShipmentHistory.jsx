import { useState, useEffect } from "react";
import { listShipments } from "../../api/shipmentApi";

function getStatusClass(status) {
  if (!status) return "delivered";
  switch (status.toLowerCase()) {
    case "delivered":
      return "delivered";

    case "in transit":
    case "transit":
      return "transit";

    case "delayed":
      return "delayed";

    case "warehouse":
      return "warehouse";

    case "alert":
      return "alert";

    default:
      return "delivered";
  }
}

function ShipmentHistory() {
  const [shipments, setShipments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchShipments = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await listShipments();
      const completed = data.filter(
        (s) =>
          s.status &&
          (s.status.toLowerCase().includes("deliver") ||
            s.status.toLowerCase() === "completed")
      );
      setShipments(completed);
    } catch (err) {
      setError("Failed to load shipment history: " + err.message);
      setShipments([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchShipments();
  }, []);

  if (loading) {
    return (
      <div className="shipment-history-page">
        <section className="card history-panel">
          <div className="history-panel-head">
            <h3>Shipment History</h3>
            <span className="history-count">
              Loading...
            </span>
          </div>
          <div className="table-scroll">
            <div style={{ textAlign: "center", padding: "40px" }}>
              <div style={{
                width: "40px", height: "40px",
                border: "3px solid #e2e8f0",
                borderTopColor: "#10b981",
                borderRadius: "50%",
                animation: "spin 1s linear infinite",
                margin: "0 auto 16px"
              }} />
              <p style={{ color: "#64748b" }}>Loading shipment history...</p>
              <style>{`
                @keyframes spin {
                  to { transform: rotate(360deg); }
                }
              `}</style>
            </div>
          </div>
        </section>
      </div>
    );
  }

  if (error) {
    return (
      <div className="shipment-history-page">
        <section className="card history-panel">
          <div className="history-panel-head">
            <h3>Shipment History</h3>
          </div>
          <div className="table-scroll">
            <div style={{ textAlign: "center", padding: "40px", color: "#ef4444" }}>
              <p>{error}</p>
            </div>
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="shipment-history-page">
      <section className="card history-panel">
        <div className="history-panel-head">
          <h3>Shipment History</h3>

          <span className="history-count">
            {shipments.length} completed shipments
          </span>
        </div>

        <div className="table-scroll">
          <table className="data-table history-table">
            <thead>
              <tr>
                <th>Shipment ID</th>
                <th>Product</th>
                <th>Source</th>
                <th>Destination</th>
                <th>Device</th>
                <th>Status</th>
                <th>Final Temp</th>
                <th>Completed</th>
              </tr>
            </thead>

            <tbody>
              {shipments.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ textAlign: "center", padding: "40px", color: "#64748b" }}>
                    No completed shipments found.
                  </td>
                </tr>
              ) : (
                shipments.map(
                  (shipment) => (
                    <tr key={shipment.id}>
                      <td>
                        <span className="history-shipment-id">
                          {shipment.id}
                        </span>
                      </td>

                      <td>
                        {shipment.productName || shipment.product || "N/A"}
                      </td>

                      <td>
                        {shipment.source || "N/A"}
                      </td>

                      <td>
                        {shipment.destination || "N/A"}
                      </td>

                      <td>
                        {shipment.device || "—"}
                      </td>

                      <td>
                        <span
                          className={`badge ${getStatusClass(
                            shipment.status
                          )}`}
                        >
                          {shipment.status}
                        </span>
                      </td>

                      <td>
                        {shipment.latestTelemetry?.temperature !== undefined
                          ? `${shipment.latestTelemetry.temperature}°C`
                          : shipment.temp !== undefined
                          ? `${shipment.temp}°C`
                          : "—"}
                      </td>

                      <td>
                        {shipment.updatedAt
                          ? new Date(shipment.updatedAt).toLocaleDateString("en-GB", {
                              day: "2-digit",
                              month: "short",
                              year: "numeric",
                            })
                          : shipment.updated
                          ? shipment.updated
                          : "—"}
                      </td>
                    </tr>
                  )
                )
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

export default ShipmentHistory;