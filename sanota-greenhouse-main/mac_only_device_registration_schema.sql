-- MAC-only greenhouse device registration schema for the current React app
-- This version matches the existing Settings > Device Register flow:
-- - users register devices by MAC address
-- - the device row itself uses the normalized MAC as the node id
-- - each device auto-creates its sensors / actuators
-- - ESP32s can claim their row and fetch only their own hardware by MAC

BEGIN;

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ---------------------------------------------------------------------------
-- Shared helper
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- ---------------------------------------------------------------------------
-- Users / ownership
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.greenhouses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  location TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.greenhouses
  ADD COLUMN IF NOT EXISTS owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE public.greenhouses
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

DROP TRIGGER IF EXISTS trg_greenhouses_updated_at ON public.greenhouses;
CREATE TRIGGER trg_greenhouses_updated_at
BEFORE UPDATE ON public.greenhouses
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE IF NOT EXISTS public.zones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  greenhouse_id UUID REFERENCES public.greenhouses(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.zones
  ADD COLUMN IF NOT EXISTS owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE public.zones
  ADD COLUMN IF NOT EXISTS greenhouse_id UUID REFERENCES public.greenhouses(id) ON DELETE SET NULL;

ALTER TABLE public.zones
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

CREATE UNIQUE INDEX IF NOT EXISTS zones_owner_name_unique_idx
  ON public.zones (owner_id, LOWER(name));

DROP TRIGGER IF EXISTS trg_zones_updated_at ON public.zones;
CREATE TRIGGER trg_zones_updated_at
BEFORE UPDATE ON public.zones
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Devices
-- The normalized MAC address is the node id so the current app and ESP code
-- can reference the same value directly.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.nodes (
  id TEXT PRIMARY KEY,
  owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  greenhouse_id UUID REFERENCES public.greenhouses(id) ON DELETE SET NULL,
  zone_id UUID REFERENCES public.zones(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  node_type TEXT NOT NULL CHECK (node_type IN ('main', 'sub')),
  mac_address TEXT NOT NULL,
  is_online BOOLEAN NOT NULL DEFAULT FALSE,
  registration_status TEXT NOT NULL DEFAULT 'registered' CHECK (registration_status IN ('registered', 'online', 'offline', 'disabled')),
  last_seen TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.nodes
  ADD COLUMN IF NOT EXISTS owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE public.nodes
  ADD COLUMN IF NOT EXISTS greenhouse_id UUID REFERENCES public.greenhouses(id) ON DELETE SET NULL;

ALTER TABLE public.nodes
  ADD COLUMN IF NOT EXISTS zone_id UUID REFERENCES public.zones(id) ON DELETE SET NULL;

ALTER TABLE public.nodes
  ADD COLUMN IF NOT EXISTS mac_address TEXT;

ALTER TABLE public.nodes
  ADD COLUMN IF NOT EXISTS node_type TEXT;

ALTER TABLE public.nodes
  ADD COLUMN IF NOT EXISTS is_online BOOLEAN NOT NULL DEFAULT FALSE;

ALTER TABLE public.nodes
  ADD COLUMN IF NOT EXISTS registration_status TEXT NOT NULL DEFAULT 'registered';

ALTER TABLE public.nodes
  ADD COLUMN IF NOT EXISTS last_seen TIMESTAMPTZ;

ALTER TABLE public.nodes
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

UPDATE public.nodes
SET mac_address = UPPER(COALESCE(mac_address, id))
WHERE mac_address IS NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'nodes_mac_address_format_chk'
  ) THEN
    ALTER TABLE public.nodes
      ADD CONSTRAINT nodes_mac_address_format_chk
      CHECK (mac_address ~ '^[0-9A-F]{2}(:[0-9A-F]{2}){5}$');
  END IF;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS nodes_mac_unique_idx
  ON public.nodes (mac_address);

CREATE INDEX IF NOT EXISTS nodes_owner_idx ON public.nodes (owner_id);
CREATE INDEX IF NOT EXISTS nodes_zone_idx ON public.nodes (zone_id);

DROP TRIGGER IF EXISTS trg_nodes_updated_at ON public.nodes;
CREATE TRIGGER trg_nodes_updated_at
BEFORE UPDATE ON public.nodes
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Sensors
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.sensors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  node_id TEXT NOT NULL REFERENCES public.nodes(id) ON DELETE CASCADE,
  sensor_type TEXT NOT NULL,
  label TEXT NOT NULL,
  unit TEXT,
  is_visible BOOLEAN NOT NULL DEFAULT TRUE,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.sensors
  ADD COLUMN IF NOT EXISTS owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE public.sensors
  ADD COLUMN IF NOT EXISTS node_id TEXT;

ALTER TABLE public.sensors
  ADD COLUMN IF NOT EXISTS sensor_type TEXT;

ALTER TABLE public.sensors
  ADD COLUMN IF NOT EXISTS label TEXT;

ALTER TABLE public.sensors
  ADD COLUMN IF NOT EXISTS unit TEXT;

ALTER TABLE public.sensors
  ADD COLUMN IF NOT EXISTS is_visible BOOLEAN NOT NULL DEFAULT TRUE;

ALTER TABLE public.sensors
  ADD COLUMN IF NOT EXISTS metadata JSONB NOT NULL DEFAULT '{}'::jsonb;

ALTER TABLE public.sensors
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

CREATE UNIQUE INDEX IF NOT EXISTS sensors_node_type_unique_idx
  ON public.sensors (node_id, sensor_type);

DROP TRIGGER IF EXISTS trg_sensors_updated_at ON public.sensors;
CREATE TRIGGER trg_sensors_updated_at
BEFORE UPDATE ON public.sensors
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Actuators
-- Keep the existing control fields used by the React app.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.actuators (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  node_id TEXT NOT NULL REFERENCES public.nodes(id) ON DELETE CASCADE,
  actuator_type TEXT NOT NULL,
  label TEXT NOT NULL,
  control_mode TEXT NOT NULL DEFAULT 'manual' CHECK (control_mode IN ('manual', 'auto', 'schedule')),
  target_state JSONB NOT NULL DEFAULT '{"on": false}'::jsonb,
  actual_state JSONB NOT NULL DEFAULT '{"on": false}'::jsonb,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.actuators
  ADD COLUMN IF NOT EXISTS owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE public.actuators
  ADD COLUMN IF NOT EXISTS node_id TEXT;

ALTER TABLE public.actuators
  ADD COLUMN IF NOT EXISTS actuator_type TEXT;

ALTER TABLE public.actuators
  ADD COLUMN IF NOT EXISTS label TEXT;

ALTER TABLE public.actuators
  ADD COLUMN IF NOT EXISTS control_mode TEXT NOT NULL DEFAULT 'manual';

ALTER TABLE public.actuators
  ADD COLUMN IF NOT EXISTS target_state JSONB NOT NULL DEFAULT '{"on": false}'::jsonb;

ALTER TABLE public.actuators
  ADD COLUMN IF NOT EXISTS actual_state JSONB NOT NULL DEFAULT '{"on": false}'::jsonb;

ALTER TABLE public.actuators
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

CREATE UNIQUE INDEX IF NOT EXISTS actuators_node_type_unique_idx
  ON public.actuators (node_id, actuator_type);

DROP TRIGGER IF EXISTS trg_actuators_updated_at ON public.actuators;
CREATE TRIGGER trg_actuators_updated_at
BEFORE UPDATE ON public.actuators
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Readings
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.sensor_readings (
  id BIGSERIAL PRIMARY KEY,
  owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  node_id TEXT NOT NULL REFERENCES public.nodes(id) ON DELETE CASCADE,
  sensor_id UUID REFERENCES public.sensors(id) ON DELETE SET NULL,
  sensor_type TEXT NOT NULL,
  value DOUBLE PRECISION NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.sensor_readings
  ADD COLUMN IF NOT EXISTS owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE public.sensor_readings
  ADD COLUMN IF NOT EXISTS node_id TEXT;

ALTER TABLE public.sensor_readings
  ADD COLUMN IF NOT EXISTS sensor_id UUID REFERENCES public.sensors(id) ON DELETE SET NULL;

ALTER TABLE public.sensor_readings
  ADD COLUMN IF NOT EXISTS sensor_type TEXT;

ALTER TABLE public.sensor_readings
  ADD COLUMN IF NOT EXISTS value DOUBLE PRECISION;

-- ---------------------------------------------------------------------------
-- Auto-create linked hardware when a node is registered.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.sync_node_components()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.node_type IN ('sub') THEN
    INSERT INTO public.sensors (owner_id, node_id, sensor_type, label, unit, is_visible)
    VALUES
      (NEW.owner_id, NEW.id, 'temperature', 'Temperature', 'C', true),
      (NEW.owner_id, NEW.id, 'humidity', 'Humidity', '%', true),
      (NEW.owner_id, NEW.id, 'soil_moisture', 'Soil Moisture', '%', true),
      (NEW.owner_id, NEW.id, 'light', 'Light', 'lux', true)
    ON CONFLICT (node_id, sensor_type) DO UPDATE
    SET
      owner_id = EXCLUDED.owner_id,
      label = EXCLUDED.label,
      unit = EXCLUDED.unit,
      is_visible = EXCLUDED.is_visible,
      updated_at = NOW();
  END IF;

  IF NEW.node_type IN ('main') THEN
    INSERT INTO public.actuators (owner_id, node_id, actuator_type, label, control_mode)
    VALUES
      (NEW.owner_id, NEW.id, 'misters', 'Misters / Foggers', 'manual'),
      (NEW.owner_id, NEW.id, 'shade_curtains', 'Shade Curtains', 'manual'),
      (NEW.owner_id, NEW.id, 'main_water_pump', 'Main Water Pump', 'manual'),
      (NEW.owner_id, NEW.id, 'air_circulation', 'Air Circulation', 'manual'),
      (NEW.owner_id, NEW.id, 'grow_light', 'Grow Light', 'manual'),
      (NEW.owner_id, NEW.id, 'exhaust_fan', 'Exhaust Fan', 'manual'),
      (NEW.owner_id, NEW.id, 'irrigation_pump', 'Irrigation Pump', 'manual'),
      (NEW.owner_id, NEW.id, 'fertilizer_pump', 'Fertilizer Pump', 'manual'),
      (NEW.owner_id, NEW.id, 'tank_filling_pump', 'Tank Filling Pump', 'manual'),
      (NEW.owner_id, NEW.id, 'fertilizer_mixer', 'Fertilizer Mixer', 'manual')
    ON CONFLICT (node_id, actuator_type) DO UPDATE
    SET
      owner_id = EXCLUDED.owner_id,
      label = EXCLUDED.label,
      control_mode = EXCLUDED.control_mode,
      updated_at = NOW();
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_sync_node_components ON public.nodes;
CREATE TRIGGER trg_sync_node_components
AFTER INSERT OR UPDATE OF node_type ON public.nodes
FOR EACH ROW
EXECUTE FUNCTION public.sync_node_components();

-- ---------------------------------------------------------------------------
-- RPCs for web app and ESP32
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.register_device_by_mac(
  p_mac_address TEXT,
  p_device_name TEXT,
  p_node_type TEXT,
  p_zone_name TEXT DEFAULT NULL,
  p_greenhouse_id UUID DEFAULT NULL
)
RETURNS TABLE (
  node_id TEXT,
  mac_address TEXT,
  zone_id UUID,
  node_type TEXT,
  registration_status TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_zone_id UUID;
  v_existing_owner UUID;
  v_mac TEXT;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  v_mac := upper(replace(trim(p_mac_address), ' ', ''));

  IF v_mac !~ '^[0-9A-F]{2}(:[0-9A-F]{2}){5}$' THEN
    RAISE EXCEPTION 'Invalid MAC address format';
  END IF;

  IF p_zone_name IS NOT NULL AND length(trim(p_zone_name)) > 0 THEN
    SELECT id
    INTO v_zone_id
    FROM public.zones
    WHERE owner_id = auth.uid()
      AND LOWER(name) = LOWER(trim(p_zone_name))
    LIMIT 1;

    IF v_zone_id IS NULL THEN
      INSERT INTO public.zones (owner_id, greenhouse_id, name)
      VALUES (auth.uid(), p_greenhouse_id, trim(p_zone_name))
      RETURNING id INTO v_zone_id;
    END IF;
  END IF;

  SELECT owner_id INTO v_existing_owner
  FROM public.nodes
  WHERE mac_address = v_mac
  LIMIT 1;

  IF FOUND AND v_existing_owner IS NOT NULL AND v_existing_owner <> auth.uid() THEN
    RAISE EXCEPTION 'This MAC address belongs to another user';
  END IF;

  INSERT INTO public.nodes (
    id,
    owner_id,
    greenhouse_id,
    zone_id,
    name,
    node_type,
    mac_address,
    is_online,
    registration_status,
    last_seen
  )
  VALUES (
    v_mac,
    auth.uid(),
    p_greenhouse_id,
    v_zone_id,
    COALESCE(NULLIF(trim(p_device_name), ''), v_mac),
    COALESCE(NULLIF(trim(p_node_type), ''), 'sub'),
    v_mac,
    true,
    'registered',
    NOW()
  )
  ON CONFLICT (id) DO UPDATE
  SET
    owner_id = EXCLUDED.owner_id,
    greenhouse_id = EXCLUDED.greenhouse_id,
    zone_id = EXCLUDED.zone_id,
    name = EXCLUDED.name,
    node_type = EXCLUDED.node_type,
    mac_address = EXCLUDED.mac_address,
    is_online = true,
    registration_status = 'registered',
    last_seen = NOW(),
    updated_at = NOW()
  RETURNING id, mac_address, zone_id, node_type, registration_status
  INTO node_id, mac_address, zone_id, node_type, registration_status;

  RETURN NEXT;
END;
$$;

CREATE OR REPLACE FUNCTION public.claim_device_by_mac(
  p_mac_address TEXT
)
RETURNS TABLE (
  node_id TEXT,
  owner_id UUID,
  node_type TEXT,
  zone_id UUID,
  registration_status TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.nodes
  SET is_online = true,
      last_seen = NOW(),
      registration_status = 'online',
      updated_at = NOW()
  WHERE mac_address = upper(trim(p_mac_address))
  RETURNING id, owner_id, node_type, zone_id, registration_status
  INTO node_id, owner_id, node_type, zone_id, registration_status;

  IF node_id IS NULL THEN
    RAISE EXCEPTION 'Device not registered';
  END IF;

  RETURN NEXT;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_device_actuators_by_mac(
  p_mac_address TEXT
)
RETURNS TABLE (
  id UUID,
  node_id TEXT,
  actuator_type TEXT,
  target_state JSONB,
  control_mode TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT a.id, a.node_id, a.actuator_type, a.target_state, a.control_mode
  FROM public.actuators a
  JOIN public.nodes n ON n.id = a.node_id
  WHERE n.mac_address = upper(trim(p_mac_address))
  ORDER BY a.actuator_type;
END;
$$;

CREATE OR REPLACE FUNCTION public.log_sensor_reading_by_mac(
  p_mac_address TEXT,
  p_sensor_type TEXT,
  p_value DOUBLE PRECISION
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_node_id TEXT;
  v_owner_id UUID;
  v_sensor_id UUID;
BEGIN
  SELECT id, owner_id
  INTO v_node_id, v_owner_id
  FROM public.nodes
  WHERE mac_address = upper(trim(p_mac_address))
  LIMIT 1;

  IF v_node_id IS NULL THEN
    RAISE EXCEPTION 'Device not registered';
  END IF;

  SELECT id
  INTO v_sensor_id
  FROM public.sensors
  WHERE node_id = v_node_id
    AND sensor_type = p_sensor_type
  LIMIT 1;

  IF v_sensor_id IS NULL THEN
    RAISE EXCEPTION 'Sensor % not registered for device', p_sensor_type;
  END IF;

  INSERT INTO public.sensor_readings (
    owner_id,
    node_id,
    sensor_id,
    sensor_type,
    value
  )
  VALUES (
    v_owner_id,
    v_node_id,
    v_sensor_id,
    p_sensor_type,
    p_value
  );

  UPDATE public.nodes
  SET is_online = true,
      last_seen = NOW(),
      registration_status = 'online',
      updated_at = NOW()
  WHERE id = v_node_id;
END;
$$;

-- ---------------------------------------------------------------------------
-- Row level security
-- ---------------------------------------------------------------------------
ALTER TABLE public.greenhouses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.zones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.nodes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sensors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.actuators ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sensor_readings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage own greenhouses" ON public.greenhouses;
CREATE POLICY "Users can manage own greenhouses"
ON public.greenhouses FOR ALL
TO authenticated
USING (auth.uid() = owner_id)
WITH CHECK (auth.uid() = owner_id);

DROP POLICY IF EXISTS "Users can manage own zones" ON public.zones;
CREATE POLICY "Users can manage own zones"
ON public.zones FOR ALL
TO authenticated
USING (auth.uid() = owner_id)
WITH CHECK (auth.uid() = owner_id);

DROP POLICY IF EXISTS "Users can manage own nodes" ON public.nodes;
CREATE POLICY "Users can manage own nodes"
ON public.nodes FOR ALL
TO authenticated
USING (auth.uid() = owner_id)
WITH CHECK (auth.uid() = owner_id);

DROP POLICY IF EXISTS "Users can manage own sensors" ON public.sensors;
CREATE POLICY "Users can manage own sensors"
ON public.sensors FOR ALL
TO authenticated
USING (auth.uid() = owner_id)
WITH CHECK (auth.uid() = owner_id);

DROP POLICY IF EXISTS "Users can manage own actuators" ON public.actuators;
CREATE POLICY "Users can manage own actuators"
ON public.actuators FOR ALL
TO authenticated
USING (auth.uid() = owner_id)
WITH CHECK (auth.uid() = owner_id);

DROP POLICY IF EXISTS "Users can manage own sensor readings" ON public.sensor_readings;
CREATE POLICY "Users can manage own sensor readings"
ON public.sensor_readings FOR SELECT
TO authenticated
USING (auth.uid() = owner_id);

-- ---------------------------------------------------------------------------
-- Grants
-- ---------------------------------------------------------------------------
GRANT USAGE ON SCHEMA public TO anon, authenticated;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.greenhouses TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.zones TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.nodes TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.sensors TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.actuators TO authenticated;
GRANT SELECT ON public.sensor_readings TO authenticated;

GRANT EXECUTE ON FUNCTION public.register_device_by_mac(TEXT, TEXT, TEXT, TEXT, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.claim_device_by_mac(TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_device_actuators_by_mac(TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.log_sensor_reading_by_mac(TEXT, TEXT, DOUBLE PRECISION) TO anon, authenticated;

COMMIT;
