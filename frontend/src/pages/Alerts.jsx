import { useState } from "react";
import { useNavigate } from "react-router-dom";

import {
  FaTriangleExclamation,
  FaMicrochip,
} from "react-icons/fa6";

import {
  alerts as initialAlerts,
} from "../data/mockData";

const FILTERS = [
  "All",
  "Critical",
  "Warning",
  "Device",
  "Environmental",
  "Resolved",
];

function Alerts() {
  const navigate = useNavigate();

  const [alerts, setAlerts] =
    useState(
      initialAlerts.map((alert) => ({
        ...alert,
        resolved: false,
      }))
    );

  const [filter, setFilter] =
    useState("All");

  const filteredAlerts = alerts.filter(
    (alert) => {
      if (filter === "All") return true;

      if (filter === "Resolved")
        return alert.resolved;

      // "Environmental" covers everything that isn't a
      // device-type alert (temperature/humidity/gas issues).
      // Adjust this if your alert objects carry a separate
      // `type` field distinguishing this from `severity`.
      if (filter === "Environmental")
        return (
          alert.severity !== "Device" &&
          !alert.resolved
        );

      return (
        alert.severity === filter &&
        !alert.resolved
      );
    }
  );

  function resolveAlert(id) {
    setAlerts((previous) =>
      previous.map((alert) =>
        alert.id === id
          ? { ...alert, resolved: true }
          : alert
      )
    );
  }

  function dismissAlert(id) {
    setAlerts((previous) =>
      previous.filter(
        (alert) => alert.id !== id
      )
    );
  }

  function viewShipment(alert) {
    // Best-effort guess at the shipment id an alert points to —
    // adjust the field name if your mock data stores it
    // differently (e.g. alert.shipmentId).
    const shipmentId =
      alert.shipment || alert.target;

    if (shipmentId) {
      navigate(`/shipments/${shipmentId}`);
    }
  }

  return (
    <div className="page-container">

      <section className="card panel alert-filter-row">

        {FILTERS.map((item) => (
          <button
            key={item}
            onClick={() => setFilter(item)}
            className={`chip ${
              filter === item ? "active" : ""
            }`}
          >
            {item}
          </button>
        ))}

      </section>

      <section className="alert-center-list">

        {filteredAlerts.map((alert) => (
          <article
            className={`alert-card ${alert.severity.toLowerCase()} ${
              alert.resolved ? "resolved" : ""
            }`}
            key={alert.id}
          >

            <div className="ai">
              {alert.severity === "Device" ? (
                <FaMicrochip />
              ) : (
                <FaTriangleExclamation />
              )}
            </div>

            <div className="alert-body">

              <div className="alert-card-title">
                <span
                  className={`tag-${alert.severity.toLowerCase()}`}
                >
                  {alert.severity.toUpperCase()}
                </span>

                {alert.title}
              </div>

              <div className="alert-card-sub">
                {alert.target} · {alert.detail}
              </div>

              <div className="alert-card-time">
                {alert.resolved
                  ? `Resolved · ${alert.time}`
                  : alert.time}
              </div>

              <div className="alert-card-actions">
                <button
                  className="btn ghost small"
                  onClick={() =>
                    viewShipment(alert)
                  }
                >
                  View Shipment
                </button>

                {!alert.resolved && (
                  <button
                    className="btn primary small"
                    onClick={() =>
                      resolveAlert(alert.id)
                    }
                  >
                    Mark Resolved
                  </button>
                )}

                <button
                  className="btn ghost small"
                  onClick={() =>
                    dismissAlert(alert.id)
                  }
                >
                  Dismiss
                </button>
              </div>

            </div>

          </article>
        ))}

      </section>

    </div>
  );
}

export default Alerts;