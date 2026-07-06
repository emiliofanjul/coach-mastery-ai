
ALTER TABLE public.sellers ADD COLUMN IF NOT EXISTS certified_at timestamptz;

INSERT INTO public.nodes (id, world_id, name, order_index, is_boss, reps_required, difficulty_level, node_type)
VALUES
  ('9.0', 9, 'Examen: La Conversación Completa', 0, true, 1, 4, 'boss'),
  ('9.1', 9, 'Examen: Tiempo de Calidad',       1, true, 1, 4, 'boss'),
  ('9.2', 9, 'Examen: El Indiferente',          2, true, 1, 4, 'boss'),
  ('9.3', 9, 'BOSS FINAL: El Certificado',      3, true, 1, 5, 'boss')
ON CONFLICT (id) DO UPDATE SET
  world_id = EXCLUDED.world_id,
  order_index = EXCLUDED.order_index,
  is_boss = true,
  node_type = 'boss',
  difficulty_level = EXCLUDED.difficulty_level;
