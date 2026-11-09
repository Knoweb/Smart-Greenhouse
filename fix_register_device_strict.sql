CREATE OR REPLACE FUNCTION public.register_device_by_mac(
    p_mac_address TEXT,
    p_device_name TEXT,
    p_node_type TEXT DEFAULT 'sub',
    p_zone_name TEXT DEFAULT NULL,
    p_greenhouse_id UUID DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_zone_id UUID;
  v_node_id TEXT;
  v_mac TEXT;
  v_owner_id UUID;
  v_discovered BOOLEAN;
BEGIN
  -- 1. Normalize and Validate MAC format
  v_mac := upper(trim(p_mac_address));
  v_owner_id := auth.uid();

  IF v_mac !~ '^[0-9A-F]{2}(:[0-9A-F]{2}){5}$' THEN
    RAISE EXCEPTION 'Invalid MAC address format. Use AA:BB:CC:DD:EE:FF';
  END IF;

  -- 2. Discovery Check (Ensures the device is actually online/real)
  SELECT EXISTS (
    SELECT 1 FROM public.device_discovery 
    WHERE mac_address = v_mac 
    AND last_seen > (NOW() - INTERVAL '30 minutes')
  ) INTO v_discovered;

  IF NOT v_discovered THEN
    RAISE EXCEPTION 'Device with MAC address % not found. Make sure it is powered on and connected to WiFi.', v_mac;
  END IF;

  -- 3. Handle Zone Creation/Lookup
  IF p_zone_name IS NOT NULL AND p_zone_name <> '' THEN
    INSERT INTO public.zones (owner_id, name, greenhouse_id)
    VALUES (v_owner_id, p_zone_name, p_greenhouse_id)
    ON CONFLICT (owner_id, LOWER(name)) DO UPDATE SET 
      greenhouse_id = COALESCE(p_greenhouse_id, zones.greenhouse_id)
    RETURNING id INTO v_zone_id;
  END IF;

  -- 4. Register Node
  v_node_id := 'DEVICE_' || REPLACE(v_mac, ':', '');
  
  INSERT INTO public.nodes (
    id, owner_id, mac_address, name, node_type, zone_id, registration_status, last_seen, is_online
  )
  VALUES (
    v_node_id,
    v_owner_id,
    v_mac,
    p_device_name,
    p_node_type,
    v_zone_id,
    'registered',
    NOW(),
    true
  )
  ON CONFLICT (id) DO UPDATE SET
    owner_id = v_owner_id,
    name = p_device_name,
    zone_id = v_zone_id,
    registration_status = 'registered',
    last_seen = NOW(),
    is_online = true,
    updated_at = NOW();

  -- 5. Link hardware data
  UPDATE public.sensors SET owner_id = v_owner_id WHERE node_id = v_node_id AND owner_id IS NULL;
  UPDATE public.actuators SET owner_id = v_owner_id WHERE node_id = v_node_id AND owner_id IS NULL;
  UPDATE public.sensor_readings SET owner_id = v_owner_id WHERE node_id = v_node_id AND owner_id IS NULL;

  -- 6. Clean up discovery
  DELETE FROM public.device_discovery WHERE mac_address = v_mac;

  RETURN jsonb_build_object(
    'status', 'success', 
    'message', 'Device ' || v_mac || ' registered successfully.',
    'node_id', v_node_id
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.register_device_by_mac(text, text, text, text, uuid) TO authenticated;
