-- Solo lectura. Dos consultas.
-- 1) Tiene que salir: 21 | principio | (vacío)   — antes del 138: 20 | error | major
SELECT (SELECT max(version) FROM public.doctrina WHERE is_active) AS version_cerebro,
       r.tipo, r.severidad_default
FROM public.reglas r WHERE r.id = 'objection.bala_repetida';
-- 2) Los guiones de las prácticas que cambian.
SELECT id, practice_script->>'version' AS version, md5(practice_script::text) AS huella
FROM public.nodes WHERE id IN ('5.8','5.10','5.12','5.13','5.14','5.15') ORDER BY length(id), id;
