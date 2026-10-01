-- Disputas de calificación (oct-2026). Cuando un vendedor toca "No estoy de
-- acuerdo con mi calificación", Closer revisa y responde. Cada disputa queda
-- aquí, con si Closer concedió, en qué criterio, por qué, y el contexto
-- completo (conversación y evaluación original): así el equipo de Closer
-- audita, filtra y convierte cada error del evaluador en un caso de la red.

-- Administradores de la plataforma: los que construyen Closer. Ven las
-- disputas de todas las empresas. Un manager NO las ve.
CREATE TABLE IF NOT EXISTS public.platform_admins (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.platform_admins ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS platform_admins_se_ve_a_si_mismo ON public.platform_admins;
CREATE POLICY platform_admins_se_ve_a_si_mismo ON public.platform_admins
  FOR SELECT TO authenticated USING (user_id = auth.uid());

INSERT INTO public.platform_admins (user_id)
SELECT id FROM auth.users WHERE lower(email) = 'emiliofanjul1@hotmail.com'
ON CONFLICT (user_id) DO NOTHING;

CREATE TABLE IF NOT EXISTS public.disputas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  company_id uuid,
  seller_id uuid,
  node_id text,
  session_id text,
  turno int,
  nota_original int,
  mensaje_vendedor text NOT NULL,
  respuesta_closer text NOT NULL,
  concede boolean,            -- null: Closer contestó en prosa y no se supo
  criterio_id text,
  motivo text,
  contexto jsonb,             -- { evaluacion, conversacion }
  revisada boolean NOT NULL DEFAULT false,
  nota_revision text,
  revisada_at timestamptz
);
CREATE INDEX IF NOT EXISTS disputas_fecha_idx ON public.disputas (created_at DESC);
CREATE INDEX IF NOT EXISTS disputas_concede_idx ON public.disputas (concede, revisada);

ALTER TABLE public.disputas ENABLE ROW LEVEL SECURITY;
-- Se insertan desde el servidor (closer-voice, con la llave de servicio): no
-- hay política de INSERT, así que nadie las puede escribir desde la app.
DROP POLICY IF EXISTS disputas_admin_lee ON public.disputas;
CREATE POLICY disputas_admin_lee ON public.disputas
  FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.platform_admins pa WHERE pa.user_id = auth.uid()));
DROP POLICY IF EXISTS disputas_admin_revisa ON public.disputas;
CREATE POLICY disputas_admin_revisa ON public.disputas
  FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.platform_admins pa WHERE pa.user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.platform_admins pa WHERE pa.user_id = auth.uid()));

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.platform_admins) THEN
    RAISE EXCEPTION 'no se encontró la cuenta emiliofanjul1@hotmail.com para hacerla administradora';
  END IF;
  IF (SELECT count(*) FROM pg_policies WHERE schemaname = 'public' AND tablename = 'disputas') <> 2 THEN
    RAISE EXCEPTION 'las políticas de disputas no quedaron como se esperaba';
  END IF;
END $$;