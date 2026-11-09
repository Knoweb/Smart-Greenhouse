-- Fertilizer Schedule Automation Logic (Updated with Logging)
-- This script creates a function to automatically populate pending_fertilizer_tasks 
-- from fertilizer_schedules and LOG the event in fertilizer_logs.

-- 1. Create the automation function
CREATE OR REPLACE FUNCTION public.process_fertilizer_schedules()
RETURNS void AS $$
DECLARE
    current_time_val TIME := CURRENT_TIME::TIME;
    current_day TEXT := to_char(CURRENT_DATE, 'Dy'); -- Matches 'Mon', 'Tue', etc.
    sched RECORD;
    recipe_record RECORD;
    ingredient JSONB;
    inventory_item RECORD;
    log_ingredients JSONB := '[]'::jsonb;
BEGIN
    -- Find active schedules that match the current hour and minute
    FOR sched IN 
        SELECT fs.*
        FROM public.fertilizer_schedules fs
        WHERE fs.is_active = TRUE
          AND (fs.start_time::TIME)::INTERVAL >= (current_time_val::TIME)::INTERVAL
          AND (fs.start_time::TIME)::INTERVAL < (current_time_val::TIME + interval '1 minute')::INTERVAL
          AND current_day = ANY(fs.days_of_week)
    LOOP
        -- Get the associated recipe
        SELECT * INTO recipe_record FROM public.fertilizer_recipes WHERE id = sched.recipe_id;
        
        IF FOUND THEN
            log_ingredients := '[]'::jsonb;
            
            -- Process each ingredient in the recipe JSONB array
            FOR ingredient IN SELECT * FROM jsonb_array_elements(recipe_record.ingredients)
            LOOP
                -- Get the specific fertilizer details from inventory
                SELECT * INTO inventory_item 
                FROM public.fertilizer_inventory 
                WHERE id = (ingredient->>'fertilizerId')::UUID;
                
                IF FOUND THEN
                    -- Insert a task for the ESP32 to pick up
                    INSERT INTO public.pending_fertilizer_tasks (
                        fertilizer_name,
                        hardware_port,
                        amount,
                        unit,
                        owner_id,
                        node_id
                    ) VALUES (
                        inventory_item.name,
                        inventory_item.port,
                        (ingredient->>'amount')::FLOAT,
                        inventory_item.unit,
                        sched.owner_id,
                        inventory_item.node_id
                    );
                    
                    -- Build the log ingredients array
                    log_ingredients := log_ingredients || jsonb_build_object(
                        'name', inventory_item.name,
                        'amount', (ingredient->>'amount')::FLOAT,
                        'unit', inventory_item.unit
                    );
                    
                    -- Update the stock
                    UPDATE public.fertilizer_inventory
                    SET stock = stock - (ingredient->>'amount')::FLOAT
                    WHERE id = inventory_item.id;
                END IF;
            END LOOP;
            
            -- Log the injection event for analytics
            INSERT INTO public.fertilizer_logs (
                recipe_name,
                ingredients,
                owner_id,
                created_at
            ) VALUES (
                recipe_record.name,
                log_ingredients,
                sched.owner_id,
                NOW()
            );
        END IF;
    END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Grant execution permissions
GRANT EXECUTE ON FUNCTION public.process_fertilizer_schedules() TO authenticated, anon;

-- 3. Ensure the job is scheduled (pg_cron)
SELECT cron.schedule('fertilizer-scheduler', '* * * * *', 'SELECT public.process_fertilizer_schedules()');
