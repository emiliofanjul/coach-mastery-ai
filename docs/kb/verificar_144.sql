-- Mensaje 144 · Solo lectura. Tres consultas. No cambia nada.

-- 1) El Cerebro sigue en la 23 (este mensaje no lo toca).
SELECT max(version) AS version_cerebro FROM public.doctrina WHERE is_active;

-- 2) Los guiones del mundo 7: versión y huella.
SELECT id, practice_script->>'version' AS version, md5(practice_script::text) AS huella
FROM public.nodes WHERE world_id = 7 ORDER BY id;

-- 3) Vendedores que ya pasaron el examen final (7.4) con 85 o más y no tienen certificado
--    (no se les dio porque la app buscaba el "9.3"). Solo se listan: nadie se certifica aquí.
SELECT s.id AS seller_id, s.full_name, max(ps.score) AS mejor_score, min(ps.created_at) AS primera_vez
FROM public.practice_sessions ps
JOIN public.sellers s ON s.id = ps.seller_id
WHERE ps.node_id = '7.4' AND ps.score >= 85 AND s.certified_at IS NULL
GROUP BY s.id, s.full_name
ORDER BY primera_vez;
