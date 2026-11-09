import React from 'react';
import { Activity, Calendar, Clock, AlertTriangle, Droplets } from 'lucide-react';

const FertilizerDashboard = ({ inventory = [], schedules = [], recipes = [], systemStatus, actuators = [] }) => {
  const mixer = actuators.find(a => a.label.includes('Mixer')) || {};
  const isScheduleMode = mixer.control_mode === 'schedule';

  // Low stock detection
  const lowStockItems = inventory.filter(item => item.stock < 500);

  // Active schedules
  const activeSchedules = schedules.filter(s => s.isActive !== false).map(s => {
    const rx = recipes.find(r => r.id === s.recipeId);
    return { ...s, recipeName: rx ? rx.name : 'Unknown Recipe' };
  });

  return (
    <div className="system-controls-page-wrapper">
      <div className="premium-controls-grid">
        
        {/* LEFT COLUMN: SYSTEM STATUS & ALERTS */}
        <div className="control-panel-section">
          <div className="control-section-header">
            <div className="control-section-title-row">
              <div className="control-section-icon-box" style={{ background: 'rgba(56, 189, 248, 0.1)', color: '#38bdf8' }}>
                <Activity className="control-section-icon" />
              </div>
              <h2 className="control-section-title">System Overview</h2>
            </div>
            <p className="control-section-desc">Real-time status and inventory health</p>
          </div>

          <div className="control-cards-stack">
            
            {/* System Status Card */}
            <div className="premium-control-card" style={{ borderLeft: systemStatus === 'MIXING' ? '4px solid #f59e0b' : '4px solid #10b981' }}>
              <div className="premium-control-top">
                <div className="premium-control-info">
                  <div className="premium-control-name">Mixer Status</div>
                  <div className="premium-control-sub">
                    {systemStatus === 'IDLE' ? 'System is online and ready for tasks' : 'ESP32 is currently mixing a recipe'}
                  </div>
                </div>
                <div className="premium-control-actions">
                  <div className={`status-chip ${systemStatus === 'MIXING' ? 'off' : 'on'}`} style={systemStatus === 'MIXING' ? { background: '#f59e0b', color: 'var(--v4-text-primary)' } : {}}>
                    {systemStatus}
                  </div>
                </div>
              </div>
            </div>

            {/* Mixer Automation Mode Card */}
            <div className="premium-control-card">
              <div className="premium-control-top">
                <div className="premium-control-info">
                  <div className="premium-control-name">Automation Mode</div>
                  <div className="premium-control-sub">
                    {isScheduleMode ? 'Mixer is following schedules' : 'Mixer is in manual override'}
                  </div>
                </div>
                <div className="premium-control-actions">
                  <div className={`status-chip ${isScheduleMode ? 'schedule' : 'off'}`} style={!isScheduleMode ? { background: '#f97316' } : {}}>
                    {isScheduleMode ? 'AUTO' : 'MANUAL'}
                  </div>
                </div>
              </div>
              {!isScheduleMode && schedules.length > 0 && (
                <div style={{ 
                  marginTop: 12, padding: '10px 14px', background: 'rgba(239, 68, 68, 0.1)', 
                  borderRadius: 8, border: '1px solid rgba(239, 68, 68, 0.2)', 
                  fontSize: 13, color: '#fca5a5', fontWeight: 600,
                  display: 'flex', alignItems: 'center', gap: 8
                }}>
                  <AlertTriangle size={16} color="#ef4444" />
                  Schedules will not execute while Mixer is not in Schedule mode.
                </div>
              )}
            </div>

            {/* Inventory Alerts Card */}
            <div className="premium-control-card" style={{ borderLeft: lowStockItems.length > 0 ? '4px solid #ef4444' : '4px solid #10b981' }}>
              <div className="premium-control-top">
                <div className="premium-control-info">
                  <div className="premium-control-name">Inventory Health</div>
                  <div className="premium-control-sub">
                    {lowStockItems.length > 0 ? `${lowStockItems.length} items require refill` : 'All nutrient levels are healthy'}
                  </div>
                </div>
                <div className="premium-control-actions">
                  {lowStockItems.length > 0 ? (
                    <div className="status-chip off" style={{ background: '#ef4444' }}>ALERT</div>
                  ) : (
                    <div className="status-chip on">OK</div>
                  )}
                </div>
              </div>
              
              {lowStockItems.length > 0 && (
                <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {lowStockItems.map(item => (
                    <div key={item.id} style={{ 
                      display: 'flex', justifyContent: 'space-between', 
                      background: 'var(--v4-icon-bg)', padding: '8px 12px', 
                      borderRadius: 8, border: '1px solid rgba(255,255,255,0.03)'
                    }}>
                      <span style={{ fontSize: 13, color: 'var(--v4-text-primary)', fontWeight: 600 }}>{item.name}</span>
                      <span style={{ fontSize: 13, color: '#f87171', fontWeight: 800 }}>{item.stock} {item.unit}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>
        </div>

        {/* RIGHT COLUMN: ACTIVE SCHEDULES */}
        <div className="control-panel-section">
          <div className="control-section-header">
            <div className="control-section-title-row">
              <div className="control-section-icon-box" style={{ background: 'rgba(139, 92, 246, 0.1)', color: '#c084fc' }}>
                <Calendar className="control-section-icon" />
              </div>
              <h2 className="control-section-title">Today's Injections</h2>
            </div>
            <p className="control-section-desc">Upcoming automated fertilizer schedules</p>
          </div>

          <div className="control-cards-stack">
            {activeSchedules.length === 0 ? (
              <div className="premium-control-card" style={{ alignItems: 'center', justifyContent: 'center', padding: '40px 20px', background: 'var(--v4-card-bg)' }}>
                <Clock size={40} color="rgba(255,255,255,0.1)" style={{ marginBottom: 16 }} />
                <div style={{ color: 'var(--v4-text-secondary)', fontWeight: 600, fontSize: 15 }}>No active schedules for today</div>
              </div>
            ) : (
              activeSchedules.map(sch => (
                <div key={sch.id} className="premium-control-card" style={{ opacity: isScheduleMode ? 1 : 0.6 }}>
                  <div className="premium-control-top">
                    <div className="premium-control-info">
                      <div className="premium-control-name" style={{ color: 'var(--v4-text-primary)', fontSize: 20, fontFamily: 'monospace', letterSpacing: '-0.5px' }}>{sch.time}</div>
                      <div className="premium-control-sub" style={{ color: '#38bdf8', fontWeight: 700, fontSize: 14 }}>{sch.recipeName}</div>
                      <div className="premium-control-meta" style={{ marginTop: 8 }}>
                        <div className="meta-item">Days: {sch.daysOfWeek.join(', ')}</div>
                      </div>
                    </div>
                    <div className="premium-control-actions">
                      <div className="status-chip schedule" style={{ padding: '6px 12px' }}>
                        SCHEDULED
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

      </div>
    </div>
  );
};

export default FertilizerDashboard;
