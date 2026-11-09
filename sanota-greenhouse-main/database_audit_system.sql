-- ============================================
-- DATABASE AUDIT LOG SYSTEM
-- Tracks all changes (INSERT, UPDATE, DELETE)
-- ============================================

-- 1. Create audit log table
CREATE TABLE IF NOT EXISTS public.audit_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    table_name TEXT NOT NULL,
    action TEXT NOT NULL CHECK (action IN ('INSERT', 'UPDATE', 'DELETE')),
    record_id TEXT,
    old_data JSONB,
    new_data JSONB,
    changed_by TEXT DEFAULT auth.uid()::TEXT
);

-- 2. Enable RLS
ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;

-- 3. Allow all access
CREATE POLICY "Full access for anon on audit_log" ON public.audit_log 
    FOR ALL USING (true) WITH CHECK (true);

-- 4. Grant permissions
GRANT ALL ON TABLE public.audit_log TO anon, authenticated, postgres, service_role;

-- ============================================
-- TRIGGER FUNCTIONS
-- ============================================

-- Function to log INSERT
CREATE OR REPLACE FUNCTION public.log_insert()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.audit_log (table_name, action, record_id, new_data)
    VALUES (TG_TABLE_NAME, 'INSERT', 
            COALESCE(NEW.id::TEXT, NEW::TEXT), 
            to_jsonb(NEW));
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to log UPDATE
CREATE OR REPLACE FUNCTION public.log_update()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.audit_log (table_name, action, record_id, old_data, new_data)
    VALUES (TG_TABLE_NAME, 'UPDATE', 
            COALESCE(NEW.id::TEXT, NEW::TEXT), 
            to_jsonb(OLD), 
            to_jsonb(NEW));
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to log DELETE
CREATE OR REPLACE FUNCTION public.log_delete()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.audit_log (table_name, action, record_id, old_data)
    VALUES (TG_TABLE_NAME, 'DELETE', 
            COALESCE(OLD.id::TEXT, OLD::TEXT), 
            to_jsonb(OLD));
    RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- ATTACH TRIGGERS TO TABLES
-- ============================================

-- Sensors table
DROP TRIGGER IF EXISTS sensors_audit_insert ON public.sensors;
CREATE TRIGGER sensors_audit_insert AFTER INSERT ON public.sensors
    FOR EACH ROW EXECUTE FUNCTION public.log_insert();

DROP TRIGGER IF EXISTS sensors_audit_update ON public.sensors;
CREATE TRIGGER sensors_audit_update AFTER UPDATE ON public.sensors
    FOR EACH ROW EXECUTE FUNCTION public.log_update();

DROP TRIGGER IF EXISTS sensors_audit_delete ON public.sensors;
CREATE TRIGGER sensors_audit_delete AFTER DELETE ON public.sensors
    FOR EACH ROW EXECUTE FUNCTION public.log_delete();

-- Actuators table
DROP TRIGGER IF EXISTS actuators_audit_insert ON public.actuators;
CREATE TRIGGER actuators_audit_insert AFTER INSERT ON public.actuators
    FOR EACH ROW EXECUTE FUNCTION public.log_insert();

DROP TRIGGER IF EXISTS actuators_audit_update ON public.actuators;
CREATE TRIGGER actuators_audit_update AFTER UPDATE ON public.actuators
    FOR EACH ROW EXECUTE FUNCTION public.log_update();

DROP TRIGGER IF EXISTS actuators_audit_delete ON public.actuators;
CREATE TRIGGER actuators_audit_delete AFTER DELETE ON public.actuators
    FOR EACH ROW EXECUTE FUNCTION public.log_delete();

-- Actuator Schedules table
DROP TRIGGER IF EXISTS actuator_schedules_audit_insert ON public.actuator_schedules;
CREATE TRIGGER actuator_schedules_audit_insert AFTER INSERT ON public.actuator_schedules
    FOR EACH ROW EXECUTE FUNCTION public.log_insert();

DROP TRIGGER IF EXISTS actuator_schedules_audit_update ON public.actuator_schedules;
CREATE TRIGGER actuator_schedules_audit_update AFTER UPDATE ON public.actuator_schedules
    FOR EACH ROW EXECUTE FUNCTION public.log_update();

DROP TRIGGER IF EXISTS actuator_schedules_audit_delete ON public.actuator_schedules;
CREATE TRIGGER actuator_schedules_audit_delete AFTER DELETE ON public.actuator_schedules
    FOR EACH ROW EXECUTE FUNCTION public.log_delete();

-- Sensor Readings table (high volume - only track significant changes)
DROP TRIGGER IF EXISTS sensor_readings_audit_insert ON public.sensor_readings;
CREATE TRIGGER sensor_readings_audit_insert AFTER INSERT ON public.sensor_readings
    FOR EACH ROW EXECUTE FUNCTION public.log_insert();

-- Nodes table
DROP TRIGGER IF EXISTS nodes_audit_insert ON public.nodes;
CREATE TRIGGER nodes_audit_insert AFTER INSERT ON public.nodes
    FOR EACH ROW EXECUTE FUNCTION public.log_insert();

DROP TRIGGER IF EXISTS nodes_audit_update ON public.nodes;
CREATE TRIGGER nodes_audit_update AFTER UPDATE ON public.nodes
    FOR EACH ROW EXECUTE FUNCTION public.log_update();

-- Zones table
DROP TRIGGER IF EXISTS zones_audit_insert ON public.zones;
CREATE TRIGGER zones_audit_insert AFTER INSERT ON public.zones
    FOR EACH ROW EXECUTE FUNCTION public.log_insert();

DROP TRIGGER IF EXISTS zones_audit_update ON public.zones;
CREATE TRIGGER zones_audit_update AFTER UPDATE ON public.zones
    FOR EACH ROW EXECUTE FUNCTION public.log_update();

-- ============================================
-- DAILY DATA SNAPSHOT (for backup)
-- ============================================

-- Create snapshot table
CREATE TABLE IF NOT EXISTS public.data_snapshots (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    snapshot_date DATE DEFAULT CURRENT_DATE,
    snapshot_time TIMESTAMPTZ DEFAULT NOW(),
    tables_data JSONB NOT NULL
);

-- Enable RLS
ALTER TABLE public.data_snapshots ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Full access for anon on data_snapshots" ON public.data_snapshots 
    FOR ALL USING (true) WITH CHECK (true);

GRANT ALL ON TABLE public.data_snapshots TO anon, authenticated, postgres, service_role;

-- Function to create daily snapshot
CREATE OR REPLACE FUNCTION public.create_daily_snapshot()
RETURNS void AS $$
DECLARE
    snapshot_data JSONB;
BEGIN
    SELECT jsonb_build_object(
        'sensors', (SELECT jsonb_agg(t) FROM (SELECT * FROM sensors) t),
        'actuators', (SELECT jsonb_agg(t) FROM (SELECT * FROM actuators) t),
        'actuator_schedules', (SELECT jsonb_agg(t) FROM (SELECT * FROM actuator_schedules) t),
        'nodes', (SELECT jsonb_agg(t) FROM (SELECT * FROM nodes) t),
        'zones', (SELECT jsonb_agg(t) FROM (SELECT * FROM zones) t)
    ) INTO snapshot_data;
    
    INSERT INTO public.data_snapshots (tables_data) VALUES (snapshot_data);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- CLEANUP: Keep only last 30 days of audit logs
-- ============================================
CREATE OR REPLACE FUNCTION public.cleanup_old_audit_logs()
RETURNS void AS $$
BEGIN
    DELETE FROM public.audit_log 
    WHERE created_at < NOW() - INTERVAL '30 days';
    
    DELETE FROM public.data_snapshots 
    WHERE snapshot_date < CURRENT_DATE - INTERVAL '90 days';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
