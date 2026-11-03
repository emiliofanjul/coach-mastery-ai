-- Mensaje 126 (3-nov-2026): la calificación de cada práctica queda guardada.
-- La escribe solo el servidor (closer-voice, con la llave de servicio).
-- Cada quien puede leer solo las de sus propias prácticas.
CREATE TABLE IF NOT EXISTS public.evaluaciones_practica (
  practice_session_id uuid PRIMARY KEY REFERENCES public.practice_sessions(id) ON DELETE CASCADE,
  seller_id uuid NOT NULL REFERENCES public.sellers(id) ON DELETE CASCADE,
  estado text NOT NULL CHECK (estado IN ('procesando', 'lista', 'error')),
  resultado jsonb,
  error text,
  intentos integer NOT NULL DEFAULT 1,
  duracion_ms integer,
  empezada_en timestamptz NOT NULL DEFAULT now(),
  actualizada_en timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_evaluaciones_practica_seller ON public.evaluaciones_practica(seller_id);

ALTER TABLE public.evaluaciones_practica ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "seller reads own evaluaciones" ON public.evaluaciones_practica;
CREATE POLICY "seller reads own evaluaciones" ON public.evaluaciones_practica
  FOR SELECT TO authenticated
  USING (public.owns_seller(seller_id));

REVOKE ALL ON public.evaluaciones_practica FROM anon;
REVOKE INSERT, UPDATE, DELETE ON public.evaluaciones_practica FROM authenticated;
GRANT SELECT ON public.evaluaciones_practica TO authenticated;
