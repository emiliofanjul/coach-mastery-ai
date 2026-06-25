
CREATE TABLE public.seller_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id uuid NOT NULL REFERENCES public.sellers(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  event_type text NOT NULL CHECK (event_type IN (
    'practice_session','quiz_completed','evaluation','node_completed','mission_assigned','field_result'
  )),
  node_id text,
  skill_ids text[] NOT NULL DEFAULT '{}',
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  audio_url text,
  prompt_version text,
  script_version text,
  model text
);

CREATE INDEX seller_events_seller_created_idx ON public.seller_events (seller_id, created_at DESC);
CREATE INDEX seller_events_event_type_idx ON public.seller_events (event_type);

GRANT SELECT ON public.seller_events TO authenticated;
GRANT ALL ON public.seller_events TO service_role;

ALTER TABLE public.seller_events ENABLE ROW LEVEL SECURITY;

-- El vendedor solo puede leer sus propios eventos (mapeo vía sellers.profile_id = auth.uid())
CREATE POLICY "Sellers can read own events"
  ON public.seller_events
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.sellers s
      WHERE s.id = seller_events.seller_id
        AND s.profile_id = auth.uid()
    )
  );

-- Sin políticas de INSERT/UPDATE/DELETE para authenticated:
-- solo service_role (Edge Functions) puede crear/modificar; el cliente no puede tocar la tabla.
