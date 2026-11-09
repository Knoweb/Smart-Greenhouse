-- Function to sync actuator target_state based on actuator_schedules
-- This function should be run periodically (e.g., every minute) using pg_cron or an Edge Function.

CREATE OR REPLACE FUNCTION public.sync_schedules_to_actuators()
RETURNS void AS $$
DECLARE
    current_time_val TIME := CURRENT_TIME::TIME;
    sched RECORD;
BEGIN
    -- Reset all actuators in 'schedule' mode to 'off' initially, 
    -- then we will turn 'on' only those that have an active schedule right now.
    -- (Alternatively, we can just update those that NEED to change to avoid noise)
    
    -- Turn ON actuators that have an active schedule AT THIS MINUTE
    FOR sched IN 
        SELECT actuator_id
        FROM public.actuator_schedules
        WHERE is_active = TRUE
          AND start_time <= current_time_val
          AND (start_time + (duration_minutes || ' minutes')::INTERVAL) > current_time_val
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
            AND start_time <= current_time_val
            AND (start_time + (duration_minutes || ' minutes')::INTERVAL) > current_time_val
      );

END;
$$ LANGUAGE plpgsql;

-- If pg_cron is available, you can schedule it like this:
-- SELECT cron.schedule('sync-schedules', '* * * * *', 'SELECT public.sync_schedules_to_actuators()');
