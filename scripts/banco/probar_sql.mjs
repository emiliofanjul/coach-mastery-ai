import { bancoVivo } from "./banco_vivo.mjs";
import { readFileSync } from "node:fs";
const db = await bancoVivo();
// dos vendedores reales en forma: uno ya pasó el BOSS 3.10, otro va en el 3.9
await db.exec(`
  INSERT INTO auth.users (id) VALUES ('aaaaaaaa-0000-0000-0000-000000000001'), ('aaaaaaaa-0000-0000-0000-000000000002');
  INSERT INTO companies (id, name) VALUES ('cccccccc-0000-0000-0000-000000000001', 'DALFAN');`);
for (const [i, u] of [[1, "aaaaaaaa-0000-0000-0000-000000000001"], [2, "aaaaaaaa-0000-0000-0000-000000000002"]]) {
  try { await db.query(`INSERT INTO profiles (id, company_id, role) VALUES ($1, 'cccccccc-0000-0000-0000-000000000001', 'vendedor')`, [u]); } catch (e) { throw e; }
  await db.query(`INSERT INTO sellers (id, profile_id, company_id) VALUES ($1, $2, 'cccccccc-0000-0000-0000-000000000001') ON CONFLICT DO NOTHING`, [`bbbbbbbb-0000-0000-0000-00000000000${i}`, u]);
}
await db.exec(`INSERT INTO node_progress (seller_id, company_id, node_id, status) VALUES
  ('bbbbbbbb-0000-0000-0000-000000000001','cccccccc-0000-0000-0000-000000000001','3.10','done'),
  ('bbbbbbbb-0000-0000-0000-000000000002','cccccccc-0000-0000-0000-000000000001','3.9','done')`);
const sql = readFileSync(process.argv[2], "utf8");
try {
  await db.exec("BEGIN;" + sql + "COMMIT;");
  await db.exec("BEGIN;" + sql + "COMMIT;"); // dos veces: debe quedar igual
} catch (e) {
  await db.exec("ROLLBACK;").catch(() => {});
  console.log("RECHAZADO:", String(e.message));
  process.exit(0);
}
const w = await db.query(`SELECT id, order_index FROM nodes WHERE world_id = 3 ORDER BY order_index`);
console.log("MUNDO 3:", w.rows.map((x) => `${x.id}@${x.order_index}`).join("  "));
const n = await db.query(`SELECT name, tipo_cliente, practice_script->'scope'->'skills_in_focus' foco FROM nodes WHERE id = '3.9b'`);
console.log("3.9b:", JSON.stringify(n.rows[0]));
const c = await db.query(`SELECT count(*)::int n FROM node_cards WHERE node_id = '3.9b'`);
const s = await db.query(`SELECT count(*)::int n, count(*) FILTER (WHERE is_primary)::int p FROM node_skills WHERE node_id = '3.9b'`);
const p = await db.query(`SELECT seller_id FROM node_progress WHERE node_id = '3.9b'`);
console.log("tarjetas:", c.rows[0].n, "| habilidades:", s.rows[0].n, "primarias:", s.rows[0].p, "| dado por hecho a:", p.rows.length);
const h = await db.query(`SELECT id, c->>'regla_id' r FROM nodes, jsonb_array_elements(practice_script->'success_criteria') c WHERE c->>'id' = 'discovery.hueco' ORDER BY id`);
console.log("regla del hueco:", h.rows.map((x) => `${x.id}→${x.r}`).join("  "));
console.log("ACEPTADO x2");
