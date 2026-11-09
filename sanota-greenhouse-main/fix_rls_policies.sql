-- 1. Disable RLS temporarily or add bypass policies for testing
-- This ensures that the anon key (ESP32) can actually write to these tables.

-- Allow all access to anon for now to ensure ESP32 can register itself
DROP POLICY IF EXISTS "Allow anon select on nodes" ON public.nodes;
DROP POLICY IF EXISTS "Allow anon insert on nodes" ON public.nodes;
DROP POLICY IF EXISTS "Allow anon update on nodes" ON public.nodes;
CREATE POLICY "Full access for anon on nodes" ON public.nodes FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow anon select on actuators" ON public.actuators;
DROP POLICY IF EXISTS "Allow anon update on actuators" ON public.actuators;
CREATE POLICY "Full access for anon on actuators" ON public.actuators FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow anon select on zones" ON public.zones;
CREATE POLICY "Full access for anon on zones" ON public.zones FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow anon full on actuator_schedules" ON public.actuator_schedules;
CREATE POLICY "Full access for anon on actuator_schedules" ON public.actuator_schedules FOR ALL USING (true) WITH CHECK (true);

-- 2. Double check the log_sensor_data and register_actuator permissions
GRANT ALL ON TABLE public.nodes TO anon, authenticated, postgres, service_role;
GRANT ALL ON TABLE public.sensors TO anon, authenticated, postgres, service_role;
GRANT ALL ON TABLE public.sensor_readings TO anon, authenticated, postgres, service_role;
GRANT ALL ON TABLE public.actuators TO anon, authenticated, postgres, service_role;
GRANT ALL ON TABLE public.zones TO anon, authenticated, postgres, service_role;
GRANT ALL ON TABLE public.actuator_schedules TO anon, authenticated, postgres, service_role;

-- 3. Ensure the schema is public and accessible
GRANT USAGE ON SCHEMA public TO anon, authenticated;
