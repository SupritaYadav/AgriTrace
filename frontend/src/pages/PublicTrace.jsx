import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";

const mockTrace = {
  trackingId: "AGR-2026-0001",
  product: "Organic Tomatoes",
  batch: "BAT-240826",
  origin: "Green Valley Farm, Nashik",
  destination: "FreshMart Distribution Centre, Delhi",
  status: "Delivered",
  harvested: "26 Aug 2026",
  packed: "27 Aug 2026",
  dispatched: "28 Aug 2026",
  delivered: "30 Aug 2026",

  temperature: "4.8°C",
  humidity: "68%",
  ethylene: "0.31 ppm",

  blockchainHash:
    "0x4f71a825be934fa019284663749118af8438",

  journey: [
    {
      title: "Harvested",
      location: "Green Valley Farm, Nashik",
      date: "26 Aug 2026 • 07:30 AM",
      description:
        "Produce harvested and batch identity created.",
    },
    {
      title: "Quality Inspection",
      location: "Nashik Collection Centre",
      date: "26 Aug 2026 • 11:15 AM",
      description:
        "Quality inspection completed successfully.",
    },
    {
      title: "Cold Storage",
      location: "Nashik Cold Storage",
      date: "27 Aug 2026 • 02:20 PM",
      description:
        "Temperature-controlled storage initiated.",
    },
    {
      title: "Transport",
      location: "Nashik → Delhi",
      date: "28 Aug 2026 • 06:00 AM",
      description:
        "IoT monitoring enabled during transportation.",
    },
    {
      title: "Delivered",
      location: "FreshMart Distribution Centre",
      date: "30 Aug 2026 • 09:40 AM",
      description:
        "Shipment received and verified.",
    },
  ],
};

const PublicTrace = () => {
  const { trackingId } = useParams();

  const [searchId, setSearchId] = useState(
    trackingId || ""
  );

  const [trace, setTrace] = useState(
    trackingId ? mockTrace : null
  );

  useEffect(() => {
    if (trackingId) {
      // eslint-disable-next-line
      setSearchId(trackingId);

      // Backend API will replace this:
      // eslint-disable-next-line
      setTrace({
        ...mockTrace,
        trackingId,
      });
    }
  }, [trackingId]);

  const handleSearch = (event) => {
    event.preventDefault();

    if (!searchId.trim()) return;

    setTrace({
      ...mockTrace,
      trackingId: searchId,
    });
  };

  return (
    <div className="public-trace-page">
      <style>{`
        .public-trace-page {
          max-width: 800px;
          margin: 0 auto;
          padding: 30px 20px;
          font-family: inherit;
          color: #0f172a;
        }
        .public-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 30px;
        }
        .public-logo {
          display: flex;
          align-items: center;
          gap: 12px;
        }
        .logo-icon {
          width: 40px;
          height: 40px;
          background: #10b981;
          color: #fff;
          font-weight: 700;
          font-size: 20px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 10px;
        }
        .public-logo strong {
          display: block;
          font-size: 16px;
          color: #0f172a;
        }
        .public-logo small {
          font-size: 12px;
          color: #64748b;
        }
        .verified-badge {
          background: #ecfdf5;
          color: #065f46;
          border: 1px solid #a7f3d0;
          padding: 6px 12px;
          border-radius: 20px;
          font-size: 12px;
          font-weight: 600;
        }
        .trace-hero {
          text-align: center;
          background: #ffffff;
          border: 1px solid #e2e8f0;
          border-radius: 16px;
          padding: 40px 20px;
          margin-bottom: 24px;
        }
        .hero-label {
          font-size: 11px;
          font-weight: 700;
          color: #10b981;
          letter-spacing: 1px;
          text-transform: uppercase;
        }
        .trace-hero h1 {
          font-size: 28px;
          margin: 10px 0;
          color: #0f172a;
        }
        .trace-hero h1 span {
          color: #10b981;
        }
        .trace-hero p {
          font-size: 14px;
          color: #64748b;
          margin-bottom: 24px;
        }
        .trace-search {
          display: flex;
          max-width: 480px;
          margin: 0 auto;
          gap: 10px;
        }
        .trace-search input {
          flex: 1;
          padding: 10px 14px;
          border: 1px solid #cbd5e1;
          border-radius: 8px;
          font-size: 14px;
          outline: none;
        }
        .trace-search input:focus {
          border-color: #10b981;
        }
        .trace-search button {
          background: #10b981;
          color: #fff;
          border: none;
          padding: 10px 20px;
          border-radius: 8px;
          font-weight: 600;
          font-size: 14px;
          cursor: pointer;
        }
        .public-trace-content {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }
        .trace-product-card {
          background: #ffffff;
          border: 1px solid #e2e8f0;
          border-radius: 12px;
          padding: 24px;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .trace-status {
          font-size: 11px;
          font-weight: 700;
          color: #10b981;
        }
        .trace-product-card h2 {
          font-size: 20px;
          margin: 6px 0;
          color: #0f172a;
        }
        .trace-product-card p {
          font-size: 13px;
          color: #64748b;
          margin: 0;
        }
        .trust-score {
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: 12px;
          padding: 12px 20px;
          text-align: center;
        }
        .trust-score span {
          display: block;
          font-size: 11px;
          color: #64748b;
          text-transform: uppercase;
        }
        .trust-score strong {
          font-size: 22px;
          color: #10b981;
        }
        .trust-score small {
          font-size: 12px;
          color: #64748b;
        }
        .consumer-info-grid, .consumer-condition-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 16px;
          background: #ffffff;
          border: 1px solid #e2e8f0;
          border-radius: 12px;
          padding: 20px;
        }
        .consumer-condition-grid {
          grid-template-columns: repeat(3, 1fr);
        }
        .consumer-info-grid div, .consumer-condition-grid div {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }
        .consumer-info-grid span, .consumer-condition-grid span {
          font-size: 11.5px;
          color: #64748b;
        }
        .consumer-info-grid strong, .consumer-condition-grid strong {
          font-size: 14px;
          color: #0f172a;
        }
        .positive-text {
          color: #10b981 !important;
        }
        .trace-section {
          background: #ffffff;
          border: 1px solid #e2e8f0;
          border-radius: 12px;
          padding: 24px;
        }
        .section-heading h2 {
          font-size: 16px;
          margin: 0 0 4px 0;
          color: #0f172a;
        }
        .section-heading p {
          font-size: 12.5px;
          color: #64748b;
          margin: 0 0 20px 0;
        }
        .timeline {
          display: flex;
          flex-direction: column;
          gap: 20px;
          position: relative;
          padding-left: 10px;
        }
        .timeline-item {
          display: flex;
          gap: 16px;
          position: relative;
        }
        .timeline-marker {
          width: 28px;
          height: 28px;
          background: #ecfdf5;
          color: #10b981;
          border: 1px solid #a7f3d0;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 12px;
          font-weight: 700;
          z-index: 2;
        }
        .timeline-content h3 {
          font-size: 14px;
          margin: 0;
          color: #0f172a;
        }
        .timeline-content strong {
          font-size: 12.5px;
          color: #334155;
          display: block;
          margin: 2px 0;
        }
        .timeline-content span {
          font-size: 11.5px;
          color: #64748b;
          display: block;
          margin-bottom: 4px;
        }
        .timeline-content p {
          font-size: 13px;
          color: #475569;
          margin: 0;
        }
        .blockchain-proof {
          background: #ffffff;
          border: 1px solid #e2e8f0;
          border-radius: 12px;
          padding: 24px;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .blockchain-proof span {
          font-size: 11px;
          font-weight: 700;
          color: #10b981;
          text-transform: uppercase;
        }
        .blockchain-proof h3 {
          font-size: 15px;
          margin: 4px 0;
          color: #0f172a;
        }
        .blockchain-proof p {
          font-size: 13px;
          color: #64748b;
          margin: 0;
        }
        .blockchain-proof code {
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          padding: 10px 14px;
          border-radius: 8px;
          font-size: 12px;
          color: #334155;
          max-width: 260px;
          word-break: break-all;
        }
        .public-footer {
          text-align: center;
          font-size: 12px;
          color: #64748b;
          margin-top: 40px;
          padding-top: 20px;
          border-top: 1px solid #e2e8f0;
        }
        @media (max-width: 768px) {
          .consumer-info-grid {
            grid-template-columns: repeat(2, 1fr);
          }
          .consumer-condition-grid {
            grid-template-columns: 1fr;
          }
          .blockchain-proof {
            flex-direction: column;
            align-items: flex-start;
            gap: 16px;
          }
        }
      `}</style>

      <header className="public-header">
        <div className="public-logo">
          <span className="logo-icon">A</span>
          <div>
            <strong>AgriTrace</strong>
            <small>Farm-to-Fork Transparency</small>
          </div>
        </div>

        <span className="verified-badge">
          Verified Traceability
        </span>
      </header>

      <section className="trace-hero">
        <span className="hero-label">
          KNOW YOUR FOOD
        </span>

        <h1>
          Trace your food from
          <span> farm to fork.</span>
        </h1>

        <p>
          Enter the trace ID printed on your package or scan
          its QR code.
        </p>

        <form
          className="trace-search"
          onSubmit={handleSearch}
        >
          <input
            type="text"
            value={searchId}
            onChange={(e) =>
              setSearchId(e.target.value)
            }
            placeholder="Example: AGR-2026-0001"
          />

          <button type="submit">
            Trace Product
          </button>
        </form>
      </section>

      {trace && (
        <main className="public-trace-content">
          <section className="trace-product-card">
            <div>
              <span className="trace-status">
                ✓ VERIFIED PRODUCT
              </span>

              <h2>{trace.product}</h2>

              <p>
                Trace ID:{" "}
                <strong>{trace.trackingId}</strong>
              </p>
            </div>

            <div className="trust-score">
              <span>Trust Score</span>
              <strong>98</strong>
              <small>/ 100</small>
            </div>
          </section>

          <section className="consumer-info-grid">
            <div>
              <span>Batch</span>
              <strong>{trace.batch}</strong>
            </div>

            <div>
              <span>Origin</span>
              <strong>{trace.origin}</strong>
            </div>

            <div>
              <span>Status</span>
              <strong className="positive-text">
                {trace.status}
              </strong>
            </div>

            <div>
              <span>Delivered</span>
              <strong>{trace.delivered}</strong>
            </div>
          </section>

          <section className="trace-section">
            <div className="section-heading">
              <h2>Journey</h2>
              <p>
                Verified events across the supply chain
              </p>
            </div>

            <div className="timeline">
              {trace.journey.map((item, index) => (
                <div
                  className="timeline-item"
                  key={index}
                >
                  <div className="timeline-marker">
                    ✓
                  </div>

                  <div className="timeline-content">
                    <h3>{item.title}</h3>
                    <strong>{item.location}</strong>
                    <span>{item.date}</span>
                    <p>{item.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="trace-section">
            <div className="section-heading">
              <h2>Product Conditions</h2>
              <p>
                Environmental conditions recorded during
                transportation
              </p>
            </div>

            <div className="consumer-condition-grid">
              <div>
                <span>Temperature</span>
                <strong>{trace.temperature}</strong>
                <small>Within safe range</small>
              </div>

              <div>
                <span>Humidity</span>
                <strong>{trace.humidity}</strong>
                <small>Optimal</small>
              </div>

              <div>
                <span>Ethylene</span>
                <strong>{trace.ethylene}</strong>
                <small>Normal level</small>
              </div>
            </div>
          </section>

          <section className="blockchain-proof">
            <div>
              <span>Blockchain Verified</span>

              <h3>
                Tamper-resistant supply chain record
              </h3>

              <p>
                This traceability record has been
                cryptographically verified.
              </p>
            </div>

            <code>
              {trace.blockchainHash}
            </code>
          </section>
        </main>
      )}

      <footer className="public-footer">
        AgriTrace • Transparent food supply chains
      </footer>
    </div>
  );
};

export default PublicTrace;