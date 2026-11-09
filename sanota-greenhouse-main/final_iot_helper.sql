-- Final updated helper function to include node_id, node_type, and zone_name
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
    -- 1. Ensure the Zone exists
    IF p_zone_name IS NOT NULL THEN
        INSERT INTO public.zones (name)
        VALUES (p_zone_name)
        ON CONFLICT (name) DO NOTHING;
        
        SELECT id INTO v_zone_id FROM public.zones WHERE name = p_zone_name;
    END IF;

    -- 2. Ensure the node exists with the correct type and zone
    INSERT INTO public.nodes (id, name, node_type, zone_id)
    VALUES (p_node_id, p_node_id, p_node_type, v_zone_id)
    ON CONFLICT (id) DO UPDATE 
    SET last_seen = NOW(), 
        is_online = TRUE,
        node_type = EXCLUDED.node_type,
        zone_id = COALESCE(v_zone_id, nodes.zone_id);

    -- 3. Ensure the sensor exists for this node
    INSERT INTO public.sensors (node_id, sensor_type, label)
    VALUES (p_node_id, p_sensor_type, p_sensor_type)
    ON CONFLICT (node_id, sensor_type) DO NOTHING;

    -- 4. Get the sensor_id
    SELECT id INTO v_sensor_id FROM public.sensors 
    WHERE node_id = p_node_id AND sensor_type = p_sensor_type;

    -- 5. Insert the reading
    INSERT INTO public.sensor_readings (sensor_id, value)
    VALUES (v_sensor_id, p_value);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add unique constraint to zones name if not exists
ALTER TABLE public.zones ADD CONSTRAINT unique_zone_name UNIQUE (name);
