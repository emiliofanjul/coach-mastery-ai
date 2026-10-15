// Guardia de "Tu coach" (14-oct-2026): respuestas reales de la prueba del 83.
import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { extraerTema, contarFrases, tecnicasNombradas, revisarRespuesta, promptReescritura, recorteSeguro } from "../coach-guardia";

const coach = readFileSync(join(process.cwd(), "src/lib/coach-chat.functions.ts"), "utf8");
const CERRADAS = ["FFF — Feel, Felt, Found", "RRR — Repeat, Reassure, Resume", "Triple Desglose de Precios", "Pintar Imágenes", "Teoria de las Balas", "El Cierre Asumido"];

const RESPUESTA_A = `[TEMA: Mundo 5]
Eso lo vas a trabajar a fondo en el Mundo 5, El Cierre. Es donde aprendes FFF (Feel, Felt, Found) y RRR para objeciones, que son las herramientas para atravesar "está caro" sin discutir. Para hoy, con lo que ya sabes:

No discutas el precio. Decir "no está caro" o justificarte te mete en una pelea que pierdes aunque ganes.
Regresa al dolor. Si dijo que está caro es porque presentaste antes de diagnosticar bien. ¿Qué problema encontraste en el descubrimiento? ¿Se lo conectaste en la presentación?
Pregunta qué está comparando. Necesitas el dato.
Close With Action. En vez de quedarte parado esperando, muévete. Sigue avanzando en el 3.10, El Diagnóstico que te toca.`;

describe("la etiqueta del tema", () => {
  it("se lee y nunca le llega al vendedor", () => {
    const t = extraerTema(RESPUESTA_A);
    expect(t.mundo).toBe(5);
    expect(t.texto.startsWith("Eso lo vas a trabajar")).toBe(true);
    expect(extraerTema("[TEMA: general]\nHola.").mundo).toBeNull();
    expect(extraerTema("Sin etiqueta.").texto).toBe("Sin etiqueta.");
  });
});

describe("la revisión", () => {
  const texto = extraerTema(RESPUESTA_A).texto;
  it("la respuesta (a) del 83 se reescribe: larga y nombra FFF y RRR", () => {
    expect(contarFrases(texto)).toBeGreaterThan(6);
    expect(tecnicasNombradas(texto, CERRADAS)).toEqual(["FFF — Feel, Felt, Found", "RRR — Repeat, Reassure, Resume"]);
    const r = revisarRespuesta({ mundoTema: 5, mundoActual: 3, texto, nombresCerrados: CERRADAS });
    expect(r.reescribir).toBe(true);
  });
  it("una respuesta corta, sin técnicas cerradas y con el mundo, pasa", () => {
    const ok = "No le discutas el precio. Regresa a preguntarle cómo le va con lo que tiene hoy. Eso lo vas a trabajar a fondo en el Mundo 5, El Cierre. Sigue avanzando: cuando llegues, todo va a tener sentido.";
    expect(revisarRespuesta({ mundoTema: 5, mundoActual: 3, texto: ok, nombresCerrados: CERRADAS }).reescribir).toBe(false);
  });
  it("si el tema es de un mundo que ya vio o del actual, no se toca", () => {
    expect(revisarRespuesta({ mundoTema: 1, mundoActual: 3, texto: "x. ".repeat(30), nombresCerrados: CERRADAS }).reescribir).toBe(false);
    expect(revisarRespuesta({ mundoTema: null, mundoActual: 3, texto: "FFF", nombresCerrados: CERRADAS }).reescribir).toBe(false);
  });
  it("el nombre del mundo no cuenta como técnica", () => {
    expect(tecnicasNombradas("Eso lo vas a trabajar en el Mundo 5, El Cierre.", CERRADAS)).toEqual([]);
  });
  it("la reescritura prohíbe las técnicas y termina con el mundo", () => {
    const p = promptReescritura({ mundoTema: 5, nombreMundo: "El Cierre", nombresCerrados: CERRADAS });
    expect(p).toContain("NO nombres ni expliques ninguna de estas técnicas: FFF — Feel, Felt, Found");
    expect(p).toContain('"Eso lo vas a trabajar a fondo en el Mundo 5, El Cierre. Sigue avanzando: cuando llegues, todo va a tener sentido."');
    expect(p).toContain('No uses el vocabulario de esas técnicas que todavía no conoce (por ejemplo "bala", "desglose")');
    // Si las balas ya se las enseñaste, "bala" no sale como ejemplo prohibido.
    const p4 = promptReescritura({ mundoTema: 5, nombreMundo: "El Cierre", nombresCerrados: ["FFF — Feel, Felt, Found"] });
    expect(p4).not.toContain('"bala"');
  });
});

describe("el último recurso, sin modelo", () => {
  it("deja máximo 3 frases sin técnicas cerradas y cierra con el mundo, y eso ya pasa la revisión", () => {
    const t = recorteSeguro(extraerTema(RESPUESTA_A).texto, { mundoTema: 5, nombreMundo: "El Cierre", nombresCerrados: CERRADAS });
    expect(tecnicasNombradas(t, CERRADAS)).toEqual([]);
    expect(t.endsWith("Eso lo vas a trabajar a fondo en el Mundo 5, El Cierre. Sigue avanzando: cuando llegues, todo va a tener sentido.")).toBe(true);
    expect(revisarRespuesta({ mundoTema: 5, mundoActual: 3, texto: t, nombresCerrados: CERRADAS }).reescribir).toBe(false);
  });
});

describe("el coach", () => {
  it("pide la etiqueta, distingue bloqueo de objeción y aplica la guardia", () => {
    expect(coach).toContain('EMPIEZA SIEMPRE tu respuesta con una línea exacta "[TEMA: Mundo N]"');
    expect(coach).toContain("es\n   un BLOQUEO: se atraviesa con AIR");
    expect(coach).toContain("revisarRespuesta({ mundoTema: tema.mundo");
    expect(coach).toContain("let reply = tema.texto;");
    expect(coach).toContain("reply = segunda.reescribir ? recorteSeguro(reescrita || reply, opcionesTema) : reescrita;");
    expect(coach).toContain('phase: "coach_chat_guardia"');
    expect(coach).toContain('"[coach-chat] guardia: se reescribió"');
    expect(coach).not.toContain("respuesta recortada por la guardia");
  });
});
