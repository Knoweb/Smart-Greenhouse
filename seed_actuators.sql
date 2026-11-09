-- Seed the 7 specific actuators requested by the user
-- Assuming a default node 'MAIN_ESP_01' exists. If not, we create it first.

INSERT INTO public.nodes (id, name, node_type, zone_id, is_online)
VALUES ('MAIN_ESP_01', 'Main Controller', 'main', (SELECT id FROM public.zones LIMIT 1), true)
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.actuators (node_id, actuator_type, label, control_mode, target_state, actual_state)
VALUES 
('MAIN_ESP_01', 'irrigation',  'Main Water Pump',   'schedule', '{"on": false}', '{"on": false}'),
('MAIN_ESP_01', 'irrigation',  'Irrigation Pump',   'schedule', '{"on": false}', '{"on": false}'),
('MAIN_ESP_01', 'fertigation', 'Fertilizer Pump',   'schedule', '{"on": false}', '{"on": false}'),
('MAIN_ESP_01', 'irrigation',  'Misters / Foggers', 'schedule', '{"on": false}', '{"on": false}'),
('MAIN_ESP_01', 'ventilation', 'Exhaust Fans',      'schedule', '{"on": false}', '{"on": false}'),
('MAIN_ESP_01', 'ventilation', 'Air Circulation',   'schedule', '{"on": false}', '{"on": false}'),
('MAIN_ESP_01', 'lighting',    'Shade Curtains',    'schedule', '{"on": false}', '{"on": false}')
ON CONFLICT DO NOTHING;
