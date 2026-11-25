// Mensaje 174 (24-nov-2026) · El porqué de cada falla, dónde va lo que se hizo
// antes de tiempo, y en qué paso de la línea recta está la práctica.
// Doc aprobado por Emilio: «Closer · La línea recta y el porqué».
import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { explicarPorQue, pasoDelNodo, type CatalogoPorque } from "../../../supabase/functions/_shared/porque";

const leer = (p: string) => readFileSync(join(process.cwd(), p), "utf8");
const nodos: any[] = JSON.parse(leer("docs/kb/nodos_snapshot.json"));
const sql = leer("docs/kb/porque_174_correr.sql");
const guion = (id: string) => nodos.find((n) => n.id === id).practice_script;

// El catálogo, leído del mismo SQL que va a la base: lo que se prueba es lo que se instala.
function catalogo(): CatalogoPorque {
  const bloque = (tabla: string) => {
    const ini = sql.indexOf(`INSERT INTO public.${tabla} `);
    return sql.slice(ini, sql.indexOf(";\n", ini));
  };
  const cadena = "'((?:[^']|'')*)'";
  const des = (s: string) => s.replace(/''/g, "'");
  const mecanismos = [...bloque("mecanismos").matchAll(new RegExp(`\\((\\d+), ${cadena}, ${cadena}\\)`, "g"))]
    .map((m) => ({ id: Number(m[1]), nombre: des(m[2]), porque: des(m[3]) }));
  const reglas_mecanismo = [...bloque("reglas_mecanismo").matchAll(new RegExp(`\\(${cadena}, (\\d+)\\)`, "g"))]
    .map((m) => ({ regla_id: des(m[1]), mecanismo_id: Number(m[2]) }));
  const va_despues = [...bloque("va_despues").matchAll(new RegExp(`\\(${cadena}, ${cadena}, ${cadena}\\)`, "g"))]
    .map((m) => ({ regla_id: des(m[1]), va_en: des(m[2]), porque: des(m[3]) }));
  return { mecanismos, reglas_mecanismo, va_despues };
}
const cat = catalogo();

describe("el catálogo del doc aprobado", () => {
  it("12 mecanismos, 4 de va_despues", () => {
    expect(cat.mecanismos.map((m) => m.id)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]);
    expect(cat.va_despues.map((v) => v.regla_id).sort()).toEqual(
      ["close.sigue_presentando", "consolidation.sigue_vendiendo", "discovery.receta_sin_diagnostico", "opening.pitch_prematuro"]);
  });
  it("toda regla que califica alguna práctica tiene su mecanismo, y solo esas", () => {
    const usadas = new Set<string>();
    for (const n of nodos) {
      const ps = n.practice_script;
      if (!ps) continue;
      for (const c of [...ps.failure_criteria, ...ps.success_criteria]) if (c.regla_id) usadas.add(c.regla_id);
    }
    expect(usadas.size).toBe(116);
    expect(new Set(cat.reglas_mecanismo.map((r) => r.regla_id))).toEqual(usadas);
    for (const r of cat.reglas_mecanismo) expect(r.mecanismo_id, r.regla_id).toBeGreaterThanOrEqual(1);
  });
  it("la tabla solo se lee, y sin BEGIN/COMMIT", () => {
    expect(sql).toContain("REVOKE INSERT, UPDATE, DELETE, TRUNCATE ON public.mecanismos, public.reglas_mecanismo, public.va_despues FROM anon, authenticated;");
    expect(sql).not.toMatch(/\bBEGIN;|\bCOMMIT;/);
  });
});

describe("explicarPorQue", () => {
  it("el caso de Carlos: pitch prematuro en el 2.2 dice dónde sí va y por qué", () => {
    const ev: any = { fallas: [{ id: "pitch_prematuro", error: "x", efecto: "y" }], observations: [] };
    explicarPorQue(ev, guion("2.2"), "2.2", cat);
    expect(ev.fallas[0].porque.mecanismo).toBe("La atención en tres tercios");
    expect(ev.fallas[0].porque.va_en).toBe("el paso 3 si es preguntar por su negocio, o el paso 4 si es ofrecer tu producto");
    expect(ev.fallas[0].porque.va_despues).toContain("se prende la alarma");
    expect(ev.linea).toEqual({ paso: 2 });
  });
  it("en el descubrimiento, recetar va en el paso 4", () => {
    const ev: any = { fallas: [{ id: "pitch_prematuro" }] };
    explicarPorQue(ev, guion("3.2"), "3.2", cat);
    expect(ev.fallas[0].porque.va_en).toBe("el paso 4, después de confirmarle el dolor");
  });
  it("una observación lleva el mecanismo de su criterio, sin «va después» si no es de antes de tiempo", () => {
    const ev: any = { fallas: [], observations: [{ criterio_id: "story.relevancia_cliente", error: "x" }] };
    explicarPorQue(ev, guion("2.2"), "2.2", cat);
    expect(ev.observations[0].porque.mecanismo).toBe("El volante");
    expect(ev.observations[0].porque.va_en).toBeUndefined();
  });
  it("el mundo 7 recorre la línea completa", () => {
    expect(pasoDelNodo("7.4")).toBeNull();
    expect(pasoDelNodo("1.2")).toBe(1);
    expect(pasoDelNodo("6.3")).toBe(6);
  });
  it("lo que no se encuentra no lleva porqué, y no se rompe nada", () => {
    const ev: any = { fallas: [{ id: "no_existe" }], observations: [{ criterio_id: "tampoco" }] };
    explicarPorQue(ev, guion("2.2"), "2.2", { mecanismos: [], reglas_mecanismo: [], va_despues: [] });
    expect(ev.fallas[0].porque).toBeUndefined();
    expect(ev.observations[0].porque).toBeUndefined();
    expect(() => explicarPorQue(null, null, null, cat)).not.toThrow();
  });
  it("todas las fallas de todos los nodos encuentran su porqué", () => {
    for (const n of nodos.filter((x) => x.practice_script)) {
      const ev: any = { fallas: n.practice_script.failure_criteria.map((f: any) => ({ id: f.id })), observations: [] };
      explicarPorQue(ev, n.practice_script, n.id, cat);
      for (const f of ev.fallas) {
        const conRegla = n.practice_script.failure_criteria.find((x: any) => x.id === f.id)?.regla_id;
        if (conRegla) expect(f.porque, `${n.id} ${f.id}`).toBeTruthy();
      }
    }
  });
});

describe("closer-voice pone el porqué sin tocar la nota", () => {
  const cv = leer("supabase/functions/closer-voice/index.ts");
  it("después de calcular la nota y las fallas, y sin tumbarla si falla", () => {
    const i = cv.indexOf("explicarPorQue(evaluation, practice_script, node_id, {");
    expect(i).toBeGreaterThan(cv.indexOf("(evaluation as any).fallas = fallasDe("));
    expect(i).toBeLessThan(cv.indexOf("const stars = estrellasDe(evaluation.score);"));
    expect(cv).toContain('console.warn("[closer-voice] sin porqué (fail-open):"');
  });
});

describe("la pantalla", () => {
  const ui = leer("src/routes/nodo.$nodeId.practica.tsx");
  it("la línea fija dice que sí cuenta lo que dice, pero no frases exactas", () => {
    expect(ui).toContain("No busco frases exactas: hay mil formas de decirlo bien. Lo que sí tiene que estar es la base: avanzar en la línea recta con lo que te enseñamos.");
    expect(ui).not.toContain("No califico tus palabras");
  });
  it("el ejemplo es una forma de decirlo, no la frase correcta", () => {
    expect(ui).toContain("Una forma de decirlo (con tus palabras está bien):");
    expect(ui.match(/<EjemploLibre ejemplo=/g)?.length).toBe(2);
  });
  it("cada falla y cada observación muestran su porqué; la línea dice dónde estás", () => {
    expect(ui.match(/<PorQueImporta porque=/g)?.length).toBe(2);
    expect(ui).toContain("{pasoLinea !== undefined && <LineaRecta paso={pasoLinea} />}");
  });
});
