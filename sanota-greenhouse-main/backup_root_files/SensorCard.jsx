import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const data = [
  { time: '00:00', temp: 22, humidity: 82 },
  { time: '04:00', temp: 21, humidity: 85 },
  { time: '08:00', temp: 24, humidity: 75 },
  { time: '12:00', temp: 28, humidity: 65 },
  { time: '16:00', temp: 27, humidity: 68 },
  { time: '20:00', temp: 24, humidity: 75 },
  { time: '24:00', temp: 22, humidity: 80 },
];

const AnalyticsChart = () => {
  return (
    <div style={{ width: '100%', height: '300px' }}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
          <XAxis dataKey="time" stroke="var(--text-muted)" />
          <YAxis yAxisId="left" stroke="var(--primary)" />
          <YAxis yAxisId="right" orientation="right" stroke="var(--accent-water)" />
          <Tooltip 
            contentStyle={{ backgroundColor: 'var(--glass-bg)', border: '1px solid var(--glass-border)', borderRadius: '8px' }}
          />
          <Legend />
          <Line yAxisId="left" type="monotone" dataKey="temp" stroke="var(--primary)" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 8 }} name="Temperature (°C)" />
          <Line yAxisId="right" type="monotone" dataKey="humidity" stroke="var(--accent-water)" strokeWidth={3} dot={{ r: 4 }} name="Humidity (%)" />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default AnalyticsChart;
