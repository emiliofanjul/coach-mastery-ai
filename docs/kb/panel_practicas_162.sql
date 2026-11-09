-- Mensaje 162 · Panel «Prácticas» para los administradores de la plataforma (nov-2026, Emilio).
-- Para auditar las prácticas de todos los usuarios y mejorar Closer: ver dónde se atoran, qué les dijo
-- Closer y cómo los calificó. SOLO platform_admins: cada función lo revisa en la base, no en la pantalla.
-- Nada de esto abre tablas: se lee por funciones que verifican al administrador en cada llamada.

CREATE OR REPLACE FUNCTION public.es_admin_plataforma()
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$ SELECT EXISTS (SELECT 1 FROM public.platform_admins WHERE user_id = auth.uid()) $$;
REVOKE EXECUTE ON FUNCTION public.es_admin_plataforma() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.es_admin_plataforma() TO authenticated;

-- La lista: lo ligero de cada práctica en un rango de fechas (máximo 3000).
CREATE OR REPLACE FUNCTION public.admin_practicas(_desde timestamptz, _hasta timestamptz, _limite integer DEFAULT 2000)
RETURNS TABLE (
  id uuid, created_at timestamptz, node_id text, seller_id uuid, vendedor text, company_id uuid, empresa text,
  personal boolean, score integer, stars integer, intento integer, fallas text[], criticas integer, tiene_audio boolean
)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  IF NOT public.es_admin_plataforma() THEN
    RAISE EXCEPTION 'Solo administradores de la plataforma';
  END IF;
  RETURN QUERY
  WITH ev AS (
    SELECT e.id, e.created_at, e.node_id, e.seller_id, e.payload, e.audio_url,
           row_number() OVER (PARTITION BY e.seller_id, e.node_id ORDER BY e.created_at)::integer AS intento
    FROM public.seller_events e
    WHERE e.event_type = 'practice_session'
  )
  SELECT ev.id, ev.created_at, ev.node_id, ev.seller_id, s.full_name, s.company_id, c.name,
         coalesce(c.is_personal, false),
         CASE WHEN jsonb_typeof(ev.payload->'score') = 'number' THEN round((ev.payload->>'score')::numeric)::integer END,
         CASE WHEN jsonb_typeof(ev.payload->'stars') = 'number' THEN round((ev.payload->>'stars')::numeric)::integer END,
         ev.intento,
         coalesce(ARRAY(
           SELECT DISTINCT x FROM (
             SELECT f->>'id' AS x FROM jsonb_array_elements(CASE WHEN jsonb_typeof(ev.payload->'evaluation'->'fallas') = 'array' THEN ev.payload->'evaluation'->'fallas' ELSE '[]'::jsonb END) f
             UNION ALL
             SELECT jsonb_array_elements_text(CASE WHEN jsonb_typeof(ev.payload->'evaluation'->'flags_detected') = 'array' THEN ev.payload->'evaluation'->'flags_detected' ELSE '[]'::jsonb END)
           ) t WHERE x IS NOT NULL AND x <> ''
         ), '{}'),
         (SELECT count(*)::integer FROM jsonb_array_elements(CASE WHEN jsonb_typeof(ev.payload->'evaluation'->'fallas') = 'array' THEN ev.payload->'evaluation'->'fallas' ELSE '[]'::jsonb END) f
           WHERE coalesce(f->>'severidad', f->>'severity') = 'critical'),
         (ev.audio_url IS NOT NULL AND ev.audio_url <> '')
  FROM ev
  JOIN public.sellers s ON s.id = ev.seller_id
  LEFT JOIN public.companies c ON c.id = s.company_id
  WHERE ev.created_at >= _desde AND ev.created_at < _hasta
  ORDER BY ev.created_at DESC
  LIMIT least(greatest(coalesce(_limite, 2000), 1), 3000);
END;
$$;
REVOKE EXECUTE ON FUNCTION public.admin_practicas(timestamptz, timestamptz, integer) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_practicas(timestamptz, timestamptz, integer) TO authenticated;

-- El detalle de una práctica: todo lo que vio y dijo el vendedor, y cómo se calificó.
CREATE OR REPLACE FUNCTION public.admin_practica(_id uuid)
RETURNS jsonb
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public
AS $$
DECLARE r jsonb;
BEGIN
  IF NOT public.es_admin_plataforma() THEN
    RAISE EXCEPTION 'Solo administradores de la plataforma';
  END IF;
  SELECT jsonb_build_object(
    'id', e.id, 'created_at', e.created_at, 'node_id', e.node_id, 'payload', e.payload,
    'audio_url', e.audio_url, 'prompt_version', e.prompt_version, 'model', e.model,
    'vendedor', s.full_name, 'audio_consent', coalesce(s.audio_consent, false),
    'empresa', c.name, 'personal', coalesce(c.is_personal, false),
    'nodo', n.name
  ) INTO r
  FROM public.seller_events e
  JOIN public.sellers s ON s.id = e.seller_id
  LEFT JOIN public.companies c ON c.id = s.company_id
  LEFT JOIN public.nodes n ON n.id = e.node_id
  WHERE e.id = _id AND e.event_type = 'practice_session';
  RETURN r;
END;
$$;
REVOKE EXECUTE ON FUNCTION public.admin_practica(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_practica(uuid) TO authenticated;

-- El audio: el administrador puede pedir el enlace firmado de una grabación (solo lectura).
DROP POLICY IF EXISTS "practice_audio_select_admin" ON storage.objects;
CREATE POLICY "practice_audio_select_admin" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'practice-audio' AND public.es_admin_plataforma());

DO $chk$
BEGIN
  IF (SELECT count(*) FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
      WHERE n.nspname = 'public' AND p.proname IN ('es_admin_plataforma', 'admin_practicas', 'admin_practica') AND p.prosecdef) <> 3 THEN
    RAISE EXCEPTION 'faltan las funciones del panel (security definer)';
  END IF;
  IF has_function_privilege('anon', 'public.admin_practicas(timestamptz, timestamptz, integer)', 'EXECUTE')
     OR has_function_privilege('anon', 'public.admin_practica(uuid)', 'EXECUTE') THEN
    RAISE EXCEPTION 'anon no debe poder leer prácticas';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'practice_audio_select_admin') THEN
    RAISE EXCEPTION 'falta la regla del audio para administradores';
  END IF;
END
$chk$;
