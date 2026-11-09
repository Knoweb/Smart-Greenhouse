-- ============================================
-- BULK CAPTURE FUNCTION
-- Captures all sensor data in ONE request
-- ============================================

CREATE OR REPLACE FUNCTION public.capture_bulk_sensor_data(
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
    
    -- Capture data
    IF v_sensor_id IS NOT NULL THEN
      INSERT INTO public.data_capture_log 
        (node_id, sensor_type, sensor_id, value, raw_data)
      VALUES (
        p_node_id, 
        v_sensor_type, 
        v_sensor_id, 
        v_value,
        p_bulk_data
      );
      
      v_count := v_count + 1;
    END IF;
  END LOOP;
  
  -- Return response
  RETURN jsonb_build_object(
    'success', true,
    'count', v_count,
    'node_id', p_node_id,
    'zone', p_zone_name,
    'captured_at', NOW()
  );
END;
$$;

-- Grant permission
GRANT EXECUTE ON FUNCTION public.capture_bulk_sensor_data(TEXT, TEXT, TEXT, JSONB) 
TO anon, authenticated, postgres, service_role;

-- ============================================
-- TEST
-- ============================================
SELECT public.capture_bulk_sensor_data(
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
    "water_level": 60.0
  }'::JSONB
);
