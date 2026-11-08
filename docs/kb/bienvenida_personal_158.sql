-- Mensaje 158 · Las cuentas personales sí ven la bienvenida (nov-2026).
-- Quien entrena por su cuenta es «manager» de su empresa personal. El disparador que le crea su registro
-- de vendedor lo marcaba con la bienvenida ya hecha (onboarding_completed = true, pensado para los
-- managers de equipo), así que nunca la veía: ni la bienvenida, ni sus preguntas, ni la grabación.
-- 1. El disparador: en empresas personales, el registro nace SIN la bienvenida hecha.
-- 2. Las cuentas personales que nunca contestaron la bienvenida (main_challenge vacío) la verán al entrar.

CREATE OR REPLACE FUNCTION public.ensure_manager_seller_row()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.role = 'manager' AND NEW.company_id IS NOT NULL THEN
    INSERT INTO public.sellers (profile_id, company_id, full_name, onboarding_completed, map_tutorial_completed)
    VALUES (
      NEW.id, NEW.company_id, COALESCE(NEW.full_name, NEW.email),
      NOT EXISTS (SELECT 1 FROM public.companies c WHERE c.id = NEW.company_id AND c.is_personal),
      false
    )
    ON CONFLICT (profile_id) DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$;

UPDATE public.sellers s
   SET onboarding_completed = false
  FROM public.companies c
 WHERE c.id = s.company_id
   AND c.is_personal
   AND s.onboarding_completed
   AND s.main_challenge IS NULL;

DO $chk$
BEGIN
  IF position('is_personal' in pg_get_functiondef('public.ensure_manager_seller_row()'::regprocedure)) = 0 THEN
    RAISE EXCEPTION 'el disparador no distingue las cuentas personales';
  END IF;
  IF EXISTS (SELECT 1 FROM public.sellers s JOIN public.companies c ON c.id = s.company_id
             WHERE c.is_personal AND s.onboarding_completed AND s.main_challenge IS NULL) THEN
    RAISE EXCEPTION 'quedó una cuenta personal sin bienvenida marcada como hecha';
  END IF;
END
$chk$;
