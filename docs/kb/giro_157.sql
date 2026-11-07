-- Mensaje 157 · «Tu negocio»: las respuestas del giro se guardan para poder editarlas (nov-2026).
-- 1. companies.respuestas_giro: las respuestas tal como se dieron (para mostrarlas y editarlas).
-- 2. guardar_giro(_respuestas, _brain): guarda respuestas y cerebro juntos, como update_company_brain
--    (solo el manager de su propia empresa; las cuentas personales son manager de la suya).
-- 3. company_onboarding_answers aceptaba solo los bloques 1 a 3: las respuestas del bloque 4 del
--    onboarding del manager (objeciones y reglas) no se guardaban en el historial. Ahora 1 a 4.

ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS respuestas_giro jsonb NOT NULL DEFAULT '{}'::jsonb;

CREATE OR REPLACE FUNCTION public.guardar_giro(_respuestas jsonb, _brain jsonb)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $$
DECLARE
  _company_id uuid;
  _uid uuid := auth.uid();
BEGIN
  IF NOT public.is_manager() THEN
    RAISE EXCEPTION 'Only managers';
  END IF;
  IF _respuestas IS NULL OR jsonb_typeof(_respuestas) <> 'object' OR _brain IS NULL OR jsonb_typeof(_brain) <> 'object' THEN
    RAISE EXCEPTION 'Formato inválido';
  END IF;
  IF octet_length(_respuestas::text) > 50000 OR octet_length(_brain::text) > 100000 THEN
    RAISE EXCEPTION 'Demasiado grande';
  END IF;
  _company_id := public.current_company_id();
  IF _company_id IS NULL THEN
    RAISE EXCEPTION 'Sin empresa';
  END IF;
  UPDATE public.companies
    SET respuestas_giro = _respuestas,
        company_sales_brain = _brain,
        onboarding_completed = true,
        brain_updated_at = now()
    WHERE id = _company_id;
  INSERT INTO public.company_brain_versions (company_id, brain, edited_by)
    VALUES (_company_id, _brain, _uid);
  RETURN jsonb_build_object('ok', true, 'updated_at', now());
END;
$$;

REVOKE EXECUTE ON FUNCTION public.guardar_giro(jsonb, jsonb) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.guardar_giro(jsonb, jsonb) TO authenticated;

DO $fix$
DECLARE c record;
BEGIN
  FOR c IN
    SELECT conname FROM pg_constraint
    WHERE conrelid = 'public.company_onboarding_answers'::regclass AND contype = 'c'
      AND pg_get_constraintdef(oid) ILIKE '%block_number%'
  LOOP
    EXECUTE format('ALTER TABLE public.company_onboarding_answers DROP CONSTRAINT %I', c.conname);
  END LOOP;
END
$fix$;
ALTER TABLE public.company_onboarding_answers
  ADD CONSTRAINT company_onboarding_answers_bloque_1_a_4 CHECK (block_number BETWEEN 1 AND 4);

DO $chk$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'companies' AND column_name = 'respuestas_giro') THEN
    RAISE EXCEPTION 'falta companies.respuestas_giro';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace WHERE n.nspname = 'public' AND p.proname = 'guardar_giro' AND p.prosecdef) THEN
    RAISE EXCEPTION 'falta guardar_giro (security definer)';
  END IF;
  IF has_function_privilege('anon', 'public.guardar_giro(jsonb, jsonb)', 'EXECUTE') THEN
    RAISE EXCEPTION 'anon no debe ejecutar guardar_giro';
  END IF;
  IF EXISTS (SELECT 1 FROM pg_constraint WHERE conrelid = 'public.company_onboarding_answers'::regclass AND contype = 'c'
             AND pg_get_constraintdef(oid) ILIKE '%block_number%' AND conname <> 'company_onboarding_answers_bloque_1_a_4') THEN
    RAISE EXCEPTION 'quedó otra regla vieja sobre block_number';
  END IF;
  RAISE NOTICE 'giro_157: listo';
END
$chk$;
