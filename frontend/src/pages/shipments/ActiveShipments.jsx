import {
  useMemo,
  useState,
} from "react";

import {
  Link,
} from "react-router-dom";

import {
  FaMagnifyingGlass,
  FaLocationDot,
  FaArrowRight,
  FaGrip,
  FaList,
} from "react-icons/fa6";

import {
  shipments,
} from "../../data/mockData";

function getStatusClass(status) {
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

function ActiveShipments() {
  const [search, setSearch] =
    useState("");

  const [status, setStatus] =
    useState("");

  const [product, setProduct] =
    useState("");

  const [sort, setSort] =
    useState("recent");

  const [view, setView] =
    useState("grid");

  const products = useMemo(() => {
    return [
      ...new Set(
        shipments
          .filter(
            (shipment) =>
              shipment.status !==
              "Delivered"
          )
          .map(
            (shipment) =>
              shipment.product
          )
      ),
    ];
  }, []);

  const filteredShipments =
    useMemo(() => {
      let list = shipments
        .filter(
          (shipment) =>
            shipment.status !==
            "Delivered"
        )
        .filter((shipment) => {
          const query =
            search
              .trim()
              .toLowerCase();

          const matchesSearch =
            !query ||
            shipment.id
              .toLowerCase()
              .includes(query) ||
            shipment.product
              .toLowerCase()
              .includes(query) ||
            shipment.destination
              .toLowerCase()
              .includes(query);

          const matchesStatus =
            !status ||
            shipment.status ===
              status;

          const matchesProduct =
            !product ||
            shipment.product ===
              product;

          return (
            matchesSearch &&
            matchesStatus &&
            matchesProduct
          );
        });

      if (sort === "temp") {
        list = [...list].sort(
          (a, b) =>
            b.temp - a.temp
        );
      }

      if (sort === "id") {
        list = [...list].sort(
          (a, b) =>
            a.id.localeCompare(
              b.id
            )
        );
      }

      return list;
    }, [
      search,
      status,
      product,
      sort,
    ]);

  const stageLabels = [
    "Farm",
    "Transit",
    "Warehouse",
    "Retailer",
  ];

  return (
    <div className="active-shipments-page">
      {/* =========================
          FILTER TOOLBAR
      ========================= */}

      <section className="shipment-toolbar card">
        <div className="shipment-search">
          <FaMagnifyingGlass />

          <input
            type="text"
            placeholder="Search by ID, product, destination..."
            value={search}
            onChange={(e) =>
              setSearch(
                e.target.value
              )
            }
          />
        </div>

        <select
          value={status}
          onChange={(e) =>
            setStatus(
              e.target.value
            )
          }
        >
          <option value="">
            All Status
          </option>

          <option value="In Transit">
            In Transit
          </option>

          <option value="Delayed">
            Delayed
          </option>

          <option value="Warehouse">
            Warehouse
          </option>

          <option value="Alert">
            Alert
          </option>
        </select>

        <select
          value={product}
          onChange={(e) =>
            setProduct(
              e.target.value
            )
          }
        >
          <option value="">
            All Products
          </option>

          {products.map(
            (item) => (
              <option
                key={item}
                value={item}
              >
                {item}
              </option>
            )
          )}
        </select>

        <select
          value={sort}
          onChange={(e) =>
            setSort(
              e.target.value
            )
          }
        >
          <option value="recent">
            Sort: Most Recent
          </option>

          <option value="temp">
            Sort: Temperature
          </option>

          <option value="id">
            Sort: Shipment ID
          </option>
        </select>

        <div className="shipment-view-toggle">
          <button
            type="button"
            className={
              view === "grid"
                ? "active"
                : ""
            }
            onClick={() =>
              setView("grid")
            }
            title="Grid view"
          >
            <FaGrip />
          </button>

          <button
            type="button"
            className={
              view === "list"
                ? "active"
                : ""
            }
            onClick={() =>
              setView("list")
            }
            title="List view"
          >
            <FaList />
          </button>
        </div>
      </section>

      {/* =========================
          GRID VIEW
      ========================= */}

      {view === "grid" && (
        <section className="shipment-card-grid">
          {filteredShipments.map(
            (shipment) => (
              <article
                className="shipment-card"
                key={shipment.id}
              >
                <div className="sc-top">
                  <div>
                    <div className="sc-id">
                      {shipment.id}
                    </div>

                    <div className="sc-product">
                      {
                        shipment.product
                      }
                    </div>
                  </div>

                  <span
                    className={`badge ${getStatusClass(
                      shipment.status
                    )}`}
                  >
                    {shipment.status}
                  </span>
                </div>

                <div className="sc-route">
                  <FaLocationDot />

                  <span>
                    {
                      shipment.source
                    }
                  </span>

                  <FaArrowRight />

                  <span>
                    {
                      shipment.destination
                    }
                  </span>
                </div>

                <div className="sc-stats">
                  <div className="sc-stat">
                    <span>Temp</span>

                    <strong>
                      {
                        shipment.temp
                      }
                      °C
                    </strong>
                  </div>

                  <div className="sc-stat">
                    <span>
                      Humidity
                    </span>

                    <strong>
                      {
                        shipment.humidity
                      }
                      %
                    </strong>
                  </div>

                  <div className="sc-stat">
                    <span>Gas</span>

                    <strong>
                      {
                        shipment.gas
                      }
                    </strong>
                  </div>

                  <div className="sc-stat">
                    <span>
                      Battery
                    </span>

                    <strong>
                      {
                        shipment.battery
                      }
                      %
                    </strong>
                  </div>
                </div>

                <div className="progress-bar">
                  <div
                    className="progress-fill"
                    style={{
                      width: `${shipment.progress}%`,
                    }}
                  />
                </div>

                <div className="sc-journey">
                  {stageLabels.map(
                    (
                      label,
                      index
                    ) => (
                      <span
                        key={label}
                        className={
                          index <=
                          shipment.stage
                            ? "on"
                            : ""
                        }
                      >
                        {label}
                      </span>
                    )
                  )}
                </div>

                <div className="sc-footer">
                  <span className="sc-updated">
                    Updated{" "}
                    {
                      shipment.updated
                    }
                    {" · "}
                    {shipment.device ||
                      "No device"}
                  </span>

                  <Link
                    className="btn ghost small"
                    to={`/shipments/${shipment.id}`}
                  >
                    View Details
                  </Link>
                </div>
              </article>
            )
          )}
        </section>
      )}

      {/* =========================
          LIST VIEW
      ========================= */}

      {view === "list" && (
        <section className="card shipment-list-card">
          <div className="table-scroll">
            <table className="data-table">
              <thead>
                <tr>
                  <th>
                    Shipment ID
                  </th>
                  <th>Product</th>
                  <th>Source</th>
                  <th>
                    Destination
                  </th>
                  <th>Device</th>
                  <th>Status</th>
                  <th>Temp</th>
                  <th>Updated</th>
                  <th></th>
                </tr>
              </thead>

              <tbody>
                {filteredShipments.map(
                  (shipment) => (
                    <tr
                      key={
                        shipment.id
                      }
                    >
                      <td>
                        <span className="mono-id">
                          {
                            shipment.id
                          }
                        </span>
                      </td>

                      <td>
                        {
                          shipment.product
                        }
                      </td>

                      <td>
                        {
                          shipment.source
                        }
                      </td>

                      <td>
                        {
                          shipment.destination
                        }
                      </td>

                      <td>
                        {shipment.device ||
                          "—"}
                      </td>

                      <td>
                        <span
                          className={`badge ${getStatusClass(
                            shipment.status
                          )}`}
                        >
                          {
                            shipment.status
                          }
                        </span>
                      </td>

                      <td>
                        {
                          shipment.temp
                        }
                        °C
                      </td>

                      <td>
                        {
                          shipment.updated
                        }
                      </td>

                      <td>
                        <Link
                          className="btn ghost small"
                          to={`/shipments/${shipment.id}`}
                        >
                          View
                        </Link>
                      </td>
                    </tr>
                  )
                )}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {filteredShipments.length ===
        0 && (
        <div className="card shipment-empty-state">
          No shipments match your
          filters.
        </div>
      )}
    </div>
  );
}

export default ActiveShipments;