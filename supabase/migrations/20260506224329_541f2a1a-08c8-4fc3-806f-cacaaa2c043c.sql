
-- =========================================================
-- CLOSER — Arquitectura de base de datos (15 tablas + RLS)
-- =========================================================

-- 1. companies
CREATE TABLE public.companies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text UNIQUE,
  company_sales_brain jsonb,
  onboarding_completed boolean NOT NULL DEFAULT false,
  plan text NOT NULL DEFAULT 'starter',
  credits_per_month integer NOT NULL DEFAULT 90,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 2. profiles
CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  company_id uuid REFERENCES public.companies(id) ON DELETE SET NULL,
  role text NOT NULL DEFAULT 'vendedor' CHECK (role IN ('manager','vendedor')),
  full_name text,
  email text,
  avatar_url text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Helper functions (SECURITY DEFINER) para RLS sin recursión
CREATE OR REPLACE FUNCTION public.current_company_id()
RETURNS uuid LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT company_id FROM public.profiles WHERE id = auth.uid()
$$;

CREATE OR REPLACE FUNCTION public.current_role()
RETURNS text LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid()
$$;

CREATE OR REPLACE FUNCTION public.is_manager()
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'manager')
$$;

-- 3. company_invites
CREATE TABLE public.company_invites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  code text UNIQUE NOT NULL,
  email text,
  used boolean NOT NULL DEFAULT false,
  used_by uuid REFERENCES public.profiles(id),
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '7 days'),
  failed_attempts integer NOT NULL DEFAULT 0,
  locked_until timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 4. sellers
CREATE TABLE public.sellers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  full_name text,
  experience_level text,
  main_challenge text,
  declaration text,
  current_world integer NOT NULL DEFAULT 0,
  current_node text NOT NULL DEFAULT '0.1',
  current_level text NOT NULL DEFAULT 'rookie',
  streak_days integer NOT NULL DEFAULT 0,
  last_practice_date date,
  xp_total integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  credits_used_this_month numeric NOT NULL DEFAULT 0,
  onboarding_completed boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (profile_id)
);

-- 5. seller_memory
CREATE TABLE public.seller_memory (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id uuid NOT NULL REFERENCES public.sellers(id) ON DELETE CASCADE,
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  strengths text[] DEFAULT '{}',
  weaknesses text[] DEFAULT '{}',
  repeated_errors text[] DEFAULT '{}',
  coach_notes text,
  progress_summary text,
  stealth_diagnostics jsonb,
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 6. worlds (data maestra, sin company_id)
CREATE TABLE public.worlds (
  id integer PRIMARY KEY,
  name text NOT NULL,
  emotional_name text,
  icon text,
  order_index integer NOT NULL,
  color text,
  description text,
  boss_level_name text,
  boss_level_description text
);

-- 7. nodes (data maestra)
CREATE TABLE public.nodes (
  id text PRIMARY KEY,
  world_id integer NOT NULL REFERENCES public.worlds(id) ON DELETE CASCADE,
  name text NOT NULL,
  technique text,
  order_index integer NOT NULL,
  is_boss boolean NOT NULL DEFAULT false,
  reps_required integer NOT NULL DEFAULT 3,
  checkpoints jsonb
);

-- 8. node_progress
CREATE TABLE public.node_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id uuid NOT NULL REFERENCES public.sellers(id) ON DELETE CASCADE,
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  node_id text NOT NULL REFERENCES public.nodes(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'locked' CHECK (status IN ('locked','available','current','done')),
  reps_completed numeric NOT NULL DEFAULT 0,
  consistency_score integer NOT NULL DEFAULT 0,
  last_practiced_at timestamptz,
  sessions_count integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (seller_id, node_id)
);

-- 9. practice_sessions
CREATE TABLE public.practice_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id uuid NOT NULL REFERENCES public.sellers(id) ON DELETE CASCADE,
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  node_id text REFERENCES public.nodes(id),
  world_id integer REFERENCES public.worlds(id),
  practice_type text,
  transcript text,
  audio_url text,
  score integer,
  score_breakdown jsonb,
  ai_summary text,
  mission_generated text,
  interruption_count integer NOT NULL DEFAULT 0,
  credits_consumed numeric,
  is_boss_level boolean NOT NULL DEFAULT false,
  is_first_of_world boolean NOT NULL DEFAULT false,
  manually_saved boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 10. pitch_classifications
CREATE TABLE public.pitch_classifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL REFERENCES public.practice_sessions(id) ON DELETE CASCADE,
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  turn_number integer NOT NULL,
  speaker text NOT NULL CHECK (speaker IN ('vendedor','cliente','coach')),
  stage text CHECK (stage IN ('opening','discovery','pitch','objection_handling','close','consolidation')),
  flags text[] DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 11. manager_comments
CREATE TABLE public.manager_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL REFERENCES public.practice_sessions(id) ON DELETE CASCADE,
  seller_id uuid NOT NULL REFERENCES public.sellers(id) ON DELETE CASCADE,
  manager_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  turn_number integer,
  comment text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 12. certificates
CREATE TABLE public.certificates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id uuid NOT NULL REFERENCES public.sellers(id) ON DELETE CASCADE,
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  level text NOT NULL,
  score integer NOT NULL,
  pdf_url text,
  verification_url text,
  issued_at timestamptz NOT NULL DEFAULT now()
);

-- 13. company_onboarding_answers
CREATE TABLE public.company_onboarding_answers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  block_number integer NOT NULL CHECK (block_number IN (1,2,3)),
  question_id text NOT NULL,
  question_text text,
  answer text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 14. daily_usage
CREATE TABLE public.daily_usage (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id uuid NOT NULL REFERENCES public.sellers(id) ON DELETE CASCADE,
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  date date NOT NULL DEFAULT current_date,
  sessions_count integer NOT NULL DEFAULT 0,
  credits_used numeric NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (seller_id, date)
);

-- 15. seller_arsenal
CREATE TABLE public.seller_arsenal (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id uuid NOT NULL REFERENCES public.sellers(id) ON DELETE CASCADE,
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  bullet_type text NOT NULL CHECK (bullet_type IN ('empresa','producto','precio')),
  bullet_text text NOT NULL,
  times_used integer NOT NULL DEFAULT 0,
  success_rate numeric NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- =========================================================
-- RLS — activado en TODAS las tablas
-- =========================================================
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.company_invites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sellers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.seller_memory ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.worlds ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.nodes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.node_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.practice_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pitch_classifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.manager_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.certificates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.company_onboarding_answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.seller_arsenal ENABLE ROW LEVEL SECURITY;

-- worlds y nodes: lectura pública para usuarios autenticados (data maestra compartida)
CREATE POLICY "worlds readable by authenticated" ON public.worlds FOR SELECT TO authenticated USING (true);
CREATE POLICY "nodes readable by authenticated" ON public.nodes FOR SELECT TO authenticated USING (true);

-- companies
CREATE POLICY "company members read own company" ON public.companies
  FOR SELECT TO authenticated USING (id = public.current_company_id());
CREATE POLICY "managers update own company" ON public.companies
  FOR UPDATE TO authenticated USING (id = public.current_company_id() AND public.is_manager());

-- profiles
CREATE POLICY "read own profile" ON public.profiles
  FOR SELECT TO authenticated USING (id = auth.uid());
CREATE POLICY "managers read company profiles" ON public.profiles
  FOR SELECT TO authenticated USING (company_id = public.current_company_id() AND public.is_manager());
CREATE POLICY "update own profile" ON public.profiles
  FOR UPDATE TO authenticated USING (id = auth.uid());
CREATE POLICY "insert own profile" ON public.profiles
  FOR INSERT TO authenticated WITH CHECK (id = auth.uid());

-- Macro para tablas con company_id: managers pueden todo en su empresa, vendedores ven solo sus propios datos
-- company_invites
CREATE POLICY "managers manage invites" ON public.company_invites
  FOR ALL TO authenticated
  USING (company_id = public.current_company_id() AND public.is_manager())
  WITH CHECK (company_id = public.current_company_id() AND public.is_manager());

-- sellers
CREATE POLICY "managers manage sellers" ON public.sellers
  FOR ALL TO authenticated
  USING (company_id = public.current_company_id() AND public.is_manager())
  WITH CHECK (company_id = public.current_company_id() AND public.is_manager());
CREATE POLICY "seller reads own row" ON public.sellers
  FOR SELECT TO authenticated USING (profile_id = auth.uid());
CREATE POLICY "seller updates own row" ON public.sellers
  FOR UPDATE TO authenticated USING (profile_id = auth.uid());

-- Helper: ¿es este seller_id el del usuario actual?
CREATE OR REPLACE FUNCTION public.owns_seller(_seller_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.sellers WHERE id = _seller_id AND profile_id = auth.uid())
$$;

-- seller_memory
CREATE POLICY "managers all seller_memory" ON public.seller_memory FOR ALL TO authenticated
  USING (company_id = public.current_company_id() AND public.is_manager())
  WITH CHECK (company_id = public.current_company_id() AND public.is_manager());
CREATE POLICY "seller reads own memory" ON public.seller_memory FOR SELECT TO authenticated
  USING (public.owns_seller(seller_id));

-- node_progress
CREATE POLICY "managers all node_progress" ON public.node_progress FOR ALL TO authenticated
  USING (company_id = public.current_company_id() AND public.is_manager())
  WITH CHECK (company_id = public.current_company_id() AND public.is_manager());
CREATE POLICY "seller reads own progress" ON public.node_progress FOR SELECT TO authenticated
  USING (public.owns_seller(seller_id));
CREATE POLICY "seller writes own progress" ON public.node_progress FOR INSERT TO authenticated
  WITH CHECK (public.owns_seller(seller_id) AND company_id = public.current_company_id());
CREATE POLICY "seller updates own progress" ON public.node_progress FOR UPDATE TO authenticated
  USING (public.owns_seller(seller_id));

-- practice_sessions
CREATE POLICY "managers all sessions" ON public.practice_sessions FOR ALL TO authenticated
  USING (company_id = public.current_company_id() AND public.is_manager())
  WITH CHECK (company_id = public.current_company_id() AND public.is_manager());
CREATE POLICY "seller reads own sessions" ON public.practice_sessions FOR SELECT TO authenticated
  USING (public.owns_seller(seller_id));
CREATE POLICY "seller inserts own sessions" ON public.practice_sessions FOR INSERT TO authenticated
  WITH CHECK (public.owns_seller(seller_id) AND company_id = public.current_company_id());
CREATE POLICY "seller updates own sessions" ON public.practice_sessions FOR UPDATE TO authenticated
  USING (public.owns_seller(seller_id));

-- pitch_classifications
CREATE POLICY "managers all classifications" ON public.pitch_classifications FOR ALL TO authenticated
  USING (company_id = public.current_company_id() AND public.is_manager())
  WITH CHECK (company_id = public.current_company_id() AND public.is_manager());
CREATE POLICY "seller reads own classifications" ON public.pitch_classifications FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.practice_sessions s WHERE s.id = session_id AND public.owns_seller(s.seller_id)));
CREATE POLICY "seller inserts own classifications" ON public.pitch_classifications FOR INSERT TO authenticated
  WITH CHECK (company_id = public.current_company_id()
    AND EXISTS (SELECT 1 FROM public.practice_sessions s WHERE s.id = session_id AND public.owns_seller(s.seller_id)));

-- manager_comments
CREATE POLICY "managers manage comments" ON public.manager_comments FOR ALL TO authenticated
  USING (company_id = public.current_company_id() AND public.is_manager())
  WITH CHECK (company_id = public.current_company_id() AND public.is_manager() AND manager_id = auth.uid());
CREATE POLICY "seller reads own comments" ON public.manager_comments FOR SELECT TO authenticated
  USING (public.owns_seller(seller_id));

-- certificates
CREATE POLICY "managers all certificates" ON public.certificates FOR ALL TO authenticated
  USING (company_id = public.current_company_id() AND public.is_manager())
  WITH CHECK (company_id = public.current_company_id() AND public.is_manager());
CREATE POLICY "seller reads own certs" ON public.certificates FOR SELECT TO authenticated
  USING (public.owns_seller(seller_id));

-- company_onboarding_answers (solo manager)
CREATE POLICY "managers manage onboarding answers" ON public.company_onboarding_answers FOR ALL TO authenticated
  USING (company_id = public.current_company_id() AND public.is_manager())
  WITH CHECK (company_id = public.current_company_id() AND public.is_manager());

-- daily_usage
CREATE POLICY "managers all daily_usage" ON public.daily_usage FOR ALL TO authenticated
  USING (company_id = public.current_company_id() AND public.is_manager())
  WITH CHECK (company_id = public.current_company_id() AND public.is_manager());
CREATE POLICY "seller reads own daily_usage" ON public.daily_usage FOR SELECT TO authenticated
  USING (public.owns_seller(seller_id));
CREATE POLICY "seller writes own daily_usage" ON public.daily_usage FOR INSERT TO authenticated
  WITH CHECK (public.owns_seller(seller_id) AND company_id = public.current_company_id());
CREATE POLICY "seller updates own daily_usage" ON public.daily_usage FOR UPDATE TO authenticated
  USING (public.owns_seller(seller_id));

-- seller_arsenal
CREATE POLICY "managers all arsenal" ON public.seller_arsenal FOR ALL TO authenticated
  USING (company_id = public.current_company_id() AND public.is_manager())
  WITH CHECK (company_id = public.current_company_id() AND public.is_manager());
CREATE POLICY "seller reads own arsenal" ON public.seller_arsenal FOR SELECT TO authenticated
  USING (public.owns_seller(seller_id));
CREATE POLICY "seller writes own arsenal" ON public.seller_arsenal FOR INSERT TO authenticated
  WITH CHECK (public.owns_seller(seller_id) AND company_id = public.current_company_id());
CREATE POLICY "seller updates own arsenal" ON public.seller_arsenal FOR UPDATE TO authenticated
  USING (public.owns_seller(seller_id));

-- =========================================================
-- TRIGGER: crear perfil al registrarse en auth.users
-- =========================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, avatar_url, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name'),
    NEW.raw_user_meta_data->>'avatar_url',
    COALESCE(NEW.raw_user_meta_data->>'role', 'vendedor')
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =========================================================
-- FUNCIÓN: consume_credits — nunca bloquea, solo informa
-- =========================================================
CREATE OR REPLACE FUNCTION public.consume_credits(
  _seller_id uuid,
  _session_type text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _cost numeric;
  _company_id uuid;
  _limit integer;
  _used numeric;
  _ratio numeric;
  _warning boolean := false;
  _exhausted boolean := false;
BEGIN
  _cost := CASE _session_type
    WHEN 'focused' THEN 0.6
    WHEN 'full' THEN 1.0
    WHEN 'role_switch' THEN 0.8
    WHEN 'coach_query' THEN 0.1
    ELSE 1.0
  END;

  SELECT s.company_id INTO _company_id FROM public.sellers s WHERE s.id = _seller_id;
  IF _company_id IS NULL THEN
    RAISE EXCEPTION 'Seller not found';
  END IF;

  -- Sumar al vendedor
  UPDATE public.sellers
    SET credits_used_this_month = credits_used_this_month + _cost
    WHERE id = _seller_id;

  -- Sumar al daily_usage
  INSERT INTO public.daily_usage (seller_id, company_id, date, sessions_count, credits_used)
  VALUES (_seller_id, _company_id, current_date, 1, _cost)
  ON CONFLICT (seller_id, date) DO UPDATE
    SET sessions_count = public.daily_usage.sessions_count + 1,
        credits_used = public.daily_usage.credits_used + _cost;

  -- Calcular consumo total de la empresa este mes
  SELECT credits_per_month INTO _limit FROM public.companies WHERE id = _company_id;
  SELECT COALESCE(SUM(credits_used_this_month), 0) INTO _used
    FROM public.sellers WHERE company_id = _company_id;

  _ratio := CASE WHEN _limit > 0 THEN _used / _limit ELSE 0 END;
  IF _ratio >= 1 THEN _exhausted := true; END IF;
  IF _ratio >= 0.8 THEN _warning := true; END IF;

  RETURN jsonb_build_object(
    'cost', _cost,
    'used', _used,
    'limit', _limit,
    'ratio', _ratio,
    'warning', _warning,
    'exhausted', _exhausted,
    'blocked', false
  );
END;
$$;

-- Indexes útiles
CREATE INDEX idx_profiles_company ON public.profiles(company_id);
CREATE INDEX idx_sellers_company ON public.sellers(company_id);
CREATE INDEX idx_sellers_profile ON public.sellers(profile_id);
CREATE INDEX idx_node_progress_seller ON public.node_progress(seller_id);
CREATE INDEX idx_sessions_seller ON public.practice_sessions(seller_id);
CREATE INDEX idx_sessions_company ON public.practice_sessions(company_id);
CREATE INDEX idx_invites_code ON public.company_invites(code);
