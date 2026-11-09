-- ============================================
-- BULK SENSOR LOGGING FUNCTION
-- Sends all sensors at once, returns ONE response
-- ============================================

CREATE OR REPLACE FUNCTION public.log_sensor_data_batch(
  p_node_id TEXT,
  p_node_type TEXT,
  p_zone_name TEXT,
  p_sensors JSONB
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_count INTEGER := 0;
  v_results JSONB := '[]'::JSONB;
  v_sensor JSONB;
  v_sensor_id TEXT;
  v_value FLOAT;
BEGIN
  -- Process each sensor in the array
  FOR v_sensor IN SELECT * FROM jsonb_array_elements(p_sensors)
  LOOP
    v_sensor_id := v_sensor->>'type';
    v_value := (v_sensor->>'value')::FLOAT;
    
    -- Find sensor ID by type
    SELECT s.id INTO v_sensor_id
    FROM public.sensors s
    WHERE s.sensor_type = v_sensor->>'type'
    LIMIT 1;
    
    -- Insert reading
    IF v_sensor_id IS NOT NULL THEN
      INSERT INTO public.sensor_readings (sensor_id, value)
      VALUES (v_sensor_id, v_value);
      
      v_count := v_count + 1;
      
      -- Add to results
      v_results := v_results || jsonb_build_object(
        'type', v_sensor->>'type',
        'value', v_value,
        'status', 'logged'
      );
    ELSE
      v_results := v_results || jsonb_build_object(
        'type', v_sensor->>'type',
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

-- Grant permissions
GRANT EXECUTE ON FUNCTION public.log_sensor_data_batch(TEXT, TEXT, TEXT, JSONB) 
TO anon, authenticated, postgres, service_role;

-- Test
SELECT public.log_sensor_data_batch(
  'SUB_ESP_03',
  'sub',
  'Greenhouse Zone D',
  '[
    {"type": "temp_inside", "value": 28.5},
    {"type": "hum_inside", "value": 75.0},
    {"type": "water_level", "value": 80.0}
  ]'::JSONB
);
