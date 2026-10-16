// Práctica del 2.7c de Emilio (16-oct-2026): el Director cortó por una falla
// crítica antes de que el vendedor contestara el segundo "no"; "de volada" se
// leyó como pedir permiso; "Dos No Seguidos" salió como cumplido sin mostrarse;
// y el ejemplo de mejora pidió "dos minutos" y habló de producto.
import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { calcularScore } from "../../../supabase/functions/_shared/puntuacion";
import { pideTiempoOPermiso, quitarEjemplosQuePidenPermiso, PROMPT_AUDITOR } from "../../../supabase/functions/_shared/auditar_coaching";

const leer = (p: string) => readFileSync(join(process.cwd(), p), "utf8");
const director = leer("supabase/functions/director/index.ts");
const voz = leer("supabase/functions/closer-voice/index.ts");
const nodos: any[] = JSON.parse(leer("docs/kb/nodos_snapshot.json"));
const harness = JSON.parse(leer("supabase/functions/_shared/eval_harness_v1.json"));
const falla = (n: string, f: string) => nodos.find((x) => x.id === n).practice_script.failure_criteria.find((x: any) => x.id === f);

describe("El Director no corta por lo que el vendedor todavía no contesta", () => {
  it("el orden importa y una muletilla no es falla", () => {
    expect(director).toContain('const DIRECTOR_VERSION = "v2.4.0-sonnet"');
    expect(director).toContain("EL ORDEN IMPORTA.");
    expect(director).toContain("Si el último mensaje es del cliente, lo que el vendedor todavía no ha contestado no puede ser falla: false.");
    expect(director).toContain('Una muletilla no es una falla: "de volada"');
  });
  it("las fallas del 2.7c y el 2.7 lo dicen igual", () => {
    expect(falla("2.7c", "insiste_tras_dos").description).toContain("si todavia no ha contestado al segundo bloqueo, esta falla no aplica");
    for (const n of ["2.7", "2.7c"]) expect(falla(n, "pide_permiso_de_nuevo").description).toContain("Una muletilla como de volada, oiga o mire NO es pedir permiso.");
  });
  it("la red tiene la práctica real completa", () => {
    const c = harness.cases.find((x: any) => x.id === "G37_de_volada_no_es_permiso");
    expect(c.node_id).toBe("2.7c");
    expect(c.expected.must_not_flag).toContain("pide_permiso_de_nuevo");
    expect(harness.harness_version).toBe("v3.15.0");
  });
});

describe("'No aplica' no es 'cumplido'", () => {
  it("sale de la cuenta y no se muestra como cumplido", () => {
    const r = calcularScore({
      successCriteria: [{ id: "blocks.air", weight: 0.4 }, { id: "blocks.dos_no_seguidos", weight: 0.6 }],
      flags: [], failureCriteria: [],
      veredictos: [{ criterio_id: "blocks.air", nivel: "cumple" }, { criterio_id: "blocks.dos_no_seguidos", nivel: "no_aplica" }],
    });
    expect(r.score).toBe(100);
    expect(r.cumplidos).toEqual(["blocks.air"]);
  });
});

describe("Ningún ejemplo pide tiempo ni permiso", () => {
  it("detecta el ejemplo del 2.7c y deja pasar los buenos", () => {
    expect(pideTiempoOPermiso("Mire, ando visitando talleres de la zona y quería platicar con usted dos minutos sobre los aceites que maneja.")).toBe(true);
    expect(pideTiempoOPermiso("¿Me permite un momentito?")).toBe(true);
    expect(pideTiempoOPermiso("Claro, entiendo. ¿Le queda mejor que pase el jueves o el viernes?")).toBe(false);
    expect(pideTiempoOPermiso("¿Cuánto tiempo lleva con el negocio?")).toBe(false);
  });
  it("lo quita en código después del auditor, y el auditor lo tiene como regla", () => {
    const ev: any = { observations: [{ error: "x", mejora: "y", ejemplo: "Quería platicar con usted dos minutos." }], evidencia_flags: [], siguiente_nivel: [] };
    expect(quitarEjemplosQuePidenPermiso(ev)).toBe(1);
    expect(ev.observations[0]).toMatchObject({ mejora: "y", ejemplo: "" });
    expect(PROMPT_AUDITOR).toContain('nunca pedir ni anunciar tiempo ("dos minutos"');
    expect(voz).toContain("auditoria.ejemplos_con_permiso_quitados = quitarEjemplosQuePidenPermiso(evaluation);");
  });
  it("el auditor sabe el paso del nodo aunque sus criterios sean universales", () => {
    expect(voz).toContain("paso: pasoNodo ?? pasoPorMundo(node_id),");
    expect(voz).not.toContain("new Map(reglasSiguiente.map((r) => [r.id, 0]))");
    expect(voz).toContain('const PROMPT_VERSION = "v2.8.0";');
  });
});
