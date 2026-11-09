import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://pfwjphydtnmmipgtgsow.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBmd2pwaHlkdG5tbWlwZ3Rnc293Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUyMTI2NzksImV4cCI6MjA5MDc4ODY3OX0.aoSDhc4FEykfSDH8AitWM4Z38MHJA30Y2euMQOwEAxc';

const supabase = createClient(supabaseUrl, supabaseKey);

const TABLES = [
  'zones',
  'nodes', 
  'sensors',
  'actuators',
  'actuator_schedules',
  'sensor_readings'
];

function formatValue(value, key) {
  if (value === null || value === undefined) return 'NULL';
  if (typeof value === 'object') return JSON.stringify(value);
  if (key.includes('_at') || key.includes('date')) {
    try {
      return new Date(value).toLocaleString();
    } catch { return value; }
  }
  return String(value).substring(0, 50);
}

function printTable(name, data) {
  if (!data || data.length === 0) {
    console.log(`\n📁 ${name.toUpperCase()}: No data`);
    return;
  }
  
  const columns = Object.keys(data[0]);
  const colWidths = {};
  
  columns.forEach(col => {
    colWidths[col] = Math.max(
      col.length,
      ...data.slice(0, 5).map(row => String(row[col] ?? 'NULL').length)
    );
    if (colWidths[col] > 40) colWidths[col] = 40;
  });
  
  console.log(`\n${'═'.repeat(80)}`);
  console.log(`📁 ${name.toUpperCase()} (${data.length} rows)`);
  console.log('═'.repeat(80));
  
  // Header
  console.log('│ ' + columns.map(col => col.padEnd(colWidths[col]).substring(0, colWidths[col])).join(' │ ') + ' │');
  console.log('├─' + columns.map(col => '─'.repeat(colWidths[col])).join('─┼─') + '─┤');
  
  // Data rows (max 10)
  const rows = data.slice(0, 10);
  rows.forEach(row => {
    console.log('│ ' + columns.map(col => formatValue(row[col], col).padEnd(colWidths[col]).substring(0, colWidths[col])).join(' │ ') + ' │');
  });
  
  if (data.length > 10) {
    console.log('│ ' + '...'.repeat(columns.length) + ' │');
    console.log(`  (Showing 10 of ${data.length} rows)`);
  }
}

async function viewAllData() {
  console.log('\n🌿 SANOTA GREENHOUSE DATABASE 🌿');
  console.log('═'.repeat(80));
  console.log(`Timestamp: ${new Date().toLocaleString()}`);
  console.log('═'.repeat(80));
  
  for (const table of TABLES) {
    const { data, error, count } = await supabase
      .from(table)
      .select('*', { count: 'exact' });
    
    if (error) {
      console.log(`\n❌ Error loading ${table}: ${error.message}`);
    } else {
      printTable(table, data);
    }
  }
  
  console.log('\n' + '═'.repeat(80));
}

async function viewTable(tableName) {
  if (!TABLES.includes(tableName)) {
    console.log(`Available tables: ${TABLES.join(', ')}`);
    return;
  }
  
  const { data, error } = await supabase
    .from(tableName)
    .select('*')
    .order('id');
  
  if (error) {
    console.log(`Error: ${error.message}`);
  } else {
    printTable(tableName, data);
  }
}

async function searchData(searchTerm) {
  console.log(`\n🔍 Searching for: "${searchTerm}"`);
  console.log('═'.repeat(80));
  
  for (const table of TABLES) {
    const { data, error } = await supabase
      .from(table)
      .select('*')
      .limit(100);
    
    if (error || !data) continue;
    
    const matches = data.filter(row => 
      Object.values(row).some(val => 
        String(val).toLowerCase().includes(searchTerm.toLowerCase())
      )
    );
    
    if (matches.length > 0) {
      console.log(`\n📁 Found in ${table}:`);
      matches.slice(0, 5).forEach(row => {
        console.log(`   ${JSON.stringify(row).substring(0, 100)}...`);
      });
    }
  }
}

async function getLatestReadings() {
  console.log('\n📊 LATEST SENSOR READINGS 📊');
  console.log('═'.repeat(80));
  
  const { data: sensors } = await supabase.from('sensors').select('*');
  
  for (const sensor of sensors || []) {
    const { data: reading } = await supabase
      .from('sensor_readings')
      .select('*')
      .eq('sensor_id', sensor.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();
    
    if (reading) {
      const timeAgo = Math.round((Date.now() - new Date(reading.created_at).getTime()) / 1000);
      console.log(`  ${sensor.label}: ${reading.value} (${timeAgo}s ago)`);
    }
  }
}

// Main
const args = process.argv.slice(2);
const cmd = args[0] || 'all';

switch(cmd) {
  case 'all':
    viewAllData();
    break;
  case 'table':
    viewTable(args[1] || 'sensors');
    break;
  case 'search':
    searchData(args.slice(1).join(' ') || 'test');
    break;
  case 'latest':
    getLatestReadings();
    break;
  case 'sensors':
    viewTable('sensors');
    break;
  case 'actuators':
    viewTable('actuators');
    break;
  case 'readings':
    viewTable('sensor_readings');
    break;
  case 'schedules':
    viewTable('actuator_schedules');
    break;
  default:
    console.log(`
╔════════════════════════════════════════════════════╗
║      Sanota Greenhouse Database Viewer              ║
╠════════════════════════════════════════════════════╣
║  node dbview.mjs all       - View all tables       ║
║  node dbview.mjs latest    - Latest sensor data    ║
║  node dbview.mjs sensors   - View sensors table    ║
║  node dbview.mjs actuators - View actuators table  ║
║  node dbview.mjs readings  - View sensor readings  ║
║  node dbview.mjs schedules - View schedules table  ║
║  node dbview.mjs search    - Search all data       ║
╚════════════════════════════════════════════════════╝
    `);
}
