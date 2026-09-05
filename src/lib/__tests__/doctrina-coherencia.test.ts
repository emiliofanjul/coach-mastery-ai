// Coherencia doctrinal — corre en cada build.
//
// Verifica que nada de lo que Closer enseña o califica se haya desconectado
// de la doctrina. Si algo aquí falla, el build falla. Es la respuesta
// estructural a los tres fantasmas de sept-2026: el SCE inventado, la regla
// R2 sellada al revés, y el quiz del "10%" que no existía en ninguna parte.
//
// Lee los snapshots de docs/kb/ (estado vivo exportado de la base). Cuando
// cambies la base, regenera los snapshots o este test se quedará viejo.

import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const KB = join(process.cwd(), "docs/kb");
const read = (f: string) => readFileSync(join(KB, f), "utf8");

function norm(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[«»"“”'‘’¿?¡!.,;:()\[\]—–\-*`>|]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

type Regla = {
  id: string;
  paso: number;
  tipo: string;
  canal: string;
  cita_cerebro: string;
  severidad_sugerida: string | null;
};
type Nodo = { id: string; node_type?: string; practice_script?: any };

const cerebro = norm(read("cerebro_snapshot.md"));
const reglas: Regla[] = JSON.parse(read("reglas.json"));
const nodos: Nodo[] = JSON.parse(read(process.env.KB_NODOS ?? "nodos_snapshot.json"));
const quizzes: any[] = JSON.parse(read(process.env.KB_QUIZZES ?? "quizzes_snapshot.json"));
const cards: any[] = JSON.parse(read("cards_snapshot.json"));

const porId = new Map(reglas.map((r) => [r.id, r]));
const ORD: Record<string, number> = { minor: 0, major: 1, critical: 2 };

function criterios(n: Nodo) {
  const ps = typeof n.practice_script === "string" ? JSON.parse(n.practice_script) : n.practice_script;
  if (!ps) return [];
  const s = (ps.success_criteria ?? []).map((c: any) => ({ ...c, _tipo: "success" }));
  const f = (ps.failure_criteria ?? []).map((c: any) => ({ ...c, _tipo: "failure" }));
  return [...s, ...f];
}

describe("Procedencia: toda regla cita al Cerebro", () => {
  it("cada regla tiene cita literal que existe en el Cerebro", () => {
    const huerfanas = reglas.filter((r) => !cerebro.includes(norm(r.cita_cerebro)));
    expect(huerfanas.map((r) => r.id)).toEqual([]);
  });

  it("control negativo: las invenciones conocidas NO pasan", () => {
    const fantasmas = [
      "Identificarse con nombre y empresa es correcto y esperado",
      "solo el 10% de lo que comunicas son tus palabras",
      "SCE: Saludo, Conexion, Enfoque",
    ];
    for (const f of fantasmas) expect(cerebro.includes(norm(f))).toBe(false);
  });
});

describe("Criterios: todos ligados a una regla", () => {
  it("ningún criterio sin regla_id", () => {
    const sin = nodos.flatMap((n) => criterios(n).filter((c) => !c.regla_id).map((c) => `${n.id}:${c.id}`));
    expect(sin).toEqual([]);
  });

  it("ningún regla_id apunta a una regla inexistente", () => {
    const rotos = nodos.flatMap((n) =>
      criterios(n).filter((c) => c.regla_id && !porId.has(c.regla_id)).map((c) => `${n.id}:${c.id}→${c.regla_id}`),
    );
    expect(rotos).toEqual([]);
  });

  it("ningún criterio de falla apunta a una regla sin severidad", () => {
    const sin = nodos.flatMap((n) =>
      criterios(n)
        .filter((c) => c._tipo === "failure" && c.regla_id && !porId.get(c.regla_id)?.severidad_sugerida)
        .map((c) => `${n.id}:${c.id}→${c.regla_id}`),
    );
    expect(sin).toEqual([]);
  });
});

describe("Severidad: consistente salvo override declarado", () => {
  it("toda desviación del default está declarada con razón", () => {
    const silenciosas: string[] = [];
    for (const n of nodos) {
      for (const c of criterios(n)) {
        if (c._tipo !== "failure" || !c.regla_id) continue;
        const def = porId.get(c.regla_id)?.severidad_sugerida;
        if (def && c.severity && c.severity !== def && !c.severity_override?.razon) {
          silenciosas.push(`${n.id}:${c.id} ${c.severity}≠${def}`);
        }
      }
    }
    expect(silenciosas).toEqual([]);
  });

  it("un BOSS nunca baja la severidad de errores de su propio paso", () => {
    // Un error incidental de OTRO paso sí puede bajar (el BOSS de descubrimiento
    // no castiga igual una historia breve larga). Lo propio del paso, nunca.
    const bajadas: string[] = [];
    for (const n of nodos) {
      if (n.node_type !== "boss") continue;
      const mundo = Number(String(n.id).split(".")[0]);
      for (const c of criterios(n)) {
        const def = c.severity_override?.default;
        const regla = porId.get(c.regla_id);
        const propio = !!regla && (regla.paso === 0 || regla.paso === mundo);
        if (def && propio && ORD[c.severity] < ORD[def]) bajadas.push(`${n.id}:${c.id} ${c.severity}<${def}`);
      }
    }
    expect(bajadas).toEqual([]);
  });
});

describe("Canal: lo presencial no se califica en texto", () => {
  it("ninguna regla de canal presencial aparece como criterio de práctica", () => {
    const presenciales = new Set(reglas.filter((r) => r.canal === "presencial").map((r) => r.id));
    const mal = nodos.flatMap((n) =>
      criterios(n).filter((c) => presenciales.has(c.regla_id)).map((c) => `${n.id}:${c.id}→${c.regla_id}`),
    );
    expect(mal).toEqual([]);
  });
});

describe("Cobertura: lo que se exige se enseña", () => {
  it("cada regla usada como criterio tiene al menos un nodo con tarjetas en su paso", () => {
    const pasosConTarjetas = new Set(
      cards.map((c) => String(c.node_id).split(".")[0]).map((w) => Number(w)),
    );
    const usadas = new Set(nodos.flatMap((n) => criterios(n).map((c) => c.regla_id)));
    const sinEnsenar = [...usadas]
      .map((id) => porId.get(id))
      .filter((r): r is Regla => !!r && r.paso > 0 && !pasosConTarjetas.has(r.paso))
      .map((r) => r.id);
    expect(sinEnsenar).toEqual([]);
  });
});

describe("Quizzes: sin cifras que la doctrina no respalda", () => {
  it("todo porcentaje en un quiz existe en el Cerebro", () => {
    const cifrasCerebro = new Set(cerebro.match(/\d+\s*%/g) ?? []);
    const malas: string[] = [];
    for (const q of quizzes) {
      const txt = norm(
        [q.question_text, q.option_a, q.option_b, q.option_c, q.option_d, q.explanation_correct, q.explanation_wrong]
          .filter(Boolean)
          .join(" "),
      );
      for (const m of new Set(txt.match(/\d+\s*%/g) ?? [])) {
        if (!cifrasCerebro.has(m)) malas.push(`${q.node_id}#${q.question_order}: ${m}`);
      }
    }
    expect(malas).toEqual([]);
  });
});
