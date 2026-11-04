import { describe, it, expect } from "vitest";
import { readFileSync } from "fs";
import { resolve } from "path";
import { quitarEspejosDeCriteriosCumplidos } from "../../../supabase/functions/_shared/espejos";
import {
  idsConcedidos,
  acusacionesARevisar,
  entradaJuezConArgumento,
  clasificarRevision,
  hayQueReescribir,
  bloqueRevisionJuez,
} from "../../../supabase/functions/_shared/replica_revisada";
import { vistaDeDisputa, armarReporteDisputas, type Disputa } from "../disputas-reporte";

// Mensaje 128 (3-nov-2026). Disputa real del 3.10:
//  · «ignora_pistas» salió como error aunque la misma evaluación dio
//    preguntas_capas: cumple. Una falla espejo no puede contradecir a su criterio.
//  · La respuesta a la disputa le dio la razón en pitch_prematuro («claro que
//    nosotros lo podemos ayudar. Nosotros manejamos…» en un nodo que solo
//    diagnostica). Emilio: la falla estaba bien. Ahora el juez revisa antes
//    de que Closer conceda.

const raiz = resolve(__dirname, "../../..");
const leer = (p: string) => readFileSync(resolve(raiz, p), "utf8");
const reglas: any[] = JSON.parse(leer("docs/kb/reglas.json"));
const resumen = (id: string) => (Array.isArray(reglas) ? reglas : (reglas as any).reglas).find((r: any) => r.id === id)?.resumen as string;
const nodos: any[] = JSON.parse(leer("docs/kb/nodos_snapshot.json"));
const n310 = nodos.find((n) => n.id === "3.10");

// El guion como lo resuelve el servidor: cada falla y criterio con el resumen de su regla.
const guion = {
  ...n310.practice_script,
  failure_criteria: n310.practice_script.failure_criteria.map((f: any) => ({ ...f, regla_resumen: resumen(f.regla_id) })),
  success_criteria: n310.practice_script.success_criteria.map((c: any) => ({ ...c, regla_resumen: resumen(c.regla_id) })),
};

const FRASE_PITCH = "ya entiendo que está teniendo un problema con el servicio y claro que nosotros lo podemos ayudar. Nosotros manejamos Bardal, Repsol y Mixloop.";

function evaluacionDeLaDisputa() {
  return {
    flags_detected: ["pitch_prematuro", "ignora_pistas"],
    evidencia_flags: [
      { id: "pitch_prematuro", cita: FRASE_PITCH },
      { id: "ignora_pistas", cita: "ese es un dolor muy común y, pues grave, ¿no? Oiga, y entonces, ¿qué presentaciones…" },
    ],
    veredictos_criterios: [
      { criterio_id: "discovery.preguntas_capas", nivel: "cumple" },
      { criterio_id: "discovery.dolor_real", nivel: "cumple" },
      { criterio_id: "story.historia_breve", nivel: "parcial", falta: "no dijo por qué está ahí" },
    ],
    fallas: [{ id: "pitch_prematuro", severidad: "critical", cita: FRASE_PITCH }, { id: "ignora_pistas", severidad: "major" }],
  };
}

describe("una falla espejo no contradice a su criterio", () => {
  it("el 3.10 tiene ignora_pistas como espejo de preguntas_capas", () => {
    const f = n310.practice_script.failure_criteria.find((x: any) => x.id === "ignora_pistas");
    expect(f.espejo_de).toBe("discovery.preguntas_capas");
  });

  it("la disputa del 3-nov: preguntas_capas cumple → ignora_pistas se quita; pitch_prematuro se queda", () => {
    const ev = evaluacionDeLaDisputa();
    const q = quitarEspejosDeCriteriosCumplidos(ev, guion);
    expect(q.map((x) => x.id)).toEqual(["ignora_pistas"]);
    expect(ev.flags_detected).toEqual(["pitch_prematuro"]);
    expect(ev.evidencia_flags.map((e) => e.id)).toEqual(["pitch_prematuro"]);
  });

  it("si su criterio salió parcial o no_cumple, la falla espejo se queda", () => {
    for (const nivel of ["parcial", "no_cumple"]) {
      const ev = evaluacionDeLaDisputa();
      ev.veredictos_criterios[0].nivel = nivel;
      expect(quitarEspejosDeCriteriosCumplidos(ev, guion)).toEqual([]);
      expect(ev.flags_detected).toContain("ignora_pistas");
    }
  });

  it("con no_aplica tampoco puede quedar", () => {
    const ev = evaluacionDeLaDisputa();
    ev.veredictos_criterios[0].nivel = "no_aplica";
    expect(quitarEspejosDeCriteriosCumplidos(ev, guion).map((x) => x.id)).toEqual(["ignora_pistas"]);
  });

  it("una falla critical nunca se quita por espejo", () => {
    const ps = { failure_criteria: [{ id: "x", severity: "critical", espejo_de: "c" }] };
    const ev: any = { flags_detected: ["x"], veredictos_criterios: [{ criterio_id: "c", nivel: "cumple" }] };
    expect(quitarEspejosDeCriteriosCumplidos(ev, ps)).toEqual([]);
    expect(ev.flags_detected).toEqual(["x"]);
  });

  it("la evaluación lo aplica después del juez y antes de la segunda revisión y de la nota", () => {
    const voz = leer("supabase/functions/closer-voice/index.ts");
    const iJuez = voz.indexOf("quitadasPorJuez = aplicarJuicios(");
    const iEspejo = voz.indexOf("quitarEspejosDeCriteriosCumplidos(evaluation, practice_script)");
    const iSegunda = voz.indexOf("const segunda = await auditar(quitadasPorJuez)");
    const iNota = voz.indexOf("const rubrica = calcularScore(");
    expect(iJuez).toBeGreaterThan(0);
    expect(iEspejo).toBeGreaterThan(iJuez);
    expect(iSegunda).toBeGreaterThan(iEspejo);
    expect(iNota).toBeGreaterThan(iSegunda);
  });
});

describe("la respuesta a una disputa no concede sin el juez", () => {
  it("solo cuenta lo que de verdad se le acusó", () => {
    const ev = evaluacionDeLaDisputa();
    expect(idsConcedidos({ concede: true, criterio_id: "pitch_prematuro", concede_en: ["ignora_pistas", "inventada"] }, ev).sort())
      .toEqual(["ignora_pistas", "pitch_prematuro"]);
    expect(idsConcedidos({ concede: false, criterio_id: "pitch_prematuro", concede_en: [] }, ev)).toEqual([]);
    // Un criterio que salió cumple no es una acusación: no hay nada que conceder.
    expect(idsConcedidos({ concede_en: ["discovery.dolor_real"] }, ev)).toEqual([]);
  });

  it("pitch_prematuro tiene prueba escrita: el juez lo revisa con la frase y el argumento del vendedor", () => {
    const ev = evaluacionDeLaDisputa();
    const acus = acusacionesARevisar(["pitch_prematuro"], ev, guion);
    expect(acus.map((a) => a.id)).toEqual(["pitch_prematuro"]);
    expect(acus[0].regla).toContain("LA PRUEBA");
    const entrada = JSON.parse(entradaJuezConArgumento(acus, [
      { role: "user", content: "Hola" },
      { role: "assistant", content: "Dígame" },
      { role: "user", content: FRASE_PITCH },
    ], "Ya tenía el dolor; iba a preguntar volumen para usarlo en la presentación"));
    expect(entrada.acusaciones[0].frase_que_cito_el_evaluador).toContain("claro que nosotros lo podemos ayudar");
    expect(entrada.argumento_del_vendedor.dijo).toContain("iba a preguntar volumen");
    expect(entrada.argumento_del_vendedor.nota).toContain("no cambia lo que dijo");
    expect(entrada.conversacion[2]).toEqual({ turno: 3, quien: "vendedor", dijo: FRASE_PITCH });
  });

  it("si el juez la sostiene, Closer no le da la razón y se le explica qué decir en su lugar", () => {
    const acus = acusacionesARevisar(["pitch_prematuro"], evaluacionDeLaDisputa(), guion);
    const r = clasificarRevision(["pitch_prematuro"], acus, [
      { id: "pitch_prematuro", tipo: "falla", conducta: "reprueba", razon: "Nombra sus marcas y ofrece ayudar durante el descubrimiento.", citas: [{ turno: 13, quien: "vendedor", dijo: "claro que nosotros lo podemos ayudar" }] },
    ], []);
    expect(r.sostenidas.map((x) => x.id)).toEqual(["pitch_prematuro"]);
    expect(r.confirmadas).toEqual([]);
    expect(hayQueReescribir(r)).toBe(true);
    const b = bloqueRevisionJuez(r);
    expect(b).toContain("NO le des la razón en pitch_prematuro");
    expect(b).toContain("turno 13 (vendedor)");
    expect(b).toContain("qué habría dicho en lugar de esa frase");
  });

  it("si el juez confirma que estuvo mal, la concesión se queda", () => {
    const acus = acusacionesARevisar(["pitch_prematuro"], evaluacionDeLaDisputa(), guion);
    const r = clasificarRevision(["pitch_prematuro"], acus, [
      { id: "pitch_prematuro", tipo: "falla", conducta: "pasa", razon: "No nombró producto.", citas: [{ turno: 3, quien: "vendedor", dijo: "x" }] },
    ], []);
    expect(r.confirmadas.map((x) => x.id)).toEqual(["pitch_prematuro"]);
    expect(hayQueReescribir(r)).toBe(false);
  });

  it("si el juez no contestó o sus citas no están, no se concede ni se niega: queda registrado", () => {
    const acus = acusacionesARevisar(["pitch_prematuro"], evaluacionDeLaDisputa(), guion);
    const sinJuez = clasificarRevision(["pitch_prematuro"], acus, null, []);
    expect(sinJuez.sin_revisar[0]).toEqual({ id: "pitch_prematuro", motivo: "el juez no contestó" });
    const citaMala = clasificarRevision(["pitch_prematuro"], acus, [], [{ id: "pitch_prematuro", razon: "cita que no está en ese turno" }]);
    expect(citaMala.sin_revisar[0].motivo).toContain("cita inválida");
    expect(bloqueRevisionJuez(citaMala)).toContain("queda registrado");
  });

  it("closer-voice revisa con el juez antes de contestar y registra lo que decidió", () => {
    const voz = leer("supabase/functions/closer-voice/index.ts");
    const iJuez = voz.indexOf("entradaJuezConArgumento(aRevisar, fullHistory, argumento)");
    const iGuardar = voz.indexOf('from("disputas").insert(');
    expect(iJuez).toBeGreaterThan(0);
    expect(iGuardar).toBeGreaterThan(iJuez);
    expect(voz).toContain('"replica_revisada"');
    expect(voz).toContain("revision_juez: revisionJuez");
    expect(voz).toContain("respuesta_closer: String((parsed as any).message)");
    expect(voz).toContain('"concede_en": ["<id de CADA falla o criterio en que le das la razón>"]');
    // Si no se pudo reescribir, el vendedor no recibe una concesión sin confirmar.
    expect(voz).toContain("queda registrado y lo revisa el equipo de Closer");
  });

  it("cambió cómo se califica y cómo se contesta: la versión lo dice", () => {
    expect(leer("supabase/functions/closer-voice/index.ts")).toContain('const PROMPT_VERSION = "v2.9.8";');
  });
});

describe("la red vigila este caso", () => {
  it("G105: ignora_pistas no sale, pitch_prematuro sí, con los criterios en cumple", () => {
    const red = JSON.parse(leer("supabase/functions/_shared/eval_harness_v1.json"));
    expect(red.harness_version).toMatch(/^v3\.(3[4-9]|[4-9]\d)\./);
    const c = red.cases.find((x: any) => x.id === "G105_espejo_no_contradice_su_criterio");
    expect(c.node_id).toBe("3.10");
    expect(c.expected.must_flag).toEqual(["pitch_prematuro"]);
    expect(c.expected.must_not_flag).toEqual(["ignora_pistas"]);
    expect(c.expected.niveles_esperados["discovery.preguntas_capas"]).toBe("cumple");
    expect(c.transcript.some((t: any) => t.role === "user" && t.text.includes("claro que nosotros lo podemos ayudar"))).toBe(true);
  });
});

describe("la página de disputas muestra qué decidió el juez", () => {
  const d: Disputa = {
    id: "d", created_at: "2026-11-03T17:56:00Z", node_id: "3.10", nota_original: 30,
    mensaje_vendedor: "m", respuesta_closer: "r", concede: false, criterio_id: "pitch_prematuro",
    motivo: null, revisada: false, nota_revision: null,
    contexto: { conversacion: [], revision_juez: { sostenidas: [{ id: "pitch_prematuro" }], confirmadas: [{ id: "ignora_pistas" }], sin_revisar: [] } },
  };
  it("en la vista y en el reporte para Claude", () => {
    expect(vistaDeDisputa(d).juez).toBe("sostuvo pitch_prematuro · confirmó que estuvo mal ignora_pistas");
    expect(armarReporteDisputas([d])).toContain("juez de la disputa: sostuvo pitch_prematuro");
    expect(vistaDeDisputa({ ...d, contexto: null }).juez).toBeNull();
  });
});
