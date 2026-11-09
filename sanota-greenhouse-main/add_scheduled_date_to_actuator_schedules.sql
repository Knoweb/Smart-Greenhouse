-- Add one-time scheduling support to actuator_schedules
ALTER TABLE public.actuator_schedules
ADD COLUMN IF NOT EXISTS scheduled_date DATE;

