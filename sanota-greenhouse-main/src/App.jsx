import React, { useState, useEffect } from 'react';
import {
  LayoutDashboard, Droplet, BarChart2,
  CalendarDays, Bell, Settings, Zap,
  ChevronDown, Moon, Sun, Lamp, LayoutGrid, LogOut, Leaf
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
import { useGreenhouseData } from './hooks/useGreenhouseData';
import { useAuth } from './hooks/useAuth';
import loginBackground from './assets/GREEN BACK.png';

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
  const [theme, setTheme] = useState(() => localStorage.getItem('sanota-theme') || 'dark');
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
      <div className="auth-shell" style={{ '--auth-bg-image': `url(${loginBackground})` }}>
        <div className="auth-panel" style={{ textAlign: 'center' }}>
          <div className="auth-brand-name">Loading your workspace...</div>
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
      />
    );
  }

  return (
    <div className="main-app-container">
      {/* ===== SIDEBAR ===== */}
      <aside className="sidebar">
        {/* Logo */}
        <div className="sidebar-brand hide-mobile">
          <div className="sidebar-brand-icon">
            <Leaf size={20} strokeWidth={2.5} />
          </div>
          <div className="sidebar-brand-copy">
            <div className="sidebar-brand-title">GreenHouse</div>
            <div className="sidebar-brand-subtitle">Smart Control System</div>
          </div>
        </div>

        {/* Zone Selector */}
        <div className="hide-mobile" style={{ padding: '0 16px 12px', position: 'relative' }}>
          <div
            onClick={() => setShowZoneMenu(!showZoneMenu)}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '12px 14px',
              borderRadius: 16,
              background: 'linear-gradient(135deg, rgba(41,168,255,0.14), rgba(34,211,238,0.08))',
              border: '1px solid rgba(41,168,255,0.18)',
              boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.04)',
              cursor: 'pointer'
            }}
          >
            <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--primary-bright)', letterSpacing: '-0.2px' }}>
              {selectedZone ? selectedZone.name : 'All Zones'}
            </div>
            <ChevronDown size={16} color="var(--primary-bright)" />
          </div>

          {showZoneMenu && (
            <div className="glass-card" style={{
              position: 'absolute', top: '100%', left: 16, right: 16, zIndex: 100,
              marginTop: 10, padding: 10, boxShadow: '0 24px 50px rgba(0,0,0,0.32)',
              background: 'linear-gradient(180deg, rgba(12, 19, 36, 0.98), rgba(7, 12, 24, 0.98))',
              border: '1px solid rgba(41,168,255,0.12)', borderRadius: 18
            }}>
              <div
                onClick={() => { setSelectedZone(null); setShowZoneMenu(false); }}
                style={{
                  padding: '11px 14px', borderRadius: 12, cursor: 'pointer',
                  background: !selectedZone ? 'var(--primary-dim)' : 'transparent',
                  color: !selectedZone ? 'var(--primary)' : 'var(--text-primary)',
                  marginBottom: 4, transition: 'all 0.2s', fontWeight: 600, fontSize: 14
                }}
                className="zone-item-hover"
              >
                All Zones
              </div>
              {zones.map(z => (
                <div
                  key={z.id}
                  onClick={() => { setSelectedZone(z); setShowZoneMenu(false); }}
                  style={{
                    padding: '11px 14px', borderRadius: 12, cursor: 'pointer',
                    background: selectedZone?.id === z.id ? 'var(--primary-dim)' : 'transparent',
                    color: selectedZone?.id === z.id ? 'var(--primary)' : 'var(--text-primary)',
                    marginBottom: 4, transition: 'all 0.2s', fontWeight: 600, fontSize: 14
                  }}
                  className="zone-item-hover"
                >
                  {z.name}
                </div>
              ))}
              {zones.length === 0 && <div style={{ padding: 8, fontSize: 12, color: 'var(--text-muted)' }}>No zones found</div>}
            </div>
          )}
        </div>

        {/* <removed theme toggle from sidebar> */}



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
            <div className="status-dot" style={{ background: isOnline ? 'var(--accent-green)' : 'var(--accent-red)', boxShadow: `0 0 10px ${isOnline ? 'var(--accent-green)' : 'var(--accent-red)'}` }} />
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: isOnline ? 'var(--accent-green)' : 'var(--accent-red)' }}>
                {isOnline ? 'System Online' : 'System Offline'}
              </div>
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
        <div className="page-header">
          <div className="header-primary">
            <div className="page-title">{PAGE_TITLES[tab].title}</div>
            <div className="page-sub">{PAGE_TITLES[tab].sub}</div>
          </div>

          <div className="header-actions">
            {/* Zone Selector (Show on Mobile) */}
            <div style={{ position: 'relative' }} className="hide-desktop">
              <div className="gh-selector-mobile" onClick={() => setShowZoneMenu(!showZoneMenu)}>
                {selectedZone ? selectedZone.name : 'All Zones'} <ChevronDown size={14} />
              </div>

              {showZoneMenu && (
                <div className="glass-card" style={{
                  position: 'absolute', top: '100%', right: 0, zIndex: 100,
                  marginTop: 12, padding: 8, minWidth: 200, boxShadow: 'var(--glass-shadow)',
                  background: 'var(--bg-elevated)', border: '1px solid var(--glass-border)'
                }}>
                  <div
                    onClick={() => { setSelectedZone(null); setShowZoneMenu(false); }}
                    style={{
                      padding: '12px 16px', borderRadius: 10, cursor: 'pointer',
                      background: !selectedZone ? 'var(--primary-dim)' : 'transparent',
                      color: !selectedZone ? 'var(--primary)' : 'var(--text-primary)',
                      marginBottom: 4, whiteSpace: 'nowrap', fontWeight: 600, fontSize: 14
                    }}
                  >
                    All Zones
                  </div>
                  {zones.map(z => (
                    <div
                      key={z.id}
                      onClick={() => { setSelectedZone(z); setShowZoneMenu(false); }}
                      style={{
                        padding: '12px 16px', borderRadius: 10, cursor: 'pointer',
                        background: selectedZone?.id === z.id ? 'var(--primary-dim)' : 'transparent',
                        color: selectedZone?.id === z.id ? 'var(--primary)' : 'var(--text-primary)',
                        marginBottom: 4, whiteSpace: 'nowrap', fontWeight: 600, fontSize: 14
                      }}
                    >
                      {z.name}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Theme Toggle in Header */}
            <div onClick={toggleTheme} className="theme-toggle-btn">
              {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
            </div>

            <div className="header-user-chip">
              {user.email}
            </div>

            <button className="header-logout-btn" onClick={signOut}>
              <LogOut size={16} />
              Logout
            </button>

            <div className="glass-card header-stat">
              <span className="stat-label">OUTSIDE</span>
              <span className="stat-value" style={{ color: 'var(--text-primary)' }}>{outsideTemp}°C</span>
              <span className="stat-emoji">{outsideTemp > 25 ? 'Warm' : 'Cool'}</span>
            </div>
          </div>
        </div>


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
