import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://pfwjphydtnmmipgtgsow.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBmd2pwaHlkdG5tbWlwZ3Rnc293Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUyMTI2NzksImV4cCI6MjA5MDc4ODY3OX0.aoSDhc4FEykfSDH8AitWM4Z38MHJA30Y2euMQOwEAxc';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkSensors() {
  console.log("Checking Sensors...");
  const { data: sensors, error: sensorError } = await supabase.from('sensors').select('id, label, sensor_type, node_id');
  if (sensorError) {
    console.error("Sensors Error:", sensorError);
    return;
  }
  
  console.log("Sensors found:", sensors.length);
  sensors.forEach(s => {
    console.log(`- [${s.sensor_type}] ${s.label} (ID: ${s.id})`);
  });

  console.log("\nChecking Latest Readings...");
  const { data: readings, error: readError } = await supabase
    .from('sensor_readings')
    .select('sensor_id, value, created_at')
    .order('created_at', { ascending: false })
    .limit(20);

  if (readError) {
    console.error("Readings Error:", readError);
    return;
  }

  readings.forEach(r => {
    const sensor = sensors.find(s => s.id === r.sensor_id);
    const type = sensor ? sensor.sensor_type : 'unknown';
    console.log(`- ${type}: ${r.value} at ${r.created_at}`);
  });
}

checkSensors();
