-- Cleanup old tables if they exist
DROP TABLE IF EXISTS public.automation_rules CASCADE;
DROP TABLE IF EXISTS public.actuator_schedules CASCADE;
DROP TABLE IF EXISTS public.actuators CASCADE;
DROP TABLE IF EXISTS public.sensor_readings CASCADE;
DROP TABLE IF EXISTS public.sensors CASCADE;
DROP TABLE IF EXISTS public.nodes CASCADE;
DROP TABLE IF EXISTS public.zones CASCADE;
DROP TABLE IF EXISTS public.alerts CASCADE;
DROP TABLE IF EXISTS public.recipes CASCADE;

-- 1. Zones Table (e.g., Zone A, Zone B, Seedling Area)
CREATE TABLE public.zones (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Nodes Table (Your ESP32 controllers)
-- id will be your Node ID (e.g., "SUB_ESP_01", "MAIN_ESP_01")
CREATE TABLE public.nodes (
    id TEXT PRIMARY KEY, 
    name TEXT NOT NULL,
    node_type TEXT NOT NULL CHECK (node_type IN ('sub', 'main')),
    zone_id UUID REFERENCES public.zones(id) ON DELETE SET NULL,
    is_online BOOLEAN DEFAULT FALSE,
    last_seen TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Sensors Table (Attached to sub-nodes)
CREATE TABLE public.sensors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    node_id TEXT REFERENCES public.nodes(id) ON DELETE CASCADE,
    sensor_type TEXT NOT NULL, -- e.g., 'temp', 'hum', 'co2', 'npk_n', 'npk_p', 'npk_k', 'soil_moisture', 'rain', 'water_level', 'fert_level', 'ec', 'ph'
    label TEXT, -- e.g., "Outside Temperature"
    unit TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Sensor Readings (Historical data for real-time charts)
CREATE TABLE public.sensor_readings (
    id BIGSERIAL PRIMARY KEY,
    sensor_id UUID REFERENCES public.sensors(id) ON DELETE CASCADE,
    value FLOAT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Actuators Table (Attached to main-nodes)
CREATE TABLE public.actuators (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    node_id TEXT REFERENCES public.nodes(id) ON DELETE CASCADE,
    actuator_type TEXT NOT NULL, -- e.g., 'pump', 'fan', 'motor', 'light'
    label TEXT,
    control_mode TEXT DEFAULT 'manual' CHECK (control_mode IN ('auto', 'manual', 'schedule')),
    target_state JSONB DEFAULT '{"on": false}', -- What the web dashboard wants
    actual_state JSONB DEFAULT '{"on": false}', -- What the ESP32 reports back
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Actuator Schedules (For 'schedule' mode)
CREATE TABLE public.actuator_schedules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    actuator_id UUID REFERENCES public.actuators(id) ON DELETE CASCADE,
    start_time TIME NOT NULL,
    duration_seconds INTEGER NOT NULL,
    days_of_week TEXT[] DEFAULT '{Mon,Tue,Wed,Thu,Fri,Sat,Sun}',
    scheduled_date DATE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Automation Rules (For 'auto' mode)
CREATE TABLE public.automation_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    actuator_id UUID REFERENCES public.actuators(id) ON DELETE CASCADE,
    sensor_id UUID REFERENCES public.sensors(id) ON DELETE CASCADE,
    operator TEXT CHECK (operator IN ('>', '<', '>=', '<=', '=')),
    threshold FLOAT NOT NULL,
    action_state JSONB NOT NULL, -- e.g., '{"on": true}'
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. General Alerts
CREATE TABLE public.alerts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    level TEXT NOT NULL,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    is_resolved BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Initial Data Setup
-- Add a default zone
INSERT INTO public.zones (name, description) VALUES ('Main House', 'Primary greenhouse area');

-- I will let you populate the nodes and sensors based on your specific IDs, 
-- but here is an example of how your 5 Sub-ESPs would look:
-- INSERT INTO public.nodes (id, name, node_type, zone_id) VALUES ('SUB_ESP_1', 'Outdoor Station', 'sub', (SELECT id FROM public.zones LIMIT 1));
-- ... and so on for all 5.

-- Enable RLS
ALTER TABLE public.zones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.nodes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sensors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sensor_readings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.actuators ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.actuator_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.automation_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.alerts ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Public Read Access" ON public.zones FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Public Read Access" ON public.nodes FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Public Read Access" ON public.sensors FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Public Read Access" ON public.sensor_readings FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Public Read Access" ON public.actuators FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Full Access for Authenticated" ON public.actuators FOR ALL TO authenticated USING (true);
CREATE POLICY "Full Access for Authenticated" ON public.sensor_readings FOR ALL TO authenticated USING (true);
-- (Add more policies as needed for security)
