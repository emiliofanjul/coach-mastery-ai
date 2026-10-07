// Banco de pruebas con el ESQUEMA REAL de la base (docs/kb/esquema_vivo.sql,
// exportado de producción) y los datos reales de las fotos de docs/kb/.
// Nada del esquema se escribe a mano: si producción rechaza algo, aquí también.
import { PGlite } from "@electric-sql/pglite";
import { readFileSync } from "node:fs";
const KB = new URL("../../docs/kb/", import.meta.url).pathname;
// Las fotos de docs/kb/ deben ser las de la base real (regenéralas antes de probar).
const lee = (f) => JSON.parse(readFileSync(KB + f, "utf8"));

export async function bancoVivo() {
  const esquema = readFileSync(KB + "esquema_vivo.sql", "utf8");
  const parte = (desde, hasta) => esquema.slice(esquema.indexOf(desde), hasta ? esquema.indexOf(hasta) : undefined);
  const db = new PGlite();
  await db.exec(`
    DO $$ BEGIN CREATE ROLE anon; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
    DO $$ BEGIN CREATE ROLE authenticated; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
    DO $$ BEGIN CREATE ROLE service_role; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
    CREATE SCHEMA IF NOT EXISTS auth;
    CREATE TABLE IF NOT EXISTS auth.users (id uuid PRIMARY KEY, email text);
    CREATE OR REPLACE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql AS $$ SELECT NULL::uuid $$;
    SET search_path = public;`);
  await db.exec(parte("-- ===== TABLAS =====", "-- ===== RESTRICCIONES"));
  const restr = parte("-- ===== RESTRICCIONES", "-- ===== ÍNDICES").split("\n").filter((l) => l.startsWith("ALTER TABLE"));
  // PK y UNIQUE primero (los vínculos los necesitan), luego CHECK y vínculos.
  const omitidos = [];
  for (const fase of [/ PRIMARY KEY | UNIQUE /, / CHECK /, / FOREIGN KEY /])
    for (const l of restr.filter((x) => fase.test(x))) {
      try { await db.exec(l); }
      catch (e) {
        // Solo se tolera un vínculo hacia una tabla que no se exportó (no toca a los nodos).
        if (/ FOREIGN KEY /.test(l) && /does not exist/.test(String(e.message))) { omitidos.push(l.match(/CONSTRAINT (\S+)/)[1]); continue; }
        throw e;
      }
    }
  db.omitidos = omitidos;
  await db.exec(parte("-- ===== ÍNDICES", "-- ===== FUNCIONES"));
  const funcs = parte("-- ===== FUNCIONES DE LOS DISPARADORES =====", "-- ===== DISPARADORES").replace("-- ===== FUNCIONES DE LOS DISPARADORES =====", "");
  for (const f of funcs.split(/;\n\s*\n(?=CREATE OR REPLACE FUNCTION)/)) if (f.trim()) await db.exec(f.trim().replace(/;*\s*$/, ";"));
  await db.exec(parte("-- ===== DISPARADORES", "-- ===== ORDEN ACTUAL"));

  // ── datos reales ───────────────────────────────────────────────
  const nodos = lee("nodos_snapshot.json");
  for (const w of [...new Set(nodos.map((n) => n.world_id))])
    await db.query(`INSERT INTO worlds (id, name, order_index) VALUES ($1, $2, $1)`, [w, `Mundo ${w}`]);
  for (const r of lee("reglas.json"))
    await db.query(`INSERT INTO reglas (id, paso, tipo, canal, procedencia, resumen, cita_cerebro) VALUES ($1,$2,$3,$4,$5,$6,$7)`,
      [r.id, Number(r.paso) || 0, r.tipo, r.canal, r.procedencia, r.resumen, r.cita_cerebro]);
  for (const s of lee("skills_snapshot.json"))
    await db.query(`INSERT INTO skills (id, code, name, category, world_id_introduced, regla_id) VALUES ($1,$2,$3,$4,$5,$6)`,
      [s.id, s.code, s.name, s.category, s.world_id_introduced, s.regla_id]);
  for (const s of lee("node_skills_snapshot.json"))
    await db.query(`INSERT INTO node_skills (node_id, skill_id, relation, weight, is_primary) VALUES ($1,$2,$3,$4,$5)`,
      [s.node_id, s.skill_id, s.relation, s.weight, s.is_primary]);
  // orden real del mundo 3, tal como lo exportó la base
  const orden = Object.fromEntries([...esquema.matchAll(/^-- (\S+) @ order_index (\d+) \(world 3\)$/gm)].map((m) => [m[1], Number(m[2])]));
  const cuenta = {};
  for (const n of nodos) {
    const oi = n.world_id === 3 ? orden[n.id] : (cuenta[n.world_id] = (cuenta[n.world_id] ?? -1) + 1);
    if (oi === undefined) throw new Error(`el nodo ${n.id} no está en el orden exportado`);
    await db.query(`INSERT INTO nodes (id, world_id, name, order_index, node_type, practice_script, is_boss) VALUES ($1,$2,$3,$4,$5,$6,$7)`,
      [n.id, n.world_id, n.name, oi, n.node_type, n.practice_script ? JSON.stringify(n.practice_script) : null, n.node_type === "boss"]);
  }
  for (const c of lee("cards_snapshot.json"))
    await db.query(`INSERT INTO node_cards (node_id, card_order, card_type, title, body, flip_back_text) VALUES ($1,$2,$3,$4,$5,$6)`,
      [c.node_id, c.card_order, c.card_type, c.title, c.body, c.flip_back_text]);
  const cerebro = readFileSync(KB + "cerebro_snapshot.md", "utf8");
  let k = 0;
  for (const m of cerebro.split(/^# ([a-z_]+) \(version \d+\)\s*$/m).slice(1).reduce((a, x, i, arr) => (i % 2 ? a : [...a, [x, arr[i + 1]]]), []))
    await db.query(`INSERT INTO doctrina (version, section_key, order_index, title, body, is_active) VALUES (9,$1,$2,$1,$3,true)`, [m[0], k++, m[1]]);
  return db;
}
