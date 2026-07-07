
-- 1) Restrict director_decisions to same company via practice_sessions
DROP POLICY IF EXISTS "director_decisions readable by authenticated" ON public.director_decisions;

CREATE POLICY "director_decisions readable by company"
ON public.director_decisions
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.practice_sessions ps
    WHERE ps.id = director_decisions.session_id
      AND ps.company_id = public.current_company_id()
      AND (
        public.is_manager()
        OR public.owns_seller(ps.seller_id)
      )
  )
);

-- 2) Storage: add write policies for practice-audio scoped to seller folder
CREATE POLICY "practice_audio_insert_own"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'practice-audio'
  AND EXISTS (
    SELECT 1 FROM public.sellers s
    WHERE s.profile_id = auth.uid()
      AND s.id::text = (storage.foldername(objects.name))[1]
  )
);

CREATE POLICY "practice_audio_update_own"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'practice-audio'
  AND EXISTS (
    SELECT 1 FROM public.sellers s
    WHERE s.profile_id = auth.uid()
      AND s.id::text = (storage.foldername(objects.name))[1]
  )
)
WITH CHECK (
  bucket_id = 'practice-audio'
  AND EXISTS (
    SELECT 1 FROM public.sellers s
    WHERE s.profile_id = auth.uid()
      AND s.id::text = (storage.foldername(objects.name))[1]
  )
);

CREATE POLICY "practice_audio_delete_own"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'practice-audio'
  AND EXISTS (
    SELECT 1 FROM public.sellers s
    WHERE s.profile_id = auth.uid()
      AND s.id::text = (storage.foldername(objects.name))[1]
  )
);

-- 3) Revoke public/anon EXECUTE on SECURITY DEFINER functions; grant only to authenticated where callable via RPC
REVOKE EXECUTE ON FUNCTION public.create_company_for_manager(text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.create_company_for_manager(text) TO authenticated;

REVOKE EXECUTE ON FUNCTION public."current_role"() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public."current_role"() TO authenticated;

REVOKE EXECUTE ON FUNCTION public.current_company_id() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.current_company_id() TO authenticated;

REVOKE EXECUTE ON FUNCTION public.is_manager() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_manager() TO authenticated;

REVOKE EXECUTE ON FUNCTION public.owns_seller(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.owns_seller(uuid) TO authenticated;

REVOKE EXECUTE ON FUNCTION public.save_onboarding_answer(integer, text, text, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.save_onboarding_answer(integer, text, text, text) TO authenticated;

REVOKE EXECUTE ON FUNCTION public.consume_credits(uuid, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.consume_credits(uuid, text) TO authenticated;

REVOKE EXECUTE ON FUNCTION public.register_invite_failed_attempt(text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.register_invite_failed_attempt(text) TO authenticated;

REVOKE EXECUTE ON FUNCTION public.validate_invite_code(text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.validate_invite_code(text) TO authenticated;

REVOKE EXECUTE ON FUNCTION public.generate_company_invite() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.generate_company_invite() TO authenticated;

REVOKE EXECUTE ON FUNCTION public.get_active_company_invite() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_active_company_invite() TO authenticated;

REVOKE EXECUTE ON FUNCTION public.update_company_brain(jsonb) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.update_company_brain(jsonb) TO authenticated;

REVOKE EXECUTE ON FUNCTION public.select_archetype_for_session(uuid, integer, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.select_archetype_for_session(uuid, integer, text) TO authenticated;

REVOKE EXECUTE ON FUNCTION public.apply_invite_code(text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.apply_invite_code(text) TO authenticated;

-- Trigger-only functions: no public execution needed
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.update_updated_at_column() FROM PUBLIC, anon, authenticated;
