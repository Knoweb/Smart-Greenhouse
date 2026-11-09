-- Multi-tenant greenhouse schema for Supabase
-- Goals:
-- 1) Each app user sees only their own greenhouse data
-- 2) A user can register ESP devices by MAC address
-- 3) Sensors and actuators are auto-created from a device profile
-- 4) Only the owning user can control their registered actuators
-- 5) ESP devices write readings through RPC functions, not direct table access

BEGIN;

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ---------------------------------------------------------------------------
-- Helper trigger
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
-- Users
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE,
  full_name TEXT,
  role TEXT NOT NULL DEFAULT 'owner' CHECK (role IN ('owner', 'manager', 'technician', 'viewer')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name')
  )
  ON CONFLICT (id) DO UPDATE
  SET email = EXCLUDED.email,
      full_name = COALESCE(EXCLUDED.full_name, public.profiles.full_name),
      updated_at = NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION public.handle_new_user();

-- ---------------------------------------------------------------------------
-- Greenhouses and zones
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.greenhouses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  location TEXT,
  timezone TEXT DEFAULT 'Asia/Colombo',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.zones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  greenhouse_id UUID REFERENCES public.greenhouses(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS greenhouses_owner_name_unique_idx
  ON public.greenhouses (owner_id, LOWER(name));

CREATE UNIQUE INDEX IF NOT EXISTS zones_owner_greenhouse_name_unique_idx
  ON public.zones (owner_id, greenhouse_id, LOWER(name));

CREATE INDEX IF NOT EXISTS greenhouses_owner_idx ON public.greenhouses (owner_id);
CREATE INDEX IF NOT EXISTS zones_owner_idx ON public.zones (owner_id);
CREATE INDEX IF NOT EXISTS zones_greenhouse_idx ON public.zones (greenhouse_id);

ALTER TABLE public.greenhouses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.zones ENABLE ROW LEVEL SECURITY;

DROP TRIGGER IF EXISTS set_greenhouses_updated_at ON public.greenhouses;
CREATE TRIGGER set_greenhouses_updated_at
BEFORE UPDATE ON public.greenhouses
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS set_zones_updated_at ON public.zones;
CREATE TRIGGER set_zones_updated_at
BEFORE UPDATE ON public.zones
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Device profiles
-- These define which sensors/actuators are created automatically per ESP board.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.node_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  label TEXT NOT NULL,
  node_kind TEXT NOT NULL CHECK (node_kind IN ('main', 'sensor', 'actuator', 'mixed')),
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.node_profile_sensors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES public.node_profiles(id) ON DELETE CASCADE,
  sensor_type TEXT NOT NULL,
  label TEXT NOT NULL,
  unit TEXT,
  measurement_key TEXT,
  is_visible BOOLEAN NOT NULL DEFAULT TRUE,
  sort_order INTEGER NOT NULL DEFAULT 0,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (profile_id, sensor_type)
);

CREATE TABLE IF NOT EXISTS public.node_profile_actuators (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES public.node_profiles(id) ON DELETE CASCADE,
  actuator_type TEXT NOT NULL,
  label TEXT NOT NULL,
  control_mode TEXT NOT NULL DEFAULT 'manual' CHECK (control_mode IN ('manual', 'auto', 'schedule')),
  is_controllable BOOLEAN NOT NULL DEFAULT TRUE,
  sort_order INTEGER NOT NULL DEFAULT 0,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (profile_id, actuator_type)
);

ALTER TABLE public.node_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.node_profile_sensors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.node_profile_actuators ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Read device profiles" ON public.node_profiles;
CREATE POLICY "Read device profiles"
ON public.node_profiles FOR SELECT
TO authenticated
USING (true);

DROP TRIGGER IF EXISTS set_node_profiles_updated_at ON public.node_profiles;
CREATE TRIGGER set_node_profiles_updated_at
BEFORE UPDATE ON public.node_profiles
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS set_node_profile_sensors_updated_at ON public.node_profile_sensors;
CREATE TRIGGER set_node_profile_sensors_updated_at
BEFORE UPDATE ON public.node_profile_sensors
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS set_node_profile_actuators_updated_at ON public.node_profile_actuators;
CREATE TRIGGER set_node_profile_actuators_updated_at
BEFORE UPDATE ON public.node_profile_actuators
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();

-- Seed common profiles. Re-running is safe.
INSERT INTO public.node_profiles (code, label, node_kind, description)
VALUES
  ('main_device', 'Main Device', 'mixed', 'Controller with both sensors and actuators'),
  ('sensor_node', 'Sensor Node', 'sensor', 'Read-only sensor ESP32'),
  ('actuator_node', 'Actuator Node', 'actuator', 'Relay / motor / valve controller'),
  ('custom_node', 'Custom Node', 'mixed', 'User-defined mixed hardware')
ON CONFLICT (code) DO NOTHING;

-- Main device sensors
INSERT INTO public.node_profile_sensors (profile_id, sensor_type, label, unit, measurement_key, sort_order)
SELECT id, sensor_type, label, unit, measurement_key, sort_order
FROM public.node_profiles p
CROSS JOIN (VALUES
  ('inside_temp', 'Inside Temperature', 'C', 'temp', 1),
  ('inside_hum', 'Inside Humidity', '%', 'humidity', 2),
  ('co2', 'CO2', 'ppm', 'co2', 3),
  ('soil_moisture', 'Soil Moisture', '%', 'soil_moisture', 4),
  ('ec_level', 'EC Level', 'mS/cm', 'ec', 5),
  ('rain', 'Rain Status', NULL, 'rain', 6)
) AS v(sensor_type, label, unit, measurement_key, sort_order)
WHERE p.code = 'main_device'
ON CONFLICT (profile_id, sensor_type) DO NOTHING;

-- Main device actuators
INSERT INTO public.node_profile_actuators (profile_id, actuator_type, label, control_mode, sort_order)
SELECT id, actuator_type, label, control_mode, sort_order
FROM public.node_profiles p
CROSS JOIN (VALUES
  ('main_pump', 'Main Water Pump', 'manual', 1),
  ('irrigation_pump', 'Irrigation Pump', 'schedule', 2),
  ('fertilizer_pump', 'Fertilizer Pump', 'schedule', 3),
  ('misters', 'Misters / Foggers', 'auto', 4),
  ('exhaust_fans', 'Exhaust Fans', 'auto', 5),
  ('air_fans', 'Air Circulation', 'manual', 6),
  ('curtains', 'Shade Curtains', 'schedule', 7)
) AS v(actuator_type, label, control_mode, sort_order)
WHERE p.code = 'main_device'
ON CONFLICT (profile_id, actuator_type) DO NOTHING;

-- Sensor node profile
INSERT INTO public.node_profile_sensors (profile_id, sensor_type, label, unit, measurement_key, sort_order)
SELECT id, sensor_type, label, unit, measurement_key, sort_order
FROM public.node_profiles p
CROSS JOIN (VALUES
  ('temperature', 'Temperature', 'C', 'temp', 1),
  ('humidity', 'Humidity', '%', 'humidity', 2),
  ('soil_moisture', 'Soil Moisture', '%', 'soil_moisture', 3),
  ('light', 'Light', 'lux', 'light', 4),
  ('water_level', 'Water Level', '%', 'water_level', 5)
) AS v(sensor_type, label, unit, measurement_key, sort_order)
WHERE p.code = 'sensor_node'
ON CONFLICT (profile_id, sensor_type) DO NOTHING;

-- Actuator node profile
INSERT INTO public.node_profile_actuators (profile_id, actuator_type, label, control_mode, sort_order)
SELECT id, actuator_type, label, control_mode, sort_order
FROM public.node_profiles p
CROSS JOIN (VALUES
  ('pump', 'Pump', 'manual', 1),
  ('fan', 'Fan', 'manual', 2),
  ('valve', 'Valve', 'schedule', 3),
  ('light', 'Grow Light', 'schedule', 4)
) AS v(actuator_type, label, control_mode, sort_order)
WHERE p.code = 'actuator_node'
ON CONFLICT (profile_id, actuator_type) DO NOTHING;

-- ---------------------------------------------------------------------------
-- Devices
-- nodes = ESP32 boards registered by MAC address
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.nodes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  greenhouse_id UUID REFERENCES public.greenhouses(id) ON DELETE SET NULL,
  zone_id UUID REFERENCES public.zones(id) ON DELETE SET NULL,
  profile_id UUID NOT NULL REFERENCES public.node_profiles(id),
  name TEXT NOT NULL,
  node_type TEXT NOT NULL CHECK (node_type IN ('main', 'sensor', 'actuator', 'mixed')),
  mac_address TEXT NOT NULL,
  registration_status TEXT NOT NULL DEFAULT 'pending' CHECK (registration_status IN ('pending', 'registered', 'online', 'offline', 'disabled')),
  device_secret_hash TEXT,
  firmware_version TEXT,
  ip_address INET,
  last_seen TIMESTAMPTZ,
  registered_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS nodes_mac_unique_idx
  ON public.nodes (mac_address);

CREATE INDEX IF NOT EXISTS nodes_owner_idx ON public.nodes (owner_id);
CREATE INDEX IF NOT EXISTS nodes_zone_idx ON public.nodes (zone_id);
CREATE INDEX IF NOT EXISTS nodes_profile_idx ON public.nodes (profile_id);
CREATE INDEX IF NOT EXISTS nodes_status_idx ON public.nodes (registration_status);

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

ALTER TABLE public.nodes ENABLE ROW LEVEL SECURITY;

DROP TRIGGER IF EXISTS set_nodes_updated_at ON public.nodes;
CREATE TRIGGER set_nodes_updated_at
BEFORE UPDATE ON public.nodes
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();

-- Automatically create sensors/actuators for a newly registered device.
CREATE OR REPLACE FUNCTION public.sync_node_components()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.sensors (owner_id, node_id, sensor_type, label, unit, measurement_key, is_visible, metadata)
  SELECT
    NEW.owner_id,
    NEW.id,
    p.sensor_type,
    p.label,
    p.unit,
    p.measurement_key,
    p.is_visible,
    p.metadata
  FROM public.node_profile_sensors p
  WHERE p.profile_id = NEW.profile_id
  ON CONFLICT (node_id, sensor_type) DO UPDATE
  SET
    owner_id = EXCLUDED.owner_id,
    label = EXCLUDED.label,
    unit = EXCLUDED.unit,
    measurement_key = EXCLUDED.measurement_key,
    is_visible = EXCLUDED.is_visible,
    metadata = EXCLUDED.metadata,
    updated_at = NOW();

  INSERT INTO public.actuators (owner_id, node_id, actuator_type, label, control_mode, is_controllable, metadata)
  SELECT
    NEW.owner_id,
    NEW.id,
    p.actuator_type,
    p.label,
    p.control_mode,
    p.is_controllable,
    p.metadata
  FROM public.node_profile_actuators p
  WHERE p.profile_id = NEW.profile_id
  ON CONFLICT (node_id, actuator_type) DO UPDATE
  SET
    owner_id = EXCLUDED.owner_id,
    label = EXCLUDED.label,
    control_mode = EXCLUDED.control_mode,
    is_controllable = EXCLUDED.is_controllable,
    metadata = EXCLUDED.metadata,
    updated_at = NOW();

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_sync_node_components ON public.nodes;
CREATE TRIGGER trg_sync_node_components
AFTER INSERT OR UPDATE OF profile_id ON public.nodes
FOR EACH ROW
EXECUTE FUNCTION public.sync_node_components();

-- ---------------------------------------------------------------------------
-- Sensors
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.sensors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  node_id UUID NOT NULL REFERENCES public.nodes(id) ON DELETE CASCADE,
  sensor_type TEXT NOT NULL,
  label TEXT NOT NULL,
  unit TEXT,
  measurement_key TEXT,
  pin_label TEXT,
  is_visible BOOLEAN NOT NULL DEFAULT TRUE,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS sensors_node_type_unique_idx
  ON public.sensors (node_id, sensor_type);

CREATE INDEX IF NOT EXISTS sensors_owner_idx ON public.sensors (owner_id);
CREATE INDEX IF NOT EXISTS sensors_node_idx ON public.sensors (node_id);

ALTER TABLE public.sensors ENABLE ROW LEVEL SECURITY;

DROP TRIGGER IF EXISTS set_sensors_updated_at ON public.sensors;
CREATE TRIGGER set_sensors_updated_at
BEFORE UPDATE ON public.sensors
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Sensor readings
-- Devices insert readings through RPC to keep the write path secure.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.sensor_readings (
  id BIGSERIAL PRIMARY KEY,
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  node_id UUID NOT NULL REFERENCES public.nodes(id) ON DELETE CASCADE,
  sensor_id UUID REFERENCES public.sensors(id) ON DELETE SET NULL,
  sensor_type TEXT NOT NULL,
  numeric_value DOUBLE PRECISION,
  text_value TEXT,
  raw_payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  recorded_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS sensor_readings_owner_time_idx
  ON public.sensor_readings (owner_id, recorded_at DESC);

CREATE INDEX IF NOT EXISTS sensor_readings_node_time_idx
  ON public.sensor_readings (node_id, recorded_at DESC);

CREATE INDEX IF NOT EXISTS sensor_readings_sensor_time_idx
  ON public.sensor_readings (sensor_id, recorded_at DESC);

ALTER TABLE public.sensor_readings ENABLE ROW LEVEL SECURITY;

-- ---------------------------------------------------------------------------
-- Actuators
-- Only the owner can view/control their actuators.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.actuators (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  node_id UUID NOT NULL REFERENCES public.nodes(id) ON DELETE CASCADE,
  actuator_type TEXT NOT NULL,
  label TEXT NOT NULL,
  control_mode TEXT NOT NULL DEFAULT 'manual' CHECK (control_mode IN ('manual', 'auto', 'schedule')),
  desired_state JSONB NOT NULL DEFAULT '{"on": false}'::jsonb,
  actual_state JSONB NOT NULL DEFAULT '{"on": false}'::jsonb,
  is_controllable BOOLEAN NOT NULL DEFAULT TRUE,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS actuators_node_type_unique_idx
  ON public.actuators (node_id, actuator_type);

CREATE INDEX IF NOT EXISTS actuators_owner_idx ON public.actuators (owner_id);
CREATE INDEX IF NOT EXISTS actuators_node_idx ON public.actuators (node_id);

ALTER TABLE public.actuators ENABLE ROW LEVEL SECURITY;

DROP TRIGGER IF EXISTS set_actuators_updated_at ON public.actuators;
CREATE TRIGGER set_actuators_updated_at
BEFORE UPDATE ON public.actuators
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE IF NOT EXISTS public.actuator_commands (
  id BIGSERIAL PRIMARY KEY,
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  node_id UUID NOT NULL REFERENCES public.nodes(id) ON DELETE CASCADE,
  actuator_id UUID REFERENCES public.actuators(id) ON DELETE SET NULL,
  actuator_type TEXT NOT NULL,
  desired_state JSONB NOT NULL,
  command_source TEXT NOT NULL DEFAULT 'web' CHECK (command_source IN ('web', 'automation', 'schedule', 'device')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'applied', 'failed', 'cancelled')),
  issued_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  issued_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  applied_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS actuator_commands_owner_time_idx
  ON public.actuator_commands (owner_id, issued_at DESC);

CREATE INDEX IF NOT EXISTS actuator_commands_node_status_idx
  ON public.actuator_commands (node_id, status);

ALTER TABLE public.actuator_commands ENABLE ROW LEVEL SECURITY;

-- ---------------------------------------------------------------------------
-- RPC functions
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.register_device(
  p_mac_address TEXT,
  p_device_name TEXT,
  p_profile_code TEXT,
  p_node_type TEXT DEFAULT 'mixed',
  p_greenhouse_id UUID DEFAULT NULL,
  p_zone_id UUID DEFAULT NULL
)
RETURNS TABLE (device_id UUID, device_secret TEXT)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_profile_id UUID;
  v_existing_owner UUID;
  v_secret TEXT;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  SELECT id INTO v_profile_id
  FROM public.node_profiles
  WHERE code = p_profile_code;

  IF v_profile_id IS NULL THEN
    RAISE EXCEPTION 'Unknown device profile: %', p_profile_code;
  END IF;

  v_secret := replace(gen_random_uuid()::text, '-', '');

  SELECT owner_id INTO v_existing_owner
  FROM public.nodes
  WHERE mac_address = upper(p_mac_address);

  IF FOUND AND v_existing_owner <> auth.uid() THEN
    RAISE EXCEPTION 'This MAC address is already registered by another user';
  END IF;

  INSERT INTO public.nodes (
    owner_id,
    greenhouse_id,
    zone_id,
    profile_id,
    name,
    node_type,
    mac_address,
    registration_status,
    device_secret_hash
  )
  VALUES (
    auth.uid(),
    p_greenhouse_id,
    p_zone_id,
    v_profile_id,
    p_device_name,
    p_node_type,
    upper(p_mac_address),
    'registered',
    encode(digest(v_secret, 'sha256'), 'hex')
  )
  ON CONFLICT (mac_address) DO UPDATE
  SET
    owner_id = EXCLUDED.owner_id,
    greenhouse_id = EXCLUDED.greenhouse_id,
    zone_id = EXCLUDED.zone_id,
    profile_id = EXCLUDED.profile_id,
    name = EXCLUDED.name,
    node_type = EXCLUDED.node_type,
    registration_status = 'registered',
    device_secret_hash = EXCLUDED.device_secret_hash,
    updated_at = NOW()
  RETURNING public.nodes.id INTO device_id;

  device_secret := v_secret;

  RETURN NEXT;
END;
$$;

CREATE OR REPLACE FUNCTION public.claim_device(
  p_mac_address TEXT,
  p_device_secret TEXT,
  p_firmware_version TEXT DEFAULT NULL,
  p_ip_address INET DEFAULT NULL
)
RETURNS TABLE (
  node_id UUID,
  owner_id UUID,
  profile_id UUID,
  name TEXT,
  node_type TEXT,
  greenhouse_id UUID,
  zone_id UUID,
  registration_status TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_row public.nodes%ROWTYPE;
BEGIN
  SELECT *
  INTO v_row
  FROM public.nodes
  WHERE mac_address = upper(p_mac_address)
    AND device_secret_hash = encode(digest(p_device_secret, 'sha256'), 'hex')
  LIMIT 1;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Invalid device credentials';
  END IF;

  UPDATE public.nodes
  SET
    firmware_version = COALESCE(p_firmware_version, firmware_version),
    ip_address = COALESCE(p_ip_address, ip_address),
    last_seen = NOW(),
    registration_status = 'online',
    updated_at = NOW()
  WHERE id = v_row.id
  RETURNING
    id, owner_id, profile_id, name, node_type, greenhouse_id, zone_id, registration_status
  INTO node_id, owner_id, profile_id, name, node_type, greenhouse_id, zone_id, registration_status;

  RETURN NEXT;
END;
$$;

CREATE OR REPLACE FUNCTION public.log_sensor_reading(
  p_mac_address TEXT,
  p_device_secret TEXT,
  p_sensor_type TEXT,
  p_numeric_value DOUBLE PRECISION DEFAULT NULL,
  p_text_value TEXT DEFAULT NULL,
  p_raw_payload JSONB DEFAULT '{}'::jsonb
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_node public.nodes%ROWTYPE;
  v_sensor_id UUID;
BEGIN
  SELECT *
  INTO v_node
  FROM public.nodes
  WHERE mac_address = upper(p_mac_address)
    AND device_secret_hash = encode(digest(p_device_secret, 'sha256'), 'hex')
    AND registration_status IN ('registered', 'online')
  LIMIT 1;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Unknown, inactive, or unauthorized device';
  END IF;

  SELECT id
  INTO v_sensor_id
  FROM public.sensors
  WHERE node_id = v_node.id
    AND sensor_type = p_sensor_type
  LIMIT 1;

  IF v_sensor_id IS NULL THEN
    RAISE EXCEPTION 'Sensor % is not registered for device %', p_sensor_type, p_mac_address;
  END IF;

  INSERT INTO public.sensor_readings (
    owner_id,
    node_id,
    sensor_id,
    sensor_type,
    numeric_value,
    text_value,
    raw_payload
  )
  VALUES (
    v_node.owner_id,
    v_node.id,
    v_sensor_id,
    p_sensor_type,
    p_numeric_value,
    p_text_value,
    COALESCE(p_raw_payload, '{}'::jsonb)
  );

  UPDATE public.nodes
  SET last_seen = NOW(), registration_status = 'online', updated_at = NOW()
  WHERE id = v_node.id;
END;
$$;

CREATE OR REPLACE FUNCTION public.push_actuator_command(
  p_actuator_id UUID,
  p_desired_state JSONB,
  p_command_source TEXT DEFAULT 'web'
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_node_id UUID;
  v_owner_id UUID;
  v_command_id UUID;
  v_actuator_type TEXT;
BEGIN
  SELECT node_id, owner_id, actuator_type
  INTO v_node_id, v_owner_id, v_actuator_type
  FROM public.actuators
  WHERE id = p_actuator_id;

  IF v_node_id IS NULL THEN
    RAISE EXCEPTION 'Actuator not found';
  END IF;

  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  IF v_owner_id <> auth.uid() THEN
    RAISE EXCEPTION 'You cannot control an actuator that does not belong to you';
  END IF;

  INSERT INTO public.actuator_commands (
    owner_id,
    node_id,
    actuator_id,
    actuator_type,
    desired_state,
    command_source,
    issued_by
  )
  VALUES (
    v_owner_id,
    v_node_id,
    p_actuator_id,
    v_actuator_type,
    p_desired_state,
    p_command_source,
    auth.uid()
  )
  RETURNING id INTO v_command_id;

  UPDATE public.actuators
  SET desired_state = p_desired_state,
      updated_at = NOW()
  WHERE id = p_actuator_id;

  RETURN v_command_id;
END;
$$;

-- ---------------------------------------------------------------------------
-- Row level security policies
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "Users can manage own profile" ON public.profiles;
CREATE POLICY "Users can manage own profile"
ON public.profiles FOR ALL
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

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

DROP POLICY IF EXISTS "Users can read own sensors" ON public.sensors;
CREATE POLICY "Users can read own sensors"
ON public.sensors FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.nodes n
    WHERE n.id = sensors.node_id
      AND n.owner_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Users can manage own sensors" ON public.sensors;
CREATE POLICY "Users can manage own sensors"
ON public.sensors FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.nodes n
    WHERE n.id = sensors.node_id
      AND n.owner_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.nodes n
    WHERE n.id = sensors.node_id
      AND n.owner_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Users can read own sensor readings" ON public.sensor_readings;
CREATE POLICY "Users can read own sensor readings"
ON public.sensor_readings FOR SELECT
TO authenticated
USING (auth.uid() = owner_id);

DROP POLICY IF EXISTS "Users can manage own actuator commands" ON public.actuator_commands;
CREATE POLICY "Users can manage own actuator commands"
ON public.actuator_commands FOR ALL
TO authenticated
USING (auth.uid() = owner_id)
WITH CHECK (auth.uid() = owner_id);

DROP POLICY IF EXISTS "Users can manage own actuators" ON public.actuators;
CREATE POLICY "Users can manage own actuators"
ON public.actuators FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.nodes n
    WHERE n.id = actuators.node_id
      AND n.owner_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.nodes n
    WHERE n.id = actuators.node_id
      AND n.owner_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Profiles read own row" ON public.profiles;
DROP POLICY IF EXISTS "Greenhouses read own row" ON public.greenhouses;
DROP POLICY IF EXISTS "Zones read own row" ON public.zones;
DROP POLICY IF EXISTS "Nodes read own row" ON public.nodes;
DROP POLICY IF EXISTS "Sensors read own row" ON public.sensors;
DROP POLICY IF EXISTS "Actuators read own row" ON public.actuators;
DROP POLICY IF EXISTS "Actuator commands read own row" ON public.actuator_commands;
DROP POLICY IF EXISTS "Sensor readings read own row" ON public.sensor_readings;

-- RPC functions are the intended write path for ESP devices.
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT SELECT ON public.node_profiles TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.greenhouses TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.zones TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.nodes TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.sensors TO authenticated;
GRANT SELECT ON public.sensor_readings TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.actuators TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.actuator_commands TO authenticated;

GRANT EXECUTE ON FUNCTION public.register_device(TEXT, TEXT, TEXT, TEXT, UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.claim_device(TEXT, TEXT, TEXT, INET) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.log_sensor_reading(TEXT, TEXT, TEXT, DOUBLE PRECISION, TEXT, JSONB) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.push_actuator_command(UUID, JSONB, TEXT) TO authenticated;

COMMIT;
