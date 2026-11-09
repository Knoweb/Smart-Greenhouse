-- Enable RLS and Create Policies to allow ANYONE (with anon key) to read and write data
-- This is necessary for both ESP32 and Web Dashboard to communicate.

-- 1. Enable RLS (just in case)
ALTER TABLE public.nodes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sensors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sensor_readings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.actuators ENABLE ROW LEVEL SECURITY;

-- 2. DROP OLD POLICIES to avoid confusion
DROP POLICY IF EXISTS "Public Read Access" ON public.nodes;
DROP POLICY IF EXISTS "Public Read Access" ON public.sensors;
DROP POLICY IF EXISTS "Public Read Access" ON public.sensor_readings;
DROP POLICY IF EXISTS "Public Read Access" ON public.actuators;
DROP POLICY IF EXISTS "Allow all to authenticated users on sensors_data" ON public.sensors_data;

-- 3. CREATE NEW POLICIES (Full access for testing and easier integration)
-- (In a production app, you would lock this down to 'authenticated' users only)

CREATE POLICY "Allow anon select on nodes" ON public.nodes FOR SELECT USING (true);
CREATE POLICY "Allow anon insert on nodes" ON public.nodes FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow anon update on nodes" ON public.nodes FOR UPDATE USING (true);

CREATE POLICY "Allow anon select on sensors" ON public.sensors FOR SELECT USING (true);
CREATE POLICY "Allow anon insert on sensors" ON public.sensors FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow anon select on sensor_readings" ON public.sensor_readings FOR SELECT USING (true);
CREATE POLICY "Allow anon insert on sensor_readings" ON public.sensor_readings FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow anon select on actuators" ON public.actuators FOR SELECT USING (true);
CREATE POLICY "Allow anon update on actuators" ON public.actuators FOR UPDATE USING (true);

-- Also allow RPC calls for anonymous users
GRANT ALL ON TABLE public.nodes TO anon, authenticated;
GRANT ALL ON TABLE public.sensors TO anon, authenticated;
GRANT ALL ON TABLE public.sensor_readings TO anon, authenticated;
GRANT ALL ON TABLE public.actuators TO anon, authenticated;
GRANT ALL ON SEQUENCE public.sensor_readings_id_seq TO anon, authenticated;
