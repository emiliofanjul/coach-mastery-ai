// Mensaje 182 (25-nov-2026) · Un bloqueo no es contestarte.
// En la prueba del 180 (2.7), el vendedor aceptó el bloqueo y en el mismo turno ofreció diez cubetas:
// sacó 100, porque el 2.7 y el 2.7c eran los únicos guiones del mundo 2 sin pitch_prematuro (Emilio:
// «Sí, que se califique»). El 181 lo agregó, pero dijo que después del bloqueo se valía preguntar por su
// negocio, y el evaluador lo contradijo; se regresó. Emilio decidió: después de aceptar un bloqueo, la
// pregunta va sobre él o sobre cómo le va; las de su negocio esperan a que entre a la plática. Y
// preguntarle cómo le va es sobre él, aunque mencione sus productos. Va en el Cerebro, la regla, la guía,
// los guiones y el aviso de alcance: una sola versión.
import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { PROMPT_ALCANCE, moldesDesde, textoDelAlcance } from "../../../supabase/functions/_shared/alcance";
import { LARGO_REGLA_JUEZ } from "../../../supabase/functions/_shared/juez_pruebas";

const leer = (p: string) => readFileSync(join(process.cwd(), p), "utf8");
const cerebro = leer("docs/kb/cerebro_snapshot.md");
const regla = JSON.parse(leer("docs/kb/reglas.json")).find((r: any) => r.id === "opening.pitch_prematuro");
const nodos: any[] = JSON.parse(leer("docs/kb/nodos_snapshot.json"));
const ps = (id: string) => nodos.find((n) => n.id === id).practice_script;
const pitch = (id: string) => ps(id).failure_criteria.find((f: any) => f.id === "pitch_prematuro");
const red = JSON.parse(leer("supabase/functions/_shared/eval_harness_v1.json"));
const caso = (id: string) => red.cases.find((c: any) => c.id === id);
const correr = leer("docs/kb/doctrina_182_correr.sql");
const regresar = leer("docs/kb/doctrina_182_regresar_correr.sql");
const d176 = leer("docs/kb/doctrina_176_datos.sql");
const guia176 = [...d176.matchAll(/^ {2}\(\$t\$([a-z_0-9]+)\$t\$, (\d+), \$t\$([\s\S]*?)\$t\$, \$t\$([\s\S]*?)\$t\$\)/gm)]
  .map((m) => ({ clave: m[1], orden: Number(m[2]), titulo: m[3], texto: m[4] }));

describe("una sola versión: un bloqueo no es contestarte", () => {
  it("el Cerebro lo dice en «Cuándo empiezan las preguntas de su negocio»", () => {
    const i = cerebro.indexOf("**Cuándo empiezan las preguntas de su negocio**");
    const parrafo = cerebro.slice(i, cerebro.indexOf("\n", i));
    expect(parrafo).toContain("Un bloqueo no es contestarte: si te dice");
    expect(parrafo).toContain("las de su negocio esperan a que entre a la plática");
    expect(parrafo).toContain("es sobre él aunque mencione sus productos");
    expect(cerebro).toContain(regla.cita_cerebro);
  });
  it("la regla lo dice en su prueba, y cabe entera para el juez", () => {
    expect(regla.resumen).toContain("Un bloqueo («ahorita ando ocupado», «no me interesa») no es contestarte: después de aceptarlo, la pregunta va sobre él o sobre cómo le va");
    expect(regla.resumen).toContain("aunque mencione su negocio o sus productos: preguntarle cómo le va no es pedirle información de su operación.");
    expect(regla.resumen.length).toBeLessThanOrEqual(LARGO_REGLA_JUEZ);
  });
  it("la guía del vendedor cambia en el molde del paso 2 y en los bloqueos", () => {
    expect(correr).toContain("Un bloqueo no es contestarte: después de aceptarlo, la pregunta sigue siendo sobre él o sobre cómo le va.");
    expect(correr).toContain("con una pregunta sobre él o sobre cómo le va, no de su negocio ni ofreciéndole nada.");
  });
});

describe("los guiones", () => {
  it("todo el mundo 2 con práctica califica el pitch prematuro, también el 2.7 y el 2.7c", () => {
    const conFallas = nodos.filter((n) => n.world_id === 2 && n.practice_script?.failure_criteria?.length);
    for (const n of conFallas) expect(pitch(n.id), n.id).toBeTruthy();
    for (const id of ["2.7", "2.7c"]) {
      expect(pitch(id)).toMatchObject({ regla_id: "opening.pitch_prematuro", severity: "critical" });
      const d = pitch(id).description;
      expect(d).toContain("Aceptar el bloqueo no da permiso de ofrecer ni de preguntarle por su negocio: un bloqueo no es contestarte.");
      expect(d).toContain("es sobre él aunque mencione sus productos, y no es esta falla.");
      expect(d).not.toContain("aunque sea con el bloqueo");
    }
    expect(pitch("2.7c").description).toContain("quedar de regresar con dos opciones de día («¿el jueves o el viernes?») no es ofrecer");
    expect([ps("2.7").version, ps("2.7c").version, ps("2.10").version]).toEqual(["2.1.1", "1.1.1", "2.1.7"]);
  });
  it("el 2.10 dice lo mismo que la regla", () => {
    expect(pitch("2.10").description).toContain("Un bloqueo no es contestarte: después de aceptarlo, la pregunta va sobre él o sobre cómo le va.");
  });
  it("lo que ya pedían el 2.7 y el 2.7c no cambia", () => {
    expect(ps("2.7").failure_criteria.map((f: any) => f.id)).toEqual(["discute_el_bloqueo", "se_disculpa_o_se_va", "pide_permiso_de_nuevo", "ignora_sin_aceptar", "pitch_prematuro"]);
    expect(ps("2.7c").failure_criteria.map((f: any) => f.id)).toEqual(["insiste_tras_dos", "discute_el_bloqueo", "se_va_al_primero", "pide_permiso_de_nuevo", "se_va_con_disculpa", "pitch_prematuro"]);
  });
});

describe("la red (v3.50.0) lo prueba en los dos sentidos", () => {
  it("después del bloqueo: ofrecer o preguntar por su negocio es pitch prematuro; cómo le va, no", () => {
    expect(red.harness_version).toBe("v3.50.0");
    expect(caso("G126_ofrece_despues_del_air").expected.must_flag).toEqual(["pitch_prematuro"]);
    expect(caso("G127_air_y_pregunta_de_su_negocio").expected.must_flag).toEqual(["pitch_prematuro"]);
    const g128 = caso("G128_air_y_como_le_va");
    expect(g128.expected.must_not_flag).toContain("pitch_prematuro");
    expect(g128.expected.feedback_must_not_match).toEqual(["es del paso [3-6]"]);
    for (const id of ["P2_7_perfecto", "P2_7c_perfecto"]) expect(caso(id).expected.must_not_flag).toContain("pitch_prematuro");
    expect(leer("docs/kb/eval_harness_v1.json")).toBe(leer("supabase/functions/_shared/eval_harness_v1.json"));
  });
});

describe("el aviso de alcance", () => {
  it("recibe «En cualquier paso» y «Cuando el cliente…», no los factores", () => {
    const m = moldesDesde(guia176, 2);
    expect(m).toContain("## En cualquier paso");
    expect(m).toContain("Cuando el cliente… · Bloqueos");
    expect(m).not.toContain("## Paso 1 · Introducción");
    expect(m).not.toContain("Los factores de impulso");
  });
  it("lo que la guía dice que toca en ese momento no es pasarse, y un bloqueo no es contestar", () => {
    expect(PROMPT_ALCANCE).toContain("Lo que la guía dice que se hace en ese momento NO es pasarse.");
    expect(PROMPT_ALCANCE).toContain("(un bloqueo no es contestarle)");
    expect(PROMPT_ALCANCE).toContain("con una pregunta sobre él o sobre cómo le va es lo que pide la guía");
    expect(PROMPT_ALCANCE).not.toContain("aunque sea con un bloqueo");
  });
  it("no da por bueno lo que cita: ahí aprendes cómo se hace", () => {
    expect(textoDelAlcance(5, "pedir el pedido")).toBe("Pedir el pedido es del paso 5, el cierre: lo vemos más adelante en el mapa, y ahí aprendes cómo se hace. Esto no te bajó la nota.");
  });
});

describe("el SQL", () => {
  it("sin BEGIN/COMMIT, con guardas, y el regreso deja todo como estaba", () => {
    for (const s of [correr, regresar]) expect(s).not.toMatch(/^\s*(BEGIN|COMMIT)\s*;/m);
    expect(correr).toContain("ya tiene el cambio del 182: no se aplica dos veces");
    expect(correr).toContain("no está en la versión 2.0.4");
    expect(correr).toContain("no está en la versión 1.0.5");
    expect(correr).toContain("no está en la versión 2.1.6");
    expect(regresar).toContain("la versión activa del Cerebro no es la del 182");
    expect(regresar).toContain("no termina en la falla que agregó el 182");
    expect(regresar).not.toMatch(/DROP/);
  });
});
