-- Run this in Supabase SQL Editor

CREATE OR REPLACE FUNCTION public.log_sensor_data_bulk(p_readings JSONB)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_count INTEGER := 0;
  v_item JSONB;
  v_sensor_id UUID;
  v_sensor_type TEXT;
  v_value FLOAT;
  v_node_id TEXT;
  v_results JSONB := '[]'::JSONB;
BEGIN
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_readings)
  LOOP
    v_node_id := v_item->>'node_id';
    v_sensor_type := v_item->>'sensor_type';
    v_value := (v_item->>'value')::FLOAT;
    
    -- Find sensor UUID by type
    SELECT id INTO v_sensor_id 
    FROM public.sensors 
    WHERE sensor_type = v_sensor_type
    LIMIT 1;
    
    IF v_sensor_id IS NOT NULL THEN
      -- Insert into sensor_readings table
      INSERT INTO public.sensor_readings (sensor_id, value)
      VALUES (v_sensor_id, v_value);
      
      v_count := v_count + 1;
      v_results := v_results || jsonb_build_object(
        'sensor_type', v_sensor_type,
        'value', v_value,
        'status', 'logged'
      );
    ELSE
      v_results := v_results || jsonb_build_object(
        'sensor_type', v_sensor_type,
        'value', v_value,
        'status', 'sensor_not_found'
      );
    END IF;
  END LOOP;
  
  RETURN jsonb_build_object(
    'success', true,
    'count', v_count,
    'message', 'Bulk update successful!',
    'timestamp', NOW(),
    'results', v_results
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.log_sensor_data_bulk(JSONB) TO anon;
