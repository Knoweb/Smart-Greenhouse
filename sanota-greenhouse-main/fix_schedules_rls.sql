-- Fix RLS policies for actuator_schedules and ensure sync function works
-- This allows the web dashboard to manage schedules and the sync function to read them.

-- 1. Enable RLS on actuator_schedules (if not already enabled)
ALTER TABLE public.actuator_schedules ENABLE ROW LEVEL SECURITY;

-- 2. Create policies for actuator_schedules
DROP POLICY IF EXISTS "Allow anon select on actuator_schedules" ON public.actuator_schedules;
DROP POLICY IF EXISTS "Allow anon insert on actuator_schedules" ON public.actuator_schedules;
DROP POLICY IF EXISTS "Allow anon update on actuator_schedules" ON public.actuator_schedules;
DROP POLICY IF EXISTS "Allow anon delete on actuator_schedules" ON public.actuator_schedules;

CREATE POLICY "Allow anon select on actuator_schedules" ON public.actuator_schedules FOR SELECT USING (true);
CREATE POLICY "Allow anon insert on actuator_schedules" ON public.actuator_schedules FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow anon update on actuator_schedules" ON public.actuator_schedules FOR UPDATE USING (true);
CREATE POLICY "Allow anon delete on actuator_schedules" ON public.actuator_schedules FOR DELETE USING (true);

-- 3. Update sync_schedules_to_actuators to be SECURITY DEFINER
-- This ensures it runs with the permissions of the 'postgres' user, 
-- allowing it to see all schedules and update all actuators regardless of who calls it.

CREATE OR REPLACE FUNCTION public.sync_schedules_to_actuators()
RETURNS void AS $$
DECLARE
    current_time_val TIME := CURRENT_TIME::TIME;
    current_day_val TEXT := TO_CHAR(CURRENT_DATE, 'Dy');
    sched RECORD;
BEGIN
    -- Turn ON actuators that have an active schedule AT THIS MINUTE
    FOR sched IN 
        SELECT actuator_id
        FROM public.actuator_schedules
        WHERE is_active = TRUE
          AND (
            (scheduled_date IS NOT NULL AND scheduled_date = CURRENT_DATE)
            OR (
              scheduled_date IS NULL
              AND (days_of_week IS NULL OR current_day_val = ANY(days_of_week))
            )
          )
          AND start_time <= current_time_val
          AND (start_time + (duration_seconds || ' seconds')::INTERVAL) > current_time_val
    LOOP
        UPDATE public.actuators
        SET target_state = '{"on": true}'::jsonb,
            updated_at = NOW()
        WHERE id = sched.actuator_id
          AND control_mode = 'schedule'
          AND (target_state->>'on')::boolean = FALSE;
    END LOOP;

    -- Turn OFF actuators that are currently ON in 'schedule' mode but have NO active schedule right now
    UPDATE public.actuators
    SET target_state = '{"on": false}'::jsonb,
        updated_at = NOW()
    WHERE control_mode = 'schedule'
      AND (target_state->>'on')::boolean = TRUE
      AND id NOT IN (
          SELECT actuator_id
          FROM public.actuator_schedules
          WHERE is_active = TRUE
            AND (
              (scheduled_date IS NOT NULL AND scheduled_date = CURRENT_DATE)
              OR (
                scheduled_date IS NULL
                AND (days_of_week IS NULL OR current_day_val = ANY(days_of_week))
              )
            )
            AND start_time <= current_time_val
            AND (start_time + (duration_seconds || ' seconds')::INTERVAL) > current_time_val
      );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Grant access to the function
GRANT EXECUTE ON FUNCTION public.sync_schedules_to_actuators() TO anon, authenticated;
GRANT ALL ON TABLE public.actuator_schedules TO anon, authenticated;
