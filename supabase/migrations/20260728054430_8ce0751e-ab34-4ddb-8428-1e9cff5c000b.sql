
CREATE OR REPLACE FUNCTION public.generate_company_invite(_hours integer DEFAULT 168)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  _company_id uuid;
  _company_name text;
  _is_personal boolean;
  _prefix text;
  _code text;
  _try int := 0;
  _expires timestamptz;
BEGIN
  IF NOT public.is_manager() THEN
    RAISE EXCEPTION 'Only managers';
  END IF;
  IF _hours NOT IN (24, 168, 720) THEN
    RAISE EXCEPTION 'Invalid duration';
  END IF;
  _company_id := public.current_company_id();
  IF _company_id IS NULL THEN
    RAISE EXCEPTION 'Manager has no company';
  END IF;
  SELECT name, is_personal INTO _company_name, _is_personal
    FROM public.companies WHERE id = _company_id;
  IF _is_personal THEN
    RAISE EXCEPTION 'Personal companies cannot invite';
  END IF;

  -- Revoke ANY non-revoked invite (vigente o expirado) to satisfy the unique index
  UPDATE public.company_invites
    SET revoked_at = now()
    WHERE company_id = _company_id
      AND revoked_at IS NULL;

  _prefix := public._company_prefix(_company_name);
  _expires := now() + make_interval(hours => _hours);

  LOOP
    _code := _prefix || '-' || public._gen_invite_suffix();
    EXIT WHEN NOT EXISTS (SELECT 1 FROM public.company_invites WHERE code = _code);
    _try := _try + 1;
    IF _try > 12 THEN RAISE EXCEPTION 'Could not generate unique code'; END IF;
  END LOOP;

  INSERT INTO public.company_invites (company_id, code, expires_at, created_by, duration_hours, used)
    VALUES (_company_id, _code, _expires, auth.uid(), _hours, false);

  RETURN jsonb_build_object('code', _code, 'expires_at', _expires, 'duration_hours', _hours);
END;
$function$;

CREATE OR REPLACE FUNCTION public.revoke_company_invite()
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  _company_id uuid;
BEGIN
  IF NOT public.is_manager() THEN RAISE EXCEPTION 'Only managers'; END IF;
  _company_id := public.current_company_id();
  UPDATE public.company_invites
    SET revoked_at = now()
    WHERE company_id = _company_id
      AND revoked_at IS NULL;
  RETURN jsonb_build_object('ok', true);
END;
$function$;

-- Clean up orphan expired-but-not-revoked invites
UPDATE public.company_invites
  SET revoked_at = now()
  WHERE revoked_at IS NULL
    AND expires_at <= now();
