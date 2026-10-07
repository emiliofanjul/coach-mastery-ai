-- ===== TABLAS =====
CREATE TABLE public.companies (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text,
  company_sales_brain jsonb,
  onboarding_completed boolean NOT NULL DEFAULT false,
  plan text NOT NULL DEFAULT 'starter'::text,
  credits_per_month integer NOT NULL DEFAULT 90,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  is_personal boolean NOT NULL DEFAULT false,
  industry text,
  logo_url text,
  brain_updated_at timestamp with time zone,
  permite_texto boolean NOT NULL DEFAULT false,
  tipos_cliente text NOT NULL DEFAULT 'ambos'::text
);

CREATE TABLE public.doctrina (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  version integer NOT NULL,
  section_key text NOT NULL,
  order_index integer NOT NULL,
  title text NOT NULL,
  body text NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  created_by uuid
);

CREATE TABLE public.node_cards (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  node_id text NOT NULL,
  card_order integer NOT NULL,
  card_type text NOT NULL,
  title text,
  body text NOT NULL,
  flip_back_text text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  card_content_type text NOT NULL DEFAULT 'static'::text,
  audience text,
  skill_ids text[] NOT NULL DEFAULT '{}'::text[]
);

CREATE TABLE public.node_progress (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  seller_id uuid NOT NULL,
  company_id uuid NOT NULL,
  node_id text NOT NULL,
  status text NOT NULL DEFAULT 'locked'::text,
  reps_completed numeric NOT NULL DEFAULT 0,
  consistency_score integer NOT NULL DEFAULT 0,
  last_practiced_at timestamp with time zone,
  sessions_count integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  stars integer NOT NULL DEFAULT 0
);

CREATE TABLE public.node_quiz_questions (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  node_id text NOT NULL,
  question_order integer NOT NULL,
  question_text text NOT NULL,
  option_a text NOT NULL,
  option_b text NOT NULL,
  option_c text NOT NULL,
  option_d text,
  correct_option text NOT NULL,
  explanation_correct text NOT NULL,
  explanation_wrong text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  regla_id text
);

CREATE TABLE public.node_skills (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  node_id text NOT NULL,
  skill_id text NOT NULL,
  relation text NOT NULL,
  weight numeric NOT NULL DEFAULT 1.0,
  is_primary boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE public.nodes (
  id text NOT NULL,
  world_id integer NOT NULL,
  name text NOT NULL,
  technique text,
  order_index integer NOT NULL,
  is_boss boolean NOT NULL DEFAULT false,
  reps_required integer NOT NULL DEFAULT 3,
  checkpoints jsonb,
  difficulty_level integer NOT NULL DEFAULT 1,
  description text,
  node_type text NOT NULL DEFAULT 'knowledge'::text,
  conversation_scope text,
  engine_type text,
  boss_goal text,
  field_mission text,
  practice_script jsonb,
  tipo_cliente text NOT NULL DEFAULT 'cualquiera'::text
);

CREATE TABLE public.practice_sessions (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  seller_id uuid NOT NULL,
  company_id uuid NOT NULL,
  node_id text,
  world_id integer,
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
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  pitch_stage_reached text,
  end_reason text,
  conversation_history jsonb
);

CREATE TABLE public.profiles (
  id uuid NOT NULL,
  company_id uuid,
  role text NOT NULL DEFAULT 'vendedor'::text,
  full_name text,
  email text,
  avatar_url text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE public.reglas (
  id text NOT NULL,
  paso smallint NOT NULL,
  tipo text NOT NULL,
  canal text NOT NULL,
  procedencia text NOT NULL,
  resumen text NOT NULL,
  cita_cerebro text NOT NULL,
  severidad_default text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE public.sellers (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  profile_id uuid NOT NULL,
  company_id uuid NOT NULL,
  full_name text,
  experience_level text,
  main_challenge text,
  declaration text,
  current_world integer NOT NULL DEFAULT 0,
  current_node text NOT NULL DEFAULT '0.0'::text,
  current_level text NOT NULL DEFAULT 'rookie'::text,
  streak_days integer NOT NULL DEFAULT 0,
  last_practice_date date,
  xp_total integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  credits_used_this_month numeric NOT NULL DEFAULT 0,
  onboarding_completed boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  map_tutorial_completed boolean NOT NULL DEFAULT false,
  audio_consent boolean NOT NULL DEFAULT false,
  certified_at timestamp with time zone,
  joined_via_invite_id uuid,
  joined_at timestamp with time zone
);

CREATE TABLE public.skills (
  id text NOT NULL,
  code text NOT NULL,
  name text NOT NULL,
  short_description text,
  category text NOT NULL,
  world_id_introduced integer NOT NULL,
  level_required text NOT NULL DEFAULT 'rookie'::text,
  parent_skill_id text,
  mastery_threshold integer NOT NULL DEFAULT 80,
  reinforcement_threshold integer NOT NULL DEFAULT 50,
  default_allowed_concepts jsonb NOT NULL DEFAULT '[]'::jsonb,
  default_forbidden_concepts jsonb NOT NULL DEFAULT '[]'::jsonb,
  success_signals jsonb NOT NULL DEFAULT '[]'::jsonb,
  failure_signals jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  skill_type text,
  decay_half_life_days integer,
  requires_audio boolean NOT NULL DEFAULT false,
  status text NOT NULL DEFAULT 'active'::text,
  regla_id text
);

CREATE TABLE public.worlds (
  id integer NOT NULL,
  name text NOT NULL,
  emotional_name text,
  icon text,
  order_index integer NOT NULL,
  color text,
  description text,
  boss_level_name text,
  boss_level_description text
);

-- ===== RESTRICCIONES (PK, UNIQUE y CHECK primero; vínculos al final) =====
ALTER TABLE public.companies ADD CONSTRAINT companies_slug_key UNIQUE (slug);
ALTER TABLE public.companies ADD CONSTRAINT companies_pkey PRIMARY KEY (id);
ALTER TABLE public.companies ADD CONSTRAINT companies_tipos_cliente_check CHECK ((tipos_cliente = ANY (ARRAY['ambos'::text, 'solo_nuevos'::text, 'solo_recurrentes'::text])));
ALTER TABLE public.doctrina ADD CONSTRAINT doctrina_pkey PRIMARY KEY (id);
ALTER TABLE public.node_cards ADD CONSTRAINT node_cards_node_id_card_order_key UNIQUE (node_id, card_order);
ALTER TABLE public.node_cards ADD CONSTRAINT node_cards_pkey PRIMARY KEY (id);
ALTER TABLE public.node_cards ADD CONSTRAINT node_cards_node_id_fkey FOREIGN KEY (node_id) REFERENCES nodes(id) ON DELETE CASCADE;
ALTER TABLE public.node_progress ADD CONSTRAINT node_progress_seller_id_node_id_key UNIQUE (seller_id, node_id);
ALTER TABLE public.node_progress ADD CONSTRAINT node_progress_pkey PRIMARY KEY (id);
ALTER TABLE public.node_progress ADD CONSTRAINT node_progress_company_id_fkey FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE;
ALTER TABLE public.node_progress ADD CONSTRAINT node_progress_node_id_fkey FOREIGN KEY (node_id) REFERENCES nodes(id) ON DELETE CASCADE;
ALTER TABLE public.node_progress ADD CONSTRAINT node_progress_seller_id_fkey FOREIGN KEY (seller_id) REFERENCES sellers(id) ON DELETE CASCADE;
ALTER TABLE public.node_progress ADD CONSTRAINT node_progress_stars_check CHECK (((stars >= 0) AND (stars <= 3)));
ALTER TABLE public.node_progress ADD CONSTRAINT node_progress_status_check CHECK ((status = ANY (ARRAY['locked'::text, 'available'::text, 'current'::text, 'done'::text])));
ALTER TABLE public.node_quiz_questions ADD CONSTRAINT node_quiz_questions_node_id_question_order_key UNIQUE (node_id, question_order);
ALTER TABLE public.node_quiz_questions ADD CONSTRAINT node_quiz_questions_pkey PRIMARY KEY (id);
ALTER TABLE public.node_quiz_questions ADD CONSTRAINT node_quiz_questions_node_id_fkey FOREIGN KEY (node_id) REFERENCES nodes(id) ON DELETE CASCADE;
ALTER TABLE public.node_quiz_questions ADD CONSTRAINT node_quiz_questions_regla_id_fkey FOREIGN KEY (regla_id) REFERENCES reglas(id);
ALTER TABLE public.node_quiz_questions ADD CONSTRAINT node_quiz_questions_correct_option_check CHECK ((correct_option = ANY (ARRAY['A'::text, 'B'::text, 'C'::text, 'D'::text])));
ALTER TABLE public.node_skills ADD CONSTRAINT node_skills_node_id_skill_id_key UNIQUE (node_id, skill_id);
ALTER TABLE public.node_skills ADD CONSTRAINT node_skills_pkey PRIMARY KEY (id);
ALTER TABLE public.node_skills ADD CONSTRAINT node_skills_skill_id_fkey FOREIGN KEY (skill_id) REFERENCES skills(id) ON UPDATE CASCADE ON DELETE CASCADE;
ALTER TABLE public.node_skills ADD CONSTRAINT node_skills_weight_check CHECK (((weight >= (0)::numeric) AND (weight <= (1)::numeric)));
ALTER TABLE public.nodes ADD CONSTRAINT nodes_pkey PRIMARY KEY (id);
ALTER TABLE public.nodes ADD CONSTRAINT nodes_world_id_fkey FOREIGN KEY (world_id) REFERENCES worlds(id) ON DELETE CASCADE;
ALTER TABLE public.nodes ADD CONSTRAINT nodes_conversation_scope_check CHECK (((conversation_scope IS NULL) OR (conversation_scope = ANY (ARRAY['first_impression'::text, 'short_story'::text, 'discovery'::text, 'presentation'::text, 'close'::text, 'full'::text]))));
ALTER TABLE public.nodes ADD CONSTRAINT nodes_tipo_cliente_check CHECK ((tipo_cliente = ANY (ARRAY['nuevo'::text, 'recurrente'::text, 'cualquiera'::text])));
ALTER TABLE public.practice_sessions ADD CONSTRAINT practice_sessions_pkey PRIMARY KEY (id);
ALTER TABLE public.practice_sessions ADD CONSTRAINT practice_sessions_company_id_fkey FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE;
ALTER TABLE public.practice_sessions ADD CONSTRAINT practice_sessions_node_id_fkey FOREIGN KEY (node_id) REFERENCES nodes(id);
ALTER TABLE public.practice_sessions ADD CONSTRAINT practice_sessions_seller_id_fkey FOREIGN KEY (seller_id) REFERENCES sellers(id) ON DELETE CASCADE;
ALTER TABLE public.practice_sessions ADD CONSTRAINT practice_sessions_world_id_fkey FOREIGN KEY (world_id) REFERENCES worlds(id);
ALTER TABLE public.profiles ADD CONSTRAINT profiles_pkey PRIMARY KEY (id);
ALTER TABLE public.profiles ADD CONSTRAINT profiles_company_id_fkey FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE SET NULL;
ALTER TABLE public.profiles ADD CONSTRAINT profiles_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE public.profiles ADD CONSTRAINT profiles_role_check CHECK ((role = ANY (ARRAY['manager'::text, 'vendedor'::text])));
ALTER TABLE public.reglas ADD CONSTRAINT reglas_pkey PRIMARY KEY (id);
ALTER TABLE public.reglas ADD CONSTRAINT reglas_canal_check CHECK ((canal = ANY (ARRAY['universal'::text, 'presencial'::text])));
ALTER TABLE public.reglas ADD CONSTRAINT reglas_severidad_default_check CHECK ((severidad_default = ANY (ARRAY['minor'::text, 'major'::text, 'critical'::text])));
ALTER TABLE public.reglas ADD CONSTRAINT reglas_tipo_check CHECK ((tipo = ANY (ARRAY['requisito'::text, 'error'::text, 'herramienta'::text, 'principio'::text, 'premio'::text, 'neutro'::text])));
ALTER TABLE public.sellers ADD CONSTRAINT sellers_profile_id_key UNIQUE (profile_id);
ALTER TABLE public.sellers ADD CONSTRAINT sellers_pkey PRIMARY KEY (id);
ALTER TABLE public.sellers ADD CONSTRAINT sellers_company_id_fkey FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE;
ALTER TABLE public.sellers ADD CONSTRAINT sellers_joined_via_invite_id_fkey FOREIGN KEY (joined_via_invite_id) REFERENCES company_invites(id);
ALTER TABLE public.sellers ADD CONSTRAINT sellers_profile_id_fkey FOREIGN KEY (profile_id) REFERENCES profiles(id) ON DELETE CASCADE;
ALTER TABLE public.skills ADD CONSTRAINT skills_code_key UNIQUE (code);
ALTER TABLE public.skills ADD CONSTRAINT skills_pkey PRIMARY KEY (id);
ALTER TABLE public.skills ADD CONSTRAINT skills_parent_skill_id_fkey FOREIGN KEY (parent_skill_id) REFERENCES skills(id) ON UPDATE CASCADE ON DELETE SET NULL;
ALTER TABLE public.skills ADD CONSTRAINT skills_regla_id_fkey FOREIGN KEY (regla_id) REFERENCES reglas(id);
ALTER TABLE public.worlds ADD CONSTRAINT worlds_pkey PRIMARY KEY (id);

-- ===== ÍNDICES =====
CREATE INDEX doctrina_active_idx ON public.doctrina USING btree (is_active, version, order_index);
CREATE INDEX idx_node_cards_node_id_order ON public.node_cards USING btree (node_id, card_order);
CREATE INDEX idx_node_progress_seller ON public.node_progress USING btree (seller_id);
CREATE INDEX node_quiz_questions_regla_idx ON public.node_quiz_questions USING btree (regla_id);
CREATE INDEX idx_node_quiz_questions_node ON public.node_quiz_questions USING btree (node_id, question_order);
CREATE UNIQUE INDEX node_skills_one_primary_per_skill ON public.node_skills USING btree (skill_id) WHERE (is_primary = true);
CREATE INDEX node_skills_skill_idx ON public.node_skills USING btree (skill_id);
CREATE INDEX idx_sessions_company ON public.practice_sessions USING btree (company_id);
CREATE INDEX idx_sessions_seller ON public.practice_sessions USING btree (seller_id);
CREATE INDEX idx_profiles_company ON public.profiles USING btree (company_id);
CREATE INDEX idx_sellers_company ON public.sellers USING btree (company_id);
CREATE INDEX idx_sellers_profile ON public.sellers USING btree (profile_id);

-- ===== FUNCIONES DE LOS DISPARADORES =====
CREATE OR REPLACE FUNCTION public.ensure_manager_seller_row()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  IF NEW.role = 'manager' AND NEW.company_id IS NOT NULL THEN
    INSERT INTO public.sellers (profile_id, company_id, full_name, onboarding_completed, map_tutorial_completed)
    VALUES (NEW.id, NEW.company_id, COALESCE(NEW.full_name, NEW.email), true, false)
    ON CONFLICT (profile_id) DO NOTHING;
  END IF;
  RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.validar_practice_script()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
DECLARE
  ps        jsonb := NEW.practice_script;
  c         jsonb;
  ids       text[] := ARRAY[]::text[];
  faltan    text[] := ARRAY[]::text[];
  reglas_r  text[] := ARRAY[]::text[];
  suma      numeric := 0;
  maxfoco   int := CASE WHEN NEW.node_type = 'boss' THEN 8 ELSE 6 END;
BEGIN
  IF ps IS NULL THEN RETURN NEW; END IF;

  -- a) Cada criterio de éxito es un skill que este nodo entrena (node_skills)
  FOR c IN SELECT * FROM jsonb_array_elements(coalesce(ps->'success_criteria','[]'::jsonb)) LOOP
    ids := ids || (c->>'id');
    suma := suma + coalesce((c->>'weight')::numeric, 0);
    IF NOT EXISTS (SELECT 1 FROM public.node_skills ns WHERE ns.node_id = NEW.id AND ns.skill_id = c->>'id') THEN
      faltan := faltan || (c->>'id');
    END IF;
  END LOOP;
  IF array_length(faltan,1) > 0 THEN
    RAISE EXCEPTION 'nodo %: criterios de éxito sin fila en node_skills: %. Registra primero el skill en node_skills.', NEW.id, faltan;
  END IF;

  -- b) Pesos de éxito suman 1.0
  IF array_length(ids,1) > 0 AND (suma < 0.99 OR suma > 1.01) THEN
    RAISE EXCEPTION 'nodo %: los pesos de success_criteria suman %, deben sumar 1.0', NEW.id, suma;
  END IF;

  -- c) Toda regla_id existe
  SELECT array_agg(DISTINCT x->>'regla_id') INTO reglas_r
  FROM jsonb_array_elements(coalesce(ps->'success_criteria','[]'::jsonb) || coalesce(ps->'failure_criteria','[]'::jsonb)) x
  WHERE x ? 'regla_id' AND NOT EXISTS (SELECT 1 FROM public.reglas r WHERE r.id = x->>'regla_id');
  IF reglas_r IS NOT NULL THEN
    RAISE EXCEPTION 'nodo %: regla_id inexistentes: %', NEW.id, reglas_r;
  END IF;

  -- d) skills_in_focus se DERIVA de los criterios de éxito. No es dato.
  IF array_length(ids,1) > maxfoco THEN
    RAISE EXCEPTION 'nodo % (%): % skills en foco; máximo %', NEW.id, coalesce(NEW.node_type,'?'), array_length(ids,1), maxfoco;
  END IF;
  IF array_length(ids,1) > 0 THEN
    NEW.practice_script := jsonb_set(
      coalesce(ps,'{}'::jsonb),
      '{scope,skills_in_focus}',
      to_jsonb(ids),
      true
    );
  END IF;

  RETURN NEW;
END;
$function$
;


-- ===== DISPARADORES =====
CREATE TRIGGER ensure_manager_seller_row_trg AFTER INSERT OR UPDATE OF role, company_id ON public.profiles FOR EACH ROW EXECUTE FUNCTION ensure_manager_seller_row();
CREATE TRIGGER trg_validar_practice_script BEFORE INSERT OR UPDATE OF practice_script, node_type ON public.nodes FOR EACH ROW EXECUTE FUNCTION validar_practice_script();

-- ===== ORDEN ACTUAL DEL MUNDO 3 =====
-- 3.0 @ order_index 0 (world 3)
-- 3.1 @ order_index 1 (world 3)
-- 3.2 @ order_index 2 (world 3)
-- 3.3 @ order_index 3 (world 3)
-- 3.4 @ order_index 4 (world 3)
-- 3.5 @ order_index 5 (world 3)
-- 3.6 @ order_index 6 (world 3)
-- 3.7 @ order_index 7 (world 3)
-- 3.8 @ order_index 8 (world 3)
-- 3.9 @ order_index 9 (world 3)
-- 3.9b @ order_index 10 (world 3)
-- 3.10 @ order_index 11 (world 3)
