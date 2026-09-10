import { useState } from "react";
import { Outlet } from "react-router-dom";

import Sidebar from "./Sidebar";
import Topbar from "./Topbar";

const AppLayout = () => {
  const [collapsed, setCollapsed] =
    useState(false);

  const [mobileOpen, setMobileOpen] =
    useState(false);

  return (
    <div
      id="app-shell"
      className={`
        ${collapsed ? "collapsed" : ""}
        ${mobileOpen ? "mobile-open" : ""}
      `}
    >
      <Sidebar
        onCollapse={() =>
          setCollapsed(
            (prev) => !prev
          )
        }
      />

      <div
        className="sidebar-scrim"
        onClick={() =>
          setMobileOpen(false)
        }
      />

      <div className="main-col">
        <Topbar
          onMobileMenu={() =>
            setMobileOpen(true)
          }
        />

        <main className="content">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AppLayout;