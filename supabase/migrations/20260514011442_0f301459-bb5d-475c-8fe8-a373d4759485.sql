ALTER TABLE public.node_progress
  ADD COLUMN IF NOT EXISTS stars integer NOT NULL DEFAULT 0
  CHECK (stars >= 0 AND stars <= 3);