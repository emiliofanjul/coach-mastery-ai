-- Pitch Builder: auditoría de secciones + la vía "correccion" en el feedback.
--
-- 1) El chat del Pitch Builder solo tenía tres salidas (estilo / hecho /
--    doctrina). Faltaba la más importante: que el manager tenga razón y el
--    pitch esté mal. Sin esa vía, cuando Closer se equivocaba solo podía
--    etiquetar el acierto del manager como "aquí no coincidimos".
--
-- 2) pitch_sections guarda ahora el veredicto de la auditoría, para que una
--    violación no quede invisible entre el texto y quien lo lee.

ALTER TABLE public.pitch_feedback
  DROP CONSTRAINT IF EXISTS pitch_feedback_classification_check;

ALTER TABLE public.pitch_feedback
  ADD CONSTRAINT pitch_feedback_classification_check
  CHECK (
    classification IS NULL
    OR classification IN ('estilo', 'hecho', 'correccion', 'doctrina')
  );

ALTER TABLE public.pitch_sections
  ADD COLUMN IF NOT EXISTS audit jsonb,
  ADD COLUMN IF NOT EXISTS audited_at timestamptz,
  ADD COLUMN IF NOT EXISTS audit_status text;

ALTER TABLE public.pitch_sections
  DROP CONSTRAINT IF EXISTS pitch_sections_audit_status_check;

ALTER TABLE public.pitch_sections
  ADD CONSTRAINT pitch_sections_audit_status_check
  CHECK (
    audit_status IS NULL
    OR audit_status IN ('limpio', 'advertencia', 'falla')
  );

-- Para poder listar de un vistazo qué secciones traen problema.
CREATE INDEX IF NOT EXISTS pitch_sections_audit_status_idx
  ON public.pitch_sections (audit_status)
  WHERE audit_status IS NOT NULL AND audit_status <> 'limpio';

COMMENT ON COLUMN public.pitch_sections.audit IS
  'Veredicto del auditor: skill_ids derivados del texto, violaciones con cita literal, afirmaciones sin respaldo en el cerebro de la empresa.';
COMMENT ON COLUMN public.pitch_sections.skill_ids IS
  'Técnicas REALMENTE ejecutadas en el texto, derivadas por el auditor. Antes las declaraba el generador y no se recalculaban al editar.';
