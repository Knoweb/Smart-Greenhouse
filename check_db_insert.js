import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://pfwjphydtnmmipgtgsow.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBmd2pwaHlkdG5tbWlwZ3Rnc293Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUyMTI2NzksImV4cCI6MjA5MDc4ODY3OX0.aoSDhc4FEykfSDH8AitWM4Z38MHJA30Y2euMQOwEAxc';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkDB() {
  console.log("Checking Actuators...");
  const { data: actuators, error: actError } = await supabase.from('actuators').select('id, label, actuator_type, control_mode');
  if (actError) console.error("Actuators Error:", actError);
  else console.log("Actuators count:", actuators.length);

  console.log("\nAttempting to INSERT into actuator_schedules...");
  if (actuators && actuators.length > 0) {
    const { data, error } = await supabase.from('actuator_schedules').insert([
      { actuator_id: actuators[0].id, start_time: '12:00:00', duration_minutes: 10, is_active: true }
    ]).select();
    
    if (error) {
      console.error("INSERT FAILED (Probably RLS):", error.message);
    } else {
      console.log("INSERT SUCCESSFUL!", data);
      
      // Clean up
      await supabase.from('actuator_schedules').delete().eq('id', data[0].id);
    }
  }
}

checkDB();
