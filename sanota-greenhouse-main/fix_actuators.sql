-- Ensure unique constraint for actuators to prevent duplicates
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'unique_node_actuator') THEN
        ALTER TABLE public.actuators ADD CONSTRAINT unique_node_actuator UNIQUE (node_id, actuator_type);
    END IF;
END $$;

-- Create the register_actuator function to handle registration from ESP32
CREATE OR REPLACE FUNCTION public.register_actuator(
    p_node_id TEXT,
    p_node_type TEXT,
    p_zone_name TEXT,
    p_actuator_type TEXT,
    p_label TEXT
) RETURNS VOID AS $$
DECLARE
    v_zone_id UUID;
BEGIN
    -- Ensure Zone exists
    INSERT INTO public.zones (name) VALUES (p_zone_name)
    ON CONFLICT (name) DO NOTHING;
    SELECT id INTO v_zone_id FROM public.zones WHERE name = p_zone_name;

    -- Ensure Node exists
    INSERT INTO public.nodes (id, name, node_type, zone_id)
    VALUES (p_node_id, p_node_id, p_node_type, v_zone_id)
    ON CONFLICT (id) DO UPDATE SET last_seen = NOW(), is_online = TRUE, zone_id = v_zone_id;

    -- Ensure Actuator exists
    INSERT INTO public.actuators (node_id, actuator_type, label)
    VALUES (p_node_id, p_actuator_type, p_label)
    ON CONFLICT (node_id, actuator_type) DO UPDATE SET label = EXCLUDED.label;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant Permissions so ESP32 (anon) can execute it
GRANT EXECUTE ON FUNCTION public.register_actuator TO anon, authenticated;
GRANT ALL ON TABLE public.actuators TO anon, authenticated;
GRANT ALL ON TABLE public.nodes TO anon, authenticated;
GRANT ALL ON TABLE public.zones TO anon, authenticated;
