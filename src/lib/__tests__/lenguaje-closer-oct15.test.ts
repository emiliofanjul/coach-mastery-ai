// El lenguaje de Closer (15-oct-2026, Emilio): todo lo que lee el vendedor se
// entiende en una sola pasada. Una sola guía para evaluación, réplica, auditor y coach.
import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { LENGUAJE_CLOSER } from "../lenguaje-closer";
import { LENGUAJE_CLOSER as LENGUAJE_FUNCIONES } from "../../../supabase/functions/_shared/lenguaje_closer";
import { PROMPT_AUDITOR } from "../../../supabase/functions/_shared/auditar_coaching";

const leer = (p: string) => readFileSync(join(process.cwd(), p), "utf8");

describe("una sola guía", () => {
  it("la copia de la app y la de las funciones son idénticas", () => {
    expect(LENGUAJE_CLOSER).toBe(LENGUAJE_FUNCIONES);
  });
  it("dice lo esencial: de tú, frases cortas, sin palabras de sistema, siglas con su significado, ortografía", () => {
    expect(LENGUAJE_CLOSER).toContain("Háblale de tú");
    expect(LENGUAJE_CLOSER).toContain("nunca más de 25");
    expect(LENGUAJE_CLOSER).toContain("Nada de palabras de sistema");
    expect(LENGUAJE_CLOSER).toContain("AIR (acepta, ignora y retoma)");
    expect(LENGUAJE_CLOSER).toContain("Ortografía completa");
    expect(LENGUAJE_CLOSER).toContain("si alguien tiene que leerlo dos veces");
  });
  it("las siglas se explican como las define el catálogo de habilidades", () => {
    const skills: any[] = JSON.parse(leer("docs/kb/skills_snapshot.json"));
    const rrrDescubrimiento = skills.find((s) => s.id === "mindset.rrr");
    expect(rrrDescubrimiento.world_id_introduced).toBe(3);
    expect(LENGUAJE_CLOSER).toContain("RRR de El Descubrimiento (lee, conecta y relaja)");
    expect(LENGUAJE_CLOSER).toContain("RRR de objeciones (repite, responde y sigue sin pausa)");
  });
});

describe("se usa en todo lo que lee el vendedor", () => {
  const voz = leer("supabase/functions/closer-voice/index.ts");
  it("la evaluación: error, mejora, ejemplo, misión, siguiente nivel y fallas", () => {
    expect(voz).toContain("7b. TODO LO QUE LEE EL VENDEDOR (error, mejora, ejemplo, mision, siguiente_nivel y evidencia_flags) va en el lenguaje de Closer:\n${LENGUAJE_CLOSER}");
    expect(voz).toContain("Usa el nombre de la técnica, nunca su id interno.");
  });
  it("la réplica", () => {
    expect(voz).toContain("- Máximo 5 frases por respuesta.\n${LENGUAJE_CLOSER}");
  });
  it("el auditor lo revisa y lo corrige", () => {
    expect(PROMPT_AUDITOR).toContain('6. LENGUAJE:');
    expect(PROMPT_AUDITOR).toContain(LENGUAJE_CLOSER);
    expect(PROMPT_AUDITOR).toContain('"lenguaje"),');
    expect(PROMPT_AUDITOR).not.toContain("No opinas de estilo");
  });
  it("Tu coach", () => {
    const coach = leer("src/lib/coach-chat.functions.ts");
    expect(coach).toContain("Nunca digas que eres una IA ni menciones modelos.\n\n${LENGUAJE_CLOSER}`;");
  });
});
