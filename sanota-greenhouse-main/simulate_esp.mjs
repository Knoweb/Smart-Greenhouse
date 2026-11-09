import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://pfwjphydtnmmipgtgsow.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBmd2pwaHlkdG5tbWlwZ3Rnc293Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUyMTI2NzksImV4cCI6MjA5MDc4ODY3OX0.aoSDhc4FEykfSDH8AitWM4Z38MHJA30Y2euMQOwEAxc'
);

const NODE_ID = 'SUB_ESP_03';

function random(min, max) {
  return Math.random() * (max - min) + min;
}

async function sendDummyData() {
  console.log('\n📡 Sending dummy sensor data...');
  
  const sensors = [
    { type: 'temp_inside', value: parseFloat(random(25, 32).toFixed(1)) },
    { type: 'hum_inside', value: parseFloat(random(60, 85).toFixed(1)) },
    { type: 'water_level', value: parseFloat(random(50, 90).toFixed(1)) },
    { type: 'soil_moisture', value: parseFloat(random(30, 70).toFixed(1)) },
    { type: 'co2', value: Math.round(random(400, 800)) },
    { type: 'light', value: Math.round(random(500, 1200)) },
    { type: 'ph_level', value: parseFloat(random(6.0, 8.0).toFixed(1)) },
    { type: 'ec_level', value: parseFloat(random(1.0, 3.0).toFixed(2)) },
    { type: 'temp_outside', value: parseFloat(random(25, 36).toFixed(1)) },
    { type: 'hum_outside', value: parseFloat(random(50, 80).toFixed(1)) },
    { type: 'rain_gauge', value: parseFloat(random(0, 2).toFixed(2)) },
  ];

  for (const s of sensors) {
    const { error } = await supabase.rpc('log_sensor_data', {
      p_node_id: NODE_ID,
      p_sensor_type: s.type,
      p_value: s.value
    });
    
    if (error) {
      console.log(`  ✗ ${s.type}: ${error.message}`);
    } else {
      console.log(`  ✓ ${s.type}: ${s.value}`);
    }
  }
  
  console.log('✅ Done!\n');
}

async function main() {
  console.log('╔════════════════════════════════════════════╗');
  console.log('║   ESP32 Dummy Data Simulator              ║');
  console.log('╚════════════════════════════════════════════╝');
  
  const count = parseInt(process.argv[2]) || 1;
  const interval = parseInt(process.argv[3]) || 10;
  
  for (let i = 0; i < count; i++) {
    if (i > 0) {
      console.log(`Waiting ${interval}s...`);
      await new Promise(r => setTimeout(r, interval * 1000));
    }
    console.log(`\n[${i + 1}/${count}]`);
    await sendDummyData();
  }
  
  console.log('🏁 All done!');
}

main();
