// Mensaje 105 (28-oct-2026). Fuera del cierre, dos «no» seguidos son la señal
// de salir; en la puerta, seguir con su tema después del segundo es insistir.
// El evaluador casi nunca lo marcaba (G29). Igual que con la pregunta (mensaje
// 99): el evaluador anota HECHOS por turno —si la respuesta del cliente justo
// antes fue un «no», y si el vendedor se fue— y el código cuenta. El juez
// recibe la prueba de un «no» dentro de la regla. Y el juez ya puede decir
// no_aplica en un criterio cuya regla lo prevé (G42: el hueco que no había).
import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { fallasPorHechoDeLosNo, EVIDENCIA_INSISTE, REGLA_INSISTIR } from "../../../supabase/functions/_shared/hechos_no";
import { aplicarJuicios, acusacionesConPrueba, juiciosDeRespuesta, PROMPT_JUEZ } from "../../../supabase/functions/_shared/juez_pruebas";

const leer = (p: string) => readFileSync(join(process.cwd(), p), "utf8");
const voz = leer("supabase/functions/closer-voice/index.ts");
const red = leer("supabase/functions/harness-runner/index.ts");
const reglas: any[] = JSON.parse(leer("docs/kb/reglas.json"));
const nodos: any[] = JSON.parse(leer("docs/kb/nodos_snapshot.json"));
const harness = JSON.parse(leer("supabase/functions/_shared/eval_harness_v1.json"));
const regla = (id: string) => reglas.find((r) => r.id === id);
const caso = (id: string) => harness.cases.find((c: any) => c.id === id);

const guion = { failure_criteria: [
  { id: "debate_bloqueo", regla_id: "blocks.discute_bloqueo", severity: "critical" },
  { id: "insiste_tras_dos", regla_id: REGLA_INSISTIR, severity: "major" },
] };
const historia = (c: any) => c.transcript.map((t: any) => ({ role: t.role, content: t.text }));
/** Los hechos que anotaría el evaluador, uno por turno del vendedor. */
const hechos = (h: [string, string][]) => h.map(([cliente_antes, se_va], i) =>
  ({ turno: i + 1, texto_literal: "x", ultima_frase: "x", pregunta: "al_final", cliente_antes, se_va, veredicto: "cumple", por_que: "x" }));

describe("Primero la regla: la prueba de insistir trae la prueba de un «no»", () => {
  const flow = regla("flow.dos_no_seguidos").resumen as string;
  const pruebaNo = flow.slice(flow.indexOf("LA PRUEBA DE UN «NO»"));
  it("la misma prueba, letra por letra, en las dos reglas", () => {
    expect(pruebaNo).toMatch(/^LA PRUEBA DE UN «NO»: ¿la respuesta del cliente rechaza lo que el vendedor estaba intentando en ese momento/);
    expect(pruebaNo.endsWith("Seguidos: entre uno y otro la conversación no avanzó.")).toBe(true);
    expect(regla(REGLA_INSISTIR).resumen.endsWith(pruebaNo)).toBe(true);
  });
  it("la prueba de insistir pide los dos «no» y mira solo lo que sigue", () => {
    const r = regla(REGLA_INSISTIR).resumen;
    expect(r).toContain("LA PRUEBA: ¿el cliente dio dos «no» seguidos en la puerta y, después del segundo, el vendedor sigue con su tema");
    expect(r).toContain("Solo cuenta lo que dice después del segundo no.");
  });
  it("cabe entera en lo que recibe el juez", () => {
    expect(regla(REGLA_INSISTIR).resumen.length).toBeLessThanOrEqual(1200);
  });
  it("la regla sigue ligada a los seis nodos que la califican", () => {
    const ligados = nodos.filter((n) => n.practice_script?.failure_criteria?.some((f: any) => f.regla_id === REGLA_INSISTIR)).map((n) => n.id).sort();
    expect(ligados).toEqual(["2.10", "2.7c", "3.10", "5.15", "7.0", "7.4"]);
  });
});

describe("El código cuenta los «no» de la puerta", () => {
  it("G29: dos «no» seguidos y el vendedor sigue con su tema → insiste_tras_dos, citando lo que dijo", () => {
    const c = caso("G29_regla_de_los_no");
    const ev: any = { flags_detected: [], evidencia_flags: [], analisis_turnos: hechos([["no_hay", "no"], ["rechaza", "no"], ["rechaza", "no"], ["rechaza", "si"], ["no_rechaza", "si"]]) };
    expect(fallasPorHechoDeLosNo(ev, guion, historia(c))).toEqual(["insiste_tras_dos"]);
    expect(ev.flags_detected).toEqual(["insiste_tras_dos"]);
    expect(ev.evidencia_flags[0].cita).toBe("Claro, se nota que hoy no para. Nada más una cosa rápida: ¿usted mismo lleva el taller?");
    expect(ev.evidencia_flags[0].error).toBe(EVIDENCIA_INSISTE.error("Mire, de verdad no tengo tiempo ahorita."));
    expect(ev.evidencia_flags[0].mejora).toBe(EVIDENCIA_INSISTE.mejora);
  });
  it("G35 (2.7c): «nomás un minutito» después del segundo «no» → insiste_tras_dos", () => {
    const ev: any = { flags_detected: [], analisis_turnos: hechos([["no_hay", "no"], ["rechaza", "no"], ["rechaza", "no"]]) };
    expect(fallasPorHechoDeLosNo(ev, guion, historia(caso("G35_insiste_tras_dos_no")))).toEqual(["insiste_tras_dos"]);
  });
  it("G44: al segundo «no» queda de regresar → nada", () => {
    const ev: any = { flags_detected: [], analisis_turnos: hechos([["no_hay", "no"], ["rechaza", "no"], ["rechaza", "si"], ["no_rechaza", "si"]]) };
    expect(fallasPorHechoDeLosNo(ev, guion, historia(caso("G44_sale_al_segundo_no")))).toEqual([]);
    expect(ev.flags_detected).toEqual([]);
  });
  it("G45: la segunda respuesta es vaga, contesta: no son dos «no» → nada", () => {
    const ev: any = { flags_detected: [], analisis_turnos: hechos([["no_hay", "no"], ["rechaza", "no"], ["no_rechaza", "no"], ["no_rechaza", "si"]]) };
    expect(fallasPorHechoDeLosNo(ev, guion, historia(caso("G45_vago_no_es_no")))).toEqual([]);
  });
  it("se fue al primer «no»: no hay segundo, nada", () => {
    const h = [{ role: "user", content: "Buenas" }, { role: "assistant", content: "No me interesa" }, { role: "user", content: "Paso otro día" }, { role: "assistant", content: "Sale" }];
    const ev: any = { flags_detected: [], analisis_turnos: hechos([["no_hay", "no"], ["rechaza", "si"]]) };
    expect(fallasPorHechoDeLosNo(ev, guion, h)).toEqual([]);
  });
  it("solo la puerta: dos «no» seguidos más adelante (buscando el hueco, o en el cierre) no los cuenta este código", () => {
    const h: any[] = [];
    for (let i = 0; i < 5; i++) h.push({ role: "user", content: `v${i}` }, { role: "assistant", content: `c${i}` });
    const ev: any = { flags_detected: [], analisis_turnos: hechos([["no_hay", "no"], ["no_rechaza", "no"], ["no_rechaza", "no"], ["rechaza", "no"], ["rechaza", "no"]]) };
    expect(fallasPorHechoDeLosNo(ev, guion, h)).toEqual([]);
  });
  it("si el cliente habló primero, no es esta puerta: nada", () => {
    const h = [{ role: "assistant", content: "¿Qué se le ofrece?" }, { role: "user", content: "a" }, { role: "assistant", content: "No" }, { role: "user", content: "b" }, { role: "assistant", content: "No" }, { role: "user", content: "c" }];
    const ev: any = { flags_detected: [], analisis_turnos: hechos([["no_rechaza", "no"], ["rechaza", "no"], ["rechaza", "no"]]) };
    expect(fallasPorHechoDeLosNo(ev, guion, h)).toEqual([]);
  });
  it("falla abierta: hechos incompletos, inválidos o que no cuadran con la conversación → nada", () => {
    const h = historia(caso("G35_insiste_tras_dos_no"));
    const sinUno: any = { flags_detected: [], analisis_turnos: hechos([["no_hay", "no"], ["rechaza", "no"], ["rechaza", "no"]]) };
    delete sinUno.analisis_turnos[1].se_va;
    expect(fallasPorHechoDeLosNo(sinUno, guion, h)).toEqual([]);
    const invalido: any = { flags_detected: [], analisis_turnos: hechos([["no_hay", "no"], ["rechaza", "no"], ["quizá", "no"]]) };
    expect(fallasPorHechoDeLosNo(invalido, guion, h)).toEqual([]);
    const deMas: any = { flags_detected: [], analisis_turnos: hechos([["no_hay", "no"], ["rechaza", "no"], ["rechaza", "no"], ["rechaza", "no"]]) };
    expect(fallasPorHechoDeLosNo(deMas, guion, h)).toEqual([]);
    const noHayMal: any = { flags_detected: [], analisis_turnos: hechos([["no_hay", "no"], ["no_hay", "no"], ["rechaza", "no"]]) };
    expect(fallasPorHechoDeLosNo(noHayMal, guion, h)).toEqual([]);
  });
  it("dos mensajes seguidos del vendedor son un solo turno", () => {
    const h = [{ role: "user", content: "Buenas tardes." }, { role: "user", content: "¿Mucho trabajo?" }, { role: "assistant", content: "No me interesa." }, { role: "user", content: "Claro. ¿Y el negocio?" }, { role: "assistant", content: "Ya le dije que no." }, { role: "user", content: "Nomás un minutito." }];
    const ev: any = { flags_detected: [], analisis_turnos: hechos([["no_hay", "no"], ["rechaza", "no"], ["rechaza", "no"]]) };
    expect(fallasPorHechoDeLosNo(ev, guion, h)).toEqual(["insiste_tras_dos"]);
  });
  it("en un nodo sin la falla, nada; y si el evaluador ya la marcó, no la duplica", () => {
    const h = historia(caso("G35_insiste_tras_dos_no"));
    const ev: any = { flags_detected: [], analisis_turnos: hechos([["no_hay", "no"], ["rechaza", "no"], ["rechaza", "no"]]) };
    expect(fallasPorHechoDeLosNo(ev, { failure_criteria: [guion.failure_criteria[0]] }, h)).toEqual([]);
    const ya: any = { flags_detected: ["insiste_tras_dos"], evidencia_flags: [{ id: "insiste_tras_dos", cita: "c" }], analisis_turnos: hechos([["no_hay", "no"], ["rechaza", "no"], ["rechaza", "no"]]) };
    expect(fallasPorHechoDeLosNo(ya, guion, h)).toEqual([]);
    expect(ya.evidencia_flags).toHaveLength(1);
  });
});

describe("El evaluador anota los hechos y el juez revisa la acusación", () => {
  it("el evaluador: cliente_antes con la prueba de un «no», y se_va", () => {
    expect(voz).toContain('En "cliente_antes", qué hizo la respuesta del cliente justo antes de ese turno, con la prueba de un «no»');
    expect(voz).toContain('"no_rechaza" (contesta, aunque sea vago o corto, o pone una duda, una condición o una objeción)');
    expect(voz).toContain('"cliente_antes": "<rechaza | no_rechaza | no_hay>"');
    expect(voz).toContain('"se_va": "<si | no>"');
  });
  it("el código agrega la falla después del guardarraíl y ANTES del juez", () => {
    const guard = voz.indexOf("if (todosCumplen && evaluation.flags_detected.length > 0)");
    const hecho = voz.indexOf("fallasPorHechoDeLosNo(evaluation, practice_script, fullHistory)");
    const juez = voz.indexOf("acusacionesConPrueba(evaluation, practice_script");
    expect(guard).toBeGreaterThan(0);
    expect(hecho).toBeGreaterThan(guard);
    expect(juez).toBeGreaterThan(hecho);
    expect(voz).toContain("fallas_por_no: fallasPorNo.length");
  });
  it("el juez recibe la acusación con la prueba de un «no» dentro de la regla", () => {
    const ps = { failure_criteria: [{ id: "insiste_tras_dos", regla_id: REGLA_INSISTIR, severity: "major", regla_resumen: regla(REGLA_INSISTIR).resumen }] };
    const ev: any = { flags_detected: ["insiste_tras_dos"], evidencia_flags: [{ id: "insiste_tras_dos", cita: "Nada más una cosa rápida" }] };
    const [a] = acusacionesConPrueba(ev, ps);
    expect(a.regla).toContain("LA PRUEBA DE UN «NO»");
    expect(a.senalado).toBe("Nada más una cosa rápida");
  });
  it("la red reporta cuántas fallas agregó el código por cada hecho", () => {
    expect(red).toContain("por_hecho: parsed?.auditoria ? { pregunta: Number(parsed.auditoria.fallas_por_hecho ?? 0), no: Number(parsed.auditoria.fallas_por_no ?? 0) } : null,");
  });
});

describe("El juez puede decir no_aplica en un criterio cuya regla lo prevé (G42)", () => {
  const ps = {
    success_criteria: [{ id: "discovery.hueco", regla_resumen: regla("discovery.hueco").resumen }],
    failure_criteria: [{ id: "solo_levanta_pedido", regla_id: "develop.visita_tramite", regla_resumen: regla("develop.visita_tramite").resumen }],
  };
  const evaluacion = (): any => ({
    flags_detected: ["solo_levanta_pedido"],
    evidencia_flags: [{ id: "solo_levanta_pedido", cita: "Le traigo sus diez litros el jueves." }],
    veredictos_criterios: [{ criterio_id: "discovery.hueco", nivel: "no_cumple", falta: "no apareció ningún hueco" }],
    observations: [{ criterio_id: "discovery.hueco", error: "x", mejora: "y", ejemplo: "" }],
  });
  it("la regla del hueco dice cuándo es no_aplica, y el juez lo sabe", () => {
    expect(regla("discovery.hueco").resumen).toContain("el criterio es no_aplica");
    expect(PROMPT_JUEZ).toContain('Si la regla dice cuándo el criterio es no_aplica, y eso es lo que pasó en la conversación, la conducta es "no_aplica"');
    expect(PROMPT_JUEZ).toContain('"no_aplica" es solo para criterios.');
  });
  it("criterio en no_aplica: sale de la cuenta, sin falta ni observaciones; la falla se juzga aparte", () => {
    const ev = evaluacion();
    const q = aplicarJuicios(ev, acusacionesConPrueba(ev, ps), [
      { id: "discovery.hueco", tipo: "criterio", conducta: "no_aplica", razon: "Lo buscó bien y no había." },
      { id: "solo_levanta_pedido", tipo: "falla", conducta: "pasa" },
    ]);
    expect(ev.veredictos_criterios[0]).toEqual({ criterio_id: "discovery.hueco", nivel: "no_aplica" });
    expect(ev.observations).toEqual([]);
    expect(ev.flags_detected).toEqual([]);
    expect(q.map((x) => `${x.tipo}:${x.id}`)).toEqual(["falla:solo_levanta_pedido", "criterio:discovery.hueco"]);
  });
  it("no_aplica en una falla no existe: se ignora y la acusación se queda", () => {
    const ev = evaluacion();
    const q = aplicarJuicios(ev, acusacionesConPrueba(ev, ps), [{ id: "solo_levanta_pedido", tipo: "falla", conducta: "no_aplica" }]);
    expect(q).toEqual([]);
    expect(ev.flags_detected).toEqual(["solo_levanta_pedido"]);
  });
  it("la respuesta de la API acepta no_aplica", () => {
    const r = { content: [{ type: "tool_use", name: "juicios", input: { juicios: [{ id: "discovery.hueco", tipo: "criterio", respuesta: "No había hueco.", conducta: "no_aplica" }] } }] };
    expect(juiciosDeRespuesta(r)).toEqual([{ id: "discovery.hueco", tipo: "criterio", conducta: "no_aplica", razon: "No había hueco." }]);
  });
});

describe("La red", () => {
  it("G42: lo que contesta el cliente no es un «no»; el hueco es no_aplica porque lo buscó bien", () => {
    const e = caso("G42_intenta_de_verdad_sin_hueco").expected;
    expect(e.nota_v324).toBeUndefined();
    expect(e.nota_v325).toContain("CONTESTAN; no son «no»");
    expect(e.niveles_esperados).toEqual({ "discovery.hueco": "no_aplica" });
  });
  it("G45: la respuesta vaga no es un «no»", () => {
    const c = caso("G45_vago_no_es_no");
    expect(c.node_id).toBe("3.10");
    expect(c.expected.must_not_flag).toEqual(["insiste_tras_dos", "debate_bloqueo", "pitch_prematuro"]);
    expect(c.transcript[3].text).toBe("Pues de todo, joven, lo normal.");
  });
  it("G29 sigue pidiendo la falla", () => {
    expect(caso("G29_regla_de_los_no").expected.must_flag).toEqual(["insiste_tras_dos"]);
  });
});
