-- Mensaje 139 · Revisión de seguridad, parte 1: SOLO LECTURA. No cambia nada.
-- Cuatro consultas. Córrelas una por una y pega cada resultado completo.

-- 1) Funciones que se pueden ejecutar SIN iniciar sesión (rol anon).
SELECT n.nspname AS esquema,
       p.proname AS funcion,
       pg_get_function_identity_arguments(p.oid) AS argumentos,
       p.prosecdef AS security_definer,
       l.lanname AS lenguaje,
       coalesce(array_to_string(p.proconfig, ', '), '') AS config,
       strpos(p.prosrc, 'auth.uid') > 0 AS revisa_usuario,
       strpos(p.prosrc, 'auth.role') > 0 OR strpos(p.prosrc, 'auth.jwt') > 0 AS revisa_rol,
       (SELECT string_agg(DISTINCT m[1], ' ') FROM regexp_matches(p.prosrc, '(INSERT|UPDATE|DELETE)\s', 'gi') AS m) AS escribe,
       left(regexp_replace(p.prosrc, '\s+', ' ', 'g'), 300) AS inicio_del_cuerpo
FROM pg_proc p
JOIN pg_namespace n ON n.oid = p.pronamespace
JOIN pg_language l ON l.oid = p.prolang
WHERE n.nspname = 'public'
  AND p.prokind = 'f'
  AND has_function_privilege('anon', p.oid, 'EXECUTE')
ORDER BY p.prosecdef DESC, p.proname;

-- 2) Funciones SECURITY DEFINER que puede ejecutar cualquier usuario con sesión (rol authenticated).
SELECT p.proname AS funcion,
       pg_get_function_identity_arguments(p.oid) AS argumentos,
       coalesce(array_to_string(p.proconfig, ', '), '') AS config,
       strpos(p.prosrc, 'auth.uid') > 0 AS revisa_usuario,
       (SELECT string_agg(DISTINCT m[1], ' ') FROM regexp_matches(p.prosrc, '(INSERT|UPDATE|DELETE)\s', 'gi') AS m) AS escribe
FROM pg_proc p
JOIN pg_namespace n ON n.oid = p.pronamespace
WHERE n.nspname = 'public'
  AND p.prokind = 'f'
  AND p.prosecdef
  AND has_function_privilege('authenticated', p.oid, 'EXECUTE')
ORDER BY p.proname;

-- 3) Tablas y vistas del esquema public: RLS, políticas y qué puede hacer alguien sin sesión.
SELECT c.relname AS tabla,
       CASE c.relkind WHEN 'r' THEN 'tabla' WHEN 'v' THEN 'vista' WHEN 'm' THEN 'vista materializada' ELSE c.relkind::text END AS tipo,
       c.relrowsecurity AS rls_activo,
       (SELECT count(*) FROM pg_policies pol WHERE pol.schemaname = 'public' AND pol.tablename = c.relname) AS politicas,
       coalesce(array_to_string(c.reloptions, ', '), '') AS opciones,
       has_table_privilege('anon', c.oid, 'SELECT') AS anon_lee,
       has_table_privilege('anon', c.oid, 'INSERT') AS anon_inserta,
       has_table_privilege('anon', c.oid, 'UPDATE') AS anon_actualiza,
       has_table_privilege('anon', c.oid, 'DELETE') AS anon_borra
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'public' AND c.relkind IN ('r', 'v', 'm')
ORDER BY c.relrowsecurity, c.relkind, c.relname;

-- 4) Políticas que dejan pasar a cualquiera (rol anon o public, o condición «true»).
SELECT tablename AS tabla, policyname AS politica, cmd AS operacion, roles,
       coalesce(qual, '') AS condicion_usar, coalesce(with_check, '') AS condicion_escribir
FROM pg_policies
WHERE schemaname = 'public'
  AND ('anon' = ANY (roles) OR 'public' = ANY (roles) OR qual = 'true' OR with_check = 'true')
ORDER BY tablename, policyname;
