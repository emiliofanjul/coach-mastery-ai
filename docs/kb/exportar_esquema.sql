-- Exportación del esquema REAL (solo lectura). Lo que la base tiene hoy, no lo
-- que dicen las migraciones: muchas tablas y columnas se crearon fuera de
-- ellas. Sirve para probar cada SQL contra lo mismo que lo va a recibir.
WITH tablas AS (
  SELECT c.oid, c.relname
  FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
  WHERE n.nspname = 'public' AND c.relkind = 'r'
    AND c.relname IN ('worlds','nodes','node_skills','node_cards','node_quiz_questions','node_progress',
                      'practice_sessions','reglas','skills','doctrina','companies','sellers','profiles')
),
columnas AS (
  SELECT t.relname, string_agg(
    format('  %I %s%s%s', a.attname, format_type(a.atttypid, a.atttypmod),
      CASE WHEN a.attnotnull THEN ' NOT NULL' ELSE '' END,
      CASE WHEN d.adbin IS NOT NULL THEN ' DEFAULT ' || pg_get_expr(d.adbin, d.adrelid) ELSE '' END),
    E',\n' ORDER BY a.attnum) AS cols
  FROM tablas t JOIN pg_attribute a ON a.attrelid = t.oid AND a.attnum > 0 AND NOT a.attisdropped
  LEFT JOIN pg_attrdef d ON d.adrelid = t.oid AND d.adnum = a.attnum
  GROUP BY t.relname
),
restricciones AS (
  SELECT t.relname, string_agg(format('ALTER TABLE public.%I ADD CONSTRAINT %I %s;', t.relname, con.conname, pg_get_constraintdef(con.oid)),
    E'\n' ORDER BY con.contype DESC, con.conname) AS defs
  FROM tablas t JOIN pg_constraint con ON con.conrelid = t.oid GROUP BY t.relname
),
indices AS (
  SELECT t.relname, string_agg(pg_get_indexdef(i.indexrelid) || ';', E'\n') AS defs
  FROM tablas t JOIN pg_index i ON i.indrelid = t.oid
  WHERE NOT EXISTS (SELECT 1 FROM pg_constraint con WHERE con.conindid = i.indexrelid)
  GROUP BY t.relname
),
disparadores AS (
  SELECT string_agg(pg_get_triggerdef(tg.oid) || ';', E'\n') AS defs,
         string_agg(DISTINCT pg_get_functiondef(tg.tgfoid), E';\n\n') AS funcs
  FROM tablas t JOIN pg_trigger tg ON tg.tgrelid = t.oid AND NOT tg.tgisinternal
),
mundo3 AS (
  SELECT string_agg(format('-- %s @ order_index %s (world %s)', id, order_index, world_id), E'\n' ORDER BY order_index) AS filas
  FROM public.nodes WHERE world_id = 3
)
SELECT
  E'-- ===== TABLAS =====\n' ||
  (SELECT string_agg(format(E'CREATE TABLE public.%I (\n%s\n);', relname, cols), E'\n\n' ORDER BY relname) FROM columnas) ||
  E'\n\n-- ===== RESTRICCIONES (PK, UNIQUE y CHECK primero; vínculos al final) =====\n' ||
  coalesce((SELECT string_agg(defs, E'\n' ORDER BY relname) FROM restricciones), '') ||
  E'\n\n-- ===== ÍNDICES =====\n' ||
  coalesce((SELECT string_agg(defs, E'\n' ORDER BY relname) FROM indices), '') ||
  E'\n\n-- ===== FUNCIONES DE LOS DISPARADORES =====\n' ||
  coalesce((SELECT funcs FROM disparadores), '') || E';\n' ||
  E'\n\n-- ===== DISPARADORES =====\n' ||
  coalesce((SELECT defs FROM disparadores), '') ||
  E'\n\n-- ===== ORDEN ACTUAL DEL MUNDO 3 =====\n' ||
  coalesce((SELECT filas FROM mundo3), '')
AS esquema;
