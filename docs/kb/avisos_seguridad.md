# Avisos de seguridad de la base de datos

Solo lectura (25-sep-2026). Ninguno corregido. Total: 38.

| # | Aviso | Objeto afectado | Tipo | Nivel |
|---|---|---|---|---|
| 1 | RLS Disabled in Public | `public.archivo_mentalidad_cards` | tabla | ERROR |
| 2 | RLS Disabled in Public | `public.archivo_mentalidad_nodes` | tabla | ERROR |
| 3 | RLS Disabled in Public | `public.archivo_mentalidad_quiz` | tabla | ERROR |
| 4 | Public Can Execute SECURITY DEFINER Function | `public.convert_personal_to_company(_name text)` | función | WARN |
| 5 | Public Can Execute SECURITY DEFINER Function | `public.create_personal_company()` | función | WARN |
| 6 | Public Can Execute SECURITY DEFINER Function | `public.create_team_company(_name text)` | función | WARN |
| 7 | Public Can Execute SECURITY DEFINER Function | `public.ensure_manager_seller_row()` | función | WARN |
| 8 | Public Can Execute SECURITY DEFINER Function | `public.generate_company_invite(_hours integer)` | función | WARN |
| 9 | Public Can Execute SECURITY DEFINER Function | `public.join_company_with_code(_code text)` | función | WARN |
| 10 | Public Can Execute SECURITY DEFINER Function | `public.llm_usage_report(_from timestamp with time zone, _to timestamp with time zone)` | función | WARN |
| 11 | Public Can Execute SECURITY DEFINER Function | `public.revoke_company_invite()` | función | WARN |
| 12 | Public Can Execute SECURITY DEFINER Function | `public.set_seller_active(_seller_id uuid, _active boolean)` | función | WARN |
| 13 | Public Can Execute SECURITY DEFINER Function | `public.update_company_identity(_name text, _industry text, _logo_url text)` | función | WARN |
| 14 | Signed-In Users Can Execute SECURITY DEFINER Function | `public.apply_invite_code(_code text)` | función | WARN |
| 15 | Signed-In Users Can Execute SECURITY DEFINER Function | `public.convert_personal_to_company(_name text)` | función | WARN |
| 16 | Signed-In Users Can Execute SECURITY DEFINER Function | `public.create_company_for_manager(_name text)` | función | WARN |
| 17 | Signed-In Users Can Execute SECURITY DEFINER Function | `public.create_personal_company()` | función | WARN |
| 18 | Signed-In Users Can Execute SECURITY DEFINER Function | `public.create_team_company(_name text)` | función | WARN |
| 19 | Signed-In Users Can Execute SECURITY DEFINER Function | `public.current_company_id()` | función | WARN |
| 20 | Signed-In Users Can Execute SECURITY DEFINER Function | `public.current_role()` | función | WARN |
| 21 | Signed-In Users Can Execute SECURITY DEFINER Function | `public.ensure_manager_seller_row()` | función | WARN |
| 22 | Signed-In Users Can Execute SECURITY DEFINER Function | `public.generate_company_invite()` | función | WARN |
| 23 | Signed-In Users Can Execute SECURITY DEFINER Function | `public.generate_company_invite(_hours integer)` | función | WARN |
| 24 | Signed-In Users Can Execute SECURITY DEFINER Function | `public.get_active_company_invite()` | función | WARN |
| 25 | Signed-In Users Can Execute SECURITY DEFINER Function | `public.is_manager()` | función | WARN |
| 26 | Signed-In Users Can Execute SECURITY DEFINER Function | `public.join_company_with_code(_code text)` | función | WARN |
| 27 | Signed-In Users Can Execute SECURITY DEFINER Function | `public.llm_usage_report(_from timestamp with time zone, _to timestamp with time zone)` | función | WARN |
| 28 | Signed-In Users Can Execute SECURITY DEFINER Function | `public.owns_seller(_seller_id uuid)` | función | WARN |
| 29 | Signed-In Users Can Execute SECURITY DEFINER Function | `public.revoke_company_invite()` | función | WARN |
| 30 | Signed-In Users Can Execute SECURITY DEFINER Function | `public.save_onboarding_answer(_block_number integer, _question_id text, _question_text text, _answer text)` | función | WARN |
| 31 | Signed-In Users Can Execute SECURITY DEFINER Function | `public.set_seller_active(_seller_id uuid, _active boolean)` | función | WARN |
| 32 | Signed-In Users Can Execute SECURITY DEFINER Function | `public.update_company_brain(_brain jsonb)` | función | WARN |
| 33 | Signed-In Users Can Execute SECURITY DEFINER Function | `public.update_company_identity(_name text, _industry text, _logo_url text)` | función | WARN |
| 34 | Signed-In Users Can Execute SECURITY DEFINER Function | `public.usage_cost_report(_from timestamp with time zone, _to timestamp with time zone)` | función | WARN |
| 35 | Signed-In Users Can Execute SECURITY DEFINER Function | `public.validate_invite_code(_code text)` | función | WARN |
| 36 | Function Search Path Mutable | `public._company_prefix(_name text)` | función | WARN |
| 37 | Function Search Path Mutable | `public._gen_invite_suffix()` | función | WARN |
| 38 | Function Search Path Mutable | `public.resolver_practice_script(ps jsonb)` | función | WARN |
