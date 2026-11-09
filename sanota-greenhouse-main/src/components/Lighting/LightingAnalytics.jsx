import React, { useMemo } from 'react';
import { 
    ResponsiveContainer, AreaChart, Area, XAxis, YAxis, 
    CartesianGrid, Tooltip, BarChart, Bar, Cell 
} from 'recharts';
import { Sun, Activity, Zap, Clock } from 'lucide-react';

const LightingAnalytics = ({ sensors, historicalReadings, actuators, actuatorLogs }) => {
  const lightSensors = sensors.filter(s => s.sensor_type === 'light_intensity' || s.sensor_type === 'light');
  const lightIds = lightSensors.map(s => s.id);
  const lightingActuators = actuators.filter(a => a.actuator_type === 'grow_light');
  const lightingActuatorIds = lightingActuators.map(a => a.id);

  const processedData = useMemo(() => {
    if (!historicalReadings || historicalReadings.length === 0) return [];

    const hourlyMap = {};
    const sortedReadings = [...historicalReadings]
        .filter(r => lightIds.includes(r.sensor_id))
        .reverse();

    sortedReadings.forEach(r => {
      const date = new Date(r.created_at);
      const hourKey = `${date.getHours().toString().padStart(2, '0')}:00`;
      
      if (!hourlyMap[hourKey]) {
        hourlyMap[hourKey] = { t: hourKey, value: 0, count: 0 };
      }
      hourlyMap[hourKey].value += r.value;
      hourlyMap[hourKey].count += 1;
    });

    return Object.values(hourlyMap).map(h => ({
      t: h.t,
      intensity: Number((h.value / h.count).toFixed(1))
    })).sort((a, b) => a.t.localeCompare(b.t));
  }, [historicalReadings, lightIds]);

  const activityData = useMemo(() => {
    const logs = (actuatorLogs || []).filter(l => lightingActuatorIds.includes(l.actuator_id));
    const activityCount = {};
    
    logs.forEach(l => {
        const date = new Date(l.created_at);
        const hour = `${date.getHours()}:00`;
        activityCount[hour] = (activityCount[hour] || 0) + 1;
    });

    return Object.entries(activityCount).map(([hour, count]) => ({ hour, count }))
        .sort((a, b) => a.hour.localeCompare(b.hour));
  }, [actuatorLogs, lightingActuatorIds]);

  return (
    <div className="grid-12" style={{ alignItems: 'start' }}>
      
      {/* 24h Light Level Chart */}
      <div className="glass-card col-12" style={{ marginBottom: 20 }}>
        <div className="card-title"><Sun size={16} color="var(--accent-amber)" /> 24h Environmental Light Levels (LUX)</div>
        <div style={{ height: 260, width: '100%', marginTop: 20 }}>
          {processedData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={processedData}>
                <defs>
                  <linearGradient id="lightingGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--accent-amber)" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="var(--accent-amber)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis dataKey="t" stroke="var(--text-muted)" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="var(--text-muted)" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip 
                  contentStyle={{ background: 'var(--bg-elevated)', border: '1px solid var(--glass-border)', borderRadius: 12 }}
                  itemStyle={{ color: 'var(--accent-amber)' }}
                />
                <Area 
                  type="monotone" 
                  dataKey="intensity" 
                  stroke="var(--accent-amber)" 
                  fill="url(#lightingGrad)" 
                  strokeWidth={3} 
                  dot={false}
                />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-muted)', fontSize: 13, textAlign: 'center' }}>
                <div>
                    <Info size={24} style={{ marginBottom: 10, opacity: 0.5 }} />
                    <br />
                    No sensor data available for last 24h.<br />
                    <span style={{ fontSize: 11 }}>Environmental light levels require a light sensor (BH1750/LDR).</span>
                </div>
            </div>
          )}
        </div>
      </div>

      {/* Lighting Activity Chart */}
      <div className="glass-card col-12">
        <div className="card-title"><Activity size={16} color="var(--accent-cyan)" /> Lighting Operation Activity (Logs)</div>
        <div style={{ height: 260, width: '100%', marginTop: 20 }}>
          {activityData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={activityData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis dataKey="hour" stroke="var(--text-muted)" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="var(--text-muted)" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip 
                  contentStyle={{ background: 'var(--bg-elevated)', border: '1px solid var(--glass-border)', borderRadius: 12 }}
                  cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                />
                <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                  {activityData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill="var(--accent-cyan)" opacity={0.6 + (entry.count / Math.max(...activityData.map(d => d.count))) * 0.4} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-muted)', fontSize: 13 }}>
              No lighting activity logged in the last 24h.
            </div>
          )}
        </div>
      </div>

    </div>
  );
};

export default LightingAnalytics;
