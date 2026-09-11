import { useState, useEffect, useRef, useCallback } from "react";
import { QRCodeCanvas } from "qrcode.react";

import {
  FaCheck,
  FaClock,
  FaTruck,
  FaQrcode,
  FaDownload,
  FaPrint,
  FaSpinner,
  FaBell,
} from "react-icons/fa6";

import {
  listShipments,
  getShipmentQr,
} from "../api/shipmentApi";

import {
  getShipmentTimeline,
} from "../api/timelineApi";

import {
  verifyShipmentIntegrity,
} from "../api/traceabilityApi";

const STATUS_LABEL = {
  completed: "Completed",
  current: "Current",
  pending: "Pending",
};

function displayValue(value, fallback = "—") {
  if (value === null || value === undefined || value === "") return fallback;
  if (typeof value === "object") {
    return Object.entries(value)
      .map(([key, entry]) => `${key}: ${typeof entry === "object" ? JSON.stringify(entry) : entry}`)
      .join(", ");
  }
  return String(value);
}

function Traceability() {
  const [shipments, setShipments] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [timeline, setTimeline] = useState([]);
  const [integrity, setIntegrity] = useState(null);
  const [qrData, setQrData] = useState(null);
  const [qrGenerated, setQrGenerated] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [timelineLoading, setTimelineLoading] = useState(false);
  const [integrityLoading, setIntegrityLoading] = useState(false);
  const [qrLoading, setQrLoading] = useState(false);
  const [error, setError] = useState(null);

  const qrRef = useRef(null);

  const fetchShipments = useCallback(async () => {
    try {
      const data = await listShipments();
      setShipments(data);
      if (data.length > 0 && !selectedId) {
        setSelectedId(data[0].id);
      }
    } catch (err) {
      setError("Failed to load shipments: " + err.message);
    }
  }, [selectedId]);

  const fetchTimeline = useCallback(async (shipmentId) => {
    setTimelineLoading(true);
    try {
      const data = await getShipmentTimeline(shipmentId);
      setTimeline(data);
    } catch (err) {
      setTimeline([]);
      console.error("Failed to fetch timeline:", err);
    } finally {
      setTimelineLoading(false);
    }
  }, []);

  const fetchIntegrity = useCallback(async (shipmentId) => {
    setIntegrityLoading(true);
    try {
      const data = await verifyShipmentIntegrity(shipmentId);
      setIntegrity(data);
    } catch (err) {
      setIntegrity(null);
      console.error("Failed to verify integrity:", err);
    } finally {
      setIntegrityLoading(false);
    }
  }, []);

  const handleGenerateQr = async () => {
    if (!selectedId) return;
    setQrLoading(true);
    try {
      const data = await getShipmentQr(selectedId);
      setQrData(data);
      setQrGenerated(true);
      setToastMessage(`QR generated for ${selectedId}`);
      setTimeout(() => setToastMessage(""), 3000);
    } catch (err) {
      setToastMessage("Failed to generate QR: " + err.message);
      setTimeout(() => setToastMessage(""), 3000);
    } finally {
      setQrLoading(false);
    }
  };

  const handleDownload = () => {
    if (!qrData?.qrDataUrl) return;
    const link = document.createElement("a");
    link.href = qrData.qrDataUrl;
    link.download = `${selectedId}-qr.png`;
    link.click();
  };

  const handlePrint = () => {
    window.print();
  };

  useEffect(() => {
    fetchShipments();
  }, [fetchShipments]);

  useEffect(() => {
    if (selectedId) {
      setQrGenerated(false);
      fetchTimeline(selectedId);
      fetchIntegrity(selectedId);
    }
  }, [selectedId, fetchTimeline, fetchIntegrity]);

  const shipment = shipments.find((item) => item.id === selectedId);

  const formatDate = (dateStr) => {
    if (!dateStr) return "—";
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const mapTimelineStatus = (type, index, total) => {
    const t = (type || "").toLowerCase();
    if (t.includes("deliver") || t.includes("receiv") || t.includes("complete")) {
      return "completed";
    }
    if (t.includes("dispatch") || t.includes("transit") || t.includes("transport") || t.includes("current")) {
      return "current";
    }
    return index === total - 1 ? "pending" : "completed";
  };

  return (
    <div className="page-container">

      <section className="trace-layout">

        <article className="panel">

          <div className="panel-header">
            <h3>Farm-to-Fork Timeline</h3>

            <select
              value={selectedId || ""}
              onChange={(e) =>
                setSelectedId(
                  e.target.value
                )
              }
              disabled={shipments.length === 0}
            >
              {shipments.map(
                (shipment) => (
                  <option
                    key={shipment.id}
                    value={shipment.id}
                  >
                    {displayValue(shipment.id)} —{" "}
                    {displayValue(shipment.productName || shipment.product, "Unknown product")}
                  </option>
                )
              )}
              {shipments.length === 0 && (
                <option value="" disabled>
                  No shipments available
                </option>
              )}
            </select>
          </div>

          <div className="timeline">

            {timelineLoading && (
              <div style={{ textAlign: "center", padding: "40px" }}>
                <FaSpinner className="fa-spin" style={{ fontSize: "24px", color: "#10b981" }} />
                <p style={{ marginTop: "12px", color: "#64748b" }}>Loading timeline...</p>
              </div>
            )}

            {!timelineLoading && timeline.length === 0 && (
              <div style={{ textAlign: "center", padding: "40px", color: "#64748b" }}>
                <FaBell style={{ fontSize: "24px", marginBottom: "12px" }} />
                <p>No timeline events found for this shipment.</p>
              </div>
            )}

            {timeline.map(
              (event, index) => {
                const status = mapTimelineStatus(event.type, index, timeline.length);
                return (
                  <div
                    className={`tl-item ${status}`}
                    key={index}
                  >
                    <div className="tl-marker">
                      {status ===
                      "completed" ? (
                        <FaCheck />
                      ) : status ===
                        "current" ? (
                        <FaTruck />
                      ) : (
                        <FaClock />
                      )}
                    </div>

                    <div className="tl-line" />

                    <div className="tl-body">
                      <div className="tl-title">
                        {displayValue(event.type, "Event")}
                      </div>

                      <div className="tl-sub">
                        {displayValue(event.location, "Unknown location")}
                      </div>

                      <div className="tl-time">
                        {event.timestamp ? formatDate(event.timestamp) : "—"}
                      </div>
                    </div>

                    <span
                      className={`tl-status ${status}`}
                    >
                      {STATUS_LABEL[status]}
                    </span>
                  </div>
                );
              }
            )}

          </div>

        </article>

        <div className="trace-side">

          <article className="panel integrity-card">

            <div className="panel-header">
              <h3>Data Integrity</h3>
            </div>

            {integrityLoading ? (
              <div style={{ textAlign: "center", padding: "20px" }}>
                <FaSpinner className="fa-spin" style={{ fontSize: "20px", color: "#10b981" }} />
                <p style={{ marginTop: "8px", color: "#64748b", fontSize: "13px" }}>Verifying...</p>
              </div>
            ) : integrity ? (
              <>
                <div className="integrity-badge">
                  {integrity.verified ? (
                    <>
                      <FaCheck /> Verified
                    </>
                  ) : (
                    <>
                      <FaBell style={{ color: "#f59e0b" }} /> Issues Found
                    </>
                  )}
                </div>

                <p>
                  {integrity.verified
                    ? "Shipment records have not been modified."
                    : "Integrity check found discrepancies."}
                </p>

                <dl className="integrity-list">
                  <dt>Latest Record Hash</dt>
                  <dd>
                    {integrity.checkpoints && integrity.checkpoints.length > 0
                      ? integrity.checkpoints[integrity.checkpoints.length - 1].recordHash
                      : "N/A"}
                  </dd>

                  <dt>Previous Hash</dt>
                  <dd>
                    {integrity.checkpoints && integrity.checkpoints.length > 1
                      ? integrity.checkpoints[integrity.checkpoints.length - 2].recordHash
                      : "N/A"}
                  </dd>

                  <dt>Verification</dt>
                  <dd>{integrity.verified ? "Records unchanged" : "Records modified"}</dd>

                  <dt>Checkpoints</dt>
                  <dd>{integrity.checkpointCount || 0}</dd>

                  {integrity.blockchainMode && (
                    <>
                      <dt>Blockchain Mode</dt>
                      <dd>{integrity.blockchainMode}</dd>
                    </>
                  )}
                </dl>

                {integrity.blockchainMode === "simulated" && (
                  <p className="fine-print">
                    Blockchain running in simulated mode.
                  </p>
                )}
              </>
            ) : (
              <div className="data-unavailable" style={{ padding: "20px", textAlign: "center" }}>
                <FaBell style={{ fontSize: "20px", color: "#f59e0b", marginBottom: "8px" }} />
                <p>Integrity verification unavailable for this shipment.</p>
              </div>
            )}

          </article>

          <article className="panel qr-card">

            <div className="panel-header">
              <h3>QR Code</h3>
            </div>

            <div className="qr-display" ref={qrRef}>
              {qrGenerated && qrData ? (
                <QRCodeCanvas
                  value={qrData.traceUrl || qrData.qrDataUrl}
                  size={170}
                  fgColor="#145C46"
                  level="M"
                />
              ) : qrLoading ? (
                <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "170px" }}>
                  <FaSpinner className="fa-spin" style={{ fontSize: "24px", color: "#10b981" }} />
                </div>
              ) : (
                <FaQrcode className="qr-placeholder-icon" />
              )}
            </div>

            {qrData && (
              <dl className="qr-meta">
                <dt>Shipment ID:</dt>
                <dd>{displayValue(qrData.trackingId || selectedId)}</dd>

                <dt>Product:</dt>
                <dd>{displayValue(shipment?.productName || shipment?.product, "N/A")}</dd>

                <dt>Source:</dt>
                <dd>{displayValue(shipment?.source, "N/A")}</dd>

                <dt>Destination:</dt>
                <dd>{displayValue(shipment?.destination, "N/A")}</dd>
              </dl>
            )}

            <div className="qr-actions">
              <button
                className="btn ghost small"
                onClick={handleGenerateQr}
                disabled={qrLoading || !selectedId}
              >
                <FaQrcode /> {qrGenerated ? "Regenerate QR" : "Generate QR"}
              </button>

              <button
                className="btn ghost small"
                onClick={handleDownload}
                disabled={!qrGenerated || qrLoading}
              >
                <FaDownload /> Download
              </button>

              <button
                className="btn ghost small"
                onClick={handlePrint}
                disabled={!qrGenerated}
              >
                <FaPrint /> Print Label
              </button>
            </div>

          </article>

        </div>

      </section>

      {toastMessage && (
        <div className="toast-container">
          <div className="toast">
            <FaCheck />
            {toastMessage}
          </div>
        </div>
      )}

    </div>
  );
}

export default Traceability;