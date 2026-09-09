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
const skills: any[] = JSON.parse(read("skills_snapshot.json"));
const nodeSkills: any[] = JSON.parse(read("node_skills_snapshot.json"));

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

describe("Fuente única: node_skills manda", () => {
  // Tres lugares decían "qué entrena un nodo": node_skills (FK a skills), el
  // JSON scope.skills_in_focus, y los ids de success_criteria. El JSON aceptaba
  // cualquier cosa: así entró un criterio sin skill (sept-2026, nodos 1.2/1.6,
  // 422 en la práctica). Ahora node_skills es la fuente y la base valida al
  // escribir. Estas pruebas verifican el mismo invariante sobre los snapshots.
  const enTabla = new Set(nodeSkills.map((r: any) => `${r.node_id}|${r.skill_id}`));
  const catalogo = new Set(skills.filter((s: any) => s.status === "active").map((s: any) => s.id));
  const porSkill = new Map(skills.map((s: any) => [s.id, s]));

  it("cada criterio de éxito tiene su fila en node_skills", () => {
    const faltan: string[] = [];
    for (const n of nodos) {
      const ps = typeof n.practice_script === "string" ? JSON.parse(n.practice_script) : n.practice_script;
      for (const c of ps?.success_criteria ?? []) {
        if (!enTabla.has(`${n.id}|${c.id}`)) faltan.push(`${n.id}:${c.id}`);
      }
    }
    expect(faltan).toEqual([]);
  });

  it("cada fila de node_skills apunta a un skill activo", () => {
    const rotos = nodeSkills.filter((r: any) => !catalogo.has(r.skill_id)).map((r: any) => `${r.node_id}:${r.skill_id}`);
    expect(rotos).toEqual([]);
  });

  it("skills_in_focus es exactamente los ids de success_criteria (derivado, no dato)", () => {
    const dif: string[] = [];
    for (const n of nodos) {
      const ps = typeof n.practice_script === "string" ? JSON.parse(n.practice_script) : n.practice_script;
      if (!ps?.success_criteria) continue;
      const foco = [...(ps.scope?.skills_in_focus ?? [])].sort();
      const crit = ps.success_criteria.map((c: any) => c.id).sort();
      if (JSON.stringify(foco) !== JSON.stringify(crit)) dif.push(n.id);
    }
    expect(dif).toEqual([]);
  });

  it("todo skill medido por un criterio tiene regla_id, y coincide con la del criterio", () => {
    const mal: string[] = [];
    for (const n of nodos) {
      const ps = typeof n.practice_script === "string" ? JSON.parse(n.practice_script) : n.practice_script;
      for (const c of ps?.success_criteria ?? []) {
        const sk = porSkill.get(c.id);
        if (!sk?.regla_id) mal.push(`${n.id}:${c.id} sin regla_id`);
        else if (c.regla_id && sk.regla_id !== c.regla_id) mal.push(`${n.id}:${c.id} skill→${sk.regla_id} ≠ criterio→${c.regla_id}`);
      }
    }
    expect(mal).toEqual([]);
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

describe("Quizzes: cada pregunta evalúa una regla", () => {
  it("toda pregunta tiene regla_id y apunta a una regla existente", () => {
    const mal = quizzes
      .filter((q) => !q.regla_id || !porId.has(q.regla_id))
      .map((q) => `${q.node_id}#${q.question_order}→${q.regla_id ?? "∅"}`);
    expect(mal).toEqual([]);
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
