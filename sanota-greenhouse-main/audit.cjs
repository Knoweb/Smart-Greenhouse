const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://pfwjphydtnmmipgtgsow.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBmd2pwaHlkdG5tbWlwZ3Rnc293Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUyMTI2NzksImV4cCI6MjA5MDc4ODY3OX0.aoSDhc4FEykfSDH8AitWM4Z38MHJA30Y2euMQOwEAxc';

const supabase = createClient(supabaseUrl, supabaseKey);

async function viewAuditLogs(limit = 20) {
  console.log('\n📋 Recent Database Changes (Audit Log):\n');
  
  const { data, error } = await supabase
    .from('audit_log')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit);
  
  if (error) {
    console.error('Error:', error);
    return;
  }
  
  if (data.length === 0) {
    console.log('No audit logs yet. Make some changes to see them here!');
    return;
  }
  
  data.forEach(log => {
    const time = new Date(log.created_at).toLocaleString();
    const actionEmoji = log.action === 'INSERT' ? '➕' : 
                         log.action === 'UPDATE' ? '✏️' : '🗑️';
    
    console.log(`${actionEmoji} [${log.action}] ${log.table_name} - ${time}`);
    console.log(`   Record ID: ${log.record_id}`);
    if (log.old_data) console.log(`   OLD: ${JSON.stringify(log.old_data)}`);
    if (log.new_data) console.log(`   NEW: ${JSON.stringify(log.new_data)}`);
    console.log('---');
  });
}

async function viewSnapshots() {
  console.log('\n💾 Data Snapshots:\n');
  
  const { data, error } = await supabase
    .from('data_snapshots')
    .select('id, snapshot_date, snapshot_time')
    .order('snapshot_date', { ascending: false });
  
  if (error) {
    console.error('Error:', error);
    return;
  }
  
  if (data.length === 0) {
    console.log('No snapshots yet.');
    return;
  }
  
  data.forEach(snap => {
    console.log(`📅 ${snap.snapshot_date} at ${new Date(snap.snapshot_time).toLocaleString()}`);
  });
}

async function createSnapshot() {
  console.log('\n📸 Creating snapshot...');
  
  const { data, error } = await supabase.rpc('create_daily_snapshot');
  
  if (error) {
    console.error('Error creating snapshot:', error);
    return;
  }
  
  console.log('✅ Snapshot created successfully!');
  viewSnapshots();
}

async function getDataSummary() {
  console.log('\n📊 Current Database Summary:\n');
  
  const tables = ['sensors', 'actuators', 'actuator_schedules', 'nodes', 'zones', 'sensor_readings'];
  
  for (const table of tables) {
    const { count, error } = await supabase
      .from(table)
      .select('*', { count: 'exact', head: true });
    
    if (!error) {
      console.log(`   ${table}: ${count} records`);
    }
  }
}

// Main menu
const args = process.argv[2] || 'menu';

switch(args) {
  case 'logs':
    viewAuditLogs();
    break;
  case 'logs30':
    viewAuditLogs(30);
    break;
  case 'snapshots':
    viewSnapshots();
    break;
  case 'snapshot':
    createSnapshot();
    break;
  case 'summary':
    getDataSummary();
    break;
  case 'all':
    getDataSummary();
    viewAuditLogs();
    viewSnapshots();
    break;
  default:
    console.log(`
╔════════════════════════════════════════════════════╗
║         Database Audit System                      ║
╠════════════════════════════════════════════════════╣
║  node audit.js logs       - View recent changes    ║
║  node audit.js logs30     - View 30 changes        ║
║  node audit.js snapshots  - View snapshots         ║
║  node audit.js snapshot   - Create new snapshot    ║
║  node audit.js summary    - Database summary       ║
║  node audit.js all        - View everything        ║
╚════════════════════════════════════════════════════╝
    `);
}

module.exports = { viewAuditLogs, viewSnapshots, createSnapshot, getDataSummary };
