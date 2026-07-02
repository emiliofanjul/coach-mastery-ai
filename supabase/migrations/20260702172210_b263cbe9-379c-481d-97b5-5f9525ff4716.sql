CREATE TABLE public.llm_calls (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  phase text NOT NULL,
  prompt_version text,
  model text,
  input_tokens integer,
  output_tokens integer,
  latency_ms integer,
  event_id uuid NULL REFERENCES public.seller_events(id) ON DELETE SET NULL
);

CREATE INDEX idx_llm_calls_created_at ON public.llm_calls (created_at DESC);
CREATE INDEX idx_llm_calls_phase ON public.llm_calls (phase);
CREATE INDEX idx_llm_calls_event_id ON public.llm_calls (event_id);

GRANT ALL ON public.llm_calls TO service_role;

ALTER TABLE public.llm_calls ENABLE ROW LEVEL SECURITY;

-- No policies for anon/authenticated: table is service_role only.
-- Explicit deny-all policy so intent is unambiguous.
CREATE POLICY "llm_calls no client access"
  ON public.llm_calls
  FOR ALL
  TO authenticated, anon
  USING (false)
  WITH CHECK (false);