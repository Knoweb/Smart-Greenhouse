import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://pfwjphydtnmmipgtgsow.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBmd2pwaHlkdG5tbWlwZ3Rnc293Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUyMTI2NzksImV4cCI6MjA5MDc4ODY3OX0.aoSDhc4FEykfSDH8AitWM4Z38MHJA30Y2euMQOwEAxc'
);

// Bulk send ALL sensors in ONE RPC call
async function sendAllSensorsBulk() {
  const sensors = {
    temp_inside:   28.5 + Math.random() * 2,
    hum_inside:    65 + Math.random() * 10,
    water_level:   75 + Math.random() * 10,
    soil_moisture: 50 + Math.random() * 15,
    co2:           450 + Math.random() * 100,
    light:         800 + Math.random() * 200,
    ph_level:      6.5 + Math.random() * 1,
    ec_level:      1.4 + Math.random() * 0.4,
    temp_outside:  30 + Math.random() * 3,
    hum_outside:   55 + Math.random() * 15,
    rain_gauge:    Math.random() * 2,
  };

  console.log('\n📡 Sending all sensors in ONE request...');
  console.log(JSON.stringify(sensors, null, 2));

  // Call the RPC function with all data
  const { data, error } = await supabase.rpc('log_all_sensors', {
    p_data: sensors
  });

  if (error) {
    console.log('\n❌ RPC Error:', error.message);
    
    // Fallback: Send each sensor individually
    console.log('\n📡 Trying individual sends...');
    for (const [type, value] of Object.entries(sensors)) {
      await supabase.rpc('log_sensor_data', {
        p_node_id: 'SUB_ESP_03',
        p_sensor_type: type,
        p_value: value
      });
    }
    console.log('✅ All sensors sent individually!');
  } else {
    console.log('\n✅ All', data, 'sensors sent in ONE request!');
  }
}

// Loop mode
async function loopMode(interval = 10, count = 10) {
  console.log(`\n🔄 Loop mode: ${count} rounds, every ${interval}s\n`);
  
  for (let i = 0; i < count; i++) {
    console.log(`\n=== Round ${i + 1}/${count} ===`);
    await sendAllSensorsBulk();
    if (i < count - 1) await new Promise(r => setTimeout(r, interval * 1000));
  }
  
  console.log('\n🏁 Done!');
}

const args = process.argv.slice(2);
const mode = args[0] || 'single';

if (mode === 'loop') {
  loopMode(parseInt(args[1]) || 10, parseInt(args[2]) || 10);
} else {
  sendAllSensorsBulk();
}
