-- Mensaje 170 · Seguridad: el avance, la certificación, las invitaciones y los audios
-- se deciden en el servidor, no en el teléfono.
--
-- 1. avanzar_nodo(): la ÚNICA forma de que un vendedor complete un nodo. El servidor
--    comprueba la prueba: el nodo de lectura no tiene quiz ni práctica; el quiz se
--    califica con las respuestas correctas de la base; la práctica con su calificación
--    guardada (evaluaciones_practica, que solo escribe closer-voice). Solo se puede
--    completar el nodo que le toca (el primero sin terminar, como el mapa) o repetir
--    uno ya terminado. La certificación (7.4 con 85 o más) la sella esta función.
-- 2. node_progress y practice_sessions: el vendedor ya no puede escribir su avance
--    ni cambiar una práctica guardada; el gerente solo los lee.
-- 3. sellers: certified_at, xp_total, streak_days, last_practice_date y current_level
--    ya no se cambian desde la app (se agregan a proteger_campos_sensibles).
-- 4. Invitaciones: el sufijo sale de un azar criptográfico; apply_invite_code y
--    join_company_with_code tienen el mismo límite que validate_invite_code (10
--    intentos fallidos por hora por persona) y registran cada intento; apply ya no
--    cambia de empresa a quien ya tiene una ni reinicia sus créditos.
-- 5. Audios: el almacén solo acepta tipos de audio, y los vendedores ya no pueden
--    subir ni reemplazar archivos directo (solo por save-practice-event).
--
-- Versión para la herramienta de la base de Lovable (24-nov): ella abre y cierra la transacción,
-- así que este archivo no trae BEGIN/COMMIT. Los tipos de audio del almacén se ponen con la
-- herramienta del almacén, aparte, y la verificación se corre aparte (seguridad_170_verificar.sql).
-- Si algo no está como se espera, falla y NO cambia nada.

DO $do$
BEGIN
  -- Guardas: el estado de hoy es el que se revisó el 24-nov.
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='node_progress' AND policyname='seller writes own progress') THEN
    RAISE EXCEPTION 'node_progress no tiene la política esperada «seller writes own progress»';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='practice_sessions' AND policyname='seller updates own sessions') THEN
    RAISE EXCEPTION 'practice_sessions no tiene la política esperada «seller updates own sessions»';
  END IF;
  IF EXISTS (SELECT 1 FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace WHERE n.nspname='public' AND p.proname='avanzar_nodo') THEN
    RAISE EXCEPTION 'avanzar_nodo ya existe: el 170 ya se aplicó';
  END IF;
END
$do$;

-- ───────────────────────── 1. avanzar_nodo ─────────────────────────
CREATE OR REPLACE FUNCTION public.avanzar_nodo(_node_id text, _prueba jsonb DEFAULT '{}'::jsonb)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  _uid uuid := auth.uid();
  _tipo text := coalesce(_prueba->>'tipo', '');
  _seller_id uuid;
  _company_id uuid;
  _certified_at timestamptz;
  _world int;
  _order int;
  _script jsonb;
  _tiene_practica boolean;
  _tiene_quiz boolean;
  _prog_id uuid;
  _prog_status text;
  _prev_stars int := 0;
  _le_toca text;
  _stars int := 0;
  _score numeric := 0;
  _best int;
  _status text;
  _ps_id uuid;
  _ps_seller uuid;
  _ps_node text;
  _ev_estado text;
  _ev_resultado jsonb;
  _correctas text[];
  _respuestas text[];
  _next text;
  _certifica boolean := false;
BEGIN
  IF _uid IS NULL THEN RAISE EXCEPTION 'Not authenticated' USING ERRCODE = '42501'; END IF;

  SELECT id, company_id, certified_at INTO _seller_id, _company_id, _certified_at
    FROM public.sellers WHERE profile_id = _uid;
  IF _seller_id IS NULL THEN RETURN jsonb_build_object('ok', false, 'reason', 'sin_vendedor'); END IF;

  SELECT world_id, order_index, practice_script INTO _world, _order, _script
    FROM public.nodes WHERE id = _node_id;
  IF NOT FOUND THEN RETURN jsonb_build_object('ok', false, 'reason', 'nodo_no_existe'); END IF;
  _tiene_practica := _script IS NOT NULL AND jsonb_typeof(_script) <> 'null';
  _tiene_quiz := EXISTS (SELECT 1 FROM public.node_quiz_questions q WHERE q.node_id = _node_id);

  SELECT id, status, coalesce(stars, 0) INTO _prog_id, _prog_status, _prev_stars
    FROM public.node_progress WHERE seller_id = _seller_id AND node_id = _node_id
    ORDER BY (status = 'done') DESC LIMIT 1;
  _prev_stars := coalesce(_prev_stars, 0);

  -- Solo el nodo que le toca (el primero sin terminar, igual que el mapa) o uno ya terminado.
  SELECT n.id INTO _le_toca FROM public.nodes n
    WHERE NOT EXISTS (SELECT 1 FROM public.node_progress p WHERE p.seller_id = _seller_id AND p.node_id = n.id AND p.status = 'done')
    ORDER BY n.world_id, n.order_index LIMIT 1;
  -- (Emilio, como administrador de la plataforma, prueba nodos en cualquier orden.)
  IF coalesce(_prog_status, '') <> 'done' AND _le_toca IS DISTINCT FROM _node_id AND NOT public.es_admin_plataforma() THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'no_le_toca');
  END IF;

  IF _tipo = 'lectura' THEN
    IF _tiene_quiz OR _tiene_practica THEN RETURN jsonb_build_object('ok', false, 'reason', 'no_es_de_lectura'); END IF;
    _stars := 0;
    _status := 'done';

  ELSIF _tipo = 'quiz' THEN
    IF NOT _tiene_quiz THEN RETURN jsonb_build_object('ok', false, 'reason', 'sin_quiz'); END IF;
    IF _tiene_practica THEN RETURN jsonb_build_object('ok', false, 'reason', 'se_completa_con_la_practica'); END IF;
    SELECT array_agg(q.correct_option::text ORDER BY q.question_order) INTO _correctas
      FROM public.node_quiz_questions q WHERE q.node_id = _node_id;
    IF jsonb_typeof(_prueba->'respuestas') IS DISTINCT FROM 'array' THEN
      RETURN jsonb_build_object('ok', false, 'reason', 'sin_respuestas');
    END IF;
    SELECT array_agg(x ORDER BY i) INTO _respuestas
      FROM jsonb_array_elements_text(_prueba->'respuestas') WITH ORDINALITY AS t(x, i);
    IF _respuestas IS DISTINCT FROM _correctas THEN
      RETURN jsonb_build_object('ok', false, 'reason', 'quiz_no_aprobado');
    END IF;
    _stars := 3;
    _status := 'done';

  ELSIF _tipo = 'practica' THEN
    IF NOT _tiene_practica THEN RETURN jsonb_build_object('ok', false, 'reason', 'sin_practica'); END IF;
    BEGIN
      _ps_id := (_prueba->>'practice_session_id')::uuid;
    EXCEPTION WHEN others THEN
      RETURN jsonb_build_object('ok', false, 'reason', 'practica_invalida');
    END;
    SELECT seller_id, node_id INTO _ps_seller, _ps_node FROM public.practice_sessions WHERE id = _ps_id;
    IF _ps_seller IS NULL OR _ps_seller <> _seller_id THEN RETURN jsonb_build_object('ok', false, 'reason', 'practica_no_es_tuya'); END IF;
    IF _ps_node IS DISTINCT FROM _node_id THEN RETURN jsonb_build_object('ok', false, 'reason', 'practica_de_otro_nodo'); END IF;
    SELECT estado, resultado INTO _ev_estado, _ev_resultado
      FROM public.evaluaciones_practica WHERE practice_session_id = _ps_id;
    IF _ev_estado IS DISTINCT FROM 'lista' OR _ev_resultado IS NULL THEN
      RETURN jsonb_build_object('ok', false, 'reason', 'sin_calificacion');
    END IF;
    _score := coalesce((_ev_resultado->>'score')::numeric, 0);
    -- Las mismas estrellas que puntuacion.ts (estrellasDe).
    _stars := CASE WHEN _score >= 85 THEN 3 WHEN _score >= 60 THEN 2 WHEN _score >= 30 THEN 1 ELSE 0 END;
    -- Con 2 estrellas el nodo queda dominado y abre el siguiente; lo ganado no se pierde.
    _status := CASE WHEN greatest(_stars, _prev_stars) >= 2 OR _prog_status = 'done' THEN 'done' ELSE 'current' END;
    _certifica := _node_id = '7.4' AND _score >= 85 AND _certified_at IS NULL;

  ELSE
    RETURN jsonb_build_object('ok', false, 'reason', 'tipo_desconocido');
  END IF;

  _best := greatest(_stars, _prev_stars);
  IF _prog_status = 'done' THEN _status := 'done'; END IF;

  IF _prog_id IS NOT NULL THEN
    UPDATE public.node_progress
       SET status = _status, stars = _best, last_practiced_at = now()
     WHERE id = _prog_id;
  ELSE
    INSERT INTO public.node_progress (seller_id, company_id, node_id, status, stars, last_practiced_at)
    VALUES (_seller_id, _company_id, _node_id, _status, _best, now());
  END IF;

  IF _certifica THEN
    UPDATE public.sellers SET certified_at = now() WHERE id = _seller_id AND certified_at IS NULL;
  END IF;

  -- Abre el siguiente (mismo mundo, si no el primero del siguiente mundo), como hacía la app.
  IF _status = 'done' AND coalesce(_prog_status, '') <> 'done' THEN
    SELECT n.id INTO _next FROM public.nodes n
      WHERE (n.world_id = _world AND n.order_index > _order) OR n.world_id > _world
      ORDER BY n.world_id, n.order_index LIMIT 1;
    IF _next IS NOT NULL THEN
      IF EXISTS (SELECT 1 FROM public.node_progress WHERE seller_id = _seller_id AND node_id = _next) THEN
        UPDATE public.node_progress SET status = 'current'
         WHERE seller_id = _seller_id AND node_id = _next AND status = 'locked';
      ELSE
        INSERT INTO public.node_progress (seller_id, company_id, node_id, status)
        VALUES (_seller_id, _company_id, _next, 'current');
      END IF;
    END IF;
  END IF;

  RETURN jsonb_build_object(
    'ok', true,
    'status', _status,
    'stars', _stars,
    'best_stars', _best,
    'previous_stars', _prev_stars,
    'was_completed', coalesce(_prog_status, '') = 'done',
    'desbloqueo_ahora', _status = 'done' AND coalesce(_prog_status, '') <> 'done',
    'next_node_id', _next,
    'certified', _certifica
  );
END;
$function$;

REVOKE EXECUTE ON FUNCTION public.avanzar_nodo(text, jsonb) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.avanzar_nodo(text, jsonb) TO authenticated, service_role;

-- ───────────────────────── 2. Avance y prácticas: solo lectura desde la app ─────────────────────────
DROP POLICY "seller writes own progress" ON public.node_progress;
DROP POLICY "seller updates own progress" ON public.node_progress;
DROP POLICY "managers all node_progress" ON public.node_progress;
CREATE POLICY "managers read company node_progress" ON public.node_progress FOR SELECT TO authenticated
  USING ((company_id = current_company_id()) AND is_manager());
REVOKE INSERT, UPDATE, DELETE ON public.node_progress FROM anon, authenticated;

DROP POLICY "seller updates own sessions" ON public.practice_sessions;
DROP POLICY "managers all sessions" ON public.practice_sessions;
CREATE POLICY "managers read company sessions" ON public.practice_sessions FOR SELECT TO authenticated
  USING ((company_id = current_company_id()) AND is_manager());
REVOKE UPDATE, DELETE ON public.practice_sessions FROM anon, authenticated;

-- ───────────────────────── 3. Campos del vendedor que no se cambian desde la app ─────────────────────────
CREATE OR REPLACE FUNCTION public.proteger_campos_sensibles()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
BEGIN
  IF current_user NOT IN ('authenticated', 'anon') THEN
    RETURN NEW;
  END IF;

  IF TG_TABLE_NAME = 'profiles' THEN
    IF TG_OP = 'INSERT' THEN
      IF NEW.company_id IS NOT NULL OR NEW.role NOT IN ('vendedor', 'manager') THEN
        RAISE EXCEPTION 'No permitido: el perfil se crea sin empresa' USING ERRCODE = '42501';
      END IF;
    ELSIF NEW.role IS DISTINCT FROM OLD.role
       OR NEW.company_id IS DISTINCT FROM OLD.company_id
       OR NEW.id IS DISTINCT FROM OLD.id
       OR NEW.email IS DISTINCT FROM OLD.email THEN
      RAISE EXCEPTION 'No permitido: el rol, la empresa y el correo no se cambian desde la app' USING ERRCODE = '42501';
    END IF;

  ELSIF TG_TABLE_NAME = 'sellers' THEN
    IF TG_OP = 'INSERT' THEN
      RAISE EXCEPTION 'No permitido: los vendedores se crean con un código de invitación' USING ERRCODE = '42501';
    END IF;
    IF TG_OP = 'UPDATE' AND (
         NEW.profile_id IS DISTINCT FROM OLD.profile_id
      OR NEW.company_id IS DISTINCT FROM OLD.company_id
      OR NEW.credits_used_this_month IS DISTINCT FROM OLD.credits_used_this_month
      OR NEW.is_active IS DISTINCT FROM OLD.is_active
      OR NEW.joined_via_invite_id IS DISTINCT FROM OLD.joined_via_invite_id
      OR NEW.joined_at IS DISTINCT FROM OLD.joined_at
      -- Mensaje 170: la certificación y los logros los pone el servidor.
      OR NEW.certified_at IS DISTINCT FROM OLD.certified_at
      OR NEW.xp_total IS DISTINCT FROM OLD.xp_total
      OR NEW.streak_days IS DISTINCT FROM OLD.streak_days
      OR NEW.last_practice_date IS DISTINCT FROM OLD.last_practice_date
      OR NEW.current_level IS DISTINCT FROM OLD.current_level) THEN
      RAISE EXCEPTION 'No permitido: esos datos del vendedor no se cambian desde la app' USING ERRCODE = '42501';
    END IF;

  ELSIF TG_TABLE_NAME = 'companies' THEN
    IF TG_OP = 'UPDATE' AND (
         NEW.id IS DISTINCT FROM OLD.id
      OR NEW.plan IS DISTINCT FROM OLD.plan
      OR NEW.credits_per_month IS DISTINCT FROM OLD.credits_per_month
      OR NEW.is_personal IS DISTINCT FROM OLD.is_personal) THEN
      RAISE EXCEPTION 'No permitido: el plan y los créditos de la empresa no se cambian desde la app' USING ERRCODE = '42501';
    END IF;
  END IF;

  RETURN NEW;
END;
$function$;

-- ───────────────────────── 4. Invitaciones ─────────────────────────
-- El azar sale de gen_random_uuid() (fuente criptográfica). Solo se usan los
-- bytes del uuid que son azar puro (el 6 y el 8 llevan la versión y la variante),
-- y se descartan los bytes ≥ 248 para que las 31 letras salgan parejas.
CREATE OR REPLACE FUNCTION public._gen_invite_suffix()
 RETURNS text
 LANGUAGE plpgsql
AS $function$
DECLARE
  chars text := 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
  s text := '';
  b bytea;
  i int;
  v int;
BEGIN
  WHILE length(s) < 6 LOOP
    b := decode(replace(gen_random_uuid()::text, '-', ''), 'hex');
    FOREACH i IN ARRAY ARRAY[0,1,2,3,4,5,7,9,10,11,12,13,14,15] LOOP
      v := get_byte(b, i);
      IF v < 248 AND length(s) < 6 THEN
        s := s || substr(chars, 1 + (v % 31), 1);
      END IF;
    END LOOP;
  END LOOP;
  RETURN s;
END;
$function$;

CREATE OR REPLACE FUNCTION public.apply_invite_code(_code text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  _uid uuid := auth.uid();
  _inv public.company_invites%ROWTYPE;
  _seller_id uuid;
  _full_name text;
  _current_company uuid;
  _recent_fails int;
  _now timestamptz := now();
BEGIN
  IF _uid IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;

  -- Mensaje 170: el mismo límite que validate_invite_code (10 fallidos por hora por persona).
  SELECT count(*) INTO _recent_fails FROM public.invite_attempts
    WHERE actor_id = _uid AND outcome <> 'valid' AND created_at > now() - interval '1 hour';
  IF _recent_fails >= 10 THEN RETURN jsonb_build_object('ok', false, 'reason', 'rate_limited'); END IF;

  SELECT * INTO _inv FROM public.company_invites WHERE code = upper(trim(_code));
  IF NOT FOUND THEN
    INSERT INTO public.invite_attempts(actor_id, code, outcome) VALUES (_uid, left(_code, 40), 'not_found');
    RETURN jsonb_build_object('ok', false, 'reason', 'not_found');
  END IF;
  IF _inv.revoked_at IS NOT NULL THEN
    INSERT INTO public.invite_attempts(actor_id, code, outcome) VALUES (_uid, left(_code, 40), 'revoked');
    RETURN jsonb_build_object('ok', false, 'reason', 'revoked');
  END IF;
  IF _inv.expires_at <= _now THEN
    INSERT INTO public.invite_attempts(actor_id, code, outcome) VALUES (_uid, left(_code, 40), 'expired');
    RETURN jsonb_build_object('ok', false, 'reason', 'expired');
  END IF;

  -- Mensaje 170: quien ya tiene empresa no se cambia con este código ni reinicia sus créditos.
  SELECT company_id INTO _current_company FROM public.profiles WHERE id = _uid;
  IF _current_company IS NOT NULL THEN
    IF _current_company = _inv.company_id THEN
      SELECT id INTO _seller_id FROM public.sellers WHERE profile_id = _uid;
      RETURN jsonb_build_object('ok', true, 'company_id', _inv.company_id, 'seller_id', _seller_id, 'already', true);
    END IF;
    RETURN jsonb_build_object('ok', false, 'reason', 'already_in_company');
  END IF;

  INSERT INTO public.invite_attempts(actor_id, code, outcome) VALUES (_uid, left(_code, 40), 'valid');

  UPDATE public.profiles
    SET company_id = _inv.company_id, role = 'vendedor'
    WHERE id = _uid
    RETURNING full_name INTO _full_name;

  INSERT INTO public.sellers (profile_id, company_id, full_name, joined_via_invite_id, joined_at)
    VALUES (_uid, _inv.company_id, _full_name, _inv.id, _now)
    ON CONFLICT (profile_id) DO UPDATE
      SET company_id = EXCLUDED.company_id,
          joined_via_invite_id = EXCLUDED.joined_via_invite_id,
          joined_at = EXCLUDED.joined_at,
          credits_used_this_month = 0
    RETURNING id INTO _seller_id;

  RETURN jsonb_build_object('ok', true, 'company_id', _inv.company_id, 'seller_id', _seller_id);
END;
$function$;

CREATE OR REPLACE FUNCTION public.join_company_with_code(_code text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  _uid uuid := auth.uid();
  _inv public.company_invites%ROWTYPE;
  _current_company uuid;
  _is_personal boolean;
  _recent_fails int;
  _now timestamptz := now();
BEGIN
  IF _uid IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;

  -- Mensaje 170: el mismo límite que validate_invite_code (10 fallidos por hora por persona).
  SELECT count(*) INTO _recent_fails FROM public.invite_attempts
    WHERE actor_id = _uid AND outcome <> 'valid' AND created_at > now() - interval '1 hour';
  IF _recent_fails >= 10 THEN RETURN jsonb_build_object('ok', false, 'reason', 'rate_limited'); END IF;

  SELECT p.company_id, c.is_personal INTO _current_company, _is_personal
    FROM public.profiles p LEFT JOIN public.companies c ON c.id = p.company_id
    WHERE p.id = _uid;

  IF _current_company IS NOT NULL AND NOT COALESCE(_is_personal, false) THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'already_in_company');
  END IF;

  SELECT * INTO _inv FROM public.company_invites WHERE code = upper(trim(_code));
  IF NOT FOUND THEN
    INSERT INTO public.invite_attempts(actor_id, code, outcome) VALUES (_uid, left(_code, 40), 'not_found');
    RETURN jsonb_build_object('ok', false, 'reason', 'not_found');
  END IF;
  IF _inv.revoked_at IS NOT NULL THEN
    INSERT INTO public.invite_attempts(actor_id, code, outcome) VALUES (_uid, left(_code, 40), 'revoked');
    RETURN jsonb_build_object('ok', false, 'reason', 'revoked');
  END IF;
  IF _inv.expires_at <= _now THEN
    INSERT INTO public.invite_attempts(actor_id, code, outcome) VALUES (_uid, left(_code, 40), 'expired');
    RETURN jsonb_build_object('ok', false, 'reason', 'expired');
  END IF;

  INSERT INTO public.invite_attempts(actor_id, code, outcome) VALUES (_uid, left(_code, 40), 'valid');

  UPDATE public.profiles
    SET company_id = _inv.company_id, role = 'vendedor'
    WHERE id = _uid;

  UPDATE public.sellers
    SET company_id = _inv.company_id,
        joined_via_invite_id = _inv.id,
        joined_at = _now,
        credits_used_this_month = 0
    WHERE profile_id = _uid;

  RETURN jsonb_build_object('ok', true, 'company_id', _inv.company_id);
END;
$function$;

-- ───────────────────────── 5. Audios ─────────────────────────
-- (Los tipos de audio del almacén se ponen con la herramienta del almacén, aparte.)
DROP POLICY "practice_audio_insert_own" ON storage.objects;
DROP POLICY "practice_audio_update_own" ON storage.objects;
