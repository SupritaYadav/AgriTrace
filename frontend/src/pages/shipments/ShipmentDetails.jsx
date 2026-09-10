import { useParams } from "react-router-dom";

import {
  FaTemperatureHalf,
  FaDroplet,
  FaLeaf,
  FaBatteryThreeQuarters,
  FaMicrochip,
  FaLocationDot,
} from "react-icons/fa6";

import { shipments } from "../../data/mockData";

import Badge from "../../components/common/Badge";
import SensorCard from "../../components/common/SensorCard";

function ShipmentDetails() {
  const { id } = useParams();

  const shipment = shipments.find(
    (item) => item.id === id
  );

  if (!shipment) {
    return (
      <div className="page-container">
        <section className="panel">
          Shipment not found.
        </section>
      </div>
    );
  }

  const journey = [
    {
      name: "Shipment Created",
      complete: true,
    },
    {
      name: "Device Assigned",
      complete: Boolean(shipment.device),
    },
    {
      name: "Dispatched",
      complete: true,
    },
    {
      name: "In Transit",
      current:
        shipment.status === "In Transit",
      complete:
        shipment.status !== "In Transit",
    },
    {
      name: "Warehouse Received",
      complete:
        shipment.status === "Warehouse",
    },
    {
      name: "Retailer Received",
      complete: false,
    },
  ];

  return (
    <div className="page-container">

      <section className="shipment-detail-header panel">

        <div>
          <span className="eyebrow">
            SHIPMENT DETAILS
          </span>

          <h2>
            {shipment.id}
          </h2>

          <p>
            {shipment.product} •{" "}
            {shipment.source} →{" "}
            {shipment.destination}
          </p>
        </div>

        <Badge
          status={shipment.status}
        />

      </section>

      <section className="sensor-grid">

        <SensorCard
          icon={<FaTemperatureHalf />}
          title="Temperature"
          value={`${shipment.temperature}°C`}
          subtitle="Safe: 8°C – 28°C"
          status={
            shipment.temperature > 28
              ? "warning"
              : "safe"
          }
        />

        <SensorCard
          icon={<FaDroplet />}
          title="Humidity"
          value={`${shipment.humidity}%`}
          subtitle="Safe: 40% – 80%"
          status={
            shipment.humidity > 80
              ? "warning"
              : "safe"
          }
        />

        <SensorCard
          icon={<FaLeaf />}
          title="Gas Status"
          value={shipment.gas}
          subtitle="Environmental condition"
          status={
            shipment.gas === "Safe"
              ? "safe"
              : "warning"
          }
        />

        <SensorCard
          icon={<FaBatteryThreeQuarters />}
          title="Battery"
          value={`${shipment.battery}%`}
          subtitle={shipment.device || "No device"}
          status={
            shipment.battery < 30
              ? "warning"
              : "safe"
          }
        />

      </section>

      <section className="panel">

        <div className="panel-header">
          <h3>
            Shipment Progress
          </h3>
        </div>

        <div className="timeline-horizontal">

          {journey.map((step, index) => (
            <div
              className="timeline-step"
              key={step.name}
            >

              <div
                className={`timeline-dot ${
                  step.current
                    ? "current"
                    : step.complete
                    ? "completed"
                    : ""
                }`}
              />

              <span>
                {step.name}
              </span>

              {index <
                journey.length - 1 && (
                <div className="timeline-connector" />
              )}

            </div>
          ))}

        </div>

      </section>

      <section className="dashboard-two-column">

        <article className="panel">

          <div className="panel-header">
            <h3>
              Shipment Information
            </h3>
          </div>

          <div className="details-grid">

            <Detail
              label="Product"
              value={shipment.product}
            />

            <Detail
              label="Batch"
              value={shipment.batch}
            />

            <Detail
              label="Quantity"
              value={shipment.quantity}
            />

            <Detail
              label="Device"
              value={
                shipment.device ||
                "Not Assigned"
              }
            />

            <Detail
              label="Vehicle"
              value={shipment.vehicle}
            />

            <Detail
              label="Driver"
              value={shipment.driver}
            />

            <Detail
              label="Started"
              value={shipment.startDate}
            />

            <Detail
              label="Expected Delivery"
              value={shipment.eta}
            />

          </div>

        </article>

        <article className="panel">

          <div className="panel-header">
            <h3>
              Current Location
            </h3>
          </div>

          <div className="location-card">

            <FaLocationDot />

            <h3>
              {shipment.currentLocation}
            </h3>

            <p>
              {shipment.coordinates}
            </p>

            <div className="location-stats">

              <div>
                <span>Remaining</span>
                <strong>
                  {
                    shipment.distanceRemaining
                  }
                </strong>
              </div>

              <div>
                <span>Arrival</span>
                <strong>
                  {
                    shipment.estimatedArrival
                  }
                </strong>
              </div>

            </div>

          </div>

        </article>

      </section>

      <section className="panel">

        <div className="panel-header">
          <h3>
            Device Connection
          </h3>
        </div>

        <div className="device-inline-info">

          <FaMicrochip />

          <div>
            <strong>
              {shipment.device ||
                "No IoT node assigned"}
            </strong>

            <p>
              Current monitoring device for
              this shipment.
            </p>
          </div>

        </div>

      </section>

    </div>
  );
}

function Detail({ label, value }) {
  return (
    <div className="detail-item">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

export default ShipmentDetails;