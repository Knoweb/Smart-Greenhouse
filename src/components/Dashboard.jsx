import React from 'react';
import {
  Droplet, Zap, Leaf, CloudRain, Gauge,
  ThermometerSun, Thermometer, Wind,
  Sprout, Clock, Sun
} from 'lucide-react';
import '../index.css';

import SensorCard from './SensorCard';
import TankVisualizer from './TankVisualizer';
import DeviceToggle from './DeviceToggle';

const Dashboard = ({ selectedZone, nodes, sensors, readings, actuators, actuatorLogs, schedules = [], loading, error }) => {
  if (loading) return <div style={{ padding: 40, color: 'var(--v4-text-primary)', textAlign: 'center' }}>Connecting to greenhouse system...</div>;
  if (error) return <div style={{ padding: 40, color: 'var(--accent-red)', textAlign: 'center' }}>Connection error: {error}</div>;

  // Get nodes that belong to the selected zone
  const activeNodeIds = nodes
    .filter(n => !selectedZone || n.zone_id === selectedZone.id)
    .map(n => n.id);

  // Helper to match sensor types flexibly (handles uv_index, uv index, UV_INDEX, etc.)
  const typeMatches = (sensorType, targetTypes) => {
    if (!sensorType) return false;
    const st = sensorType.toLowerCase();
    const stClean = st.replace(/[\s_-]+/g, '');
    return targetTypes.some(t => {
      const target = t.toLowerCase();
      const targetClean = target.replace(/[\s_-]+/g, '');
      return st === target || stClean === targetClean;
    });
  };

  // Optimized helper to find sensor value by type, filtered by zone
  const getVal = (types) => {
    if (!Array.isArray(types)) types = [types];
    const lowerTypes = types.map(t => t.toLowerCase());

    // 1. Find sensors of this type that belong to nodes in the active zone
    const matchingSensors = sensors.filter(s =>
      typeMatches(s.sensor_type, lowerTypes) && activeNodeIds.includes(s.node_id)
    );

    // Prefer non-zero reading from zone sensors
    for (const s of matchingSensors) {
      if (readings[s.id] !== undefined && readings[s.id] !== null && Number(readings[s.id]) > 0) {
        return readings[s.id];
      }
    }
    for (const s of matchingSensors) {
      if (readings[s.id] !== undefined && readings[s.id] !== null) {
        return readings[s.id];
      }
    }

    // 2. Fallback to global sensor if outside, rain, or when not found in selected zone
    const isOutsideOrRain = lowerTypes.some(t => t.includes('outside') || t.includes('rain'));
    if (matchingSensors.length === 0 || isOutsideOrRain || !selectedZone) {
      const globalSensors = sensors.filter(s => typeMatches(s.sensor_type, lowerTypes));
      for (const s of globalSensors) {
        if (readings[s.id] !== undefined && readings[s.id] !== null && Number(readings[s.id]) > 0) {
          return readings[s.id];
        }
      }
      for (const s of globalSensors) {
        if (readings[s.id] !== undefined && readings[s.id] !== null) {
          return readings[s.id];
        }
      }
    }

    return 0;
  };

  const activeActuators = actuators.filter(a => activeNodeIds.includes(a.node_id));
  const growLights = activeActuators.filter(a => a.actuator_type === 'light' || a.actuator_type === 'lighting' || a.label.toLowerCase().includes('grow light'));

  const d = {
    insideTemp: getVal(['temp_inside', 'temp', 'air_temperature', 'temperature', 'inside_temp', 'inside_temperature']),
    outsideTemp: getVal(['temp_outside', 'outside_temp', 'outside_temperature']),
    insideHum: getVal(['hum_inside', 'hum', 'air_humidity', 'humidity', 'inside_hum', 'inside_humidity']),
    outsideHum: getVal(['hum_outside', 'outside_hum', 'outside_humidity']),
    light: getVal(['light', 'light_intensity', 'lux']),
    co2: getVal(['co2', 'co2_level']),
    soilMoisture: getVal(['soil_moisture']),
    soilTemp: getVal(['soil_temp', 'soil_temperature']),
    soilHum: getVal(['soil_moisture', 'soil_hum']),
    rainAmount: getVal(['rain_gauge', 'rain_amount']),
    rain: getVal(['rain_status', 'rain', 'rain_gauge', 'rain_amount']) > 0,
    ecLevel: getVal(['ec_level', 'ec', 'soil_ec']),
    phLevel: getVal(['ph_level', 'soil_ph', 'ph']),
    nitrogen: getVal(['npk_n', 'soil_nitrogen', 'nitrogen', 'n']),
    phosphorus: getVal(['npk_p', 'soil_phosphorus', 'phosphorus', 'p']),
    potassium: getVal(['npk_k', 'soil_potassium', 'potassium', 'k']),
    uvLevel: getVal(['uv_index', 'uv_level', 'uv', 'uvindex', 'uv index', 'uv_idx']),
    waterTank: getVal(['water_level', 'water', 'tank_level']),
    fertilizerTank: getVal(['fert_level', 'fertilizer_level']),
  };

  const hasSensor = (types, isGlobal = false) => {
    if (!Array.isArray(types)) types = [types];
    const lowerTypes = types.map(t => t.toLowerCase());
    return sensors.some(s =>
      typeMatches(s.sensor_type, lowerTypes) &&
      (isGlobal || !selectedZone || activeNodeIds.includes(s.node_id) || readings[s.id] !== undefined)
    );
  };

  const insideHumOver = d.insideHum > 85;
  const insideTempOver = d.insideTemp > 30;
  const co2Over = d.co2 > 1000;
  const uvHigh = d.uvLevel > 8;

  const showInsideStatus = hasSensor([
    'temp_inside', 'temp', 'air_temperature', 'temperature', 'inside_temp', 'inside_temperature',
    'hum_inside', 'hum', 'air_humidity', 'humidity', 'inside_hum', 'inside_humidity',
    'light', 'light_intensity', 'lux',
    'uv_index', 'uv_level', 'uv', 'uvindex', 'uv index', 'uv_idx',
    'co2', 'co2_level',
    'soil_moisture', 'soil_hum',
    'soil_temp', 'soil_temperature',
    'ec_level', 'ec', 'soil_ec',
    'ph_level', 'soil_ph', 'ph'
  ]);

  const showNPK = hasSensor(['npk_n', 'soil_nitrogen', 'nitrogen', 'n', 'npk_p', 'soil_phosphorus', 'phosphorus', 'p', 'npk_k', 'soil_potassium', 'potassium', 'k']);
  const showOutside = hasSensor(['temp_outside', 'outside_temp', 'outside_temperature', 'hum_outside', 'outside_hum', 'outside_humidity', 'rain_status', 'rain', 'rain_gauge', 'rain_amount'], true);
  const showTanks = hasSensor(['water_level', 'water', 'tank_level', 'fert_level', 'fertilizer_level']);

  return (
    <div className="dashboard-container">
      {showInsideStatus && (
        <section className="dashboard-section">
          <div className="section-title">Environmental Status</div>
          <div className="sensor-grid">
            {hasSensor(['temp_inside', 'temp', 'air_temperature']) && (
              <SensorCard prefix="Inside" label="Temperature" value={d.insideTemp} unit="°C" icon={Thermometer}
                color={insideTempOver ? 'var(--accent-red)' : 'var(--primary)'} max={50} trendValue="0.3" trendUp={true} />
            )}
            {hasSensor(['hum_inside', 'hum', 'air_humidity']) && (
              <SensorCard prefix="Inside" label="Humidity" value={d.insideHum} unit="%" icon={Droplet}
                color={insideHumOver ? 'var(--accent-red)' : 'var(--accent-cyan)'} max={100} trendValue="1.2" trendUp={false} />
            )}
            {hasSensor(['light', 'light_intensity']) && (
              <SensorCard prefix="Inside" label="Light Intensity" value={d.light} unit="µmol" icon={Zap}
                color="var(--accent-green)" pct={Math.round(d.light / 10)} trendValue="15" trendUp={true} />
            )}
            {hasSensor(['uv_index', 'uv_level', 'uv', 'uvindex', 'uv index', 'uv_idx']) && (
              <SensorCard prefix="Inside" label="UV Index" value={d.uvLevel} unit="UV" icon={ThermometerSun}
                color={uvHigh ? 'var(--accent-red)' : 'var(--accent-purple)'} max={11} />
            )}
            {hasSensor(['co2', 'co2_level']) && (
              <SensorCard prefix="Inside" label="CO₂ Level" value={d.co2} unit="ppm" icon={Wind}
                color={co2Over ? 'var(--accent-red)' : 'var(--accent-purple)'} max={1500} trendValue="5" trendUp={false} />
            )}
            {hasSensor(['soil_moisture']) && (
              <SensorCard prefix="Soil" label="Moisture" value={d.soilMoisture} unit="%" icon={Sprout}
                color="var(--accent-green)" max={100} trendValue="2.1" trendUp={true} />
            )}
            {hasSensor(['soil_temp', 'soil_temperature']) && (
              <SensorCard prefix="Soil" label="Temperature" value={d.soilTemp} unit="°C" icon={Thermometer}
                color="var(--primary)" max={50} trendValue="0.5" trendUp={false} />
            )}
            {hasSensor(['soil_hum']) && (
              <SensorCard prefix="Soil" label="Humidity" value={d.soilHum} unit="%" icon={Droplet}
                color="var(--accent-cyan)" max={100} />
            )}
            {hasSensor(['ec_level', 'ec', 'soil_ec']) && (
              <SensorCard prefix="Soil" label="EC Level" value={d.ecLevel} unit="mS" icon={Gauge}
                color="var(--accent-cyan)" max={4} />
            )}
            {hasSensor(['ph_level', 'soil_ph']) && (
              <SensorCard prefix="Soil" label="pH Level" value={d.phLevel} unit="pH" icon={Gauge}
                color="var(--accent-green)" max={14} />
            )}
          </div>

          {showNPK && (
            <div className="dashboard-subsection">
              <div className="section-mini-title">NPK Balance</div>
              <div className="npk-row">
                {[
                  hasSensor(['npk_n', 'soil_nitrogen']) && ['Nitrogen (N)', d.nitrogen, 'var(--accent-green)'],
                  hasSensor(['npk_p', 'soil_phosphorus']) && ['Phosphorus (P)', d.phosphorus, 'var(--accent-cyan)'],
                  hasSensor(['npk_k', 'soil_potassium']) && ['Potassium (K)', d.potassium, 'var(--accent-purple)'],
                ].filter(Boolean).map(([lbl, val, clr]) => (
                  <div key={lbl} className="npk-item">
                    <div className="npk-label-row">
                      <span className="npk-label">{lbl}</span>
                      <span className="npk-value" style={{ color: clr }}>{val} ppm</span>
                    </div>
                    <div className="progress-bar">
                      <div className="progress-fill" style={{ width: `${Math.min(100, val / 10)}%`, background: clr }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {showOutside && (
            <div className="dashboard-subsection dashboard-subsection-separated">
              <div className="section-mini-title">Outside Conditions</div>
              <div className="sensor-grid">
                {hasSensor(['temp_outside', 'outside_temp', 'outside_temperature'], true) && (
                  <SensorCard prefix="Outside" label="Temperature" value={d.outsideTemp} unit="°C" icon={ThermometerSun}
                    color="var(--primary)" max={50} trendValue="1.1" trendUp={true} />
                )}
                {hasSensor(['hum_outside', 'outside_hum', 'outside_humidity'], true) && (
                  <SensorCard prefix="Outside" label="Humidity" value={d.outsideHum} unit="%" icon={CloudRain}
                    color="var(--accent-cyan)" max={100} trendValue="0.4" trendUp={false} />
                )}
                {hasSensor(['rain_status', 'rain', 'rain_gauge', 'rain_amount'], true) && (
                  <SensorCard
                    prefix="Outside"
                    label={d.rain ? "Raining" : "No Rain"}
                    value={d.rainAmount > 0 ? d.rainAmount : 0}
                    unit=" mm"
                    icon={CloudRain}
                    color={d.rain ? "var(--accent-green)" : "var(--accent-cyan)"}
                    max={20}
                  />
                )}
              </div>
            </div>
          )}
        </section>
      )}

      {showTanks && (
        <section className="dashboard-section">
          <div className="section-title">Tank Status</div>
          <div className="tank-bars-grid">
            {hasSensor(['water_level']) && (
              <div className="tank-bar-card">
                <div className="tank-bar-header">
                  <span className="tank-bar-label">Water Tank</span>
                  <span className="tank-bar-pct">{Math.round(d.waterTank)}%</span>
                </div>
                <div className="tank-bar-track">
                  <div
                    className="tank-bar-fill"
                    style={{
                      width: `${d.waterTank}%`,
                      background: 'linear-gradient(90deg, #22c55e, #4ade80)'
                    }}
                  />
                </div>
                <div className="tank-bar-footer">
                  <span>0 L</span>
                  <span>1000 L</span>
                </div>
              </div>
            )}
            {hasSensor(['fert_level']) && (
              <div className="tank-bar-card">
                <div className="tank-bar-header">
                  <span className="tank-bar-label">Fertilizer Tank</span>
                  <span className="tank-bar-pct">{Math.round(d.fertilizerTank)}%</span>
                </div>
                <div className="tank-bar-track">
                  <div
                    className="tank-bar-fill"
                    style={{
                      width: `${d.fertilizerTank}%`,
                      background: 'linear-gradient(90deg, #f97316, #fb923c)'
                    }}
                  />
                </div>
                <div className="tank-bar-footer">
                  <span>0 L</span>
                  <span>500 L</span>
                </div>
              </div>
            )}
          </div>
        </section>
      )}

      <section className="dashboard-section">
        <div className="section-title">System Control Status</div>
        {activeActuators.length === 0 ? (
          <div style={{ padding: 20, textAlign: 'center', color: 'var(--text-muted)' }}>
            No actuators are configured for this zone.
          </div>
        ) : (
          <div className="control-status-grid">
            {activeActuators
              .map(act => {
                const modeColor =
                  act.control_mode === 'auto' ? 'var(--primary)' :
                    act.control_mode === 'schedule' ? 'var(--accent-cyan)' :
                      'var(--accent-green)';

                // Find the last log for this actuator to show how long it's been in this state
                const lastLog = actuatorLogs?.find(l => l.actuator_id === act.id);
                let durationStr = '';
                if (lastLog) {
                  const diffMs = new Date() - new Date(lastLog.created_at);
                  const mins = Math.floor(diffMs / 60000);
                  const hrs = Math.floor(mins / 60);
                  if (hrs > 0) durationStr = `${hrs}h ${mins % 60}m`;
                  else if (mins > 0) durationStr = `${mins}m`;
                  else durationStr = 'Just now';
                }

                const isGrowLight = act.actuator_type === 'light' || act.actuator_type === 'lighting' || act.label.toLowerCase().includes('grow light');
                const intensity = act.target_state?.intensity || 100;
                const displayLabel = isGrowLight && act.target_state?.on ? `${act.label} (Active ${intensity}%)` : act.label;

                return (
                  <DeviceToggle
                    key={act.id}
                    readOnly
                    label={displayLabel}
                    isOn={act.target_state?.on}
                    iconKey={act.actuator_type}
                    subLabel={
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                        <span style={{ color: modeColor, fontWeight: 800, fontSize: '11px' }}>
                          {act.control_mode?.toUpperCase()} MODE
                        </span>
                        {durationStr && (
                          <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
                            {act.target_state?.on ? 'Running for ' : 'Idle for '} {durationStr}
                          </span>
                        )}
                      </div>
                    }
                  />
                );
              })}
          </div>
        )}
      </section>

      {/* ===== ACTIVE SCHEDULES ===== */}
      <section className="dashboard-section">
        <div className="section-header-row">
          <div className="section-title">Active Schedules</div>
          <span className="section-badge">
            {(() => {
              const zoneSchedules = schedules.filter(s =>
                activeActuators.some(a => a.id === s.actuator_id) && s.is_active
              );
              return `${zoneSchedules.length} Active`;
            })()}
          </span>
        </div>
        <div className="active-schedules-list">
          {(() => {
            const zoneSchedules = schedules.filter(s =>
              activeActuators.some(a => a.id === s.actuator_id)
            );

            if (zoneSchedules.length === 0) {
              return (
                <div style={{ padding: 20, textAlign: 'center', color: 'var(--text-muted)' }}>
                  No schedules configured for this zone.
                </div>
              );
            }

            const now = new Date();
            const currentMinutes = now.getHours() * 60 + now.getMinutes();
            const currentDay = now.getDay();

            return zoneSchedules.map(sch => {
              const actuator = activeActuators.find(a => a.id === sch.actuator_id);
              const label = actuator?.label || 'Unknown';

              // Parse start_time "HH:MM:SS"
              const [h, m] = (sch.start_time || '00:00').split(':').map(Number);
              const startMinutes = h * 60 + m;
              const endMinutes = startMinutes + Math.floor((sch.duration_seconds || 0) / 60);
              const timeStr = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;

              // Determine status
              const isToday = sch.days_of_week?.includes(currentDay);
              let status = 'scheduled';
              if (!sch.is_active) {
                status = 'pending';
              } else if (isToday && currentMinutes >= startMinutes && currentMinutes <= endMinutes) {
                status = 'active';
              } else if (isToday && currentMinutes < startMinutes) {
                status = 'pending';
              }

              // Zone info from actuator
              const node = nodes.find(n => n.id === actuator?.node_id);
              const zoneName = node?.zone_id
                ? (selectedZone?.name || 'Zone')
                : 'All Zones';

              return (
                <div key={sch.id} className={`schedule-card-v4 status-${status}`}>
                  <div className="schedule-info-v4">
                    <div className="schedule-title-v4">{label}</div>
                    <div className="schedule-meta-v4">
                      <Clock size={12} style={{ marginRight: 4, opacity: 0.6 }} />
                      {timeStr} - {zoneName}
                    </div>
                  </div>
                  <span className={`schedule-status-badge ${status}`}>
                    {status === 'active' ? 'Active' : status === 'pending' ? 'Pending' : 'Scheduled'}
                  </span>
                </div>
              );
            });
          })()}
        </div>
      </section>

    </div>
  );
};

export default Dashboard;
