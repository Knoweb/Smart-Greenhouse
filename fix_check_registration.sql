CREATE OR REPLACE FUNCTION public.check_device_registration(p_mac_address text)
 RETURNS TABLE (
    id TEXT,
    name TEXT,
    node_type TEXT,
    mac_address TEXT,
    registration_status TEXT
 )
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY 
    SELECT n.id, n.name, n.node_type, n.mac_address, n.registration_status
    FROM public.nodes n
    WHERE n.mac_address = upper(trim(p_mac_address));
END;
$$;

GRANT EXECUTE ON FUNCTION public.check_device_registration(text) TO anon, authenticated;
