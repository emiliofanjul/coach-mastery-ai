# Avisos graves del escaneo de seguridad

Generado: 2026-09-29. Solo lectura — no se corrigió nada.

Los tres avisos de nivel grave (error) del escaneo son de las tres tablas de archivo. El aviso dice que no tienen RLS, pero la base de datos confirma que las tres **sí tienen RLS activado** desde el 28 de septiembre de 2026. El aviso está desactualizado y debería desaparecer en el próximo escaneo.

---

## 1. archivo_mentalidad_quiz

**Texto exacto del aviso:**
- Nombre: "Anyone can read, change and delete all of this table"
- Descripción: "No access rules protect archivo_mentalidad_quiz, so anyone using your app can read, change and delete every record in it, and add new ones."
- Detalle: "Table public.archivo_mentalidad_quiz does not have row level security enabled. Enable it with ALTER TABLE public.archivo_mentalidad_quiz ENABLE ROW LEVEL SECURITY and add policies. Location: public|archivo_mentalidad_quiz"
- Nivel: error | Categoría: access_control | ID: RLS_EXPOSURE (lov_db_rls_disabled_v1_38f8e197242a5f39) | Fecha del aviso: 2026-09-01

**RLS activado:** SÍ (verificado en pg_class, relrowsecurity = true)

**Políticas:** NINGUNA (pg_policies no devuelve ninguna fila para esta tabla). Sin políticas, ninguna operación está permitida: la tabla está cerrada.

**Migraciones donde aparece:**
- `supabase/migrations/20260805170153_7aa3a2bc-088f-4285-8569-a4e631bd2e5f.sql` — la crea (CREATE TABLE ... AS)
- `supabase/migrations/20260928200104_6acdc855-0b27-4e26-ba25-20ad26e1ff2b.sql` — le activa RLS (ALTER TABLE ... ENABLE ROW LEVEL SECURITY)

---

## 2. archivo_mentalidad_cards

**Texto exacto del aviso:**
- Nombre: "Anyone can read, change and delete all of this table"
- Descripción: "No access rules protect archivo_mentalidad_cards, so anyone using your app can read, change and delete every record in it, and add new ones."
- Detalle: "Table public.archivo_mentalidad_cards does not have row level security enabled. Enable it with ALTER TABLE public.archivo_mentalidad_cards ENABLE ROW LEVEL SECURITY and add policies. Location: public|archivo_mentalidad_cards"
- Nivel: error | Categoría: access_control | ID: RLS_EXPOSURE (lov_db_rls_disabled_v1_4df5cb8b6b73ec80) | Fecha del aviso: 2026-09-01

**RLS activado:** SÍ (verificado en pg_class, relrowsecurity = true)

**Políticas:** NINGUNA (pg_policies no devuelve ninguna fila para esta tabla). La tabla está cerrada.

**Migraciones donde aparece:**
- `supabase/migrations/20260805170153_7aa3a2bc-088f-4285-8569-a4e631bd2e5f.sql` — la crea
- `supabase/migrations/20260928200104_6acdc855-0b27-4e26-ba25-20ad26e1ff2b.sql` — le activa RLS

---

## 3. archivo_mentalidad_nodes

**Texto exacto del aviso:**
- Nombre: "Anyone can read, change and delete all of this table"
- Descripción: "No access rules protect archivo_mentalidad_nodes, so anyone using your app can read, change and delete every record in it, and add new ones."
- Detalle: "Table public.archivo_mentalidad_nodes does not have row level security enabled. Enable it with ALTER TABLE public.archivo_mentalidad_nodes ENABLE ROW LEVEL SECURITY and add policies. Location: public|archivo_mentalidad_nodes"
- Nivel: error | Categoría: access_control | ID: RLS_EXPOSURE (lov_db_rls_disabled_v1_632f5dfcc7a977bc) | Fecha del aviso: 2026-09-01

**RLS activado:** SÍ (verificado en pg_class, relrowsecurity = true)

**Políticas:** NINGUNA (pg_policies no devuelve ninguna fila para esta tabla). La tabla está cerrada.

**Migraciones donde aparece:**
- `supabase/migrations/20260805170153_7aa3a2bc-088f-4285-8569-a4e631bd2e5f.sql` — la crea
- `supabase/migrations/20260928200104_6acdc855-0b27-4e26-ba25-20ad26e1ff2b.sql` — le activa RLS

---

## Resumen

| Tabla | RLS | Políticas | Estado real |
|---|---|---|---|
| archivo_mentalidad_quiz | Activado | 0 | Cerrada |
| archivo_mentalidad_cards | Activado | 0 | Cerrada |
| archivo_mentalidad_nodes | Activado | 0 | Cerrada |

Los tres avisos datan del 1 de septiembre de 2026, antes de la migración del 28 de septiembre que activó RLS. El escaneo no se ha vuelto a correr desde entonces, por eso los avisos siguen apareciendo. Al no tener ninguna política, las tres tablas no permiten ninguna lectura ni escritura: están cerradas, como se pidió.

Aclaración sobre mensajes anteriores: hace dos mensajes dije por error que los tres avisos eran de tablas distintas a las de archivo. Al releer el escaneo se confirma que sí son las tres tablas de archivo. La versión correcta es la de este documento.
