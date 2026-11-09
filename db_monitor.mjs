import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://pfwjphydtnmmipgtgsow.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBmd2pwaHlkdG5tbWlwZ3Rnc293Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUyMTI2NzksImV4cCI6MjA5MDc4ODY3OX0.aoSDhc4FEykfSDH8AitWM4Z38MHJA30Y2euMQOwEAxc'
);

// Sensor names mapping
const SENSOR_NAMES = {
  '6b9f806e-1a12-48df-8cd8-38681d021edb': '🌡️ Temp Inside',
  '83a32b1a-8d62-4366-82e7-eaddbc52dd65': '💧 Hum Inside',
  'b5b57020-face-4fbf-ad1a-068b8ba3285e': '🛢️ Water Level',
  'a06393cf-6bc9-4069-b68c-b6acbe937bee': '🌱 Soil Moisture',
  '382a6938-2961-4e07-ae4a-9872206007dd': '💨 CO2',
  '0d25f235-4f32-4dd5-80f5-0ebd79c5ba90': '⚗️ pH Level',
  '1374dcb2-47e4-43f0-b459-d1e33ce7b612': '🔋 EC Level',
  '96045f3b-d6d3-41cf-bea2-ebc2ad3802f2': '🌡️ Temp Outside',
  '03dd5b15-73a4-424d-a9ec-be295d174b0c': '💧 Hum Outside',
  '6a9705ad-ad84-41c6-9f98-a02c32c33964': '🌧️ Rain Gauge',
};

let lastReadings = {};
let totalSent = 0;

// Send all sensors with capture
async function sendWithCapture() {
  const sensors = {
    temp_inside:   { value: 25.0 + Math.random() * 5, unit: '°C' },
    hum_inside:    { value: 60 + Math.random() * 20, unit: '%' },
    water_level:   { value: 70 + Math.random() * 15, unit: '%' },
    soil_moisture: { value: 40 + Math.random() * 30, unit: '%' },
    co2:           { value: 400 + Math.random() * 300, unit: 'ppm' },
    light:         { value: 600 + Math.random() * 500, unit: 'µmol' },
    ph_level:      { value: 6.0 + Math.random() * 2, unit: 'pH' },
    ec_level:      { value: 1.0 + Math.random() * 1.5, unit: 'mS' },
    temp_outside:  { value: 28 + Math.random() * 6, unit: '°C' },
    hum_outside:   { value: 50 + Math.random() * 30, unit: '%' },
    rain_gauge:    { value: Math.random() * 3, unit: 'mm' },
  };

  console.clear();
  console.log('\n╔══════════════════════════════════════════════════════════════╗');
  console.log('║         📡 DATABASE DATA MONITOR - LIVE CAPTURE            ║');
  console.log('╚══════════════════════════════════════════════════════════════╝');
  console.log(`\n⏰ ${new Date().toLocaleTimeString()}`);
  console.log(`📊 Total sent so far: ${totalSent} readings\n`);
  
  console.log('┌──────────────────────────────────────────────────────────────┐');
  console.log('│  SENSOR          │  OLD VALUE   │  NEW VALUE   │  CHANGE  │');
  console.log('├──────────────────────────────────────────────────────────────┤');
  
  for (const [type, data] of Object.entries(sensors)) {
    const roundedValue = parseFloat(data.value.toFixed(2));
    
    await supabase.rpc('log_sensor_data', {
      p_node_id: 'SUB_ESP_03',
      p_sensor_type: type,
      p_value: roundedValue
    });
    
    const oldVal = lastReadings[type] ?? '-';
    const change = lastReadings[type] !== undefined 
      ? (roundedValue > lastReadings[type] ? '▲' : roundedValue < lastReadings[type] ? '▼' : '─')
      : '●';
    
    const displayOld = typeof oldVal === 'number' ? oldVal.toFixed(2) : oldVal;
    const displayNew = roundedValue.toFixed(2);
    
    console.log(`│ ${type.padEnd(16)} │ ${String(displayOld).padStart(11)} │ ${displayNew.padStart(11)} │    ${change}     │`);
    
    lastReadings[type] = roundedValue;
    totalSent++;
  }
  
  console.log('└──────────────────────────────────────────────────────────────┘');
  
  // Show latest readings
  console.log('\n📋 Current Sensor Values:');
  for (const [type, val] of Object.entries(lastReadings)) {
    const unit = sensors[type]?.unit || '';
    console.log(`   ${type.padEnd(16)}: ${val.toFixed(2)} ${unit}`);
  }
}

// Continuous monitoring
async function monitor(interval = 5, duration = 60) {
  console.log(`\n🔄 Monitoring started...`);
  console.log(`   Interval: ${interval}s | Duration: ${duration}s\n`);
  console.log('Press Ctrl+C to stop\n');
  
  const rounds = Math.ceil(duration / interval);
  
  for (let i = 0; i < rounds; i++) {
    await sendWithCapture();
    if (i < rounds - 1) {
      console.log(`\n⏳ Next update in ${interval}s... (${i + 2}/${rounds})`);
      await new Promise(r => setTimeout(r, interval * 1000));
    }
  }
  
  console.log('\n🏁 Monitoring complete!');
  console.log(`📊 Total readings sent: ${totalSent}`);
}

// View recent database entries
async function viewRecent(count = 20) {
  console.log(`\n📜 Last ${count} database entries:\n`);
  
  const { data, error } = await supabase
    .from('sensor_readings')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(count);
  
  if (error) {
    console.log('Error:', error.message);
    return;
  }
  
  console.log('┌────┬──────────────────────────────────┬──────────┬────────────────────────────┐');
  console.log('│ ID │ SENSOR_ID                        │ VALUE    │ TIME                       │');
  console.log('├────┼──────────────────────────────────┼──────────┼────────────────────────────┤');
  
  data?.forEach(r => {
    const sensorName = SENSOR_NAMES[r.sensor_id] || r.sensor_id.substring(0, 8);
    const time = new Date(r.created_at).toLocaleTimeString();
    console.log(`│${String(r.id).padStart(4)}│${sensorName.padStart(34)}│${String(r.value).padStart(8)}│${time.padStart(26)}│`);
  });
  
  console.log('└────┴──────────────────────────────────┴──────────┴────────────────────────────┘');
}

// View by sensor type
async function viewBySensor(sensorType = 'temp_inside') {
  const { data: sensors } = await supabase
    .from('sensors')
    .select('id, label')
    .eq('sensor_type', sensorType);
  
  if (!sensors || sensors.length === 0) {
    console.log(`No sensor found: ${sensorType}`);
    return;
  }
  
  const sensorId = sensors[0].id;
  
  console.log(`\n📈 History for ${sensors[0].label}:\n`);
  
  const { data } = await supabase
    .from('sensor_readings')
    .select('*')
    .eq('sensor_id', sensorId)
    .order('created_at', { ascending: false })
    .limit(20);
  
  data?.forEach(r => {
    const time = new Date(r.created_at).toLocaleString();
    console.log(`   ${time}  →  ${r.value}`);
  });
}

// Main
const args = process.argv.slice(2);
const cmd = args[0] || 'help';

switch(cmd) {
  case 'send':
    sendWithCapture();
    break;
  case 'monitor':
    monitor(parseInt(args[1]) || 5, parseInt(args[2]) || 60);
    break;
  case 'recent':
    viewRecent(parseInt(args[1]) || 20);
    break;
  case 'history':
    viewBySensor(args[1] || 'temp_inside');
    break;
  case 'all':
    monitor(5, 30);
    break;
  default:
    console.log(`
╔════════════════════════════════════════════════════════════╗
║         📡 DATABASE DATA MONITOR                           ║
╠════════════════════════════════════════════════════════════╣
║  node db_monitor.mjs send      - Send & show one capture   ║
║  node db_monitor.mjs monitor   - Continuous monitor (5s)   ║
║  node db_monitor.mjs recent    - View recent DB entries    ║
║  node db_monitor.mjs history   - View sensor history       ║
║  node db_monitor.mjs all       - Monitor for 30 seconds    ║
╚════════════════════════════════════════════════════════════╝
    `);
}
