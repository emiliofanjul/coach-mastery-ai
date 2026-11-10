// Mensaje 163 (10-nov-2026). Dos causas de fondo del caso del 8-nov en el nodo 1.2, arregladas para todos
// los nodos:
//   1. LA MISMA VARA: lo que Closer le propone decir al vendedor pasa por las mismas pruebas con que se le
//      califica. (Closer le puso de ejemplo «¿esos son los que más se mueven?», y al intento siguiente le
//      marcó la falla crítica por preguntar «¿se venden mucho?».)
//   2. LO QUE BAJÓ LA NOTA SE VE, Y VA PRIMERO: todo criterio sin crédito completo tiene su observación.
//      (Se presentó con su nombre cuatro veces; en el primer intento perdió ese criterio y nadie se lo dijo.)
// Se prueba ejecutando la lógica, con un modelo de mentira.
import { describe, it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";
import {
  PROMPT_VARA, armarEntradaVara, fallasConPrueba, pasarPorLaVara, presupuestoVara, revisionesDeRespuesta, textosParaLaVara,
  type RevisionVara,
} from "../../../supabase/functions/_shared/vara_ejemplos";
import { MISION_DE_RESPALDO } from "../../../supabase/functions/_shared/auditar_coaching";
import { completarYOrdenarObservaciones, puntosPerdidos } from "../../../supabase/functions/_shared/observaciones_rubrica";
import { LARGO_REGLA_JUEZ } from "../../../supabase/functions/_shared/juez_pruebas";
import { vistaDePractica, type DetallePractica } from "@/lib/practicas-admin";

const leer = (r: string) => fs.readFileSync(path.join(process.cwd(), r), "utf8");
const reglas: any[] = JSON.parse(leer("docs/kb/reglas.json"));
const nodos: any[] = JSON.parse(leer("docs/kb/nodos_snapshot.json"));
const reglaPorId = new Map(reglas.map((r) => [r.id, r]));

/** El guion de un nodo como le llega a la función: cada falla con la regla completa. */
function guionDe(nodeId: string) {
  const n = nodos.find((x) => x.id === nodeId);
  const s = typeof n.practice_script === "string" ? JSON.parse(n.practice_script) : n.practice_script;
  return { ...s, failure_criteria: s.failure_criteria.map((f: any) => ({ ...f, regla_resumen: reglaPorId.get(f.regla_id)?.resumen })) };
}

// Lo que vio la vendedora en su tercer intento del 1.2 (8-nov).
const evaluacion = () => ({
  observations: [
    {
      criterio_id: "opening.personalizacion",
      error: "Tu observación fue genérica.",
      mejora: "Nombra algo concreto que viste ahí: el movimiento, que está lleno, un cambio, algo nuevo.",
      ejemplo: "Oiga, veo que tiene el estante lleno de limpiaparabrisas azules, ¿esos son los que más se mueven?",
    },
  ],
  evidencia_flags: [] as any[],
  mision: "Practica abrir sin presentarte: saluda, observa algo concreto que veas ahí y pregunta por eso.",
  siguiente_nivel: [{ regla_id: "discovery.escalera_capas", observacion: "En el descubrimiento, empieza por los hechos.", ejemplo: "¿Qué es lo que más se le mueve aquí?" }],
});
const conversacion = [
  { role: "user", content: "Buenos días, ¿cómo está? Soy Gabriela. Qué bonito tiene ahí su estante con el producto ese azul. ¿Qué es?" },
  { role: "assistant", content: "Bien, gracias. Ah, esos son los limpiaparabrisas, los azules." },
];

/** Un modelo de mentira: contesta lo que la prueba le diga, y guarda lo que le preguntaron. */
function modelo(contesta: (textos: { id: string; texto: string }[], llamada: number) => RevisionVara[] | null) {
  const entradas: any[] = [];
  const llamar = async (entrada: string) => {
    const e = JSON.parse(entrada);
    entradas.push(e);
    return contesta(e.textos, entradas.length);
  };
  return { llamar, entradas };
}
const pasa = (id: string): RevisionVara => ({ id, frase: "", respuesta: "No comete ninguna.", conducta: "pasa" });

describe("la vara son las pruebas de las fallas del nodo", () => {
  it("en el 1.2, las tres fallas traen su prueba completa", () => {
    const fallas = fallasConPrueba(guionDe("1.2"));
    expect(fallas.map((f) => f.id).sort()).toEqual(["pitch_prematuro", "pregunta_cerrada", "sin_pregunta"]);
    for (const f of fallas) expect(f.regla).toContain("LA PRUEBA");
    expect(fallas.find((f) => f.id === "pitch_prematuro")!.regla).toMatch(/operación comercial/);
  });
  it("sirve para todos los nodos: casi todas las fallas del mapa tienen prueba escrita", () => {
    let total = 0, conPrueba = 0;
    for (const n of nodos) {
      if (!n.practice_script) continue;
      const g = guionDe(n.id);
      total += g.failure_criteria.length;
      conPrueba += fallasConPrueba(g).length;
    }
    expect(total).toBeGreaterThan(200);
    expect(total - conPrueba).toBeLessThanOrEqual(1);
  });
  it("el juez de los textos recibe la regla entera, no un resumen recortado", () => {
    const g = guionDe("1.2");
    const e = JSON.parse(armarEntradaVara({ paso: 1, fallas: fallasConPrueba(g), textos: textosParaLaVara(evaluacion()), conversacion }));
    const pitch = e.fallas_del_nodo.find((f: any) => f.id === "pitch_prematuro");
    expect(pitch.regla).toBe(reglaPorId.get("opening.pitch_prematuro").resumen);
    for (const r of reglas) expect(String(r.resumen).length, r.id).toBeLessThanOrEqual(LARGO_REGLA_JUEZ);
  });
  it("pasan por la vara el ejemplo, la mejora y la misión de este nodo; «lo que viene después» no", () => {
    // Una pregunta de descubrimiento es correcta en el consejo del siguiente paso: tiene otras reglas.
    expect(textosParaLaVara(evaluacion()).map((t) => t.id)).toEqual(["obs0.mejora", "obs0.ejemplo", "mision"]);
  });
  it("el prompt aplica la prueba tal como está escrita y no castiga lo que solo falta", () => {
    expect(PROMPT_VARA).toContain("LA PRUEBA ES EL ALCANCE");
    expect(PROMPT_VARA).toContain("Es la misma prueba con que se califica al vendedor.");
    expect(PROMPT_VARA).toContain("COMETE el error");
    expect(PROMPT_VARA).toContain("Nombrar un error para evitarlo no es cometerlo");
    expect(presupuestoVara(3)).toBeGreaterThan(1500);
    expect(presupuestoVara(99)).toBe(6000);
  });
});

describe("lo que reprueba no llega al vendedor", () => {
  const corregido = "Oiga, veo que tiene el estante lleno de limpiaparabrisas azules, ¿siempre lo tiene así de surtido?";
  const reprueba = (extra: Partial<RevisionVara> = {}): RevisionVara => ({
    id: "obs0.ejemplo", frase: "¿esos son los que más se mueven?", respuesta: "Pide información de su operación comercial.", conducta: "reprueba", falla: "pitch_prematuro", ...extra,
  });

  it("si todo pasa, nada cambia y se pregunta una sola vez", async () => {
    const ev = evaluacion(), antes = JSON.stringify(ev);
    const m = modelo((ts) => ts.map((t) => pasa(t.id)));
    const r = await pasarPorLaVara({ ev, guion: guionDe("1.2"), paso: 1, conversacion, llamar: m.llamar });
    expect(r).toMatchObject({ revisados: 3, reprobados: 0, corregidos: 0, descartados: 0 });
    expect(JSON.stringify(ev)).toBe(antes);
    expect(m.entradas).toHaveLength(1);
  });

  it("el ejemplo que reprueba se corrige, y la corrección se vuelve a medir antes de salir", async () => {
    const ev = evaluacion();
    const m = modelo((ts, n) => (n === 1 ? ts.map((t) => (t.id === "obs0.ejemplo" ? reprueba({ corregido }) : pasa(t.id))) : ts.map((t) => pasa(t.id))));
    const r = await pasarPorLaVara({ ev, guion: guionDe("1.2"), paso: 1, conversacion, llamar: m.llamar });
    expect(r).toMatchObject({ revisados: 3, reprobados: 1, corregidos: 1, descartados: 0 });
    expect(ev.observations[0].ejemplo).toBe(corregido);
    expect(ev.observations[0].ejemplo).not.toMatch(/más se mueven/);
    // La segunda vuelta mide SOLO la corrección, con las mismas fallas.
    expect(m.entradas).toHaveLength(2);
    expect(m.entradas[1].textos).toEqual([{ id: "obs0.ejemplo", tipo: "ejemplo", texto: corregido }]);
    expect(m.entradas[1].fallas_del_nodo).toEqual(m.entradas[0].fallas_del_nodo);
    expect(r.detalle).toEqual([{ id: "obs0.ejemplo", tipo: "ejemplo", falla: "pitch_prematuro", frase: "¿esos son los que más se mueven?", por_que: "Pide información de su operación comercial.", quedo: "corregido" }]);
  });

  it("si la corrección vuelve a reprobar, el ejemplo no sale: mejor ninguno que uno que lo lleve a fallar", async () => {
    const ev = evaluacion();
    const m = modelo((ts, n) => (n === 1
      ? ts.map((t) => (t.id === "obs0.ejemplo" ? reprueba({ corregido: "¿y esos azules se le venden bien?" }) : pasa(t.id)))
      : ts.map((t) => reprueba({ id: t.id }))));
    const r = await pasarPorLaVara({ ev, guion: guionDe("1.2"), paso: 1, conversacion, llamar: m.llamar });
    expect(r).toMatchObject({ reprobados: 1, corregidos: 0, descartados: 1 });
    expect(ev.observations[0].ejemplo).toBe("");
    // Lo demás se queda como estaba.
    expect(ev.observations[0].mejora).toMatch(/^Nombra algo concreto/);
    expect(ev.mision).toMatch(/^Practica abrir/);
  });

  it("sin corrección propuesta, se descarta; una misión descartada cae en la de respaldo", async () => {
    const ev = evaluacion();
    const m = modelo((ts) => ts.map((t) => (t.id === "mision" ? reprueba({ id: "mision" }) : t.id === "obs0.ejemplo" ? reprueba() : pasa(t.id))));
    const r = await pasarPorLaVara({ ev, guion: guionDe("1.2"), paso: 1, conversacion, llamar: m.llamar });
    expect(r).toMatchObject({ reprobados: 2, corregidos: 0, descartados: 2 });
    expect(ev.observations[0].ejemplo).toBe("");
    expect(ev.mision).toBe(MISION_DE_RESPALDO);
    expect(m.entradas).toHaveLength(1); // no había corrección que medir
  });

  it("una «corrección» igual al texto original no cuenta como corrección", async () => {
    const ev = evaluacion();
    const m = modelo((ts) => ts.map((t) => (t.id === "obs0.ejemplo" ? reprueba({ corregido: t.texto }) : pasa(t.id))));
    const r = await pasarPorLaVara({ ev, guion: guionDe("1.2"), paso: 1, conversacion, llamar: m.llamar });
    expect(r.descartados).toBe(1);
    expect(ev.observations[0].ejemplo).toBe("");
  });

  it("si la vara no corre, o no revisa todos los textos, ningún ejemplo sin revisar llega", async () => {
    for (const contesta of [() => null, (ts: any[]) => [pasa(ts[0].id)], () => { throw new Error("modelo HTTP 529"); }]) {
      const ev = evaluacion();
      const m = modelo(contesta as any);
      const r = await pasarPorLaVara({ ev, guion: guionDe("1.2"), paso: 1, conversacion, llamar: m.llamar });
      expect(r).toMatchObject({ error: true, ejemplos_quitados: 1 });
      expect(ev.observations[0].ejemplo).toBe("");
      expect(ev.observations[0].mejora).toMatch(/^Nombra algo concreto/); // la mejora y la misión se quedan
      expect(m.entradas).toHaveLength(2); // dos intentos
    }
  });

  it("sin fallas con prueba, o sin textos, no se gasta una llamada", async () => {
    const m = modelo(() => null);
    const sinPrueba = { failure_criteria: [{ id: "x", description: "Algo sin prueba escrita." }] };
    expect(await pasarPorLaVara({ ev: evaluacion(), guion: sinPrueba, paso: 1, llamar: m.llamar })).toMatchObject({ revisados: 0, reprobados: 0 });
    expect(await pasarPorLaVara({ ev: { observations: [], mision: "" }, guion: guionDe("1.2"), paso: 1, llamar: m.llamar })).toMatchObject({ revisados: 0 });
    expect(m.entradas).toHaveLength(0);
  });

  it("la respuesta del modelo se lee de la herramienta; lo que no es una revisión válida se ignora", () => {
    const r = revisionesDeRespuesta({ content: [{ type: "tool_use", name: "revisiones", input: { revisiones: [
      { id: "a", frase: "x", respuesta: "y", conducta: "reprueba", falla: "pitch_prematuro", corregido: "  mejor así  " },
      { id: "b", frase: "", respuesta: "", conducta: "pasa", corregido: "" },
      { id: "c", conducta: "quién sabe" },
    ] } }] });
    expect(r).toEqual([
      { id: "a", frase: "x", respuesta: "y", conducta: "reprueba", falla: "pitch_prematuro", corregido: "mejor así" },
      { id: "b", frase: "", respuesta: "", conducta: "pasa" },
    ]);
    expect(revisionesDeRespuesta({ content: [{ type: "text", text: "hola" }] })).toBeNull();
  });
});

describe("lo que bajó la nota se ve, y va primero", () => {
  // El primer intento del 8-nov: perdió curiosidad abierta completa (20 puntos) y nadie se lo dijo.
  const desglose = [
    { criterio_id: "opening.estructura_apertura", peso: 0.4, nivel: "cumple", credito: 1 },
    { criterio_id: "opening.personalizacion", peso: 0.4, nivel: "parcial", credito: 0.333, falta: "Solo pregunta de cortesía genérica" },
    { criterio_id: "opening.curiosidad_abierta", peso: 0.2, nivel: "no_cumple", credito: 0, falta: "Se presenta de entrada diciendo su nombre" },
  ];
  const veredictos = [
    { criterio_id: "opening.personalizacion", nivel: "parcial", falta: "Solo pregunta de cortesía genérica" },
    { criterio_id: "opening.curiosidad_abierta", nivel: "no_cumple", falta: "se presenta de entrada diciendo su nombre en primera persona, antes de que el cliente pregunte quién es" },
  ];

  it("el criterio que perdió puntos y no tenía observación, ahora la tiene, con el motivo del propio veredicto", () => {
    const ev: any = { veredictos_criterios: veredictos, observations: [{ criterio_id: "opening.personalizacion", error: "Tus preguntas son genéricas.", mejora: "Observa algo concreto.", ejemplo: "Veo que tienen varios carros esperando…" }] };
    const r = completarYOrdenarObservaciones(ev, desglose);
    expect(r.agregadas).toEqual(["opening.curiosidad_abierta"]);
    expect(ev.observations.map((o: any) => o.criterio_id)).toEqual(["opening.personalizacion", "opening.curiosidad_abierta"]);
    // El motivo completo (el desglose lo trae recortado), sin inventar mejora ni ejemplo.
    expect(ev.observations[1]).toEqual({ criterio_id: "opening.curiosidad_abierta", error: "Se presenta de entrada diciendo su nombre en primera persona, antes de que el cliente pregunte quién es", mejora: "", ejemplo: "", de_la_rubrica: true });
  });

  it("van ordenadas por los puntos que costó cada una", () => {
    expect(puntosPerdidos(desglose[1])).toBeCloseTo(0.2668);
    expect(puntosPerdidos(desglose[2])).toBeCloseTo(0.2);
    expect(puntosPerdidos({ criterio_id: "x", peso: 0.5, nivel: "no_aplica", credito: 1 })).toBe(0);
    const ev: any = { veredictos_criterios: veredictos, observations: [
      { criterio_id: "opening.curiosidad_abierta", error: "Te presentaste.", mejora: "m", ejemplo: "" },
      { criterio_id: "algo.fuera_de_la_rubrica", error: "x", mejora: "m", ejemplo: "" },
      { criterio_id: "opening.personalizacion", error: "Genérica.", mejora: "m", ejemplo: "" },
    ] };
    completarYOrdenarObservaciones(ev, desglose);
    expect(ev.observations.map((o: any) => o.criterio_id)).toEqual(["opening.personalizacion", "opening.curiosidad_abierta", "algo.fuera_de_la_rubrica"]);
  });

  it("no agrega nada a una ejecución limpia, ni a un «no aplica», ni a un «cumple» de escalón, ni sin motivo", () => {
    const limpio: any = { veredictos_criterios: [], observations: [] };
    expect(completarYOrdenarObservaciones(limpio, [
      { criterio_id: "a", peso: 0.5, nivel: "cumple", credito: 1 },
      { criterio_id: "b", peso: 0.3, nivel: "no_aplica", credito: 1 },
      { criterio_id: "c", peso: 0.1, nivel: "cumple", credito: 0.333, falta: "escalón 1" },
      { criterio_id: "d", peso: 0.1, nivel: "no_cumple", credito: 0 },
    ]).agregadas).toEqual([]);
    expect(limpio.observations).toEqual([]);
  });
});

describe("en la función de calificación", () => {
  const voz = leer("supabase/functions/closer-voice/index.ts");
  it("la vara corre al final de las revisiones, sobre el texto que de verdad sale, y antes de armar las fallas", () => {
    const iVara = voz.indexOf("const vara = await pasarPorLaVara({");
    expect(iVara).toBeGreaterThan(voz.indexOf("auditoria.ejemplos_con_permiso_quitados = quitarEjemplosQuePidenPermiso(evaluation);"));
    expect(iVara).toBeGreaterThan(voz.indexOf("const segunda = await auditar(quitadasPorJuez);"));
    expect(iVara).toBeLessThan(voz.indexOf("(evaluation as any).fallas = fallasDe("));
  });
  it("en la evaluación solo van conteos: los ids de las fallas van al log", () => {
    expect(voz).toContain("const { detalle, ...conteos } = vara;");
    expect(voz).toContain("auditoria.vara = { ...conteos, latencia_ms: Date.now() - tVara };");
  });
  it("las observaciones se completan con la rúbrica ya calculada, antes de etiquetar los pasos", () => {
    const i = voz.indexOf("completarYOrdenarObservaciones(evaluation, rubrica.desglose)");
    expect(i).toBeGreaterThan(voz.indexOf("const rubrica = calcularScore({"));
    expect(i).toBeLessThan(voz.indexOf("etiquetarPasos(evaluation, practice_script, node_id, {"));
  });
  it("la llamada queda registrada con su fase, como todas las llamadas cortas", () => {
    expect(voz).toMatch(/tool_choice: \{ type: "tool", name: HERRAMIENTA_VARA\.name \},\s*\}, "vara", quien\)\);/);
  });
});

describe("la red de pruebas lo protege", () => {
  const red = JSON.parse(leer("supabase/functions/_shared/eval_harness_v1.json"));
  const corredor = leer("supabase/functions/harness-runner/index.ts");
  it("los dos intentos reales del 8-nov son casos permanentes", () => {
    const [, mayor, menor] = red.harness_version.match(/^v(\d+)\.(\d+)\./).map(Number);
    expect(mayor * 100 + menor).toBeGreaterThanOrEqual(342);
    const g117 = red.cases.find((c: any) => c.id === "G117_ejemplo_no_ensena_la_falla");
    const g118 = red.cases.find((c: any) => c.id === "G118_se_venden_mucho_es_trabajo_comercial");
    expect(g117.node_id).toBe("1.2");
    expect(g118.expected.must_flag).toEqual(["pitch_prematuro"]);
    // Los patrones atrapan los ejemplos que de verdad se le dieron, y no una pregunta legítima de apertura.
    const patrones = g117.expected.ejemplos_must_not_match.map((p: string) => new RegExp(p, "i"));
    const atrapa = (s: string) => patrones.some((p: RegExp) => p.test(s));
    expect(atrapa("Oiga, veo que tiene el estante lleno de limpiaparabrisas azules, ¿esos son los que más se mueven?")).toBe(true);
    expect(atrapa("Qué bonito el estante. ¿Se venden mucho?")).toBe(true);
    expect(atrapa("Veo que tienen varios carros esperando, ¿siempre está así de movido o ahorita les cayó todo junto?")).toBe(false);
    expect(atrapa("Veo que tiene bien surtido el estante, ¿así ha estado toda la semana?")).toBe(false);
  });
  it("revisa solo los ejemplos, y en todos los casos que la vara corrió y que lo que bajó la nota tiene observación", () => {
    expect(corredor).toContain("if (Array.isArray(exp.ejemplos_must_not_match)) {");
    expect(corredor).toContain("UNIVERSAL: los textos del coach no pasaron por la vara del nodo");
    expect(corredor).toContain("bajó la nota (${d.nivel}) y no tiene observación");
  });
});

describe("la pantalla y el panel", () => {
  it("una observación sin mejora ni ejemplo se muestra sin flecha: no hay nada que abrir", () => {
    const p = leer("src/routes/nodo.$nodeId.practica.tsx");
    expect(p).toContain("const hayMas = Boolean(obs.mejora?.trim() || obs.ejemplo?.trim());");
    expect(p).toContain("{obs.mejora?.trim() && <p");
  });
  it("el panel no llama «falla crítica» a un corte que la calificación no confirmó", () => {
    const base: DetallePractica = { id: "x", created_at: "2026-11-08T21:31:00Z", node_id: "1.2", nodo: null, vendedor: null, empresa: null, personal: false, audio_consent: false, audio_url: null, prompt_version: null, model: null, payload: { cut_reason: "critical_failure", evaluation: { fallas: [] } } };
    expect(vistaDePractica(base).termino).toBe("el Director cortó por una falla crítica que la calificación no confirmó");
    expect(vistaDePractica({ ...base, payload: { cut_reason: "critical_failure", evaluation: { fallas: [{ id: "pitch_prematuro", severidad: "critical" }] } } }).termino).toBe("falla crítica");
    expect(vistaDePractica({ ...base, payload: { cut_reason: "max_turns" } }).termino).toBe("se acabaron los turnos");
  });
});
