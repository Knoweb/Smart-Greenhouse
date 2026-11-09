import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://pfwjphydtnmmipgtgsow.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBmd2pwaHlkdG5tbWlwZ3Rnc293Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUyMTI2NzksImV4cCI6MjA5MDc4ODY3OX0.aoSDhc4FEykfSDH8AitWM4Z38MHJA30Y2euMQOwEAxc';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkDB() {
  console.log("Checking Actuators...");
  const { data: actuators, error: actError } = await supabase.from('actuators').select('id, label, actuator_type, control_mode');
  if (actError) console.error("Actuators Error:", actError);
  else console.log("Actuators:", actuators);

  console.log("\nChecking Schedules...");
  const { data: schedules, error: schError } = await supabase.from('actuator_schedules').select('*');
  if (schError) console.error("Schedules Error:", schError);
  else console.log("Schedules:", schedules);
}

checkDB();
