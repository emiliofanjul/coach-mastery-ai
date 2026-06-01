ALTER TABLE public.practice_sessions
  ADD COLUMN IF NOT EXISTS conversation_history jsonb;