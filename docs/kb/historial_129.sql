-- Mensaje 129 (3-nov-2026): la práctica calificada siempre llega al historial.

-- 1) Si el servidor creó el evento de la práctica, y si no, por qué.
ALTER TABLE public.evaluaciones_practica ADD COLUMN IF NOT EXISTS evento_id uuid;
ALTER TABLE public.evaluaciones_practica ADD COLUMN IF NOT EXISTS error_evento text;

-- 2) Fallas que solo ve el teléfono (antes se perdían en su consola).
--    Cada quien solo puede escribir las suyas; nadie las lee desde la app.
CREATE TABLE IF NOT EXISTS public.fallas_app (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  seller_id uuid NOT NULL REFERENCES public.sellers(id) ON DELETE CASCADE,
  donde text NOT NULL,
  detalle text,
  datos jsonb NOT NULL DEFAULT '{}'::jsonb,
  agente text
);
CREATE INDEX IF NOT EXISTS idx_fallas_app_fecha ON public.fallas_app (created_at DESC);
ALTER TABLE public.fallas_app ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "seller inserts own fallas" ON public.fallas_app;
CREATE POLICY "seller inserts own fallas" ON public.fallas_app
  FOR INSERT TO authenticated
  WITH CHECK (public.owns_seller(seller_id));
REVOKE ALL ON public.fallas_app FROM anon;
REVOKE SELECT, UPDATE, DELETE ON public.fallas_app FROM authenticated;
GRANT INSERT ON public.fallas_app TO authenticated;

-- 3) La alerta del radar se guarda como evento «regression_alert», pero ese
--    tipo no estaba en la lista de tipos permitidos. Se agrega, conservando
--    todos los tipos que ya existen en la tabla.
DO $$
DECLARE
  c record;
  tipos text;
BEGIN
  FOR c IN
    SELECT con.conname
    FROM pg_constraint con
    WHERE con.conrelid = 'public.seller_events'::regclass
      AND con.contype = 'c'
      AND pg_get_constraintdef(con.oid) ILIKE '%event_type%'
  LOOP
    EXECUTE format('ALTER TABLE public.seller_events DROP CONSTRAINT %I', c.conname);
  END LOOP;
  SELECT string_agg(quote_literal(t), ', ' ORDER BY t) INTO tipos FROM (
    SELECT unnest(ARRAY['practice_session','quiz_completed','evaluation','node_completed','mission_assigned','field_result','regression_alert']) AS t
    UNION
    SELECT DISTINCT event_type FROM public.seller_events
  ) x;
  EXECUTE format('ALTER TABLE public.seller_events ADD CONSTRAINT seller_events_event_type_check CHECK (event_type IN (%s))', tipos);
END $$;

-- 4) Recuperar las prácticas que se calificaron y se guardaron, pero nunca
--    llegaron al historial (hoy: la del 3.10 de Emilio). Solo crea el evento
--    si no existe; correrlo dos veces no duplica nada.
DO $$
DECLARE
  r record;
  tr jsonb;
  nuevo uuid;
BEGIN
  FOR r IN
    SELECT e.practice_session_id, e.seller_id, e.resultado, p.node_id, p.world_id, p.practice_type, p.is_boss_level, p.transcript, p.created_at
    FROM public.evaluaciones_practica e
    JOIN public.practice_sessions p ON p.id = e.practice_session_id
    WHERE e.estado = 'lista' AND e.resultado IS NOT NULL
      AND NOT EXISTS (
        SELECT 1 FROM public.seller_events s
        WHERE s.seller_id = e.seller_id AND s.event_type = 'practice_session'
          AND s.payload->>'practice_session_id' = e.practice_session_id::text
      )
  LOOP
    BEGIN
      tr := r.transcript::jsonb;
      IF jsonb_typeof(tr) <> 'array' THEN tr := '[]'::jsonb; END IF;
    EXCEPTION WHEN others THEN
      tr := '[]'::jsonb;
    END;
    INSERT INTO public.seller_events (seller_id, event_type, node_id, skill_ids, payload, prompt_version, model, created_at)
    VALUES (
      r.seller_id, 'practice_session', r.node_id, '{}',
      jsonb_build_object(
        'practice_session_id', r.practice_session_id,
        'world_id', coalesce(r.world_id, 0),
        'practice_type', coalesce(r.practice_type, 'skill_drill'),
        'is_boss_level', coalesce(r.is_boss_level, false),
        'score', r.resultado->'score',
        'stars', r.resultado->'stars',
        'transcript', tr,
        'cut_reason', coalesce(r.resultado->>'cut_reason', 'unknown'),
        'evaluation', jsonb_build_object(
          'score', r.resultado->'score',
          'stars', r.resultado->'stars',
          'criterios_cumplidos', coalesce(r.resultado->'criterios_cumplidos', '[]'::jsonb),
          'observations', coalesce(r.resultado->'observations', '[]'::jsonb),
          'flags_detected', coalesce(r.resultado->'flags_detected', '[]'::jsonb),
          'mision', r.resultado->'mision',
          'fallas', coalesce(r.resultado->'fallas', '[]'::jsonb),
          'desglose', r.resultado->'desglose',
          'regresiones_detectadas', coalesce(r.resultado->'regresiones_detectadas', '[]'::jsonb)
        ),
        'rachas', '[]'::jsonb,
        'registrado_por', 'recuperado_mensaje_129'
      ),
      r.resultado->>'prompt_version', r.resultado->>'model', r.created_at
    )
    RETURNING id INTO nuevo;
    UPDATE public.evaluaciones_practica SET evento_id = nuevo WHERE practice_session_id = r.practice_session_id;
  END LOOP;
END $$;
