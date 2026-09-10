import { useState, useEffect, useRef } from "react";
import { QRCodeCanvas } from "qrcode.react";

import {
  FaCheck,
  FaClock,
  FaTruck,
  FaQrcode,
  FaDownload,
  FaPrint,
} from "react-icons/fa6";

import {
  shipments,
} from "../data/mockData";

const STATUS_LABEL = {
  completed: "Completed",
  current: "Current",
  pending: "Pending",
};

function Traceability() {
  const [selectedId, setSelectedId] =
    useState("AGR-SHP-001");

  const [qrGenerated, setQrGenerated] =
    useState(false);

  const [toastMessage, setToastMessage] =
    useState("");

  const qrRef = useRef(null);

  const shipment = shipments.find(
    (item) => item.id === selectedId
  );

  // Reset the QR preview whenever the shipment changes so we
  // never show a stale code for the wrong shipment.
  useEffect(() => {
    setQrGenerated(false);
  }, [selectedId]);

  function handleGenerate() {
    setQrGenerated(true);
    setToastMessage(
      `QR generated for ${shipment.id}`
    );
    setTimeout(() => setToastMessage(""), 3000);
  }

  function handleDownload() {
    const canvas =
      qrRef.current?.querySelector("canvas") ||
      qrRef.current;

    if (!canvas || !canvas.toDataURL) return;

    const link = document.createElement("a");
    link.href = canvas.toDataURL("image/png");
    link.download = `${shipment.id}-qr.png`;
    link.click();
  }

  function handlePrint() {
    window.print();
  }

  const timeline = [
    {
      title: "Batch Created",
      location: shipment.source,
      date: "05 Sep 2026 • 08:30 AM",
      status: "completed",
    },

    {
      title: "Quality Check Completed",
      location: shipment.source,
      date: "05 Sep 2026 • 10:10 AM",
      status: "completed",
    },

    {
      title: "Shipment Created",
      location: shipment.id,
      date: "06 Sep 2026 • 07:45 AM",
      status: "completed",
    },

    {
      title: "IoT Device Assigned",
      location:
        shipment.device ||
        "Device pending",
      date: "06 Sep 2026 • 08:00 AM",
      status: shipment.device
        ? "completed"
        : "pending",
    },

    {
      title: "Dispatched From Farm",
      location: shipment.source,
      date: "06 Sep 2026 • 08:30 AM",
      status: "completed",
    },

    {
      title: "Reached Collection Center",
      location: "En route",
      date: "—",
      status: "completed",
    },

    {
      title: "Currently In Transit",
      location:
        shipment.currentLocation,
      date: "Current stage",
      status: "current",
    },

    {
      title: "Warehouse Receiving",
      location: shipment.destination,
      date: "Pending",
      status: "pending",
    },

    {
      title: "Retailer Receiving",
      location: shipment.destination,
      date: "Pending",
      status: "pending",
    },
  ];

  return (
    <div className="page-container">

      <section className="trace-layout">

        <article className="panel">

          <div className="panel-header">
            <h3>Farm-to-Fork Timeline</h3>

            <select
              value={selectedId}
              onChange={(e) =>
                setSelectedId(
                  e.target.value
                )
              }
            >
              {shipments.map(
                (shipment) => (
                  <option
                    key={shipment.id}
                    value={shipment.id}
                  >
                    {shipment.id} —{" "}
                    {shipment.product}
                  </option>
                )
              )}
            </select>
          </div>

          <div className="timeline">

            {timeline.map(
              (event, index) => (
                <div
                  className={`tl-item ${event.status}`}
                  key={
                    event.title + index
                  }
                >
                  <div className="tl-marker">
                    {event.status ===
                    "completed" ? (
                      <FaCheck />
                    ) : event.status ===
                      "current" ? (
                      <FaTruck />
                    ) : (
                      <FaClock />
                    )}
                  </div>

                  <div className="tl-line" />

                  <div className="tl-body">
                    <div className="tl-title">
                      {event.title}
                    </div>

                    <div className="tl-sub">
                      {event.location}
                    </div>

                    <div className="tl-time">
                      {event.date}
                    </div>
                  </div>

                  <span
                    className={`tl-status ${event.status}`}
                  >
                    {STATUS_LABEL[event.status]}
                  </span>
                </div>
              )
            )}

          </div>

        </article>

        <div className="trace-side">

          <article className="panel integrity-card">

            <div className="panel-header">
              <h3>Data Integrity</h3>
            </div>

            <div className="integrity-badge">
              <FaCheck /> Verified
            </div>

            <p>
              Shipment records have not
              been modified.
            </p>

            <dl className="integrity-list">
              <dt>Latest Record Hash</dt>
              <dd>0x91de7204fe88a2f30cc9...</dd>

              <dt>Previous Hash</dt>
              <dd>0x74ab9030bd21af493...</dd>

              <dt>Verification</dt>
              <dd>Records unchanged</dd>
            </dl>

            <p className="fine-print">
              Visual blockchain mockup for
              demonstration purposes only.
            </p>

          </article>

          <article className="panel qr-card">

            <div className="panel-header">
              <h3>QR Code</h3>
            </div>

            <div className="qr-display" ref={qrRef}>
              {qrGenerated ? (
                <QRCodeCanvas
                  value={`https://agritrace.demo/trace/${shipment.id}`}
                  size={170}
                  fgColor="#145C46"
                  level="M"
                />
              ) : (
                <FaQrcode className="qr-placeholder-icon" />
              )}
            </div>

            <dl className="qr-meta">
              <dt>Shipment ID:</dt>
              <dd>{shipment.id}</dd>

              <dt>Batch ID:</dt>
              <dd>
                {shipment.batchId ||
                  `AGR-BATCH-${shipment.id.slice(-3)}`}
              </dd>

              <dt>Product:</dt>
              <dd>{shipment.product}</dd>

              <dt>Source:</dt>
              <dd>{shipment.source}</dd>

              <dt>Destination:</dt>
              <dd>{shipment.destination}</dd>
            </dl>

            <div className="qr-actions">
              <button
                className="btn ghost small"
                onClick={handleGenerate}
              >
                <FaQrcode /> Generate QR
              </button>

              <button
                className="btn ghost small"
                onClick={handleDownload}
                disabled={!qrGenerated}
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