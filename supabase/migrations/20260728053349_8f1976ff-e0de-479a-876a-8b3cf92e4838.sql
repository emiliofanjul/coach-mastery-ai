
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS industry text;
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS logo_url text;
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS brain_updated_at timestamptz;

CREATE TABLE IF NOT EXISTS public.company_brain_versions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  brain jsonb NOT NULL,
  edited_by uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS company_brain_versions_company_created_idx
  ON public.company_brain_versions (company_id, created_at DESC);

GRANT SELECT ON public.company_brain_versions TO authenticated;
GRANT ALL ON public.company_brain_versions TO service_role;

ALTER TABLE public.company_brain_versions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "managers read own company brain versions" ON public.company_brain_versions;
CREATE POLICY "managers read own company brain versions"
  ON public.company_brain_versions FOR SELECT TO authenticated
  USING (company_id = public.current_company_id() AND public.is_manager());

CREATE OR REPLACE FUNCTION public.update_company_brain(_brain jsonb)
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
$$;

CREATE OR REPLACE FUNCTION public.update_company_identity(_name text, _industry text, _logo_url text)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $$
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
$$;

GRANT EXECUTE ON FUNCTION public.update_company_identity(text, text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_company_brain(jsonb) TO authenticated;
