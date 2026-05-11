
ALTER TABLE public.nodes
  ADD COLUMN IF NOT EXISTS description text,
  ADD COLUMN IF NOT EXISTS node_type text NOT NULL DEFAULT 'knowledge',
  ADD COLUMN IF NOT EXISTS conversation_scope text NOT NULL DEFAULT 'full',
  ADD COLUMN IF NOT EXISTS engine_type text,
  ADD COLUMN IF NOT EXISTS boss_goal text,
  ADD COLUMN IF NOT EXISTS field_mission text;

ALTER TABLE public.practice_sessions
  ADD COLUMN IF NOT EXISTS pitch_stage_reached text;

INSERT INTO public.nodes (
  id, world_id, name, description, order_index,
  node_type, engine_type, conversation_scope,
  boss_goal, field_mission, difficulty_level
) VALUES (
  '0.0', 0,
  'Los 5 Pasos de una Conversación',
  'Toda venta sigue la misma estructura. Aquí la conoces completa antes de empezar a practicarla.',
  0,
  'knowledge', 'classify', 'first_impression',
  NULL, NULL, 1
);
