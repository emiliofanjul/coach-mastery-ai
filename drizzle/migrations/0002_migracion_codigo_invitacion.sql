CREATE OR REPLACE FUNCTION public.validate_invite_code(_code text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  _uid uuid := auth.uid();
  _inv public.company_invites%ROWTYPE;
  _company_name text;
  _recent_fails int;
BEGIN
  IF _uid IS NOT NULL THEN
    -- Con sesión: 10 intentos fallidos por hora por persona.
    SELECT count(*) INTO _recent_fails FROM public.invite_attempts
      WHERE actor_id = _uid
        AND outcome <> 'valid'
        AND created_at > now() - interval '1 hour';
    IF _recent_fails >= 10 THEN
      RETURN jsonb_build_object('valid', false, 'reason', 'rate_limited');
    END IF;
  ELSE
    -- Sin sesión (vendedor que aún no crea su cuenta): tope global, antes de
    -- buscar el código, para que nadie pueda adivinar códigos probando.
    SELECT count(*) INTO _recent_fails FROM public.invite_attempts
      WHERE actor_id IS NULL
        AND outcome <> 'valid'
        AND created_at > now() - interval '1 hour';
    IF _recent_fails >= 300 THEN
      RETURN jsonb_build_object('valid', false, 'reason', 'rate_limited');
    END IF;
  END IF;

  SELECT * INTO _inv FROM public.company_invites WHERE code = upper(trim(_code));

  IF NOT FOUND THEN
    INSERT INTO public.invite_attempts(actor_id, code, outcome) VALUES (_uid, left(_code, 40), 'not_found');
    RETURN jsonb_build_object('valid', false, 'reason', 'not_found');
  END IF;

  IF _inv.revoked_at IS NOT NULL THEN
    INSERT INTO public.invite_attempts(actor_id, code, outcome) VALUES (_uid, left(_code, 40), 'revoked');
    RETURN jsonb_build_object('valid', false, 'reason', 'revoked');
  END IF;

  IF _inv.expires_at <= now() THEN
    INSERT INTO public.invite_attempts(actor_id, code, outcome) VALUES (_uid, left(_code, 40), 'expired');
    RETURN jsonb_build_object('valid', false, 'reason', 'expired');
  END IF;

  SELECT name INTO _company_name FROM public.companies WHERE id = _inv.company_id;
  INSERT INTO public.invite_attempts(actor_id, code, outcome) VALUES (_uid, left(_code, 40), 'valid');
  -- Sin sesión solo se devuelve el nombre de la empresa, no su id.
  IF _uid IS NULL THEN
    RETURN jsonb_build_object('valid', true, 'company_name', _company_name);
  END IF;
  RETURN jsonb_build_object('valid', true, 'company_id', _inv.company_id, 'company_name', _company_name);
END;
$function$;

REVOKE ALL ON FUNCTION public.validate_invite_code(_code text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.validate_invite_code(_code text) TO anon, authenticated, service_role;

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

REVOKE ALL ON FUNCTION public._gen_invite_suffix() FROM PUBLIC;