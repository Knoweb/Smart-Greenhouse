-- ============================================
-- DATA CAPTURE TRACKING TABLE
-- Stores all incoming sensor data
-- ============================================

CREATE TABLE IF NOT EXISTS public.data_capture_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    captured_at TIMESTAMPTZ DEFAULT NOW(),
    node_id TEXT,
    sensor_type TEXT,
    sensor_id TEXT,
    value FLOAT,
    raw_data JSONB,
    source TEXT DEFAULT 'esp32'
);

-- RLS
ALTER TABLE public.data_capture_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Full access for anon on data_capture_log" ON public.data_capture_log 
    FOR ALL USING (true) WITH CHECK (true);

GRANT ALL ON TABLE public.data_capture_log TO anon, authenticated, postgres, service_role;

-- ============================================
-- AUTO-CAPTURE FUNCTION
-- Call this after each sensor reading
-- ============================================

CREATE OR REPLACE FUNCTION public.capture_sensor_data(
    p_node_id TEXT,
    p_sensor_type TEXT,
    p_value FLOAT
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Get sensor ID
    INSERT INTO public.data_capture_log (node_id, sensor_type, sensor_id, value)
    SELECT p_node_id, p_sensor_type, s.id, p_value
    FROM public.sensors s
    WHERE s.sensor_type = p_sensor_type
    LIMIT 1;
END;
$$;

GRANT EXECUTE ON FUNCTION public.capture_sensor_data(TEXT, TEXT, FLOAT) TO anon;
