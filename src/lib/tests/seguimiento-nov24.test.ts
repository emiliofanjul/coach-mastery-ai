// Mensaje 171 (24-nov-2026) · Lo que buscamos en cada práctica, y el seguimiento
// entre intentos. Emilio: «necesitamos que en cada práctica sepamos qué es lo que
// buscamos enseñarle al vendedor, y darle el feedback correcto y con seguimiento».
// Doc aprobado: «Closer · Lo que buscamos en cada práctica».
import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { calcularSeguimiento, lineasDeSeguimiento, leerIntento, type Intento, type GuionDeNodo } from "../../../supabase/functions/_shared/seguimiento";

const leer = (p: string) => readFileSync(join(process.cwd(), p), "utf8");
const nodos: any[] = JSON.parse(leer("docs/kb/nodos_snapshot.json"));
const guionDe = (id: string): GuionDeNodo => {
  const n = nodos.find((x) => x.id === id);
  return { nombre: n.name, failure_criteria: n.practice_script.failure_criteria, success_criteria: n.practice_script.success_criteria };
};

// 5.10: criterios circulo_cierre (objection.circulo_de_cierre), bullet_theory (present.balas),
// close_with_action; fallas salta_la_bala (objection.cierra_sin_bala), discute_la_objecion, no_cierra.
const guiones: Record<string, GuionDeNodo> = { "5.10": guionDe("5.10"), "5.12": guionDe("5.12"), "1.2": guionDe("1.2") };
const linea = (criterio_id: string, nivel: string, credito: number, falta?: string) => ({ criterio_id, nivel, credito, ...(falta ? { falta } : {}) });
const todoBien510 = [linea("objections.circulo_cierre", "cumple", 1), linea("objections.bullet_theory", "cumple", 1), linea("flow.close_with_action", "cumple", 1)];
const intento = (node_id: string, criterios: any[], fallas: any[] = [], observations: any[] = []): Intento => ({ node_id, desglose: { criterios }, fallas, observations });

describe("ya lo corregiste", () => {
  it("lo que falló la última vez y hoy salió bien, con lo que se le dijo entonces", () => {
    const antes = intento("5.10",
      [linea("objections.circulo_cierre", "cumple", 1), linea("objections.bullet_theory", "no_cumple", 0, "no dio bala"), linea("flow.close_with_action", "cumple", 1)],
      [{ id: "salta_la_bala", error: "Cerraste sin bala después de la objeción." }],
      [{ criterio_id: "objections.bullet_theory", error: "Después de la objeción no soltaste ninguna bala." }]);
    const s = calcularSeguimiento(intento("5.10", todoBien510), [antes], guiones);
    expect(s.intentos_previos).toBe(1);
    expect(s.se_repite).toEqual([]);
    expect(s.corregido.map((c) => c.clave).sort()).toEqual(["objection.cierra_sin_bala", "present.balas"]);
    expect(s.corregido.find((c) => c.clave === "present.balas")?.antes).toBe("Después de la objeción no soltaste ninguna bala.");
  });
  it("si hoy no se pudo ver, no se dice que mejoró", () => {
    const antes = intento("5.10", [linea("objections.circulo_cierre", "cumple", 1), linea("objections.bullet_theory", "no_cumple", 0, "no dio bala"), linea("flow.close_with_action", "cumple", 1)],
      [{ id: "salta_la_bala", error: "Cerraste sin bala." }]);
    const hoy = intento("5.10", [linea("objections.circulo_cierre", "cumple", 1), linea("objections.bullet_theory", "no_aplica", 0), linea("flow.close_with_action", "cumple", 1)]);
    const s = calcularSeguimiento(hoy, [antes], guiones);
    expect(s.corregido).toEqual([]);
    expect(s.se_repite).toEqual([]);
  });
  it("una falla sin criterio solo se da por corregida si la conversación llegó a todo lo que el nodo mide", () => {
    const l = leerIntento(intento("5.10", [linea("objections.circulo_cierre", "cumple", 1), linea("objections.bullet_theory", "no_aplica", 0), linea("flow.close_with_action", "no_aplica", 0)]), guiones["5.10"]);
    expect(l.seVio("objection.discutir")).toBe(false);
    expect(leerIntento(intento("5.10", todoBien510), guiones["5.10"]).seVio("objection.discutir")).toBe(true);
  });
  it("se compara contra la última vez que se pudo ver, no contra un intento que no llegó", () => {
    const viejo = intento("5.10", [linea("objections.circulo_cierre", "cumple", 1), linea("objections.bullet_theory", "no_cumple", 0, "sin bala"), linea("flow.close_with_action", "cumple", 1)]);
    const cortado = intento("5.10", [linea("objections.circulo_cierre", "no_cumple", 0, "no llegó"), linea("objections.bullet_theory", "no_aplica", 0), linea("flow.close_with_action", "no_aplica", 0)]);
    const s = calcularSeguimiento(intento("5.10", todoBien510), [cortado, viejo], guiones);
    expect(s.corregido.map((c) => c.clave)).toEqual(expect.arrayContaining(["present.balas", "objection.circulo_de_cierre"]));
  });
});

describe("se repite", () => {
  const malo = (txt: string) => intento("5.10",
    [linea("objections.circulo_cierre", "cumple", 1), linea("objections.bullet_theory", "no_cumple", 0, txt), linea("flow.close_with_action", "cumple", 1)],
    [{ id: "salta_la_bala", error: txt }]);
  it("cuenta las veces en este nodo, con hoy, y usa lo que se le dijo hoy", () => {
    const s = calcularSeguimiento(malo("hoy"), [malo("ayer"), malo("antier")], guiones);
    const r = s.se_repite.find((x) => x.clave === "objection.cierra_sin_bala");
    expect(r?.veces_en_este_nodo).toBe(3);
    expect(r?.texto).toBe("hoy");
  });
  it("solo los últimos 3 intentos del nodo", () => {
    const s = calcularSeguimiento(malo("hoy"), [malo("1"), malo("2"), malo("3"), malo("4"), malo("5")], guiones);
    expect(s.intentos_previos).toBe(3);
    expect(s.se_repite[0].veces_en_este_nodo).toBe(4);
  });
  it("la misma regla en otro nodo se liga: es un solo hábito", () => {
    const otro = intento("5.12", [], [{ id: "salta_la_bala", error: "Cerraste sin bala en la segunda objeción." }]);
    const s = calcularSeguimiento(malo("hoy"), [otro], guiones);
    const r = s.se_repite.find((x) => x.clave === "objection.cierra_sin_bala");
    expect(r?.veces_en_este_nodo).toBe(1);
    expect(r?.otro_nodo).toEqual({ id: "5.12", nombre: guiones["5.12"].nombre });
  });
  it("lo que falla por primera vez y en ningún otro nodo no es seguimiento", () => {
    expect(calcularSeguimiento(malo("hoy"), [], guiones)).toEqual({ intentos_previos: 0, corregido: [], se_repite: [] });
  });
  it("un intento sin datos no rompe nada", () => {
    const s = calcularSeguimiento(intento("5.10", todoBien510), [{ node_id: "5.10" } as Intento, { node_id: "" } as Intento], guiones);
    expect(s.corregido).toEqual([]);
  });
});

describe("lo que lee el vendedor", () => {
  it("lo corregido primero; lo que se repite después, con el otro nodo", () => {
    const l = lineasDeSeguimiento({
      intentos_previos: 2,
      corregido: [{ clave: "a", antes: "Te disculpaste al entrar.", veces_antes: 2 }],
      se_repite: [{ clave: "b", texto: "Cerraste sin bala.", veces_en_este_nodo: 3, otro_nodo: { id: "5.10", nombre: "El Círculo en Vivo" } }],
    });
    expect(l.map((x) => x.tipo)).toEqual(["corregido", "se_repite"]);
    expect(l[0].texto).toBe("Ya lo corregiste: te pasó dos veces en tus intentos anteriores, y hoy no.");
    expect(l[1].texto).toBe("Se repite: van 3 veces en esta práctica. Esto es lo que hay que lograr. Y esto mismo te pasó en el 5.10 (El Círculo en Vivo): es un solo hábito, no errores sueltos.");
    expect(l[1].detalle).toBe("Cerraste sin bala.");
  });
});

describe("lo que buscamos: las 50 prácticas del doc aprobado", () => {
  const sql = leer("docs/kb/metas_171_correr.sql");
  it("cada nodo con práctica tiene su meta, y solo esos", () => {
    const conPractica = nodos.filter((n) => n.practice_script).map((n) => n.id);
    expect(conPractica.length).toBe(50);
    for (const id of conPractica) expect(sql, id).toContain(`  ('${id}', '`);
    expect(sql.match(/^ {2}\('/gm)?.length).toBe(50);
  });
  it("la tabla solo se lee; nadie la escribe desde la app", () => {
    expect(sql).toContain("REVOKE INSERT, UPDATE, DELETE, TRUNCATE ON public.metas_practica FROM anon, authenticated;");
    expect(sql).not.toMatch(/\bBEGIN;|\bCOMMIT;/);
  });
  it("las frases que Emilio editó en el doc van como quedaron", () => {
    expect(sql).toContain("La presión genera resistencia; quitarla la disuelve.");
    expect(sql).toContain("El primero que habla después de un cierre, pierde.");
    expect(sql).toContain("De las luces rojas se sale rápido y educadamente; tu tiempo va a las verdes y las amarillas.");
  });
});

describe("closer-voice: la meta y el seguimiento se agregan, la nota no cambia", () => {
  const cv = leer("supabase/functions/closer-voice/index.ts");
  it("se agregan a la calificación guardada, sin tumbarla si fallan", () => {
    expect(cv).toContain("await agregarMetaYSeguimiento(admin, resultado, practica as any, String(practiceSessionId));");
    expect(cv).toContain('console.warn("[closer-voice] sin meta ni seguimiento (fail-open):"');
    expect(cv).toContain("resultado.seguimiento = { ...seguimiento, lineas: lineasDeSeguimiento(seguimiento) };");
  });
  it("el evaluador no lee las metas: solo se muestran", () => {
    expect(cv.match(/from\("metas_practica"\)/g)?.length).toBe(1);
    const fn = cv.slice(cv.indexOf("async function agregarMetaYSeguimiento"), cv.indexOf("async function atender"));
    expect(fn).not.toMatch(/\.score\s*=|stars\s*=/);
  });
});

describe("la pantalla de resultados, en el orden acordado", () => {
  const ui = leer("src/routes/nodo.$nodeId.practica.tsx");
  it("lo que buscamos y si lo lograste, antes de la nota; tu avance después de lo que te faltó", () => {
    const i = (s: string) => { const k = ui.indexOf(s); expect(k, s).toBeGreaterThan(-1); return k; };
    expect(i("Lo que buscamos en esta práctica")).toBeLessThan(i("<AnilloCalificacion calificacion={score} />"));
    expect(i("¿Lo lograste?")).toBeLessThan(i("<AnilloCalificacion calificacion={score} />"));
    expect(i("{/* Observaciones */}")).toBeLessThan(i(">Tu avance</div>"));
    expect(i(">Tu avance</div>")).toBeLessThan(i("{consejos.length > 0 && <ConsejosParaLoQueViene"));
  });
  it("sí con 2 o 3 estrellas, casi con 1, todavía no con 0", () => {
    expect(ui).toContain('if (stars >= 2) return { titulo: "Sí, lo lograste."');
    expect(ui).toContain('if (stars === 1) return { titulo: "Casi."');
    expect(ui).toContain('return { titulo: "Todavía no."');
  });
});
