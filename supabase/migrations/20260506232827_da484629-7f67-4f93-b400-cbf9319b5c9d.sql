
-- Generador de código de invitación (8 chars formato ABCD-EFGH, sin caracteres confusos)
CREATE OR REPLACE FUNCTION public.generate_company_invite()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _company_id uuid;
  _chars text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  _code text;
  _i int;
  _try int := 0;
BEGIN
  IF NOT public.is_manager() THEN
    RAISE EXCEPTION 'Only managers can generate invite codes';
  END IF;
  _company_id := public.current_company_id();
  IF _company_id IS NULL THEN
    RAISE EXCEPTION 'Manager has no company';
  END IF;

  LOOP
    _code := '';
    FOR _i IN 1..8 LOOP
      _code := _code || substr(_chars, 1 + floor(random() * length(_chars))::int, 1);
      IF _i = 4 THEN _code := _code || '-'; END IF;
    END LOOP;
    EXIT WHEN NOT EXISTS (SELECT 1 FROM public.company_invites WHERE code = _code);
    _try := _try + 1;
    IF _try > 10 THEN RAISE EXCEPTION 'Could not generate unique code'; END IF;
  END LOOP;

  INSERT INTO public.company_invites (company_id, code, expires_at)
  VALUES (_company_id, _code, now() + interval '7 days');

  RETURN jsonb_build_object('code', _code, 'expires_at', now() + interval '7 days');
END;
$$;

-- Última invitación activa (no usada, no expirada) de la empresa
CREATE OR REPLACE FUNCTION public.get_active_company_invite()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _company_id uuid;
  _code text;
  _expires timestamptz;
BEGIN
  IF NOT public.is_manager() THEN
    RAISE EXCEPTION 'Only managers';
  END IF;
  _company_id := public.current_company_id();
  SELECT code, expires_at INTO _code, _expires
  FROM public.company_invites
  WHERE company_id = _company_id AND used = false AND expires_at > now()
  ORDER BY created_at DESC LIMIT 1;
  IF _code IS NULL THEN RETURN NULL; END IF;
  RETURN jsonb_build_object('code', _code, 'expires_at', _expires);
END;
$$;

-- Guardar Company Sales Brain + marcar onboarding completo
CREATE OR REPLACE FUNCTION public.update_company_brain(_brain jsonb)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _company_id uuid;
BEGIN
  IF NOT public.is_manager() THEN
    RAISE EXCEPTION 'Only managers';
  END IF;
  _company_id := public.current_company_id();
  UPDATE public.companies
    SET company_sales_brain = _brain,
        onboarding_completed = true
    WHERE id = _company_id;
  RETURN jsonb_build_object('ok', true);
END;
$$;

-- Guardar una respuesta de onboarding (idempotente por question_id)
CREATE OR REPLACE FUNCTION public.save_onboarding_answer(
  _block_number int,
  _question_id text,
  _question_text text,
  _answer text
) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _company_id uuid;
BEGIN
  IF NOT public.is_manager() THEN
    RAISE EXCEPTION 'Only managers';
  END IF;
  _company_id := public.current_company_id();
  -- borrar previa de la misma pregunta (idempotente)
  DELETE FROM public.company_onboarding_answers
    WHERE company_id = _company_id AND question_id = _question_id;
  INSERT INTO public.company_onboarding_answers (company_id, block_number, question_id, question_text, answer)
  VALUES (_company_id, _block_number, _question_id, _question_text, _answer);
END;
$$;
