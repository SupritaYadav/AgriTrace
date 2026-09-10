import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

const PAGE_META = {
  "/dashboard": { title: "Dashboard", subtitle: "Overview of your supply chain network" },
  "/shipments/create": { title: "Create Shipment", subtitle: "Register a new produce shipment for tracking" },
  "/shipments/active": { title: "Active Shipments", subtitle: "Live status of shipments currently in the network" },
  "/shipments/history": { title: "Shipment History", subtitle: "Archive of completed shipments" },
  "/devices": { title: "Device List", subtitle: "Manage your IoT sensor fleet" },
  "/devices/assign": { title: "Assign Device", subtitle: "Pair available devices with pending shipments" },
  "/monitoring": { title: "Monitoring", subtitle: "Live environmental telemetry" },
  "/traceability": { title: "Traceability", subtitle: "Farm-to-fork journey and data integrity" },
  "/alerts": { title: "Alerts", subtitle: "Environmental and device alert center" },
  "/analytics": { title: "Analytics", subtitle: "Performance across your supply chain" },
  "/reports": { title: "Reports", subtitle: "Generate and download compliance reports" },
  "/profile": { title: "Profile", subtitle: "Manage your account and preferences" },
  "/trace/demo": { title: "Consumer View", subtitle: "Public traceability page (no login required)" }
};

const Topbar = ({ onMenuClick }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [theme, setTheme] = useState(() => (
    localStorage.getItem("agritrace_theme") || "light"
  ));

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("agritrace_theme", theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((currentTheme) => (
      currentTheme === "dark" ? "light" : "dark"
    ));
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigate("/login", { replace: true });
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  const meta = useMemo(() => {
    if (location.pathname.startsWith("/shipments/") && location.pathname !== "/shipments/active" && location.pathname !== "/shipments/history" && location.pathname !== "/shipments/create") {
      return { title: "Shipment Details", subtitle: "Full traceability and sensor data" };
    }
    return PAGE_META[location.pathname] || { title: "Dashboard", subtitle: "" };
  }, [location.pathname]);

  const userName = user?.displayName || "Kritika Gupta";
  const userInitial = "KG";

  return (
    <header className="topbar">
      <button
        id="sidebarToggleBtn"
        className="icon-btn ghost mobile-only"
        onClick={onMenuClick}
        aria-label="Toggle sidebar"
      >
        <i className="fa-solid fa-bars"></i>
      </button>

      <div className="topbar-title">
        <h1 id="pageTitle">{meta.title}</h1>
        <span id="pageSubtitle">{meta.subtitle}</span>
      </div>

      <div className="topbar-search">
        <i className="fa-solid fa-magnifying-glass"></i>
        <input
          type="text"
          id="globalSearch"
          placeholder="Search shipments, devices, batches..."
        />
      </div>

      <div className="topbar-actions">
        <div id="connectivityPill" className="connectivity-pill" title="Network status">
          <span className="dot online"></span> <span>18 Online</span>
        </div>

        <button
          id="themeToggleBtn"
          className="icon-btn ghost"
          onClick={toggleTheme}
          title="Toggle light/dark"
          aria-label="Toggle light/dark theme"
          aria-pressed={theme === "dark"}
        >
          <i
            className={`fa-solid fa-${theme === "dark" ? "sun" : "moon"}`}
          ></i>
        </button>

        <Link to="/alerts" id="bellBtn" className="topbar-bell" title="Alerts">
          <i className="fa-solid fa-bell"></i>
          <span id="bellBadge" className="badge-dot">2</span>
        </Link>

        <div className="role-select-wrap">
          <select id="roleSelect" className="role-select" aria-label="Select Role">
            <option value="admin">Admin</option>
            <option value="farmer">Farmer</option>
            <option value="transporter">Transporter</option>
            <option value="warehouse">Warehouse Manager</option>
            <option value="retailer">Retailer</option>
          </select>
        </div>

        <div id="userChip" className="user-chip" onClick={handleLogout} title="Click to logout">
          <div className="avatar">{userInitial}</div>
          <div className="user-meta">
            <strong>{userName}</strong>
            <span>Operations Manager</span>
          </div>
          <i className="fa-solid fa-chevron-down small-chev"></i>
        </div>
      </div>
    </header>
  );
};

export default Topbar;