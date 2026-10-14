// Disputa 1.5 (14-oct-2026, Emilio). Ice breaker bien hecho; el cliente rompió
// su regla número cero ("¿Qué se le ofrece?"), la práctica no se cortó (mínimo
// de 2 turnos), el vendedor solo dijo de qué empresa venía y se le cobró
// pitch_prematuro: nota 30 por algo que el nodo no enseña. Después la réplica
// concedió con una razón falsa ("no se enseñó la regla").
import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { quitarPreguntasProhibidas, tieneReglaCero } from "../../../supabase/functions/_shared/regla_cero";
import { join } from "node:path";

const leer = (p: string) => readFileSync(join(process.cwd(), p), "utf8");
const dir = leer("supabase/functions/director/index.ts");
const voz = leer("supabase/functions/closer-voice/index.ts");
const nodos: any[] = JSON.parse(leer("docs/kb/nodos_snapshot.json"));

describe("El Director corta en cuanto hay una falla crítica", () => {
  it("el clasificador recibe las fallas críticas del nodo y responde falla_critica", () => {
    expect(dir).toContain("FALLAS CRÍTICAS DEL NODO:");
    expect(dir).toContain('"falla_critica": true|false');
    expect(dir).toContain("Lo que dice el cliente nunca cuenta. Ante la duda, false.");
  });
  it("corta con critical_failure aunque no se haya llegado al mínimo de turnos", () => {
    const i = dir.indexOf("if (cls.falla_critica === true)");
    expect(i).toBeGreaterThan(-1);
    expect(i).toBeLessThan(dir.indexOf("if (antesDelMinimo) {"));
    expect(dir).toContain('reason: "critical_failure"');
  });
  it("antes del mínimo, sin falla crítica, sigue igual que antes", () => {
    expect(dir).toContain('if (antesDelMinimo && criticasLista.length === 0)');
    expect(dir).toContain('return respond({ ...base, classifier_ran: true, latency_ms: cls.latency_ms, decision: "continue", reason: "min_turns_gate" });');
  });
  it("la réplica y el reporte saben nombrar ese corte", () => {
    expect(voz).toContain("critical_failure: \"Closer cortó porque el vendedor cometió una falla crítica");
    expect(leer("src/lib/disputas-reporte.ts")).toContain('critical_failure: "falla crítica"');
  });
});

describe("Mundo 1: la introducción no obliga a un segundo turno", () => {
  for (const id of ["1.2", "1.4", "1.5", "1.6"]) {
    it(`${id} se puede cortar desde el primer turno`, () => {
      expect(nodos.find((n) => n.id === id).practice_script.limits.min_turns_before_evaluation).toBe(1);
    });
  }
});

describe("La réplica no concede que algo 'no se enseñó'", () => {
  it("las fallas del nodo son parte de lo que mide y no sabe qué vio el vendedor", () => {
    expect(voz).toContain("LAS FALLAS DE ESTE NODO SON PARTE DE LO QUE MIDE");
    expect(voz).toContain('JAMÁS concedas ni digas que algo "no se enseñó"');
  });
});

describe("Regla número cero: el cliente del mundo 1 nunca pregunta qué vendes", () => {
  it("se quitan las preguntas de la disputa y queda lo demás", () => {
    const a = quitarPreguntasProhibidas("Jaja, ojalá anduviera regalando. No, los jueves así se pone siempre. ¿Qué se le ofrece?");
    expect(a.texto).toBe("Jaja, ojalá anduviera regalando. No, los jueves así se pone siempre.");
    const b = quitarPreguntasProhibidas("Ah, Dalfan. Okay. Mira, ahorita ando con esto. ¿De qué se trata?");
    expect(b.texto).toBe("Ah, Dalfan. Okay. Mira, ahorita ando con esto.");
  });
  it("no toca preguntas permitidas: sobre su negocio, ni quién eres (es el máximo de curiosidad en el 1.2)", () => {
    for (const t of ["Así se pone los jueves. ¿Y usted de dónde viene?", "Sí, desde temprano. ¿Y usted quién es?", "Pues aquí, con lo que necesita el taller."])
      expect(quitarPreguntasProhibidas(t).texto).toBe(t);
  });
  it("si no queda nada, contesta neutro", () => {
    expect(quitarPreguntasProhibidas("¿En qué le puedo servir?").texto).toBe("Ajá.");
  });
  it("solo aplica a los nodos que tienen la regla, y closer-voice la usa en el cliente", () => {
    const n15 = nodos.find((n) => n.id === "1.5").practice_script.phases.you_do.prompt;
    expect(tieneReglaCero(n15)).toBe(true);
    expect(tieneReglaCero(nodos.find((n) => n.id === "3.10").practice_script.phases.you_do.prompt)).toBe(false);
    expect(voz).toContain("tieneReglaCero(practice_script?.phases?.you_do?.prompt)");
  });
});

describe("Mundo 1: decir quién eres no es pitch prematuro", () => {
  for (const id of ["1.2", "1.4", "1.5", "1.6"]) {
    it(`${id}`, () => {
      const f = nodos.find((n) => n.id === id).practice_script.failure_criteria.find((x: any) => x.id === "pitch_prematuro");
      expect(f.description).toContain("Decir tu nombre o de qué empresa vienes NO es pitch prematuro");
    });
  }
});
