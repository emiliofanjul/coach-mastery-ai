
REVOKE EXECUTE ON FUNCTION public.usage_cost_report(timestamptz, timestamptz) FROM anon, public;
GRANT EXECUTE ON FUNCTION public.usage_cost_report(timestamptz, timestamptz) TO authenticated, service_role;
REVOKE EXECUTE ON FUNCTION public.llm_call_usd(text, integer, integer, integer, integer) FROM anon, public;
GRANT EXECUTE ON FUNCTION public.llm_call_usd(text, integer, integer, integer, integer) TO authenticated, service_role;
