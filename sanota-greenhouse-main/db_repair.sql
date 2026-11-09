-- Repair Zones and Nodes Mapping
-- Ensure we have the zones used in ESP32 code
INSERT INTO public.zones (name) 
VALUES ('Greenhouse Zone A'), ('Main House') 
ON CONFLICT (name) DO NOTHING;

-- Map the ESP32 Nodes to the correct Zone so Filtering works
UPDATE public.nodes 
SET zone_id = (SELECT id FROM public.zones WHERE name = 'Greenhouse Zone A' LIMIT 1)
WHERE id IN ('SUB_ESP_02', 'SUB_ESP_01');

UPDATE public.nodes 
SET zone_id = (SELECT id FROM public.zones WHERE name = 'Main House' LIMIT 1)
WHERE id = 'TEST_ESP32';

-- Fix Sensor Units and Labels
UPDATE public.sensors SET label = 'Temperature (Inside)', unit = '°C' WHERE sensor_type IN ('temp_inside', 'temp');
UPDATE public.sensors SET label = 'Temperature (Outside)', unit = '°C' WHERE sensor_type = 'temp_outside';
UPDATE public.sensors SET label = 'Humidity (Inside)', unit = '%' WHERE sensor_type IN ('hum_inside', 'hum');
UPDATE public.sensors SET label = 'Humidity (Outside)', unit = '%' WHERE sensor_type = 'hum_outside';
UPDATE public.sensors SET label = 'CO2 Level', unit = 'ppm' WHERE sensor_type = 'co2';
UPDATE public.sensors SET label = 'Light Intensity', unit = 'µmol' WHERE sensor_type = 'light';
UPDATE public.sensors SET label = 'Soil Moisture', unit = '%' WHERE sensor_type = 'soil_moisture';
UPDATE public.sensors SET label = 'EC Level', unit = 'mS/cm' WHERE sensor_type IN ('ec', 'ec_level');
UPDATE public.sensors SET label = 'pH Level', unit = 'pH' WHERE sensor_type = 'ph_level';
UPDATE public.sensors SET label = 'Nitrogen (N)', unit = '%' WHERE sensor_type = 'npk_n';
UPDATE public.sensors SET label = 'Phosphorus (P)', unit = '%' WHERE sensor_type = 'npk_p';
UPDATE public.sensors SET label = 'Potassium (K)', unit = '%' WHERE sensor_type = 'npk_k';
UPDATE public.sensors SET label = 'Water Tank', unit = '%' WHERE sensor_type = 'water_level';
UPDATE public.sensors SET label = 'Fertilizer Tank', unit = '%' WHERE sensor_type = 'fert_level';

-- Refresh the stats
ANALYZE public.sensors;
ANALYZE public.nodes;
ANALYZE public.sensor_readings;
