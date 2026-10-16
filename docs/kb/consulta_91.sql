-- Mensaje 91a · Solo lectura. Por qué se cortó la práctica del 2.7c de Emilio (16-oct-2026 04:29 UTC). No cambia nada.

-- 1. Las prácticas del 2.7c de hoy (todas las de Emilio), sin el audio.
SELECT id, created_at, score, end_reason, interruption_count, score_breakdown, conversation_history
FROM public.practice_sessions WHERE node_id = '2.7c' ORDER BY created_at;

-- 2. Las decisiones del Director en esas prácticas, en orden.
SELECT d.* FROM public.director_decisions d
WHERE d.node_id = '2.7c' ORDER BY d.created_at;

-- 3. Las disputas del 2.7c.
SELECT * FROM public.disputas WHERE node_id = '2.7c' ORDER BY created_at;
