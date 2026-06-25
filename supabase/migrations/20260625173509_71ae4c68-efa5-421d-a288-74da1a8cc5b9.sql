BEGIN;

ALTER TABLE public.node_skills
  DROP CONSTRAINT node_skills_skill_id_fkey,
  ADD CONSTRAINT node_skills_skill_id_fkey
    FOREIGN KEY (skill_id) REFERENCES public.skills(id)
    ON UPDATE CASCADE ON DELETE CASCADE;

ALTER TABLE public.seller_skill_state
  DROP CONSTRAINT seller_skill_state_skill_id_fkey,
  ADD CONSTRAINT seller_skill_state_skill_id_fkey
    FOREIGN KEY (skill_id) REFERENCES public.skills(id)
    ON UPDATE CASCADE ON DELETE CASCADE;

ALTER TABLE public.skill_evaluations
  DROP CONSTRAINT skill_evaluations_skill_id_fkey,
  ADD CONSTRAINT skill_evaluations_skill_id_fkey
    FOREIGN KEY (skill_id) REFERENCES public.skills(id)
    ON UPDATE CASCADE ON DELETE CASCADE;

ALTER TABLE public.skills
  DROP CONSTRAINT skills_parent_skill_id_fkey,
  ADD CONSTRAINT skills_parent_skill_id_fkey
    FOREIGN KEY (parent_skill_id) REFERENCES public.skills(id)
    ON UPDATE CASCADE ON DELETE SET NULL;

UPDATE public.skills SET id = 'foundation.sistema_6_pasos'  WHERE id = 'framework.6_pasos';
UPDATE public.skills SET id = 'opening.sce'                 WHERE id = 'opening.sce_primeros_10s';
UPDATE public.skills SET id = 'mindset.regla_10_por_ciento' WHERE id = 'calibration.regla_10';
UPDATE public.skills SET id = 'mindset.gasman_theory'       WHERE id = 'mindset.gasman';
UPDATE public.skills SET id = 'mindset.rrr'                 WHERE id = 'calibration.rrr';
UPDATE public.skills SET id = 'blocks.air'                  WHERE id = 'resistance.air_bloqueos';

UPDATE public.skills SET category = 'foundation' WHERE id = 'foundation.sistema_6_pasos';
UPDATE public.skills SET category = 'opening'    WHERE id = 'opening.sce';
UPDATE public.skills SET category = 'mindset'    WHERE id IN
  ('mindset.regla_10_por_ciento','mindset.gasman_theory','mindset.rrr');
UPDATE public.skills SET category = 'blocks'     WHERE id = 'blocks.air';

ALTER TABLE public.skills
  ADD COLUMN skill_type text,
  ADD COLUMN decay_half_life_days int,
  ADD COLUMN requires_audio boolean NOT NULL DEFAULT false,
  ADD COLUMN status text NOT NULL DEFAULT 'active';

UPDATE public.skills SET skill_type='conceptual', decay_half_life_days=365 WHERE id='foundation.sistema_6_pasos';
UPDATE public.skills SET skill_type='habito',     decay_half_life_days=90  WHERE id='opening.sce';
UPDATE public.skills SET skill_type='conceptual', decay_half_life_days=365 WHERE id='mindset.regla_10_por_ciento';
UPDATE public.skills SET skill_type='conceptual', decay_half_life_days=365 WHERE id='mindset.gasman_theory';
UPDATE public.skills SET skill_type='tecnica',    decay_half_life_days=180 WHERE id='mindset.rrr';
UPDATE public.skills SET skill_type='tecnica',    decay_half_life_days=180 WHERE id='blocks.air';

COMMIT;