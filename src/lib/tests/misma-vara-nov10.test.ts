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
  PROMPT_VARA, armarEntradaVara, conversacionConLaFrase, fallasConPrueba, pasarPorLaVara, presupuestoVara, revisionesDeRespuesta, textosParaLaVara,
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

describe("dos filtros: la vara sospecha, el juez de las pruebas confirma", () => {
  const corregido = "Oiga, veo que tiene el estante lleno de limpiaparabrisas azules, ¿siempre lo tiene así de surtido?";
  const sospecha = (extra: Partial<RevisionVara> = {}): RevisionVara => ({
    id: "obs0.ejemplo", frase: "¿esos son los que más se mueven?", respuesta: "Pide información de su operación comercial.", conducta: "reprueba", falla: "pitch_prematuro", ...extra,
  });
  /** Un juez de mentira: decide por la frase que le llega como «frase_que_cito_el_evaluador». */
  function juezQue(decide: (frase: string, entrada: any) => "pasa" | "reprueba" | null) {
    const entradas: any[] = [];
    const juez = async (entrada: string) => {
      const e = JSON.parse(entrada);
      entradas.push(e);
      const a = e.acusaciones[0];
      const c = decide(a.frase_que_cito_el_evaluador, e);
      if (c === null) throw new Error("modelo HTTP 529");
      // Como el juez real: cita la frase en que se apoya, con su turno (la del vendedor, la última).
      const ultimo = e.conversacion[e.conversacion.length - 1];
      return [{ id: a.id, tipo: "falla", conducta: c, razon: c === "reprueba" ? "Le pide su operación comercial." : "No le pide nada de su operación.",
        citas: [{ turno: ultimo.turno, quien: ultimo.quien, dijo: ultimo.dijo }] }];
    };
    return { juez, entradas };
  }

  it("si la vara no sospecha nada, nada cambia y el juez no se llama", async () => {
    const ev = evaluacion(), antes = JSON.stringify(ev);
    const m = modelo((ts) => ts.map((t) => pasa(t.id)));
    const j = juezQue(() => "pasa");
    const r = await pasarPorLaVara({ ev, guion: guionDe("1.2"), paso: 1, conversacion, llamar: m.llamar, juez: j.juez });
    expect(r).toMatchObject({ revisados: 3, sospechosos: 0, confirmados: 0, absueltos: 0, corregidos: 0, descartados: 0 });
    expect(JSON.stringify(ev)).toBe(antes);
    expect(m.entradas).toHaveLength(1);
    expect(j.entradas).toHaveLength(0);
  });

  it("si el juez no confirma la sospecha, el texto se queda como estaba (el caso del 4.15 y el 5.8)", async () => {
    const ev = evaluacion(), antes = JSON.stringify(ev);
    const m = modelo((ts) => ts.map((t) => (t.id === "obs0.ejemplo" ? sospecha({ corregido }) : pasa(t.id))));
    const j = juezQue(() => "pasa");
    const r = await pasarPorLaVara({ ev, guion: guionDe("1.2"), paso: 1, conversacion, llamar: m.llamar, juez: j.juez });
    expect(r).toMatchObject({ sospechosos: 1, confirmados: 0, absueltos: 1, corregidos: 0, descartados: 0 });
    expect(JSON.stringify(ev)).toBe(antes);
    expect(r.detalle[0]).toMatchObject({ id: "obs0.ejemplo", juez: "pasa", quedo: "igual" });
  });

  it("mensaje 169: un «reprueba» que no cita la frase del coach no confirma nada (P4_12: el juez juzgó otros turnos)", async () => {
    const larga = [
      { role: "user", content: "Buenos días, don Beto. ¿Cuántos años lleva con el negocio, oiga?" },
      { role: "assistant", content: "Ya van para veinte." },
      { role: "user", content: "Oiga, veo que tiene el estante lleno de limpiaparabrisas azules. ¿Qué es?" },
      { role: "assistant", content: "Los limpiaparabrisas." },
    ];
    const ev = evaluacion(), antes = JSON.stringify(ev);
    const m = modelo((ts) => ts.map((t) => (t.id === "obs0.ejemplo" ? sospecha({ corregido }) : pasa(t.id))));
    // Reprueba, pero cita el turno 1 (de la práctica), no la frase del coach.
    const juezOtroTurno = async (entrada: string) => {
      const e = JSON.parse(entrada);
      return [{ id: e.acusaciones[0].id, tipo: "falla", conducta: "reprueba" as const, razon: "Pregunta qué se mueve más.",
        citas: [{ turno: 1, quien: "vendedor", dijo: "¿Cuántos años lleva con el negocio, oiga?" }] }];
    };
    const r = await pasarPorLaVara({ ev, guion: guionDe("1.2"), paso: 1, conversacion: larga, llamar: m.llamar, juez: juezOtroTurno });
    expect(r).toMatchObject({ sospechosos: 1, confirmados: 0, absueltos: 1, corregidos: 0, descartados: 0 });
    expect(JSON.stringify(ev)).toBe(antes);
    expect(r.detalle[0].razon_juez).toContain("el juez reprobó por otros turnos, no por el texto del coach");
    // Y sin citas tampoco.
    const ev2 = evaluacion(), antes2 = JSON.stringify(ev2);
    const sinCitas = async (entrada: string) => [{ id: JSON.parse(entrada).acusaciones[0].id, tipo: "falla", conducta: "reprueba" as const, razon: "x" }];
    const r2 = await pasarPorLaVara({ ev: ev2, guion: guionDe("1.2"), paso: 1, conversacion: larga, llamar: m.llamar, juez: sinCitas });
    expect(r2).toMatchObject({ confirmados: 0, absueltos: 1 });
    expect(JSON.stringify(ev2)).toBe(antes2);
  });

  it("el juez recibe la regla completa y una conversación donde el vendedor dice la frase en su momento", async () => {
    const m = modelo((ts) => ts.map((t) => (t.id === "obs0.ejemplo" ? sospecha() : pasa(t.id))));
    const j = juezQue(() => "pasa");
    await pasarPorLaVara({ ev: evaluacion(), guion: guionDe("1.2"), paso: 1, conversacion, llamar: m.llamar, juez: j.juez });
    const e = j.entradas[0];
    expect(e.acusaciones).toHaveLength(1);
    expect(e.acusaciones[0]).toMatchObject({ id: "pitch_prematuro", tipo: "falla", frase_que_cito_el_evaluador: "¿esos son los que más se mueven?" });
    expect(e.acusaciones[0].regla).toBe(reglaPorId.get("opening.pitch_prematuro").resumen);
    // La frase toma el lugar del turno del vendedor que corrige; lo que venía después se quita.
    expect(e.conversacion).toEqual([{ turno: 1, quien: "vendedor", dijo: "¿esos son los que más se mueven?" }]);
  });

  it("confirmada, sale la corrección, y la corrección pasa otra vez los dos filtros", async () => {
    const ev = evaluacion();
    const m = modelo((ts, n) => (n === 1 ? ts.map((t) => (t.id === "obs0.ejemplo" ? sospecha({ corregido }) : pasa(t.id))) : ts.map((t) => pasa(t.id))));
    const j = juezQue((frase) => (/más se mueven/.test(frase) ? "reprueba" : "pasa"));
    const r = await pasarPorLaVara({ ev, guion: guionDe("1.2"), paso: 1, conversacion, llamar: m.llamar, juez: j.juez });
    expect(r).toMatchObject({ sospechosos: 1, confirmados: 1, absueltos: 0, corregidos: 1, descartados: 0 });
    expect(ev.observations[0].ejemplo).toBe(corregido);
    expect(m.entradas).toHaveLength(2);
    expect(m.entradas[1].textos).toEqual([{ id: "obs0.ejemplo", tipo: "ejemplo", texto: corregido }]);
    expect(r.detalle[0]).toMatchObject({ juez: "reprueba", quedo: "corregido" });
  });

  it("si la corrección también la confirma el juez como falla, no sale nada: mejor ningún ejemplo que uno que lo lleve a fallar", async () => {
    const ev = evaluacion();
    const malo = "¿y esos azules se le venden bien?";
    const m = modelo((ts, n) => ts.map((t) => (t.id === "obs0.ejemplo" ? sospecha(n === 1 ? { corregido: malo } : { frase: malo }) : pasa(t.id))));
    const j = juezQue(() => "reprueba");
    const r = await pasarPorLaVara({ ev, guion: guionDe("1.2"), paso: 1, conversacion, llamar: m.llamar, juez: j.juez });
    expect(r).toMatchObject({ confirmados: 1, corregidos: 0, descartados: 1 });
    expect(ev.observations[0].ejemplo).toBe("");
    expect(ev.observations[0].mejora).toMatch(/^Nombra algo concreto/);
    expect(ev.mision).toMatch(/^Practica abrir/);
  });

  it("si la vara sospecha de la corrección pero el juez la absuelve, la corrección sale", async () => {
    const ev = evaluacion();
    const m = modelo((ts, n) => ts.map((t) => (t.id === "obs0.ejemplo" ? sospecha(n === 1 ? { corregido } : { frase: corregido }) : pasa(t.id))));
    const j = juezQue((frase) => (/más se mueven/.test(frase) ? "reprueba" : "pasa"));
    const r = await pasarPorLaVara({ ev, guion: guionDe("1.2"), paso: 1, conversacion, llamar: m.llamar, juez: j.juez });
    expect(r).toMatchObject({ corregidos: 1, descartados: 0 });
    expect(ev.observations[0].ejemplo).toBe(corregido);
  });

  it("confirmada y sin corrección, se descarta; una misión descartada cae en la de respaldo", async () => {
    const ev = evaluacion();
    const m = modelo((ts) => ts.map((t) => (t.id === "mision" ? sospecha({ id: "mision", frase: "pregúntale qué se le vende más" }) : t.id === "obs0.ejemplo" ? sospecha() : pasa(t.id))));
    const j = juezQue(() => "reprueba");
    const r = await pasarPorLaVara({ ev, guion: guionDe("1.2"), paso: 1, conversacion, llamar: m.llamar, juez: j.juez });
    expect(r).toMatchObject({ confirmados: 2, corregidos: 0, descartados: 2 });
    expect(ev.observations[0].ejemplo).toBe("");
    expect(ev.mision).toBe(MISION_DE_RESPALDO);
    expect(m.entradas).toHaveLength(1);
  });

  it("si el juez no puede revisar una sospecha, esa no sale; lo demás se queda", async () => {
    const ev = evaluacion();
    const m = modelo((ts) => ts.map((t) => (t.id === "obs0.ejemplo" ? sospecha({ corregido }) : pasa(t.id))));
    const j = juezQue(() => null);
    const r = await pasarPorLaVara({ ev, guion: guionDe("1.2"), paso: 1, conversacion, llamar: m.llamar, juez: j.juez });
    expect(r).toMatchObject({ sospechosos: 1, sin_juez: 1, descartados: 1, corregidos: 0 });
    expect(ev.observations[0].ejemplo).toBe("");
    expect(ev.observations[0].mejora).toMatch(/^Nombra algo concreto/);
    expect(j.entradas).toHaveLength(2); // dos intentos
  });

  it("una sospecha con una falla que el nodo no tiene no se sostiene", async () => {
    const ev = evaluacion(), antes = JSON.stringify(ev);
    const m = modelo((ts) => ts.map((t) => (t.id === "obs0.ejemplo" ? sospecha({ falla: "vacia_el_cargador" }) : pasa(t.id))));
    const j = juezQue(() => "reprueba");
    const r = await pasarPorLaVara({ ev, guion: guionDe("1.2"), paso: 1, conversacion, llamar: m.llamar, juez: j.juez });
    expect(r).toMatchObject({ absueltos: 1, confirmados: 0 });
    expect(JSON.stringify(ev)).toBe(antes);
    expect(j.entradas).toHaveLength(0);
  });

  it("si la vara no corre, o no revisa todos los textos, ningún ejemplo sin revisar llega", async () => {
    for (const contesta of [() => null, (ts: any[]) => [pasa(ts[0].id)], () => { throw new Error("modelo HTTP 529"); }]) {
      const ev = evaluacion();
      const m = modelo(contesta as any);
      const r = await pasarPorLaVara({ ev, guion: guionDe("1.2"), paso: 1, conversacion, llamar: m.llamar, juez: juezQue(() => "pasa").juez });
      expect(r).toMatchObject({ error: true, ejemplos_quitados: 1 });
      expect(ev.observations[0].ejemplo).toBe("");
      expect(ev.observations[0].mejora).toMatch(/^Nombra algo concreto/);
      expect(m.entradas).toHaveLength(2);
    }
  });

  it("sin fallas con prueba, o sin textos, no se gasta una llamada", async () => {
    const m = modelo(() => null);
    const j = juezQue(() => "pasa");
    const sinPrueba = { failure_criteria: [{ id: "x", description: "Algo sin prueba escrita." }] };
    expect(await pasarPorLaVara({ ev: evaluacion(), guion: sinPrueba, paso: 1, llamar: m.llamar, juez: j.juez })).toMatchObject({ revisados: 0, sospechosos: 0 });
    expect(await pasarPorLaVara({ ev: { observations: [], mision: "" }, guion: guionDe("1.2"), paso: 1, llamar: m.llamar, juez: j.juez })).toMatchObject({ revisados: 0 });
    expect(m.entradas).toHaveLength(0);
    expect(j.entradas).toHaveLength(0);
  });

  it("la frase toma el lugar del turno del vendedor que más se le parece", () => {
    const conv = [
      { role: "user", content: "Con la entrega cada martes ya no se queda sin 15W40, don Chuy. ¿Se la traigo este martes?" },
      { role: "assistant", content: "Es que ya tengo proveedor de años." },
      { role: "user", content: "Entiendo cómo se siente, don Chuy. Otros clientes sintieron lo mismo." },
      { role: "assistant", content: "Pues... déjeme lo pienso." },
    ];
    const ej = "Entiendo cómo se siente, don Chuy. Otros clientes sintieron lo mismo, y lo que encontraron fue que les convino.";
    expect(conversacionConLaFrase(conv, ej, ej)).toEqual([conv[0], conv[1], { role: "user", content: ej }]);
    // Si ninguno se parece, el último turno del vendedor.
    expect(conversacionConLaFrase(conv, "zzz", "zzz")).toEqual([conv[0], conv[1], { role: "user", content: "zzz" }]);
    expect(conversacionConLaFrase([], "x", "Hola")).toEqual([{ role: "user", content: "Hola" }]);
  });

  it("el prompt de la vara sabe que solo marca sospechas", () => {
    expect(PROMPT_VARA).toContain("lo revisa después el juez que califica al vendedor");
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
    // La de la calificación (probar_vara también llama a la vara, con textos fijos).
    const iVara = voz.indexOf("llamar: (entrada, textos) => llamarVara(apiKey, entrada, quienVara, textos),");
    expect(iVara).toBeGreaterThan(0);
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
  it("las llamadas quedan registradas con su fase, como todas las llamadas cortas", () => {
    expect(voz).toMatch(/tool_choice: \{ type: "tool", name: HERRAMIENTA_VARA\.name \},\s*\}, "vara", quien\)\);/);
    // El segundo filtro es el juez de las pruebas, con su propia fase para medir lo que cuesta.
    expect(voz).toContain('juez: (entrada, acusaciones) => llamarJuez(apiKey, entrada, quienVara, acusaciones, "vara_juez"),');
  });
  it("la red puede probar la vara con textos fijos, y solo la red", () => {
    expect(voz).toContain('if ((body as any).phase === "probar_vara") {');
    expect(voz).toContain('if (quien.tipo !== "servicio") return respuestaJson(403, { error: "probar_vara es solo para la red de seguridad" });');
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
  it("protege lo bueno: los ejemplos correctos que la primera vara cambió quedan como casos que deben quedar igual", () => {
    const [, mayor, menor] = red.harness_version.match(/^v(\d+)\.(\d+)\./).map(Number);
    expect(mayor * 100 + menor).toBeGreaterThanOrEqual(343);
    const vara = red.cases.filter((c: any) => Array.isArray(c.vara_textos));
    expect(vara.map((c: any) => c.id)).toEqual([
      "V1_4_15_conviccion_se_queda_prueba_cambia", "V2_5_8_fff_con_una_bala_se_queda_cargador_cambia", "V3_1_2_ejemplo_que_ensena_la_falla_cambia_aperturas_buenas_se_quedan",
      // Mensaje 169: la misión se juzga por su texto, no por los turnos de la práctica.
      "V4_4_12_mision_se_juzga_por_su_texto",
    ]);
    const debe = vara.flatMap((c: any) => c.vara_textos.map((t: any) => t.debe));
    expect(debe.filter((d: string) => d === "quedar_igual")).toHaveLength(5);
    expect(debe.filter((d: string) => d === "cambiar")).toHaveLength(4);
    // Cada caso tiene un turno del vendedor que la frase reemplaza.
    for (const c of vara) expect(c.transcript.some((t: any) => t.role === "user"), c.id).toBe(true);
    expect(corredor).toContain("async function casoDeVara(");
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
    // Mensaje 174: su porqué también se abre; sin mejora, ejemplo ni porqué, sigue sin flecha.
    expect(p).toContain("const hayMas = Boolean(obs.mejora?.trim() || obs.ejemplo?.trim() || porQueValido(obs.porque));");
    expect(p).toContain("{obs.mejora?.trim() && <p");
  });
  it("el panel no llama «falla crítica» a un corte que la calificación no confirmó", () => {
    const base: DetallePractica = { id: "x", created_at: "2026-11-08T21:31:00Z", node_id: "1.2", nodo: null, vendedor: null, empresa: null, personal: false, audio_consent: false, audio_url: null, prompt_version: null, model: null, payload: { cut_reason: "critical_failure", evaluation: { fallas: [] } } };
    expect(vistaDePractica(base).termino).toBe("el Director cortó por una falla crítica que la calificación no confirmó");
    expect(vistaDePractica({ ...base, payload: { cut_reason: "critical_failure", evaluation: { fallas: [{ id: "pitch_prematuro", severidad: "critical" }] } } }).termino).toBe("falla crítica");
    expect(vistaDePractica({ ...base, payload: { cut_reason: "max_turns" } }).termino).toBe("se acabaron los turnos");
  });
});
