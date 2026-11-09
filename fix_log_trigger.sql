
CREATE OR REPLACE FUNCTION public.log_actuator_state_change()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $$
BEGIN
    -- Log if the target_state->'on' has changed
    IF (OLD.target_state->>'on') IS DISTINCT FROM (NEW.target_state->>'on') THEN
        INSERT INTO public.actuator_logs (actuator_id, state, trigger_source, owner_id)
        VALUES (NEW.id, (NEW.target_state->>'on')::BOOLEAN, NEW.control_mode, NEW.owner_id);
    END IF;
    RETURN NEW;
END;
$$;
