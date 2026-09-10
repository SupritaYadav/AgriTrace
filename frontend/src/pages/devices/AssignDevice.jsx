import { useState } from "react";
import {
  FaMicrochip,
  FaBoxOpen,
  FaArrowRightArrowLeft,
} from "react-icons/fa6";

import {
  devices as initialDevices,
  shipments,
} from "../../data/mockData";

function AssignDevice() {
  const [devices, setDevices] =
    useState(initialDevices);

  const [selectedDevice, setSelectedDevice] =
    useState("");

  const [
    selectedShipment,
    setSelectedShipment,
  ] = useState("");

  const [message, setMessage] =
    useState("");

  const availableDevices = devices.filter(
    (device) => device.status === "Available"
  );

  const unassignedShipments =
    shipments.filter(
      (shipment) => !shipment.device
    );

  function assignDevice() {
    if (
      !selectedDevice ||
      !selectedShipment
    ) {
      setMessage(
        "Select both a device and shipment."
      );
      return;
    }

    setDevices((previous) =>
      previous.map((device) =>
        device.id === selectedDevice
          ? {
              ...device,
              status: "Assigned",
              shipment:
                selectedShipment,
            }
          : device
      )
    );

    setMessage(
      `${selectedDevice} assigned to ${selectedShipment}.`
    );

    setSelectedDevice("");
    setSelectedShipment("");
  }

  return (
    <div className="page-container">

      {message && (
        <div className="status-banner safe">
          {message}
        </div>
      )}

      <section className="assign-grid">

        <article className="panel">

          <div className="panel-header">
            <h3>
              Available Devices
            </h3>
          </div>

          <div className="pick-list">

            {availableDevices.map(
              (device) => (
                <button
                  key={device.id}
                  className={`pick-item ${
                    selectedDevice ===
                    device.id
                      ? "selected"
                      : ""
                  }`}
                  onClick={() =>
                    setSelectedDevice(
                      device.id
                    )
                  }
                >
                  <FaMicrochip />

                  <div>
                    <div className="pi-title">
                      {device.id}
                    </div>

                    <div className="pi-sub">
                      Battery{" "}
                      {device.battery}% ·
                      Last seen{" "}
                      {device.lastSeen}
                    </div>
                  </div>
                </button>
              )
            )}

          </div>

        </article>

        <div className="assign-center">

          <FaArrowRightArrowLeft />

          <button
            className="btn primary"
            onClick={assignDevice}
            disabled={
              !selectedDevice ||
              !selectedShipment
            }
          >
            Assign Device
          </button>

        </div>

        <article className="panel">

          <div className="panel-header">
            <h3>
              Active Shipments Without
              Devices
            </h3>
          </div>

          <div className="pick-list">

            {unassignedShipments.map(
              (shipment) => (
                <button
                  key={shipment.id}
                  className={`pick-item ${
                    selectedShipment ===
                    shipment.id
                      ? "selected"
                      : ""
                  }`}
                  onClick={() =>
                    setSelectedShipment(
                      shipment.id
                    )
                  }
                >
                  <FaBoxOpen />

                  <div>
                    <div className="pi-title">
                      {shipment.id}
                    </div>

                    <div className="pi-sub">
                      {shipment.product} ·{" "}
                      {shipment.source} →{" "}
                      {shipment.destination}
                    </div>
                  </div>
                </button>
              )
            )}

          </div>

        </article>

      </section>

    </div>
  );
}

export default AssignDevice;