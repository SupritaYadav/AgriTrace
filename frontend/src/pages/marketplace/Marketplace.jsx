import { useState, useEffect } from "react";

import { useAuth } from "../../context/AuthContext";
import {
  listListings,
  createListing,
  buyListing,
  getMyListings,
  getMyPurchases,
} from "../../api/marketplaceApi";
import { listShipments } from "../../api/shipmentApi";
import LoadingSpinner from "../../components/common/LoadingSpinner";

const Marketplace = () => {
  const { role } = useAuth();
  const isFarmer = role === "FARMER";
  const isWarehouse = role === "WAREHOUSE";
  const isAdmin = role === "ADMIN";

  const [listings, setListings] = useState([]);
  const [myListings, setMyListings] = useState([]);
  const [myPurchases, setMyPurchases] = useState([]);
  const [shipments, setShipments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [activeTab, setActiveTab] = useState("browse");
  const [searchTerm, setSearchTerm] = useState("");
  const [createForm, setCreateForm] = useState({
    product: "",
    quantity: "",
    pricePerUnit: "",
    location: "",
  });
  const [creating, setCreating] = useState(false);
  const [purchaseError, setPurchaseError] = useState(null);

  const loadListings = async () => {
    try {
      setLoading(true);
      setError(null);
      const [browseData, myListData, purchasesData, shipmentsData] = await Promise.all([
        listListings({ status: "AVAILABLE" }),
        (isFarmer || isAdmin) ? getMyListings() : Promise.resolve([]),
        (isWarehouse || isAdmin) ? getMyPurchases() : Promise.resolve([]),
        listShipments(),
      ]);
      setListings(browseData || []);
      setMyListings(myListData || []);
      setMyPurchases(purchasesData || []);
      setShipments(shipmentsData || []);
    } catch (err) {
      console.error("Failed to load marketplace", err);
      setError(err.message || "Failed to load marketplace");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadListings();
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    setCreating(true);
    setPurchaseError(null);
    try {
      await createListing({
        product: createForm.product,
        quantity: Number(createForm.quantity),
        pricePerUnit: Number(createForm.pricePerUnit),
        location: createForm.location,
      });
      setCreateForm({ product: "", quantity: "", pricePerUnit: "", location: "" });
      setShowCreateForm(false);
      await loadListings();
    } catch (err) {
      setPurchaseError(err.message || "Failed to create listing");
    } finally {
      setCreating(false);
    }
  };

  const handleBuy = async (listingId) => {
    setPurchaseError(null);
    try {
      await buyListing(listingId);
      await loadListings();
    } catch (err) {
      setPurchaseError(err.message || "Failed to purchase listing");
    }
  };

  const filteredListings = listings.filter((l) =>
    (l.product || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
    (l.location || "").toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return <LoadingSpinner />;
  }

  if (error) {
    return (
      <div className="page-container">
        <p style={{ color: "red", padding: "24px" }}>Failed to load marketplace: {error}</p>
      </div>
    );
  }

  return (
    <div className="page-container">
      <style>{`
        .mp-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
        .mp-header h1 { margin: 0; font-size: 22px; }
        .mp-tabs { display: flex; gap: 4px; margin-bottom: 16px; border-bottom: 1px solid var(--border); }
        .mp-tab { padding: 10px 20px; border: none; background: none; cursor: pointer; font-size: 14px; border-radius: 8px 8px 0 0; }
        .mp-tab.active { background: var(--card-bg); border: 1px solid var(--border); border-bottom: none; }
        .mp-search { padding: 8px 12px; border: 1px solid var(--border); border-radius: 8px; width: 240px; font-size: 13px; }
        .mp-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 16px; }
        .mp-card { background: var(--card-bg); border: 1px solid var(--border); border-radius: 12px; padding: 16px; }
        .mp-card h3 { margin: 0 0 4px 0; font-size: 16px; }
        .mp-card .mp-seller { font-size: 12px; color: var(--text-muted); margin-bottom: 8px; }
        .mp-card .mp-detail { font-size: 13px; color: var(--text); margin: 4px 0; }
        .mp-card .mp-price { font-size: 18px; font-weight: 700; color: var(--text); margin: 8px 0; }
        .mp-card .mp-badge { display: inline-block; padding: 2px 8px; border-radius: 999px; font-size: 11px; font-weight: 700; }
        .mp-badge-available { background: #ecfdf5; color: #065f46; }
        .mp-badge-sold { background: #fee2e2; color: #991b2b; }
        .mp-btn { padding: 8px 16px; border-radius: 8px; border: 1px solid var(--border); background: #1b658a; color: #fff; font-size: 13px; font-weight: 600; cursor: pointer; }
        .mp-btn-secondary { background: var(--bg-secondary); color: var(--text); }
        .mp-btn:disabled { opacity: 0.6; cursor: not-allowed; }
        .mp-form { background: var(--card-bg); border: 1px solid var(--border); border-radius: 12px; padding: 16px; margin-bottom: 16px; }
        .mp-form .form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
        .mp-form .form-group { display: flex; flex-direction: column; gap: 4px; }
        .mp-form .form-group label { font-size: 12px; color: var(--text-muted); }
        .mp-form input { padding: 8px 10px; border: 1px solid var(--border); border-radius: 6px; font-size: 13px; }
      `}</style>

      <div className="mp-header">
        <h1>Marketplace</h1>
        {(isFarmer || isAdmin) && (
          <button
            className="mp-btn"
            onClick={() => setShowCreateForm(!showCreateForm)}
          >
            + Create Listing
          </button>
        )}
      </div>

      {showCreateForm && (isFarmer || isAdmin) && (
        <form className="mp-form" onSubmit={handleCreate}>
          <div className="form-grid">
            <div className="form-group">
              <label>Product</label>
              <input
                required
                value={createForm.product}
                onChange={(e) => setCreateForm({ ...createForm, product: e.target.value })}
                placeholder="e.g. Fresh Tomatoes"
              />
            </div>
            <div className="form-group">
              <label>Quantity</label>
              <input
                required
                type="number"
                min="1"
                value={createForm.quantity}
                onChange={(e) => setCreateForm({ ...createForm, quantity: e.target.value })}
                placeholder="e.g. 500"
              />
            </div>
            <div className="form-group">
              <label>Price Per Unit</label>
              <input
                required
                type="number"
                min="0.01"
                step="0.01"
                value={createForm.pricePerUnit}
                onChange={(e) => setCreateForm({ ...createForm, pricePerUnit: e.target.value })}
                placeholder="e.g. 45.50"
              />
            </div>
            <div className="form-group">
              <label>Location</label>
              <input
                required
                value={createForm.location}
                onChange={(e) => setCreateForm({ ...createForm, location: e.target.value })}
                placeholder="e.g. Lucknow, UP"
              />
            </div>
          </div>
          {purchaseError && <p style={{ color: "red", fontSize: 13, marginTop: 8 }}>{purchaseError}</p>}
          <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
            <button type="submit" className="mp-btn" disabled={creating}>
              {creating ? "Creating..." : "Create Listing"}
            </button>
            <button
              type="button"
              className="mp-btn mp-btn-secondary"
              onClick={() => setShowCreateForm(false)}
              disabled={creating}
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      <div className="mp-tabs">
        <button
          className={`mp-tab ${activeTab === "browse" ? "active" : ""}`}
          onClick={() => setActiveTab("browse")}
        >
          Browse
        </button>
        {(isFarmer || isAdmin) && (
          <button
            className={`mp-tab ${activeTab === "my-listings" ? "active" : ""}`}
            onClick={() => setActiveTab("my-listings")}
          >
            My Listings
          </button>
        )}
        {(isWarehouse || isAdmin) && (
          <button
            className={`mp-tab ${activeTab === "my-purchases" ? "active" : ""}`}
            onClick={() => setActiveTab("my-purchases")}
          >
            My Purchases
          </button>
        )}
      </div>

      {activeTab === "browse" && (
        <>
          <div style={{ marginBottom: 16 }}>
            <input
              className="mp-search"
              placeholder="Search by product or location..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="mp-grid">
            {filteredListings.map((listing) => (
              <div className="mp-card" key={listing.listingId || listing._id}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <h3>{listing.product || "—"}</h3>
                  <span className={`mp-badge ${listing.status === "SOLD" ? "mp-badge-sold" : "mp-badge-available"}`}>
                    {listing.status || "AVAILABLE"}
                  </span>
                </div>
                <div className="mp-seller">
                  Sold by: {listing.farmerId || "—"}
                  {" · "}
                  {listing.location || "—"}
                </div>
                <div className="mp-detail">Quantity: {listing.quantity || 0}</div>
                <div className="mp-detail">Price: ₹{listing.pricePerUnit || 0} / unit</div>
                <div className="mp-price">Total: ₹{(Number(listing.quantity || 0) * Number(listing.pricePerUnit || 0)).toFixed(2)}</div>
                {listing.status === "AVAILABLE" && (isWarehouse || isAdmin) && (
                  <button
                    className="mp-btn"
                    style={{ width: "100%", marginTop: 8 }}
                    onClick={() => handleBuy(listing.listingId || listing._id)}
                  >
                    Buy Now
                  </button>
                )}
                {purchaseError && (
                  <p style={{ color: "red", fontSize: 12, marginTop: 4 }}>{purchaseError}</p>
                )}
              </div>
            ))}
            {filteredListings.length === 0 && <p style={{ color: "var(--text-muted)" }}>No listings found.</p>}
          </div>
        </>
      )}

      {activeTab === "my-listings" && (
        <div className="mp-grid">
          {myListings.map((listing) => (
            <div className="mp-card" key={listing.listingId || listing._id}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <h3>{listing.product || "—"}</h3>
                <span className={`mp-badge ${listing.status === "SOLD" ? "mp-badge-sold" : "mp-badge-available"}`}>
                  {listing.status || "AVAILABLE"}
                </span>
              </div>
              <div className="mp-seller">
                {listing.location || "—"}
                {" · "}
                Created: {listing.createdAt ? new Date(listing.createdAt).toLocaleDateString() : "—"}
              </div>
              <div className="mp-detail">Quantity: {listing.quantity || 0}</div>
              <div className="mp-detail">Price: ₹{listing.pricePerUnit || 0} / unit</div>
              {listing.status === "SOLD" && (
                <div className="mp-detail">Buyer: {listing.buyerId || "—"}</div>
              )}
            </div>
          ))}
          {myListings.length === 0 && <p style={{ color: "var(--text-muted)" }}>You have no listings yet.</p>}
        </div>
      )}

      {activeTab === "my-purchases" && (
        <div className="mp-grid">
          {myPurchases.map((listing) => (
            <div className="mp-card" key={listing.listingId || listing._id}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <h3>{listing.product || "—"}</h3>
                <span className="mp-badge mp-badge-sold">SOLD</span>
              </div>
              <div className="mp-seller">
                {listing.location || "—"}
                {" · "}
                Purchased: {listing.soldAt ? new Date(listing.soldAt).toLocaleDateString() : "—"}
              </div>
              <div className="mp-detail">Quantity: {listing.quantity || 0}</div>
              <div className="mp-detail">Price: ₹{listing.pricePerUnit || 0} / unit</div>
              <div className="mp-detail">Seller: {listing.farmerId || "—"}</div>
              {shipments.some((s) => s.assignedDevice === listing.listingId) && (
                <button className="mp-btn mp-btn-secondary" style={{ marginTop: 8 }} onClick={() => {}}>
                  Create Shipment from Purchase
                </button>
              )}
            </div>
          ))}
          {myPurchases.length === 0 && <p style={{ color: "var(--text-muted)" }}>You have no purchases yet.</p>}
        </div>
      )}
    </div>
  );
};

export default Marketplace;
