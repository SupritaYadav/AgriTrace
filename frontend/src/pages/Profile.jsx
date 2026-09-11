import { useState, useEffect } from "react";

import { useAuth } from "../context/AuthContext";
import { listShipments } from "../api/shipmentApi";

const Profile = () => {
  const { user, profile, profileLoading } = useAuth();

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    role: "",
    orgName: "",
    orgType: "",
    state: "",
    district: "",
  });
  const [toggles, setToggles] = useState({
    twoFactor: true,
    tempAlerts: true,
    humidityAlerts: true,
    deviceOffline: true,
    shipmentUpdates: false,
  });
  const [myShipments, setMyShipments] = useState([]);
  const [loadingShipments, setLoadingShipments] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!user) return;
    setFormData({
      name: user.displayName || profile?.name || "",
      email: user.email || profile?.email || "",
      phone: profile?.phone || "",
      role: profile?.role || "",
      orgName: profile?.organisation || "",
      orgType: "",
      state: profile?.address?.state || "",
      district: profile?.address?.district || "",
    });
  }, [user, profile]);

  useEffect(() => {
    if (!user) {
      setMyShipments([]);
      return;
    }
    const load = async () => {
      setLoadingShipments(true);
      try {
        const data = await listShipments();
        const all = Array.isArray(data) ? data : [];
        setMyShipments(
          all.filter(
            (s) => s.createdBy === user.uid || s.owner === user.uid
          )
        );
      } catch (err) {
        console.error("Failed to load shipments", err);
      } finally {
        setLoadingShipments(false);
      }
    };
    load();
  }, [user]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleToggle = (key) => {
    setToggles((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setMessage("Profile updated successfully.");
    setTimeout(() => setMessage(""), 3000);
  };

  if (!user) {
    return (
      <div>
        <h1 className="text-2xl font-bold mb-4">My Profile</h1>
        <p className="text-red-600">Please log in to view your profile.</p>
      </div>
    );
  }

  if (profileLoading) {
    return (
      <div>
        <h1 className="text-2xl font-bold mb-4">My Profile</h1>
        <p className="text-gray-500">Loading profile…</p>
      </div>
    );
  }

  return (
    <div className="page-container">
      <style>{`
        .profile-page-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 20px;
        }
        @media (max-width: 1024px) {
          .profile-page-grid {
            grid-template-columns: 1fr;
          }
        }
        .security-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 14px 0;
          border-bottom: 1px solid var(--border);
          font-size: 13.5px;
          color: var(--text);
        }
        .security-row:last-child {
          border-bottom: none;
        }
        .switch {
          position: relative;
          display: inline-block;
          width: 42px;
          height: 24px;
        }
        .switch input {
          opacity: 0;
          width: 0;
          height: 0;
        }
        .slider {
          position: absolute;
          cursor: pointer;
          inset: 0;
          background-color: var(--border);
          border-radius: 9999px;
          transition: 0.2s;
        }
        .slider::before {
          content: "";
          position: absolute;
          height: 18px;
          width: 18px;
          left: 3px;
          top: 3px;
          background-color: var(--card-bg);
          border-radius: 50%;
          transition: 0.2s;
        }
        .switch input:checked + .slider {
          background-color: #10b981;
        }
        .switch input:checked + .slider::before {
          transform: translateX(18px);
        }
        .custom-secondary-btn {
          background-color: var(--bg-secondary);
          color: var(--text);
          border: 1px solid var(--border);
          padding: 6px 14px;
          border-radius: 8px;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
        }
        .success-banner {
          background: #ecfdf5;
          color: #065f46;
          padding: 10px 14px;
          border-radius: 8px;
          font-size: 13px;
          margin-bottom: 16px;
          border: 1px solid #a7f3d0;
        }
        .profile-shipment-item {
          padding: 8px 12px;
          border: 1px solid var(--border);
          border-radius: 8px;
          margin-bottom: 8px;
          font-size: 13px;
        }
      `}</style>

      <div className="page-header">
        <div>
          <h1>Profile</h1>
          <p>Manage your account and preferences</p>
        </div>
      </div>

      {message && <div className="success-banner">{message}</div>}

      <div className="profile-page-grid">
        {/* Personal Information */}
        <div className="content-card">
          <h3 style={{ fontSize: "16px", fontWeight: "600", marginBottom: "16px", color: "var(--text)" }}>
            Personal Information
          </h3>
          <form onSubmit={handleSubmit}>
            <div className="form-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
              <div className="form-group" style={{ gridColumn: "span 1" }}>
                <label>Name</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className="form-input"
                />
              </div>
              <div className="form-group" style={{ gridColumn: "span 1" }}>
                <label>Email</label>
                <input
                  type="email"
                  value={formData.email}
                  disabled
                  className="form-input"
                  style={{ backgroundColor: "var(--bg-secondary)", color: "var(--text-muted)" }}
                />
              </div>
              <div className="form-group" style={{ gridColumn: "span 1" }}>
                <label>Phone</label>
                <input
                  type="text"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  className="form-input"
                />
              </div>
              <div className="form-group" style={{ gridColumn: "span 2" }}>
                <label>Role</label>
                <input
                  type="text"
                  name="role"
                  value={formData.role}
                  disabled
                  className="form-input"
                  style={{ backgroundColor: "var(--bg-secondary)", color: "var(--text-muted)" }}
                />
              </div>
            </div>
          </form>
        </div>

        {/* Organization Information */}
        <div className="content-card">
          <h3 style={{ fontSize: "16px", fontWeight: "600", marginBottom: "16px", color: "var(--text)" }}>
            Organization Information
          </h3>
          <div className="form-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
            <div className="form-group" style={{ gridColumn: "span 2" }}>
              <label>Organization Name</label>
              <input
                type="text"
                name="orgName"
                value={formData.orgName}
                onChange={handleChange}
                className="form-input"
              />
            </div>
            <div className="form-group" style={{ gridColumn: "span 1" }}>
              <label>Type</label>
              <input
                type="text"
                name="orgType"
                value={formData.orgType}
                onChange={handleChange}
                className="form-input"
              />
            </div>
            <div className="form-group" style={{ gridColumn: "span 1" }}>
              <label>State</label>
              <input
                type="text"
                name="state"
                value={formData.state}
                onChange={handleChange}
                className="form-input"
              />
            </div>
            <div className="form-group" style={{ gridColumn: "span 2" }}>
              <label>District</label>
              <input
                type="text"
                name="district"
                value={formData.district}
                onChange={handleChange}
                className="form-input"
              />
            </div>
          </div>
        </div>

        {/* My Shipments */}
        <div className="content-card">
          <h3 style={{ fontSize: "16px", fontWeight: "600", marginBottom: "16px", color: "var(--text)" }}>
            My Shipments
          </h3>
          {loadingShipments ? (
            <p className="text-gray-500 text-sm">Loading shipments…</p>
          ) : myShipments.length === 0 ? (
            <p className="text-gray-500 text-sm">No shipments yet.</p>
          ) : (
            <div>
              {myShipments.map((s) => (
                <div key={s.id || s._id} className="profile-shipment-item">
                  <strong>{s.productName || s.product || "Unknown"}</strong>
                  {" — "}
                  {s.status || "Unknown"}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Security */}
        <div className="content-card">
          <h3 style={{ fontSize: "16px", fontWeight: "600", marginBottom: "16px", color: "var(--text)" }}>
            Security
          </h3>
          <div className="security-row">
            <span>Password</span>
            <button
              type="button"
              className="custom-secondary-btn"
              onClick={() => alert("Password reset link sent to email.")}
            >
              Change Password
            </button>
          </div>
          <div className="security-row">
            <span>Two-Factor Authentication</span>
            <label className="switch">
              <input
                type="checkbox"
                checked={toggles.twoFactor}
                onChange={() => handleToggle("twoFactor")}
              />
              <span className="slider"></span>
            </label>
          </div>
        </div>

        {/* Notification Preferences */}
        <div className="content-card">
          <h3 style={{ fontSize: "16px", fontWeight: "600", marginBottom: "16px", color: "var(--text)" }}>
            Notification Preferences
          </h3>
          <div className="security-row">
            <span>Temperature Alerts</span>
            <label className="switch">
              <input
                type="checkbox"
                checked={toggles.tempAlerts}
                onChange={() => handleToggle("tempAlerts")}
              />
              <span className="slider"></span>
            </label>
          </div>
          <div className="security-row">
            <span>Humidity Alerts</span>
            <label className="switch">
              <input
                type="checkbox"
                checked={toggles.humidityAlerts}
                onChange={() => handleToggle("humidityAlerts")}
              />
              <span className="slider"></span>
            </label>
          </div>
          <div className="security-row">
            <span>Device Offline Alerts</span>
            <label className="switch">
              <input
                type="checkbox"
                checked={toggles.deviceOffline}
                onChange={() => handleToggle("deviceOffline")}
              />
              <span className="slider"></span>
            </label>
          </div>
          <div className="security-row">
            <span>Shipment Updates</span>
            <label className="switch">
              <input
                type="checkbox"
                checked={toggles.shipmentUpdates}
                onChange={() => handleToggle("shipmentUpdates")}
              />
              <span className="slider"></span>
            </label>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
