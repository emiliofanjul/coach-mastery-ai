ALTER TABLE public.node_cards
  ADD COLUMN IF NOT EXISTS skill_ids text[] NOT NULL DEFAULT '{}';