-- ============================================
-- BULK SENSOR DATA LOGGING FUNCTION
-- Send all sensor data in ONE request!
-- ============================================

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
  -- Loop through each key in the JSON object
  FOR v_sensor_id, v_value IN
    SELECT key, value::FLOAT
    FROM jsonb_each_text(p_data)
  LOOP
    -- Insert each sensor reading
    INSERT INTO public.sensor_readings (sensor_id, value, created_at)
    SELECT 
      s.id,
      v_value,
      NOW()
    FROM public.sensors s
    WHERE s.sensor_type = v_sensor_id
    LIMIT 1;
    
    v_count := v_count + 1;
  END LOOP;
  
  RETURN v_count;
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.log_all_sensors(JSONB) TO anon, authenticated, postgres, service_role;

-- ============================================
-- TEST
-- ============================================
SELECT public.log_all_sensors('{
  "temp_inside": 28.5,
  "hum_inside": 72,
  "water_level": 80,
  "soil_moisture": 55,
  "co2": 500,
  "light": 900,
  "ph_level": 6.8,
  "ec_level": 1.6
}'::JSONB);
