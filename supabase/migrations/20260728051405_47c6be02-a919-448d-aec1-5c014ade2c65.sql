
REVOKE EXECUTE ON FUNCTION public.generate_company_invite(integer) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.get_active_company_invite() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.revoke_company_invite() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.validate_invite_code(text) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.apply_invite_code(text) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.create_personal_company() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.create_team_company(text) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.convert_personal_to_company(text) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.join_company_with_code(text) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.set_seller_active(uuid, boolean) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public._gen_invite_suffix() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public._company_prefix(text) FROM PUBLIC;
