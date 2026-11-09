-- 1. Add a unique constraint to sensors to prevent duplicates for each node
-- This is essential for our helper function to work
ALTER TABLE public.sensors ADD CONSTRAINT unique_node_sensor UNIQUE (node_id, sensor_type);

-- 2. Create the helper function to log sensor data easily from ESP32
-- This function will:
--   a) Register the Node if it's new
--   b) Register the Sensor if it's new
--   c) Log the reading automatically
CREATE OR REPLACE FUNCTION public.log_sensor_data(
    p_node_id TEXT,
    p_sensor_type TEXT,
    p_value FLOAT
) RETURNS VOID AS $$
DECLARE
    v_sensor_id UUID;
BEGIN
    -- Ensure the node exists
    INSERT INTO public.nodes (id, name, node_type)
    VALUES (p_node_id, p_node_id, 'sub')
    ON CONFLICT (id) DO UPDATE SET last_seen = NOW(), is_online = TRUE;

    -- Ensure the sensor exists for this node
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
