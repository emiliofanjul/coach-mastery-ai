
-- Revoke EXECUTE on internal SECURITY DEFINER helpers from PUBLIC/authenticated/anon.
-- These are used inside RLS policies, triggers, or edge functions (service_role) only,
-- and should not be directly callable by end users via PostgREST/Data API.

REVOKE EXECUTE ON FUNCTION public.current_role() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.current_company_id() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.is_manager() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.owns_seller(uuid) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.consume_credits(uuid, text) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.register_invite_failed_attempt(text) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.select_archetype_for_session(uuid, integer, text) FROM PUBLIC, anon, authenticated;
