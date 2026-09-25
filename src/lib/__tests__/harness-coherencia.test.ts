// La red de seguridad no puede pudrirse en silencio.
//
// Sept-2026: el harness de evaluación apuntaba al nodo 0.1, borrado en la
// reconstrucción del Mundo 1 en agosto. Esperaba errores con nombres viejos
// (disculpa_inicial, fuera_de_scope) y un "monologo" que ningún nodo del Mundo
// 1 mide. Y desde que el evaluador exige node_id, fallaba en TODOS los casos.
// Nadie lo notó porque nada lo verificaba.
//
// Esta prueba corre en cada build, sin llamar al modelo, y garantiza que cada
// caso sea evaluable: si alguien borra un nodo o renombra un error, el build
// falla aquí y no el día que alguien intente usar la red.

import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const harness = JSON.parse(readFileSync(join(root, "supabase/functions/_shared/eval_harness_v1.json"), "utf8"));
const nodos: any[] = JSON.parse(readFileSync(join(root, "docs/kb/nodos_snapshot.json"), "utf8"));
const runner = readFileSync(join(root, "supabase/functions/harness-runner/index.ts"), "utf8");

const porId = new Map(nodos.map((n) => [n.id, n]));
const guion = (id: string) => {
  const ps = porId.get(id)?.practice_script;
  return typeof ps === "string" ? JSON.parse(ps) : ps;
};
const exito = (id: string) => new Set((guion(id)?.success_criteria ?? []).map((c: any) => c.id));
const falla = (id: string) => new Set((guion(id)?.failure_criteria ?? []).map((c: any) => c.id));
const casos: any[] = harness.cases;

describe("Harness: cada caso es evaluable contra un nodo vivo", () => {
  it("cada caso declara un nodo que existe y tiene práctica", () => {
    const malos = casos
      .filter((c) => !c.node_id || !guion(c.node_id))
      .map((c) => `${c.id} → ${c.node_id ?? "∅"}`);
    expect(malos).toEqual([]);
  });

  it("todo must_flag es un criterio de falla de SU nodo", () => {
    const malos = casos.flatMap((c) =>
      (c.expected?.must_flag ?? [])
        .filter((f: string) => !falla(c.node_id).has(f))
        .map((f: string) => `${c.id}: '${f}' no está en las fallas de ${c.node_id}`),
    );
    expect(malos).toEqual([]);
  });

  it("todo must_cite_positive es un criterio de éxito de SU nodo", () => {
    // criterios_cumplidos solo puede contener success_criteria: esperar otra
    // cosa hace el caso imposible de pasar.
    const malos = casos.flatMap((c) =>
      (c.expected?.must_cite_positive ?? [])
        .filter((s: string) => !exito(c.node_id).has(s))
        .map((s: string) => `${c.id}: '${s}' no es criterio de éxito de ${c.node_id}`),
    );
    expect(malos).toEqual([]);
  });

  it("todo must_cite_negative existe en SU nodo", () => {
    const malos = casos.flatMap((c) =>
      (c.expected?.must_cite_negative ?? [])
        .filter((s: string) => !exito(c.node_id).has(s) && !falla(c.node_id).has(s))
        .map((s: string) => `${c.id}: '${s}' no existe en ${c.node_id}`),
    );
    expect(malos).toEqual([]);
  });

  it("los rangos de score son coherentes", () => {
    const malos = casos
      .filter((c) => Array.isArray(c.expected?.score_range))
      .filter((c) => {
        const [lo, hi] = c.expected.score_range;
        return !(lo >= 0 && hi <= 100 && lo <= hi);
      })
      .map((c) => c.id);
    expect(malos).toEqual([]);
  });
});

describe("Harness: hay un caso por cada error encontrado practicando", () => {
  const ids = new Set(casos.map((c) => c.id));
  it("ejecución limpia sin observaciones (502 silencioso)", () => {
    expect(ids.has("G21_ejecucion_limpia_sin_observaciones")).toBe(true);
  });
  it("pregunta hablada sin signo", () => {
    expect(ids.has("G22_pregunta_hablada_sin_signo")).toBe(true);
  });
  it("curiosidad abierta", () => {
    expect(ids.has("G23_curiosidad_abierta")).toBe(true);
  });
});

describe("Harness: decisiones doctrinales pendientes", () => {
  // Visibles en cada corrida, sin tumbar el build: un build rojo por algo que
  // nadie ha decidido enseña a ignorar los builds rojos.
  for (const c of casos.filter((x) => x.pendiente_decision)) {
    it.todo(`${c.id}: ${c.pendiente_decision}`);
  }
});

describe("Harness: prueba de generalización", () => {
  // G24 demuestra que pitch_prematuro es un PRINCIPIO y no una lista: usa una
  // pregunta que no aparece como ejemplo en ningún lado. Si alguien la agrega a
  // los ejemplos, el caso deja de probar nada. Esta prueba lo impide.
  const g24 = casos.find((c) => c.id === "G24_pitch_prematuro_sin_ejemplo_listado");
  const reglas: any[] = JSON.parse(readFileSync(join(root, "docs/kb/reglas.json"), "utf8"));
  const evaluador = readFileSync(join(root, "supabase/functions/closer-voice/index.ts"), "utf8").toLowerCase();

  it("existe y espera pitch_prematuro", () => {
    expect(g24?.expected?.must_flag).toContain("pitch_prematuro");
  });

  it("su pregunta NO aparece como ejemplo en la regla ni en el prompt del evaluador", () => {
    const regla = String(reglas.find((r) => r.id === "opening.pitch_prematuro")?.resumen ?? "").toLowerCase();
    for (const clave of ["bodega", "espacio"]) {
      expect(regla).not.toContain(clave);
      expect(evaluador).not.toContain(clave);
    }
  });

  it("la regla está escrita como prueba, no como lista", () => {
    const regla = String(reglas.find((r) => r.id === "opening.pitch_prematuro")?.resumen ?? "");
    expect(regla).toMatch(/LA PRUEBA:/);
    expect(regla).toMatch(/no delimitan/);
  });
});

describe("Harness runner: invariantes", () => {
  it("manda node_id a closer-voice", () => {
    expect(runner).toMatch(/node_id: nodeId,/);
  });
  it("evalúa cada caso contra su propio nodo", () => {
    expect(runner).toMatch(/const caseNode = c\.node_id \?\? nodeId/);
  });
  it("aplica los chequeos universales a todos los casos", () => {
    expect(runner).toMatch(/CHEQUEOS UNIVERSALES/);
    expect(runner).toMatch(/corchetes de relleno/);
  });
  it("solo lo puede correr un manager", () => {
    expect(runner).toMatch(/prof\.role !== "manager"/);
  });
});
