import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://pfwjphydtnmmipgtgsow.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBmd2pwaHlkdG5tbWlwZ3Rnc293Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUyMTI2NzksImV4cCI6MjA5MDc4ODY3OX0.aoSDhc4FEykfSDH8AitWM4Z38MHJA30Y2euMQOwEAxc';

const supabase = createClient(supabaseUrl, supabaseKey);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { type, data, node_id, timestamp } = req.body;

    console.log('📥 Bulk Data Received:', { type, node_id, records: data?.length });

    if (type === 'sensor_readings' && Array.isArray(data)) {
      const records = data.map(item => ({
        sensor_id: item.sensor_id,
        value: item.value,
        created_at: item.created_at || timestamp || new Date().toISOString()
      }));

      const { data: inserted, error } = await supabase
        .from('sensor_readings')
        .insert(records)
        .select();

      if (error) {
        console.error('Insert error:', error);
        return res.status(500).json({ error: error.message });
      }

      return res.status(200).json({
        success: true,
        message: `Inserted ${inserted?.length || 0} records`,
        inserted
      });
    }

    if (type === 'actuator_states' && Array.isArray(data)) {
      for (const item of data) {
        await supabase
          .from('actuators')
          .update({
            actual_state: item.actual_state,
            updated_at: new Date().toISOString()
          })
          .eq('id', item.id);
      }

      return res.status(200).json({
        success: true,
        message: `Updated ${data.length} actuator states`
      });
    }

    return res.status(400).json({ error: 'Invalid data type' });

  } catch (error) {
    console.error('Handler error:', error);
    return res.status(500).json({ error: error.message });
  }
}
