
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
  v_discovery_exists BOOLEAN;
  v_mac TEXT;
  v_owner_id UUID;
BEGIN
  v_mac := upper(trim(p_mac_address));
  v_owner_id := auth.uid();

  -- 1. STRICT DISCOVERY VALIDATION
  SELECT EXISTS (
    SELECT 1 FROM public.device_discovery 
    WHERE mac_address = v_mac
    AND last_seen > (NOW() - INTERVAL '10 minutes')
  ) INTO v_discovery_exists;

  IF NOT v_discovery_exists THEN
    RAISE EXCEPTION 'Device not found. Please make sure your device is powered on and connected to WiFi before registering.';
  END IF;

  -- 2. Handle Zone Creation/Lookup
  IF p_zone_name IS NOT NULL AND p_zone_name <> '' THEN
    INSERT INTO public.zones (owner_id, name, greenhouse_id)
    VALUES (v_owner_id, p_zone_name, p_greenhouse_id)
    ON CONFLICT (owner_id, name) DO UPDATE SET 
      greenhouse_id = COALESCE(p_greenhouse_id, zones.greenhouse_id)
    RETURNING id INTO v_zone_id;
  END IF;

  -- 3. Register Node
  v_node_id := 'DEVICE_' || REPLACE(v_mac, ':', '');
  
  INSERT INTO public.nodes (
    id, owner_id, mac_address, name, node_type, zone_id, registration_status
  )
  VALUES (
    v_node_id,
    v_owner_id,
    v_mac,
    p_device_name,
    p_node_type,
    v_zone_id,
    'registered'
  )
  ON CONFLICT (id) DO UPDATE SET
    owner_id = v_owner_id,
    name = p_device_name,
    zone_id = v_zone_id,
    registration_status = 'registered',
    updated_at = NOW();

  -- 4. LINK EXISTING SENSORS, ACTUATORS AND READINGS TO THE NEW OWNER
  UPDATE public.sensors SET owner_id = v_owner_id WHERE node_id = v_node_id AND owner_id IS NULL;
  UPDATE public.actuators SET owner_id = v_owner_id WHERE node_id = v_node_id AND owner_id IS NULL;
  UPDATE public.sensor_readings SET owner_id = v_owner_id WHERE node_id = v_node_id AND owner_id IS NULL;
  UPDATE public.actuator_logs SET owner_id = v_owner_id WHERE node_id = v_node_id AND owner_id IS NULL;

  -- 5. Clean up discovery
  DELETE FROM public.device_discovery WHERE mac_address = v_mac;

  RETURN jsonb_build_object(
    'status', 'success', 
    'message', 'Device ' || v_mac || ' registered successfully and data linked.',
    'node_id', v_node_id
  );
END;
$$;
