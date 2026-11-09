import React, { useState, useEffect } from 'react';
import {
  LayoutDashboard, Droplet, BarChart2, CalendarDays,
  Bell, Settings, Zap, Leaf, CloudRain, Gauge,
  ThermometerSun, Thermometer, Wind, Fan,
  FlaskConical, Sprout, BrainCircuit
} from 'lucide-react';
import '../index.css';

import SensorCard from './SensorCard';
import TankVisualizer from './TankVisualizer';
import DeviceToggle from './DeviceToggle';

// ============================
// MOCK LIVE DATA
// ============================
const useSensors = () => {
  const [data, setData] = useState({
    insideTemp: 26.5, outsideTemp: 29.1,
    insideHum: 78, outsideHum: 63,
    light: 420, co2: 402,
    soilMoisture: 45, rain: false,
    ecLevel: 2.1, nitrogen: 62, phosphorus: 38, potassium: 71,
    waterTank: 80, fertilizerTank: 22,
  });

  useEffect(() => {
    const id = setInterval(() => {
      setData(d => ({
        ...d,
        insideTemp: parseFloat((d.insideTemp + (Math.random() - 0.5) * 0.3).toFixed(1)),
        insideHum: Math.min(99, Math.max(30, d.insideHum + Math.round((Math.random() - 0.5) * 2))),
        co2: Math.min(1500, Math.max(300, d.co2 + Math.round((Math.random() - 0.5) * 10))),
        light: Math.max(0, d.light + Math.round((Math.random() - 0.5) * 20)),
      }));
    }, 3000);
    return () => clearInterval(id);
  }, []);

  return data;
};

const Dashboard = ({ controls = {} }) => {
  const d = useSensors();

  if (!d) return <div style={{ padding: 20 }}>Loading Sensor Data...</div>;

  const insideHumOver   = d.insideHum > 85;
  const insideTempOver  = d.insideTemp > 30;
  const co2Over         = d.co2 > 1000;

  return (
    <div className="dashboard-container">


      {/* === INSIDE Environmental Status === */}
      <div className="glass-card">
        <div className="card-title"><Leaf size={18} /> Environmental Status — Inside</div>
        <div className="sensor-grid">
          <SensorCard label="Temperature" value={d.insideTemp} unit="°C" icon={Thermometer}
            color={insideTempOver ? 'var(--accent-red)' : 'var(--primary)'} max={50} />
          <SensorCard label="Humidity" value={d.insideHum} unit="%" icon={Droplet}
            color={insideHumOver ? 'var(--accent-amber)' : 'var(--accent-cyan)'} max={100} />
          <SensorCard label="Light Intensity" value={d.light} unit="µmol" icon={Zap}
            color="var(--accent-amber)" pct={Math.round(d.light / 10)} />
          <SensorCard label="CO₂ Level" value={d.co2} unit="ppm" icon={Wind}
            color={co2Over ? 'var(--accent-red)' : 'var(--accent-purple)'} max={1500} />
          <SensorCard label="Soil Moisture" value={d.soilMoisture} unit="%" icon={Sprout}
            color="var(--accent-orange)" max={100} />
          <SensorCard label="EC Level" value={d.ecLevel} unit="mS" icon={Gauge}
            color="var(--accent-cyan)" max={4} />
        </div>
        {/* NPK Mini Row */}
        <div className="npk-row">
          {[
            ['Nitrogen (N)', d.nitrogen, 'var(--accent-green)'],
            ['Phosphorus (P)', d.phosphorus, 'var(--accent-cyan)'],
            ['Potassium (K)', d.potassium, 'var(--accent-purple)'],
          ].map(([lbl, val, clr]) => (
            <div key={lbl} className="npk-item">
              <div className="npk-label-row">
                <span className="npk-label">{lbl}</span>
                <span className="npk-value" style={{ color: clr }}>{val}%</span>
              </div>
              <div className="progress-bar">
                <div className="progress-fill" style={{ width: `${val}%`, background: clr }} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* === OUTSIDE Environmental Status === */}
      <div className="glass-card">
        <div className="card-title"><CloudRain size={18} /> Environmental Status — Outside</div>
        <div className="sensor-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 16 }}>
          <SensorCard label="Outside Temp" value={d.outsideTemp} unit="°C" icon={ThermometerSun}
            color="var(--accent-amber)" max={50} />
          <SensorCard label="Outside Humidity" value={d.outsideHum} unit="%" icon={Droplet}
            color="var(--accent-cyan)" max={100} />
          <div className="glass-card sensor-card" style={{ gap: 8 }}>
            <div style={{
              width: 68, height: 68, borderRadius: '50%',
              background: d.rain ? 'var(--accent-cyan-dim)' : 'rgba(255,255,255,0.04)',
              border: `2px solid ${d.rain ? 'var(--accent-cyan)' : 'rgba(255,255,255,0.1)'}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <CloudRain size={28} color={d.rain ? 'var(--accent-cyan)' : 'var(--text-dim)'} />
            </div>
            <div style={{ fontWeight: 800, fontSize: 18, color: d.rain ? 'var(--accent-cyan)' : 'var(--text-muted)' }}>
              {d.rain ? 'Raining' : 'Clear'}
            </div>
            <div className="sensor-label">Rain Status</div>
          </div>
        </div>
      </div>

      {/* === TANK STATUS + CONTROLS === */}
      <div className="grid-12">
        {/* Tanks */}
        <div className="glass-card col-3">
          <div className="card-title"><Droplet size={18} /> Tank Status</div>
          <div style={{ display: 'flex', justifyContent: 'space-around', paddingTop: 12 }}>
            <TankVisualizer level={d.waterTank}      color="var(--accent-cyan)" label="Water"      warning={20} />
            <TankVisualizer level={d.fertilizerTank} color="var(--accent-green)" label="Fertilizer" warning={20} />
          </div>
        </div>

        {/* Controls Status */}
        <div className="glass-card col-9">
          <div className="card-title">⚙️ System Control Status</div>
          <div className="control-status-grid">
            <DeviceToggle readOnly label="Main Water Pump"    isOn={controls.mainPump?.on}       iconKey="pump" subLabel={controls.mainPump?.on ? 'Running' : 'Stopped'} />
            <DeviceToggle readOnly label="Irrigation Pump"   isOn={controls.irrigationPump?.on} iconKey="pump" subLabel="Zone A & B" />
            <DeviceToggle readOnly label="Fertilizer Pump"   isOn={controls.fertilizerPump?.on} iconKey="pump" subLabel="Inline dosing" />
            <DeviceToggle readOnly label="Misters / Foggers" isOn={controls.misters?.on}        iconKey="wind" subLabel="Humidity control" />
            <DeviceToggle readOnly label="Exhaust Fans"      isOn={controls.exhaustFans?.on}    iconKey="fan"  subLabel={controls.exhaustFans?.on ? 'Running at 80%' : 'Off'} />
            <DeviceToggle readOnly label="Air Circulation"   isOn={controls.airFans?.on}        iconKey="fan"  subLabel="Internal airflow" />
            <DeviceToggle readOnly label="Curtains"          isOn={controls.curtains?.on}       iconKey="curtain" subLabel={controls.curtains?.on ? 'Open 100%' : 'Closed'} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
