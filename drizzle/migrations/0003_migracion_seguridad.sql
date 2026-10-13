-- MENSAJE 73 — Revisión de seguridad antes de lanzar (oct-2026).
-- Idempotente: se puede correr dos veces.

CREATE OR REPLACE FUNCTION public.proteger_campos_sensibles()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
BEGIN
  IF current_user NOT IN ('authenticated', 'anon') THEN
    RETURN NEW;
  END IF;

  IF TG_TABLE_NAME = 'profiles' THEN
    IF TG_OP = 'INSERT' THEN
      IF NEW.company_id IS NOT NULL OR NEW.role NOT IN ('vendedor', 'manager') THEN
        RAISE EXCEPTION 'No permitido: el perfil se crea sin empresa' USING ERRCODE = '42501';
      END IF;
    ELSIF NEW.role IS DISTINCT FROM OLD.role
       OR NEW.company_id IS DISTINCT FROM OLD.company_id
       OR NEW.id IS DISTINCT FROM OLD.id
       OR NEW.email IS DISTINCT FROM OLD.email THEN
      RAISE EXCEPTION 'No permitido: el rol, la empresa y el correo no se cambian desde la app' USING ERRCODE = '42501';
    END IF;

  ELSIF TG_TABLE_NAME = 'sellers' THEN
    IF TG_OP = 'INSERT' THEN
      RAISE EXCEPTION 'No permitido: los vendedores se crean con un código de invitación' USING ERRCODE = '42501';
    END IF;
    IF TG_OP = 'UPDATE' AND (
         NEW.profile_id IS DISTINCT FROM OLD.profile_id
      OR NEW.company_id IS DISTINCT FROM OLD.company_id
      OR NEW.credits_used_this_month IS DISTINCT FROM OLD.credits_used_this_month
      OR NEW.is_active IS DISTINCT FROM OLD.is_active
      OR NEW.joined_via_invite_id IS DISTINCT FROM OLD.joined_via_invite_id
      OR NEW.joined_at IS DISTINCT FROM OLD.joined_at) THEN
      RAISE EXCEPTION 'No permitido: esos datos del vendedor no se cambian desde la app' USING ERRCODE = '42501';
    END IF;

  ELSIF TG_TABLE_NAME = 'companies' THEN
    IF TG_OP = 'UPDATE' AND (
         NEW.id IS DISTINCT FROM OLD.id
      OR NEW.plan IS DISTINCT FROM OLD.plan
      OR NEW.credits_per_month IS DISTINCT FROM OLD.credits_per_month
      OR NEW.is_personal IS DISTINCT FROM OLD.is_personal) THEN
      RAISE EXCEPTION 'No permitido: el plan y los créditos de la empresa no se cambian desde la app' USING ERRCODE = '42501';
    END IF;
  END IF;

  RETURN NEW;
END;
$function$;

DROP TRIGGER IF EXISTS proteger_campos_sensibles ON public.profiles;
CREATE TRIGGER proteger_campos_sensibles BEFORE INSERT OR UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.proteger_campos_sensibles();
DROP TRIGGER IF EXISTS proteger_campos_sensibles ON public.sellers;
CREATE TRIGGER proteger_campos_sensibles BEFORE INSERT OR UPDATE ON public.sellers
  FOR EACH ROW EXECUTE FUNCTION public.proteger_campos_sensibles();
DROP TRIGGER IF EXISTS proteger_campos_sensibles ON public.companies;
CREATE TRIGGER proteger_campos_sensibles BEFORE UPDATE ON public.companies
  FOR EACH ROW EXECUTE FUNCTION public.proteger_campos_sensibles();

ALTER FUNCTION public.resolver_practice_script(jsonb) SECURITY DEFINER;
ALTER FUNCTION public.resolver_practice_script(jsonb) SET search_path TO 'public';

DROP POLICY IF EXISTS reglas_lectura ON public.reglas;
DROP POLICY IF EXISTS reglas_lectura_admin ON public.reglas;
CREATE POLICY reglas_lectura_admin ON public.reglas AS PERMISSIVE FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.platform_admins pa WHERE pa.user_id = auth.uid()));

DROP POLICY IF EXISTS doctrina_read_authenticated ON public.doctrina;
DROP POLICY IF EXISTS doctrina_write_owner ON public.doctrina;
DROP POLICY IF EXISTS doctrina_update_owner ON public.doctrina;
DROP POLICY IF EXISTS doctrina_delete_owner ON public.doctrina;
DROP POLICY IF EXISTS doctrina_admin ON public.doctrina;
CREATE POLICY doctrina_admin ON public.doctrina AS PERMISSIVE FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.platform_admins pa WHERE pa.user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.platform_admins pa WHERE pa.user_id = auth.uid()));

REVOKE TRUNCATE, REFERENCES, TRIGGER ON ALL TABLES IN SCHEMA public FROM anon, authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE TRUNCATE, REFERENCES, TRIGGER ON TABLES FROM anon, authenticated;
DO $$
BEGIN
  EXECUTE 'REVOKE MAINTAIN ON ALL TABLES IN SCHEMA public FROM anon, authenticated';
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

DO $$
DECLARE f text;
BEGIN
  FOREACH f IN ARRAY ARRAY[
    'public.convert_personal_to_company(text)',
    'public.create_personal_company()',
    'public.create_team_company(text)',
    'public.generate_company_invite(integer)',
    'public.join_company_with_code(text)',
    'public.llm_usage_report(timestamp with time zone, timestamp with time zone)',
    'public.revoke_company_invite()',
    'public.set_seller_active(uuid, boolean)',
    'public._company_prefix(text)',
    'public._gen_invite_suffix()'
  ] LOOP
    BEGIN
      EXECUTE format('REVOKE EXECUTE ON FUNCTION %s FROM PUBLIC, anon', f);
    EXCEPTION WHEN undefined_function THEN
      RAISE NOTICE 'no existe: %', f;
    END;
  END LOOP;
END $$;
DO $$
DECLARE r record;
BEGIN
  FOR r IN SELECT p.oid::regprocedure AS sig FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
           WHERE n.nspname = 'public' AND p.proname IN ('update_company_identity', 'get_current_mastery', 'resolver_practice_script')
  LOOP
    EXECUTE format('REVOKE EXECUTE ON FUNCTION %s FROM PUBLIC, anon', r.sig);
  END LOOP;
END $$;