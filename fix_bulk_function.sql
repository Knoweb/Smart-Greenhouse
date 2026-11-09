-- Run this in Supabase SQL Editor to create the bulk function

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
  v_sensor JSONB;
  v_sensor_uuid TEXT;
  v_value FLOAT;
  v_type TEXT;
  v_results JSONB := '[]'::JSONB;
BEGIN
  FOR v_sensor IN SELECT * FROM jsonb_array_elements(p_sensors)
  LOOP
    v_type := v_sensor->>'type';
    v_value := (v_sensor->>'value')::FLOAT;
    
    SELECT id INTO v_sensor_uuid FROM public.sensors WHERE sensor_type = v_type LIMIT 1;
    
    IF v_sensor_uuid IS NOT NULL THEN
      INSERT INTO public.sensor_readings (sensor_id, value) VALUES (v_sensor_uuid, v_value);
      v_count := v_count + 1;
      v_results := v_results || jsonb_build_object('type', v_type, 'value', v_value, 'status', 'ok');
    ELSE
      v_results := v_results || jsonb_build_object('type', v_type, 'value', v_value, 'status', 'sensor_not_found');
    END IF;
  END LOOP;
  
  RETURN jsonb_build_object(
    'success', true,
    'count', v_count,
    'node_id', p_node_id,
    'zone', p_zone_name,
    'timestamp', NOW(),
    'message', 'Bulk update successful!',
    'sensors', v_results
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.log_sensor_data_batch(TEXT, TEXT, TEXT, JSONB) TO anon;
