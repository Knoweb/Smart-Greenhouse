-- Function to sync new readings to the old sensors_data table
CREATE OR REPLACE FUNCTION public.sync_to_sensors_data()
RETURNS TRIGGER AS $$
DECLARE
    v_sensor_type TEXT;
BEGIN
    -- Get the sensor type for the reading
    SELECT sensor_type INTO v_sensor_type FROM public.sensors WHERE id = NEW.sensor_id;

    -- Insert a new row into sensors_data with only the relevant column filled
    -- (Mapping our new sensor types to the old flat table columns)
    INSERT INTO public.sensors_data (
        inside_temp, outside_temp, inside_hum, outside_hum, 
        light, co2, soil_moisture, rain, ec_level, 
        nitrogen, phosphorus, potassium, water_tank, fertilizer_tank
    ) VALUES (
        CASE WHEN v_sensor_type IN ('temp', 'temp_inside') THEN NEW.value ELSE NULL END,
        CASE WHEN v_sensor_type = 'temp_outside' THEN NEW.value ELSE NULL END,
        CASE WHEN v_sensor_type IN ('hum', 'hum_inside') THEN NEW.value ELSE NULL END,
        CASE WHEN v_sensor_type = 'hum_outside' THEN NEW.value ELSE NULL END,
        CASE WHEN v_sensor_type = 'light' THEN NEW.value ELSE NULL END,
        CASE WHEN v_sensor_type = 'co2' THEN NEW.value ELSE NULL END,
        CASE WHEN v_sensor_type = 'soil_moisture' THEN NEW.value ELSE NULL END,
        CASE WHEN v_sensor_type IN ('rain', 'rain_status') THEN (NEW.value > 0) ELSE NULL END,
        CASE WHEN v_sensor_type IN ('ec', 'ec_level') THEN NEW.value ELSE NULL END,
        CASE WHEN v_sensor_type = 'npk_n' THEN NEW.value ELSE NULL END,
        CASE WHEN v_sensor_type = 'npk_p' THEN NEW.value ELSE NULL END,
        CASE WHEN v_sensor_type = 'npk_k' THEN NEW.value ELSE NULL END,
        CASE WHEN v_sensor_type = 'water_level' THEN NEW.value ELSE NULL END,
        CASE WHEN v_sensor_type = 'fert_level' THEN NEW.value ELSE NULL END
    );

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create the trigger
DROP TRIGGER IF EXISTS tr_sync_sensors_data ON public.sensor_readings;
CREATE TRIGGER tr_sync_sensors_data
AFTER INSERT ON public.sensor_readings
FOR EACH ROW EXECUTE FUNCTION public.sync_to_sensors_data();
