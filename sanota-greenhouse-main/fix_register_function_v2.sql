
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
BEGIN
  v_mac := upper(trim(p_mac_address));
  v_owner_id := auth.uid();

  -- 1. Handle Zone Creation/Lookup
  IF p_zone_name IS NOT NULL AND p_zone_name <> '' THEN
    INSERT INTO public.zones (owner_id, name, greenhouse_id)
    VALUES (v_owner_id, p_zone_name, p_greenhouse_id)
    ON CONFLICT (owner_id, name) DO UPDATE SET 
      greenhouse_id = COALESCE(p_greenhouse_id, zones.greenhouse_id)
    RETURNING id INTO v_zone_id;
  END IF;

  -- 2. Register Node
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

  -- 3. LINK EXISTING DATA TO THE NEW OWNER
  -- Sensors & Actuators
  UPDATE public.sensors SET owner_id = v_owner_id WHERE node_id = v_node_id AND owner_id IS NULL;
  UPDATE public.actuators SET owner_id = v_owner_id WHERE node_id = v_node_id AND owner_id IS NULL;
  
  -- Readings (Has node_id)
  UPDATE public.sensor_readings SET owner_id = v_owner_id WHERE node_id = v_node_id AND owner_id IS NULL;
  
  -- Actuator Logs (Does not have node_id directly)
  UPDATE public.actuator_logs SET owner_id = v_owner_id 
  WHERE actuator_id IN (SELECT id FROM public.actuators WHERE node_id = v_node_id) 
  AND owner_id IS NULL;

  -- 4. Clean up discovery
  DELETE FROM public.device_discovery WHERE mac_address = v_mac;

  RETURN jsonb_build_object(
    'status', 'success', 
    'message', 'Device ' || v_mac || ' registered successfully and data linked.',
    'node_id', v_node_id
  );
END;
$$;
