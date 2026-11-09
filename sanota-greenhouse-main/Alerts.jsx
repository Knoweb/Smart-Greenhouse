import React, { useState, useEffect } from 'react';
import {
  LayoutDashboard, Droplet, BarChart2,
  CalendarDays, Bell, Settings, Zap,
  ChevronDown, Moon, Sun
} from 'lucide-react';
import './index.css';

import Dashboard        from './components/Dashboard';
import Analytics       from './components/Analytics';
import FertilizerManager from './components/FertilizerManager';
import Schedules       from './components/Schedules';
import Alerts          from './components/Alerts';
import SettingsComp    from './components/Settings';
import SystemControls  from './components/SystemControls';

const NAV = [
  { id: 'dashboard',   label: 'Dashboard',          icon: LayoutDashboard },
  { id: 'controls',    label: 'System Controls',    icon: Zap },
  { id: 'fertilizer',  label: 'Fertilizer Manager', icon: Droplet },
  { id: 'analytics',   label: 'Analytics & Trends', icon: BarChart2 },
  { id: 'schedule',    label: 'Scheduling',         icon: CalendarDays },
  { id: 'alerts',      label: 'Alerts',             icon: Bell, badge: 2 },
  { id: 'settings',    label: 'Settings',           icon: Settings },
];

const PAGE_TITLES = {
  dashboard:  { title: 'Dashboard',             sub: 'Real-time greenhouse overview' },
  controls:   { title: 'System Controls',       sub: 'Hardware manual overrides & schedule combinations' },
  fertilizer: { title: 'Fertilizer Manager',    sub: 'Nutrient recipes & dosing logs' },
  analytics:  { title: 'Analytics & Reports',   sub: '24h trend charts, Soil, EC & NPK insights' },
  schedule:   { title: 'Scheduling System',     sub: 'Automated irrigation, lighting & fertigation' },
  alerts:     { title: 'Alerts & Notifications', sub: 'Active alerts and sensor health status' },
  settings:   { title: 'Settings',              sub: 'System configuration & user management' },
};

export default function App() {
  const [tab, setTab] = useState('dashboard');
  const [gh, setGh]   = useState('Greenhouse A');
  const [theme, setTheme] = useState(() => localStorage.getItem('sanota-theme') || 'dark');

  const [systemState, setSystemState] = useState({
    mainPump:       { name: 'Main Water Pump', type: 'irrigation',  on: true,  mode: 'schedule', schedules: [{ id: 1, time: '06:00', duration: 15, active: true }] },
    irrigationPump: { name: 'Irrigation Pump', type: 'irrigation',  on: false, mode: 'schedule', schedules: [{ id: 2, time: '06:15', duration: 20, active: true }] },
    fertilizerPump: { name: 'Fertilizer Pump', type: 'fertigation', on: false, mode: 'schedule', schedules: [{ id: 3, time: '06:30', duration: 5,  active: false }] },
    misters:        { name: 'Misters / Foggers', type: 'irrigation',on: false, mode: 'schedule', schedules: [{ id: 4, time: '12:00', duration: 10, active: true }] },
    exhaustFans:    { name: 'Exhaust Fans',      type: 'ventilation', on: true,  mode: 'schedule', schedules: [{ id: 5, time: '10:00', duration: 120, active: true }] },
    airFans:        { name: 'Air Circulation',   type: 'ventilation', on: true,  mode: 'schedule', schedules: [{ id: 6, time: '00:00', duration: 5,  active: true }] },
    curtains:       { name: 'Shade Curtains',    type: 'lighting',    on: false, mode: 'schedule', schedules: [{ id: 7, time: '18:00', duration: 0,  active: false }] },
  });

  const [recipes, setRecipes] = useState([
    { id: 1, name: 'Seedling Stage',    n: 10, p: 52, k: 10, notes: 'Low concentration, high P for root growth.' },
    { id: 2, name: 'Vegetative Growth', n: 25, p: 20, k: 20, notes: 'Balanced NPK for leaf and stem growth.' },
    { id: 3, name: 'Fruiting Stage',    n: 12, p: 12, k: 36, notes: 'High K for fruit development and quality.' },
  ]);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('sanota-theme', theme);
  }, [theme]);

  const toggleTheme = () => setTheme(t => t === 'dark' ? 'light' : 'dark');

  return (
    <div className="main-app-container">
      {/* ===== SIDEBAR ===== */}
      <aside className="sidebar">
        {/* Logo */}
        <div className="sidebar-logo hide-mobile">
          <div className="logo-icon">
            <Zap size={22} />
          </div>
          <div>
            <div className="logo-name">Sanota</div>
            <div className="logo-sub">Greenhouse Control</div>
          </div>
        </div>

        {/* Greenhouse Selector */}
        <div className="hide-mobile" style={{ padding: '0 16px 12px' }}>
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '10px 14px', borderRadius: 12, background: 'var(--primary-dim)',
            border: '1px solid var(--glass-border)', cursor: 'pointer'
          }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--primary)' }}>{gh}</div>
            <ChevronDown size={16} color="var(--primary)" />
          </div>
        </div>

        {/* <removed theme toggle from sidebar> */}

        <div className="sidebar-section-label hide-mobile">Navigation</div>

        <nav>
          {NAV.map(n => (
            <div key={n.id} className={`nav-item ${tab === n.id ? 'active' : ''}`} onClick={() => setTab(n.id)}>
              <n.icon size={22} className="nav-item-icon" />
              <span>{n.label}</span>
              {n.badge && (
                <span style={{
                  position: 'absolute', top: tab === n.id ? -5 : 5, right: tab === n.id ? -5 : 5,
                  background: 'var(--accent-red)', color: '#fff',
                  borderRadius: '50%', width: 18, height: 18,
                  fontSize: 10, fontWeight: 800,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  border: '2px solid var(--sidebar-bg)',
                  transition: 'all 0.3s'
                }}>{n.badge}</span>
              )}
            </div>
          ))}
        </nav>


        {/* Status */}
        <div className="sidebar-bottom hide-mobile">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 0' }}>
            <div className="status-dot" />
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--accent-green)' }}>System Online</div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2, fontWeight: 500 }}>ESP32 Connected · MQTT Active</div>
            </div>
          </div>
        </div>
      </aside>

      {/* ===== MAIN CONTENT ===== */}
      <main className="main-content">
        {/* Page Header */}
        <div className="page-header">
          <div className="header-primary">
            <div className="page-title">{PAGE_TITLES[tab].title}</div>
            <div className="page-sub">{PAGE_TITLES[tab].sub}</div>
          </div>
          
          <div className="header-actions">
            {/* Greenhouse Selector (Show on Mobile) */}
            <div className="gh-selector-mobile hide-desktop" onClick={() => setGh(g => g === 'Greenhouse A' ? 'Greenhouse B' : 'Greenhouse A')}>
              {gh} <ChevronDown size={14} />
            </div>

            {/* Theme Toggle in Header */}
            <div onClick={toggleTheme} className="theme-toggle-btn">
              {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
            </div>

            <div className="glass-card header-stat hide-small-mobile">
              <span className="stat-label">OUTSIDE</span>
              <span className="stat-value">29°C</span>
              <span className="stat-emoji">☀️</span>
            </div>
          </div>
        </div>


        {/* Tab Pages */}
        {tab === 'dashboard'  && <Dashboard controls={systemState} />}
        {tab === 'controls'   && <SystemControls systemState={systemState} setSystemState={setSystemState} />}
        {tab === 'fertilizer' && <FertilizerManager recipes={recipes} setRecipes={setRecipes} />}
        {tab === 'analytics'  && <Analytics />}
        {tab === 'schedule'   && <Schedules systemState={systemState} setSystemState={setSystemState} />}
        {tab === 'alerts'     && <Alerts />}
        {tab === 'settings'   && <SettingsComp />}
      </main>
    </div>
  );
}
