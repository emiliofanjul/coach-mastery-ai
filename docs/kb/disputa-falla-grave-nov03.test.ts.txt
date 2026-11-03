import { describe, it, expect } from "vitest";
import { readFileSync } from "fs";
import { resolve } from "path";
import { recordatorioFallaCritica, mencionaLaFrase, turnoDeLaFrase } from "../../../supabase/functions/_shared/replica_revisada";

// Mensaje 130 (3-nov-2026), Emilio: «Closer en una disputa sí tiene que
// recordar la falla grave que dejó la nota en 30 cuando no la concede. Se
// tiene que decir en lo que está de acuerdo pero también en lo que no está
// correcto el usuario.»

const raiz = resolve(__dirname, "../../..");
const nodos: any[] = JSON.parse(readFileSync(resolve(raiz, "docs/kb/nodos_snapshot.json"), "utf8"));
const fallasDelNodo = nodos.find((n) => n.id === "3.10").practice_script.failure_criteria;

const FRASE = "Perfecto. Sí, pues a ver, básicamente, eh, el servicio, ya entiendo que está teniendo un problema con el servicio y claro que nosotros lo podemos ayudar. Nosotros manejamos Bardal, Repsol y Mixloop.";
const conversacion = [
  ...Array.from({ length: 12 }, (_, i) => ({ role: i % 2 === 0 ? "user" : "assistant", content: `mensaje ${i + 1}` })),
  { role: "user", content: FRASE },
  { role: "assistant", content: "Mire, no estoy para que me vendan nada ahorita." },
];
const evaluacion = {
  score: 30,
  fallas: [
    { id: "pitch_prematuro", severidad: "critical", cita: "Perfecto. Sí, pues a ver, básicamente, eh, el servicio, ya entiendo que está teniendo un problema con el servicio y clar" },
    { id: "ignora_pistas", severidad: "major" },
  ],
};
// La respuesta real de la disputa repetida (128): le dio la razón y no mencionó el pitch.
const RESPUESTA_128 = "Tienes razón: ya te contó el dolor completo en turno 10. Eso estuvo mal. Y tienes razón en tu estrategia: si ya tienes el dolor, lo que sigue es averiguar su operación. Registro tu punto.";

describe("la falla grave que dejó la nota en 30 no se calla", () => {
  it("la disputa del 3.10: concedió ignora_pistas, calló el pitch → se le recuerda con su frase, su turno y la regla", () => {
    const r = recordatorioFallaCritica({ evaluacion, conversacion, concedidas: ["ignora_pistas"], mensaje: RESPUESTA_128, fallasDelNodo });
    expect(r).not.toBeNull();
    expect(r).toContain("Lo que sí se sostiene");
    expect(r).toContain("En el turno 13");
    expect(r).toContain("ya entiendo que está teniendo un problema con el servicio");
    expect(r).toContain("Hoy solo se diagnostica");
    expect(r).toContain("no pasa de 30");
  });

  it("si la respuesta ya la mencionó con su frase, no se repite", () => {
    const yaLaDijo = `${RESPUESTA_128} Pero en el turno 13 dijiste «ya entiendo que está teniendo un problema con el servicio»: eso es presentar.`;
    expect(recordatorioFallaCritica({ evaluacion, conversacion, concedidas: ["ignora_pistas"], mensaje: yaLaDijo, fallasDelNodo })).toBeNull();
  });

  it("si el juez confirmó que la falla grave estuvo mal, no se le recuerda", () => {
    expect(recordatorioFallaCritica({ evaluacion, conversacion, concedidas: ["pitch_prematuro"], mensaje: "Tienes razón.", fallasDelNodo })).toBeNull();
  });

  it("sin falla crítica no hay nada que recordar", () => {
    const sinCritica = { fallas: [{ id: "ignora_pistas", severidad: "major" }] };
    expect(recordatorioFallaCritica({ evaluacion: sinCritica, conversacion, concedidas: [], mensaje: "x", fallasDelNodo })).toBeNull();
  });

  it("encuentra la frase aunque cambien acentos y signos, y sabe en qué turno la dijo", () => {
    expect(mencionaLaFrase("tú DIJISTE: ¡Ya entiendo que esta teniendo un problema!", "ya entiendo que está teniendo")).toBe(true);
    expect(mencionaLaFrase("hablaste de tus marcas", "ya entiendo que está teniendo")).toBe(false);
    expect(turnoDeLaFrase(conversacion, evaluacion.fallas[0].cita)).toBe(13);
  });

  it("closer-voice lo pide en el prompt y lo garantiza antes de guardar la disputa", () => {
    const voz = readFileSync(resolve(raiz, "supabase/functions/closer-voice/index.ts"), "utf8");
    expect(voz).toContain("DI EN QUÉ TIENE RAZÓN Y EN QUÉ NO");
    const iRecordatorio = voz.indexOf("const recordatorio = recordatorioFallaCritica(");
    const iGuardar = voz.indexOf('from("disputas").insert(');
    expect(iRecordatorio).toBeGreaterThan(0);
    expect(iGuardar).toBeGreaterThan(iRecordatorio);
  });
});
