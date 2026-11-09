"""
Python Script - Send Sensor Data to Supabase
Run: python send_sensor_data.py
"""

import requests
import time
import random
from datetime import datetime

SUPABASE_URL = "https://pfwjphydtnmmipgtgsow.supabase.co"
SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBmd2pwaHlkdG5tbWlwZ3Rnc293Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUyMTI2NzksImV4cCI6MjA5MDc4ODY3OX0.aoSDhc4FEykfSDH8AitWM4Z38MHJA30Y2euMQOwEAxc"

HEADERS = {
    "Content-Type": "application/json",
    "apikey": SUPABASE_KEY,
    "Authorization": f"Bearer {SUPABASE_KEY}",
    "Prefer": "return=representation"
}

# Sensor IDs
SENSORS = {
    "temp_inside": "6b9f806e-1a12-48df-8cd8-38681d021edb",
    "hum_inside": "83a32b1a-8d62-4366-82e7-eaddbc52dd65",
    "water_level": "b5b57020-face-4fbf-ad1a-068b8ba3285e",
    "rain_gauge": "6a9705ad-ad84-41c6-9f98-a02c32c33964",
    "hum_outside": "03dd5b15-73a4-424d-a9ec-be295d174b0c",
    "co2": "382a6938-2961-4e07-ae4a-9872206007dd",
    "temp_outside": "96045f3b-d6d3-41cf-bea2-ebc2ad3802f2",
    "soil_moisture": "a06393cf-6bc9-4069-b68c-b6acbe937bee",
    "ph_level": "0d25f235-4f32-4dd5-80f5-0ebd79c5ba90",
    "ec_level": "1374dcb2-47e4-43f0-b459-d1e33ce7b612",
    "npk_n": "1374dcb2-47e4-43f0-b459-d1e33ce7b612",
    "npk_p": "1374dcb2-47e4-43f0-b459-d1e33ce7b612",
    "npk_k": "1374dcb2-47e4-43f0-b459-d1e33ce7b612",
    "fert_level": "b5b57020-face-4fbf-ad1a-068b8ba3285e",
    "light": "382a6938-2961-4e07-ae4a-9872206007dd",
    "rain_status": "6a9705ad-ad84-41c6-9f98-a02c32c33964",
}

def send_single_reading(sensor_id, value):
    """Send single sensor reading"""
    url = f"{SUPABASE_URL}/rest/v1/sensor_readings"
    
    data = {
        "sensor_id": sensor_id,
        "value": value
    }
    
    try:
        response = requests.post(url, headers=HEADERS, json=data)
        
        if response.status_code in [200, 201]:
            print(f"  ✓ {sensor_id[:8]}... = {value}")
            return True
        else:
            print(f"  ✗ Error {response.status_code}: {response.text[:100]}")
            return False
    except Exception as e:
        print(f"  ✗ Exception: {e}")
        return False

def send_bulk_readings(readings):
    """Send multiple readings at once"""
    url = f"{SUPABASE_URL}/rest/v1/sensor_readings"
    
    try:
        response = requests.post(url, headers=HEADERS, json=readings)
        
        if response.status_code in [200, 201]:
            print(f"  ✓ Sent {len(readings)} readings!")
            return True
        else:
            print(f"  ✗ Error: {response.status_code}")
            return False
    except Exception as e:
        print(f"  ✗ Exception: {e}")
        return False

def generate_fake_sensor_data():
    """Generate fake sensor values for testing"""
    return {
        "temp_inside": round(random.uniform(24.0, 30.0), 1),
        "hum_inside": round(random.uniform(60.0, 85.0), 1),
        "water_level": round(random.uniform(50.0, 90.0), 1),
        "rain_gauge": round(random.uniform(0.0, 5.0), 2),
        "hum_outside": round(random.uniform(55.0, 75.0), 1),
        "co2": round(random.uniform(400.0, 800.0), 0),
        "temp_outside": round(random.uniform(25.0, 35.0), 1),
        "soil_moisture": round(random.uniform(30.0, 60.0), 1),
        "ph_level": round(random.uniform(6.0, 7.5), 1),
        "ec_level": round(random.uniform(1.0, 2.5), 2),
        "npk_n": round(random.uniform(50.0, 80.0), 1),
        "npk_p": round(random.uniform(30.0, 60.0), 1),
        "npk_k": round(random.uniform(60.0, 90.0), 1),
        "fert_level": round(random.uniform(20.0, 50.0), 1),
        "light": round(random.uniform(500.0, 1200.0), 0),
        "rain_status": 0,
    }

def main():
    print("╔════════════════════════════════════════════╗")
    print("║   ESP32 Sensor Data Simulator             ║")
    print("╚════════════════════════════════════════════╝")
    print(f"Connected to: {SUPABASE_URL}")
    print(f"Time: {datetime.now()}")
    print()
    
    mode = input("Mode: (1) Single reading  (2) Bulk readings  (3) Auto loop: ")
    
    if mode == "1":
        # Send single reading for each sensor
        sensor_name = input("Enter sensor name (e.g., temp_inside): ")
        if sensor_name in SENSORS:
            value = float(input("Enter value: "))
            send_single_reading(SENSORS[sensor_name], value)
        else:
            print("Sensor not found!")
    
    elif mode == "2":
        # Generate fake data
        data = generate_fake_sensor_data()
        readings = []
        
        for name, value in data.items():
            if name in SENSORS:
                readings.append({
                    "sensor_id": SENSORS[name],
                    "value": value
                })
        
        print(f"\nSending {len(readings)} readings...")
        send_bulk_readings(readings)
    
    elif mode == "3":
        # Auto loop every 5 seconds
        interval = int(input("Interval (seconds): ") or "5")
        
        print(f"\nAuto mode started (every {interval}s, Ctrl+C to stop)")
        print("-" * 50)
        
        count = 0
        while True:
            count += 1
            print(f"\n[{count}] {datetime.now().strftime('%H:%M:%S')}")
            
            data = generate_fake_sensor_data()
            readings = []
            
            for name, value in data.items():
                if name in SENSORS:
                    readings.append({
                        "sensor_id": SENSORS[name],
                        "value": value
                    })
            
            send_bulk_readings(readings)
            time.sleep(interval)
    
    else:
        print("Invalid mode!")

if __name__ == "__main__":
    main()
