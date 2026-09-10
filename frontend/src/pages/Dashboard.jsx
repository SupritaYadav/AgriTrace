import { Link } from "react-router-dom";

import {
  FaBoxOpen,
  FaMicrochip,
  FaTriangleExclamation,
  FaLeaf,
  FaTemperatureHalf,
  FaDroplet,
  FaBatteryThreeQuarters,
  FaTruck,
  FaWarehouse,
  FaTractor,
  FaStore,
  FaWind,
  FaEye,
  FaArrowUp,
  FaArrowDown,
  FaMinus,
  FaPlugCircleXmark,
} from "react-icons/fa6";

import { FaCheckCircle } from "react-icons/fa";

import {
  shipments,
  devices,
  alerts,
} from "../data/mockData";

function getShipmentBadgeClass(status) {
  switch (status) {
    case "In Transit":
      return "transit";

    case "Delivered":
      return "delivered";

    case "Delayed":
      return "delayed";

    case "Warehouse":
      return "warehouse";

    case "Alert":
      return "alert";

    default:
      return "transit";
  }
}

function Dashboard() {
  const activeShipments = shipments.filter(
    (shipment) => shipment.status !== "Delivered"
  );

  const onlineDevices = devices.filter(
    (device) =>
      device.status === "Online" ||
      device.status === "Assigned"
  );

  const offlineDevices = devices.filter(
    (device) => device.status === "Offline"
  );

  const criticalAlerts = alerts.filter(
    (alert) =>
      alert.severity === "Critical" &&
      !alert.resolved
  );

  const unresolvedAlerts = alerts.filter(
    (alert) => !alert.resolved
  );

  const metrics = [
    {
      title: "Active Shipments",
      value: activeShipments.length,
      icon: <FaBoxOpen />,
      iconClass: "blue",
      trend: "+3 since yesterday",
      trendType: "up",
    },

    {
      title: "Completed Shipments",
      value: 148,
      icon: <FaCheckCircle />,
      iconClass: "green",
      trend: "+12 this week",
      trendType: "up",
    },

    {
      title: "Online Devices",
      value: onlineDevices.length,
      icon: <FaMicrochip />,
      iconClass: "green",
      trend: "Stable",
      trendType: "flat",
    },

    {
      title: "Offline Devices",
      value: offlineDevices.length,
      icon: <FaPlugCircleXmark />,
      iconClass: "red",
      trend: "+1 since yesterday",
      trendType: "down",
    },

    {
      title: "Critical Alerts",
      value: criticalAlerts.length,
      icon: <FaTriangleExclamation />,
      iconClass: "amber",
      trend: "Needs attention",
      trendType: "down",
    },

    {
      title: "Product Batches",
      value: 35,
      icon: <FaLeaf />,
      iconClass: "purple",
      trend: "+2 today",
      trendType: "up",
    },
  ];

  const journeyStages = [
    {
      label: "Farm",
      count: 5,
      icon: <FaTractor />,
    },

    {
      label: "Collection Center",
      count: 3,
      icon: <FaWarehouse />,
    },

    {
      label: "Transport",
      count: 5,
      icon: <FaTruck />,
    },

    {
      label: "Warehouse",
      count: 1,
      icon: <FaWarehouse />,
    },

    {
      label: "Retailer",
      count: 1,
      icon: <FaStore />,
    },
  ];

  const recentShipments = shipments.slice(0, 5);

  const recentAlerts = unresolvedAlerts.slice(0, 3);

  const renderTrendIcon = (type) => {
    if (type === "up") {
      return <FaArrowUp />;
    }

    if (type === "down") {
      return <FaArrowDown />;
    }

    return <FaMinus />;
  };

  const getAlertIconClass = (alert) => {
    if (alert.type === "Device") {
      return "device";
    }

    if (alert.severity === "Critical") {
      return "critical";
    }

    return "warning";
  };

  return (
    <section className="page active dashboard-page" id="page-dashboard">
      {/* =========================
          HERO
      ========================= */}

      <section className="hero-banner">
        <div className="hero-text">
          <h2>Good Morning, Kritika</h2>

          <p>
            Here is what is happening across your supply
            chain today.
          </p>
        </div>

        <div className="hero-illustration">
          <FaTruck />
        </div>
      </section>

      {/* =========================
          METRICS
      ========================= */}

      <section className="metric-grid">
        {metrics.map((metric) => (
          <article
            className="metric-card"
            key={metric.title}
          >
            <div
              className={`metric-icon ${metric.iconClass}`}
            >
              {metric.icon}
            </div>

            <div className="metric-value">
              {metric.value}
            </div>

            <div className="metric-label">
              {metric.title}
            </div>

            <div
              className={`metric-trend ${metric.trendType}`}
            >
              {renderTrendIcon(metric.trendType)}

              <span>{metric.trend}</span>
            </div>
          </article>
        ))}
      </section>

      {/* =========================
          SUPPLY CHAIN + ENVIRONMENT
      ========================= */}

      <section className="grid-2col">
        {/* Supply chain */}

        <article className="card panel dashboard-journey-panel">
          <div className="panel-head">
            <h3>Supply Chain Overview</h3>

            <span className="muted-text">
              Live shipment distribution by stage
            </span>
          </div>

          <div className="journey-track">
            {journeyStages.map(
              (stage, index) => (
                <div
                  className="journey-node"
                  key={stage.label}
                >
                  {index !==
                    journeyStages.length - 1 && (
                    <div className="journey-line" />
                  )}

                  <div className="jn-icon">
                    {stage.icon}
                  </div>

                  <div className="jn-count">
                    {stage.count}
                  </div>

                  <div className="jn-label">
                    {stage.label}
                  </div>
                </div>
              )
            )}
          </div>
        </article>

        {/* Environmental */}

        <article className="card panel dashboard-environment-panel">
          <div className="panel-head">
            <h3>Environmental Overview</h3>

            <span className="muted-text">
              Network-wide sensor averages
            </span>
          </div>

          <div className="env-grid">
            <div className="env-item">
              <FaTemperatureHalf />

              <div className="env-value">
                23.6°C
              </div>

              <div className="env-label">
                Average Temperature
              </div>
            </div>

            <div className="env-item">
              <FaDroplet />

              <div className="env-value">
                64%
              </div>

              <div className="env-label">
                Average Humidity
              </div>
            </div>

            <div className="env-item">
              <FaWind />

              <div className="env-value">
                Normal
              </div>

              <div className="env-label">
                Average Gas Level
              </div>
            </div>

            <div className="env-item">
              <FaBatteryThreeQuarters />

              <div className="env-value">
                78%
              </div>

              <div className="env-label">
                Device Battery Health
              </div>
            </div>
          </div>
        </article>
      </section>

      {/* =========================
          RECENT DATA
      ========================= */}

      <section className="grid-2col-wide">
        {/* Recent shipments */}

        <article className="card panel recent-shipments-panel">
          <div className="panel-head dashboard-section-head">
            <h3>Recent Shipments</h3>

            <Link
              to="/shipments/active"
              className="link-btn"
            >
              View all
              <span>→</span>
            </Link>
          </div>

          <div className="table-scroll">
            <table className="data-table dashboard-table">
              <thead>
                <tr>
                  <th>Shipment ID</th>
                  <th>Product</th>
                  <th>Source</th>
                  <th>Destination</th>
                  <th>Device</th>
                  <th>Status</th>
                  <th>Temp</th>
                  <th>Updated</th>
                  <th></th>
                </tr>
              </thead>

              <tbody>
                {recentShipments.map(
                  (shipment) => (
                    <tr key={shipment.id}>
                      <td>
                        <span className="mono-id">
                          {shipment.id}
                        </span>
                      </td>

                      <td>
                        {shipment.product}
                      </td>

                      <td>
                        {shipment.source}
                      </td>

                      <td>
                        {shipment.destination}
                      </td>

                      <td>
                        {shipment.device || "—"}
                      </td>

                      <td>
                        <span
                          className={`badge ${getShipmentBadgeClass(
                            shipment.status
                          )}`}
                        >
                          {shipment.status}
                        </span>
                      </td>

                      <td>
                        {shipment.temp}°C
                      </td>

                      <td>
                        {shipment.updated}
                      </td>

                      <td>
                        <Link
                          to={`/shipments/${shipment.id}`}
                          className="icon-action"
                          title="View shipment"
                        >
                          <FaEye />
                        </Link>
                      </td>
                    </tr>
                  )
                )}
              </tbody>
            </table>
          </div>
        </article>

        {/* Recent alerts */}

        <article className="card panel recent-alerts-panel">
          <div className="panel-head dashboard-section-head">
            <h3>Recent Alerts</h3>

            <Link
              to="/alerts"
              className="link-btn"
            >
              View all
              <span>→</span>
            </Link>
          </div>

          <div className="alert-list">
            {recentAlerts.map((alert) => {
              const iconClass =
                getAlertIconClass(alert);

              return (
                <div
                  className={`alert-row ${iconClass}`}
                  key={alert.id}
                >
                  <div className="ai">
                    {alert.type === "Device" ? (
                      <FaMicrochip />
                    ) : (
                      <FaTriangleExclamation />
                    )}
                  </div>

                  <div className="alert-content">
                    <div className="alert-title">
                      {alert.title}
                    </div>

                    <div className="alert-sub">
                      {alert.shipment} ·{" "}
                      {alert.detail}
                    </div>
                  </div>

                  <div className="alert-time">
                    {alert.time}
                  </div>
                </div>
              );
            })}
          </div>
        </article>
      </section>
    </section>
  );
}

export default Dashboard;