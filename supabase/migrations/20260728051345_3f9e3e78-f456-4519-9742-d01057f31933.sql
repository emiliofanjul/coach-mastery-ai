
-- ==========================================================================
-- 1. SCHEMA CHANGES
-- ==========================================================================

ALTER TABLE public.companies
  ADD COLUMN IF NOT EXISTS is_personal boolean NOT NULL DEFAULT false;

ALTER TABLE public.company_invites
  ADD COLUMN IF NOT EXISTS created_by uuid REFERENCES public.profiles(id),
  ADD COLUMN IF NOT EXISTS revoked_at timestamptz,
  ADD COLUMN IF NOT EXISTS duration_hours integer;

-- Retro-revocar cualquier invite duplicado por empresa dejando solo el más reciente activo
UPDATE public.company_invites ci
  SET revoked_at = now()
  WHERE revoked_at IS NULL
    AND EXISTS (
      SELECT 1 FROM public.company_invites x
      WHERE x.company_id = ci.company_id
        AND x.revoked_at IS NULL
        AND (x.created_at, x.id) > (ci.created_at, ci.id)
    );

-- Único código no-revocado por empresa (la validez temporal la aplica la función)
CREATE UNIQUE INDEX IF NOT EXISTS uniq_active_invite_per_company
  ON public.company_invites (company_id)
  WHERE revoked_at IS NULL;

ALTER TABLE public.sellers
  ADD COLUMN IF NOT EXISTS joined_via_invite_id uuid REFERENCES public.company_invites(id),
  ADD COLUMN IF NOT EXISTS joined_at timestamptz;

-- ==========================================================================
-- 2. INVITE_ATTEMPTS (rate limit anti-bruteforce)
-- ==========================================================================

CREATE TABLE IF NOT EXISTS public.invite_attempts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id uuid,
  code text NOT NULL,
  outcome text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_invite_attempts_actor_time
  ON public.invite_attempts (actor_id, created_at DESC);

GRANT SELECT, INSERT ON public.invite_attempts TO authenticated;
GRANT ALL ON public.invite_attempts TO service_role;

ALTER TABLE public.invite_attempts ENABLE ROW LEVEL SECURITY;
-- Solo el service role (funciones definer) escribe; los usuarios no leen esta tabla.
CREATE POLICY "no direct access" ON public.invite_attempts FOR ALL TO authenticated USING (false) WITH CHECK (false);

-- ==========================================================================
-- 3. HELPERS
-- ==========================================================================

-- Alfabeto sin ambigüedad (sin 0/O/1/I/L)
CREATE OR REPLACE FUNCTION public._gen_invite_suffix()
RETURNS text
LANGUAGE plpgsql
AS $$
DECLARE
  chars text := 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
  s text := '';
  i int;
BEGIN
  FOR i IN 1..4 LOOP
    s := s || substr(chars, 1 + floor(random() * length(chars))::int, 1);
  END LOOP;
  RETURN s;
END;
$$;

CREATE OR REPLACE FUNCTION public._company_prefix(_name text)
RETURNS text
LANGUAGE plpgsql
AS $$
DECLARE
  clean text;
BEGIN
  clean := upper(regexp_replace(coalesce(_name, 'CLOSER'), '[^A-Za-z0-9]', '', 'g'));
  IF length(clean) < 2 THEN clean := 'CLOSER'; END IF;
  RETURN substr(clean, 1, 8);
END;
$$;

-- ==========================================================================
-- 4. INVITE FUNCTIONS
-- ==========================================================================

CREATE OR REPLACE FUNCTION public.generate_company_invite(_hours integer DEFAULT 168)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
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

  -- Revoke any active invite for this company
  UPDATE public.company_invites
    SET revoked_at = now()
    WHERE company_id = _company_id
      AND revoked_at IS NULL
      AND expires_at > now();

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
$$;

CREATE OR REPLACE FUNCTION public.get_active_company_invite()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _company_id uuid;
  _row public.company_invites%ROWTYPE;
BEGIN
  IF NOT public.is_manager() THEN RAISE EXCEPTION 'Only managers'; END IF;
  _company_id := public.current_company_id();
  SELECT * INTO _row FROM public.company_invites
    WHERE company_id = _company_id
      AND revoked_at IS NULL
      AND expires_at > now()
    ORDER BY created_at DESC LIMIT 1;
  IF NOT FOUND THEN RETURN NULL; END IF;
  RETURN jsonb_build_object(
    'code', _row.code,
    'expires_at', _row.expires_at,
    'duration_hours', _row.duration_hours,
    'created_at', _row.created_at
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.revoke_company_invite()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _company_id uuid;
BEGIN
  IF NOT public.is_manager() THEN RAISE EXCEPTION 'Only managers'; END IF;
  _company_id := public.current_company_id();
  UPDATE public.company_invites
    SET revoked_at = now()
    WHERE company_id = _company_id
      AND revoked_at IS NULL
      AND expires_at > now();
  RETURN jsonb_build_object('ok', true);
END;
$$;

-- Rate-limited code validation
CREATE OR REPLACE FUNCTION public.validate_invite_code(_code text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _uid uuid := auth.uid();
  _inv public.company_invites%ROWTYPE;
  _company_name text;
  _recent_fails int;
BEGIN
  -- Rate limit: 10 failed attempts / hour per actor (or per code when anonymous)
  IF _uid IS NOT NULL THEN
    SELECT count(*) INTO _recent_fails FROM public.invite_attempts
      WHERE actor_id = _uid
        AND outcome <> 'valid'
        AND created_at > now() - interval '1 hour';
    IF _recent_fails >= 10 THEN
      RETURN jsonb_build_object('valid', false, 'reason', 'rate_limited');
    END IF;
  END IF;

  SELECT * INTO _inv FROM public.company_invites WHERE code = upper(trim(_code));

  IF NOT FOUND THEN
    INSERT INTO public.invite_attempts(actor_id, code, outcome) VALUES (_uid, _code, 'not_found');
    RETURN jsonb_build_object('valid', false, 'reason', 'not_found');
  END IF;

  IF _inv.revoked_at IS NOT NULL THEN
    INSERT INTO public.invite_attempts(actor_id, code, outcome) VALUES (_uid, _code, 'revoked');
    RETURN jsonb_build_object('valid', false, 'reason', 'revoked');
  END IF;

  IF _inv.expires_at <= now() THEN
    INSERT INTO public.invite_attempts(actor_id, code, outcome) VALUES (_uid, _code, 'expired');
    RETURN jsonb_build_object('valid', false, 'reason', 'expired');
  END IF;

  SELECT name INTO _company_name FROM public.companies WHERE id = _inv.company_id;
  INSERT INTO public.invite_attempts(actor_id, code, outcome) VALUES (_uid, _code, 'valid');
  RETURN jsonb_build_object(
    'valid', true,
    'company_id', _inv.company_id,
    'company_name', _company_name
  );
END;
$$;

-- Apply invite: links current user as seller of that company
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
$$;

-- ==========================================================================
-- 5. COMPANY LIFECYCLE FUNCTIONS
-- ==========================================================================

CREATE OR REPLACE FUNCTION public.create_personal_company()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _uid uuid := auth.uid();
  _existing uuid;
  _full_name text;
  _email text;
  _company_id uuid;
BEGIN
  IF _uid IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  SELECT company_id, full_name, email INTO _existing, _full_name, _email
    FROM public.profiles WHERE id = _uid;
  IF _existing IS NOT NULL THEN
    RETURN jsonb_build_object('ok', true, 'company_id', _existing, 'already', true);
  END IF;

  INSERT INTO public.companies (name, plan, credits_per_month, is_personal)
    VALUES (COALESCE(NULLIF(trim(_full_name), ''), _email, 'Mi entrenamiento'), 'individual', 30, true)
    RETURNING id INTO _company_id;

  UPDATE public.profiles
    SET company_id = _company_id, role = 'manager'
    WHERE id = _uid;

  RETURN jsonb_build_object('ok', true, 'company_id', _company_id);
END;
$$;

CREATE OR REPLACE FUNCTION public.create_team_company(_name text)
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
  IF _uid IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  IF _name IS NULL OR length(trim(_name)) < 2 THEN RAISE EXCEPTION 'Invalid name'; END IF;

  SELECT company_id INTO _existing FROM public.profiles WHERE id = _uid;
  IF _existing IS NOT NULL THEN
    RETURN jsonb_build_object('ok', true, 'company_id', _existing, 'already', true);
  END IF;

  INSERT INTO public.companies (name, plan, is_personal) VALUES (trim(_name), 'starter', false)
    RETURNING id INTO _company_id;

  UPDATE public.profiles
    SET company_id = _company_id, role = 'manager'
    WHERE id = _uid;

  RETURN jsonb_build_object('ok', true, 'company_id', _company_id);
END;
$$;

-- Convert a personal company to a real team company (keeps progress, brain, seller row)
CREATE OR REPLACE FUNCTION public.convert_personal_to_company(_name text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _uid uuid := auth.uid();
  _company_id uuid;
  _is_personal boolean;
BEGIN
  IF _uid IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  IF _name IS NULL OR length(trim(_name)) < 2 THEN RAISE EXCEPTION 'Invalid name'; END IF;

  SELECT p.company_id, c.is_personal INTO _company_id, _is_personal
    FROM public.profiles p JOIN public.companies c ON c.id = p.company_id
    WHERE p.id = _uid;

  IF _company_id IS NULL THEN RAISE EXCEPTION 'No company'; END IF;
  IF NOT _is_personal THEN RAISE EXCEPTION 'Company is not personal'; END IF;

  UPDATE public.companies
    SET is_personal = false, name = trim(_name), plan = 'starter'
    WHERE id = _company_id;

  UPDATE public.profiles SET role = 'manager' WHERE id = _uid;

  RETURN jsonb_build_object('ok', true, 'company_id', _company_id);
END;
$$;

-- Move an individual user into a real company via a valid invite code
CREATE OR REPLACE FUNCTION public.join_company_with_code(_code text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
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
$$;

-- ==========================================================================
-- 6. SELLER ACTIVE TOGGLE
-- ==========================================================================

CREATE OR REPLACE FUNCTION public.set_seller_active(_seller_id uuid, _active boolean)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _seller public.sellers%ROWTYPE;
BEGIN
  IF NOT public.is_manager() THEN RAISE EXCEPTION 'Only managers'; END IF;
  SELECT * INTO _seller FROM public.sellers WHERE id = _seller_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'Seller not found'; END IF;
  IF _seller.company_id <> public.current_company_id() THEN
    RAISE EXCEPTION 'Not your seller';
  END IF;
  UPDATE public.sellers SET is_active = _active WHERE id = _seller_id;
  RETURN jsonb_build_object('ok', true, 'is_active', _active);
END;
$$;

-- ==========================================================================
-- 7. GRANTS
-- ==========================================================================

GRANT EXECUTE ON FUNCTION public.generate_company_invite(integer) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_active_company_invite() TO authenticated;
GRANT EXECUTE ON FUNCTION public.revoke_company_invite() TO authenticated;
GRANT EXECUTE ON FUNCTION public.validate_invite_code(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.apply_invite_code(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_personal_company() TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_team_company(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.convert_personal_to_company(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.join_company_with_code(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.set_seller_active(uuid, boolean) TO authenticated;
