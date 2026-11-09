-- ============================================
-- BULK SENSOR DATA LOGGING FUNCTION
-- Send all sensor data in ONE request!
-- ============================================

-- Drop existing function if any
DROP FUNCTION IF EXISTS public.log_all_sensors(JSONB);

-- Create the bulk logging function
CREATE OR REPLACE FUNCTION public.log_all_sensors(
  p_data JSONB
)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_count INTEGER := 0;
  v_sensor_id TEXT;
  v_value FLOAT;
BEGIN
  FOR v_sensor_id, v_value IN
    SELECT key, (value::TEXT)::FLOAT
    FROM jsonb_each_text(p_data)
  LOOP
    INSERT INTO public.sensor_readings (sensor_id, value)
    SELECT 
      s.id,
      v_value
    FROM public.sensors s
    WHERE s.sensor_type = v_sensor_id
    LIMIT 1;
    
    IF FOUND THEN
      v_count := v_count + 1;
    END IF;
  END LOOP;
  
  RETURN v_count;
END;
$$;

-- Grant permissions
GRANT EXECUTE ON FUNCTION public.log_all_sensors(JSONB) TO anon, authenticated, postgres, service_role;
