import React, { useState } from 'react';
import { Sliders, Users, Wifi, Cpu, Save } from 'lucide-react';

const Section = ({ title, icon: Icon, children }) => (
  <div className="glass-card">
    <div className="card-title"><Icon size={15} /> {title}</div>
    {children}
  </div>
);

const Field = ({ label, defaultVal, type = 'number', unit }) => (
  <div style={{ marginBottom: 12 }}>
    <label className="field-label">{label} {unit && `(${unit})`}</label>
    <input className="field-input" type={type} defaultValue={defaultVal} />
  </div>
);

const Settings = () => {
  const [users] = useState([
    { id: 1, name: 'Admin User', role: 'Admin', email: 'admin@sanota.lk' },
    { id: 2, name: 'Greenhouse Worker', role: 'Worker', email: 'worker@sanota.lk' },
  ]);

  return (
    <div className="grid-12" style={{ alignItems: 'start' }}>
      {/* Thresholds */}
      <Section title="Threshold Configuration" icon={Sliders} >
        <div className="settings-grid">
          <Field label="Max Temperature" defaultVal={30} unit="°C" />
          <Field label="Min Temperature" defaultVal={18} unit="°C" />
          <Field label="Max Humidity" defaultVal={90} unit="%" />
          <Field label="Min Humidity" defaultVal={40} unit="%" />
          <Field label="Low Water Alert" defaultVal={20} unit="%" />
          <Field label="Low Fertilizer Alert" defaultVal={15} unit="%" />
          <Field label="Max CO2 Level" defaultVal={1200} unit="ppm" />
          <Field label="Min Light (day)" defaultVal={200} unit="µmol" />
        </div>
        <button className="btn btn-primary" style={{ marginTop: 8 }}><Save size={14} /> Save Thresholds</button>
      </Section>



      {/* System */}
      <Section title="System Info" icon={Cpu}>
        {[
          ['Firmware Version', 'v2.4.1'],
          ['ESP32 Status', 'Online'],
          ['Last Sync', '2 min ago'],
          ['DB Connection', 'Supabase (Active)'],
          ['Uptime', '14 days 3h 22m'],
        ].map(([k, v]) => (
          <div key={k} style={{
            display: 'flex', justifyContent: 'space-between',
            padding: '8px 0', borderBottom: '1px solid rgba(255,255,255,0.05)',
            fontSize: 13
          }}>
            <span style={{ color: 'var(--text-muted)' }}>{k}</span>
            <span style={{ fontFamily: 'JetBrains Mono', fontWeight: 600 }}>{v}</span>
          </div>
        ))}
      </Section>
    </div>
  );
};

export default Settings;
