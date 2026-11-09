import React, { useState } from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  Legend, ResponsiveContainer, AreaChart, Area,
  BarChart, Bar
} from 'recharts';
import { Download, Calendar, BarChart2, ThermometerSun, Sprout, Gauge, Beaker } from 'lucide-react';

const hourlyData = [
  { t: '00:00', temp: 22.1, hum: 83, co2: 410, light: 0,   soilM: 65, ec: 1.8, n: 50, p: 30, k: 60 },
  { t: '02:00', temp: 21.5, hum: 86, co2: 415, light: 0,   soilM: 64, ec: 1.8, n: 49, p: 29, k: 59 },
  { t: '04:00', temp: 21.0, hum: 88, co2: 418, light: 0,   soilM: 63, ec: 1.8, n: 48, p: 28, k: 58 },
  { t: '06:00', temp: 22.5, hum: 81, co2: 405, light: 20,  soilM: 62, ec: 1.9, n: 47, p: 28, k: 57 },
  { t: '08:00', temp: 25.2, hum: 72, co2: 398, light: 320, soilM: 61, ec: 2.0, n: 46, p: 27, k: 56 },
  { t: '10:00', temp: 27.8, hum: 65, co2: 390, light: 580, soilM: 59, ec: 2.2, n: 44, p: 26, k: 54 },
  { t: '12:00', temp: 29.1, hum: 61, co2: 385, light: 720, soilM: 57, ec: 2.4, n: 42, p: 25, k: 51 },
  { t: '14:00', temp: 28.6, hum: 63, co2: 388, light: 680, soilM: 55, ec: 2.5, n: 40, p: 24, k: 49 },
  { t: '16:00', temp: 27.2, hum: 67, co2: 395, light: 480, soilM: 54, ec: 2.4, n: 39, p: 24, k: 48 },
  { t: '18:00', temp: 25.5, hum: 73, co2: 402, light: 200, soilM: 65, ec: 1.9, n: 55, p: 35, k: 65 }, // fertigation event
  { t: '20:00', temp: 23.8, hum: 78, co2: 408, light: 0,   soilM: 64, ec: 1.9, n: 54, p: 34, k: 64 },
  { t: '22:00', temp: 22.9, hum: 81, co2: 412, light: 0,   soilM: 64, ec: 1.9, n: 53, p: 34, k: 63 },
];

const detailedLogs = Array.from({ length: 20 }, (_, i) => ({
  time: `${String(Math.floor(i * 72 / 60)).padStart(2,'0')}:${String((i * 72) % 60).padStart(2,'0')}`,
  temp: (22 + Math.random() * 8).toFixed(1),
  hum: (60 + Math.random() * 30).toFixed(0),
  co2: (380 + Math.random() * 50).toFixed(0),
  soilMoist: (40 + Math.random() * 30).toFixed(0),
  light: (Math.random() * 700).toFixed(0),
  ec: (1.5 + Math.random() * 1.5).toFixed(2),
}));

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: 'var(--bg-elevated)', border: '1px solid var(--glass-border)',
      borderRadius: 10, padding: '10px 14px', fontSize: 13, boxShadow: '0 4px 15px rgba(0,0,0,0.1)'
    }}>
      <div style={{ color: 'var(--text-muted)', marginBottom: 6, fontWeight: 700 }}>{label}</div>
      {payload.map(p => (
        <div key={p.dataKey} style={{ color: p.color, marginBottom: 2, fontWeight: 600 }}>
          {p.name}: <strong>{p.value}</strong>
        </div>
      ))}
    </div>
  );
};

const Analytics = () => {
  const [activeTab, setActiveTab] = useState('environmental');
  const [activeEnvChart, setActiveEnvChart] = useState('temp');

  const envCharts = {
    temp: { key: 'temp', name: 'Temperature (°C)', color: 'var(--primary)', stroke: 'var(--accent-red)' },
    hum:  { key: 'hum',  name: 'Humidity (%)',     color: 'var(--accent-cyan)', stroke: 'var(--accent-cyan)' },
    co2:  { key: 'co2',  name: 'CO2 (ppm)',        color: 'var(--accent-purple)', stroke: 'var(--accent-purple)' },
    light:{ key: 'light',name: 'Light (µmol)',     color: 'var(--accent-amber)', stroke: 'var(--accent-amber)' },
  };

  const tabs = [
    { id: 'environmental', label: 'Environmental Trends', icon: ThermometerSun },
    { id: 'soil',          label: 'Soil Analysis',        icon: Sprout },
    { id: 'ec',            label: 'EC Monitoring',        icon: Gauge },
    { id: 'npk',           label: 'NPK Nutrient Levels',  icon: Beaker },
  ];

  const downloadCSV = () => {
    const headers = ['Time', 'Temp (°C)', 'Humidity (%)', 'CO2 (ppm)', 'Soil Moisture (%)', 'Light (µmol)', 'EC (mS/cm)'];
    const rows = detailedLogs.map(r => [r.time, r.temp, r.hum, r.co2, r.soilMoist, r.light, r.ec]);
    const csv = [headers, ...rows].map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'greenhouse_data.csv'; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="analytics-container">
      
      {/* Top Nav Tabs */}
      <div style={{ display: 'flex', gap: 12, borderBottom: '1px solid var(--glass-border)', paddingBottom: 16, overflowX: 'auto' }}>
        {tabs.map(t => (
          <div
            key={t.id}
            onClick={() => setActiveTab(t.id)}
            style={{
              padding: '10px 18px', borderRadius: 12, cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: 8, fontWeight: 700,
              background: activeTab === t.id ? 'var(--primary)' : 'transparent',
              color: activeTab === t.id ? '#fff' : 'var(--text-muted)',
              transition: 'all 0.2s', flexShrink: 0
            }}
          >
            <t.icon size={18} /> {t.label}
          </div>
        ))}
      </div>

      {activeTab === 'environmental' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div className="grid-12">
            {[
              { label: 'Avg Temp', val: '25.4°C', color: 'var(--accent-red)' },
              { label: 'Avg Humidity', val: '74.8%', color: 'var(--accent-cyan)' },
              { label: 'Avg CO2', val: '402 ppm', color: 'var(--accent-purple)' },
              { label: 'Peak Light', val: '720 µmol', color: 'var(--accent-amber)' },
            ].map(s => (
              <div key={s.label} className="glass-card col-3" style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 26, fontWeight: 800, color: s.color, fontFamily: 'JetBrains Mono' }}>{s.val}</div>
                <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4, fontWeight: 700 }}>{s.label}</div>
              </div>
            ))}
          </div>

          <div className="glass-card col-12">
            <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
              <span style={{ fontWeight: 800, color: 'var(--text-secondary)', marginRight: 12, alignSelf: 'center', textTransform: 'uppercase', letterSpacing: '0.05em', fontSize: 13 }}>Select Metric</span>
              {Object.values(envCharts).map(c => (
                <button
                  key={c.key}
                  className={`btn ${activeEnvChart === c.key ? 'btn-primary' : 'btn-ghost'}`}
                  style={{ padding: '6px 14px', fontSize: 13, ...(activeEnvChart === c.key ? { background: c.stroke, color: '#fff', boxShadow: `0 4px 12px ${c.stroke}40` } : { borderColor: c.stroke, color: c.stroke }) }}
                  onClick={() => setActiveEnvChart(c.key)}
                >
                  {c.name}
                </button>
              ))}
            </div>
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={hourlyData} margin={{ top: 5, right: 10, bottom: 5, left: 0 }}>
                <defs>
                  <linearGradient id="gradEnv" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={envCharts[activeEnvChart].stroke} stopOpacity={0.3} />
                    <stop offset="95%" stopColor={envCharts[activeEnvChart].stroke} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(150,150,150,0.1)" />
                <XAxis dataKey="t" stroke="var(--text-dim)" tick={{ fontSize: 12, fontWeight: 600 }} />
                <YAxis stroke="var(--text-dim)" tick={{ fontSize: 12, fontWeight: 600 }} />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey={activeEnvChart} name={envCharts[activeEnvChart].name} stroke={envCharts[activeEnvChart].stroke} fill="url(#gradEnv)" strokeWidth={3} dot={false} activeDot={{ r: 6 }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {activeTab === 'soil' && (
        <div className="glass-card col-12">
          <div className="card-title"><Sprout size={18} /> Soil Moisture Trend</div>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={hourlyData} margin={{ top: 5, right: 10, bottom: 5, left: 0 }}>
              <defs>
                <linearGradient id="gradSoil" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--accent-orange)" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="var(--accent-orange)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(150,150,150,0.1)" />
              <XAxis dataKey="t" stroke="var(--text-dim)" tick={{ fontSize: 12, fontWeight: 600 }} />
              <YAxis stroke="var(--text-dim)" tick={{ fontSize: 12, fontWeight: 600 }} domain={[0, 100]} />
              <Tooltip content={<CustomTooltip />} />
              <Area type="monotone" dataKey="soilM" name="Soil Moisture (%)" stroke="var(--accent-orange)" fill="url(#gradSoil)" strokeWidth={3} dot={{ r: 3, fill: 'var(--accent-orange)' }} activeDot={{ r: 7 }} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}

      {activeTab === 'ec' && (
        <div className="glass-card col-12">
          <div className="card-title"><Gauge size={18} /> EC Level Monitoring (Electrical Conductivity)</div>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={hourlyData} margin={{ top: 5, right: 10, bottom: 5, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(150,150,150,0.1)" />
              <XAxis dataKey="t" stroke="var(--text-dim)" tick={{ fontSize: 12, fontWeight: 600 }} />
              <YAxis stroke="var(--text-dim)" tick={{ fontSize: 12, fontWeight: 600 }} domain={[0, 4]} />
              <Tooltip content={<CustomTooltip />} />
              <Line type="stepAfter" dataKey="ec" name="EC Level (mS/cm)" stroke="var(--accent-cyan)" strokeWidth={3} dot={{ r: 4, fill: 'var(--accent-cyan)' }} activeDot={{ r: 8 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {activeTab === 'npk' && (
        <div className="glass-card col-12">
          <div className="card-title"><Beaker size={18} /> NPK Nutrient Levels Overview</div>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={hourlyData} margin={{ top: 5, right: 10, bottom: 5, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(150,150,150,0.1)" vertical={false} />
              <XAxis dataKey="t" stroke="var(--text-dim)" tick={{ fontSize: 12, fontWeight: 600 }} />
              <YAxis stroke="var(--text-dim)" tick={{ fontSize: 12, fontWeight: 600 }} />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: 'transparent' }} />
              <Legend verticalAlign="top" height={36} iconType="circle" />
              <Bar dataKey="n" name="Nitrogen (N)" fill="var(--accent-green)" radius={[4,4,0,0]} barSize={12} />
              <Bar dataKey="p" name="Phosphorus (P)" fill="var(--accent-cyan)" radius={[4,4,0,0]} barSize={12} />
              <Bar dataKey="k" name="Potassium (K)" fill="var(--accent-purple)" radius={[4,4,0,0]} barSize={12} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Shared Data Log Table */}
      <div className="glass-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
          <div className="card-title" style={{ marginBottom: 0 }}>
            <Calendar size={18} /> Detailed Data Log (10-min intervals)
          </div>
          <button className="btn btn-primary" onClick={downloadCSV}>
            <Download size={16} /> Export CSV
          </button>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Time</th><th>Temp (°C)</th><th>Humidity (%)</th>
                <th>CO2 (ppm)</th><th>Soil (%)</th><th>Light (µmol)</th><th>EC (mS/cm)</th>
              </tr>
            </thead>
            <tbody>
              {detailedLogs.map((r, i) => (
                <tr key={i}>
                  <td style={{ color: 'var(--text-muted)', fontWeight: 600 }}>{r.time}</td>
                  <td>{r.temp}</td><td>{r.hum}</td><td>{r.co2}</td>
                  <td>{r.soilMoist}</td><td>{r.light}</td><td>{r.ec}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Analytics;
