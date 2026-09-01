import React, { useState, useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import { useApp } from '../context/AppContext';
import { Sun, Moon } from 'lucide-react';
import {
  HomeIcon, DataIcon, AnalyticsIcon, HighlightsIcon,
  HistoryIcon, AboutIcon, SettingsIcon, PanelLeftIcon,
} from './Icons';

const NAV_ITEMS = [
  { path: '/',           Icon: HomeIcon,       label: 'Home',      end: true  },
  { path: '/data',       Icon: DataIcon,       label: 'Data',      end: false },
  { path: '/analytics',  Icon: AnalyticsIcon,  label: 'Analytics', end: false },
  { path: '/highlights', Icon: HighlightsIcon, label: 'Insights',  end: false },
  { path: '/history',    Icon: HistoryIcon,    label: 'History',   end: false },
  { path: '/about',      Icon: AboutIcon,      label: 'About',     end: false },
  { path: '/settings',   Icon: SettingsIcon,   label: 'Settings',  end: false },
];

export default function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { theme, toggleTheme } = useTheme();
  const { uploadResult } = useApp();
  const location = useLocation();

  useEffect(() => { setMobileOpen(false); }, [location.pathname]);

  const [isMobile, setIsMobile] = useState(() => window.innerWidth < 768);
  useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, []);

  const sidebarWidth = collapsed ? 'var(--sidebar-collapsed)' : 'var(--sidebar-width)';

  return (
    <>
      {/* Mobile hamburger */}
      {isMobile && (
        <button
          className="mobile-menu-btn"
          onClick={() => setMobileOpen(o => !o)}
          aria-label={mobileOpen ? 'Close navigation' : 'Open navigation'}
          aria-expanded={mobileOpen}
          id="sidebar-mobile-toggle"
        >
          <span className={`hamburger ${mobileOpen ? 'open' : ''}`} />
        </button>
      )}

      {/* Overlay */}
      {isMobile && mobileOpen && (
        <div
          className="sidebar-overlay"
          onClick={() => setMobileOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}
      <aside
        className="sidebar"
        style={{ width: isMobile ? 'var(--sidebar-width)' : sidebarWidth }}
        data-mobile-open={mobileOpen}
        data-collapsed={collapsed && !isMobile}
        role="navigation"
        aria-label="Main navigation"
      >
        {/* Logo */}
        <div className="sidebar-logo">
          <div className="sidebar-logo-mark" aria-hidden="true">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path d="M5 13a5 5 0 0 1 10 0" stroke="var(--color-primary)" strokeWidth="2.2" strokeLinecap="round"/>
              <circle cx="10" cy="13" r="2" fill="var(--color-primary)"/>
              <circle cx="10" cy="7.5" r="1.5" fill="var(--color-primary)" fillOpacity="0.6"/>
            </svg>
          </div>
          {(!collapsed || isMobile) && (
            <div className="sidebar-logo-text">
              <span className="sidebar-brand">SentimentScope</span>
              <span className="sidebar-brand-sub">Review Intelligence</span>
            </div>
          )}
        </div>

        {/* Navigation */}
        <nav className="sidebar-nav" aria-label="Application pages">
          {NAV_ITEMS.map(({ path, Icon, label, end }) => {
            const hasData = uploadResult && (path === '/data' || path === '/analytics' || path === '/highlights');
            return (
              <NavLink
                key={path}
                to={path}
                end={end}
                className={({ isActive }) => `sidebar-link${isActive ? ' active' : ''}`}
                id={`nav-${label.toLowerCase()}`}
                aria-label={label}
              >
                <span className="sidebar-icon" aria-hidden="true">
                  <Icon size={17} strokeWidth={1.75} />
                </span>
                {(!collapsed || isMobile) && (
                  <span className="sidebar-label">{label}</span>
                )}
                {hasData && (!collapsed || isMobile) && (
                  <span className="sidebar-data-dot" aria-label="Data available" />
                )}
                {collapsed && !isMobile && (
                  <span className="collapsed-tooltip">{label}</span>
                )}
              </NavLink>
            );
          })}
        </nav>

        {/* Spacer */}
        <div style={{ flex: 1 }} />

        {/* Theme Toggle Button */}
        <button
          className="sidebar-theme-btn"
          onClick={toggleTheme}
          aria-label={`Switch to ${theme === 'light' ? 'Dark Intelligence' : 'Light Research'} Theme`}
          id="sidebar-theme-toggle"
        >
          <span className="sidebar-icon" aria-hidden="true">
            {theme === 'light' ? <Moon size={16} strokeWidth={1.75} /> : <Sun size={16} strokeWidth={1.75} />}
          </span>
          {!collapsed && <span className="sidebar-label">{theme === 'light' ? 'Dark Theme' : 'Light Theme'}</span>}
        </button>

        {/* Collapse toggle — desktop only */}
        {!isMobile && (
          <button
            className="sidebar-collapse-btn"
            onClick={() => setCollapsed(c => !c)}
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            id="sidebar-collapse-toggle"
          >
            <span
              className="sidebar-icon"
              aria-hidden="true"
              style={{
                transform: collapsed ? 'rotate(180deg)' : 'none',
                transition: 'transform var(--t-base) var(--ease-in-out)',
              }}
            >
              <PanelLeftIcon size={16} strokeWidth={1.75} />
            </span>
            {!collapsed && <span className="sidebar-label">Collapse</span>}
          </button>
        )}

        {/* Model status footer */}
        <div className="sidebar-status" title="Production model active">
          <span className="status-indicator" aria-hidden="true" />
          {(!collapsed || isMobile) && (
            <div className="sidebar-status-text">
              <span className="status-title">Model active</span>
              <span className="status-detail">Logistic Regression</span>
            </div>
          )}
        </div>
      </aside>

      <style>{`
        /* ── Sidebar Shell ── */
        .sidebar {
          flex-shrink: 0;
          background: var(--color-sidebar);
          display: flex;
          flex-direction: column;
          height: 100vh;
          position: sticky;
          top: 0;
          overflow: hidden;
          transition: width var(--t-sidebar);
          z-index: 100;
          box-shadow: var(--shadow-sidebar);
          border-right: 1px solid var(--color-sidebar-border);
        }

        /* Mobile drawer */
        @media (max-width: 768px) {
          .sidebar {
            position: fixed;
            left: 0;
            top: 0;
            height: 100%;
            transform: translateX(-100%);
            transition:
              transform var(--t-sidebar),
              width var(--t-sidebar);
            box-shadow: var(--shadow-lg);
          }
          .sidebar[data-mobile-open="true"] { transform: translateX(0); }
          .sidebar-overlay {
            position: fixed;
            inset: 0;
            background: rgba(0,0,0,0.55);
            z-index: 99;
            backdrop-filter: blur(2px);
          }
          .mobile-menu-btn {
            position: fixed;
            top: 14px;
            left: 14px;
            z-index: 200;
            background: var(--color-sidebar);
            border: 1px solid var(--color-sidebar-border);
            border-radius: var(--radius-md);
            width: 40px;
            height: 40px;
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            box-shadow: var(--shadow-md);
          }
          .hamburger {
            display: block;
            width: 18px;
            height: 1.5px;
            background: var(--color-text-secondary);
            position: relative;
            transition: background var(--t-fast);
          }
          .hamburger::before, .hamburger::after {
            content: '';
            position: absolute;
            width: 18px;
            height: 1.5px;
            background: var(--color-text-secondary);
            transition: transform var(--t-base) var(--ease-in-out);
          }
          .hamburger::before { top: -5px; }
          .hamburger::after { top: 5px; }
          .hamburger.open { background: transparent; }
          .hamburger.open::before { transform: rotate(45deg) translate(3.5px, 3.5px); }
          .hamburger.open::after { transform: rotate(-45deg) translate(3.5px, -3.5px); }
        }

        /* ── Logo ── */
        .sidebar-logo {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 18px 16px;
          border-bottom: 1px solid var(--color-sidebar-border);
          flex-shrink: 0;
          min-height: 64px;
        }
        .sidebar-logo-mark { flex-shrink: 0; }
        .sidebar-logo-text { overflow: hidden; }
        .sidebar-brand {
          display: block;
          font-size: 13.5px;
          font-weight: 700;
          color: var(--color-text);
          white-space: nowrap;
          letter-spacing: -0.02em;
        }
        .sidebar-brand-sub {
          display: block;
          font-size: 10px;
          color: var(--color-text-muted);
          white-space: nowrap;
          letter-spacing: 0.01em;
          margin-top: 1px;
        }

        /* ── Nav ── */
        .sidebar-nav {
          padding: 10px 8px;
          overflow-y: auto;
          overflow-x: hidden;
        }

        .sidebar-link {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 9px 10px;
          border-radius: var(--radius-md);
          color: var(--color-sidebar-text);
          text-decoration: none;
          margin-bottom: 1px;
          position: relative;
          white-space: nowrap;
          min-height: 38px;
          transition:
            background-color var(--t-fast),
            color var(--t-fast);
        }
        .sidebar-link:hover {
          background: var(--color-sidebar-hover);
          color: var(--color-sidebar-text-active);
        }
        .sidebar-link.active {
          background: var(--color-sidebar-active-bg);
          color: var(--color-sidebar-text-active);
          font-weight: 600;
        }
        /* Left active line indicator */
        .sidebar-link::before {
          content: '';
          position: absolute;
          left: -8px;
          top: 50%;
          transform: translateY(-50%);
          width: 3px;
          height: 0;
          opacity: 0;
          background: var(--color-sidebar-active-bar);
          border-radius: 0 2px 2px 0;
          transition: height var(--t-base) var(--ease-out), opacity var(--t-base) var(--ease-out);
        }
        .sidebar-link.active::before {
          height: 18px;
          opacity: 1;
        }

        .sidebar-icon {
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          width: 20px;
          height: 20px;
          color: inherit;
        }
        .sidebar-label {
          font-size: 13px;
          font-weight: 500;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .sidebar-data-dot {
          width: 5px;
          height: 5px;
          background: var(--color-primary);
          border-radius: 50%;
          margin-left: auto;
          flex-shrink: 0;
          opacity: 0.8;
        }
        .sidebar-link.active .sidebar-data-dot {
          background: var(--color-sidebar-active-bar);
        }

        /* ── Theme Switcher Btn ── */
        .sidebar-theme-btn {
          display: flex;
          align-items: center;
          gap: 10px;
          width: 100%;
          padding: 11px 18px;
          background: transparent;
          border: none;
          border-top: 1px solid var(--color-sidebar-border);
          color: var(--color-sidebar-text);
          cursor: pointer;
          font-size: 12px;
          font-family: inherit;
          text-align: left;
          transition:
            background-color var(--t-fast),
            color var(--t-fast);
        }
        .sidebar-theme-btn:hover {
          background: var(--color-sidebar-hover);
          color: var(--color-sidebar-text-active);
        }

        /* ── Collapse btn ── */
        .sidebar-collapse-btn {
          display: flex;
          align-items: center;
          gap: 10px;
          width: 100%;
          padding: 11px 18px;
          background: transparent;
          border: none;
          border-top: 1px solid var(--color-sidebar-border);
          color: var(--color-sidebar-text);
          cursor: pointer;
          font-size: 12px;
          font-family: inherit;
          transition:
            background-color var(--t-fast),
            color var(--t-fast);
        }
        .sidebar-collapse-btn:hover {
          background: var(--color-sidebar-hover);
          color: var(--color-sidebar-text-active);
        }

        /* ── Status Footer ── */
        .sidebar-status {
          display: flex;
          align-items: center;
          gap: 9px;
          padding: 12px 18px;
          border-top: 1px solid var(--color-sidebar-border);
          flex-shrink: 0;
          min-height: 52px;
        }
        .status-indicator {
          width: 7px;
          height: 7px;
          background: #22C55E;
          border-radius: 50%;
          flex-shrink: 0;
          box-shadow: 0 0 0 2px rgba(34, 197, 94, 0.2);
          animation: pulse-status 2.5s ease-in-out infinite;
        }
        @keyframes pulse-status {
          0%, 100% { box-shadow: 0 0 0 2px rgba(34,197,94,0.2); }
          50% { box-shadow: 0 0 0 4px rgba(34,197,94,0.08); }
        }
        @media (prefers-reduced-motion: reduce) {
          .status-indicator { animation: none; }
        }
        .sidebar-status-text { overflow: hidden; }
        .status-title {
          display: block;
          font-size: 11px;
          font-weight: 600;
          color: var(--color-text-muted);
          white-space: nowrap;
        }
        .status-detail {
          display: block;
          font-size: 10px;
          color: var(--color-sidebar-text);
          white-space: nowrap;
          opacity: 0.7;
        }
      `}</style>
    </>
  );
}
