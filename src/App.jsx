import React, { useState, useEffect } from 'react';
import {
  LayoutDashboard, Droplet, BarChart2,
  CalendarDays, Bell, Settings, Zap,
  ChevronDown, Moon, Sun, Lamp, LayoutGrid, LogOut
} from 'lucide-react';
import './index.css';

import Dashboard from './components/Dashboard';
import Analytics from './components/Analytics';
import FertilizerManager from './components/FertilizerManager';
import Schedules from './components/Schedules';
import Alerts from './components/Alerts';
import SettingsComp from './components/Settings';
import SystemControls from './components/SystemControls';
import LightingControl from './components/LightingControl';
import GreenhouseDesigner from './components/GreenhouseDesigner';
import AuthScreen from './components/AuthScreen';
import RecoveryPasswordScreen from './components/RecoveryPasswordScreen';
import SanotaLogo from './components/SanotaLogo';
import { useGreenhouseData } from './hooks/useGreenhouseData';
import { useAuth } from './hooks/useAuth';
import loginBackground from './assets/greenhouse-bg.jpg';

const NAV = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'controls', label: 'System Control', icon: Zap },
  { id: 'fertilizer', label: 'Fertilizer Management', icon: Droplet },
  { id: 'lighting', label: 'Lighting Control', icon: Lamp },
  { id: 'analytics', label: 'Analytics', icon: BarChart2 },
  { id: 'schedule', label: 'Schedules', icon: CalendarDays },
  { id: 'designer', label: 'Greenhouse Design', icon: LayoutGrid },
  { id: 'alerts', label: 'System Logs', icon: Bell, badge: 2 },
  { id: 'settings', label: 'Settings', icon: Settings },
];

const PAGE_TITLES = {
  dashboard: { title: 'Dashboard', sub: 'Real-time greenhouse overview' },
  designer: { title: 'Greenhouse Designer', sub: 'Plan and visualize your crop layout' },
  controls: { title: 'System Controls', sub: 'Hardware manual overrides & schedule combinations' },
  fertilizer: { title: 'Fertilizer Manager', sub: 'Nutrient recipes & dosing logs' },
  lighting: { title: 'Lighting Control', sub: 'Grow light profiles, schedules & intensity' },
  analytics: { title: 'Data Analytics & Reporting', sub: 'Historical data analysis and performance insights' },
  schedule: { title: 'Scheduling System', sub: 'Automated irrigation, lighting & fertigation' },
  alerts: { title: 'Alerts & Notifications', sub: 'Active alerts and sensor health status' },
  settings: { title: 'Settings', sub: 'System configuration & user management' },
};

export default function App() {
  const { user, authLoading, isRecoveryFlow, signIn, signInWithGoogle, signUp, resetPassword, completePasswordReset, clearRecoveryFlow, signOut } = useAuth();
  const ghData = useGreenhouseData(user);
  const {
    zones, selectedZone, setSelectedZone, nodes,
    sensors, readings, historicalReadings, actuators, schedules,
    automationRules, alerts,
    systemSettings,
    addSchedule, updateSchedule, deleteSchedule,
    updateActuatorMode, updateActuatorState,
    addAutomationRule, updateAutomationRule, deleteAutomationRule, registerDevice, deleteDevice,
    updateSystemSettings,
    loading
  } = ghData;

  // Calculate System Status (Online if any data/reading was received in the last 5 minutes)
  const isOnline = historicalReadings.some(reading => {
    if (!reading.created_at) return false;
    const readingTime = new Date(reading.created_at);
    return (Date.now() - readingTime.getTime()) < 5 * 60 * 1000; // 5 minutes threshold
  });

  // Filter actuators by selected zone
  const activeNodeIds = nodes
    .filter(n => !selectedZone || n.zone_id === selectedZone.id)
    .map(n => n.id);
  const activeActuators = actuators.filter(a => activeNodeIds.includes(a.node_id));
  const activeSensors = sensors.filter(s => activeNodeIds.includes(s.node_id));

  const [tab, setTab] = useState('dashboard');
  const [theme, setTheme] = useState(() => localStorage.getItem('sanota-theme') || 'light');
  const [showZoneMenu, setShowZoneMenu] = useState(false);

  // Helper to get actual outside temp from readings
  const getOutsideTemp = () => {
    const s = sensors.find(s => s.sensor_type === 'temp_outside' || s.sensor_type === 'OUTSIDE_TEMP' || s.sensor_type === 'outside_temperature');
    if (s && readings[s.id] !== undefined) return readings[s.id];
    return 0;
  };

  const outsideTemp = getOutsideTemp();

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('sanota-theme', theme);
  }, [theme]);

  const toggleTheme = () => setTheme(t => t === 'dark' ? 'light' : 'dark');

  if (authLoading) {
    return (
      <div className="auth-shell">
        <img src={loginBackground} alt="Greenhouse" className="auth-bg-image" />
        <div className="auth-bg-overlay" />
        <div className="auth-panel" style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 18, position: 'relative', zIndex: 10 }}>
          <SanotaLogo height={52} showSubtitle subtitleText="Smart Greenhouse Control System" />
          <div className="auth-brand-name" style={{ fontSize: 14, opacity: 0.8, fontWeight: 500, letterSpacing: '0.04em' }}>
            Loading your workspace...
          </div>
        </div>
      </div>
    );
  }

  if (isRecoveryFlow && user) {
    return (
      <RecoveryPasswordScreen
        onComplete={completePasswordReset}
        onCancel={async () => {
          await signOut();
          clearRecoveryFlow();
        }}
        loading={authLoading}
      />
    );
  }

  if (!user) {
    return (
      <AuthScreen
        onSignIn={signIn}
        onSignUp={signUp}
        onSignInWithGoogle={signInWithGoogle}
        onResetPassword={resetPassword}
        loading={authLoading}
        theme={theme}
        toggleTheme={toggleTheme}
      />
    );
  }

  return (
    <div className="main-app-container">
      {/* ===== SIDEBAR ===== */}
      <aside className="sidebar">
        {/* Logo */}
        <div className="sidebar-brand hide-mobile">
          <SanotaLogo height={34} showSubtitle subtitleText="Greenhouse Automation" />
        </div>

        {/* Zone Selector */}
        <div className="hide-mobile" style={{ padding: '0 16px 12px', position: 'relative' }}>
          <div
            onClick={() => setShowZoneMenu(!showZoneMenu)}
            className="zone-selector-trigger"
          >
            <div className="zone-selector-title">
              {selectedZone ? selectedZone.name : 'All Zones'}
            </div>
            <ChevronDown size={16} />
          </div>

          {showZoneMenu && (
            <div className="zone-dropdown-menu">
              <div
                onClick={() => { setSelectedZone(null); setShowZoneMenu(false); }}
                className={`zone-dropdown-item ${!selectedZone ? 'active' : ''}`}
              >
                All Zones
              </div>
              {zones.map(z => (
                <div
                  key={z.id}
                  onClick={() => { setSelectedZone(z); setShowZoneMenu(false); }}
                  className={`zone-dropdown-item ${selectedZone?.id === z.id ? 'active' : ''}`}
                >
                  {z.name}
                </div>
              ))}
              {zones.length === 0 && <div style={{ padding: 8, fontSize: 12, color: 'var(--text-muted)' }}>No zones found</div>}
            </div>
          )}
        </div>

        {/* <removed theme toggle from sidebar> */}



        <nav className="sidebar-nav">
          {NAV.map(n => (
            <div key={n.id} className={`nav-item ${tab === n.id ? 'active' : ''}`} onClick={() => setTab(n.id)}>
              <n.icon size={20} className="nav-item-icon" />
              <span className="nav-item-label">{n.label}</span>
              {n.badge && (
                <span className="nav-item-badge">{n.badge}</span>
              )}
            </div>
          ))}
        </nav>

        {/* Status & Actions Dock */}
        <div className="sidebar-bottom hide-mobile">
          <div className="sidebar-status-card">
            <div className="status-dot" style={{ background: isOnline ? 'var(--accent-green)' : 'var(--accent-red)', boxShadow: `0 0 10px ${isOnline ? 'var(--accent-green)' : 'var(--accent-red)'}` }} />
            <div className="sidebar-status-text" style={{ color: isOnline ? 'var(--accent-green)' : 'var(--accent-red)' }}>
              {isOnline ? 'System Online' : 'System Offline'}
            </div>
          </div>
          <button className="sidebar-logout-btn" onClick={signOut}>
            <LogOut size={16} /> Logout
          </button>
        </div>
      </aside>

      {/* ===== MAIN CONTENT ===== */}
      <main className="main-content">
        {/* Page Header */}
        <header className="page-header">
          {/* Mobile Top Navigation Row: Logo + Controls */}
          <div className="mobile-header-top hide-desktop">
            <div className="mobile-brand">
              <SanotaLogo height={26} />
            </div>

            <div className="mobile-top-actions">
              {/* Zone Selector on Mobile */}
              <div style={{ position: 'relative' }}>
                <div className="gh-selector-mobile" onClick={() => setShowZoneMenu(!showZoneMenu)}>
                  <span className="zone-pill-text">{selectedZone ? selectedZone.name : 'All Zones'}</span>
                  <ChevronDown size={13} />
                </div>

                {showZoneMenu && (
                  <div className="zone-dropdown-menu mobile-align-right">
                    <div
                      onClick={() => { setSelectedZone(null); setShowZoneMenu(false); }}
                      className={`zone-dropdown-item ${!selectedZone ? 'active' : ''}`}
                    >
                      All Zones
                    </div>
                    {zones.map(z => (
                      <div
                        key={z.id}
                        onClick={() => { setSelectedZone(z); setShowZoneMenu(false); }}
                        className={`zone-dropdown-item ${selectedZone?.id === z.id ? 'active' : ''}`}
                      >
                        {z.name}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Theme Toggle Button */}
              <button
                type="button"
                onClick={toggleTheme}
                className="theme-toggle-btn"
                aria-label="Toggle Theme"
                title="Toggle Theme"
              >
                {theme === 'dark' ? <Sun size={17} /> : <Moon size={17} />}
              </button>

              {/* Compact Logout Icon Button for Mobile */}
              <button
                type="button"
                className="header-logout-btn mobile-icon-logout"
                onClick={signOut}
                title="Logout"
                aria-label="Logout"
              >
                <LogOut size={16} />
              </button>
            </div>
          </div>

          {/* Main Title Row: Desktop Actions & Mobile Weather */}
          <div className="header-main-row">
            <div className="header-primary">
              <div className="page-title">{PAGE_TITLES[tab].title}</div>
              <div className="page-sub">{PAGE_TITLES[tab].sub}</div>
            </div>

            {/* Desktop Actions */}
            <div className="header-actions hide-mobile">
              <div onClick={toggleTheme} className="theme-toggle-btn">
                {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
              </div>

              <div className="header-user-chip">
                {user.email}
              </div>

              <button className="header-logout-btn" onClick={signOut}>
                <LogOut size={16} />
                <span>Logout</span>
              </button>

              <div className="glass-card header-stat">
                <span className="stat-label">OUTSIDE</span>
                <span className="stat-value" style={{ color: 'var(--text-primary)' }}>{outsideTemp}°C</span>
                <span className="stat-emoji">{outsideTemp > 25 ? 'Warm' : 'Cool'}</span>
              </div>
            </div>

            {/* Mobile Weather Pill */}
            <div className="mobile-weather-pill hide-desktop">
              <span className="mobile-weather-temp">{outsideTemp}°C</span>
              <span className="mobile-weather-label">{outsideTemp > 25 ? 'Warm' : 'Outside'}</span>
            </div>
          </div>
        </header>


        {/* Tab Pages */}
        {tab === 'dashboard' && <Dashboard {...ghData} />}
        {tab === 'designer' && (
          <GreenhouseDesigner
            savedDesigns={ghData.greenhouseDesigns}
            addDesign={ghData.addGreenhouseDesign}
            deleteDesign={ghData.deleteGreenhouseDesign}
          />
        )}
        {tab === 'controls' && (
          <SystemControls
            actuators={activeActuators}
            actuatorLogs={ghData.actuatorLogs}
            updateActuatorMode={updateActuatorMode}
            updateActuatorState={updateActuatorState}
          />
        )}
        {tab === 'fertilizer' && <FertilizerManager {...ghData} user={user} />}
        {tab === 'lighting' && <LightingControl {...ghData} actuators={activeActuators} />}
        {tab === 'analytics' && <Analytics {...ghData} />}
        {tab === 'schedule' && (
          <Schedules
            actuators={activeActuators}
            schedules={schedules}
            addSchedule={addSchedule}
            updateSchedule={updateSchedule}
            deleteSchedule={deleteSchedule}
            loading={loading}
          />
        )}
        {tab === 'alerts' && <Alerts alerts={alerts} sensors={activeSensors} historicalReadings={historicalReadings} />}
        {tab === 'settings' && (
          <SettingsComp
            zones={zones}
            selectedZone={selectedZone}
            nodes={nodes}
            actuators={actuators}
            sensors={sensors}
            automationRules={automationRules}
            systemSettings={systemSettings}
            addAutomationRule={addAutomationRule}
            updateAutomationRule={updateAutomationRule}
            deleteAutomationRule={deleteAutomationRule}
            registerDevice={registerDevice}
            deleteDevice={deleteDevice}
            updateSystemSettings={updateSystemSettings}
          />
        )}
      </main>
    </div>
  );
}
