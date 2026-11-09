-- Multi-user auth + device ownership schema for the greenhouse dashboard
-- Run this in Supabase SQL editor before using the login-based dashboard.

BEGIN;

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  full_name TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email)
  VALUES (NEW.id, NEW.email)
  ON CONFLICT (id) DO UPDATE
  SET email = EXCLUDED.email,
      updated_at = NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION public.handle_new_user();

DO $$
DECLARE
  table_name TEXT;
BEGIN
  FOREACH table_name IN ARRAY ARRAY['zones', 'nodes', 'alerts', 'lighting_profiles', 'greenhouse_designs']
  LOOP
    EXECUTE format('ALTER TABLE public.%I ADD COLUMN IF NOT EXISTS owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE', table_name);
  END LOOP;
END $$;

ALTER TABLE public.zones ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE public.nodes ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE public.nodes ADD COLUMN IF NOT EXISTS mac_address TEXT;

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS set_profiles_updated_at ON public.profiles;
CREATE TRIGGER set_profiles_updated_at
BEFORE UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS set_zones_updated_at ON public.zones;
CREATE TRIGGER set_zones_updated_at
BEFORE UPDATE ON public.zones
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS set_nodes_updated_at ON public.nodes;
CREATE TRIGGER set_nodes_updated_at
BEFORE UPDATE ON public.nodes
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();

CREATE UNIQUE INDEX IF NOT EXISTS zones_owner_name_unique_idx
  ON public.zones (owner_id, LOWER(name));

CREATE UNIQUE INDEX IF NOT EXISTS nodes_owner_mac_unique_idx
  ON public.nodes (owner_id, mac_address)
  WHERE mac_address IS NOT NULL;

CREATE INDEX IF NOT EXISTS nodes_owner_id_idx ON public.nodes (owner_id);
CREATE INDEX IF NOT EXISTS zones_owner_id_idx ON public.zones (owner_id);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'nodes_mac_address_format_chk'
  ) THEN
    ALTER TABLE public.nodes
      ADD CONSTRAINT nodes_mac_address_format_chk
      CHECK (mac_address IS NULL OR mac_address ~ '^[0-9A-F]{2}(:[0-9A-F]{2}){5}$');
  END IF;
END $$;

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.zones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.nodes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sensors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sensor_readings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.actuators ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.actuator_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.automation_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lighting_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lighting_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.greenhouse_designs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage own profile" ON public.profiles;
CREATE POLICY "Users can manage own profile"
ON public.profiles FOR ALL
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

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
    FROM public.nodes
    WHERE nodes.id = sensors.node_id
      AND nodes.owner_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Devices can insert sensors" ON public.sensors;
CREATE POLICY "Devices can insert sensors"
ON public.sensors FOR INSERT
TO anon, authenticated
WITH CHECK (true);

DROP POLICY IF EXISTS "Users can read own sensor readings" ON public.sensor_readings;
CREATE POLICY "Users can read own sensor readings"
ON public.sensor_readings FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.sensors
    JOIN public.nodes ON nodes.id = sensors.node_id
    WHERE sensors.id = sensor_readings.sensor_id
      AND nodes.owner_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Devices can insert sensor readings" ON public.sensor_readings;
CREATE POLICY "Devices can insert sensor readings"
ON public.sensor_readings FOR INSERT
TO anon, authenticated
WITH CHECK (true);

DROP POLICY IF EXISTS "Users can manage own actuators" ON public.actuators;
CREATE POLICY "Users can manage own actuators"
ON public.actuators FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.nodes
    WHERE nodes.id = actuators.node_id
      AND nodes.owner_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.nodes
    WHERE nodes.id = actuators.node_id
      AND nodes.owner_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Users can manage own actuator schedules" ON public.actuator_schedules;
CREATE POLICY "Users can manage own actuator schedules"
ON public.actuator_schedules FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.actuators
    JOIN public.nodes ON nodes.id = actuators.node_id
    WHERE actuators.id = actuator_schedules.actuator_id
      AND nodes.owner_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.actuators
    JOIN public.nodes ON nodes.id = actuators.node_id
    WHERE actuators.id = actuator_schedules.actuator_id
      AND nodes.owner_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Users can manage own automation rules" ON public.automation_rules;
CREATE POLICY "Users can manage own automation rules"
ON public.automation_rules FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.actuators
    JOIN public.nodes ON nodes.id = actuators.node_id
    WHERE actuators.id = automation_rules.actuator_id
      AND nodes.owner_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.actuators
    JOIN public.nodes ON nodes.id = actuators.node_id
    WHERE actuators.id = automation_rules.actuator_id
      AND nodes.owner_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Users can manage own alerts" ON public.alerts;
CREATE POLICY "Users can manage own alerts"
ON public.alerts FOR ALL
TO authenticated
USING (auth.uid() = owner_id)
WITH CHECK (auth.uid() = owner_id);

DROP POLICY IF EXISTS "Users can manage own lighting profiles" ON public.lighting_profiles;
CREATE POLICY "Users can manage own lighting profiles"
ON public.lighting_profiles FOR ALL
TO authenticated
USING (auth.uid() = owner_id)
WITH CHECK (auth.uid() = owner_id);

DROP POLICY IF EXISTS "Users can manage own lighting schedules" ON public.lighting_schedules;
CREATE POLICY "Users can manage own lighting schedules"
ON public.lighting_schedules FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.actuators
    JOIN public.nodes ON nodes.id = actuators.node_id
    WHERE actuators.id = lighting_schedules.actuator_id
      AND nodes.owner_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.actuators
    JOIN public.nodes ON nodes.id = actuators.node_id
    WHERE actuators.id = lighting_schedules.actuator_id
      AND nodes.owner_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Users can manage own greenhouse designs" ON public.greenhouse_designs;
CREATE POLICY "Users can manage own greenhouse designs"
ON public.greenhouse_designs FOR ALL
TO authenticated
USING (auth.uid() = owner_id)
WITH CHECK (auth.uid() = owner_id);

GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON TABLE public.profiles TO authenticated;
GRANT ALL ON TABLE public.zones TO authenticated;
GRANT ALL ON TABLE public.nodes TO authenticated;
GRANT ALL ON TABLE public.sensors TO anon, authenticated;
GRANT ALL ON TABLE public.sensor_readings TO anon, authenticated;
GRANT ALL ON TABLE public.actuators TO authenticated;
GRANT ALL ON TABLE public.actuator_schedules TO authenticated;
GRANT ALL ON TABLE public.automation_rules TO authenticated;
GRANT ALL ON TABLE public.alerts TO authenticated;
GRANT ALL ON TABLE public.lighting_profiles TO authenticated;
GRANT ALL ON TABLE public.lighting_schedules TO authenticated;
GRANT ALL ON TABLE public.greenhouse_designs TO authenticated;

COMMIT;
