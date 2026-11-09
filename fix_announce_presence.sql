CREATE OR REPLACE FUNCTION public.announce_device_presence(
    p_mac_address text,
    p_device_name text DEFAULT 'ESP32 Device',
    p_node_type text DEFAULT 'sub',
    p_metadata jsonb DEFAULT '{}'::jsonb
)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $$
 BEGIN 
    INSERT INTO public.device_discovery (mac_address, node_type, last_seen, metadata) 
    VALUES (upper(trim(p_mac_address)), p_node_type, NOW(), p_metadata) 
    ON CONFLICT (mac_address) DO UPDATE SET 
        last_seen = NOW(), 
        node_type = EXCLUDED.node_type, 
        metadata = EXCLUDED.metadata; 

    UPDATE public.nodes
    SET last_seen = NOW(),
        is_online = true,
        updated_at = NOW()
    WHERE upper(trim(mac_address)) = upper(trim(p_mac_address));
 END; 
$$;

GRANT EXECUTE ON FUNCTION public.announce_device_presence(text, text, text, jsonb) TO anon, authenticated;
