-- ============================================
-- BULK SENSOR DATA LOGGING FUNCTION (NEW)
-- Matches ESP32 log_sensor_data_bulk call
-- ============================================

CREATE OR REPLACE FUNCTION public.log_sensor_data_bulk(
  p_node_id TEXT,
  p_node_type TEXT,
  p_zone_name TEXT,
  p_bulk_data JSONB
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_count INTEGER := 0;
  v_results JSONB := '[]'::JSONB;
  v_sensor_type TEXT;
  v_value FLOAT;
  v_sensor_id UUID;
BEGIN
  -- Loop through each key in the JSON object
  FOR v_sensor_type, v_value IN
    SELECT key, value::FLOAT
    FROM jsonb_each_text(p_bulk_data)
  LOOP
    -- Find sensor ID by type
    SELECT s.id INTO v_sensor_id
    FROM public.sensors s
    WHERE s.sensor_type = v_sensor_type
    LIMIT 1;
    
    -- Insert reading if sensor found
    IF v_sensor_id IS NOT NULL THEN
      INSERT INTO public.sensor_readings (sensor_id, value)
      VALUES (v_sensor_id, v_value);
      
      v_count := v_count + 1;
      
      v_results := v_results || jsonb_build_object(
        'type', v_sensor_type,
        'value', v_value,
        'status', 'logged'
      );
    ELSE
      v_results := v_results || jsonb_build_object(
        'type', v_sensor_type,
        'value', v_value,
        'status', 'sensor_not_found'
      );
    END IF;
  END LOOP;
  
  -- Return combined response
  RETURN jsonb_build_object(
    'success', true,
    'count', v_count,
    'node_id', p_node_id,
    'zone', p_zone_name,
    'timestamp', NOW(),
    'sensors', v_results,
    'message', 'All ' || v_count || ' sensors logged successfully'
  );
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.log_sensor_data_bulk(TEXT, TEXT, TEXT, JSONB) 
TO anon, authenticated, postgres, service_role;

-- ============================================
-- TEST
-- ============================================
SELECT public.log_sensor_data_bulk(
  'SUB_ESP_03',
  'sub',
  'Greenhouse Zone D',
  '{
    "temp_outside": 30.5,
    "hum_outside": 55.0,
    "temp_inside": 26.0,
    "hum_inside": 65.0,
    "co2": 420.0,
    "light": 700.0,
    "rain_status": 0,
    "soil_moisture": 40.0,
    "ph_level": 6.0,
    "ec_level": 1.0,
    "npk_n": 50.0,
    "npk_p": 30.0,
    "npk_k": 60.0,
    "water_level": 60.0,
    "fert_level": 30.0
  }'::JSONB
);
