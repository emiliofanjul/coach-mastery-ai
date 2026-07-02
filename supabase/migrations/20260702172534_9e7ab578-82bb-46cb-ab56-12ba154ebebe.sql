ALTER TABLE public.llm_calls ADD COLUMN session_id uuid NULL;
CREATE INDEX idx_llm_calls_session_id ON public.llm_calls (session_id);