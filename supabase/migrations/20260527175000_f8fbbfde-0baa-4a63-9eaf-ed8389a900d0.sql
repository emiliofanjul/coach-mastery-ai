
-- ─────────────────────────────────────────────────────────────
-- skills (catálogo oficial)
-- ─────────────────────────────────────────────────────────────
CREATE TABLE public.skills (
  id                         text PRIMARY KEY,
  code                       text NOT NULL UNIQUE,
  name                       text NOT NULL,
  short_description          text,
  category                   text NOT NULL,
  world_id_introduced        integer NOT NULL,
  level_required             text NOT NULL DEFAULT 'rookie',
  parent_skill_id            text REFERENCES public.skills(id) ON DELETE SET NULL,
  mastery_threshold          integer NOT NULL DEFAULT 80,
  reinforcement_threshold    integer NOT NULL DEFAULT 50,
  default_allowed_concepts   jsonb NOT NULL DEFAULT '[]'::jsonb,
  default_forbidden_concepts jsonb NOT NULL DEFAULT '[]'::jsonb,
  success_signals            jsonb NOT NULL DEFAULT '[]'::jsonb,
  failure_signals            jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at                 timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.skills TO authenticated;
GRANT ALL    ON public.skills TO service_role;

ALTER TABLE public.skills ENABLE ROW LEVEL SECURITY;

CREATE POLICY "skills readable by authenticated"
  ON public.skills FOR SELECT TO authenticated USING (true);

-- ─────────────────────────────────────────────────────────────
-- node_skills
-- ─────────────────────────────────────────────────────────────
CREATE TABLE public.node_skills (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  node_id     text NOT NULL,
  skill_id    text NOT NULL REFERENCES public.skills(id) ON DELETE CASCADE,
  relation    text NOT NULL,
  weight      numeric NOT NULL DEFAULT 1.0 CHECK (weight >= 0 AND weight <= 1),
  is_primary  boolean NOT NULL DEFAULT false,
  created_at  timestamptz NOT NULL DEFAULT now(),
  UNIQUE (node_id, skill_id)
);

CREATE UNIQUE INDEX node_skills_one_primary_per_node
  ON public.node_skills (node_id) WHERE is_primary = true;

CREATE INDEX node_skills_skill_idx ON public.node_skills (skill_id);

GRANT SELECT ON public.node_skills TO authenticated;
GRANT ALL    ON public.node_skills TO service_role;

ALTER TABLE public.node_skills ENABLE ROW LEVEL SECURITY;

CREATE POLICY "node_skills readable by authenticated"
  ON public.node_skills FOR SELECT TO authenticated USING (true);

-- ─────────────────────────────────────────────────────────────
-- seller_skill_state
-- ─────────────────────────────────────────────────────────────
CREATE TABLE public.seller_skill_state (
  id                     uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id              uuid NOT NULL,
  company_id             uuid NOT NULL,
  skill_id               text NOT NULL REFERENCES public.skills(id) ON DELETE CASCADE,
  current_score          integer NOT NULL DEFAULT 0 CHECK (current_score BETWEEN 0 AND 100),
  trend                  text NOT NULL DEFAULT 'stable',
  mastered               boolean NOT NULL DEFAULT false,
  mastered_at            timestamptz,
  reinforcement_needed   boolean NOT NULL DEFAULT false,
  reinforcement_reason   text,
  recurring_errors       jsonb NOT NULL DEFAULT '[]'::jsonb,
  unlocked_concepts      jsonb NOT NULL DEFAULT '[]'::jsonb,
  last_evidence          jsonb,
  evaluations_count      integer NOT NULL DEFAULT 0,
  last_evaluated_at      timestamptz,
  xp_in_skill            integer NOT NULL DEFAULT 0,
  updated_at             timestamptz NOT NULL DEFAULT now(),
  created_at             timestamptz NOT NULL DEFAULT now(),
  UNIQUE (seller_id, skill_id)
);

CREATE INDEX seller_skill_state_seller_idx  ON public.seller_skill_state (seller_id);
CREATE INDEX seller_skill_state_company_idx ON public.seller_skill_state (company_id);

GRANT SELECT, INSERT, UPDATE ON public.seller_skill_state TO authenticated;
GRANT ALL ON public.seller_skill_state TO service_role;

ALTER TABLE public.seller_skill_state ENABLE ROW LEVEL SECURITY;

CREATE POLICY "seller reads own skill state"
  ON public.seller_skill_state FOR SELECT TO authenticated
  USING (public.owns_seller(seller_id));

CREATE POLICY "seller writes own skill state"
  ON public.seller_skill_state FOR INSERT TO authenticated
  WITH CHECK (public.owns_seller(seller_id) AND company_id = public.current_company_id());

CREATE POLICY "seller updates own skill state"
  ON public.seller_skill_state FOR UPDATE TO authenticated
  USING (public.owns_seller(seller_id));

CREATE POLICY "managers all skill state"
  ON public.seller_skill_state FOR ALL TO authenticated
  USING (company_id = public.current_company_id() AND public.is_manager())
  WITH CHECK (company_id = public.current_company_id() AND public.is_manager());

-- ─────────────────────────────────────────────────────────────
-- skill_evaluations
-- ─────────────────────────────────────────────────────────────
CREATE TABLE public.skill_evaluations (
  id                 uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id         uuid NOT NULL,
  seller_id          uuid NOT NULL,
  company_id         uuid NOT NULL,
  node_id            text,
  skill_id           text NOT NULL REFERENCES public.skills(id) ON DELETE CASCADE,
  score              integer NOT NULL CHECK (score BETWEEN 0 AND 100),
  verdict            text NOT NULL,
  success_hits       jsonb NOT NULL DEFAULT '[]'::jsonb,
  failure_hits       jsonb NOT NULL DEFAULT '[]'::jsonb,
  notes_for_seller   text,
  notes_internal     text,
  evaluator_version  text NOT NULL DEFAULT 'none',
  created_at         timestamptz NOT NULL DEFAULT now(),
  UNIQUE (session_id, skill_id)
);

CREATE INDEX skill_evaluations_session_idx ON public.skill_evaluations (session_id);
CREATE INDEX skill_evaluations_seller_idx  ON public.skill_evaluations (seller_id);
CREATE INDEX skill_evaluations_skill_idx   ON public.skill_evaluations (skill_id);

GRANT SELECT, INSERT ON public.skill_evaluations TO authenticated;
GRANT ALL ON public.skill_evaluations TO service_role;

ALTER TABLE public.skill_evaluations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "seller reads own evaluations"
  ON public.skill_evaluations FOR SELECT TO authenticated
  USING (public.owns_seller(seller_id));

CREATE POLICY "seller inserts own evaluations"
  ON public.skill_evaluations FOR INSERT TO authenticated
  WITH CHECK (public.owns_seller(seller_id) AND company_id = public.current_company_id());

CREATE POLICY "managers all evaluations"
  ON public.skill_evaluations FOR ALL TO authenticated
  USING (company_id = public.current_company_id() AND public.is_manager())
  WITH CHECK (company_id = public.current_company_id() AND public.is_manager());

-- ─────────────────────────────────────────────────────────────
-- update_updated_at_column (idempotente) + trigger
-- ─────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER seller_skill_state_set_updated_at
  BEFORE UPDATE ON public.seller_skill_state
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
