/**
 * Send All Sensor Data to Supabase
 * Input: JSON response with sensor readings
 * Output: All data saved to database
 */

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://pfwjphydtnmmipgtgsow.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBmd2pwaHlkdG5tbWlwZ3Rnc293Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUyMTI2NzksImV4cCI6MjA5MDc4ODY3OX0.aoSDhc4FEykfSDH8AitWM4Z38MHJA30Y2euMQOwEAxc'
);

// Sensor type to ID mapping (from database)
const SENSOR_MAP = {
  'temp_inside':   '6b9f806e-1a12-48df-8cd8-38681d021edb',
  'hum_inside':    '83a32b1a-8d62-4366-82e7-eaddbc52dd65',
  'water_level':   'b5b57020-face-4fbf-ad1a-068b8ba3285e',
  'rain_gauge':    '6a9705ad-ad84-41c6-9f98-a02c32c33964',
  'hum_outside':   '03dd5b15-73a4-424d-a9ec-be295d174b0c',
  'co2':           '382a6938-2961-4e07-ae4a-9872206007dd',
  'temp_outside':  '96045f3b-d6d3-41cf-bea2-ebc2ad3802f2',
  'soil_moisture': 'a06393cf-6bc9-4069-b68c-b6acbe937bee',
  'ph_level':      '0d25f235-4f32-4dd5-80f5-0ebd79c5ba90',
  'ec_level':      '1374dcb2-47e4-43f0-b459-d1e33ce7b612',
  'npk_n':         '1374dcb2-47e4-43f0-b459-d1e33ce7b612',
  'npk_p':         '1374dcb2-47e4-43f0-b459-d1e33ce7b612',
  'npk_k':         '1374dcb2-47e4-43f0-b459-d1e33ce7b612',
  'fert_level':    'b5b57020-face-4fbf-ad1a-068b8ba3285e',
  'light':         '382a6938-2961-4e07-ae4a-9872206007dd',
  'rain_status':   '6a9705ad-ad84-41c6-9f98-a02c32c33964',
  'temp':          '6b9f806e-1a12-48df-8cd8-38681d021edb',
  'hum':           '83a32b1a-8d62-4366-82e7-eaddbc52dd65',
  'ec':            '1374dcb2-47e4-43f0-b459-d1e33ce7b612',
  'rain':          '6a9705ad-ad84-41c6-9f98-a02c32c33964',
};

const NODE_ID = 'SUB_ESP_03';

/**
 * Send single sensor reading to database
 */
async function sendSingleReading(sensorType, value) {
  const sensorId = SENSOR_MAP[sensorType];
  
  if (!sensorId) {
    console.log(`  ⚠ Unknown sensor: ${sensorType}`);
    return false;
  }

  const { error } = await supabase.rpc('log_sensor_data', {
    p_node_id: NODE_ID,
    p_sensor_type: sensorType,
    p_value: value
  });

  if (error) {
    console.log(`  ✗ ${sensorType}: ${error.message}`);
    return false;
  }
  
  console.log(`  ✓ ${sensorType}: ${value}`);
  return true;
}

/**
 * Send all data from a response object
 * Automatically detects all sensor values
 */
async function sendAllData(data, nodeId = NODE_ID) {
  console.log('\n📡 Processing sensor data...\n');
  
  let count = 0;
  let success = 0;
  
  // Handle different data formats
  const sensorEntries = [];
  
  if (typeof data === 'object' && !Array.isArray(data)) {
    // Object format: { temp_inside: 25.5, hum_inside: 70, ... }
    for (const [key, value] of Object.entries(data)) {
      if (typeof value === 'number' && !isNaN(value)) {
        sensorEntries.push({ type: key, value });
      }
    }
  } else if (Array.isArray(data)) {
    // Array format: [{ type: 'temp', value: 25 }, ...]
    for (const item of data) {
      if (item.type && item.value !== undefined) {
        sensorEntries.push({ type: item.type, value: item.value });
      } else if (item.sensor_type && item.value !== undefined) {
        sensorEntries.push({ type: item.sensor_type, value: item.value });
      }
    }
  }
  
  // Send each sensor reading
  for (const { type, value } of sensorEntries) {
    count++;
    const result = await sendSingleReading(type, value);
    if (result) success++;
  }
  
  console.log(`\n✅ Sent ${success}/${count} readings to database!`);
  return { count, success };
}

/**
 * ESP32 Response Format - Parse and send
 */
async function sendESP32Response(responseData, nodeId = NODE_ID) {
  // Handle ESP32 common response formats
  
  // Format 1: { readings: { temp: 25, hum: 70 } }
  if (responseData.readings) {
    return sendAllData(responseData.readings, nodeId);
  }
  
  // Format 2: { sensors: [{ type: 'temp', value: 25 }] }
  if (responseData.sensors) {
    return sendAllData(responseData.sensors, nodeId);
  }
  
  // Format 3: Flat object { temp: 25, hum: 70, ... }
  if (typeof responseData === 'object') {
    return sendAllData(responseData, nodeId);
  }
  
  console.log('Unknown data format!');
  return { count: 0, success: 0 };
}

// =============================================
// MAIN - Example Usage
// =============================================

async function main() {
  console.log('╔════════════════════════════════════════════╗');
  console.log('║   ESP32 Data Receiver & Database Sender   ║');
  console.log('╚════════════════════════════════════════════╝\n');
  
  // Example 1: Direct object data
  const exampleData1 = {
    temp_inside: 27.5,
    hum_inside: 72,
    water_level: 78,
    soil_moisture: 55,
    co2: 520,
    light: 850,
    ph_level: 6.8,
    ec_level: 1.6
  };
  
  // Example 2: Array format
  const exampleData2 = [
    { type: 'temp_inside', value: 28.0 },
    { type: 'hum_inside', value: 68 },
    { type: 'water_level', value: 75 },
  ];
  
  // Example 3: ESP32 typical response
  const esp32Response = {
    node_id: 'SUB_ESP_03',
    timestamp: new Date().toISOString(),
    readings: {
      temp_inside: 26.5,
      hum_inside: 74,
      water_level: 80,
      soil_moisture: 50,
      co2: 480,
      light: 920,
      ph_level: 7.0,
      ec_level: 1.8,
      temp_outside: 32.0,
      hum_outside: 65,
      rain_gauge: 0.0
    }
  };
  
  // Uncomment to use:
  
  // Option 1: Direct data object
  // await sendAllData(exampleData1);
  
  // Option 2: Array format
  // await sendAllData(exampleData2);
  
  // Option 3: ESP32 response
  await sendESP32Response(esp32Response);
  
  // Option 4: Your custom data
  // const yourData = { ... }; // Your ESP32 response
  // await sendAllData(yourData);
  
  console.log('\n🏁 Done!');
}

// Run
main();
