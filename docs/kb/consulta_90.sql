-- Mensaje 90a · Solo lectura. Datos para armar los nodos 2.7b y 2.7c. No cambia nada.

-- 1. Los nodos del Mundo 2 tal como están (todo menos el guion).
SELECT id, world_id, name, technique, order_index, is_boss, reps_required, checkpoints, difficulty_level,
       description, node_type, conversation_scope, engine_type, boss_goal, field_mission, tipo_cliente
FROM public.nodes WHERE world_id = 2 ORDER BY order_index;

-- 2. El orden de todos los nodos (para saber si order_index es por mundo o global).
SELECT world_id, string_agg(id || ':' || order_index, ', ' ORDER BY order_index) AS orden FROM public.nodes GROUP BY world_id ORDER BY world_id;

-- 3. Restricciones, índices y triggers de la tabla nodes.
SELECT conname, pg_get_constraintdef(oid) FROM pg_constraint WHERE conrelid = 'public.nodes'::regclass;
SELECT indexname, indexdef FROM pg_indexes WHERE schemaname = 'public' AND tablename = 'nodes';
SELECT tgname, pg_get_triggerdef(oid) FROM pg_trigger WHERE tgrelid = 'public.nodes'::regclass AND NOT tgisinternal;

-- 4. Tablas que tienen una columna node_id (para no dejar nada sin ligar).
SELECT table_name FROM information_schema.columns WHERE table_schema = 'public' AND column_name = 'node_id' ORDER BY 1;

-- 5. Habilidades y reglas: columnas, la de AIR completa, y lo que tienen el 2.6 y el 2.7.
SELECT table_name, string_agg(column_name || ' ' || data_type || CASE WHEN is_nullable = 'NO' THEN ' NOT NULL' ELSE '' END, ', ' ORDER BY ordinal_position)
FROM information_schema.columns WHERE table_schema = 'public' AND table_name IN ('skills','reglas','node_skills','node_progress') GROUP BY table_name;
SELECT * FROM public.skills WHERE id = 'blocks.air';
SELECT max(code) AS ultimo_codigo FROM public.skills;
SELECT * FROM public.reglas WHERE id = 'blocks.air';
SELECT node_id, skill_id, relation, weight, is_primary FROM public.node_skills WHERE node_id IN ('2.6','2.7') ORDER BY node_id, skill_id;

-- 6. Vendedores que ya pasaron el 2.7 (a ellos el 2.7b y el 2.7c les aparecerían completados).
SELECT count(DISTINCT p.seller_id) AS vendedores_despues_del_27
FROM public.node_progress p JOIN public.nodes n ON n.id = p.node_id
WHERE p.status = 'done' AND (n.world_id > 2 OR p.node_id IN ('2.8','2.9','2.10'));
SELECT status, stars, reps_completed, consistency_score, sessions_count, count(*) FROM public.node_progress WHERE node_id = '2.7' GROUP BY 1,2,3,4,5 ORDER BY 6 DESC LIMIT 5;
