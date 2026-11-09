-- Updated helper function to include node_type
CREATE OR REPLACE FUNCTION public.log_sensor_data(
    p_node_id TEXT,
    p_node_type TEXT, -- 'sub' or 'main'
    p_sensor_type TEXT,
    p_value FLOAT
) RETURNS VOID AS $$
DECLARE
    v_sensor_id UUID;
BEGIN
    -- 1. Ensure the node exists with the correct type
    INSERT INTO public.nodes (id, name, node_type)
    VALUES (p_node_id, p_node_id, p_node_type)
    ON CONFLICT (id) DO UPDATE 
    SET last_seen = NOW(), 
        is_online = TRUE,
        node_type = EXCLUDED.node_type; -- Update type if it changed

    -- 2. Ensure the sensor exists for this node
    INSERT INTO public.sensors (node_id, sensor_type, label)
    VALUES (p_node_id, p_sensor_type, p_sensor_type)
    ON CONFLICT (node_id, sensor_type) DO NOTHING;

    -- 3. Get the sensor_id
    SELECT id INTO v_sensor_id FROM public.sensors 
    WHERE node_id = p_node_id AND sensor_type = p_sensor_type;

    -- 4. Insert the reading
    INSERT INTO public.sensor_readings (sensor_id, value)
    VALUES (v_sensor_id, p_value);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
