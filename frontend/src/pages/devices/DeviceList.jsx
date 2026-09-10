import { devices } from "../../data/mockData";
import { FaWaveSquare } from "react-icons/fa6";
import Badge from "../../components/common/Badge";

function DeviceList() {
  return (
    <div className="page-container">

      <section className="panel">

        <div className="panel-header">
          <h3>IoT Device Fleet</h3>
          <p>All registered AgriTrace sensor nodes</p>
        </div>

        <div className="table-wrapper">

          <table className="data-table">

            <thead>
              <tr>
                <th>Device ID</th>
                <th>Status</th>
                <th>Assigned Shipment</th>
                <th>Battery</th>
                <th>Last Seen</th>
                <th>Temperature</th>
                <th>Firmware</th>
                <th></th>
              </tr>
            </thead>

            <tbody>

              {devices.map((device) => (
                <tr key={device.id}>

                  <td className="mono-id">
                    {device.id}
                  </td>

                  <td>
                    <Badge status={device.status} />
                  </td>

                  <td>
                    {device.shipment || "—"}
                  </td>

                  <td>
                    <div className="battery-cell">

                      <div className="battery-bar">
                        <span
                          style={{
                            width:
                              device.battery +
                              "%",
                          }}
                        />
                      </div>

                      {device.battery}%

                    </div>
                  </td>

                  <td>
                    {device.lastSeen}
                  </td>

                  <td>
                    {device.temperature}°C
                  </td>

                  <td>
                    {device.firmware}
                  </td>

                  <td>
                    <button
                      className="icon-action"
                      title="View device signal"
                    >
                      <FaWaveSquare />
                    </button>
                  </td>

                </tr>
              ))}

            </tbody>

          </table>

        </div>

      </section>

    </div>
  );
}

export default DeviceList;