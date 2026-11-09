import React from 'react';
import { AlertTriangle, ShieldAlert, Info, CheckCircle, Wifi, Thermometer, Droplets, FlaskConical } from 'lucide-react';

const alerts = [
  { id: 1, level: 'critical', title: 'High Temperature Detected', msg: 'Inside temp reached 31.2°C. Exhaust fans triggered.', time: '5 min ago', icon: Thermometer, resolved: false },
  { id: 2, level: 'warning',  title: 'Low Water Tank Level',      msg: 'Main water tank at 18%. Refill required soon.',       time: '32 min ago', icon: Droplets, resolved: false },
  { id: 3, level: 'warning',  title: 'Low Fertilizer Level',      msg: 'Fertilizer tank at 15%. Check before next cycle.',   time: '1 hr ago', icon: FlaskConical, resolved: false },
  { id: 4, level: 'info',     title: 'Sensor CO2-01 Back Online', msg: 'CO2 sensor reconnected after 4 minutes offline.',     time: '2 hr ago', icon: Wifi, resolved: true },
  { id: 5, level: 'info',     title: 'Morning Irrigation Done',   msg: 'Schedule completed: 15 min watering cycle finished.',  time: '6 hr ago', icon: CheckCircle, resolved: true },
];

const LEVEL_MAP = {
  critical: { cls: 'critical', color: 'var(--accent-danger)',  IconComp: ShieldAlert },
  warning:  { cls: 'warning',  color: 'var(--accent-alert)',   IconComp: AlertTriangle },
  info:     { cls: 'info',     color: 'var(--accent-water)',   IconComp: Info },
};

const Alerts = () => (
  <div className="alerts-page-container">
    {/* Active Alerts */}
    <div className="glass-card">
      <div className="card-title"><ShieldAlert size={15} /> Active Alerts</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {alerts.filter(a => !a.resolved).map(a => {
          const { cls, color, IconComp } = LEVEL_MAP[a.level];
          return (
            <div key={a.id} className={`alert-item ${cls}`}>
              <div style={{ marginTop: 2 }}>
                <IconComp size={20} color={color} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontWeight: 600, color }}>{a.title}</span>
                  <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{a.time}</span>
                </div>
                <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 3 }}>{a.msg}</div>
              </div>
            </div>
          );
        })}
      </div>
    </div>

    {/* Sensor Health */}
    <div className="glass-card">
      <div className="card-title"><Wifi size={15} /> Sensor Health</div>
      <div className="grid-12">
        {[
          { name: 'Temp Sensor',     status: 'Online',  ok: true },
          { name: 'Humidity Sensor', status: 'Online',  ok: true },
          { name: 'CO2 Sensor',      status: 'Online',  ok: true },
          { name: 'Rain Sensor',     status: 'Online',  ok: true },
          { name: 'Soil Sensor',     status: 'Warning', ok: false },
          { name: 'EC Sensor',       status: 'Online',  ok: true },
        ].map(s => (
          <div key={s.name} className="col-4" style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            padding: '10px 14px', borderRadius: 10, background: 'rgba(0,0,0,0.2)',
            border: '1px solid var(--glass-border)'
          }}>
            <span style={{ fontSize: 13 }}>{s.name}</span>
            <span className={`badge ${s.ok ? 'badge-ok' : 'badge-warn'}`}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'currentColor', display: 'inline-block' }} />
              {s.status}
            </span>
          </div>
        ))}
      </div>
    </div>

    {/* Alert History */}
    <div className="glass-card">
      <div className="card-title"><CheckCircle size={15} /> Alert History</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {alerts.filter(a => a.resolved).map(a => {
          const { color } = LEVEL_MAP[a.level];
          return (
            <div key={a.id} style={{
              display: 'flex', gap: 12, alignItems: 'center',
              padding: '10px 14px', borderRadius: 10,
              background: 'rgba(0,0,0,0.1)', opacity: 0.7
            }}>
              <CheckCircle size={16} color="var(--primary)" />
              <div style={{ flex: 1 }}>
                <span style={{ fontWeight: 500, fontSize: 13 }}>{a.title}</span>
                <span style={{ fontSize: 11, color: 'var(--text-muted)', marginLeft: 10 }}>{a.time}</span>
              </div>
              <span className="badge badge-ok">Resolved</span>
            </div>
          );
        })}
      </div>
    </div>
  </div>
);

export default Alerts;
