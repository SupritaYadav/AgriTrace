import { useEffect, useMemo, useState, useRef } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { listAlerts } from "../../api/alertApi";

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
  "/trace/demo": { title: "Consumer View", subtitle: "Public traceability page (no login required)" },
};

function buildSearchQuery(term) {
  const t = term.trim();
  if (!t) return null;
  const numeric = /^\d+$/.test(t);
  if (numeric || t.length >= 6) {
    return `/shipments/active?search=${encodeURIComponent(t)}`;
  }
  return `/shipments/active?search=${encodeURIComponent(t)}`;
}

const Topbar = ({ onMenuClick }) => {
  const { user, profile, role, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [theme, setTheme] = useState(() => (
    localStorage.getItem("agritrace_theme") || "light"
  ));
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [showNotificationDropdown, setShowNotificationDropdown] = useState(false);
  const [alertCount, setAlertCount] = useState(0);
  const [alerts, setAlerts] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [notifLoading, setNotifLoading] = useState(false);
  const profileRef = useRef(null);
  const notifRef = useRef(null);

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
    setShowProfileDropdown(false);
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

  const userName = profile?.name || user?.displayName || "User";
  const userEmail = profile?.email || user?.email || "";
  const userInitial = userName ? userName.charAt(0).toUpperCase() : "U";

  const loadNotifications = async () => {
    setNotifLoading(true);
    try {
      const data = await listAlerts();
      const list = Array.isArray(data) ? data : (data?.data ?? []);
      setAlerts(list.slice(0, 5));
      const openCount = list.filter((a) => a.status === "OPEN" || a.status === "ACKNOWLEDGED").length;
      setAlertCount(openCount);
    } catch (err) {
      console.error("Failed to load alerts", err);
      setAlertCount(0);
    } finally {
      setNotifLoading(false);
    }
  };

  useEffect(() => {
    loadNotifications();
  }, []);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (profileRef.current && !profileRef.current.contains(e.target)) {
        setShowProfileDropdown(false);
      }
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setShowNotificationDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSearchKeyDown = (e) => {
    if (e.key === "Enter") {
      const path = buildSearchQuery(searchTerm);
      if (path) {
        navigate(path);
        setSearchTerm("");
      }
    }
  };

  const handleSearchClick = () => {
    const path = buildSearchQuery(searchTerm);
    if (path) {
      navigate(path);
      setSearchTerm("");
    } else {
      navigate("/shipments/active");
    }
  };

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
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          onKeyDown={handleSearchKeyDown}
        />
        <button
          className="icon-btn ghost search-btn"
          onClick={handleSearchClick}
          aria-label="Search"
          title="Search"
        >
          <i className="fa-solid fa-arrow-right"></i>
        </button>
      </div>

      <div className="topbar-actions">
        <Link to="/alerts" id="bellBtn" className="topbar-bell" title="Alerts">
          <i className="fa-solid fa-bell"></i>
          {alertCount > 0 && (
            <span id="bellBadge" className="badge-dot">{alertCount}</span>
          )}
        </Link>

        <button
          id="themeToggleBtn"
          className="icon-btn ghost"
          onClick={toggleTheme}
          title="Toggle light/dark"
          aria-label="Toggle light/dark theme"
          aria-pressed={theme === "dark"}
        >
          <i className={`fa-solid fa-${theme === "dark" ? "sun" : "moon"}`}></i>
        </button>

        <div ref={notifRef} className="notification-wrap">
          <button
            className="icon-btn ghost notification-btn"
            onClick={() => setShowNotificationDropdown(!showNotificationDropdown)}
            title="Notifications"
            aria-label="Notifications"
          >
            <i className="fa-solid fa-bell"></i>
            {alertCount > 0 && (
              <span className="badge-dot">{alertCount}</span>
            )}
          </button>
          {showNotificationDropdown && (
            <div className="notification-dropdown">
              <div className="notification-dropdown-head">
                <span>Notifications</span>
                {notifLoading && <span className="loading-small">Loading...</span>}
              </div>
              {alerts.length === 0 && !notifLoading && (
                <div className="notification-empty">No alerts</div>
              )}
              {alerts.map((alert) => (
                <Link
                  key={alert.alertId || alert.id}
                  to={`/alerts`}
                  className="notification-item"
                  onClick={() => setShowNotificationDropdown(false)}
                >
                  <span className={`notification-status ${alert.status === "OPEN" ? "open" : "resolved"}`}>
                    {alert.status}
                  </span>
                  <span className="notification-title">{alert.type || "Alert"}</span>
                  <span className="notification-time">
                    {alert.timestamp ? new Date(alert.timestamp).toLocaleString("en-GB", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" }) : "—"}
                  </span>
                </Link>
              ))}
              <Link to="/alerts" className="notification-view-all" onClick={() => setShowNotificationDropdown(false)}>
                View All Alerts
              </Link>
            </div>
          )}
        </div>

        <div ref={profileRef} className="user-chip-wrap">
          <button
            className="user-chip"
            onClick={() => setShowProfileDropdown(!showProfileDropdown)}
            title="Profile"
            aria-label="User profile"
            aria-expanded={showProfileDropdown}
          >
            <div className="avatar">{userInitial}</div>
            <div className="user-meta">
              <strong>{userName}</strong>
              <span>{role || "—"}</span>
            </div>
            <i className="fa-solid fa-chevron-down small-chev"></i>
          </button>
          {showProfileDropdown && (
            <div className="profile-dropdown">
              <div className="profile-dropdown-head">
                <strong>{userName}</strong>
                <span>{role || "—"}</span>
                <span className="profile-email">{userEmail}</span>
              </div>
              <Link to="/profile" className="profile-dropdown-item" onClick={() => setShowProfileDropdown(false)}>
                My Profile
              </Link>
              <button className="profile-dropdown-item" onClick={handleLogout}>
                Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Topbar;