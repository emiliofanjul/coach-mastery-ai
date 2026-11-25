-- Mensaje 176 · 1 de 2: la tabla de la guía del vendedor, sus permisos y RLS. Sin datos.
-- Se puede correr más de una vez sin cambiar nada. Va ANTES de doctrina_176_datos.sql.
-- La guía del vendedor: el molde de cada paso, «En cualquier paso», «Cuando el cliente…» y los factores de impulso.
--    La lee todo el que escribe frases para el vendedor (el coach, las disputas, y después el Pitch Builder y los agentes).
--    El regreso no borra la tabla: retira la guía (activa = false). Volver a correr doctrina_176_datos.sql la reactiva.
CREATE TABLE IF NOT EXISTS public.guia_del_vendedor (
  clave text PRIMARY KEY,
  orden smallint NOT NULL UNIQUE,
  titulo text NOT NULL CHECK (length(btrim(titulo)) > 0),
  texto text NOT NULL CHECK (length(btrim(texto)) > 0),
  activa boolean NOT NULL DEFAULT true,
  aprobada_el date NOT NULL DEFAULT DATE '2026-11-25'
);
COMMENT ON TABLE public.guia_del_vendedor IS 'Mensaje 176: la guía del vendedor (doc «Closer · El molde de cada paso», aprobado por Emilio el 25-nov-2026). Sale del Cerebro y las reglas; la recibe todo el que escribe frases para el vendedor. No califica. Solo cuentan las filas activas.';
REVOKE INSERT, UPDATE, DELETE, TRUNCATE ON public.guia_del_vendedor FROM anon, authenticated;
GRANT SELECT ON public.guia_del_vendedor TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.guia_del_vendedor TO service_role;
ALTER TABLE public.guia_del_vendedor ENABLE ROW LEVEL SECURITY;
DO $do$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'guia_del_vendedor' AND policyname = 'cualquiera con sesión lee la guía activa') THEN
    CREATE POLICY "cualquiera con sesión lee la guía activa" ON public.guia_del_vendedor FOR SELECT TO authenticated USING (activa);
  END IF;
END
$do$;
