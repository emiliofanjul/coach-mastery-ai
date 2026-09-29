# Avisos graves: tablas de archivo abiertas

Fecha de levantamiento: 2026-09-29 (UTC)
Fuente del aviso: escaneo de seguridad de Lovable (lov_pgscan), hallazgos creados el 2026-09-01T19:57:23Z.
Nota importante: el texto del aviso dice que las tablas NO tienen RLS activado, pero el estado actual de la base de datos (verificado el 2026-09-29) muestra RLS activado en las tres, sin políticas. El aviso parece anterior al cierre de las tablas (migración del 2026-09-28) y debería desaparecer en el próximo escaneo.

---

## 1. archivo_mentalidad_quiz

- **ID interno del aviso:** lov_db_rls_disabled_v1_38f8e197242a5f39
- **Texto exacto del aviso (nombre):** "Anyone can read, change and delete all of this table"
- **Texto exacto del aviso (descripción):** "No access rules protect archivo_mentalidad_quiz, so anyone using your app can read, change and delete every record in it, and add new ones."
- **Texto exacto del aviso (detalles):** "Table public.archivo_mentalidad_quiz does not have row level security enabled. Enable it with ALTER TABLE public.archivo_mentalidad_quiz ENABLE ROW LEVEL SECURITY and add policies. Location: public|archivo_mentalidad_quiz"
- **RLS activado (estado actual en BD):** SÍ (relrowsecurity = true, forzado = false)
- **Políticas:** NINGUNA (lista vacía)
- **Aparece en migraciones:** SÍ
  - `supabase/migrations/20260805170153_7aa3a2bc-088f-4285-8569-a4e631bd2e5f.sql` — línea 12: `CREATE TABLE IF NOT EXISTS public.archivo_mentalidad_quiz AS ...`
  - `supabase/migrations/20260928200104_6acdc855-0b27-4e26-ba25-20ad26e1ff2b.sql` — línea 3: `ALTER TABLE public.archivo_mentalidad_quiz ENABLE ROW LEVEL SECURITY;`

## 2. archivo_mentalidad_cards

- **ID interno del aviso:** lov_db_rls_disabled_v1_4df5cb8b6b73ec80
- **Texto exacto del aviso (nombre):** "Anyone can read, change and delete all of this table"
- **Texto exacto del aviso (descripción):** "No access rules protect archivo_mentalidad_cards, so anyone using your app can read, change and delete every record in it, and add new ones."
- **Texto exacto del aviso (detalles):** "Table public.archivo_mentalidad_cards does not have row level security enabled. Enable it with ALTER TABLE public.archivo_mentalidad_cards ENABLE ROW LEVEL SECURITY and add policies. Location: public|archivo_mentalidad_cards"
- **RLS activado (estado actual en BD):** SÍ (relrowsecurity = true, forzado = false)
- **Políticas:** NINGUNA (lista vacía)
- **Aparece en migraciones:** SÍ
  - `supabase/migrations/20260805170153_7aa3a2bc-088f-4285-8569-a4e631bd2e5f.sql` — línea 8: `CREATE TABLE IF NOT EXISTS public.archivo_mentalidad_cards AS ...`
  - `supabase/migrations/20260928200104_6acdc855-0b27-4e26-ba25-20ad26e1ff2b.sql` — línea 1: `ALTER TABLE public.archivo_mentalidad_cards ENABLE ROW LEVEL SECURITY;`

## 3. archivo_mentalidad_nodes

- **ID interno del aviso:** lov_db_rls_disabled_v1_632f5dfcc7a977bc
- **Texto exacto del aviso (nombre):** "Anyone can read, change and delete all of this table"
- **Texto exacto del aviso (descripción):** "No access rules protect archivo_mentalidad_nodes, so anyone using your app can read, change and delete every record in it, and add new ones."
- **Texto exacto del aviso (detalles):** "Table public.archivo_mentalidad_nodes does not have row level security enabled. Enable it with ALTER TABLE public.archivo_mentalidad_nodes ENABLE ROW LEVEL SECURITY and add policies. Location: public|archivo_mentalidad_nodes"
- **RLS activado (estado actual en BD):** SÍ (relrowsecurity = true, forzado = false)
- **Políticas:** NINGUNA (lista vacía)
- **Aparece en migraciones:** SÍ
  - `supabase/migrations/20260805170153_7aa3a2bc-088f-4285-8569-a4e631bd2e5f.sql` — línea 5: `CREATE TABLE IF NOT EXISTS public.archivo_mentalidad_nodes AS ...`
  - `supabase/migrations/20260928200104_6acdc855-0b27-4e26-ba25-20ad26e1ff2b.sql` — línea 2: `ALTER TABLE public.archivo_mentalidad_nodes ENABLE ROW LEVEL SECURITY;`

---

## Resumen

| Tabla | RLS activado | Políticas | En migraciones |
|---|---|---|---|
| archivo_mentalidad_quiz | Sí | 0 | Sí (2) |
| archivo_mentalidad_cards | Sí | 0 | Sí (2) |
| archivo_mentalidad_nodes | Sí | 0 | Sí (2) |

Las tres tablas fueron cerradas el 2026-09-28 habilitando RLS sin agregar políticas (nadie puede leerlas ni cambiarlas desde la app). El aviso del escaneo es del 2026-09-01, anterior a ese cierre.
