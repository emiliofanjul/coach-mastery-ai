-- ESTRUCTURA COMPLETA de la base real de Closer (esquema public + almacenamiento). SIN DATOS.
-- Exportada el 2026-10-09 17:36 UTC leyendo el catálogo de Postgres (solo lectura).
--
-- RESUMEN
--   Extensiones instaladas:        5
--   Tipos/enums propios (public):  0
--   Tablas:                        42
--   Índices (incluye los de PK/UNIQUE): 94
--   Funciones (public):            33
--   Triggers:                      6
--   Vistas:                        3
--   Tablas con RLS activo:         42
--   Políticas (public):            95
--   Políticas (almacenamiento):    9
--   Buckets:                       3
--   Tareas programadas (cron):     0
--   Webhooks de base:              0 (hooks registrados) / 0 (triggers hacia http)
--
-- Orden de carga: extensiones, tipos, tablas (sin vínculos), PK/UNIQUE/CHECK, vínculos,
-- índices, funciones, triggers, vistas, RLS y políticas, permisos, almacenamiento, cron.

-- ===== EXTENSIONES =====
CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA extensions; -- v1.1
CREATE EXTENSION IF NOT EXISTS pg_stat_statements WITH SCHEMA extensions; -- v1.11
CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA extensions; -- v1.3
CREATE EXTENSION IF NOT EXISTS plpgsql WITH SCHEMA pg_catalog; -- v1.0
CREATE EXTENSION IF NOT EXISTS supabase_vault WITH SCHEMA vault; -- v0.3.1

-- ===== TIPOS Y ENUMS =====

-- ===== SECUENCIAS =====

-- ===== TABLAS =====
CREATE TABLE public.archivo_mentalidad_cards (
  id uuid,
  node_id text,
  card_order integer,
  card_type text,
  title text,
  body text,
  flip_back_text text,
  created_at timestamp with time zone,
  card_content_type text,
  audience text,
  skill_ids text[]
);

CREATE TABLE public.archivo_mentalidad_nodes (
  id text,
  world_id integer,
  name text,
  technique text,
  order_index integer,
  is_boss boolean,
  reps_required integer,
  checkpoints jsonb,
  difficulty_level integer,
  description text,
  node_type text,
  conversation_scope text,
  engine_type text,
  boss_goal text,
  field_mission text,
  practice_script jsonb
);

CREATE TABLE public.archivo_mentalidad_quiz (
  id uuid,
  node_id text,
  question_order integer,
  question_text text,
  option_a text,
  option_b text,
  option_c text,
  option_d text,
  correct_option text,
  explanation_correct text,
  explanation_wrong text,
  created_at timestamp with time zone
);

CREATE TABLE public.certificates (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  seller_id uuid NOT NULL,
  company_id uuid NOT NULL,
  level text NOT NULL,
  score integer NOT NULL,
  pdf_url text,
  verification_url text,
  issued_at timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE public.client_archetypes (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  type text NOT NULL,
  difficulty_base integer NOT NULL,
  base_prompt text NOT NULL,
  objection_patterns jsonb DEFAULT '{}'::jsonb NOT NULL,
  buying_signal_style text NOT NULL,
  variations jsonb DEFAULT '[]'::jsonb NOT NULL,
  is_boss_eligible boolean DEFAULT false NOT NULL,
  worlds_available integer[] DEFAULT '{}'::integer[] NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE public.client_names (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  name text NOT NULL,
  gender text NOT NULL,
  avatar_style text NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE public.coach_recommendations (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  seller_id uuid NOT NULL,
  company_id uuid NOT NULL,
  prioridad text NOT NULL,
  plan jsonb DEFAULT '[]'::jsonb NOT NULL,
  fortaleza text,
  input_summary jsonb,
  model text NOT NULL,
  prompt_version text DEFAULT 'v1'::text NOT NULL,
  last_event_id uuid,
  events_considered integer DEFAULT 0 NOT NULL,
  notes_considered integer DEFAULT 0 NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE public.companies (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  name text NOT NULL,
  slug text,
  company_sales_brain jsonb,
  onboarding_completed boolean DEFAULT false NOT NULL,
  plan text DEFAULT 'starter'::text NOT NULL,
  credits_per_month integer DEFAULT 90 NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  is_personal boolean DEFAULT false NOT NULL,
  industry text,
  logo_url text,
  brain_updated_at timestamp with time zone,
  permite_texto boolean DEFAULT false NOT NULL,
  tipos_cliente text DEFAULT 'ambos'::text NOT NULL
);

CREATE TABLE public.company_brain_versions (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  company_id uuid NOT NULL,
  brain jsonb NOT NULL,
  edited_by uuid,
  created_at timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE public.company_invites (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  company_id uuid NOT NULL,
  code text NOT NULL,
  email text,
  used boolean DEFAULT false NOT NULL,
  used_by uuid,
  expires_at timestamp with time zone DEFAULT (now() + '7 days'::interval) NOT NULL,
  failed_attempts integer DEFAULT 0 NOT NULL,
  locked_until timestamp with time zone,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  created_by uuid,
  revoked_at timestamp with time zone,
  duration_hours integer
);

CREATE TABLE public.company_onboarding_answers (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  company_id uuid NOT NULL,
  block_number integer NOT NULL,
  question_id text NOT NULL,
  question_text text,
  answer text,
  created_at timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE public.company_pitches (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  company_id uuid NOT NULL,
  client_type text NOT NULL,
  channel text DEFAULT 'presencial'::text NOT NULL,
  status text DEFAULT 'draft'::text NOT NULL,
  version integer DEFAULT 1 NOT NULL,
  created_by uuid,
  published_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL,
  missing_data jsonb DEFAULT '[]'::jsonb NOT NULL,
  relationship text DEFAULT 'nuevo'::text NOT NULL
);

CREATE TABLE public.daily_usage (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  seller_id uuid NOT NULL,
  company_id uuid NOT NULL,
  date date DEFAULT CURRENT_DATE NOT NULL,
  sessions_count integer DEFAULT 0 NOT NULL,
  credits_used numeric DEFAULT 0 NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE public.director_decisions (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  session_id uuid,
  node_id text,
  decision text NOT NULL,
  cut_reason text,
  user_turns integer,
  elapsed_seconds numeric,
  classifier_ran boolean,
  scope_covered boolean,
  evidence_sufficient boolean,
  latency_ms integer,
  director_version text
);

CREATE TABLE public.disputas (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  company_id uuid,
  seller_id uuid,
  node_id text,
  session_id text,
  turno integer,
  nota_original integer,
  mensaje_vendedor text NOT NULL,
  respuesta_closer text NOT NULL,
  concede boolean,
  criterio_id text,
  motivo text,
  contexto jsonb,
  revisada boolean DEFAULT false NOT NULL,
  nota_revision text,
  revisada_at timestamp with time zone
);

CREATE TABLE public.doctrina (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  version integer NOT NULL,
  section_key text NOT NULL,
  order_index integer NOT NULL,
  title text NOT NULL,
  body text NOT NULL,
  is_active boolean DEFAULT true NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  created_by uuid
);

CREATE TABLE public.invite_attempts (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  actor_id uuid,
  code text NOT NULL,
  outcome text NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE public.llm_calls (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  phase text NOT NULL,
  prompt_version text,
  model text,
  input_tokens integer,
  output_tokens integer,
  latency_ms integer,
  event_id uuid,
  session_id uuid,
  analisis_turnos jsonb,
  cached_tokens integer,
  cache_creation_tokens integer,
  company_id uuid,
  seller_id uuid
);

CREATE TABLE public.manager_comments (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  session_id uuid NOT NULL,
  seller_id uuid NOT NULL,
  manager_id uuid NOT NULL,
  company_id uuid NOT NULL,
  turn_number integer,
  comment text NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE public.node_cards (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  node_id text NOT NULL,
  card_order integer NOT NULL,
  card_type text NOT NULL,
  title text,
  body text NOT NULL,
  flip_back_text text,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  card_content_type text DEFAULT 'static'::text NOT NULL,
  audience text,
  skill_ids text[] DEFAULT '{}'::text[] NOT NULL
);

CREATE TABLE public.node_progress (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  seller_id uuid NOT NULL,
  company_id uuid NOT NULL,
  node_id text NOT NULL,
  status text DEFAULT 'locked'::text NOT NULL,
  reps_completed numeric DEFAULT 0 NOT NULL,
  consistency_score integer DEFAULT 0 NOT NULL,
  last_practiced_at timestamp with time zone,
  sessions_count integer DEFAULT 0 NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  stars integer DEFAULT 0 NOT NULL
);

CREATE TABLE public.node_quiz_questions (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
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
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  regla_id text
);

CREATE TABLE public.node_skills (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  node_id text NOT NULL,
  skill_id text NOT NULL,
  relation text NOT NULL,
  weight numeric DEFAULT 1.0 NOT NULL,
  is_primary boolean DEFAULT false NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE public.nodes (
  id text NOT NULL,
  world_id integer NOT NULL,
  name text NOT NULL,
  technique text,
  order_index integer NOT NULL,
  is_boss boolean DEFAULT false NOT NULL,
  reps_required integer DEFAULT 3 NOT NULL,
  checkpoints jsonb,
  difficulty_level integer DEFAULT 1 NOT NULL,
  description text,
  node_type text DEFAULT 'knowledge'::text NOT NULL,
  conversation_scope text,
  engine_type text,
  boss_goal text,
  field_mission text,
  practice_script jsonb,
  tipo_cliente text DEFAULT 'cualquiera'::text NOT NULL
);

CREATE TABLE public.pitch_classifications (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  session_id uuid NOT NULL,
  company_id uuid NOT NULL,
  turn_number integer NOT NULL,
  speaker text NOT NULL,
  stage text,
  flags text[] DEFAULT '{}'::text[],
  created_at timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE public.pitch_feedback (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  pitch_id uuid NOT NULL,
  section_id uuid,
  manager_message text,
  closer_response text,
  classification text,
  outcome text,
  created_at timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE public.pitch_sections (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  pitch_id uuid NOT NULL,
  step integer NOT NULL,
  section_key text NOT NULL,
  order_index integer NOT NULL,
  content text,
  skill_ids text[] DEFAULT '{}'::text[] NOT NULL,
  alternatives jsonb DEFAULT '[]'::jsonb NOT NULL,
  section_kind text DEFAULT 'guion'::text NOT NULL,
  edited_by_manager boolean DEFAULT false NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  rationale_short text,
  rationale_long text,
  warning text,
  prompt_version text,
  is_stale boolean DEFAULT false NOT NULL,
  stale_reason text,
  audit jsonb,
  audited_at timestamp with time zone,
  audit_status text
);

CREATE TABLE public.pitch_versions (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  pitch_id uuid NOT NULL,
  version integer NOT NULL,
  snapshot jsonb DEFAULT '{}'::jsonb NOT NULL,
  published_by uuid,
  published_at timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE public.platform_admins (
  user_id uuid NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE public.practice_sessions (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
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
  interruption_count integer DEFAULT 0 NOT NULL,
  credits_consumed numeric,
  is_boss_level boolean DEFAULT false NOT NULL,
  is_first_of_world boolean DEFAULT false NOT NULL,
  manually_saved boolean DEFAULT false NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  pitch_stage_reached text,
  end_reason text,
  conversation_history jsonb
);

CREATE TABLE public.profiles (
  id uuid NOT NULL,
  company_id uuid,
  role text DEFAULT 'vendedor'::text NOT NULL,
  full_name text,
  email text,
  avatar_url text,
  created_at timestamp with time zone DEFAULT now() NOT NULL
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
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE public.seller_archetype_performance (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  seller_id uuid NOT NULL,
  company_id uuid NOT NULL,
  archetype_id uuid NOT NULL,
  sessions_count integer DEFAULT 0 NOT NULL,
  avg_score numeric DEFAULT 0 NOT NULL,
  last_score integer,
  improvement_trend text DEFAULT 'estable'::text NOT NULL,
  times_assigned integer DEFAULT 0 NOT NULL,
  last_practiced_at timestamp with time zone,
  is_in_reinforcement_mode boolean DEFAULT false NOT NULL,
  consecutive_below_avg integer DEFAULT 0 NOT NULL,
  consecutive_above_avg integer DEFAULT 0 NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE public.seller_arsenal (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  seller_id uuid NOT NULL,
  company_id uuid NOT NULL,
  bullet_type text NOT NULL,
  bullet_text text NOT NULL,
  times_used integer DEFAULT 0 NOT NULL,
  success_rate numeric DEFAULT 0 NOT NULL,
  is_active boolean DEFAULT true NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE public.seller_events (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  seller_id uuid NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  event_type text NOT NULL,
  node_id text,
  skill_ids text[] DEFAULT '{}'::text[] NOT NULL,
  payload jsonb DEFAULT '{}'::jsonb NOT NULL,
  audio_url text,
  prompt_version text,
  script_version text,
  model text
);

CREATE TABLE public.seller_memory (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  seller_id uuid NOT NULL,
  company_id uuid NOT NULL,
  strengths text[] DEFAULT '{}'::text[],
  weaknesses text[] DEFAULT '{}'::text[],
  repeated_errors text[] DEFAULT '{}'::text[],
  coach_notes text,
  progress_summary text,
  stealth_diagnostics jsonb,
  updated_at timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE public.seller_skill_state (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  seller_id uuid NOT NULL,
  company_id uuid NOT NULL,
  skill_id text NOT NULL,
  mastery_score numeric(5,2) DEFAULT 0 NOT NULL,
  recurring_failures jsonb DEFAULT '{}'::jsonb NOT NULL,
  evidence_count integer DEFAULT 0 NOT NULL,
  last_practiced_at timestamp with time zone,
  updated_at timestamp with time zone DEFAULT now() NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE public.sellers (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  profile_id uuid NOT NULL,
  company_id uuid NOT NULL,
  full_name text,
  experience_level text,
  main_challenge text,
  declaration text,
  current_world integer DEFAULT 0 NOT NULL,
  current_node text DEFAULT '0.0'::text NOT NULL,
  current_level text DEFAULT 'rookie'::text NOT NULL,
  streak_days integer DEFAULT 0 NOT NULL,
  last_practice_date date,
  xp_total integer DEFAULT 0 NOT NULL,
  is_active boolean DEFAULT true NOT NULL,
  credits_used_this_month numeric DEFAULT 0 NOT NULL,
  onboarding_completed boolean DEFAULT false NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  map_tutorial_completed boolean DEFAULT false NOT NULL,
  audio_consent boolean DEFAULT false NOT NULL,
  certified_at timestamp with time zone,
  joined_via_invite_id uuid,
  joined_at timestamp with time zone
);

CREATE TABLE public.skill_evaluations (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  session_id uuid NOT NULL,
  seller_id uuid NOT NULL,
  company_id uuid NOT NULL,
  node_id text,
  skill_id text NOT NULL,
  score integer NOT NULL,
  verdict text NOT NULL,
  success_hits jsonb DEFAULT '[]'::jsonb NOT NULL,
  failure_hits jsonb DEFAULT '[]'::jsonb NOT NULL,
  notes_for_seller text,
  notes_internal text,
  evaluator_version text DEFAULT 'none'::text NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE public.skills (
  id text NOT NULL,
  code text NOT NULL,
  name text NOT NULL,
  short_description text,
  category text NOT NULL,
  world_id_introduced integer NOT NULL,
  level_required text DEFAULT 'rookie'::text NOT NULL,
  parent_skill_id text,
  mastery_threshold integer DEFAULT 80 NOT NULL,
  reinforcement_threshold integer DEFAULT 50 NOT NULL,
  default_allowed_concepts jsonb DEFAULT '[]'::jsonb NOT NULL,
  default_forbidden_concepts jsonb DEFAULT '[]'::jsonb NOT NULL,
  success_signals jsonb DEFAULT '[]'::jsonb NOT NULL,
  failure_signals jsonb DEFAULT '[]'::jsonb NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  skill_type text,
  decay_half_life_days integer,
  requires_audio boolean DEFAULT false NOT NULL,
  status text DEFAULT 'active'::text NOT NULL,
  regla_id text
);

CREATE TABLE public.tts_calls (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  company_id uuid,
  seller_id uuid,
  session_id uuid,
  node_id text,
  phase text,
  characters integer DEFAULT 0 NOT NULL,
  voice_id text,
  model text,
  latency_ms integer,
  cache_hit boolean DEFAULT false NOT NULL,
  estimated_usd numeric(10,5) DEFAULT 0 NOT NULL
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

-- ===== RESTRICCIONES: PK y UNIQUE =====
ALTER TABLE public.certificates ADD CONSTRAINT certificates_pkey PRIMARY KEY (id);
ALTER TABLE public.client_archetypes ADD CONSTRAINT client_archetypes_pkey PRIMARY KEY (id);
ALTER TABLE public.client_names ADD CONSTRAINT client_names_pkey PRIMARY KEY (id);
ALTER TABLE public.coach_recommendations ADD CONSTRAINT coach_recommendations_pkey PRIMARY KEY (id);
ALTER TABLE public.companies ADD CONSTRAINT companies_pkey PRIMARY KEY (id);
ALTER TABLE public.company_brain_versions ADD CONSTRAINT company_brain_versions_pkey PRIMARY KEY (id);
ALTER TABLE public.company_invites ADD CONSTRAINT company_invites_pkey PRIMARY KEY (id);
ALTER TABLE public.company_onboarding_answers ADD CONSTRAINT company_onboarding_answers_pkey PRIMARY KEY (id);
ALTER TABLE public.company_pitches ADD CONSTRAINT company_pitches_pkey PRIMARY KEY (id);
ALTER TABLE public.daily_usage ADD CONSTRAINT daily_usage_pkey PRIMARY KEY (id);
ALTER TABLE public.director_decisions ADD CONSTRAINT director_decisions_pkey PRIMARY KEY (id);
ALTER TABLE public.disputas ADD CONSTRAINT disputas_pkey PRIMARY KEY (id);
ALTER TABLE public.doctrina ADD CONSTRAINT doctrina_pkey PRIMARY KEY (id);
ALTER TABLE public.invite_attempts ADD CONSTRAINT invite_attempts_pkey PRIMARY KEY (id);
ALTER TABLE public.llm_calls ADD CONSTRAINT llm_calls_pkey PRIMARY KEY (id);
ALTER TABLE public.manager_comments ADD CONSTRAINT manager_comments_pkey PRIMARY KEY (id);
ALTER TABLE public.node_cards ADD CONSTRAINT node_cards_pkey PRIMARY KEY (id);
ALTER TABLE public.node_progress ADD CONSTRAINT node_progress_pkey PRIMARY KEY (id);
ALTER TABLE public.node_quiz_questions ADD CONSTRAINT node_quiz_questions_pkey PRIMARY KEY (id);
ALTER TABLE public.node_skills ADD CONSTRAINT node_skills_pkey PRIMARY KEY (id);
ALTER TABLE public.nodes ADD CONSTRAINT nodes_pkey PRIMARY KEY (id);
ALTER TABLE public.pitch_classifications ADD CONSTRAINT pitch_classifications_pkey PRIMARY KEY (id);
ALTER TABLE public.pitch_feedback ADD CONSTRAINT pitch_feedback_pkey PRIMARY KEY (id);
ALTER TABLE public.pitch_sections ADD CONSTRAINT pitch_sections_pkey PRIMARY KEY (id);
ALTER TABLE public.pitch_versions ADD CONSTRAINT pitch_versions_pkey PRIMARY KEY (id);
ALTER TABLE public.platform_admins ADD CONSTRAINT platform_admins_pkey PRIMARY KEY (user_id);
ALTER TABLE public.practice_sessions ADD CONSTRAINT practice_sessions_pkey PRIMARY KEY (id);
ALTER TABLE public.profiles ADD CONSTRAINT profiles_pkey PRIMARY KEY (id);
ALTER TABLE public.reglas ADD CONSTRAINT reglas_pkey PRIMARY KEY (id);
ALTER TABLE public.seller_archetype_performance ADD CONSTRAINT seller_archetype_performance_pkey PRIMARY KEY (id);
ALTER TABLE public.seller_arsenal ADD CONSTRAINT seller_arsenal_pkey PRIMARY KEY (id);
ALTER TABLE public.seller_events ADD CONSTRAINT seller_events_pkey PRIMARY KEY (id);
ALTER TABLE public.seller_memory ADD CONSTRAINT seller_memory_pkey PRIMARY KEY (id);
ALTER TABLE public.seller_skill_state ADD CONSTRAINT seller_skill_state_pkey PRIMARY KEY (id);
ALTER TABLE public.sellers ADD CONSTRAINT sellers_pkey PRIMARY KEY (id);
ALTER TABLE public.skill_evaluations ADD CONSTRAINT skill_evaluations_pkey PRIMARY KEY (id);
ALTER TABLE public.skills ADD CONSTRAINT skills_pkey PRIMARY KEY (id);
ALTER TABLE public.tts_calls ADD CONSTRAINT tts_calls_pkey PRIMARY KEY (id);
ALTER TABLE public.worlds ADD CONSTRAINT worlds_pkey PRIMARY KEY (id);
ALTER TABLE public.client_archetypes ADD CONSTRAINT client_archetypes_type_key UNIQUE (type);
ALTER TABLE public.coach_recommendations ADD CONSTRAINT coach_recommendations_seller_id_key UNIQUE (seller_id);
ALTER TABLE public.companies ADD CONSTRAINT companies_slug_key UNIQUE (slug);
ALTER TABLE public.company_invites ADD CONSTRAINT company_invites_code_key UNIQUE (code);
ALTER TABLE public.daily_usage ADD CONSTRAINT daily_usage_seller_id_date_key UNIQUE (seller_id, date);
ALTER TABLE public.node_cards ADD CONSTRAINT node_cards_node_id_card_order_key UNIQUE (node_id, card_order);
ALTER TABLE public.node_progress ADD CONSTRAINT node_progress_seller_id_node_id_key UNIQUE (seller_id, node_id);
ALTER TABLE public.node_quiz_questions ADD CONSTRAINT node_quiz_questions_node_id_question_order_key UNIQUE (node_id, question_order);
ALTER TABLE public.node_skills ADD CONSTRAINT node_skills_node_id_skill_id_key UNIQUE (node_id, skill_id);
ALTER TABLE public.seller_archetype_performance ADD CONSTRAINT seller_archetype_performance_seller_id_archetype_id_key UNIQUE (seller_id, archetype_id);
ALTER TABLE public.seller_skill_state ADD CONSTRAINT seller_skill_state_seller_id_skill_id_key UNIQUE (seller_id, skill_id);
ALTER TABLE public.sellers ADD CONSTRAINT sellers_profile_id_key UNIQUE (profile_id);
ALTER TABLE public.skill_evaluations ADD CONSTRAINT skill_evaluations_session_id_skill_id_key UNIQUE (session_id, skill_id);
ALTER TABLE public.skills ADD CONSTRAINT skills_code_key UNIQUE (code);

-- ===== RESTRICCIONES: CHECK =====
ALTER TABLE public.client_archetypes ADD CONSTRAINT client_archetypes_difficulty_base_check CHECK (((difficulty_base >= 1) AND (difficulty_base <= 5)));
ALTER TABLE public.companies ADD CONSTRAINT companies_tipos_cliente_check CHECK ((tipos_cliente = ANY (ARRAY['ambos'::text, 'solo_nuevos'::text, 'solo_recurrentes'::text])));
ALTER TABLE public.company_onboarding_answers ADD CONSTRAINT company_onboarding_answers_block_number_check CHECK ((block_number = ANY (ARRAY[1, 2, 3])));
ALTER TABLE public.company_pitches ADD CONSTRAINT company_pitches_channel_check CHECK ((channel = ANY (ARRAY['presencial'::text, 'telefono'::text, 'whatsapp'::text])));
ALTER TABLE public.company_pitches ADD CONSTRAINT company_pitches_client_type_check CHECK ((client_type = ANY (ARRAY['revende'::text, 'consume'::text, 'distribuye'::text])));
ALTER TABLE public.company_pitches ADD CONSTRAINT company_pitches_relationship_check CHECK ((relationship = ANY (ARRAY['nuevo'::text, 'recurrente'::text])));
ALTER TABLE public.company_pitches ADD CONSTRAINT company_pitches_status_check CHECK ((status = ANY (ARRAY['draft'::text, 'published'::text, 'archived'::text])));
ALTER TABLE public.node_progress ADD CONSTRAINT node_progress_stars_check CHECK (((stars >= 0) AND (stars <= 3)));
ALTER TABLE public.node_progress ADD CONSTRAINT node_progress_status_check CHECK ((status = ANY (ARRAY['locked'::text, 'available'::text, 'current'::text, 'done'::text])));
ALTER TABLE public.node_quiz_questions ADD CONSTRAINT node_quiz_questions_correct_option_check CHECK ((correct_option = ANY (ARRAY['A'::text, 'B'::text, 'C'::text, 'D'::text])));
ALTER TABLE public.node_skills ADD CONSTRAINT node_skills_weight_check CHECK (((weight >= (0)::numeric) AND (weight <= (1)::numeric)));
ALTER TABLE public.nodes ADD CONSTRAINT nodes_conversation_scope_check CHECK (((conversation_scope IS NULL) OR (conversation_scope = ANY (ARRAY['first_impression'::text, 'short_story'::text, 'discovery'::text, 'presentation'::text, 'close'::text, 'full'::text]))));
ALTER TABLE public.nodes ADD CONSTRAINT nodes_tipo_cliente_check CHECK ((tipo_cliente = ANY (ARRAY['nuevo'::text, 'recurrente'::text, 'cualquiera'::text])));
ALTER TABLE public.pitch_classifications ADD CONSTRAINT pitch_classifications_speaker_check CHECK ((speaker = ANY (ARRAY['vendedor'::text, 'cliente'::text, 'coach'::text])));
ALTER TABLE public.pitch_classifications ADD CONSTRAINT pitch_classifications_stage_check CHECK ((stage = ANY (ARRAY['opening'::text, 'discovery'::text, 'pitch'::text, 'objection_handling'::text, 'close'::text, 'consolidation'::text])));
ALTER TABLE public.pitch_feedback ADD CONSTRAINT pitch_feedback_classification_check CHECK (((classification IS NULL) OR (classification = ANY (ARRAY['estilo'::text, 'hecho'::text, 'correccion'::text, 'doctrina'::text]))));
ALTER TABLE public.pitch_feedback ADD CONSTRAINT pitch_feedback_outcome_check CHECK (((outcome IS NULL) OR (outcome = ANY (ARRAY['aceptado'::text, 'rechazado'::text, 'forzado_por_manager'::text, 'en_conversacion'::text, 'aplicado'::text, 'aplicado_por_el_equipo'::text, 'sin_cambio'::text]))));
ALTER TABLE public.pitch_sections ADD CONSTRAINT pitch_sections_audit_status_check CHECK (((audit_status IS NULL) OR (audit_status = ANY (ARRAY['limpio'::text, 'advertencia'::text, 'falla'::text]))));
ALTER TABLE public.pitch_sections ADD CONSTRAINT pitch_sections_section_key_check CHECK ((section_key = ANY (ARRAY['introduccion'::text, 'historia_breve'::text, 'descubrimiento'::text, 'presentacion'::text, 'cierre'::text, 'consolidacion'::text])));
ALTER TABLE public.pitch_sections ADD CONSTRAINT pitch_sections_section_kind_check CHECK ((section_kind = ANY (ARRAY['guion'::text, 'municion'::text])));
ALTER TABLE public.profiles ADD CONSTRAINT profiles_role_check CHECK ((role = ANY (ARRAY['manager'::text, 'vendedor'::text])));
ALTER TABLE public.reglas ADD CONSTRAINT reglas_canal_check CHECK ((canal = ANY (ARRAY['universal'::text, 'presencial'::text])));
ALTER TABLE public.reglas ADD CONSTRAINT reglas_severidad_default_check CHECK ((severidad_default = ANY (ARRAY['minor'::text, 'major'::text, 'critical'::text])));
ALTER TABLE public.reglas ADD CONSTRAINT reglas_tipo_check CHECK ((tipo = ANY (ARRAY['requisito'::text, 'error'::text, 'herramienta'::text, 'principio'::text, 'premio'::text, 'neutro'::text])));
ALTER TABLE public.seller_arsenal ADD CONSTRAINT seller_arsenal_bullet_type_check CHECK ((bullet_type = ANY (ARRAY['empresa'::text, 'producto'::text, 'precio'::text])));
ALTER TABLE public.seller_events ADD CONSTRAINT seller_events_event_type_check CHECK ((event_type = ANY (ARRAY['practice_session'::text, 'quiz_completed'::text, 'evaluation'::text, 'node_completed'::text, 'mission_assigned'::text, 'field_result'::text])));
ALTER TABLE public.seller_skill_state ADD CONSTRAINT seller_skill_state_current_score_check CHECK (((mastery_score >= (0)::numeric) AND (mastery_score <= (100)::numeric)));
ALTER TABLE public.skill_evaluations ADD CONSTRAINT skill_evaluations_score_check CHECK (((score >= 0) AND (score <= 100)));

-- ===== RESTRICCIONES: LLAVES FORÁNEAS =====
ALTER TABLE public.certificates ADD CONSTRAINT certificates_company_id_fkey FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE;
ALTER TABLE public.certificates ADD CONSTRAINT certificates_seller_id_fkey FOREIGN KEY (seller_id) REFERENCES sellers(id) ON DELETE CASCADE;
ALTER TABLE public.coach_recommendations ADD CONSTRAINT coach_recommendations_company_id_fkey FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE;
ALTER TABLE public.coach_recommendations ADD CONSTRAINT coach_recommendations_seller_id_fkey FOREIGN KEY (seller_id) REFERENCES sellers(id) ON DELETE CASCADE;
ALTER TABLE public.company_brain_versions ADD CONSTRAINT company_brain_versions_company_id_fkey FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE;
ALTER TABLE public.company_invites ADD CONSTRAINT company_invites_company_id_fkey FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE;
ALTER TABLE public.company_invites ADD CONSTRAINT company_invites_created_by_fkey FOREIGN KEY (created_by) REFERENCES profiles(id);
ALTER TABLE public.company_invites ADD CONSTRAINT company_invites_used_by_fkey FOREIGN KEY (used_by) REFERENCES profiles(id);
ALTER TABLE public.company_onboarding_answers ADD CONSTRAINT company_onboarding_answers_company_id_fkey FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE;
ALTER TABLE public.company_pitches ADD CONSTRAINT company_pitches_company_id_fkey FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE;
ALTER TABLE public.company_pitches ADD CONSTRAINT company_pitches_created_by_fkey FOREIGN KEY (created_by) REFERENCES profiles(id);
ALTER TABLE public.daily_usage ADD CONSTRAINT daily_usage_company_id_fkey FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE;
ALTER TABLE public.daily_usage ADD CONSTRAINT daily_usage_seller_id_fkey FOREIGN KEY (seller_id) REFERENCES sellers(id) ON DELETE CASCADE;
ALTER TABLE public.llm_calls ADD CONSTRAINT llm_calls_company_id_fkey FOREIGN KEY (company_id) REFERENCES companies(id);
ALTER TABLE public.llm_calls ADD CONSTRAINT llm_calls_event_id_fkey FOREIGN KEY (event_id) REFERENCES seller_events(id) ON DELETE SET NULL;
ALTER TABLE public.llm_calls ADD CONSTRAINT llm_calls_seller_id_fkey FOREIGN KEY (seller_id) REFERENCES sellers(id);
ALTER TABLE public.manager_comments ADD CONSTRAINT manager_comments_company_id_fkey FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE;
ALTER TABLE public.manager_comments ADD CONSTRAINT manager_comments_manager_id_fkey FOREIGN KEY (manager_id) REFERENCES profiles(id) ON DELETE CASCADE;
ALTER TABLE public.manager_comments ADD CONSTRAINT manager_comments_seller_id_fkey FOREIGN KEY (seller_id) REFERENCES sellers(id) ON DELETE CASCADE;
ALTER TABLE public.manager_comments ADD CONSTRAINT manager_comments_session_id_fkey FOREIGN KEY (session_id) REFERENCES practice_sessions(id) ON DELETE CASCADE;
ALTER TABLE public.node_cards ADD CONSTRAINT node_cards_node_id_fkey FOREIGN KEY (node_id) REFERENCES nodes(id) ON DELETE CASCADE;
ALTER TABLE public.node_progress ADD CONSTRAINT node_progress_company_id_fkey FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE;
ALTER TABLE public.node_progress ADD CONSTRAINT node_progress_node_id_fkey FOREIGN KEY (node_id) REFERENCES nodes(id) ON DELETE CASCADE;
ALTER TABLE public.node_progress ADD CONSTRAINT node_progress_seller_id_fkey FOREIGN KEY (seller_id) REFERENCES sellers(id) ON DELETE CASCADE;
ALTER TABLE public.node_quiz_questions ADD CONSTRAINT node_quiz_questions_node_id_fkey FOREIGN KEY (node_id) REFERENCES nodes(id) ON DELETE CASCADE;
ALTER TABLE public.node_quiz_questions ADD CONSTRAINT node_quiz_questions_regla_id_fkey FOREIGN KEY (regla_id) REFERENCES reglas(id);
ALTER TABLE public.node_skills ADD CONSTRAINT node_skills_skill_id_fkey FOREIGN KEY (skill_id) REFERENCES skills(id) ON UPDATE CASCADE ON DELETE CASCADE;
ALTER TABLE public.nodes ADD CONSTRAINT nodes_world_id_fkey FOREIGN KEY (world_id) REFERENCES worlds(id) ON DELETE CASCADE;
ALTER TABLE public.pitch_classifications ADD CONSTRAINT pitch_classifications_company_id_fkey FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE;
ALTER TABLE public.pitch_classifications ADD CONSTRAINT pitch_classifications_session_id_fkey FOREIGN KEY (session_id) REFERENCES practice_sessions(id) ON DELETE CASCADE;
ALTER TABLE public.pitch_feedback ADD CONSTRAINT pitch_feedback_pitch_id_fkey FOREIGN KEY (pitch_id) REFERENCES company_pitches(id) ON DELETE CASCADE;
ALTER TABLE public.pitch_feedback ADD CONSTRAINT pitch_feedback_section_id_fkey FOREIGN KEY (section_id) REFERENCES pitch_sections(id) ON DELETE SET NULL;
ALTER TABLE public.pitch_sections ADD CONSTRAINT pitch_sections_pitch_id_fkey FOREIGN KEY (pitch_id) REFERENCES company_pitches(id) ON DELETE CASCADE;
ALTER TABLE public.pitch_versions ADD CONSTRAINT pitch_versions_pitch_id_fkey FOREIGN KEY (pitch_id) REFERENCES company_pitches(id) ON DELETE CASCADE;
ALTER TABLE public.pitch_versions ADD CONSTRAINT pitch_versions_published_by_fkey FOREIGN KEY (published_by) REFERENCES profiles(id);
ALTER TABLE public.platform_admins ADD CONSTRAINT platform_admins_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE public.practice_sessions ADD CONSTRAINT practice_sessions_company_id_fkey FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE;
ALTER TABLE public.practice_sessions ADD CONSTRAINT practice_sessions_node_id_fkey FOREIGN KEY (node_id) REFERENCES nodes(id);
ALTER TABLE public.practice_sessions ADD CONSTRAINT practice_sessions_seller_id_fkey FOREIGN KEY (seller_id) REFERENCES sellers(id) ON DELETE CASCADE;
ALTER TABLE public.practice_sessions ADD CONSTRAINT practice_sessions_world_id_fkey FOREIGN KEY (world_id) REFERENCES worlds(id);
ALTER TABLE public.profiles ADD CONSTRAINT profiles_company_id_fkey FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE SET NULL;
ALTER TABLE public.profiles ADD CONSTRAINT profiles_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE public.seller_archetype_performance ADD CONSTRAINT seller_archetype_performance_archetype_id_fkey FOREIGN KEY (archetype_id) REFERENCES client_archetypes(id) ON DELETE CASCADE;
ALTER TABLE public.seller_archetype_performance ADD CONSTRAINT seller_archetype_performance_company_id_fkey FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE;
ALTER TABLE public.seller_archetype_performance ADD CONSTRAINT seller_archetype_performance_seller_id_fkey FOREIGN KEY (seller_id) REFERENCES sellers(id) ON DELETE CASCADE;
ALTER TABLE public.seller_arsenal ADD CONSTRAINT seller_arsenal_company_id_fkey FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE;
ALTER TABLE public.seller_arsenal ADD CONSTRAINT seller_arsenal_seller_id_fkey FOREIGN KEY (seller_id) REFERENCES sellers(id) ON DELETE CASCADE;
ALTER TABLE public.seller_events ADD CONSTRAINT seller_events_seller_id_fkey FOREIGN KEY (seller_id) REFERENCES sellers(id) ON DELETE CASCADE;
ALTER TABLE public.seller_memory ADD CONSTRAINT seller_memory_company_id_fkey FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE;
ALTER TABLE public.seller_memory ADD CONSTRAINT seller_memory_seller_id_fkey FOREIGN KEY (seller_id) REFERENCES sellers(id) ON DELETE CASCADE;
ALTER TABLE public.seller_skill_state ADD CONSTRAINT seller_skill_state_skill_id_fkey FOREIGN KEY (skill_id) REFERENCES skills(id) ON UPDATE CASCADE ON DELETE CASCADE;
ALTER TABLE public.sellers ADD CONSTRAINT sellers_company_id_fkey FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE;
ALTER TABLE public.sellers ADD CONSTRAINT sellers_joined_via_invite_id_fkey FOREIGN KEY (joined_via_invite_id) REFERENCES company_invites(id);
ALTER TABLE public.sellers ADD CONSTRAINT sellers_profile_id_fkey FOREIGN KEY (profile_id) REFERENCES profiles(id) ON DELETE CASCADE;
ALTER TABLE public.skill_evaluations ADD CONSTRAINT skill_evaluations_skill_id_fkey FOREIGN KEY (skill_id) REFERENCES skills(id) ON UPDATE CASCADE ON DELETE CASCADE;
ALTER TABLE public.skills ADD CONSTRAINT skills_parent_skill_id_fkey FOREIGN KEY (parent_skill_id) REFERENCES skills(id) ON UPDATE CASCADE ON DELETE SET NULL;
ALTER TABLE public.skills ADD CONSTRAINT skills_regla_id_fkey FOREIGN KEY (regla_id) REFERENCES reglas(id);
ALTER TABLE public.tts_calls ADD CONSTRAINT tts_calls_company_id_fkey FOREIGN KEY (company_id) REFERENCES companies(id);
ALTER TABLE public.tts_calls ADD CONSTRAINT tts_calls_seller_id_fkey FOREIGN KEY (seller_id) REFERENCES sellers(id);

-- ===== ÍNDICES (los que no salen de una PK/UNIQUE) =====
CREATE INDEX idx_coach_recommendations_company ON public.coach_recommendations USING btree (company_id);
CREATE INDEX idx_coach_recommendations_seller ON public.coach_recommendations USING btree (seller_id);
CREATE INDEX company_brain_versions_company_created_idx ON public.company_brain_versions USING btree (company_id, created_at DESC);
CREATE INDEX idx_invites_code ON public.company_invites USING btree (code);
CREATE UNIQUE INDEX uniq_active_invite_per_company ON public.company_invites USING btree (company_id) WHERE (revoked_at IS NULL);
CREATE UNIQUE INDEX company_pitches_unique_active ON public.company_pitches USING btree (company_id, relationship, client_type, channel) WHERE (status <> 'archived'::text);
CREATE INDEX disputas_concede_idx ON public.disputas USING btree (concede, revisada);
CREATE INDEX disputas_fecha_idx ON public.disputas USING btree (created_at DESC);
CREATE INDEX doctrina_active_idx ON public.doctrina USING btree (is_active, version, order_index);
CREATE INDEX idx_invite_attempts_actor_time ON public.invite_attempts USING btree (actor_id, created_at DESC);
CREATE INDEX idx_llm_calls_created_at ON public.llm_calls USING btree (created_at DESC);
CREATE INDEX idx_llm_calls_event_id ON public.llm_calls USING btree (event_id);
CREATE INDEX idx_llm_calls_phase ON public.llm_calls USING btree (phase);
CREATE INDEX idx_llm_calls_session_id ON public.llm_calls USING btree (session_id);
CREATE INDEX llm_calls_company_idx ON public.llm_calls USING btree (company_id, created_at DESC);
CREATE INDEX llm_calls_created_at_idx ON public.llm_calls USING btree (created_at DESC);
CREATE INDEX idx_node_cards_node_id_order ON public.node_cards USING btree (node_id, card_order);
CREATE INDEX idx_node_progress_seller ON public.node_progress USING btree (seller_id);
CREATE INDEX idx_node_quiz_questions_node ON public.node_quiz_questions USING btree (node_id, question_order);
CREATE INDEX node_quiz_questions_regla_idx ON public.node_quiz_questions USING btree (regla_id);
CREATE UNIQUE INDEX node_skills_one_primary_per_skill ON public.node_skills USING btree (skill_id) WHERE (is_primary = true);
CREATE INDEX node_skills_skill_idx ON public.node_skills USING btree (skill_id);
CREATE INDEX pitch_sections_audit_status_idx ON public.pitch_sections USING btree (audit_status) WHERE ((audit_status IS NOT NULL) AND (audit_status <> 'limpio'::text));
CREATE INDEX pitch_sections_pitch_idx ON public.pitch_sections USING btree (pitch_id, order_index);
CREATE INDEX idx_sessions_company ON public.practice_sessions USING btree (company_id);
CREATE INDEX idx_sessions_seller ON public.practice_sessions USING btree (seller_id);
CREATE INDEX idx_profiles_company ON public.profiles USING btree (company_id);
CREATE INDEX idx_sap_company ON public.seller_archetype_performance USING btree (company_id);
CREATE INDEX idx_sap_seller ON public.seller_archetype_performance USING btree (seller_id);
CREATE INDEX seller_events_event_type_idx ON public.seller_events USING btree (event_type);
CREATE INDEX seller_events_seller_created_idx ON public.seller_events USING btree (seller_id, created_at DESC);
CREATE INDEX seller_skill_state_company_idx ON public.seller_skill_state USING btree (company_id);
CREATE INDEX seller_skill_state_seller_idx ON public.seller_skill_state USING btree (seller_id);
CREATE INDEX idx_sellers_company ON public.sellers USING btree (company_id);
CREATE INDEX idx_sellers_profile ON public.sellers USING btree (profile_id);
CREATE INDEX skill_evaluations_seller_idx ON public.skill_evaluations USING btree (seller_id);
CREATE INDEX skill_evaluations_session_idx ON public.skill_evaluations USING btree (session_id);
CREATE INDEX skill_evaluations_skill_idx ON public.skill_evaluations USING btree (skill_id);
CREATE INDEX tts_calls_company_idx ON public.tts_calls USING btree (company_id, created_at DESC);
CREATE INDEX tts_calls_created_idx ON public.tts_calls USING btree (created_at DESC);
CREATE INDEX tts_calls_session_idx ON public.tts_calls USING btree (session_id);

-- ===== FUNCIONES =====
CREATE OR REPLACE FUNCTION public._company_prefix(_name text)
 RETURNS text
 LANGUAGE plpgsql
AS $function$
DECLARE
  clean text;
BEGIN
  clean := upper(regexp_replace(coalesce(_name, 'CLOSER'), '[^A-Za-z0-9]', '', 'g'));
  IF length(clean) < 2 THEN clean := 'CLOSER'; END IF;
  RETURN substr(clean, 1, 8);
END;
$function$
;

CREATE OR REPLACE FUNCTION public._gen_invite_suffix()
 RETURNS text
 LANGUAGE plpgsql
AS $function$
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
$function$
;

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
$function$
;

CREATE OR REPLACE FUNCTION public.consume_credits(_seller_id uuid, _session_type text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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
$function$
;

CREATE OR REPLACE FUNCTION public.convert_personal_to_company(_name text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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
$function$
;

CREATE OR REPLACE FUNCTION public.create_company_for_manager(_name text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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
$function$
;

CREATE OR REPLACE FUNCTION public.create_personal_company()
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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
$function$
;

CREATE OR REPLACE FUNCTION public.create_team_company(_name text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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
$function$
;

CREATE OR REPLACE FUNCTION public.current_company_id()
 RETURNS uuid
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT company_id FROM public.profiles WHERE id = auth.uid()
$function$
;

CREATE OR REPLACE FUNCTION public."current_role"()
 RETURNS text
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT role FROM public.profiles WHERE id = auth.uid()
$function$
;

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

CREATE OR REPLACE FUNCTION public.generate_company_invite()
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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
$function$
;

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
$function$
;

CREATE OR REPLACE FUNCTION public.get_active_company_invite()
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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
$function$
;

CREATE OR REPLACE FUNCTION public.get_current_mastery(_mastery_score numeric, _last_practiced_at timestamp with time zone)
 RETURNS numeric
 LANGUAGE sql
 IMMUTABLE
 SET search_path TO 'public'
AS $function$
  SELECT CASE
    WHEN _mastery_score IS NULL THEN 0
    WHEN _last_practiced_at IS NULL THEN _mastery_score
    ELSE GREATEST(
      0,
      _mastery_score - 0.5 * GREATEST(0, FLOOR(EXTRACT(EPOCH FROM (now() - _last_practiced_at)) / 86400)::int - 7)
    )
  END::numeric(5,2)
$function$
;

CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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
$function$
;

CREATE OR REPLACE FUNCTION public.is_manager()
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'manager')
$function$
;

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
$function$
;

CREATE OR REPLACE FUNCTION public.llm_call_usd(_model text, _input integer, _output integer, _cached integer, _cache_write integer)
 RETURNS numeric
 LANGUAGE sql
 IMMUTABLE
 SET search_path TO 'public'
AS $function$
  SELECT ROUND((
    CASE
      WHEN _model ILIKE '%haiku%' THEN
          COALESCE(_input,0) * 1.00 + COALESCE(_output,0) * 5.00
        + COALESCE(_cached,0) * 0.10 + COALESCE(_cache_write,0) * 1.25
      WHEN _model ILIKE '%gemini%pro%' THEN
          COALESCE(_input,0) * 1.25 + COALESCE(_output,0) * 10.00
        + COALESCE(_cached,0) * 0.31 + COALESCE(_cache_write,0) * 1.25
      WHEN _model ILIKE '%gemini%flash%' THEN
          COALESCE(_input,0) * 0.30 + COALESCE(_output,0) * 2.50
        + COALESCE(_cached,0) * 0.075 + COALESCE(_cache_write,0) * 0.30
      ELSE -- sonnet 4.5 y por defecto
          COALESCE(_input,0) * 3.00 + COALESCE(_output,0) * 15.00
        + COALESCE(_cached,0) * 0.30 + COALESCE(_cache_write,0) * 3.75
    END
  ) / 1000000.0, 5)::numeric
$function$
;

CREATE OR REPLACE FUNCTION public.llm_usage_report(_from timestamp with time zone, _to timestamp with time zone)
 RETURNS TABLE(company_id uuid, company_name text, phase text, model text, calls bigint, input_tokens bigint, cached_tokens bigint, cache_creation_tokens bigint, output_tokens bigint, avg_latency_ms numeric)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT
    l.company_id,
    c.name,
    l.phase,
    l.model,
    count(*)::bigint,
    COALESCE(sum(l.input_tokens), 0)::bigint,
    COALESCE(sum(l.cached_tokens), 0)::bigint,
    COALESCE(sum(l.cache_creation_tokens), 0)::bigint,
    COALESCE(sum(l.output_tokens), 0)::bigint,
    ROUND(AVG(l.latency_ms)::numeric, 0)
  FROM public.llm_calls l
  LEFT JOIN public.companies c ON c.id = l.company_id
  WHERE l.created_at >= _from
    AND l.created_at < _to
    AND (
      auth.uid() IN (
        '59940ac9-fc91-43b5-a7a5-9555953eb39b'::uuid,
        '10d3617b-4bbe-49ba-b671-bc60982c1ab2'::uuid,
        '0672b476-5c81-4a0b-a9b0-e18496cd81c4'::uuid
      )
      OR (public.is_manager() AND l.company_id = public.current_company_id())
    )
  GROUP BY l.company_id, c.name, l.phase, l.model
  ORDER BY 1, 3;
$function$
;

CREATE OR REPLACE FUNCTION public.owns_seller(_seller_id uuid)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT EXISTS (SELECT 1 FROM public.sellers WHERE id = _seller_id AND profile_id = auth.uid())
$function$
;

CREATE OR REPLACE FUNCTION public.register_invite_failed_attempt(_code text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  UPDATE public.company_invites
    SET failed_attempts = failed_attempts + 1,
        locked_until = CASE
          WHEN failed_attempts + 1 >= 5 THEN now() + interval '24 hours'
          ELSE locked_until
        END
    WHERE code = _code;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.resolver_practice_script(ps jsonb)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE
AS $function$
DECLARE
  resultado jsonb := ps;
  tipo text;
  lista jsonb;
  nuevo jsonb;
  c jsonb;
  r public.reglas%ROWTYPE;
  descripcion text;
  severidad text;
BEGIN
  IF ps IS NULL THEN RETURN NULL; END IF;

  FOREACH tipo IN ARRAY ARRAY['success_criteria', 'failure_criteria'] LOOP
    lista := ps -> tipo;
    IF lista IS NULL OR jsonb_typeof(lista) <> 'array' THEN CONTINUE; END IF;

    nuevo := '[]'::jsonb;
    FOR c IN SELECT * FROM jsonb_array_elements(lista) LOOP
      IF c ? 'regla_id' THEN
        SELECT * INTO r FROM public.reglas WHERE id = c->>'regla_id';
        IF FOUND THEN
          -- Definición canónica primero; el contexto del nodo después.
          -- El evaluador ve UNA descripción, así que van juntas.
          descripcion := r.resumen;
          IF coalesce(c->>'description','') <> '' AND c->>'description' <> r.resumen THEN
            descripcion := descripcion || ' — En este nodo: ' || (c->>'description');
          END IF;

          -- Severidad: default de la regla salvo override declarado.
          IF tipo = 'failure_criteria' THEN
            IF c ? 'severity_override' THEN
              severidad := c->>'severity';                -- el nodo lo declaró, se respeta
            ELSE
              severidad := coalesce(r.severidad_default, c->>'severity');
            END IF;
            c := jsonb_set(c, '{severity}', to_jsonb(severidad));
          END IF;

          c := c
            || jsonb_build_object(
                 'description',   descripcion,
                 'contexto_nodo', c->>'description',
                 'regla_resumen', r.resumen,
                 'cita_cerebro',  r.cita_cerebro,
                 'regla_tipo',    r.tipo,
                 'regla_canal',   r.canal
               );
        END IF;
      END IF;
      nuevo := nuevo || jsonb_build_array(c);
    END LOOP;
    resultado := jsonb_set(resultado, ARRAY[tipo], nuevo);
  END LOOP;

  RETURN resultado;
END;
$function$
;

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
$function$
;

CREATE OR REPLACE FUNCTION public.save_onboarding_answer(_block_number integer, _question_id text, _question_text text, _answer text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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
$function$
;

CREATE OR REPLACE FUNCTION public.select_archetype_for_session(_seller_id uuid, _world_id integer, _node_id text)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  _selected uuid;
  _seller_avg numeric;
  _recent uuid[];
  _is_boss_final boolean;
BEGIN
  _is_boss_final := (_world_id = 9 AND _node_id ILIKE '%boss%');

  -- Promedio general del vendedor
  SELECT COALESCE(AVG(avg_score), 0) INTO _seller_avg
  FROM public.seller_archetype_performance
  WHERE seller_id = _seller_id AND sessions_count > 0;

  -- Últimos 3 arquetipos practicados (para evitar repetición)
  SELECT COALESCE(array_agg(archetype_id ORDER BY last_practiced_at DESC), '{}')
    INTO _recent
  FROM (
    SELECT archetype_id, last_practiced_at
    FROM public.seller_archetype_performance
    WHERE seller_id = _seller_id AND last_practiced_at IS NOT NULL
    ORDER BY last_practiced_at DESC
    LIMIT 3
  ) r;

  -- Regla 7: Boss Final — combinación dominio + dificultad
  IF _is_boss_final THEN
    SELECT sap.archetype_id INTO _selected
    FROM public.seller_archetype_performance sap
    JOIN public.client_archetypes ca ON ca.id = sap.archetype_id
    WHERE sap.seller_id = _seller_id
      AND ca.is_boss_eligible = true
      AND _world_id = ANY(ca.worlds_available)
    ORDER BY sap.avg_score DESC, ca.difficulty_base DESC
    LIMIT 1;

    IF _selected IS NOT NULL THEN
      RETURN _selected;
    END IF;
  END IF;

  -- Regla 3: 33% probabilidad de modo refuerzo
  IF random() < 0.33 THEN
    SELECT sap.archetype_id INTO _selected
    FROM public.seller_archetype_performance sap
    JOIN public.client_archetypes ca ON ca.id = sap.archetype_id
    WHERE sap.seller_id = _seller_id
      AND sap.is_in_reinforcement_mode = true
      AND _world_id = ANY(ca.worlds_available)
    ORDER BY random()
    LIMIT 1;

    IF _selected IS NOT NULL THEN
      RETURN _selected;
    END IF;
  END IF;

  -- Selección normal: arquetipos del mundo, sin repetir últimos 3
  SELECT ca.id INTO _selected
  FROM public.client_archetypes ca
  WHERE _world_id = ANY(ca.worlds_available)
    AND NOT (ca.id = ANY(_recent))
  ORDER BY random()
  LIMIT 1;

  -- Fallback: si todos repiten, ignora la restricción de no repetición
  IF _selected IS NULL THEN
    SELECT ca.id INTO _selected
    FROM public.client_archetypes ca
    WHERE _world_id = ANY(ca.worlds_available)
    ORDER BY random()
    LIMIT 1;
  END IF;

  RETURN _selected;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.set_seller_active(_seller_id uuid, _active boolean)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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
$function$
;

CREATE OR REPLACE FUNCTION public.update_company_brain(_brain jsonb)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  _company_id uuid;
  _uid uuid := auth.uid();
BEGIN
  IF NOT public.is_manager() THEN
    RAISE EXCEPTION 'Only managers';
  END IF;
  _company_id := public.current_company_id();
  UPDATE public.companies
    SET company_sales_brain = _brain,
        onboarding_completed = true,
        brain_updated_at = now()
    WHERE id = _company_id;
  INSERT INTO public.company_brain_versions (company_id, brain, edited_by)
    VALUES (_company_id, _brain, _uid);
  RETURN jsonb_build_object('ok', true, 'updated_at', now());
END;
$function$
;

CREATE OR REPLACE FUNCTION public.update_company_identity(_name text, _industry text, _logo_url text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE _company_id uuid;
BEGIN
  IF NOT public.is_manager() THEN
    RAISE EXCEPTION 'Only managers';
  END IF;
  _company_id := public.current_company_id();
  UPDATE public.companies
    SET name = COALESCE(NULLIF(trim(_name), ''), name),
        industry = NULLIF(trim(COALESCE(_industry, '')), ''),
        logo_url = NULLIF(trim(COALESCE(_logo_url, '')), '')
    WHERE id = _company_id;
  RETURN jsonb_build_object('ok', true);
END;
$function$
;

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.usage_cost_report(_from timestamp with time zone, _to timestamp with time zone)
 RETURNS TABLE(company_id uuid, company_name text, llm_calls bigint, llm_input_tokens bigint, llm_cached_tokens bigint, llm_output_tokens bigint, llm_usd numeric, tts_calls bigint, tts_characters bigint, tts_cache_hits bigint, tts_usd numeric, total_usd numeric)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  WITH allowed AS (
    SELECT c.id, c.name
    FROM public.companies c
    WHERE auth.uid() IN (
        '59940ac9-fc91-43b5-a7a5-9555953eb39b'::uuid,
        '10d3617b-4bbe-49ba-b671-bc60982c1ab2'::uuid,
        '0672b476-5c81-4a0b-a9b0-e18496cd81c4'::uuid
      )
      OR (public.is_manager() AND c.id = public.current_company_id())
  ),
  l AS (
    SELECT l.company_id,
           count(*)::bigint AS calls,
           COALESCE(sum(l.input_tokens),0)::bigint AS input_tokens,
           COALESCE(sum(l.cached_tokens),0)::bigint AS cached_tokens,
           COALESCE(sum(l.output_tokens),0)::bigint AS output_tokens,
           COALESCE(sum(public.llm_call_usd(l.model, l.input_tokens, l.output_tokens, l.cached_tokens, l.cache_creation_tokens)),0)::numeric AS usd
    FROM public.llm_calls l
    WHERE l.created_at >= _from AND l.created_at < _to
    GROUP BY l.company_id
  ),
  t AS (
    SELECT t.company_id,
           count(*)::bigint AS calls,
           COALESCE(sum(t.characters),0)::bigint AS characters,
           count(*) FILTER (WHERE t.cache_hit)::bigint AS cache_hits,
           COALESCE(sum(t.estimated_usd),0)::numeric AS usd
    FROM public.tts_calls t
    WHERE t.created_at >= _from AND t.created_at < _to
    GROUP BY t.company_id
  )
  SELECT a.id, a.name,
         COALESCE(l.calls,0), COALESCE(l.input_tokens,0), COALESCE(l.cached_tokens,0),
         COALESCE(l.output_tokens,0), ROUND(COALESCE(l.usd,0),4),
         COALESCE(t.calls,0), COALESCE(t.characters,0), COALESCE(t.cache_hits,0),
         ROUND(COALESCE(t.usd,0),4),
         ROUND(COALESCE(l.usd,0) + COALESCE(t.usd,0),4)
  FROM allowed a
  LEFT JOIN l ON l.company_id = a.id
  LEFT JOIN t ON t.company_id = a.id
  ORDER BY 12 DESC NULLS LAST;
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
$function$
;

-- ===== TRIGGERS =====
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION handle_new_user();
CREATE TRIGGER trg_coach_recommendations_updated_at BEFORE UPDATE ON public.coach_recommendations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER company_pitches_set_updated_at BEFORE UPDATE ON public.company_pitches FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trg_validar_practice_script BEFORE INSERT OR UPDATE OF practice_script, node_type ON public.nodes FOR EACH ROW EXECUTE FUNCTION validar_practice_script();
CREATE TRIGGER ensure_manager_seller_row_trg AFTER INSERT OR UPDATE OF role, company_id ON public.profiles FOR EACH ROW EXECUTE FUNCTION ensure_manager_seller_row();
CREATE TRIGGER seller_skill_state_set_updated_at BEFORE UPDATE ON public.seller_skill_state FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ===== VISTAS =====
CREATE OR REPLACE VIEW public.pitch_version_integrity AS
 SELECT p.id AS pitch_id,
    p.company_id,
    p.client_type,
    p.channel,
    p.status,
    count(s.id) AS sections,
    count(*) FILTER (WHERE s.prompt_version IS NULL) AS sections_sin_version,
    count(*) FILTER (WHERE s.is_stale) AS sections_desactualizadas,
    count(DISTINCT s.prompt_version) AS versiones_distintas,
    array_agg(DISTINCT COALESCE(s.prompt_version, '(sin version)'::text)) AS versiones
   FROM company_pitches p
     JOIN pitch_sections s ON s.pitch_id = p.id
  GROUP BY p.id, p.company_id, p.client_type, p.channel, p.status
 HAVING count(DISTINCT s.prompt_version) > 1 OR count(*) FILTER (WHERE s.prompt_version IS NULL) > 0 OR count(*) FILTER (WHERE s.is_stale) > 0;
CREATE OR REPLACE VIEW public.v_nodes_resueltos AS
 SELECT id,
    world_id,
    name,
    technique,
    order_index,
    is_boss,
    reps_required,
    checkpoints,
    difficulty_level,
    description,
    node_type,
    conversation_scope,
    engine_type,
    boss_goal,
    field_mission,
    practice_script,
    resolver_practice_script(practice_script) AS practice_script_resuelto
   FROM nodes n;
CREATE OR REPLACE VIEW public.v_severidad_overrides AS
 SELECT n.id AS nodo,
    n.node_type,
    c.value ->> 'id'::text AS criterio,
    c.value ->> 'regla_id'::text AS regla,
    c.value ->> 'severity'::text AS severidad,
    (c.value -> 'severity_override'::text) ->> 'default'::text AS default_regla,
    (c.value -> 'severity_override'::text) ->> 'razon'::text AS razon
   FROM nodes n,
    LATERAL jsonb_array_elements(n.practice_script -> 'failure_criteria'::text) c(value)
  WHERE c.value ? 'severity_override'::text;

-- ===== RLS ACTIVO =====
ALTER TABLE public.archivo_mentalidad_cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.archivo_mentalidad_nodes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.archivo_mentalidad_quiz ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.certificates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.client_archetypes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.client_names ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coach_recommendations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.company_brain_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.company_invites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.company_onboarding_answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.company_pitches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.director_decisions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.disputas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.doctrina ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invite_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.llm_calls ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.manager_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.node_cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.node_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.node_quiz_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.node_skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.nodes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pitch_classifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pitch_feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pitch_sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pitch_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.platform_admins ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.practice_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reglas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.seller_archetype_performance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.seller_arsenal ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.seller_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.seller_memory ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.seller_skill_state ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sellers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.skill_evaluations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tts_calls ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.worlds ENABLE ROW LEVEL SECURITY;
-- Tablas SIN RLS:

-- ===== POLÍTICAS (public) =====
CREATE POLICY "managers all certificates" ON public.certificates AS PERMISSIVE FOR ALL TO authenticated
  USING (((company_id = current_company_id()) AND is_manager()))
  WITH CHECK (((company_id = current_company_id()) AND is_manager()));
CREATE POLICY "seller reads own certs" ON public.certificates AS PERMISSIVE FOR SELECT TO authenticated
  USING (owns_seller(seller_id));
CREATE POLICY "archetypes readable by authenticated" ON public.client_archetypes AS PERMISSIVE FOR SELECT TO authenticated
  USING (true);
CREATE POLICY "names readable by authenticated" ON public.client_names AS PERMISSIVE FOR SELECT TO authenticated
  USING (true);
CREATE POLICY "manager reads coach_recommendations of company" ON public.coach_recommendations AS PERMISSIVE FOR SELECT TO authenticated
  USING ((is_manager() AND (company_id = current_company_id())));
CREATE POLICY "seller reads own coach_recommendations" ON public.coach_recommendations AS PERMISSIVE FOR SELECT TO authenticated
  USING (owns_seller(seller_id));
CREATE POLICY "company members read own company" ON public.companies AS PERMISSIVE FOR SELECT TO authenticated
  USING ((id = current_company_id()));
CREATE POLICY "managers update own company" ON public.companies AS PERMISSIVE FOR UPDATE TO authenticated
  USING (((id = current_company_id()) AND is_manager()));
CREATE POLICY "managers read own company brain versions" ON public.company_brain_versions AS PERMISSIVE FOR SELECT TO authenticated
  USING (((company_id = current_company_id()) AND is_manager()));
CREATE POLICY "managers manage invites" ON public.company_invites AS PERMISSIVE FOR ALL TO authenticated
  USING (((company_id = current_company_id()) AND is_manager()))
  WITH CHECK (((company_id = current_company_id()) AND is_manager()));
CREATE POLICY "managers manage onboarding answers" ON public.company_onboarding_answers AS PERMISSIVE FOR ALL TO authenticated
  USING (((company_id = current_company_id()) AND is_manager()))
  WITH CHECK (((company_id = current_company_id()) AND is_manager()));
CREATE POLICY "Managers manage own company pitches" ON public.company_pitches AS PERMISSIVE FOR ALL TO authenticated
  USING ((is_manager() AND (company_id = current_company_id())))
  WITH CHECK ((is_manager() AND (company_id = current_company_id())));
CREATE POLICY "Members read published pitches" ON public.company_pitches AS PERMISSIVE FOR SELECT TO authenticated
  USING (((status = 'published'::text) AND (company_id = current_company_id())));
CREATE POLICY "managers all daily_usage" ON public.daily_usage AS PERMISSIVE FOR ALL TO authenticated
  USING (((company_id = current_company_id()) AND is_manager()))
  WITH CHECK (((company_id = current_company_id()) AND is_manager()));
CREATE POLICY "seller reads own daily_usage" ON public.daily_usage AS PERMISSIVE FOR SELECT TO authenticated
  USING (owns_seller(seller_id));
CREATE POLICY "seller updates own daily_usage" ON public.daily_usage AS PERMISSIVE FOR UPDATE TO authenticated
  USING (owns_seller(seller_id));
CREATE POLICY "seller writes own daily_usage" ON public.daily_usage AS PERMISSIVE FOR INSERT TO authenticated
  WITH CHECK ((owns_seller(seller_id) AND (company_id = current_company_id())));
CREATE POLICY "director_decisions readable by company" ON public.director_decisions AS PERMISSIVE FOR SELECT TO authenticated
  USING ((EXISTS ( SELECT 1
   FROM practice_sessions ps
  WHERE ((ps.id = director_decisions.session_id) AND (ps.company_id = current_company_id()) AND (is_manager() OR owns_seller(ps.seller_id))))));
CREATE POLICY disputas_admin_lee ON public.disputas AS PERMISSIVE FOR SELECT TO authenticated
  USING ((EXISTS ( SELECT 1
   FROM platform_admins pa
  WHERE (pa.user_id = auth.uid()))));
CREATE POLICY disputas_admin_revisa ON public.disputas AS PERMISSIVE FOR UPDATE TO authenticated
  USING ((EXISTS ( SELECT 1
   FROM platform_admins pa
  WHERE (pa.user_id = auth.uid()))))
  WITH CHECK ((EXISTS ( SELECT 1
   FROM platform_admins pa
  WHERE (pa.user_id = auth.uid()))));
CREATE POLICY doctrina_delete_owner ON public.doctrina AS PERMISSIVE FOR DELETE TO authenticated
  USING ((auth.uid() = '59940ac9-fc91-43b5-a7a5-9555953eb39b'::uuid));
CREATE POLICY doctrina_read_authenticated ON public.doctrina AS PERMISSIVE FOR SELECT TO authenticated
  USING (true);
CREATE POLICY doctrina_update_owner ON public.doctrina AS PERMISSIVE FOR UPDATE TO authenticated
  USING ((auth.uid() = '59940ac9-fc91-43b5-a7a5-9555953eb39b'::uuid))
  WITH CHECK ((auth.uid() = '59940ac9-fc91-43b5-a7a5-9555953eb39b'::uuid));
CREATE POLICY doctrina_write_owner ON public.doctrina AS PERMISSIVE FOR INSERT TO authenticated
  WITH CHECK ((auth.uid() = '59940ac9-fc91-43b5-a7a5-9555953eb39b'::uuid));
CREATE POLICY "no direct access" ON public.invite_attempts AS PERMISSIVE FOR ALL TO authenticated
  USING (false)
  WITH CHECK (false);
CREATE POLICY "llm_calls no client access" ON public.llm_calls AS PERMISSIVE FOR ALL TO anon, authenticated
  USING (false)
  WITH CHECK (false);
CREATE POLICY "managers manage comments" ON public.manager_comments AS PERMISSIVE FOR ALL TO authenticated
  USING (((company_id = current_company_id()) AND is_manager()))
  WITH CHECK (((company_id = current_company_id()) AND is_manager() AND (manager_id = auth.uid())));
CREATE POLICY "seller reads own comments" ON public.manager_comments AS PERMISSIVE FOR SELECT TO authenticated
  USING (owns_seller(seller_id));
CREATE POLICY emilio_can_delete_node_cards ON public.node_cards AS PERMISSIVE FOR DELETE TO authenticated
  USING ((auth.uid() = '59940ac9-fc91-43b5-a7a5-9555953eb39b'::uuid));
CREATE POLICY emilio_can_insert_node_cards ON public.node_cards AS PERMISSIVE FOR INSERT TO authenticated
  WITH CHECK ((auth.uid() = '59940ac9-fc91-43b5-a7a5-9555953eb39b'::uuid));
CREATE POLICY emilio_can_update_node_cards ON public.node_cards AS PERMISSIVE FOR UPDATE TO authenticated
  USING ((auth.uid() = '59940ac9-fc91-43b5-a7a5-9555953eb39b'::uuid))
  WITH CHECK ((auth.uid() = '59940ac9-fc91-43b5-a7a5-9555953eb39b'::uuid));
CREATE POLICY "node_cards readable by authenticated" ON public.node_cards AS PERMISSIVE FOR SELECT TO authenticated
  USING (true);
CREATE POLICY "managers all node_progress" ON public.node_progress AS PERMISSIVE FOR ALL TO authenticated
  USING (((company_id = current_company_id()) AND is_manager()))
  WITH CHECK (((company_id = current_company_id()) AND is_manager()));
CREATE POLICY "seller reads own progress" ON public.node_progress AS PERMISSIVE FOR SELECT TO authenticated
  USING (owns_seller(seller_id));
CREATE POLICY "seller updates own progress" ON public.node_progress AS PERMISSIVE FOR UPDATE TO authenticated
  USING (owns_seller(seller_id));
CREATE POLICY "seller writes own progress" ON public.node_progress AS PERMISSIVE FOR INSERT TO authenticated
  WITH CHECK ((owns_seller(seller_id) AND (company_id = current_company_id())));
CREATE POLICY emilio_can_delete_node_quiz_questions ON public.node_quiz_questions AS PERMISSIVE FOR DELETE TO authenticated
  USING ((auth.uid() = '59940ac9-fc91-43b5-a7a5-9555953eb39b'::uuid));
CREATE POLICY emilio_can_insert_node_quiz_questions ON public.node_quiz_questions AS PERMISSIVE FOR INSERT TO authenticated
  WITH CHECK ((auth.uid() = '59940ac9-fc91-43b5-a7a5-9555953eb39b'::uuid));
CREATE POLICY emilio_can_update_node_quiz_questions ON public.node_quiz_questions AS PERMISSIVE FOR UPDATE TO authenticated
  USING ((auth.uid() = '59940ac9-fc91-43b5-a7a5-9555953eb39b'::uuid))
  WITH CHECK ((auth.uid() = '59940ac9-fc91-43b5-a7a5-9555953eb39b'::uuid));
CREATE POLICY "node_quiz_questions readable by authenticated" ON public.node_quiz_questions AS PERMISSIVE FOR SELECT TO authenticated
  USING (true);
CREATE POLICY emilio_can_delete_node_skills ON public.node_skills AS PERMISSIVE FOR DELETE TO authenticated
  USING ((auth.uid() = '59940ac9-fc91-43b5-a7a5-9555953eb39b'::uuid));
CREATE POLICY emilio_can_insert_node_skills ON public.node_skills AS PERMISSIVE FOR INSERT TO authenticated
  WITH CHECK ((auth.uid() = '59940ac9-fc91-43b5-a7a5-9555953eb39b'::uuid));
CREATE POLICY emilio_can_update_node_skills ON public.node_skills AS PERMISSIVE FOR UPDATE TO authenticated
  USING ((auth.uid() = '59940ac9-fc91-43b5-a7a5-9555953eb39b'::uuid))
  WITH CHECK ((auth.uid() = '59940ac9-fc91-43b5-a7a5-9555953eb39b'::uuid));
CREATE POLICY "node_skills readable by authenticated" ON public.node_skills AS PERMISSIVE FOR SELECT TO authenticated
  USING (true);
CREATE POLICY emilio_can_delete_nodes ON public.nodes AS PERMISSIVE FOR DELETE TO authenticated
  USING ((auth.uid() = '59940ac9-fc91-43b5-a7a5-9555953eb39b'::uuid));
CREATE POLICY emilio_can_insert_nodes ON public.nodes AS PERMISSIVE FOR INSERT TO authenticated
  WITH CHECK ((auth.uid() = '59940ac9-fc91-43b5-a7a5-9555953eb39b'::uuid));
CREATE POLICY emilio_can_update_nodes ON public.nodes AS PERMISSIVE FOR UPDATE TO authenticated
  USING ((auth.uid() = '59940ac9-fc91-43b5-a7a5-9555953eb39b'::uuid))
  WITH CHECK ((auth.uid() = '59940ac9-fc91-43b5-a7a5-9555953eb39b'::uuid));
CREATE POLICY "nodes readable by authenticated" ON public.nodes AS PERMISSIVE FOR SELECT TO authenticated
  USING (true);
CREATE POLICY "managers all classifications" ON public.pitch_classifications AS PERMISSIVE FOR ALL TO authenticated
  USING (((company_id = current_company_id()) AND is_manager()))
  WITH CHECK (((company_id = current_company_id()) AND is_manager()));
CREATE POLICY "seller inserts own classifications" ON public.pitch_classifications AS PERMISSIVE FOR INSERT TO authenticated
  WITH CHECK (((company_id = current_company_id()) AND (EXISTS ( SELECT 1
   FROM practice_sessions s
  WHERE ((s.id = pitch_classifications.session_id) AND owns_seller(s.seller_id))))));
CREATE POLICY "seller reads own classifications" ON public.pitch_classifications AS PERMISSIVE FOR SELECT TO authenticated
  USING ((EXISTS ( SELECT 1
   FROM practice_sessions s
  WHERE ((s.id = pitch_classifications.session_id) AND owns_seller(s.seller_id)))));
CREATE POLICY "Managers manage own pitch feedback" ON public.pitch_feedback AS PERMISSIVE FOR ALL TO authenticated
  USING ((is_manager() AND (EXISTS ( SELECT 1
   FROM company_pitches p
  WHERE ((p.id = pitch_feedback.pitch_id) AND (p.company_id = current_company_id()))))))
  WITH CHECK ((is_manager() AND (EXISTS ( SELECT 1
   FROM company_pitches p
  WHERE ((p.id = pitch_feedback.pitch_id) AND (p.company_id = current_company_id()))))));
CREATE POLICY "Managers manage own pitch sections" ON public.pitch_sections AS PERMISSIVE FOR ALL TO authenticated
  USING (((EXISTS ( SELECT 1
   FROM company_pitches p
  WHERE ((p.id = pitch_sections.pitch_id) AND (p.company_id = current_company_id())))) AND is_manager()))
  WITH CHECK (((EXISTS ( SELECT 1
   FROM company_pitches p
  WHERE ((p.id = pitch_sections.pitch_id) AND (p.company_id = current_company_id())))) AND is_manager()));
CREATE POLICY "Members read published pitch sections" ON public.pitch_sections AS PERMISSIVE FOR SELECT TO authenticated
  USING ((EXISTS ( SELECT 1
   FROM company_pitches p
  WHERE ((p.id = pitch_sections.pitch_id) AND (p.company_id = current_company_id()) AND (p.status = 'published'::text)))));
CREATE POLICY "Managers manage own pitch versions" ON public.pitch_versions AS PERMISSIVE FOR ALL TO authenticated
  USING ((is_manager() AND (EXISTS ( SELECT 1
   FROM company_pitches p
  WHERE ((p.id = pitch_versions.pitch_id) AND (p.company_id = current_company_id()))))))
  WITH CHECK ((is_manager() AND (EXISTS ( SELECT 1
   FROM company_pitches p
  WHERE ((p.id = pitch_versions.pitch_id) AND (p.company_id = current_company_id()))))));
CREATE POLICY platform_admins_se_ve_a_si_mismo ON public.platform_admins AS PERMISSIVE FOR SELECT TO authenticated
  USING ((user_id = auth.uid()));
CREATE POLICY "managers all sessions" ON public.practice_sessions AS PERMISSIVE FOR ALL TO authenticated
  USING (((company_id = current_company_id()) AND is_manager()))
  WITH CHECK (((company_id = current_company_id()) AND is_manager()));
CREATE POLICY "seller inserts own sessions" ON public.practice_sessions AS PERMISSIVE FOR INSERT TO authenticated
  WITH CHECK ((owns_seller(seller_id) AND (company_id = current_company_id())));
CREATE POLICY "seller reads own sessions" ON public.practice_sessions AS PERMISSIVE FOR SELECT TO authenticated
  USING (owns_seller(seller_id));
CREATE POLICY "seller updates own sessions" ON public.practice_sessions AS PERMISSIVE FOR UPDATE TO authenticated
  USING (owns_seller(seller_id));
CREATE POLICY "insert own profile" ON public.profiles AS PERMISSIVE FOR INSERT TO authenticated
  WITH CHECK ((id = auth.uid()));
CREATE POLICY "managers read company profiles" ON public.profiles AS PERMISSIVE FOR SELECT TO authenticated
  USING (((company_id = current_company_id()) AND is_manager()));
CREATE POLICY "read own profile" ON public.profiles AS PERMISSIVE FOR SELECT TO authenticated
  USING ((id = auth.uid()));
CREATE POLICY "update own profile" ON public.profiles AS PERMISSIVE FOR UPDATE TO authenticated
  USING ((id = auth.uid()));
CREATE POLICY reglas_lectura ON public.reglas AS PERMISSIVE FOR SELECT TO public
  USING (true);
CREATE POLICY "managers all archetype performance" ON public.seller_archetype_performance AS PERMISSIVE FOR ALL TO authenticated
  USING (((company_id = current_company_id()) AND is_manager()))
  WITH CHECK (((company_id = current_company_id()) AND is_manager()));
CREATE POLICY "seller reads own performance" ON public.seller_archetype_performance AS PERMISSIVE FOR SELECT TO authenticated
  USING (owns_seller(seller_id));
CREATE POLICY "seller updates own performance" ON public.seller_archetype_performance AS PERMISSIVE FOR UPDATE TO authenticated
  USING (owns_seller(seller_id));
CREATE POLICY "seller writes own performance" ON public.seller_archetype_performance AS PERMISSIVE FOR INSERT TO authenticated
  WITH CHECK ((owns_seller(seller_id) AND (company_id = current_company_id())));
CREATE POLICY "managers all arsenal" ON public.seller_arsenal AS PERMISSIVE FOR ALL TO authenticated
  USING (((company_id = current_company_id()) AND is_manager()))
  WITH CHECK (((company_id = current_company_id()) AND is_manager()));
CREATE POLICY "seller reads own arsenal" ON public.seller_arsenal AS PERMISSIVE FOR SELECT TO authenticated
  USING (owns_seller(seller_id));
CREATE POLICY "seller updates own arsenal" ON public.seller_arsenal AS PERMISSIVE FOR UPDATE TO authenticated
  USING (owns_seller(seller_id));
CREATE POLICY "seller writes own arsenal" ON public.seller_arsenal AS PERMISSIVE FOR INSERT TO authenticated
  WITH CHECK ((owns_seller(seller_id) AND (company_id = current_company_id())));
CREATE POLICY "Sellers can read own events" ON public.seller_events AS PERMISSIVE FOR SELECT TO authenticated
  USING ((EXISTS ( SELECT 1
   FROM sellers s
  WHERE ((s.id = seller_events.seller_id) AND (s.profile_id = auth.uid())))));
CREATE POLICY "managers read company events" ON public.seller_events AS PERMISSIVE FOR SELECT TO authenticated
  USING ((EXISTS ( SELECT 1
   FROM sellers s
  WHERE ((s.id = seller_events.seller_id) AND (s.company_id = current_company_id()) AND is_manager()))));
CREATE POLICY "managers all seller_memory" ON public.seller_memory AS PERMISSIVE FOR ALL TO authenticated
  USING (((company_id = current_company_id()) AND is_manager()))
  WITH CHECK (((company_id = current_company_id()) AND is_manager()));
CREATE POLICY "seller reads own memory" ON public.seller_memory AS PERMISSIVE FOR SELECT TO authenticated
  USING (owns_seller(seller_id));
CREATE POLICY "managers all skill state" ON public.seller_skill_state AS PERMISSIVE FOR ALL TO authenticated
  USING (((company_id = current_company_id()) AND is_manager()))
  WITH CHECK (((company_id = current_company_id()) AND is_manager()));
CREATE POLICY "seller reads own skill state" ON public.seller_skill_state AS PERMISSIVE FOR SELECT TO authenticated
  USING (owns_seller(seller_id));
CREATE POLICY "seller updates own skill state" ON public.seller_skill_state AS PERMISSIVE FOR UPDATE TO authenticated
  USING (owns_seller(seller_id));
CREATE POLICY "seller writes own skill state" ON public.seller_skill_state AS PERMISSIVE FOR INSERT TO authenticated
  WITH CHECK ((owns_seller(seller_id) AND (company_id = current_company_id())));
CREATE POLICY "managers manage sellers" ON public.sellers AS PERMISSIVE FOR ALL TO authenticated
  USING (((company_id = current_company_id()) AND is_manager()))
  WITH CHECK (((company_id = current_company_id()) AND is_manager()));
CREATE POLICY "seller reads own row" ON public.sellers AS PERMISSIVE FOR SELECT TO authenticated
  USING ((profile_id = auth.uid()));
CREATE POLICY "seller updates own row" ON public.sellers AS PERMISSIVE FOR UPDATE TO authenticated
  USING ((profile_id = auth.uid()));
CREATE POLICY "managers all evaluations" ON public.skill_evaluations AS PERMISSIVE FOR ALL TO authenticated
  USING (((company_id = current_company_id()) AND is_manager()))
  WITH CHECK (((company_id = current_company_id()) AND is_manager()));
CREATE POLICY "seller inserts own evaluations" ON public.skill_evaluations AS PERMISSIVE FOR INSERT TO authenticated
  WITH CHECK ((owns_seller(seller_id) AND (company_id = current_company_id())));
CREATE POLICY "seller reads own evaluations" ON public.skill_evaluations AS PERMISSIVE FOR SELECT TO authenticated
  USING (owns_seller(seller_id));
CREATE POLICY emilio_can_delete_skills ON public.skills AS PERMISSIVE FOR DELETE TO authenticated
  USING ((auth.uid() = '59940ac9-fc91-43b5-a7a5-9555953eb39b'::uuid));
CREATE POLICY emilio_can_insert_skills ON public.skills AS PERMISSIVE FOR INSERT TO authenticated
  WITH CHECK ((auth.uid() = '59940ac9-fc91-43b5-a7a5-9555953eb39b'::uuid));
CREATE POLICY emilio_can_update_skills ON public.skills AS PERMISSIVE FOR UPDATE TO authenticated
  USING ((auth.uid() = '59940ac9-fc91-43b5-a7a5-9555953eb39b'::uuid))
  WITH CHECK ((auth.uid() = '59940ac9-fc91-43b5-a7a5-9555953eb39b'::uuid));
CREATE POLICY "skills readable by authenticated" ON public.skills AS PERMISSIVE FOR SELECT TO authenticated
  USING (true);
CREATE POLICY "managers read own company tts" ON public.tts_calls AS PERMISSIVE FOR SELECT TO authenticated
  USING ((is_manager() AND (company_id = current_company_id())));
CREATE POLICY emilio_can_delete_worlds ON public.worlds AS PERMISSIVE FOR DELETE TO authenticated
  USING ((auth.uid() = '59940ac9-fc91-43b5-a7a5-9555953eb39b'::uuid));
CREATE POLICY emilio_can_update_worlds ON public.worlds AS PERMISSIVE FOR UPDATE TO authenticated
  USING ((auth.uid() = '59940ac9-fc91-43b5-a7a5-9555953eb39b'::uuid))
  WITH CHECK ((auth.uid() = '59940ac9-fc91-43b5-a7a5-9555953eb39b'::uuid));
CREATE POLICY "worlds readable by authenticated" ON public.worlds AS PERMISSIVE FOR SELECT TO authenticated
  USING (true);

-- ===== PERMISOS DE TABLAS (anon, authenticated, service_role) =====

-- ===== PERMISOS DEL ESQUEMA =====
GRANT USAGE ON SCHEMA public TO anon;
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT USAGE ON SCHEMA public TO service_role;

-- ===== PERMISOS DE EJECUCIÓN DE FUNCIONES =====
REVOKE ALL ON FUNCTION public."current_role"() FROM PUBLIC;
REVOKE ALL ON FUNCTION public._company_prefix(_name text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public._gen_invite_suffix() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.apply_invite_code(_code text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.consume_credits(_seller_id uuid, _session_type text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.convert_personal_to_company(_name text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.create_company_for_manager(_name text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.create_personal_company() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.create_team_company(_name text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.current_company_id() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.generate_company_invite() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.generate_company_invite(_hours integer) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.get_active_company_invite() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.is_manager() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.join_company_with_code(_code text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.llm_call_usd(_model text, _input integer, _output integer, _cached integer, _cache_write integer) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.llm_usage_report(_from timestamp with time zone, _to timestamp with time zone) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.owns_seller(_seller_id uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.register_invite_failed_attempt(_code text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.revoke_company_invite() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.save_onboarding_answer(_block_number integer, _question_id text, _question_text text, _answer text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.select_archetype_for_session(_seller_id uuid, _world_id integer, _node_id text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.set_seller_active(_seller_id uuid, _active boolean) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.update_company_brain(_brain jsonb) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.update_updated_at_column() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.usage_cost_report(_from timestamp with time zone, _to timestamp with time zone) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.validate_invite_code(_code text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public."current_role"() TO authenticated;
GRANT EXECUTE ON FUNCTION public."current_role"() TO service_role;
GRANT EXECUTE ON FUNCTION public._company_prefix(_name text) TO anon;
GRANT EXECUTE ON FUNCTION public._company_prefix(_name text) TO authenticated;
GRANT EXECUTE ON FUNCTION public._company_prefix(_name text) TO service_role;
GRANT EXECUTE ON FUNCTION public._gen_invite_suffix() TO anon;
GRANT EXECUTE ON FUNCTION public._gen_invite_suffix() TO authenticated;
GRANT EXECUTE ON FUNCTION public._gen_invite_suffix() TO service_role;
GRANT EXECUTE ON FUNCTION public.apply_invite_code(_code text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.apply_invite_code(_code text) TO service_role;
GRANT EXECUTE ON FUNCTION public.consume_credits(_seller_id uuid, _session_type text) TO service_role;
GRANT EXECUTE ON FUNCTION public.convert_personal_to_company(_name text) TO anon;
GRANT EXECUTE ON FUNCTION public.convert_personal_to_company(_name text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.convert_personal_to_company(_name text) TO service_role;
GRANT EXECUTE ON FUNCTION public.create_company_for_manager(_name text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_company_for_manager(_name text) TO service_role;
GRANT EXECUTE ON FUNCTION public.create_personal_company() TO anon;
GRANT EXECUTE ON FUNCTION public.create_personal_company() TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_personal_company() TO service_role;
GRANT EXECUTE ON FUNCTION public.create_team_company(_name text) TO anon;
GRANT EXECUTE ON FUNCTION public.create_team_company(_name text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_team_company(_name text) TO service_role;
GRANT EXECUTE ON FUNCTION public.current_company_id() TO authenticated;
GRANT EXECUTE ON FUNCTION public.current_company_id() TO service_role;
GRANT EXECUTE ON FUNCTION public.ensure_manager_seller_row() TO PUBLIC;
GRANT EXECUTE ON FUNCTION public.ensure_manager_seller_row() TO anon;
GRANT EXECUTE ON FUNCTION public.ensure_manager_seller_row() TO authenticated;
GRANT EXECUTE ON FUNCTION public.ensure_manager_seller_row() TO service_role;
GRANT EXECUTE ON FUNCTION public.generate_company_invite() TO authenticated;
GRANT EXECUTE ON FUNCTION public.generate_company_invite() TO service_role;
GRANT EXECUTE ON FUNCTION public.generate_company_invite(_hours integer) TO anon;
GRANT EXECUTE ON FUNCTION public.generate_company_invite(_hours integer) TO authenticated;
GRANT EXECUTE ON FUNCTION public.generate_company_invite(_hours integer) TO service_role;
GRANT EXECUTE ON FUNCTION public.get_active_company_invite() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_active_company_invite() TO service_role;
GRANT EXECUTE ON FUNCTION public.get_current_mastery(_mastery_score numeric, _last_practiced_at timestamp with time zone) TO PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_current_mastery(_mastery_score numeric, _last_practiced_at timestamp with time zone) TO anon;
GRANT EXECUTE ON FUNCTION public.get_current_mastery(_mastery_score numeric, _last_practiced_at timestamp with time zone) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_current_mastery(_mastery_score numeric, _last_practiced_at timestamp with time zone) TO service_role;
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO service_role;
GRANT EXECUTE ON FUNCTION public.is_manager() TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_manager() TO service_role;
GRANT EXECUTE ON FUNCTION public.join_company_with_code(_code text) TO anon;
GRANT EXECUTE ON FUNCTION public.join_company_with_code(_code text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.join_company_with_code(_code text) TO service_role;
GRANT EXECUTE ON FUNCTION public.llm_call_usd(_model text, _input integer, _output integer, _cached integer, _cache_write integer) TO authenticated;
GRANT EXECUTE ON FUNCTION public.llm_call_usd(_model text, _input integer, _output integer, _cached integer, _cache_write integer) TO service_role;
GRANT EXECUTE ON FUNCTION public.llm_usage_report(_from timestamp with time zone, _to timestamp with time zone) TO anon;
GRANT EXECUTE ON FUNCTION public.llm_usage_report(_from timestamp with time zone, _to timestamp with time zone) TO authenticated;
GRANT EXECUTE ON FUNCTION public.llm_usage_report(_from timestamp with time zone, _to timestamp with time zone) TO service_role;
GRANT EXECUTE ON FUNCTION public.owns_seller(_seller_id uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.owns_seller(_seller_id uuid) TO service_role;
GRANT EXECUTE ON FUNCTION public.register_invite_failed_attempt(_code text) TO service_role;
GRANT EXECUTE ON FUNCTION public.resolver_practice_script(ps jsonb) TO PUBLIC;
GRANT EXECUTE ON FUNCTION public.resolver_practice_script(ps jsonb) TO anon;
GRANT EXECUTE ON FUNCTION public.resolver_practice_script(ps jsonb) TO authenticated;
GRANT EXECUTE ON FUNCTION public.resolver_practice_script(ps jsonb) TO service_role;
GRANT EXECUTE ON FUNCTION public.revoke_company_invite() TO anon;
GRANT EXECUTE ON FUNCTION public.revoke_company_invite() TO authenticated;
GRANT EXECUTE ON FUNCTION public.revoke_company_invite() TO service_role;
GRANT EXECUTE ON FUNCTION public.save_onboarding_answer(_block_number integer, _question_id text, _question_text text, _answer text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.save_onboarding_answer(_block_number integer, _question_id text, _question_text text, _answer text) TO service_role;
GRANT EXECUTE ON FUNCTION public.select_archetype_for_session(_seller_id uuid, _world_id integer, _node_id text) TO service_role;
GRANT EXECUTE ON FUNCTION public.set_seller_active(_seller_id uuid, _active boolean) TO anon;
GRANT EXECUTE ON FUNCTION public.set_seller_active(_seller_id uuid, _active boolean) TO authenticated;
GRANT EXECUTE ON FUNCTION public.set_seller_active(_seller_id uuid, _active boolean) TO service_role;
GRANT EXECUTE ON FUNCTION public.update_company_brain(_brain jsonb) TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_company_brain(_brain jsonb) TO service_role;
GRANT EXECUTE ON FUNCTION public.update_company_identity(_name text, _industry text, _logo_url text) TO PUBLIC;
GRANT EXECUTE ON FUNCTION public.update_company_identity(_name text, _industry text, _logo_url text) TO anon;
GRANT EXECUTE ON FUNCTION public.update_company_identity(_name text, _industry text, _logo_url text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_company_identity(_name text, _industry text, _logo_url text) TO service_role;
GRANT EXECUTE ON FUNCTION public.update_updated_at_column() TO service_role;
GRANT EXECUTE ON FUNCTION public.usage_cost_report(_from timestamp with time zone, _to timestamp with time zone) TO authenticated;
GRANT EXECUTE ON FUNCTION public.usage_cost_report(_from timestamp with time zone, _to timestamp with time zone) TO service_role;
GRANT EXECUTE ON FUNCTION public.validar_practice_script() TO PUBLIC;
GRANT EXECUTE ON FUNCTION public.validar_practice_script() TO anon;
GRANT EXECUTE ON FUNCTION public.validar_practice_script() TO authenticated;
GRANT EXECUTE ON FUNCTION public.validar_practice_script() TO service_role;
GRANT EXECUTE ON FUNCTION public.validate_invite_code(_code text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.validate_invite_code(_code text) TO service_role;

-- ===== ALMACENAMIENTO: BUCKETS =====
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types) VALUES ('branding', 'branding', f, NULL, NULL) ON CONFLICT (id) DO NOTHING;
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types) VALUES ('practice-audio', 'practice-audio', f, NULL, NULL) ON CONFLICT (id) DO NOTHING;
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types) VALUES ('tts-cache', 'tts-cache', f, 10485760, NULL) ON CONFLICT (id) DO NOTHING;

-- ===== ALMACENAMIENTO: POLÍTICAS =====
CREATE POLICY branding_delete_own_folder ON storage.objects AS PERMISSIVE FOR DELETE TO authenticated
  USING (((bucket_id = 'branding'::text) AND ((storage.foldername(name))[1] = (auth.uid())::text)));
CREATE POLICY branding_insert_own_folder ON storage.objects AS PERMISSIVE FOR INSERT TO authenticated
  WITH CHECK (((bucket_id = 'branding'::text) AND ((storage.foldername(name))[1] = (auth.uid())::text)));
CREATE POLICY branding_select_authenticated ON storage.objects AS PERMISSIVE FOR SELECT TO authenticated
  USING ((bucket_id = 'branding'::text));
CREATE POLICY branding_update_own_folder ON storage.objects AS PERMISSIVE FOR UPDATE TO authenticated
  USING (((bucket_id = 'branding'::text) AND ((storage.foldername(name))[1] = (auth.uid())::text)))
  WITH CHECK (((bucket_id = 'branding'::text) AND ((storage.foldername(name))[1] = (auth.uid())::text)));
CREATE POLICY practice_audio_delete_own ON storage.objects AS PERMISSIVE FOR DELETE TO authenticated
  USING (((bucket_id = 'practice-audio'::text) AND (EXISTS ( SELECT 1
   FROM sellers s
  WHERE ((s.profile_id = auth.uid()) AND ((s.id)::text = (storage.foldername(objects.name))[1]))))));
CREATE POLICY practice_audio_insert_own ON storage.objects AS PERMISSIVE FOR INSERT TO authenticated
  WITH CHECK (((bucket_id = 'practice-audio'::text) AND (EXISTS ( SELECT 1
   FROM sellers s
  WHERE ((s.profile_id = auth.uid()) AND ((s.id)::text = (storage.foldername(objects.name))[1]))))));
CREATE POLICY practice_audio_select_manager ON storage.objects AS PERMISSIVE FOR SELECT TO public
  USING (((bucket_id = 'practice-audio'::text) AND is_manager() AND (EXISTS ( SELECT 1
   FROM sellers s
  WHERE (((s.id)::text = (storage.foldername(objects.name))[1]) AND (s.company_id = current_company_id()))))));
CREATE POLICY practice_audio_select_own ON storage.objects AS PERMISSIVE FOR SELECT TO authenticated
  USING (((bucket_id = 'practice-audio'::text) AND (EXISTS ( SELECT 1
   FROM sellers s
  WHERE ((s.profile_id = auth.uid()) AND ((s.id)::text = (storage.foldername(objects.name))[1]))))));
CREATE POLICY practice_audio_update_own ON storage.objects AS PERMISSIVE FOR UPDATE TO authenticated
  USING (((bucket_id = 'practice-audio'::text) AND (EXISTS ( SELECT 1
   FROM sellers s
  WHERE ((s.profile_id = auth.uid()) AND ((s.id)::text = (storage.foldername(objects.name))[1]))))))
  WITH CHECK (((bucket_id = 'practice-audio'::text) AND (EXISTS ( SELECT 1
   FROM sellers s
  WHERE ((s.profile_id = auth.uid()) AND ((s.id)::text = (storage.foldername(objects.name))[1]))))));

-- ===== TAREAS PROGRAMADAS (cron) =====
-- La extensión pg_cron no está instalada: no hay tareas programadas.

-- ===== WEBHOOKS DE BASE =====
-- No hay webhooks de base (ningún trigger llama a supabase_functions ni a net).

-- FIN
