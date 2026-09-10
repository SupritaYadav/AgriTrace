import React, { useState, useEffect } from 'react';
import './AgriTrace.css';

export default function AgriTraceShell() {
  const [theme, setTheme] = useState('light');
  const [isCollapsed, setIsCollapsed] = useState(false);

  useEffect(() => {
    const savedTheme = localStorage.getItem('agritrace_theme') || 'light';
    setTheme(savedTheme);
    document.documentElement.setAttribute('data-theme', savedTheme);
  }, []);

  const toggleTheme = () => {
    const nextTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(nextTheme);
    localStorage.setItem('agritrace_theme', nextTheme);
    document.documentElement.setAttribute('data-theme', nextTheme);
  };

  return (
    <div id="app-shell" className={`app-shell ${isCollapsed ? 'collapsed' : ''}`}>
      {/* SIDEBAR */}
      <aside id="sidebar" className="sidebar" style={{ width: isCollapsed ? '76px' : '258px' }}>
        <div className="sidebar-head">
          <div className="brand">
            <span className="brand-mark"><i className="fa-solid fa-seedling"></i></span>
            {!isCollapsed && <span className="brand-text">AgriTrace</span>}
          </div>
          <button 
            id="sidebarCollapseBtn" 
            className="icon-btn ghost" 
            onClick={() => setIsCollapsed(!isCollapsed)}
          >
            <i className={`fa-solid fa-angles-${isCollapsed ? 'right' : 'left'}`}></i>
          </button>
        </div>
      </aside>

      {/* MAIN COLUMN */}
      <div className="main-col" style={{ flex: 1 }}>
        <header className="topbar">
          <div className="topbar-title">
            <h1>Dashboard</h1>
          </div>
          
          <div className="topbar-actions">
            <button 
              className="icon-btn ghost" 
              id="themeToggleBtn" 
              onClick={toggleTheme}
              title="Toggle light/dark"
            >
              <i className={`fa-solid fa-${theme === 'dark' ? 'sun' : 'moon'}`}></i>
            </button>
          </div>
        </header>

        <main className="content">
          <p>Welcome back, Kritika Gupta.</p>
        </main>
      </div>
    </div>
  );
}