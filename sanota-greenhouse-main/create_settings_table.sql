-- Create system_settings table to store threshold configurations
CREATE TABLE IF NOT EXISTS public.system_settings (
    owner_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    max_temp FLOAT DEFAULT 30,
    min_temp FLOAT DEFAULT 18,
    max_hum FLOAT DEFAULT 90,
    min_hum FLOAT DEFAULT 40,
    low_water_alert FLOAT DEFAULT 20,
    low_fert_alert FLOAT DEFAULT 15,
    max_co2 FLOAT DEFAULT 1200,
    min_light FLOAT DEFAULT 200,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see and edit their own settings
DROP POLICY IF EXISTS "Users can manage own settings" ON public.system_settings;
CREATE POLICY "Users can manage own settings" ON public.system_settings
    FOR ALL TO authenticated USING (auth.uid() = owner_id);

-- Grant permissions
GRANT ALL ON TABLE public.system_settings TO authenticated;

-- Ensure every user has a settings row (optional, can be done on demand)
-- But for now, we'll let the app insert it if it doesn't exist.
