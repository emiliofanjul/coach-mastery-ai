DROP INDEX IF EXISTS public.node_skills_one_primary_per_node;
CREATE UNIQUE INDEX node_skills_one_primary_per_skill
  ON public.node_skills (skill_id) WHERE (is_primary = true);