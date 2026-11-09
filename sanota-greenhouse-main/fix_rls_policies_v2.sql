-- Clear existing policies if any to avoid errors
DROP POLICY IF EXISTS "Allow read to anon on actuator_schedules" ON public.actuator_schedules;
DROP POLICY IF EXISTS "Allow read to anon on automation_rules" ON public.automation_rules;
DROP POLICY IF EXISTS "Allow read to anon on sensor_readings" ON public.sensor_readings;
DROP POLICY IF EXISTS "Allow read to anon on sensors" ON public.sensors;
DROP POLICY IF EXISTS "Allow read to anon on nodes" ON public.nodes;
DROP POLICY IF EXISTS "Allow read to anon on zones" ON public.zones;
DROP POLICY IF EXISTS "Allow read to anon on actuators" ON public.actuators;

-- Re-create policies for anonymous read access
CREATE POLICY "Allow read to anon on actuator_schedules" ON public.actuator_schedules FOR SELECT TO anon USING (true);
CREATE POLICY "Allow read to anon on automation_rules" ON public.automation_rules FOR SELECT TO anon USING (true);
CREATE POLICY "Allow read to anon on sensor_readings" ON public.sensor_readings FOR SELECT TO anon USING (true);
CREATE POLICY "Allow read to anon on sensors" ON public.sensors FOR SELECT TO anon USING (true);
CREATE POLICY "Allow read to anon on nodes" ON public.nodes FOR SELECT TO anon USING (true);
CREATE POLICY "Allow read to anon on zones" ON public.zones FOR SELECT TO anon USING (true);
CREATE POLICY "Allow read to anon on actuators" ON public.actuators FOR SELECT TO anon USING (true);
