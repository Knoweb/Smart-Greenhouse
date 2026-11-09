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
        CASE WHEN v_sensor_type IN ('temp', 'temp_inside', 'soil_temperature', 'air_temperature') THEN NEW.value ELSE NULL END,
        CASE WHEN v_sensor_type IN ('temp_outside', 'OUTSIDE_TEMP') THEN NEW.value ELSE NULL END,
        CASE WHEN v_sensor_type IN ('hum', 'hum_inside', 'air_humidity') THEN NEW.value ELSE NULL END,
        CASE WHEN v_sensor_type IN ('hum_outside', 'OUTSIDE_HUM') THEN NEW.value ELSE NULL END,
        CASE WHEN v_sensor_type = 'light' THEN NEW.value ELSE NULL END,
        CASE WHEN v_sensor_type = 'co2' THEN NEW.value ELSE NULL END,
        CASE WHEN v_sensor_type = 'soil_moisture' THEN NEW.value ELSE NULL END,
        CASE WHEN v_sensor_type IN ('rain', 'rain_status', 'RAIN_AMOUNT') THEN (NEW.value > 0) ELSE NULL END,
        CASE WHEN v_sensor_type IN ('ec', 'ec_level', 'soil_ec') THEN NEW.value ELSE NULL END,
        CASE WHEN v_sensor_type IN ('npk_n', 'soil_nitrogen') THEN NEW.value ELSE NULL END,
        CASE WHEN v_sensor_type IN ('npk_p', 'soil_phosphorus') THEN NEW.value ELSE NULL END,
        CASE WHEN v_sensor_type IN ('npk_k', 'soil_potassium') THEN NEW.value ELSE NULL END,
        CASE WHEN v_sensor_type = 'water_level' THEN NEW.value ELSE NULL END,
        CASE WHEN v_sensor_type = 'fert_level' THEN NEW.value ELSE NULL END
    );

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;
