
-- Validar código (callable por anónimos durante registro)
CREATE OR REPLACE FUNCTION public.validate_invite_code(_code text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _inv public.company_invites%ROWTYPE;
  _company_name text;
BEGIN
  SELECT * INTO _inv FROM public.company_invites WHERE code = _code;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('valid', false, 'reason', 'not_found');
  END IF;

  IF _inv.locked_until IS NOT NULL AND _inv.locked_until > now() THEN
    RETURN jsonb_build_object('valid', false, 'reason', 'locked');
  END IF;

  IF _inv.used THEN
    RETURN jsonb_build_object('valid', false, 'reason', 'used');
  END IF;

  IF _inv.expires_at < now() THEN
    RETURN jsonb_build_object('valid', false, 'reason', 'expired');
  END IF;

  SELECT name INTO _company_name FROM public.companies WHERE id = _inv.company_id;

  RETURN jsonb_build_object(
    'valid', true,
    'company_id', _inv.company_id,
    'company_name', _company_name
  );
END;
$$;

-- Registrar intento fallido (anon callable). 5 intentos => bloqueo 24h.
CREATE OR REPLACE FUNCTION public.register_invite_failed_attempt(_code text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.company_invites
    SET failed_attempts = failed_attempts + 1,
        locked_until = CASE
          WHEN failed_attempts + 1 >= 5 THEN now() + interval '24 hours'
          ELSE locked_until
        END
    WHERE code = _code;
END;
$$;

-- Aplicar código al usuario autenticado: vincula profile y crea seller.
CREATE OR REPLACE FUNCTION public.apply_invite_code(_code text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _uid uuid := auth.uid();
  _inv public.company_invites%ROWTYPE;
  _seller_id uuid;
  _full_name text;
BEGIN
  IF _uid IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  SELECT * INTO _inv FROM public.company_invites WHERE code = _code FOR UPDATE;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'not_found');
  END IF;
  IF _inv.used THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'used');
  END IF;
  IF _inv.locked_until IS NOT NULL AND _inv.locked_until > now() THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'locked');
  END IF;
  IF _inv.expires_at < now() THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'expired');
  END IF;

  -- Vincular profile a la empresa con rol vendedor
  UPDATE public.profiles
    SET company_id = _inv.company_id, role = 'vendedor'
    WHERE id = _uid
    RETURNING full_name INTO _full_name;

  -- Crear seller si no existe
  INSERT INTO public.sellers (profile_id, company_id, full_name)
  VALUES (_uid, _inv.company_id, _full_name)
  ON CONFLICT (profile_id) DO UPDATE SET company_id = EXCLUDED.company_id
  RETURNING id INTO _seller_id;

  -- Marcar invite como usado
  UPDATE public.company_invites
    SET used = true, used_by = _uid
    WHERE id = _inv.id;

  RETURN jsonb_build_object('ok', true, 'company_id', _inv.company_id, 'seller_id', _seller_id);
END;
$$;

-- Crear empresa para manager recién registrado.
CREATE OR REPLACE FUNCTION public.create_company_for_manager(_name text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _uid uuid := auth.uid();
  _company_id uuid;
  _existing uuid;
BEGIN
  IF _uid IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  SELECT company_id INTO _existing FROM public.profiles WHERE id = _uid;
  IF _existing IS NOT NULL THEN
    RETURN jsonb_build_object('ok', true, 'company_id', _existing, 'already', true);
  END IF;

  INSERT INTO public.companies (name) VALUES (_name) RETURNING id INTO _company_id;

  UPDATE public.profiles
    SET company_id = _company_id, role = 'manager'
    WHERE id = _uid;

  RETURN jsonb_build_object('ok', true, 'company_id', _company_id);
END;
$$;

-- Permisos: validate y register_failed callables por anon (registro);
-- apply y create_company solo authenticated.
REVOKE EXECUTE ON FUNCTION public.validate_invite_code(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.validate_invite_code(text) TO anon, authenticated;

REVOKE EXECUTE ON FUNCTION public.register_invite_failed_attempt(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.register_invite_failed_attempt(text) TO anon, authenticated;

REVOKE EXECUTE ON FUNCTION public.apply_invite_code(text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.apply_invite_code(text) TO authenticated;

REVOKE EXECUTE ON FUNCTION public.create_company_for_manager(text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.create_company_for_manager(text) TO authenticated;
