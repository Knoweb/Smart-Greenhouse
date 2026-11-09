-- Device registration support for Settings > Device Register
-- Run this in Supabase SQL editor.

BEGIN;

-- Zones must be reusable by typed name from the dashboard.
ALTER TABLE public.zones
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

UPDATE public.zones
SET updated_at = COALESCE(updated_at, created_at, NOW())
WHERE updated_at IS NULL;

-- Devices are stored in public.nodes. Add registration-specific fields.
ALTER TABLE public.nodes
  ADD COLUMN IF NOT EXISTS mac_address TEXT,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

UPDATE public.nodes
SET
  mac_address = COALESCE(
    mac_address,
    CASE
      WHEN id ~ '^ESP32_[0-9A-F]{12}$'
        THEN
          SUBSTRING(replace(id, 'ESP32_', '') FROM 1 FOR 2) || ':' ||
          SUBSTRING(replace(id, 'ESP32_', '') FROM 3 FOR 2) || ':' ||
          SUBSTRING(replace(id, 'ESP32_', '') FROM 5 FOR 2) || ':' ||
          SUBSTRING(replace(id, 'ESP32_', '') FROM 7 FOR 2) || ':' ||
          SUBSTRING(replace(id, 'ESP32_', '') FROM 9 FOR 2) || ':' ||
          SUBSTRING(replace(id, 'ESP32_', '') FROM 11 FOR 2)
      ELSE NULL
    END
  ),
  updated_at = COALESCE(updated_at, created_at, NOW());

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'nodes_mac_address_format_chk'
  ) THEN
    ALTER TABLE public.nodes
      ADD CONSTRAINT nodes_mac_address_format_chk
      CHECK (mac_address ~ '^[0-9A-F]{2}(:[0-9A-F]{2}){5}$');
  END IF;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS nodes_mac_address_unique_idx
  ON public.nodes (mac_address)
  WHERE mac_address IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS zones_name_lower_unique_idx
  ON public.zones (LOWER(name));

CREATE INDEX IF NOT EXISTS nodes_zone_id_idx ON public.nodes (zone_id);
CREATE INDEX IF NOT EXISTS nodes_node_type_idx ON public.nodes (node_type);

-- Keep updated_at fresh on updates.
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

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

ALTER TABLE public.zones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.nodes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public Read Access" ON public.zones;
DROP POLICY IF EXISTS "Public Read Access" ON public.nodes;
DROP POLICY IF EXISTS "Allow anon select on nodes" ON public.nodes;
DROP POLICY IF EXISTS "Allow anon insert on nodes" ON public.nodes;
DROP POLICY IF EXISTS "Allow anon update on nodes" ON public.nodes;
DROP POLICY IF EXISTS "Full access for anon on nodes" ON public.nodes;
DROP POLICY IF EXISTS "Allow anon select on zones" ON public.zones;
DROP POLICY IF EXISTS "Full access for anon on zones" ON public.zones;

CREATE POLICY "Device registration read zones"
ON public.zones FOR SELECT
TO anon, authenticated
USING (true);

CREATE POLICY "Device registration write zones"
ON public.zones FOR ALL
TO anon, authenticated
USING (true)
WITH CHECK (true);

CREATE POLICY "Device registration read nodes"
ON public.nodes FOR SELECT
TO anon, authenticated
USING (true);

CREATE POLICY "Device registration write nodes"
ON public.nodes FOR ALL
TO anon, authenticated
USING (true)
WITH CHECK (true);

GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON TABLE public.zones TO anon, authenticated;
GRANT ALL ON TABLE public.nodes TO anon, authenticated;

COMMIT;
