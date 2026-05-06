
REVOKE EXECUTE ON FUNCTION public.current_company_id() FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.current_role() FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.is_manager() FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.owns_seller(uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.consume_credits(uuid, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.consume_credits(uuid, text) TO authenticated;
