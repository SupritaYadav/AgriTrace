import {
  history as completedShipments,
} from "../../data/mockData";

function getStatusClass(status) {
  switch (status) {
    case "Delivered":
      return "delivered";

    case "In Transit":
      return "transit";

    case "Delayed":
      return "delayed";

    case "Warehouse":
      return "warehouse";

    case "Alert":
      return "alert";

    default:
      return "delivered";
  }
}

function ShipmentHistory() {
  return (
    <div className="shipment-history-page">
      <section className="card history-panel">
        <div className="history-panel-head">
          <h3>Shipment History</h3>

          <span className="history-count">
            148 completed shipments
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
              {completedShipments.map(
                (shipment) => (
                  <tr key={shipment.id}>
                    <td>
                      <span className="history-shipment-id">
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
                        className={`badge ${getStatusClass(
                          shipment.status
                        )}`}
                      >
                        {shipment.status}
                      </span>
                    </td>

                    <td>
                      {shipment.temp !==
                      undefined
                        ? `${shipment.temp}°C`
                        : "—"}
                    </td>

                    <td>
                      {shipment.updated ||
                        "—"}
                    </td>
                  </tr>
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