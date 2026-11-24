-- Mensaje 170 · SOLO si hay que regresar: deja la base como estaba antes del 170
-- (las políticas, funciones y el almacén de audios del reporte del 24-nov, tal cual).
-- Va junto con regresar la app (los archivos de src) a sus huellas de antes: la app
-- vieja escribe el avance directo, y sin estas políticas no podría.

BEGIN;

DO $do$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace WHERE n.nspname='public' AND p.proname='avanzar_nodo') THEN
    RAISE EXCEPTION 'avanzar_nodo no existe: el 170 no está aplicado';
  END IF;
END
$do$;

-- 1 y 2. Avance y prácticas
DROP FUNCTION public.avanzar_nodo(text, jsonb);
DROP POLICY "managers read company node_progress" ON public.node_progress;
CREATE POLICY "managers all node_progress" ON public.node_progress FOR ALL TO authenticated
  USING ((company_id = current_company_id()) AND is_manager()) WITH CHECK ((company_id = current_company_id()) AND is_manager());
CREATE POLICY "seller writes own progress" ON public.node_progress FOR INSERT TO authenticated
  WITH CHECK (owns_seller(seller_id) AND (company_id = current_company_id()));
CREATE POLICY "seller updates own progress" ON public.node_progress FOR UPDATE TO authenticated
  USING (owns_seller(seller_id));
GRANT INSERT, UPDATE, DELETE ON public.node_progress TO anon, authenticated;

DROP POLICY "managers read company sessions" ON public.practice_sessions;
CREATE POLICY "managers all sessions" ON public.practice_sessions FOR ALL TO authenticated
  USING ((company_id = current_company_id()) AND is_manager()) WITH CHECK ((company_id = current_company_id()) AND is_manager());
CREATE POLICY "seller updates own sessions" ON public.practice_sessions FOR UPDATE TO authenticated
  USING (owns_seller(seller_id));
GRANT UPDATE, DELETE ON public.practice_sessions TO anon, authenticated;

-- 3. Campos del vendedor (la función de antes)
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
      OR NEW.joined_at IS DISTINCT FROM OLD.joined_at) THEN
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

-- 4. Invitaciones (las funciones de antes)
CREATE OR REPLACE FUNCTION public._gen_invite_suffix()
 RETURNS text
 LANGUAGE plpgsql
AS $function$
DECLARE
  chars text := 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
  s text := '';
  i int;
BEGIN
  FOR i IN 1..6 LOOP
    s := s || substr(chars, 1 + floor(random() * length(chars))::int, 1);
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
  _now timestamptz := now();
BEGIN
  IF _uid IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;

  SELECT * INTO _inv FROM public.company_invites WHERE code = upper(trim(_code));
  IF NOT FOUND THEN RETURN jsonb_build_object('ok', false, 'reason', 'not_found'); END IF;
  IF _inv.revoked_at IS NOT NULL THEN RETURN jsonb_build_object('ok', false, 'reason', 'revoked'); END IF;
  IF _inv.expires_at <= _now THEN RETURN jsonb_build_object('ok', false, 'reason', 'expired'); END IF;

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
  _now timestamptz := now();
BEGIN
  IF _uid IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;

  SELECT p.company_id, c.is_personal INTO _current_company, _is_personal
    FROM public.profiles p LEFT JOIN public.companies c ON c.id = p.company_id
    WHERE p.id = _uid;

  IF _current_company IS NOT NULL AND NOT COALESCE(_is_personal, false) THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'already_in_company');
  END IF;

  SELECT * INTO _inv FROM public.company_invites WHERE code = upper(trim(_code));
  IF NOT FOUND THEN RETURN jsonb_build_object('ok', false, 'reason', 'not_found'); END IF;
  IF _inv.revoked_at IS NOT NULL THEN RETURN jsonb_build_object('ok', false, 'reason', 'revoked'); END IF;
  IF _inv.expires_at <= _now THEN RETURN jsonb_build_object('ok', false, 'reason', 'expired'); END IF;

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

-- 5. Audios
UPDATE storage.buckets SET allowed_mime_types = NULL WHERE id = 'practice-audio';
CREATE POLICY "practice_audio_insert_own" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK ((bucket_id = 'practice-audio'::text) AND (EXISTS ( SELECT 1
   FROM public.sellers s
  WHERE ((s.profile_id = auth.uid()) AND ((s.id)::text = (storage.foldername(objects.name))[1])))));
CREATE POLICY "practice_audio_update_own" ON storage.objects FOR UPDATE TO authenticated
  USING ((bucket_id = 'practice-audio'::text) AND (EXISTS ( SELECT 1
   FROM public.sellers s
  WHERE ((s.profile_id = auth.uid()) AND ((s.id)::text = (storage.foldername(objects.name))[1])))))
  WITH CHECK ((bucket_id = 'practice-audio'::text) AND (EXISTS ( SELECT 1
   FROM public.sellers s
  WHERE ((s.profile_id = auth.uid()) AND ((s.id)::text = (storage.foldername(objects.name))[1])))));

COMMIT;

SELECT 'avanzar_nodo' AS que, count(*)::text AS valor FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace WHERE n.nspname='public' AND p.proname='avanzar_nodo'
UNION ALL SELECT 'politicas node_progress', string_agg(policyname || ':' || cmd, ', ' ORDER BY policyname) FROM pg_policies WHERE schemaname='public' AND tablename='node_progress'
UNION ALL SELECT 'politicas practice_sessions', string_agg(policyname || ':' || cmd, ', ' ORDER BY policyname) FROM pg_policies WHERE schemaname='public' AND tablename='practice_sessions'
UNION ALL SELECT 'politicas audio', string_agg(policyname || ':' || cmd, ', ' ORDER BY policyname) FROM pg_policies WHERE schemaname='storage' AND tablename='objects' AND policyname LIKE 'practice_audio%';
