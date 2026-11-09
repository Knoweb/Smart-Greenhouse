-- Create sensors_data table
CREATE TABLE public.sensors_data (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    inside_temp FLOAT,
    outside_temp FLOAT,
    inside_hum FLOAT,
    outside_hum FLOAT,
    light FLOAT,
    co2 FLOAT,
    soil_moisture FLOAT,
    rain BOOLEAN,
    ec_level FLOAT,
    nitrogen FLOAT,
    phosphorus FLOAT,
    potassium FLOAT,
    water_tank FLOAT,
    fertilizer_tank FLOAT
);

-- Create devices table
CREATE TABLE public.devices (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    type TEXT NOT NULL,
    is_on BOOLEAN DEFAULT FALSE,
    mode TEXT DEFAULT 'manual',
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert initial devices
INSERT INTO public.devices (id, name, type, is_on, mode) VALUES
('mainPump',        'Main Water Pump',   'irrigation',  FALSE, 'manual'),
('irrigationZone1', 'Zone 1 Irrigation', 'irrigation',  FALSE, 'manual'),
('irrigationZone2', 'Zone 2 Irrigation', 'irrigation',  FALSE, 'manual'),
('irrigationZone3', 'Zone 3 Irrigation', 'irrigation',  FALSE, 'manual'),
('foggers',         'Mist Foggers',      'irrigation',  FALSE, 'manual'),
('airFans',         'Air Circulation',   'ventilation', TRUE,  'schedule'),
('curtains',        'Shade Curtains',    'lighting',    FALSE, 'schedule');

-- Create schedules table
CREATE TABLE public.schedules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    device_id TEXT REFERENCES public.devices(id) ON DELETE CASCADE,
    start_time TIME NOT NULL,
    duration_minutes INTEGER NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert initial schedules
INSERT INTO public.schedules (device_id, start_time, duration_minutes, is_active) VALUES
('airFans', '00:00', 5, TRUE);

-- Create recipes table
CREATE TABLE public.recipes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    n FLOAT,
    p FLOAT,
    k FLOAT,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert initial recipes
INSERT INTO public.recipes (name, n, p, k, notes) VALUES
('Seedling Stage',    10, 52, 10, 'Low concentration, high P for root growth.'),
('Vegetative Growth', 25, 20, 20, 'Balanced NPK for leaf and stem growth.'),
('Fruiting Stage',    12, 12, 36, 'High K for fruit development and quality.');

-- Create alerts table
CREATE TABLE public.alerts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    level TEXT NOT NULL,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    is_resolved BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert sample alerts
INSERT INTO public.alerts (level, title, message, is_resolved) VALUES
('critical', 'High Temperature Detected', 'Inside temp reached 31.2°C. Exhaust fans triggered.', FALSE),
('warning',  'Low Water Tank Level',      'Main water tank at 18%. Refill required soon.',       FALSE),
('warning',  'Low Fertilizer Level',      'Fertilizer tank at 15%. Check before next cycle.',   FALSE),
('info',     'Sensor CO2-01 Back Online', 'CO2 sensor reconnected after 4 minutes offline.',     TRUE),
('info',     'Morning Irrigation Done',   'Schedule completed: 15 min watering cycle finished.',  TRUE);

-- Enable RLS
ALTER TABLE public.sensors_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.devices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recipes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.alerts ENABLE ROW LEVEL SECURITY;

-- Create policies (for now, allow all to authenticated users)
CREATE POLICY "Allow all to authenticated users on sensors_data" ON public.sensors_data FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow all to authenticated users on devices" ON public.devices FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow all to authenticated users on schedules" ON public.schedules FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow all to authenticated users on recipes" ON public.recipes FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow all to authenticated users on alerts" ON public.alerts FOR ALL TO authenticated USING (true);

-- Also allow anon for read-only
CREATE POLICY "Allow read to anon on sensors_data" ON public.sensors_data FOR SELECT TO anon USING (true);
CREATE POLICY "Allow read to anon on devices" ON public.devices FOR SELECT TO anon USING (true);
CREATE POLICY "Allow read to anon on schedules" ON public.schedules FOR SELECT TO anon USING (true);
CREATE POLICY "Allow read to anon on recipes" ON public.recipes FOR SELECT TO anon USING (true);
CREATE POLICY "Allow read to anon on alerts" ON public.alerts FOR SELECT TO anon USING (true);
