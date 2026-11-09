-- This script consolidates all versions of log_sensor_data to ensure ESP32 compatibility
-- Regardless of which version (3, 4, or 5 parameters) your ESP32 uses, it will work.

-- 1. Ensure Table Grants exist
GRANT ALL ON TABLE public.nodes TO anon, authenticated;
GRANT ALL ON TABLE public.sensors TO anon, authenticated;
GRANT ALL ON TABLE public.sensor_readings TO anon, authenticated;
GRANT ALL ON TABLE public.zones TO anon, authenticated;
GRANT ALL ON SEQUENCE public.sensor_readings_id_seq TO anon, authenticated;

-- 2. Version with 3 parameters (Old version)
CREATE OR REPLACE FUNCTION public.log_sensor_data(
    p_node_id TEXT,
    p_sensor_type TEXT,
    p_value FLOAT
) RETURNS VOID AS $$
BEGIN
    PERFORM public.log_sensor_data(p_node_id, 'sub', NULL, p_sensor_type, p_value);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Version with 4 parameters (Intermediate version)
CREATE OR REPLACE FUNCTION public.log_sensor_data(
    p_node_id TEXT,
    p_node_type TEXT,
    p_sensor_type TEXT,
    p_value FLOAT
) RETURNS VOID AS $$
BEGIN
    PERFORM public.log_sensor_data(p_node_id, p_node_type, NULL, p_sensor_type, p_value);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Version with 5 parameters (Latest version)
CREATE OR REPLACE FUNCTION public.log_sensor_data(
    p_node_id TEXT,
    p_node_type TEXT,   -- 'sub' or 'main'
    p_zone_name TEXT,   -- e.g., 'Zone A', 'Outside'
    p_sensor_type TEXT, -- e.g., 'temp', 'hum'
    p_value FLOAT
) RETURNS VOID AS $$
DECLARE
    v_zone_id UUID;
    v_sensor_id UUID;
BEGIN
    -- Ensure the Zone exists
    IF p_zone_name IS NOT NULL THEN
        INSERT INTO public.zones (name)
        VALUES (p_zone_name)
        ON CONFLICT (name) DO NOTHING;
        
        SELECT id INTO v_zone_id FROM public.zones WHERE name = p_zone_name;
    END IF;

    -- Ensure the node exists
    INSERT INTO public.nodes (id, name, node_type, zone_id)
    VALUES (p_node_id, p_node_id, p_node_type, v_zone_id)
    ON CONFLICT (id) DO UPDATE 
    SET last_seen = NOW(), 
        is_online = TRUE,
        node_type = EXCLUDED.node_type,
        zone_id = COALESCE(v_zone_id, nodes.zone_id);

    -- Ensure the sensor exists
    INSERT INTO public.sensors (node_id, sensor_type, label)
    VALUES (p_node_id, p_sensor_type, p_sensor_type)
    ON CONFLICT (node_id, sensor_type) DO NOTHING;

    -- Get the sensor_id
    SELECT id INTO v_sensor_id FROM public.sensors 
    WHERE node_id = p_node_id AND sensor_type = p_sensor_type;

    -- Insert the reading
    INSERT INTO public.sensor_readings (sensor_id, value)
    VALUES (v_sensor_id, p_value);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. GRANT EXECUTE to anon so ESP32 can call it
GRANT EXECUTE ON FUNCTION public.log_sensor_data(TEXT, TEXT, FLOAT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.log_sensor_data(TEXT, TEXT, TEXT, FLOAT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.log_sensor_data(TEXT, TEXT, TEXT, TEXT, FLOAT) TO anon, authenticated;
