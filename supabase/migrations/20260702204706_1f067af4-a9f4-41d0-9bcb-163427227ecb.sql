
-- ============================================================
-- Part A: seller_skill_state — rename/retype to spec, drop legacy
-- ============================================================

-- 1) Rename columns to spec names
ALTER TABLE public.seller_skill_state RENAME COLUMN current_score       TO mastery_score;
ALTER TABLE public.seller_skill_state RENAME COLUMN last_evaluated_at   TO last_practiced_at;
ALTER TABLE public.seller_skill_state RENAME COLUMN evaluations_count   TO evidence_count;
ALTER TABLE public.seller_skill_state RENAME COLUMN recurring_errors    TO recurring_failures;

-- 2) Retype mastery_score integer -> numeric(5,2)
ALTER TABLE public.seller_skill_state
  ALTER COLUMN mastery_score TYPE numeric(5,2) USING mastery_score::numeric(5,2);

-- 3) recurring_failures: was jsonb array; spec wants jsonb object {} per-flag count
ALTER TABLE public.seller_skill_state
  ALTER COLUMN recurring_failures SET DEFAULT '{}'::jsonb;
UPDATE public.seller_skill_state
  SET recurring_failures = '{}'::jsonb
  WHERE recurring_failures IS NULL
     OR jsonb_typeof(recurring_failures) <> 'object';

-- 4) Drop the 10 legacy columns (verified: zero frontend usage)
ALTER TABLE public.seller_skill_state
  DROP COLUMN IF EXISTS trend,
  DROP COLUMN IF EXISTS mastered,
  DROP COLUMN IF EXISTS mastered_at,
  DROP COLUMN IF EXISTS reinforcement_needed,
  DROP COLUMN IF EXISTS reinforcement_reason,
  DROP COLUMN IF EXISTS unlocked_concepts,
  DROP COLUMN IF EXISTS last_evidence,
  DROP COLUMN IF EXISTS xp_in_skill;

-- ============================================================
-- Part B: node_cards.audience — column + backfill of 4 legacy rows
-- ============================================================

ALTER TABLE public.node_cards
  ADD COLUMN IF NOT EXISTS audience text NULL;

-- Backfill: for every dynamic card whose body starts with "experience_level:",
-- extract the level into audience, promote flip_back_text into body,
-- and null out flip_back_text (matches what the frontend used to do at read time).
UPDATE public.node_cards
SET
  audience        = split_part(substring(body from '^experience_level:(.*)$'), ':', 1),
  body            = COALESCE(flip_back_text, ''),
  flip_back_text  = NULL
WHERE body LIKE 'experience_level:%';
