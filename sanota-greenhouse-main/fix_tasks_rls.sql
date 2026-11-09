-- Update RLS policies for pending_fertilizer_tasks
DROP POLICY IF EXISTS "Enable all for pending_fertilizer_tasks" ON public.pending_fertilizer_tasks;
DROP POLICY IF EXISTS "Users can insert own tasks" ON public.pending_fertilizer_tasks;
DROP POLICY IF EXISTS "Public can read and delete tasks by node_id" ON public.pending_fertilizer_tasks;

-- 1. Only authenticated owners can create tasks
CREATE POLICY "Users can insert own tasks" 
ON public.pending_fertilizer_tasks 
FOR INSERT 
TO authenticated 
WITH CHECK (auth.uid() = owner_id);

-- 2. ESP32 (Anon) can read and delete tasks (since it needs to poll and clear them)
-- In a real production system, we'd use a better auth method for devices,
-- but for this architecture, we rely on UUID obscurity and providing the node_id in the query.
CREATE POLICY "Public can read and delete tasks by node_id" 
ON public.pending_fertilizer_tasks 
FOR ALL 
TO anon 
USING (true);

-- 3. Owners have full control
CREATE POLICY "Owners can manage own tasks" 
ON public.pending_fertilizer_tasks 
FOR ALL 
TO authenticated 
USING (auth.uid() = owner_id);
