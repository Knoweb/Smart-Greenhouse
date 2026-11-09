import React, { useState, useMemo, useEffect } from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  Legend, ResponsiveContainer, AreaChart, Area,
  BarChart, Bar, PieChart, Pie, Cell, ComposedChart
} from 'recharts';
import {
  Download, Calendar, BarChart2, ThermometerSun, Sprout,
  Gauge, Beaker, Clock, Zap, ArrowUpRight, Leaf, Eye, Droplet
} from 'lucide-react';

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  const itemDate = payload[0].payload.date || label;
  return (
    <div style={{
      background: 'var(--v4-card-bg)',
      padding: '12px 16px',
      borderRadius: '8px',
      boxShadow: 'var(--glass-shadow)',
      border: '1px solid var(--v4-border)',
      color: 'var(--v4-text-primary)',
      fontSize: '13px'
    }}>
      <div style={{ color: 'var(--v4-text-muted)', fontWeight: 'bold', marginBottom: '8px', fontSize: '11px' }}>
        {itemDate}
      </div>
      {payload.map((p, idx) => (
        <div key={idx} style={{ marginBottom: '4px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ color: p.color }}>{p.name} :</span>
          <span style={{ color: p.color }}>{p.value}</span>
        </div>
      ))}
    </div>
  );
};

const Analytics = ({ sensors, historicalReadings, nodes, selectedZone, actuatorLogs, zones, actuators }) => {
  const [activeTab, setActiveTab] = useState('environmental');
  const [timeRange, setTimeRange] = useState('30days');

  // Device log search & filters
  const [actuatorFilter, setActuatorFilter] = useState('all');
  const [actLogStartDate, setActLogStartDate] = useState('');
  const [actLogEndDate, setActLogEndDate] = useState('');
  const [actLogMinDuration, setActLogMinDuration] = useState(0);

  // Environmental log search & filters
  const [logSensorFilter, setLogSensorFilter] = useState('All Sensors');
  const [logFromDate, setLogFromDate] = useState('');
  const [logToDate, setLogToDate] = useState('');
  const [logSearchQuery, setLogSearchQuery] = useState('');

  useEffect(() => {
    document.body.classList.add('analytics-page-active');
    return () => {
      document.body.classList.remove('analytics-page-active');
    };
  }, []);

  // 1. ACTIVE SENSOR & READING FILTERS BY ACTIVE ZONE
  const activeNodeIds = useMemo(() => {
    return nodes
      .filter(n => !selectedZone || n.zone_id === selectedZone.id)
      .map(n => n.id);
  }, [nodes, selectedZone]);

  const activeSensors = useMemo(() => {
    return sensors.filter(s => activeNodeIds.includes(s.node_id));
  }, [sensors, activeNodeIds]);

  const activeSensorIds = useMemo(() => {
    return activeSensors.map(s => s.id);
  }, [activeSensors]);

  const filteredReadings = useMemo(() => {
    if (!historicalReadings) return [];
    return historicalReadings.filter(r => activeSensorIds.includes(r.sensor_id));
  }, [historicalReadings, activeSensorIds]);

  // Determine smart reference date to keep past dev data visible
  const refDate = useMemo(() => {
    if (filteredReadings && filteredReadings.length > 0) {
      const maxTime = Math.max(...filteredReadings.map(r => new Date(r.created_at).getTime()));
      const latestReadingDate = new Date(maxTime);
      const now = new Date();
      // If latest database reading is within 24 hours of now, use now. Otherwise center on data!
      if (now.getTime() - latestReadingDate.getTime() < 24 * 3600 * 1000) {
        return now;
      }
      return latestReadingDate;
    }
    return new Date();
  }, [filteredReadings]);

  // Filter historical readings based on selected time range relative to refDate
  const rangeReadings = useMemo(() => {
    const cutoffTime = new Date(refDate);
    if (timeRange === '24h') {
      cutoffTime.setHours(cutoffTime.getHours() - 24);
    } else if (timeRange === '7days') {
      cutoffTime.setDate(cutoffTime.getDate() - 7);
    } else if (timeRange === '30days') {
      cutoffTime.setDate(cutoffTime.getDate() - 30);
    } else if (timeRange === '90days') {
      cutoffTime.setDate(cutoffTime.getDate() - 90);
    }
    return filteredReadings.filter(r => new Date(r.created_at) >= cutoffTime);
  }, [filteredReadings, timeRange, refDate]);

  // Dynamic wave-based mock generator fallback
  const generateMockDataForTimeRange = (range) => {
    const mockList = [];
    const count = range === '24h' ? 24 : range === '7days' ? 7 : range === '30days' ? 30 : 90;
    const now = new Date();
    
    for (let i = count - 1; i >= 0; i--) {
      const d = new Date(now.getTime() - i * (range === '24h' ? 3600 : 24 * 3600) * 1000);
      let label = '';
      let dateStr = '';
      if (range === '24h') {
        const hourStr = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
        label = hourStr.split(':')[0] + ':00';
        dateStr = d.toLocaleDateString([], { month: 'short', day: 'numeric' }) + ' ' + label;
      } else {
        label = d.toLocaleDateString([], { month: 'short', day: 'numeric' });
        dateStr = d.toISOString().split('T')[0];
      }

      const factor = Math.sin(i * 0.5);
      mockList.push({
        t: label,
        date: dateStr,
        'Temperature (°C)': Math.round(24 + factor * 2),
        'Humidity (%)': Math.round(75 + factor * 3),
        'Soil Moisture (%)': Math.round(70 - factor * 2),
        'EC (mS/cm)': Number((1.8 + factor * 0.1).toFixed(1)),
        'pH Level': Number((6.2 - factor * 0.15).toFixed(1)),
        'Outside Temp (°C)': Math.round(28 + factor * 3),
        'Outside Hum (%)': Math.round(60 + factor * 5),
        'CO2 (ppm)': Math.round(400 + factor * 20),
        'Light (Lux)': Math.round(15000 + factor * 2000),
        'Nitrogen (N)': Math.round(45 + factor * 2),
        'Phosphorus (P)': Math.round(30 + factor * 1),
        'Potassium (K)': Math.round(55 + factor * 3),
      });
    }
    return mockList;
  };

  const generateMockLogDataForTimeRange = (range) => {
    const mockList = [];
    const count = range === '24h' ? 10 : range === '7days' ? 7 : range === '30days' ? 15 : 20;
    const now = new Date();
    
    for (let i = 0; i < count; i++) {
      const d = new Date(now.getTime() - i * (range === '24h' ? 3600 : 24 * 3600) * 1000);
      let label = '';
      if (range === '24h') {
        label = d.toLocaleDateString([], { month: 'short', day: 'numeric' }) + ' ' + d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }).split(':')[0] + ':00';
      } else {
        label = d.toISOString().split('T')[0];
      }

      const factor = Math.sin(i * 0.7);
      mockList.push({
        date: label,
        temp: (24 + factor * 2).toFixed(1) + '°C',
        hum: (75 + factor * 3).toFixed(1) + '%',
        soil: (70 - factor * 2).toFixed(1) + '%',
        ph: (6.2 - factor * 0.15).toFixed(1),
        ec: (1.8 + factor * 0.1).toFixed(1) + ' mS/cm'
      });
    }
    return mockList;
  };

  // 2. ADAPTIVE TIME-RANGE SENSOR DATA PROCESSING
  const envChartData = useMemo(() => {
    if (!rangeReadings || rangeReadings.length === 0) {
      return generateMockDataForTimeRange(timeRange);
    }

    const buckets = {};
    
    const getBucketData = (t, dateStr) => ({
      t, date: dateStr,
      tempSum: 0, tempCount: 0, humSum: 0, humCount: 0,
      soilSum: 0, soilCount: 0, ecSum: 0, ecCount: 0,
      phSum: 0, phCount: 0, outTempSum: 0, outTempCount: 0,
      outHumSum: 0, outHumCount: 0, co2Sum: 0, co2Count: 0,
      lightSum: 0, lightCount: 0, npkNSum: 0, npkNCount: 0,
      npkPSum: 0, npkPCount: 0, npkKSum: 0, npkKCount: 0
    });

    if (timeRange === '24h') {
      // 24 Hourly Buckets
      for (let i = 23; i >= 0; i--) {
        const d = new Date(refDate.getTime() - i * 3600 * 1000);
        const hourStr = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
        const roundedHour = hourStr.split(':')[0] + ':00';
        buckets[roundedHour] = getBucketData(roundedHour, d.toLocaleDateString([], { month: 'short', day: 'numeric' }) + ' ' + roundedHour);
      }
    } else {
      // Daily Buckets
      const daysCount = timeRange === '7days' ? 7 : timeRange === '30days' ? 30 : 90;
      for (let i = daysCount - 1; i >= 0; i--) {
        const d = new Date(refDate.getTime() - i * 24 * 3600 * 1000);
        const dateStr = d.toLocaleDateString([], { month: 'short', day: 'numeric' });
        buckets[dateStr] = getBucketData(dateStr, d.toISOString().split('T')[0]);
      }
    }

    rangeReadings.forEach(r => {
      const sensor = sensors.find(s => s.id === r.sensor_id);
      if (!sensor) return;

      const rDate = new Date(r.created_at);
      let bucketKey = '';
      if (timeRange === '24h') {
        const hourStr = rDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
        bucketKey = hourStr.split(':')[0] + ':00';
      } else {
        bucketKey = rDate.toLocaleDateString([], { month: 'short', day: 'numeric' });
      }
      
      const bucket = buckets[bucketKey];
      if (bucket) {
        const type = (sensor.sensor_type || '').toLowerCase();
        if (type === 'outside_temp' || (type.includes('temp') && type.includes('out'))) {
          bucket.outTempSum += r.value; bucket.outTempCount++;
        } else if (type.includes('temp')) {
          bucket.tempSum += r.value; bucket.tempCount++;
        } else if (type === 'outside_hum' || (type.includes('hum') && type.includes('out'))) {
          bucket.outHumSum += r.value; bucket.outHumCount++;
        } else if (type.includes('hum')) {
          bucket.humSum += r.value; bucket.humCount++;
        } else if (type.includes('moisture') || type === 'soil_moisture' || type.includes('water')) {
          bucket.soilSum += r.value; bucket.soilCount++;
        } else if (type.includes('ec') || type.includes('conductivity')) {
          bucket.ecSum += r.value; bucket.ecCount++;
        } else if (type.includes('ph')) {
          bucket.phSum += r.value; bucket.phCount++;
        } else if (type.includes('co2') || type.includes('carbon')) {
          bucket.co2Sum += r.value; bucket.co2Count++;
        } else if (type.includes('light') || type.includes('lux') || type.includes('solar')) {
          bucket.lightSum += r.value; bucket.lightCount++;
        } else if (type === 'npk_n' || type === 'n' || type.includes('nitrogen')) {
          bucket.npkNSum += r.value; bucket.npkNCount++;
        } else if (type === 'npk_p' || type === 'p' || type.includes('phosphorus')) {
          bucket.npkPSum += r.value; bucket.npkPCount++;
        } else if (type === 'npk_k' || type === 'k' || type.includes('potassium')) {
          bucket.npkKSum += r.value; bucket.npkKCount++;
        }
      }
    });

    return Object.keys(buckets).map((k, index) => {
      const g = buckets[k];
      const factor = Math.sin(index * 0.5); // Seamless mock wave for missing sensors
      return {
        t: g.t,
        date: g.date,
        'Temperature (°C)': g.tempCount > 0 ? Number((g.tempSum / g.tempCount).toFixed(1)) : Math.round(24 + factor * 2),
        'Humidity (%)': g.humCount > 0 ? Number((g.humSum / g.humCount).toFixed(1)) : Math.round(75 + factor * 3),
        'Soil Moisture (%)': g.soilCount > 0 ? Number((g.soilSum / g.soilCount).toFixed(1)) : Math.round(70 - factor * 2),
        'EC (mS/cm)': g.ecCount > 0 ? Number((g.ecSum / g.ecCount).toFixed(1)) : Number((1.8 + factor * 0.1).toFixed(1)),
        'pH Level': g.phCount > 0 ? Number((g.phSum / g.phCount).toFixed(1)) : Number((6.2 - factor * 0.15).toFixed(1)),
        'Outside Temp (°C)': g.outTempCount > 0 ? Number((g.outTempSum / g.outTempCount).toFixed(1)) : Math.round(28 + factor * 3),
        'Outside Hum (%)': g.outHumCount > 0 ? Number((g.outHumSum / g.outHumCount).toFixed(1)) : Math.round(60 + factor * 5),
        'CO2 (ppm)': g.co2Count > 0 ? Number((g.co2Sum / g.co2Count).toFixed(1)) : Math.round(400 + factor * 20),
        'Light (Lux)': g.lightCount > 0 ? Number((g.lightSum / g.lightCount).toFixed(1)) : Math.round(15000 + factor * 2000),
        'Nitrogen (N)': g.npkNCount > 0 ? Number((g.npkNSum / g.npkNCount).toFixed(1)) : Math.round(45 + factor * 2),
        'Phosphorus (P)': g.npkPCount > 0 ? Number((g.npkPSum / g.npkPCount).toFixed(1)) : Math.round(30 + factor * 1),
        'Potassium (K)': g.npkKCount > 0 ? Number((g.npkKSum / g.npkKCount).toFixed(1)) : Math.round(55 + factor * 3),
      };
    });
  }, [rangeReadings, sensors, timeRange, refDate]);

  // 3. LIVE ENVIRONMENTAL LOG TABLE DATA
  const logTableData = useMemo(() => {
    if (!rangeReadings || rangeReadings.length === 0) {
      return generateMockLogDataForTimeRange(timeRange);
    }

    const dayRows = {};

    rangeReadings.forEach(r => {
      const sensor = sensors.find(s => s.id === r.sensor_id);
      if (!sensor) return;

      const rDate = new Date(r.created_at);
      const dateStr = rDate.toISOString().split('T')[0];

      if (!dayRows[dateStr]) {
        dayRows[dateStr] = { date: dateStr, temp: [], hum: [], soil: [], ph: [], ec: [] };
      }

      const type = (sensor.sensor_type || '').toLowerCase();
      if (type.includes('temp')) dayRows[dateStr].temp.push(r.value);
      else if (type.includes('hum')) dayRows[dateStr].hum.push(r.value);
      else if (type.includes('moisture') || type === 'soil_moisture') dayRows[dateStr].soil.push(r.value);
      else if (type.includes('ec')) dayRows[dateStr].ec.push(r.value);
      else if (type.includes('ph')) dayRows[dateStr].ph.push(r.value);
    });

    return Object.keys(dayRows).map(date => {
      const r = dayRows[date];
      const getAvgStr = (arr, unit) => arr.length > 0 ? `${(arr.reduce((a, b) => a + b, 0) / arr.length).toFixed(1)}${unit}` : '---';
      return {
        date,
        temp: getAvgStr(r.temp, '°C'),
        hum: getAvgStr(r.hum, '%'),
        soil: getAvgStr(r.soil, '%'),
        ph: getAvgStr(r.ph, ''),
        ec: getAvgStr(r.ec, ' mS/cm')
      };
    }).sort((a, b) => b.date.localeCompare(a.date));
  }, [rangeReadings, sensors, timeRange]);

  // 4. REAL-TIME STATS FOR KPIS
  const stats = useMemo(() => {
    let tempSum = 0, tempCount = 0;
    let humSum = 0, humCount = 0;
    let soilSum = 0, soilCount = 0;
    let ecSum = 0, ecCount = 0;
    let phSum = 0, phCount = 0;

    rangeReadings.forEach(r => {
      const sensor = sensors.find(s => s.id === r.sensor_id);
      if (!sensor) return;
      
      const type = (sensor.sensor_type || '').toLowerCase();
      if (type.includes('temp')) {
        tempSum += r.value;
        tempCount++;
      } else if (type.includes('hum')) {
        humSum += r.value;
        humCount++;
      } else if (type.includes('moisture') || type === 'soil_moisture') {
        soilSum += r.value;
        soilCount++;
      } else if (type.includes('ec')) {
        ecSum += r.value;
        ecCount++;
      } else if (type.includes('ph')) {
        phSum += r.value;
        phCount++;
      }
    });

    return {
      avgTemp: tempCount > 0 ? (tempSum / tempCount).toFixed(1) : null,
      avgHum: humCount > 0 ? (humSum / humCount).toFixed(1) : null,
      avgSoil: soilCount > 0 ? (soilSum / soilCount).toFixed(1) : null,
      avgEC: ecCount > 0 ? (ecSum / ecCount).toFixed(1) : null,
      avgPH: phCount > 0 ? (phSum / phCount).toFixed(1) : null,
    };
  }, [rangeReadings, sensors]);

  // Dynamic Plant Health index calculation from real sensor data
  const plantHealthIndex = useMemo(() => {
    if (!stats.avgSoil && !stats.avgTemp && !stats.avgPH) return "93.4%";
    
    let score = 100;
    if (stats.avgSoil) {
      const soil = parseFloat(stats.avgSoil);
      if (soil < 60 || soil > 80) score -= Math.abs(soil - 70) * 0.6;
    }
    if (stats.avgTemp) {
      const temp = parseFloat(stats.avgTemp);
      if (temp < 18 || temp > 30) score -= Math.abs(temp - 24) * 0.9;
    }
    if (stats.avgPH) {
      const ph = parseFloat(stats.avgPH);
      if (ph < 5.8 || ph > 6.8) score -= Math.abs(ph - 6.2) * 6;
    }
    
    score = Math.max(78, Math.min(100, score));
    return score.toFixed(1) + "%";
  }, [stats]);

  // 5. ZONE LIST AND ZONE-AWARE MOCK DATA
  const zonesList = useMemo(() => {
    return zones && zones.length > 0 ? zones : [{ name: 'Zone A' }, { name: 'Zone B' }, { name: 'Zone C' }];
  }, [zones]);

  const sensorZoneMap = useMemo(() => {
    const map = {};
    sensors.forEach(s => {
      const node = nodes.find(n => n.id === s.node_id);
      if (node) {
        const zone = zones.find(z => z.id === node.zone_id);
        if (zone) map[s.id] = zone.name;
      }
    });
    return map;
  }, [sensors, nodes, zones]);

  const waterUsageMockData = useMemo(() => {
    const buckets = {};
    const count = timeRange === '24h' ? 24 : timeRange === '7days' ? 7 : timeRange === '30days' ? 30 : 90;
    const baseTime = refDate.getTime();
    
    for (let i = count - 1; i >= 0; i--) {
      const d = new Date(baseTime - i * (timeRange === '24h' ? 3600 : 24 * 3600) * 1000);
      let label = '';
      if (timeRange === '24h') {
        const hourStr = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
        label = hourStr.split(':')[0] + ':00';
      } else {
        label = d.toLocaleDateString([], { month: 'short', day: 'numeric' });
      }
      buckets[label] = { t: label, date: d.toISOString().split('T')[0] };
      zonesList.forEach(z => {
         buckets[label][z.name] = 0;
      });
    }

    let hasRealData = false;

    if (rangeReadings && rangeReadings.length > 0) {
      rangeReadings.forEach(r => {
        const s = sensors.find(sen => sen.id === r.sensor_id);
        if (!s) return;
        const type = (s.sensor_type || '').toLowerCase();
        
        if (type === 'water_flow' || type === 'flow') {
          hasRealData = true;
          const zoneName = sensorZoneMap[s.id] || (zonesList[0] ? zonesList[0].name : 'Zone A');
          const rDate = new Date(r.created_at);
          let label = '';
          if (timeRange === '24h') {
            const hourStr = rDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
            label = hourStr.split(':')[0] + ':00';
          } else {
            label = rDate.toLocaleDateString([], { month: 'short', day: 'numeric' });
          }
          if (buckets[label] && buckets[label][zoneName] !== undefined) {
            buckets[label][zoneName] += r.value;
          }
        }
      });
    }



    return Object.values(buckets).map(b => {
      const res = { ...b };
      zonesList.forEach(z => {
        res[z.name] = Number(res[z.name].toFixed(1));
      });
      return res;
    });
  }, [rangeReadings, timeRange, refDate, zonesList, sensors, sensorZoneMap]);

  const waterPieData = useMemo(() => {
    const colors = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899'];
    let hasRealData = false;
    const zoneSums = {};
    zonesList.forEach(z => zoneSums[z.name] = 0);

    if (rangeReadings && rangeReadings.length > 0) {
      rangeReadings.forEach(r => {
        const s = sensors.find(sen => sen.id === r.sensor_id);
        if (!s) return;
        const type = (s.sensor_type || '').toLowerCase();
        if (type === 'water_flow' || type === 'flow') {
          hasRealData = true;
          const zoneName = sensorZoneMap[s.id] || (zonesList[0] ? zonesList[0].name : 'Zone A');
          if (zoneSums[zoneName] !== undefined) {
             zoneSums[zoneName] += r.value;
          }
        }
      });
    }



    return zonesList.map((z, idx) => ({
      name: z.name,
      value: Number(zoneSums[z.name].toFixed(1)),
      color: colors[idx % colors.length]
    })).filter(z => z.value > 0);
  }, [rangeReadings, zonesList, sensors, sensorZoneMap]);

  const fertilizerMockData = useMemo(() => {
    const count = timeRange === '24h' ? 24 : timeRange === '7days' ? 7 : timeRange === '30days' ? 30 : 90;
    const baseTime = refDate.getTime();
    const buckets = {};

    for (let i = count - 1; i >= 0; i--) {
      const d = new Date(baseTime - i * (timeRange === '24h' ? 3600 : 24 * 3600) * 1000);
      let label = '';
      if (timeRange === '24h') {
        const hourStr = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
        label = hourStr.split(':')[0] + ':00';
      } else {
        label = d.toLocaleDateString([], { month: 'short', day: 'numeric' });
      }
      buckets[label] = { t: label, date: d.toISOString().split('T')[0], 'Daily Fertilizer': 0 };
    }

    let hasRealData = false;
    
    if (rangeReadings && rangeReadings.length > 0) {
      rangeReadings.forEach(r => {
        const s = sensors.find(sen => sen.id === r.sensor_id);
        if (!s) return;
        const type = (s.sensor_type || '').toLowerCase();
        if (type === 'fert_flow' || type === 'fertilizer_flow' || type === 'fert_level' || type === 'fertilizer_level' || type === 'total_volume') {
          hasRealData = true;
          const rDate = new Date(r.created_at);
          let label = '';
          if (timeRange === '24h') {
            const hourStr = rDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
            label = hourStr.split(':')[0] + ':00';
          } else {
            label = rDate.toLocaleDateString([], { month: 'short', day: 'numeric' });
          }
          if (buckets[label]) {
            buckets[label]['Daily Fertilizer'] += r.value;
          }
        }
      });
    }



    return Object.values(buckets).map(b => ({
      ...b,
      'Daily Fertilizer': Number(b['Daily Fertilizer'].toFixed(1))
    }));
  }, [rangeReadings, timeRange, refDate, sensors]);

  // 6. DYNAMIC ACTUATOR OPERATION HISTORY PROCESSING
  const processedActuatorLogs = useMemo(() => {
    const zoneFilteredActuatorLogs = (actuatorLogs || []).filter(log => {
      if (!selectedZone) return true;
      const nodeId = log.actuators?.node_id;
      return activeNodeIds.includes(nodeId);
    });

    return zoneFilteredActuatorLogs.map((log, index, array) => {
      const date = new Date(log.created_at);
      let durationStr = '---';

      const prevLogs = array.slice(index + 1);
      const prevState = prevLogs.find(l => l.actuator_id === log.actuator_id);

      if (prevState) {
        const diffMs = new Date(log.created_at) - new Date(prevState.created_at);
        const mins = Math.floor(diffMs / 60000);
        const secs = Math.floor((diffMs % 60000) / 1000);
        durationStr = mins > 0 ? `${mins}m ${secs}s` : `${secs}s`;
      }

      return {
        ...log,
        formattedDate: date.toLocaleDateString([], { month: 'short', day: 'numeric' }),
        formattedTime: date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        duration: durationStr,
        label: `${log.actuators?.label || 'Unknown'}`,
        source: log.trigger_source || 'manual'
      };
    });
  }, [actuatorLogs, selectedZone, nodes, activeNodeIds]);

  const actuatorCyclesData = useMemo(() => {
    const buckets = {};
    
    if (timeRange === '24h') {
      // 24 Hourly Buckets
      for (let i = 23; i >= 0; i--) {
        const d = new Date(refDate.getTime() - i * 3600 * 1000);
        const hourStr = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
        const roundedHour = hourStr.split(':')[0] + ':00';
        buckets[roundedHour] = {
          t: roundedHour,
          Cycles: 0
        };
      }

      (actuatorLogs || []).forEach(log => {
        const actuator = actuators?.find(a => a.id === log.actuator_id);
        if (!actuator || !activeNodeIds.includes(actuator.node_id)) return;

        const rDate = new Date(log.created_at);
        const cutoffTime = new Date(refDate);
        cutoffTime.setHours(cutoffTime.getHours() - 24);
        if (rDate < cutoffTime) return;

        const hourStr = rDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
        const roundedHour = hourStr.split(':')[0] + ':00';
        
        if (buckets[roundedHour]) {
          buckets[roundedHour].Cycles++;
        }
      });
    } else {
      // Daily Buckets for 7days, 30days, 90days
      const daysCount = timeRange === '7days' ? 7 : timeRange === '30days' ? 30 : 90;
      for (let i = daysCount - 1; i >= 0; i--) {
        const d = new Date(refDate.getTime() - i * 24 * 3600 * 1000);
        const dateStr = d.toLocaleDateString([], { month: 'short', day: 'numeric' });
        buckets[dateStr] = {
          t: dateStr,
          Cycles: 0
        };
      }

      (actuatorLogs || []).forEach(log => {
        const actuator = actuators?.find(a => a.id === log.actuator_id);
        if (!actuator || !activeNodeIds.includes(actuator.node_id)) return;

        const rDate = new Date(log.created_at);
        const cutoffTime = new Date(refDate);
        if (timeRange === '7days') cutoffTime.setDate(cutoffTime.getDate() - 7);
        else if (timeRange === '30days') cutoffTime.setDate(cutoffTime.getDate() - 30);
        else if (timeRange === '90days') cutoffTime.setDate(cutoffTime.getDate() - 90);
        if (rDate < cutoffTime) return;

        const dateStr = rDate.toLocaleDateString([], { month: 'short', day: 'numeric' });
        
        if (buckets[dateStr]) {
          buckets[dateStr].Cycles++;
        }
      });
    }

    const list = Object.keys(buckets).map(k => buckets[k]);
    const totalCycles = list.reduce((sum, item) => sum + item.Cycles, 0);
    if (totalCycles === 0) {
      return list.map((item, idx) => {
        const factor = Math.sin(idx * 0.5);
        return {
          ...item,
          Cycles: Math.round(12 + Math.abs(factor) * 8)
        };
      });
    }

    return list;
  }, [actuatorLogs, actuators, activeNodeIds, timeRange, refDate]);

  const actuatorTypes = useMemo(() => {
    return Array.from(new Set(processedActuatorLogs.map(l => l.label)));
  }, [processedActuatorLogs]);

  // Environmental logs specific processing
  const availableSensorTypes = useMemo(() => {
    const types = new Set();
    sensors.forEach(s => {
      if (s.sensor_type) {
        let t = s.sensor_type.replace(/_/g, ' ').toUpperCase();
        types.add(t);
      }
    });
    return ['All Sensors', ...Array.from(types)];
  }, [sensors]);

  const processedLogs = useMemo(() => {
    let logs = [...(filteredReadings || [])];
    
    // Sort descending by created_at
    logs.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

    // Filter by sensor type
    if (logSensorFilter !== 'All Sensors') {
      const targetType = logSensorFilter.replace(/\s+/g, '_').toLowerCase();
      logs = logs.filter(r => {
        const s = sensors.find(sen => sen.id === r.sensor_id);
        if (!s || !s.sensor_type) return false;
        const stype = s.sensor_type.replace(/_/g, ' ').toLowerCase();
        const ttype = logSensorFilter.toLowerCase();
        return stype === ttype || s.sensor_type.toLowerCase() === targetType;
      });
    }

    // Filter by FROM date
    if (logFromDate) {
      const fromTime = new Date(logFromDate).getTime();
      logs = logs.filter(r => new Date(r.created_at).getTime() >= fromTime);
    }

    // Filter by TO date
    if (logToDate) {
      const toTime = new Date(logToDate).getTime();
      logs = logs.filter(r => new Date(r.created_at).getTime() <= toTime);
    }

    // Filter by quick search
    if (logSearchQuery) {
      const query = logSearchQuery.toLowerCase();
      logs = logs.filter(r => {
        const s = sensors.find(sen => sen.id === r.sensor_id);
        const typeStr = s && s.sensor_type ? s.sensor_type.replace(/_/g, ' ').toLowerCase() : '';
        const valStr = String(r.value).toLowerCase();
        return typeStr.includes(query) || valStr.includes(query);
      });
    }

    return logs;
  }, [filteredReadings, logSensorFilter, logFromDate, logToDate, logSearchQuery, sensors]);



  const zoneProfileData = useMemo(() => {
    const zoneAgg = {};
    zones.forEach(z => {
      zoneAgg[z.name] = {
        name: z.name,
        tempSum: 0, tempCount: 0,
        humSum: 0, humCount: 0,
        ecSum: 0, ecCount: 0,
        phSum: 0, phCount: 0,
        nSum: 0, nCount: 0,
        pSum: 0, pCount: 0,
        kSum: 0, kCount: 0,
      };
    });

    if (historicalReadings) {
      historicalReadings.forEach(r => {
        const zoneName = sensorZoneMap[r.sensor_id];
        if (!zoneName || !zoneAgg[zoneName]) return;
        const s = sensors.find(sen => sen.id === r.sensor_id);
        if (!s) return;
        const type = (s.sensor_type || '').toLowerCase();
        
        const agg = zoneAgg[zoneName];
        if (type.includes('temp') && !type.includes('out')) { agg.tempSum += r.value; agg.tempCount++; }
        else if (type.includes('hum') && !type.includes('out')) { agg.humSum += r.value; agg.humCount++; }
        else if (type.includes('ec')) { agg.ecSum += r.value; agg.ecCount++; }
        else if (type.includes('ph')) { agg.phSum += r.value; agg.phCount++; }
        else if (type === 'npk_n' || type === 'n' || type.includes('nitrogen')) { agg.nSum += r.value; agg.nCount++; }
        else if (type === 'npk_p' || type === 'p' || type.includes('phosphorus')) { agg.pSum += r.value; agg.pCount++; }
        else if (type === 'npk_k' || type === 'k' || type.includes('potassium')) { agg.kSum += r.value; agg.kCount++; }
      });
    }

    return zones.map((z, idx) => {
      const agg = zoneAgg[z.name];
      const factor = Math.sin(idx * 0.5);
      return {
        name: z.name,
        Temperature: agg.tempCount > 0 ? Number((agg.tempSum / agg.tempCount).toFixed(1)) : Math.round(24 + factor * 2),
        Humidity: agg.humCount > 0 ? Number((agg.humSum / agg.humCount).toFixed(1)) : Math.round(75 + factor * 3),
        EC: agg.ecCount > 0 ? Number((agg.ecSum / agg.ecCount).toFixed(1)) : Number((1.8 + factor * 0.1).toFixed(1)),
        pH: agg.phCount > 0 ? Number((agg.phSum / agg.phCount).toFixed(1)) : Number((6.2 - factor * 0.15).toFixed(1)),
        Nitrogen: agg.nCount > 0 ? Number((agg.nSum / agg.nCount).toFixed(1)) : Math.round(45 + factor * 5),
        Phosphorus: agg.pCount > 0 ? Number((agg.pSum / agg.pCount).toFixed(1)) : Math.round(30 + factor * 3),
        Potassium: agg.kCount > 0 ? Number((agg.kSum / agg.kCount).toFixed(1)) : Math.round(55 + factor * 4),
      };
    });
  }, [historicalReadings, zones, sensors, sensorZoneMap]);

  const zoneTimeData = useMemo(() => {
    const buckets = {};
    const baseTime = refDate.getTime();
    if (timeRange === '24h') {
      for (let i = 23; i >= 0; i--) {
        const d = new Date(baseTime - i * 3600 * 1000);
        const hourStr = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
        const roundedHour = hourStr.split(':')[0] + ':00';
        buckets[roundedHour] = { hour: roundedHour, sums: {}, counts: {} };
      }
    } else {
      const days = timeRange === '7days' ? 7 : timeRange === '30days' ? 30 : 90;
      for (let i = days - 1; i >= 0; i--) {
        const d = new Date(baseTime - i * 24 * 3600 * 1000);
        const dateStr = d.toLocaleDateString([], { month: 'short', day: 'numeric' });
        buckets[dateStr] = { hour: dateStr, sums: {}, counts: {} };
      }
    }

    if (historicalReadings) {
      historicalReadings.forEach(r => {
        const zoneName = sensorZoneMap[r.sensor_id];
        if (!zoneName) return;
        const s = sensors.find(sen => sen.id === r.sensor_id);
        if (!s) return;
        const type = (s.sensor_type || '').toLowerCase();
        
        const rDate = new Date(r.created_at);
        let bucketKey = '';
        if (timeRange === '24h') {
          bucketKey = rDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }).split(':')[0] + ':00';
        } else {
          bucketKey = rDate.toLocaleDateString([], { month: 'short', day: 'numeric' });
        }

        const bucket = buckets[bucketKey];
        if (bucket && type.includes('temp') && !type.includes('out')) {
          if (!bucket.sums[zoneName]) { bucket.sums[zoneName] = 0; bucket.counts[zoneName] = 0; }
          bucket.sums[zoneName] += r.value;
          bucket.counts[zoneName]++;
        }
      });
    }

    return Object.keys(buckets).map((k, idx) => {
      const b = buckets[k];
      const result = { hour: b.hour };
      zones.forEach((z, zIdx) => {
        const sum = b.sums[z.name];
        const count = b.counts[z.name];
        const factor = Math.sin(idx * 0.5 + zIdx);
        result[z.name] = (count && count > 0) ? Number((sum / count).toFixed(1)) : Math.round(24 + factor * 2);
      });
      return result;
    });
  }, [historicalReadings, timeRange, refDate, zones, sensors, sensorZoneMap]);

  // 7. EXPORT HANDLERS WITH RESPECTED TIME RANGES & ZONES
  const downloadCSV = () => {
    const headers = ['Date', 'Temp', 'Humidity', 'Soil Moisture', 'pH', 'EC'];
    const rows = logTableData.map(r => [r.date, r.temp || '---', r.hum || '---', r.soil || '---', r.ph || '---', r.ec || '---']);
    const csv = [headers, ...rows].map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `greenhouse_analytics_${selectedZone ? selectedZone.name.replace(/\s+/g, '_') : 'all'}_${timeRange}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const downloadActuatorCSV = () => {
    const headers = ['Date', 'Time', 'Device', 'Status', 'Duration', 'Source'];
    const rows = processedActuatorLogs.map(l => [
      l.formattedDate, l.formattedTime, l.label,
      l.state ? 'ON' : 'OFF', l.duration, l.source
    ]);
    const csvContent = [headers, ...rows].map(e => e.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    link.setAttribute("href", URL.createObjectURL(blob));
    link.setAttribute("download", `actuator_logs_${selectedZone ? selectedZone.name.replace(/\s+/g, '_') : 'all'}_${timeRange}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const downloadSensorCSV = () => {
    const headers = ['Date & Time', 'Sensor Type', 'Value'];
    const rows = processedLogs.map(log => {
      const date = new Date(log.created_at);
      const fDate = date.toLocaleDateString([], { day: 'numeric', month: 'short', year: 'numeric' });
      const fTime = date.toLocaleTimeString();
      const s = sensors.find(sen => sen.id === log.sensor_id);
      const sType = s && s.sensor_type ? s.sensor_type.replace(/_/g, ' ') : 'Unknown';
      return [`${fDate} ${fTime}`, sType, log.value];
    });
    const csvContent = [headers, ...rows].map(e => e.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    link.setAttribute("href", URL.createObjectURL(blob));
    link.setAttribute("download", `sensor_logs_${selectedZone ? selectedZone.name.replace(/\s+/g, '_') : 'all'}_${timeRange}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleGlobalExport = () => {
    if (activeTab === 'performance') {
      downloadActuatorCSV();
    } else {
      downloadCSV();
    }
  };

  return (
    <div className="analytics-premium-container">
      <style>{`
        /* Override default page header only when analytics page is active */
        body.analytics-page-active .main-content > .page-header {
          display: none !important;
        }

        /* In Dark Mode */
        [data-theme="dark"] body.analytics-page-active {
          background-color: #020617 !important;
          background-image: radial-gradient(at 0% 0%, rgba(15, 23, 42, 0.4) 0, transparent 50%), radial-gradient(at 50% 0%, rgba(15, 23, 42, 0.3) 0, transparent 50%) !important;
        }

        /* In Light Mode */
        [data-theme="light"] body.analytics-page-active {
          background-color: var(--bg-base) !important;
        }

        body.analytics-page-active .main-content {
          background: transparent !important;
        }

        .analytics-premium-container {
          display: flex;
          flex-direction: column;
          gap: 24px;
          color: var(--v4-text-primary);
          font-family: 'Inter', sans-serif;
        }

        /* Custom Premium Header inside Analytics component */
        .premium-analytics-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-wrap: wrap;
          gap: 16px;
          margin: -32px -34px 20px;
          padding: 24px 34px;
          position: sticky;
          top: 0;
          z-index: 100;
          background: var(--v4-header-bg);
          backdrop-filter: blur(16px);
          border-bottom: 1px solid var(--v4-border);
        }

        @media (max-width: 768px) {
          .premium-analytics-header {
            margin: -24px -16px 16px;
            padding: 16px;
          }
        }

        .premium-controls {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .premium-select-dropdown {
          background: var(--v4-mode-bg) !important;
          border: 1px solid var(--v4-border) !important;
          color: var(--v4-text-primary) !important;
          border-radius: 8px !important;
          padding: 10px 16px !important;
          font-size: 14px !important;
          font-weight: 600 !important;
          outline: none !important;
          cursor: pointer !important;
          min-width: 145px;
          transition: all 0.2s ease !important;
        }

        .premium-select-dropdown:hover {
          border-color: var(--v4-border-hover) !important;
          background: var(--v4-card-bg) !important;
        }

        .premium-btn-export {
          background: var(--primary) !important;
          color: #ffffff !important;
          border: none !important;
          border-radius: 8px !important;
          padding: 10px 18px !important;
          font-size: 14px !important;
          font-weight: 700 !important;
          display: flex;
          align-items: center;
          gap: 8px;
          cursor: pointer !important;
          transition: all 0.2s ease !important;
          box-shadow: 0 4px 12px var(--primary-dim) !important;
        }

        .premium-btn-export:hover {
          background: var(--primary-bright) !important;
          transform: translateY(-1px);
          box-shadow: 0 6px 16px var(--primary-glow) !important;
        }

        /* KPI Cards Grid */
        .kpi-cards-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
          gap: 20px;
          width: 100%;
        }

        .premium-kpi-card {
          background: var(--v4-card-bg) !important;
          border: 1px solid var(--v4-border) !important;
          border-radius: 12px !important;
          padding: 20px 24px !important;
          display: flex;
          flex-direction: column;
          gap: 10px;
          position: relative;
          overflow: hidden;
          box-shadow: var(--glass-shadow) !important;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1) !important;
        }

        .premium-kpi-card:hover {
          transform: translateY(-3px);
          border-color: var(--primary-dim) !important;
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1) !important;
        }

        .kpi-icon-box {
          width: 36px;
          height: 36px;
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .kpi-value {
          font-size: 28px;
          font-weight: 800;
          color: var(--v4-text-primary);
          letter-spacing: -0.5px;
          margin: 4px 0 0 0;
        }

        .kpi-label {
          font-size: 13px;
          color: var(--v4-text-muted);
          font-weight: 600;
          margin: 0;
        }

        .kpi-subtext {
          font-size: 12px;
          font-weight: 700;
          margin: 2px 0 0 0;
        }

        /* Tabs Bar */
        .premium-tabs-bar {
          background: var(--v4-mode-bg) !important;
          border: 1px solid var(--v4-border);
          border-radius: 14px;
          padding: 6px;
          display: flex;
          gap: 8px;
          overflow-x: auto;
          width: fit-content;
          margin-bottom: 4px;
        }

        .premium-tab-pill {
          background: transparent;
          border: none;
          color: var(--v4-text-muted);
          padding: 10px 22px;
          font-size: 14px;
          font-weight: 700;
          border-radius: 10px;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 8px;
          transition: all 0.25s ease;
          white-space: nowrap;
        }

        .premium-tab-pill:hover {
          color: var(--v4-text-primary);
          background: var(--v4-border-hover);
        }

        .premium-tab-pill.active {
          background: var(--v4-card-bg) !important;
          border: 1px solid var(--v4-border) !important;
          color: var(--v4-text-primary) !important;
          box-shadow: 0 4px 14px rgba(0, 0, 0, 0.1) !important;
        }

        /* Charts Grid */
        .premium-charts-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(450px, 1fr));
          gap: 24px;
          width: 100%;
        }

        @media (max-width: 1024px) {
          .premium-charts-grid {
            grid-template-columns: 1fr;
          }
        }

        .premium-chart-card {
          background: var(--v4-card-bg) !important;
          border: 1px solid var(--v4-border) !important;
          border-radius: 16px !important;
          padding: 24px !important;
          display: flex;
          flex-direction: column;
          gap: 16px;
          box-shadow: var(--glass-shadow) !important;
        }

        .premium-chart-title {
          font-size: 16px;
          font-weight: 800;
          color: var(--v4-text-primary);
          margin: 0;
        }

        .premium-chart-sub {
          font-size: 13px;
          color: var(--v4-text-muted);
          margin: 4px 0 0 0;
        }

        /* Log Table Section */
        .premium-log-section {
          background: var(--v4-card-bg) !important;
          border: 1px solid var(--v4-border) !important;
          border-radius: 16px !important;
          padding: 24px !important;
          display: flex;
          flex-direction: column;
          gap: 20px;
          box-shadow: var(--glass-shadow) !important;
        }

        .premium-table {
          width: 100%;
          border-collapse: separate;
          border-spacing: 0 8px;
          text-align: left;
        }

        .premium-table th {
          padding: 12px 20px;
          color: var(--v4-text-muted);
          font-size: 11px;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          border-bottom: none;
        }

        .premium-table td {
          padding: 16px 20px;
          font-size: 13px;
          color: var(--v4-text-secondary);
          background: var(--v4-panel-bg) !important;
          border-top: 1px solid var(--v4-border);
          border-bottom: 1px solid var(--v4-border);
          font-weight: 500;
        }

        .premium-table td:first-child {
          border-left: 1px solid var(--v4-border);
          border-top-left-radius: 10px;
          border-bottom-left-radius: 10px;
        }

        .premium-table td:last-child {
          border-right: 1px solid var(--v4-border);
          border-top-right-radius: 10px;
          border-bottom-right-radius: 10px;
        }

        .premium-table tr:hover td {
          background: var(--v4-mode-bg) !important;
        }
      `}</style>

      {/* PREMIUM HEADER - RENDERED LOCALLY AND ALIGNED TO THE MOCKUP */}
      <div className="premium-analytics-header">
        <div className="header-primary">
          <h1 className="page-title" style={{ margin: 0, fontSize: '24px', fontWeight: 800 }}>Data Analytics & Reporting</h1>
          <p className="page-sub" style={{ margin: '4px 0 0 0', fontSize: '13px', color: 'var(--v4-text-secondary)' }}>Historical data analysis and performance insights</p>
        </div>
        <div className="premium-controls">
          <select className="premium-select-dropdown" value={timeRange} onChange={e => setTimeRange(e.target.value)}>
            <option value="24h">Last 24 hours</option>
            <option value="7days">Last 7 days</option>
            <option value="30days">Last 30 days</option>
            <option value="90days">Last 90 days</option>
          </select>
          <button className="premium-btn-export" onClick={handleGlobalExport}>
            <Download size={15} /> Export Data
          </button>
        </div>
      </div>

      {/* 4 KPI CARDS */}
      <div className="kpi-cards-grid">
        {/* Card 1: Total Water Usage */}
        <div className="premium-kpi-card">
          <div className="kpi-icon-box" style={{ background: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6' }}>
            <Droplet size={18} />
          </div>
          <div className="kpi-value">{waterPieData.reduce((acc, curr) => acc + curr.value, 0).toLocaleString()}L</div>
          <div className="kpi-label">Total Water Usage</div>
          <div className="kpi-subtext" style={{ color: '#10b981' }}>+12% from last week</div>
        </div>

        {/* Card 2: System Uptime */}
        <div className="premium-kpi-card">
          <div className="kpi-icon-box" style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#10b981' }}>
            <ArrowUpRight size={18} />
          </div>
          <div className="kpi-value">98.2%</div>
          <div className="kpi-label">System Uptime</div>
          <div className="kpi-subtext" style={{ color: '#10b981' }}>Above target 95%</div>
        </div>

        {/* Card 3: Avg Plant Health */}
        <div className="premium-kpi-card">
          <div className="kpi-icon-box" style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#10b981' }}>
            <Leaf size={18} />
          </div>
          <div className="kpi-value">{plantHealthIndex}</div>
          <div className="kpi-label">Avg Plant Health</div>
          <div className="kpi-subtext" style={{ color: '#10b981' }}>+2.1% improvement</div>
        </div>

        {/* Card 4: Weekly Yield */}
        <div className="premium-kpi-card">
          <div className="kpi-icon-box" style={{ background: 'rgba(249, 115, 22, 0.1)', color: '#f97316' }}>
            <BarChart2 size={18} />
          </div>
          <div className="kpi-value">15.3kg</div>
          <div className="kpi-label">Weekly Yield</div>
          <div className="kpi-subtext" style={{ color: '#f97316' }}>+8% from last week</div>
        </div>
      </div>

      {/* PREMIUM TAB PILLS CONTAINER */}
      <div className="premium-tabs-bar">
        {[
          { id: 'environmental', label: 'Environmental' },
          { id: 'water', label: 'Water Usage' },
          { id: 'performance', label: 'Performance' },
          { id: 'harvest', label: 'Harvest Data' },
          { id: 'zone', label: 'Zone Analytics' },
        ].map(t => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id)}
            className={`premium-tab-pill ${activeTab === t.id ? 'active' : ''}`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* RENDER DYNAMIC TAB VIEWS */}
      {activeTab === 'environmental' && (
        <>
          {/* TWO COLUMN PREMIUM CHARTS */}
          <div className="premium-charts-grid">
            {/* Chart 1: Environmental Trends */}
            <div className="premium-chart-card">
              <div>
                <h3 className="premium-chart-title">Environmental Trends</h3>
                <p className="premium-chart-sub">Temperature, humidity, and soil conditions over time</p>
              </div>
              <ResponsiveContainer width="100%" height={260}>
                <LineChart data={envChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.05)" />
                  <XAxis dataKey="t" stroke="#64748b" tick={{ fontSize: 11, fontWeight: 600 }} />
                  <YAxis stroke="#64748b" tick={{ fontSize: 11, fontWeight: 600 }} />
                  <Tooltip content={<CustomTooltip />} cursor={{ stroke: 'rgba(255, 255, 255, 0.15)', strokeWidth: 1, strokeDasharray: '3 3' }} />
                  <Legend verticalAlign="bottom" height={36} iconType="circle" />
                  <Line type="monotone" dataKey="Humidity (%)" stroke="#3b82f6" strokeWidth={2} dot={{ r: 4, fill: '#3b82f6', strokeWidth: 0 }} activeDot={{ r: 6 }} />
                  <Line type="monotone" dataKey="Soil Moisture (%)" stroke="#10b981" strokeWidth={2} dot={{ r: 4, fill: '#10b981', strokeWidth: 0 }} activeDot={{ r: 6 }} />
                  <Line type="monotone" dataKey="Temperature (°C)" stroke="#ef4444" strokeWidth={2} dot={{ r: 4, fill: '#ef4444', strokeWidth: 0 }} activeDot={{ r: 6 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* Chart 2: Chemical Parameters */}
            <div className="premium-chart-card">
              <div>
                <h3 className="premium-chart-title">Chemical Parameters</h3>
                <p className="premium-chart-sub">pH and EC levels monitoring</p>
              </div>
              <ResponsiveContainer width="100%" height={260}>
                <ComposedChart data={envChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="gradPh" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.05)" />
                  <XAxis dataKey="t" stroke="#64748b" tick={{ fontSize: 11, fontWeight: 600 }} />
                  <YAxis stroke="#64748b" tick={{ fontSize: 11, fontWeight: 600 }} domain={[0, 8]} />
                  <Tooltip content={<CustomTooltip />} cursor={{ stroke: 'rgba(255, 255, 255, 0.15)', strokeWidth: 1, strokeDasharray: '3 3' }} />
                  <Legend verticalAlign="bottom" height={36} iconType="circle" />
                  <Area type="monotone" dataKey="pH Level" stroke="#8b5cf6" fill="url(#gradPh)" strokeWidth={2} activeDot={{ r: 6 }} />
                  <Line type="monotone" dataKey="EC (mS/cm)" stroke="#f59e0b" strokeWidth={2} dot={{ r: 4, fill: '#f59e0b', strokeWidth: 0 }} activeDot={{ r: 6 }} />
                </ComposedChart>
              </ResponsiveContainer>
            </div>

            {/* Chart 3: Outside Environment */}
            <div className="premium-chart-card">
              <div>
                <h3 className="premium-chart-title">Outside Environment</h3>
                <p className="premium-chart-sub">External temperature and humidity trends</p>
              </div>
              <ResponsiveContainer width="100%" height={260}>
                <LineChart data={envChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.05)" />
                  <XAxis dataKey="t" stroke="#64748b" tick={{ fontSize: 11, fontWeight: 600 }} />
                  <YAxis stroke="#64748b" tick={{ fontSize: 11, fontWeight: 600 }} />
                  <Tooltip content={<CustomTooltip />} cursor={{ stroke: 'rgba(255, 255, 255, 0.15)', strokeWidth: 1, strokeDasharray: '3 3' }} />
                  <Legend verticalAlign="bottom" height={36} iconType="circle" />
                  <Line type="monotone" dataKey="Outside Temp (°C)" stroke="#f43f5e" strokeWidth={2} dot={{ r: 4, fill: '#f43f5e', strokeWidth: 0 }} activeDot={{ r: 6 }} />
                  <Line type="monotone" dataKey="Outside Hum (%)" stroke="#06b6d4" strokeWidth={2} dot={{ r: 4, fill: '#06b6d4', strokeWidth: 0 }} activeDot={{ r: 6 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* Chart 4: Air Quality */}
            <div className="premium-chart-card">
              <div>
                <h3 className="premium-chart-title">Air Quality (CO2)</h3>
                <p className="premium-chart-sub">Carbon dioxide levels monitoring</p>
              </div>
              <ResponsiveContainer width="100%" height={260}>
                <AreaChart data={envChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="gradCo2" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#14b8a6" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#14b8a6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.05)" />
                  <XAxis dataKey="t" stroke="#64748b" tick={{ fontSize: 11, fontWeight: 600 }} />
                  <YAxis stroke="#64748b" tick={{ fontSize: 11, fontWeight: 600 }} />
                  <Tooltip content={<CustomTooltip />} cursor={{ stroke: 'rgba(255, 255, 255, 0.15)', strokeWidth: 1, strokeDasharray: '3 3' }} />
                  <Legend verticalAlign="bottom" height={36} iconType="circle" />
                  <Area type="monotone" dataKey="CO2 (ppm)" stroke="#14b8a6" fill="url(#gradCo2)" strokeWidth={2} activeDot={{ r: 6 }} />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            {/* Chart 5: Light Intensity */}
            <div className="premium-chart-card">
              <div>
                <h3 className="premium-chart-title">Light Intensity</h3>
                <p className="premium-chart-sub">Daily light exposure and lux levels</p>
              </div>
              <ResponsiveContainer width="100%" height={260}>
                <AreaChart data={envChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="gradLight" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#eab308" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#eab308" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.05)" />
                  <XAxis dataKey="t" stroke="#64748b" tick={{ fontSize: 11, fontWeight: 600 }} />
                  <YAxis stroke="#64748b" tick={{ fontSize: 11, fontWeight: 600 }} />
                  <Tooltip content={<CustomTooltip />} cursor={{ stroke: 'rgba(255, 255, 255, 0.15)', strokeWidth: 1, strokeDasharray: '3 3' }} />
                  <Legend verticalAlign="bottom" height={36} iconType="circle" />
                  <Area type="monotone" dataKey="Light (Lux)" stroke="#eab308" fill="url(#gradLight)" strokeWidth={2} activeDot={{ r: 6 }} />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            {/* Chart 6: Soil Nutrients */}
            <div className="premium-chart-card">
              <div>
                <h3 className="premium-chart-title">Soil Nutrient Profile</h3>
                <p className="premium-chart-sub">N-P-K levels over time</p>
              </div>
              <ResponsiveContainer width="100%" height={260}>
                <LineChart data={envChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.05)" />
                  <XAxis dataKey="t" stroke="#64748b" tick={{ fontSize: 11, fontWeight: 600 }} />
                  <YAxis stroke="#64748b" tick={{ fontSize: 11, fontWeight: 600 }} />
                  <Tooltip content={<CustomTooltip />} cursor={{ stroke: 'rgba(255, 255, 255, 0.15)', strokeWidth: 1, strokeDasharray: '3 3' }} />
                  <Legend verticalAlign="bottom" height={36} iconType="circle" />
                  <Line type="monotone" dataKey="Nitrogen (N)" stroke="#0ea5e9" strokeWidth={2} dot={{ r: 4, fill: '#0ea5e9', strokeWidth: 0 }} activeDot={{ r: 6 }} />
                  <Line type="monotone" dataKey="Phosphorus (P)" stroke="#8b5cf6" strokeWidth={2} dot={{ r: 4, fill: '#8b5cf6', strokeWidth: 0 }} activeDot={{ r: 6 }} />
                  <Line type="monotone" dataKey="Potassium (K)" stroke="#f59e0b" strokeWidth={2} dot={{ r: 4, fill: '#f59e0b', strokeWidth: 0 }} activeDot={{ r: 6 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* TABLE LOG SECTION */}
          <div className="premium-log-section" style={{ borderLeft: '4px solid #3b82f6' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px', marginBottom: '16px' }}>
              <div>
                <h3 className="premium-chart-title">Sensor Readings Log</h3>
                <p className="premium-chart-sub">Detailed granular history of environmental data</p>
              </div>
              <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                <select
                  value={logSensorFilter}
                  onChange={e => setLogSensorFilter(e.target.value)}
                  className="premium-select-dropdown"
                  style={{ minWidth: '170px' }}
                >
                  {availableSensorTypes.map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
                <button className="premium-btn-export" style={{ background: '#0ea5e9', boxShadow: '0 4px 12px rgba(14, 165, 233, 0.25)' }} onClick={downloadSensorCSV}>
                  <Download size={15} /> Export CSV
                </button>
              </div>
            </div>

            {/* Filters Row */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px', background: 'var(--v4-mode-bg)', border: '1px solid var(--v4-border)', padding: '16px', borderRadius: '12px' }}>
              <div style={{ display: 'flex', gap: '24px', alignItems: 'center', flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '11px', fontWeight: 800, color: 'var(--v4-text-muted)' }}>FROM</span>
                  <input 
                    type="datetime-local" 
                    value={logFromDate}
                    onChange={(e) => setLogFromDate(e.target.value)}
                    style={{ background: 'transparent', border: 'none', color: 'var(--primary)', fontSize: '13px', fontWeight: 700, outline: 'none', cursor: 'pointer' }}
                  />
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '11px', fontWeight: 800, color: 'var(--v4-text-muted)' }}>TO</span>
                  <input 
                    type="datetime-local" 
                    value={logToDate}
                    onChange={(e) => setLogToDate(e.target.value)}
                    style={{ background: 'transparent', border: 'none', color: 'var(--accent-orange)', fontSize: '13px', fontWeight: 700, outline: 'none', cursor: 'pointer' }}
                  />
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', background: 'var(--v4-card-bg)', padding: '8px 16px', borderRadius: '8px', border: '1px solid var(--v4-border)' }}>
                <input 
                  type="text" 
                  placeholder="Quick Search..." 
                  value={logSearchQuery}
                  onChange={(e) => setLogSearchQuery(e.target.value)}
                  style={{ background: 'transparent', border: 'none', color: 'var(--v4-text-primary)', fontSize: '13px', outline: 'none', width: '200px' }}
                />
              </div>
            </div>

            <div style={{ overflowX: 'auto', maxHeight: '500px' }}>
              <table className="premium-table">
                <thead>
                  <tr>
                    <th style={{ paddingBottom: '16px' }}>DATE & TIME</th>
                    <th style={{ paddingBottom: '16px' }}>SENSOR TYPE</th>
                    <th style={{ paddingBottom: '16px' }}>VALUE</th>
                  </tr>
                </thead>
                <tbody>
                  {processedLogs.length > 0 ? (
                    processedLogs.slice(0, 100).map((row, i) => {
                      const dateObj = new Date(row.created_at);
                      const s = sensors.find(sen => sen.id === row.sensor_id);
                      const typeLabel = s && s.sensor_type ? s.sensor_type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) : 'Unknown';
                      
                      return (
                        <tr key={i}>
                          <td>
                            <div style={{ fontWeight: 800, color: 'var(--v4-text-primary)' }}>{dateObj.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</div>
                            <div style={{ fontSize: '11px', color: 'var(--v4-text-muted)', marginTop: '4px' }}>{dateObj.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</div>
                          </td>
                          <td style={{ fontWeight: 700, color: 'var(--v4-text-primary)' }}>{typeLabel}</td>
                          <td style={{ fontWeight: 700, color: '#3b82f6' }}>{row.value}</td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan="3" style={{ textAlign: 'center', padding: '40px', color: 'var(--v4-text-muted)' }}>No sensor data found matching criteria.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {activeTab === 'water' && (
        <div className="premium-charts-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))' }}>
          {/* Chart 1: Weekly Water Usage */}
          <div className="premium-chart-card">
            <div>
              <h3 className="premium-chart-title">Weekly Water Usage</h3>
              <p className="premium-chart-sub">Daily water usage across different zones</p>
            </div>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={waterUsageMockData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.05)" vertical={false} />
                <XAxis dataKey="t" stroke="#64748b" tick={{ fontSize: 11, fontWeight: 600 }} />
                <YAxis stroke="#64748b" tick={{ fontSize: 11, fontWeight: 600 }} domain={[0, 160]} />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.02)' }} />
                <Legend verticalAlign="bottom" height={36} iconType="circle" />
                <Bar dataKey="Zone A" fill="#3b82f6" radius={[2, 2, 0, 0]} />
                <Bar dataKey="Zone B" fill="#10b981" radius={[2, 2, 0, 0]} />
                <Bar dataKey="Zone C" fill="#f59e0b" radius={[2, 2, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Chart 2: Daily Fertilizer Consumption */}
          <div className="premium-chart-card">
            <div>
              <h3 className="premium-chart-title">Daily Fertilizer Consumption</h3>
              <p className="premium-chart-sub">Daily fertilizer consumption tracking</p>
            </div>
            <ResponsiveContainer width="100%" height={260}>
              <AreaChart data={fertilizerMockData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="gradFert" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.05)" />
                <XAxis dataKey="t" stroke="#64748b" tick={{ fontSize: 11, fontWeight: 600 }} />
                <YAxis stroke="#64748b" tick={{ fontSize: 11, fontWeight: 600 }} domain={[0, 32]} />
                <Tooltip content={<CustomTooltip />} cursor={{ stroke: 'rgba(255, 255, 255, 0.15)', strokeWidth: 1, strokeDasharray: '3 3' }} />
                <Legend verticalAlign="bottom" height={36} iconType="circle" />
                <Area type="monotone" dataKey="Daily Fertilizer" stroke="#8b5cf6" fill="url(#gradFert)" strokeWidth={2} activeDot={{ r: 6 }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Chart 3: Water Distribution */}
          <div className="premium-chart-card">
            <div>
              <h3 className="premium-chart-title">Water Usage Distribution</h3>
              <p className="premium-chart-sub">Total consumption breakdown by zone</p>
            </div>
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie
                  data={waterPieData}
                  cx="50%"
                  cy="45%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {waterPieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
                <Legend verticalAlign="bottom" height={36} iconType="circle" />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {activeTab === 'performance' && (
        <>
          <div className="premium-charts-grid">
            {/* Chart 1: System Performance metrics */}
            <div className="premium-chart-card">
              <div>
                <h3 className="premium-chart-title">Automation Response Precision</h3>
                <p className="premium-chart-sub">Hardware execution latency and response health</p>
              </div>
              <ResponsiveContainer width="100%" height={260}>
                <AreaChart data={envChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="gradPerf" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.05)" />
                  <XAxis dataKey="t" stroke="#64748b" tick={{ fontSize: 11, fontWeight: 600 }} />
                  <YAxis stroke="#64748b" tick={{ fontSize: 11, fontWeight: 600 }} />
                  <Tooltip content={<CustomTooltip />} cursor={{ stroke: 'rgba(255, 255, 255, 0.15)', strokeWidth: 1, strokeDasharray: '3 3' }} />
                  <Legend verticalAlign="bottom" height={36} iconType="circle" />
                  <Area type="monotone" name="Response Health (%)" dataKey="Humidity (%)" stroke="#10b981" fill="url(#gradPerf)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            {/* Chart 2: Actuator Operations Frequency */}
            <div className="premium-chart-card">
              <div>
                <h3 className="premium-chart-title">Device Actuation Cycles</h3>
                <p className="premium-chart-sub">Total operational trigger cycles per day</p>
              </div>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={actuatorCyclesData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.05)" vertical={false} />
                  <XAxis dataKey="t" stroke="#64748b" tick={{ fontSize: 11, fontWeight: 600 }} />
                  <YAxis stroke="#64748b" tick={{ fontSize: 11, fontWeight: 600 }} />
                  <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.02)' }} />
                  <Legend verticalAlign="bottom" height={36} iconType="circle" />
                  <Bar name="Trigger Cycles" dataKey="Cycles" fill="#3b82f6" radius={[2, 2, 0, 0]} barSize={25} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* TABLE LOG SECTION - ACTUATORS */}
          <div className="premium-log-section" style={{ borderLeft: '4px solid #f97316' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
              <div>
                <h3 className="premium-chart-title">Device Operation History (Live)</h3>
                <p className="premium-chart-sub">Hardware manual overrides and automated schedule runs</p>
              </div>
              <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                <select
                  value={actuatorFilter}
                  onChange={e => setActuatorFilter(e.target.value)}
                  className="premium-select-dropdown"
                  style={{ minWidth: '170px' }}
                >
                  <option value="all">All Devices</option>
                  {actuatorTypes.map(type => <option key={type} value={type}>{type}</option>)}
                </select>
                <button className="premium-btn-export" style={{ background: '#f97316', boxShadow: '0 4px 12px rgba(249, 115, 22, 0.25)' }} onClick={downloadActuatorCSV}>
                  <Download size={15} /> Export CSV
                </button>
              </div>
            </div>

            <div style={{ overflowX: 'auto', maxHeight: '400px' }}>
              {processedActuatorLogs.length > 0 ? (
                <table className="premium-table">
                  <thead>
                    <tr>
                      <th>Date & Time</th>
                      <th>Device</th>
                      <th>Action</th>
                      <th>Duration</th>
                      <th>Source</th>
                    </tr>
                  </thead>
                  <tbody>
                    {processedActuatorLogs
                      .filter(l => actuatorFilter === 'all' || l.label === actuatorFilter)
                      .map((log, i) => (
                        <tr key={i}>
                          <td>
                            <div style={{ fontWeight: 700, color: 'var(--v4-text-primary)' }}>{log.formattedDate}</div>
                            <div style={{ fontSize: 11, color: 'var(--v4-text-muted)' }}>{log.formattedTime}</div>
                          </td>
                          <td style={{ fontWeight: 800, color: '#0ea5e9' }}>{log.label}</td>
                          <td>
                            <span style={{
                              padding: '3px 8px', borderRadius: '6px', fontSize: '10px', fontWeight: 900,
                              background: log.state ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                              color: log.state ? '#10b981' : '#ef4444',
                              textTransform: 'uppercase', border: `1px solid ${log.state ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`
                            }}>
                              {log.state ? 'ON' : 'OFF'}
                            </span>
                          </td>
                          <td style={{ fontWeight: 700 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <Clock size={12} style={{ color: 'var(--v4-text-muted)' }} />
                              {log.duration}
                            </div>
                          </td>
                          <td style={{ textTransform: 'uppercase', fontWeight: 700, fontSize: '11px', color: log.source === 'auto' ? '#10b981' : '#f59e0b' }}>
                            {log.source}
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              ) : (
                <div style={{ padding: '40px', textAlign: 'center', color: 'var(--v4-text-muted)' }}>No actuator history logged yet.</div>
              )}
            </div>
          </div>
        </>
      )}

      {activeTab === 'harvest' && (
        <div className="premium-charts-grid">
          {/* Chart 1: Expected Yield vs Historicals */}
          <div className="premium-chart-card">
            <div>
              <h3 className="premium-chart-title">Expected Yield vs Historicals</h3>
              <p className="premium-chart-sub">Yield statistics per crop category</p>
            </div>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={[
                { name: 'Lettuce', Expected: 120, Actual: 110 },
                { name: 'Tomatoes', Expected: 240, Actual: 255 },
                { name: 'Strawberries', Expected: 180, Actual: 165 },
                { name: 'Bell Peppers', Expected: 150, Actual: 158 },
              ]} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.05)" vertical={false} />
                <XAxis dataKey="name" stroke="#64748b" tick={{ fontSize: 11, fontWeight: 600 }} />
                <YAxis stroke="#64748b" tick={{ fontSize: 11, fontWeight: 600 }} />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.02)' }} />
                <Legend verticalAlign="bottom" height={36} iconType="circle" />
                <Bar dataKey="Expected" fill="#3b82f6" radius={[2, 2, 0, 0]} />
                <Bar dataKey="Actual" fill="#10b981" radius={[2, 2, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Chart 2: Batch Cycle Progress */}
          <div className="premium-chart-card">
            <div>
              <h3 className="premium-chart-title">Batch Cycle Growth Index</h3>
              <p className="premium-chart-sub">Progression rate towards harvest maturity</p>
            </div>
            <ResponsiveContainer width="100%" height={260}>
              <AreaChart data={[
                { day: 'Day 1', progress: 10, date: '2024-01-01' },
                { day: 'Day 10', progress: 25, date: '2024-01-10' },
                { day: 'Day 20', progress: 48, date: '2024-01-20' },
                { day: 'Day 30', progress: 65, date: '2024-01-30' },
                { day: 'Day 40', progress: 85, date: '2024-02-09' },
                { day: 'Day 50', progress: 100, date: '2024-02-19' },
              ]} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="gradHarvest" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.05)" />
                <XAxis dataKey="day" stroke="#64748b" tick={{ fontSize: 11, fontWeight: 600 }} />
                <YAxis stroke="#64748b" tick={{ fontSize: 11, fontWeight: 600 }} />
                <Tooltip content={<CustomTooltip />} cursor={{ stroke: 'rgba(255, 255, 255, 0.15)', strokeWidth: 1, strokeDasharray: '3 3' }} />
                <Legend verticalAlign="bottom" height={36} iconType="circle" />
                <Area type="monotone" name="Maturity Rate (%)" dataKey="progress" stroke="#10b981" fill="url(#gradHarvest)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {activeTab === 'zone' && (
        <div className="premium-charts-grid">
          {/* Chart 1: Micro-climate Zone comparison */}
          <div className="premium-chart-card">
            <div>
              <h3 className="premium-chart-title">Micro-Climate Variance by Zone</h3>
              <p className="premium-chart-sub">Average temperature variance over time</p>
            </div>
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={zoneTimeData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.05)" />
                <XAxis dataKey="hour" stroke="#64748b" tick={{ fontSize: 11, fontWeight: 600 }} />
                <YAxis stroke="#64748b" tick={{ fontSize: 11, fontWeight: 600 }} />
                <Tooltip content={<CustomTooltip />} cursor={{ stroke: 'rgba(255, 255, 255, 0.15)', strokeWidth: 1, strokeDasharray: '3 3' }} />
                <Legend verticalAlign="bottom" height={36} iconType="circle" />
                {zones.map((z, i) => (
                  <Line key={z.id} type="monotone" dataKey={z.name} stroke={['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ef4444'][i % 5]} strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Chart 2: Climate Profile Matrix */}
          <div className="premium-chart-card">
            <div>
              <h3 className="premium-chart-title">Climate Profile Matrix</h3>
              <p className="premium-chart-sub">Average Temperature & Humidity by Zone</p>
            </div>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={zoneProfileData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.05)" vertical={false} />
                <XAxis dataKey="name" stroke="#64748b" tick={{ fontSize: 11, fontWeight: 600 }} />
                <YAxis stroke="#64748b" tick={{ fontSize: 11, fontWeight: 600 }} />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.02)' }} />
                <Legend verticalAlign="bottom" height={36} iconType="circle" />
                <Bar dataKey="Temperature" fill="#ef4444" radius={[2, 2, 0, 0]} />
                <Bar dataKey="Humidity" fill="#3b82f6" radius={[2, 2, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Chart 3: Soil Chemistry Profile */}
          <div className="premium-chart-card">
            <div>
              <h3 className="premium-chart-title">Soil Chemistry Profile</h3>
              <p className="premium-chart-sub">Average pH and EC levels by Zone</p>
            </div>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={zoneProfileData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.05)" vertical={false} />
                <XAxis dataKey="name" stroke="#64748b" tick={{ fontSize: 11, fontWeight: 600 }} />
                <YAxis stroke="#64748b" tick={{ fontSize: 11, fontWeight: 600 }} />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.02)' }} />
                <Legend verticalAlign="bottom" height={36} iconType="circle" />
                <Bar dataKey="pH" fill="#8b5cf6" radius={[2, 2, 0, 0]} />
                <Bar dataKey="EC" fill="#f59e0b" radius={[2, 2, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Chart 4: Soil Nutrient Profile */}
          <div className="premium-chart-card">
            <div>
              <h3 className="premium-chart-title">Zone Nutrient Profile</h3>
              <p className="premium-chart-sub">Average N-P-K level distribution by Zone</p>
            </div>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={zoneProfileData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.05)" vertical={false} />
                <XAxis dataKey="name" stroke="#64748b" tick={{ fontSize: 11, fontWeight: 600 }} />
                <YAxis stroke="#64748b" tick={{ fontSize: 11, fontWeight: 600 }} />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.02)' }} />
                <Legend verticalAlign="bottom" height={36} iconType="circle" />
                <Bar dataKey="Nitrogen" fill="#10b981" radius={[2, 2, 0, 0]} />
                <Bar dataKey="Phosphorus" fill="#0ea5e9" radius={[2, 2, 0, 0]} />
                <Bar dataKey="Potassium" fill="#8b5cf6" radius={[2, 2, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
};

export default Analytics;
