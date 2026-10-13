// Las cuatro disputas del 13-oct-2026, revisadas con Emilio. Cada una dejó un
// arreglo de fondo; estas pruebas lo sostienen.
import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { fallasDe, explicarNota, calcularScore, TOPE_CRITICO } from "../../../supabase/functions/_shared/puntuacion";
import { textosDeEvaluacion, aplicarAuditoria, fallaCerrada } from "../../../supabase/functions/_shared/auditar_coaching";
import { armarReporteDisputas, type Disputa } from "../disputas-reporte";

const root = process.cwd();
const leer = (p: string) => readFileSync(join(root, p), "utf8");
const voz = leer("supabase/functions/closer-voice/index.ts");
const ui = leer("src/routes/nodo.$nodeId.practica.tsx");

const FALLAS_310 = [
  { id: "pitch_prematuro", severity: "critical", description: "Presenta producto en cualquier punto — incluso al descubrir el dolor. El diagnóstico termina donde empieza la receta." },
  { id: "interrogatorio", severity: "minor", description: "Ráfagas de preguntas desconectadas de las respuestas." },
  { id: "ignora_estado", severity: "major", description: "El cliente muestra prisa clara y el vendedor no ajusta." },
];

describe("3.10 — la falla que topó la nota se le muestra al vendedor", () => {
  it("cada falla sale con su efecto, la más grave primero", () => {
    const f = fallasDe(["interrogatorio", "pitch_prematuro", "ignora_estado"], FALLAS_310, [
      { id: "pitch_prematuro", cita: "soy distribuidor oficial de Bardahl, le puedo dar mejor precio", error: "Ofreciste precio sin saber a cuánto compra." },
    ]);
    expect(f.map((x) => x.id)).toEqual(["pitch_prematuro", "ignora_estado", "interrogatorio"]);
    expect(f[0].efecto).toContain(`máximo ${TOPE_CRITICO}`);
    expect(f[0].cita).toContain("mejor precio");
    expect(f[1].efecto).toBe("Resta 30 puntos.");
    expect(f[2].efecto).toBe("Resta 15 puntos.");
  });
  it("sin la explicación del modelo, la falla sale igual con la primera frase de su descripción", () => {
    const [f] = fallasDe(["pitch_prematuro"], FALLAS_310, []);
    expect(f.error).toBe("Presenta producto en cualquier punto — incluso al descubrir el dolor.");
  });
  it("un flag que no existe en el guion no inventa una falla", () => {
    expect(fallasDe(["inventado"], FALLAS_310, [])).toEqual([]);
  });
  it("la explicación de la nota la escribe el código: base, restas y tope", () => {
    const r = calcularScore({
      veredictos: [
        { criterio_id: "a", nivel: "cumple" },
        { criterio_id: "b", nivel: "parcial", falta: "la historia quedó a medias" },
      ],
      successCriteria: [{ id: "a", weight: 0.9 }, { id: "b", weight: 0.1 }],
      flags: ["pitch_prematuro"],
      failureCriteria: FALLAS_310,
    });
    const txt = explicarNota({
      score: r.score,
      desglose: { base: r.base, criterios: r.desglose, restas: r.restas, topado: r.topado, criticos: r.criticos },
    })!;
    expect(r.score).toBe(30);
    expect(txt).toContain("Nota final: 30. No existe otra nota ni otra escala.");
    expect(txt).toContain(`base ${r.base} de 100`);
    expect(txt).toContain("falla crítica (pitch_prematuro)");
    expect(txt).toContain("falta: la historia quedó a medias");
  });
  it("closer-voice agrega las fallas a la evaluación y no deja salir el estimado del modelo", () => {
    expect(voz).toContain("(evaluation as any).fallas = fallasDe(evaluation.flags_detected");
    expect(voz).not.toContain("(evaluation as any).score_del_modelo =");
    expect(voz).toContain('"evidencia_flags": [');
  });
  it("lo que el vendedor lee de cada falla pasa por el auditor, y si el auditor falla se quita el ejemplo", () => {
    const ev: any = { observations: [], mision: "m", evidencia_flags: [{ id: "x", error: "e", mejora: "haz esto", ejemplo: "dilo así" }] };
    expect(textosDeEvaluacion(ev).map((t) => t.id)).toEqual(["fal0.mejora", "fal0.ejemplo", "mision"]);
    aplicarAuditoria(ev, [{ id: "fal0.ejemplo", ok: false, corregido: "dilo mejor así" }]);
    expect(ev.evidencia_flags[0].ejemplo).toBe("dilo mejor así");
    fallaCerrada(ev);
    expect(ev.evidencia_flags[0].ejemplo).toBe("");
  });
  it("la pantalla de resultados muestra primero lo que bajó la nota y lo guarda en el evento", () => {
    expect(ui).toContain("Lo que te bajó la nota");
    expect(ui.indexOf("Lo que te bajó la nota")).toBeLessThan(ui.indexOf("{/* Observaciones */}"));
    expect(ui).toMatch(/fallas: Array\.isArray\(evaluation\?\.fallas\) \? evaluation\.fallas : \[\],/);
    expect(ui).toContain("desglose: evaluation?.desglose ?? null,");
  });
});

describe("G31 — un criterio cumplido no aparece como error", () => {
  it("el prompt ya no permite observación sobre un criterio cumplido", () => {
    expect(voz).not.toContain("aunque también tenga observación de mejora");
    expect(voz).toContain('Un criterio "cumple" NO lleva observación');
  });
  it("el código descarta la observación si el criterio salió completo", () => {
    expect(voz).toContain("evaluation.observations = (evaluation.observations ?? []).filter((o: any) => !completos.has(o?.criterio_id));");
  });
  it("la red lo vigila en todos los casos", () => {
    expect(leer("supabase/functions/harness-runner/index.ts")).toContain('UNIVERSAL: observación sobre ${o.criterio_id}, que salió "cumple"');
  });
});

describe("La réplica explica la nota solo con el cálculo real", () => {
  it("recibe el cálculo escrito por el código y nunca el estimado del modelo", () => {
    expect(voz).toContain("const explicacion = explicarNota(evaluacion);");
    expect(voz).toContain("delete (evaluacion as any).score_del_modelo;");
    expect(voz).toContain("CÓMO SE CALCULÓ LA NOTA (escrito por el código, es exacto)");
    expect(voz).toMatch(/PROHIBIDO mencionarlos/);
  });
  it("no concede lo que la evaluación no dijo, y no sostiene lo que el criterio no pide", () => {
    expect(voz).toContain("SOLO PUEDES CONCEDER SOBRE LO QUE LA EVALUACIÓN DIJO");
    expect(voz).toContain("ANTES DE SOSTENER un veredicto, ubica la frase de la descripción del criterio");
  });
  it("no inventa causas técnicas y sabe cómo terminó la sesión", () => {
    expect(voz).toContain("NO INVENTES CAUSAS TÉCNICAS");
    expect(voz).toContain('cut_reason: cut_reason ?? "unknown", end_session: true');
  });
});

describe("2.2 — el cliente no termina la práctica; la termina el Director", () => {
  it("en you_do el prompt no le pide al cliente que termine", () => {
    expect(voz).toContain('CUÁNDO TERMINAR: nunca. En esta fase la sesión la termina el Director');
  });
  it("el servidor ignora un end_session del cliente en you_do", () => {
    expect(voz).toMatch(/if \(phase === "you_do" && \(closerResponse\.end_session \|\| closerResponse\.next_phase !== "you_do"\)\)/);
  });
  it("la app también lo ignora", () => {
    expect(ui).toMatch(/if \(!enYouDo && \(endSession \|\| nextPhase === "end"\)\)/);
  });
  it("si el Director no responde, la app aplica sola los límites del nodo (la práctica no se queda sin fin)", () => {
    expect(ui).toContain('typeof limites.max_turns === "number" && turnosVendedor >= limites.max_turns ? "max_turns"');
    expect(ui).toContain('{ decision: "cut", reason: corteLocal, local: true }');
  });
  it("anunciar la intención en voz alta no es una pregunta (doctrina de Emilio)", () => {
    expect(voz).toContain("Lo que NO es pregunta aunque el cliente conteste");
  });
});

describe("3.10 — un turno de voz nunca se envía solo por una falla de conexión", () => {
  it("con texto ya dicho, reconecta y suma; nunca llama a finishTurn desde el error", () => {
    const bloque = ui.slice(ui.indexOf("onError: (msg, falla, codigo) => {"), ui.indexOf("anotarIncidente(falla, codigo, \"cierra_sin_texto\")"));
    expect(bloque).toContain("if (finalText) {");
    expect(bloque).toContain("abrir();");
    expect(bloque).not.toContain("finishTurn()");
  });
  it("al enviar, junta lo de todas las conexiones del turno", () => {
    expect(ui).toContain("texto = juntar(prefijo, await c.terminar()) || finalText;");
  });
  it("si no puede reconectar, espera a que el vendedor toque enviar", () => {
    expect(ui).toContain("Se fue la señal un momento. Toca el micrófono para enviar lo que llevas.");
  });
  it("las fallas de voz y cómo terminó la sesión quedan en el evento", () => {
    expect(ui).toContain("incidentes_voz: incidentesVozRef.current,");
    expect(ui).toContain('cut_reason: cutReasonRef.current ?? "unknown",\n                incidentes_voz');
  });
});

describe("3.9b — el criterio de mapear el catálogo ya no se puede leer de más", () => {
  const nodos: any[] = JSON.parse(leer("docs/kb/nodos_snapshot.json"));
  for (const id of ["3.9", "3.9b"]) {
    it(`${id}: cuenta aunque la familia la nombre el cliente al contestar`, () => {
      const c = nodos.find((n) => n.id === id).practice_script.success_criteria.find((x: any) => x.id === "discovery.lee_el_lugar");
      expect(c.description).toContain("Cuenta aunque esa familia la nombre el propio cliente");
      expect(c.description).toContain("No se exige un número de familias");
    });
  }
});

describe("El reporte de disputas trae lo que hace falta para revisarlas", () => {
  it("las fallas con su cita y cómo terminó la sesión", () => {
    const d: Disputa = {
      id: "1", created_at: "2026-10-13T17:34:00Z", node_id: "3.10", nota_original: 30,
      mensaje_vendedor: "¿por qué 30?", respuesta_closer: "…", concede: false, criterio_id: null, motivo: null,
      contexto: { evaluacion: { cut_reason: "max_duration", fallas: [{ id: "pitch_prematuro", severidad: "critical", cita: "le puedo dar mejor precio" }] }, conversacion: [] },
      revisada: false, nota_revision: null,
    };
    const r = armarReporteDisputas([d]);
    expect(r).toContain('fallas: pitch_prematuro(critical): "le puedo dar mejor precio"');
    expect(r).toContain("terminó: se acabó el tiempo");
  });
});
