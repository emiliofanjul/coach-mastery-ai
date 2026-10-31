// Mensaje 95 (16-oct-2026). El evaluador también aplica las pruebas de las
// reglas: un juez revisa cada acusación cuya regla trae «LA PRUEBA» y quita la
// que no se sostiene (G38: marcó «pide permiso» citando «claro, claro»). Y la
// doctrina de Emilio: ir al grano («de rápido», «de volada», «nada más
// quería…») no es hacerse menos ni pedir permiso.
import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { acusacionesConPrueba, aplicarJuicios, juiciosDeRespuesta, armarEntradaJuez, PROMPT_JUEZ, HERRAMIENTA_JUICIOS } from "../../../supabase/functions/_shared/juez_pruebas";
import { armarEntradaAuditor, PROMPT_AUDITOR } from "../../../supabase/functions/_shared/auditar_coaching";

const leer = (p: string) => readFileSync(join(process.cwd(), p), "utf8");
const voz = leer("supabase/functions/closer-voice/index.ts");
const nodos: any[] = JSON.parse(leer("docs/kb/nodos_snapshot.json"));
const reglas: any[] = JSON.parse(leer("docs/kb/reglas.json"));
const harness = JSON.parse(leer("supabase/functions/_shared/eval_harness_v1.json"));
const regla = (id: string) => reglas.find((r) => r.id === id);
const nodo = (id: string) => nodos.find((n) => n.id === id);
const crit = (n: string, id: string) => nodo(n).practice_script.success_criteria.find((c: any) => c.id === id);

// Un guion como lo entrega v_nodes_resueltos: cada criterio con su regla.
const guion = () => ({
  success_criteria: [
    { id: "blocks.air", regla_resumen: "AIR. LA PRUEBA: ¿acepta, no discute y sigue?", contexto_nodo: "Pasa el primer bloqueo" },
    { id: "opening.personalizacion", regla_resumen: "Escalera. LA PRUEBA: ¿solo se lo puedes decir a él?", contexto_nodo: "" },
    { id: "sin.prueba", regla_resumen: "Una regla sin prueba.", contexto_nodo: "" },
  ],
  failure_criteria: [
    { id: "pide_permiso_de_nuevo", regla_resumen: "Aceptar y no retomar. LA PRUEBA: ¿pide permiso para seguir?", contexto_nodo: "Acepta y pide autorización" },
    { id: "otra_falla", regla_resumen: "Sin prueba.", contexto_nodo: "" },
  ],
});
const evaluacion = () => ({
  flags_detected: ["pide_permiso_de_nuevo", "otra_falla"],
  evidencia_flags: [{ id: "pide_permiso_de_nuevo", cita: "claro, claro" }, { id: "otra_falla", cita: "x" }],
  veredictos_criterios: [
    { criterio_id: "blocks.air", nivel: "parcial", falta: "no retoma" },
    { criterio_id: "opening.personalizacion", nivel: "parcial", escalon: 1, falta: "genérica" },
    { criterio_id: "sin.prueba", nivel: "no_cumple", falta: "y" },
  ],
  observations: [{ criterio_id: "blocks.air", error: "no retomaste" }, { criterio_id: "sin.prueba", error: "z" }],
});

describe("Qué se lleva al juez", () => {
  it("solo las acusaciones cuya regla trae LA PRUEBA, sin escaleras", () => {
    const a = acusacionesConPrueba(evaluacion(), guion());
    expect(a.map((x) => `${x.tipo}:${x.id}`)).toEqual(["falla:pide_permiso_de_nuevo", "criterio:blocks.air"]);
    expect(a[0].senalado).toBe("claro, claro");
    expect(a[1].senalado).toBe("no retoma");
  });
  it("un criterio que cumple no es una acusación", () => {
    const ev = evaluacion();
    ev.veredictos_criterios[0].nivel = "cumple";
    expect(acusacionesConPrueba(ev, guion()).map((x) => x.id)).toEqual(["pide_permiso_de_nuevo"]);
  });
  it("sin acusaciones con prueba no hay llamada", () => {
    expect(acusacionesConPrueba({ flags_detected: ["otra_falla"], veredictos_criterios: [] }, guion())).toEqual([]);
  });
  it("el juez recibe la conversación en orden, con quién dijo qué", () => {
    const e = JSON.parse(armarEntradaJuez(acusacionesConPrueba(evaluacion(), guion()), [{ role: "user", content: "Hola" }, { role: "assistant", content: "No me interesa" }]));
    expect(e.conversacion).toEqual([{ turno: 1, quien: "vendedor", dijo: "Hola" }, { turno: 2, quien: "cliente", dijo: "No me interesa" }]);
    expect(e.acusaciones[0].frase_que_cito_el_evaluador).toBe("claro, claro");
    expect(e.acusaciones[1].lo_que_el_evaluador_dice_que_falta).toBe("no retoma");
  });
});

describe("Lo que hace el código con los juicios", () => {
  it("una falla que no se sostiene sale de las fallas y de su evidencia", () => {
    const ev = evaluacion();
    const q = aplicarJuicios(ev, acusacionesConPrueba(ev, guion()), [{ id: "pide_permiso_de_nuevo", tipo: "falla", conducta: "pasa" }]);
    expect(q.map((x) => x.id)).toEqual(["pide_permiso_de_nuevo"]);
    expect(ev.flags_detected).toEqual(["otra_falla"]);
    expect(ev.evidencia_flags.map((e: any) => e.id)).toEqual(["otra_falla"]);
  });
  it("un criterio que no se sostiene pasa a cumple y salen sus observaciones", () => {
    const ev = evaluacion();
    aplicarJuicios(ev, acusacionesConPrueba(ev, guion()), [{ id: "blocks.air", tipo: "criterio", conducta: "pasa" }]);
    expect(ev.veredictos_criterios[0]).toEqual({ criterio_id: "blocks.air", nivel: "cumple" });
    expect(ev.observations.map((o: any) => o.criterio_id)).toEqual(["sin.prueba"]);
  });
  it("lo que se sostiene, o lo que el juez no contestó, se queda igual", () => {
    const ev = evaluacion();
    const q = aplicarJuicios(ev, acusacionesConPrueba(ev, guion()), [{ id: "pide_permiso_de_nuevo", tipo: "falla", conducta: "reprueba" }]);
    expect(q).toEqual([]);
    expect(ev).toEqual(evaluacion());
  });
  it("el juez nunca toca lo que no se le preguntó", () => {
    const ev = evaluacion();
    aplicarJuicios(ev, acusacionesConPrueba(ev, guion()), [{ id: "otra_falla", tipo: "falla", conducta: "pasa" }, { id: "sin.prueba", tipo: "criterio", conducta: "pasa" }]);
    expect(ev).toEqual(evaluacion());
  });
  it("lee la herramienta y descarta juicios sin decisión", () => {
    const r = { content: [{ type: "tool_use", name: HERRAMIENTA_JUICIOS.name, input: { juicios: [
      { id: "a", tipo: "falla", respuesta: "No: «claro, claro» acepta el bloqueo.", conducta: "pasa" },
      { id: "c", tipo: "criterio", respuesta: "x", conducta: "quizá" },
      { id: "b", tipo: "falla", respuesta: "?" },
    ] } }] };
    expect(juiciosDeRespuesta(r)).toEqual([{ id: "a", tipo: "falla", conducta: "pasa", razon: "No: «claro, claro» acepta el bloqueo." }]);
    expect(juiciosDeRespuesta({ content: [{ type: "text", text: "{}" }] })).toBeNull();
  });
  it("el juez aplica la prueba como alcance y no busca fallas nuevas", () => {
    expect(PROMPT_JUEZ).toContain("LA PRUEBA ES EL ALCANCE");
    expect(PROMPT_JUEZ).toContain("No buscas otras fallas");
  });
  it("mensaje 96: una sola pregunta para fallas y criterios — lo que hizo el vendedor, ¿pasa o reprueba? (y, desde el 105, no_aplica solo en criterios)", () => {
    expect(HERRAMIENTA_JUICIOS.input_schema.properties.juicios.items.properties.conducta.enum).toEqual(["pasa", "reprueba", "no_aplica"]);
    expect(JSON.stringify(HERRAMIENTA_JUICIOS)).not.toContain("se_sostiene");
    expect(PROMPT_JUEZ).toContain("Sé coherente: la misma frase no puede contar como bien hecha para una regla y como mal hecha para otra");
    expect(PROMPT_JUEZ).toContain("puede estar equivocado");
  });
});

describe("El juez en el evaluador", () => {
  it("corre antes del auditor y el auditor sabe qué se quitó", () => {
    expect(voz.indexOf("acusacionesConPrueba(evaluation, practice_script")).toBeGreaterThan(0);
    expect(voz.indexOf("acusacionesConPrueba(evaluation, practice_script")).toBeLessThan(voz.indexOf("const textos = textosDeEvaluacion(evaluation)"));
    expect(voz).toContain("tool_choice: { type: \"tool\", name: HERRAMIENTA_JUICIOS.name }");
    expect(voz).toMatch(/const PROMPT_VERSION = "v2\.9\.[2-9]"/);
  });
  it("mensaje 96: el juez y el auditor corren al mismo tiempo; si el juez quitó algo, se revisa otra vez", () => {
    expect(voz).toContain("const [juicios, primera] = await Promise.all([juzgar(), auditar([])]);");
    expect(voz).toContain("const segunda = await auditar(quitadasPorJuez);");
    // Lo del juez se aplica después del auditor: los ids del auditor son posiciones.
    expect(voz.indexOf("aplicarAuditoria(evaluation, primera.veredictos)")).toBeLessThan(voz.indexOf("quitadasPorJuez = aplicarJuicios(evaluation, acusaciones, juicios)"));
    expect(voz).toContain('console.log("[closer-voice] juez de las pruebas", { session_id, node_id, juicios });');
    expect(voz).toContain("auditoria.latencia_ms = Date.now() - tRevision;");
  });
  it("la red reporta el tiempo de cada caso y lo que hizo el juez", () => {
    const red = leer("supabase/functions/harness-runner/index.ts");
    expect(red).toContain("ms_revision: typeof parsed?.auditoria?.latencia_ms");
    expect(red).toContain("juez: parsed?.auditoria?.juez ?? null,");
  });
  it("en la respuesta van conteos, no ids (la red busca los ids prohibidos en toda la respuesta)", () => {
    expect(voz).toContain("const juez: any = { acusaciones: 0, fallas_quitadas: 0, criterios_corregidos: 0 }");
  });
  it("el auditor corrige cualquier texto que repita una acusación quitada", () => {
    expect(PROMPT_AUDITOR).toContain("7. ACUSACIONES QUE NO SE SOSTUVIERON");
    const sin = JSON.parse(armarEntradaAuditor({ paso: 2, fallas: [], reglas: [], textos: [] }));
    expect(sin.acusaciones_descartadas).toBeUndefined();
    const con = JSON.parse(armarEntradaAuditor({ paso: 2, fallas: [], reglas: [], textos: [], acusaciones_descartadas: [{ id: "pide_permiso_de_nuevo", tipo: "falla", razon: "acepta" }] }));
    expect(con.acusaciones_descartadas).toEqual([{ id: "pide_permiso_de_nuevo", tipo: "falla", por_que: "acepta" }]);
  });
});

describe("AIR con su prueba, alineado al Cerebro («no lo discutas, y continúa»)", () => {
  it("la regla de AIR es una prueba de tres movimientos", () => {
    expect(regla("blocks.air").resumen).toContain("LA PRUEBA:");
    expect(regla("blocks.air").resumen).toContain("sigue con la plática —con otra pregunta o con lo que iba a decir— sin pedir permiso");
    expect(regla("blocks.air").cita_cerebro).toBe("no lo discutas, y continúa"); // mensaje 112: la cita, letra por letra como en el Cerebro
    expect(readFileSync(join(process.cwd(), "docs/kb/cerebro_snapshot.md"), "utf8")).toContain(regla("blocks.air").cita_cerebro);
  });
  it("ningún nodo pide «retomar su tema»: se sigue con la plática", () => {
    for (const id of ["2.7", "2.7c", "2.10", "7.0"]) {
      expect(crit(id, "blocks.air").description).not.toMatch(/retoma/i);
      expect(crit(id, "blocks.air").description).toMatch(/sigue con la plática/i);
    }
  });
  it("versiones (las del 95, o posteriores)", () => {
    const desde = { "1.4": "2.0.4", "1.6": "2.0.4", "2.7": "2.0.4", "2.7c": "1.0.4", "2.10": "2.1.3", "7.0": "1.1.1" } as Record<string, string>;
    const num = (v: string) => v.split(".").map(Number).reduce((a, x) => a * 1000 + x, 0);
    for (const [id, v] of Object.entries(desde)) expect(num(nodo(id).practice_script.version)).toBeGreaterThanOrEqual(num(v));
  });
});

describe("Ir al grano no es hacerse menos (Emilio, 16-oct-2026)", () => {
  it("la regla de hacerse menos lo dice, y conserva lo que sí reprueba", () => {
    const r = regla("opening.se_disculpa").resumen;
    expect(r).toContain("Ir al grano no es hacerse menos: «de rápido», «de volada» o «nada más quería…»");
    expect(r).toContain("Lo que reprueba es pedir perdón o prometer que no le vas a quitar tiempo.");
    expect(r).toContain("«no le quito mucho tiempo»");
  });
  it("mensaje 96: la regla del arranque (opening.gasman) trae su prueba, así el juez la revisa", () => {
    const r = regla("opening.gasman").resumen;
    expect(r).toMatch(/^Entrar asumido y confiado, con la autoridad de quien debe estar ahí\. LA PRUEBA:/);
    expect(r).toContain("Ir al grano («de rápido», «de volada», «nada más quería…») es entrar asumido, no hacerse menos.");
  });
  it("el 1.4 y el 1.6 lo dicen en su criterio de arranque, y ir rápido no es encogerse", () => {
    for (const id of ["1.4", "1.6"]) expect(crit(id, "opening.arranque_sin_disculpa").description).toContain("Ir al grano no es minimizarse");
    const f = nodo("1.4").practice_script.failure_criteria.find((x: any) => x.id === "se_encoge");
    expect(f.description).not.toContain("se acorta");
    expect(f.description).toContain("Ir rapido y al grano, con energia, no es encogerse.");
  });
});

describe("La red", () => {
  const caso = (id: string) => harness.cases.find((c: any) => c.id === id);
  it("G38 exige AIR cumplido", () => {
    expect(caso("G38_no_pero_nada_mas_no_es_discutir").expected.niveles_esperados["blocks.air"]).toBe("cumple");
  });
  it("G39: «de rápido» y «nada más quería» en el 1.4 no son falla", () => {
    const c = caso("G39_de_rapido_no_es_hacerse_menos");
    expect(c.node_id).toBe("1.4");
    expect(c.expected.must_not_flag).toEqual(["se_disculpa", "pide_permiso", "se_encoge"]);
    expect(c.expected.niveles_esperados).toEqual({ "opening.arranque_sin_disculpa": "cumple" });
  });
  it("versión", () => expect(harness.harness_version).toMatch(/^v3\.(1[89]|[2-9]\d)\./));
});
