
-- 1. Backfill: create seller row for the existing manager who lacks one
INSERT INTO public.sellers (profile_id, company_id, full_name, onboarding_completed, map_tutorial_completed)
SELECT p.id, p.company_id, COALESCE(p.full_name, p.email), true, false
FROM public.profiles p
WHERE p.role = 'manager'
  AND p.company_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM public.sellers s WHERE s.profile_id = p.id)
ON CONFLICT (profile_id) DO NOTHING;

-- 2. Trigger: whenever a profile becomes a manager with a company, ensure a seller row exists
CREATE OR REPLACE FUNCTION public.ensure_manager_seller_row()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.role = 'manager' AND NEW.company_id IS NOT NULL THEN
    INSERT INTO public.sellers (profile_id, company_id, full_name, onboarding_completed, map_tutorial_completed)
    VALUES (NEW.id, NEW.company_id, COALESCE(NEW.full_name, NEW.email), true, false)
    ON CONFLICT (profile_id) DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS ensure_manager_seller_row_trg ON public.profiles;
CREATE TRIGGER ensure_manager_seller_row_trg
AFTER INSERT OR UPDATE OF role, company_id ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.ensure_manager_seller_row();
