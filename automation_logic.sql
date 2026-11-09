-- Function to process automation rules whenever a sensor reading is inserted
CREATE OR REPLACE FUNCTION public.process_automation_rules()
RETURNS TRIGGER AS $$
DECLARE
    rule_record RECORD;
BEGIN
    -- Look for active automation rules for this sensor_id
    -- We join with actuators to make sure we only trigger if the actuator is in 'auto' mode
    FOR rule_record IN 
        SELECT r.*
        FROM public.automation_rules r
        JOIN public.actuators a ON r.actuator_id = a.id
        WHERE r.sensor_id = NEW.sensor_id 
          AND r.is_active = TRUE
          AND a.control_mode = 'auto'
    LOOP
        -- Check if the threshold condition is met
        IF (rule_record.operator = '>' AND NEW.value > rule_record.threshold) OR
           (rule_record.operator = '<' AND NEW.value < rule_record.threshold) OR
           (rule_record.operator = '>=' AND NEW.value >= rule_record.threshold) OR
           (rule_record.operator = '<=' AND NEW.value <= rule_record.threshold) OR
           (rule_record.operator = '=' AND NEW.value = rule_record.threshold) 
        THEN
            -- Condition MET: Update actuator to the target state defined in the rule
            UPDATE public.actuators 
            SET target_state = rule_record.action_state,
                updated_at = NOW()
            WHERE id = rule_record.actuator_id;
        ELSE
            -- Condition NOT MET: Turn off if the rule is not met
            UPDATE public.actuators 
            SET target_state = '{"on": false}'::jsonb,
                updated_at = NOW()
            WHERE id = rule_record.actuator_id;
        END IF;
    END LOOP; -- Corrected END LOOP here
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create the trigger
DROP TRIGGER IF EXISTS tr_process_automation ON public.sensor_readings;
CREATE TRIGGER tr_process_automation
AFTER INSERT ON public.sensor_readings
FOR EACH ROW EXECUTE FUNCTION public.process_automation_rules();
