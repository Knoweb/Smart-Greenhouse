import React from 'react';
import { AlertTriangle, ShieldAlert, Info, CheckCircle, Wifi, Thermometer, Droplets, FlaskConical } from 'lucide-react';

// Helper to format timestamps to "x min ago"
const formatTimeAgo = (dateStr) => {
  if (!dateStr) return 'just now';
  const now = new Date();
  const past = new Date(dateStr);
  const diffMs = now - past;
  const diffMin = Math.floor(diffMs / 60000);
  const diffHrs = Math.floor(diffMin / 60);
  const diffDays = Math.floor(diffHrs / 24);

  if (diffMin < 1) return 'just now';
  if (diffMin < 60) return `${diffMin} min ago`;
  if (diffHrs < 24) return `${diffHrs} hr ago`;
  return `${diffDays} days ago`;
};

const ICON_MAP = {
  critical: ShieldAlert,
  warning: AlertTriangle,
  info: Info,
};

const LEVEL_MAP = {
  critical: { cls: 'critical', color: 'var(--accent-red)',    IconComp: ShieldAlert },
  warning:  { cls: 'warning',  color: 'var(--accent-amber)',  IconComp: AlertTriangle },
  info:     { cls: 'info',     color: 'var(--accent-cyan)',   IconComp: Info },
};

const formatSensorLabel = (sensor) => {
  if (!sensor) return 'Unknown';
  const label = sensor.label || sensor.sensor_type || 'Sensor';
  return label.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
};

const Alerts = ({ alerts = [], sensors = [], historicalReadings = [] }) => {
  
  // Calculate sensor status
  const sensorHealthList = sensors
    .filter(s => historicalReadings.some(r => r.sensor_id === s.id))
    .map(s => {
      const latestReading = historicalReadings.find(r => r.sensor_id === s.id);
      let status = 'Offline';
      let isOk = false;

      if (latestReading) {
        const lastSeen = new Date(latestReading.created_at);
        const diffMs = new Date() - lastSeen;
        const diffMins = diffMs / (1000 * 60);

        if (diffMins < 30) {
          status = 'Online';
          isOk = true;
        }
      }

      return {
        id: s.id,
        name: formatSensorLabel(s),
        status,
        ok: isOk
      };
    });

  return (
    <div className="alerts-page-container">
      {/* Active Alerts */}
      <div className="glass-card">
        <div className="card-title"><ShieldAlert size={15} /> Active Alerts</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {alerts.filter(a => !a.is_resolved).map(a => {
            const { cls, color, IconComp } = LEVEL_MAP[a.level] || LEVEL_MAP.info;
            const ActIcon = ICON_MAP[a.level] || ShieldAlert;
            return (
              <div key={a.id} className={`alert-item ${cls}`}>
                <div style={{ marginTop: 2 }}>
                  <ActIcon size={20} color={color} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontWeight: 600, color }}>{a.title}</span>
                    <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{formatTimeAgo(a.created_at)}</span>
                  </div>
                  <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 3 }}>{a.message}</div>
                </div>
              </div>
            );
          })}
          {alerts.filter(a => !a.is_resolved).length === 0 && (
            <div style={{ textAlign: 'center', padding: 30, color: 'var(--text-muted)', fontSize: 14 }}>
              No active alerts. System status: <b>Normal</b>
            </div>
          )}
        </div>
      </div>

      {/* Sensor Health */}
      <div className="glass-card">
        <div className="card-title"><Wifi size={15} /> Sensor Health</div>
        <div className="grid-12">
          {sensorHealthList.map(s => (
            <div key={s.id} className="col-4" style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              padding: '10px 14px', borderRadius: 10, background: 'rgba(0,0,0,0.2)',
              border: '1px solid var(--glass-border)'
            }}>
              <span style={{ fontSize: 13, fontWeight: 600 }}>{s.name}</span>
              <span className={`badge ${s.ok ? 'badge-ok' : 'badge-danger'}`}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'currentColor', display: 'inline-block' }} />
                {s.status}
              </span>
            </div>
          ))}
          {sensorHealthList.length === 0 && (
            <div className="col-12" style={{ textAlign: 'center', padding: 20, color: 'var(--text-muted)' }}>
              No sensors detected in the system.
            </div>
          )}
        </div>
      </div>

      {/* Alert History */}
      <div className="glass-card">
        <div className="card-title"><CheckCircle size={15} /> Alert History</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {alerts.filter(a => a.is_resolved).map(a => {
            const { color } = LEVEL_MAP[a.level] || LEVEL_MAP.info;
            return (
              <div key={a.id} style={{
                display: 'flex', gap: 12, alignItems: 'center',
                padding: '10px 14px', borderRadius: 10,
                background: 'rgba(0,0,0,0.1)', opacity: 0.7
              }}>
                <CheckCircle size={16} color="var(--primary)" />
                <div style={{ flex: 1 }}>
                  <span style={{ fontWeight: 500, fontSize: 13 }}>{a.title}</span>
                  <span style={{ fontSize: 11, color: 'var(--text-muted)', marginLeft: 10 }}>{formatTimeAgo(a.created_at)}</span>
                </div>
                <span className="badge badge-ok">Resolved</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default Alerts;
