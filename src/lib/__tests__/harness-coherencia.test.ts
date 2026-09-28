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

  it("un caso que exige un flag CRITICAL tiene rango máximo 30", () => {
    // Regla de puntuación del evaluador: "Un flag critical DOMINA: score final
    // máximo 30". Sept-2026: cuatro casos esperaban 40-75 con un critical y la
    // red los reportaba como falla del evaluador, cuando la falla era del caso.
    const severidad = (nodo: string, flag: string) =>
      (guion(nodo)?.failure_criteria ?? []).find((f: any) => f.id === flag)?.severity;
    const malos = casos.flatMap((c) => {
      const tope = Array.isArray(c.expected?.score_range) ? c.expected.score_range[1] : null;
      if (tope === null) return [];
      const criticos = (c.expected?.must_flag ?? []).filter((f: string) => severidad(c.node_id, f) === "critical");
      return criticos.length > 0 && tope > 30
        ? [`${c.id}: exige ${criticos.join(", ")} (critical) pero su rango llega a ${tope}`]
        : [];
    });
    expect(malos).toEqual([]);
  });

  it("ningún transcript es un marcador en vez de una conversación", () => {
    // Sept-2026: G08 y G17 tenían como transcript una descripción entre
    // corchetes ("[monólogo de 200+ palabras…]"). El evaluador calificaba una
    // nota del autor y el caso contaba como aprobado sin probar nada.
    const falsos = casos.flatMap((c) =>
      (c.transcript ?? [])
        .filter((t: any) => /\[[^\]]{8,}\]/.test(String(t.text ?? "")))
        .map(() => c.id),
    );
    expect(falsos).toEqual([]);
  });

  it("dos casos no pueden tener la misma entrada", () => {
    // Sept-2026: G01 y G26 usaban la misma frase en el mismo nodo. Uno afirmaba
    // "cumple todos los criterios" y el otro "específica pero plana": las dos
    // cosas no pueden ser verdad. Sus rangos se cruzaban solo entre 85 y 90, y
    // G01 pasó una vez por caer en esa franja. Misma entrada = mismo caso: si
    // hacen falta dos expectativas sobre la misma conversación, van en uno solo.
    // (Los casos de consistencia usan transcript_ref y no cuentan aquí.)
    const vistos = new Map<string, string>();
    const repetidos: string[] = [];
    for (const c of casos.filter((x) => Array.isArray(x.transcript) && x.transcript.length > 0)) {
      const k = `${c.node_id}|${JSON.stringify(c.transcript)}`;
      if (vistos.has(k)) repetidos.push(`${vistos.get(k)} y ${c.id}`);
      else vistos.set(k, c.id);
    }
    expect(repetidos).toEqual([]);
  });

  it("los niveles esperados apuntan a criterios de éxito reales de su nodo", () => {
    const validos = new Set(["cumple", "parcial", "no_cumple"]);
    const malos = casos.flatMap((c) =>
      Object.entries(c.expected?.niveles_esperados ?? {}).flatMap(([id, nivel]) => [
        ...(exito(c.node_id).has(id) ? [] : [`${c.id}: '${id}' no es criterio de éxito de ${c.node_id}`]),
        ...(validos.has(String(nivel)) ? [] : [`${c.id}: nivel inválido '${nivel}'`]),
      ]),
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
  it("pregunta de cortesía cuenta (escalón 1)", () => {
    expect(ids.has("G25_pregunta_de_cortesia_cuenta")).toBe(true);
  });
  it("específica pero plana: vigila nombre del cliente y memoria inventada", () => {
    expect(ids.has("G26_especifica_pero_plana")).toBe(true);
  });
  it("buen ice breaker con cliente frío (la reacción no condena)", () => {
    expect(ids.has("G27_buen_ice_breaker_cliente_frio")).toBe(true);
  });
  it("curiosidad abierta", () => {
    expect(ids.has("G23_curiosidad_abierta")).toBe(true);
  });
});

// Decisiones doctrinales pendientes: visibles en cada corrida, sin tumbar el
// build. El bloque solo existe cuando hay pendientes — un bloque vacío lo
// cuenta el ejecutor de pruebas como falla, y permitir bloques vacíos en toda
// la configuración taparía errores reales en cualquier otra prueba.
const pendientes = casos.filter((x) => x.pendiente_decision);
if (pendientes.length > 0) {
  describe("Harness: decisiones doctrinales pendientes", () => {
    for (const c of pendientes) it.todo(`${c.id}: ${c.pendiente_decision}`);
  });
}

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

describe("Ejecuciones perfectas: auditables contra la doctrina escrita", () => {
  // Cada caso "perfecto" se construyó criterio por criterio. Estas pruebas
  // verifican, sin juicio humano, que la afirmación "es perfecto" sea completa.
  const perfectos = casos.filter((c) => c.tipo === "perfecto");
  const falla = (id: string) => new Set((guion(id)?.failure_criteria ?? []).map((c: any) => c.id));

  it("hay ejecuciones perfectas", () => {
    expect(perfectos.length).toBeGreaterThan(0);
  });
  it("cada una espera 'cumple' en TODOS los criterios de éxito de su nodo", () => {
    const malos = perfectos.flatMap((c) => {
      const esperados = c.expected?.niveles_esperados ?? {};
      return [...exito(c.node_id)].filter((id) => esperados[id as string] !== "cumple").map((id) => `${c.id}: ${id}`);
    });
    expect(malos).toEqual([]);
  });
  it("cada una prohíbe TODOS los errores de su nodo", () => {
    const malos = perfectos.flatMap((c) => {
      const prohibidos = new Set(c.expected?.must_not_flag ?? []);
      return [...falla(c.node_id)].filter((id) => !prohibidos.has(id)).map((id) => `${c.id}: ${id}`);
    });
    expect(malos).toEqual([]);
  });
  it("cada criterio de éxito tiene su frase en la traza, y la frase existe en lo que dijo el vendedor", () => {
    const malos = perfectos.flatMap((c) => {
      const dicho = (c.transcript ?? []).filter((t: any) => t.role === "user").map((t: any) => t.text).join(" \n ");
      return [...exito(c.node_id)].flatMap((id) => {
        const frase = c.traza?.[id as string];
        if (!frase) return [`${c.id}: sin traza para ${id}`];
        return dicho.includes(frase) ? [] : [`${c.id}: la frase de ${id} no aparece en la conversación`];
      });
    });
    expect(malos).toEqual([]);
  });
  it("cada una declara el contexto de su empresa", () => {
    expect(perfectos.filter((c) => !c.company_brain).map((c) => c.id)).toEqual([]);
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
    expect(runner).toMatch(/hueco de dato/);
  });
  it("procesa los casos con concurrencia acotada (transición hasta el paso 2)", () => {
    expect(runner).toMatch(/const CONCURRENCIA = \d+;/);
    expect(runner).toMatch(/Promise\.all\(Array\.from\(\{ length: Math\.min\(CONCURRENCIA/);
  });

  it("una excepción en un caso no tumba a los demás", () => {
    expect(runner).toMatch(/excepción del runner/);
  });

  it("la trampa universal vigila huecos de datos, no acotaciones", () => {
    expect(runner).toMatch(/HUECO_DE_DATO/);
    expect(runner).not.toMatch(/corchetes de relleno: "\$\{conCorchete/);
  });

  it("puede listar sus casos para que la página los corra uno por uno", () => {
    expect(runner).toMatch(/body\.listar === true/);
  });
  it("revisa las decisiones por criterio y las devuelve en cada resultado", () => {
    expect(runner).toMatch(/niveles_esperados/);
    expect(runner).toMatch(/veredictos: desgloseCrit\.map/);
  });

  it("verifica en todos los casos que la nota salió de la rúbrica", () => {
    expect(runner).toMatch(/la nota salió del plan B/);
  });

  it("puede verificar qué criticó el evaluador, no solo cómo lo redactó", () => {
    expect(runner).toMatch(/observations_must_not_target/);
  });

  it("soporta patrones que distinguen una acusación de su negación", () => {
    expect(runner).toMatch(/feedback_must_not_match/);
  });

  it("usa el contexto de empresa de cada caso", () => {
    expect(runner).toMatch(/companyBrain \?\? "Taller mecánico/);
  });

  it("solo lo puede correr un manager", () => {
    expect(runner).toMatch(/prof\.role !== "manager"/);
  });
});
