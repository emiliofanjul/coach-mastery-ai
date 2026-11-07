// Mensaje 152 (7-nov-2026) · Fase 4 del rediseño, parte 2: el análisis y la calificación.
// Lo que Emilio aprobó: mientras se califica, se ve qué se está revisando (con palomita al terminar cada cosa)
// y se relee la conversación; la calificación va centrada dentro de su anillo, que se llena contando de 0 a la
// nota; las estrellas brillan poco; la frase dice lo que el vendedor LOGRÓ («desbloqueaste», no «se abre»);
// «Consejo para lo que viene» muestra dos puntos y el resto detrás de «Ver más»; «Continuar» siempre a la mano.
// Solo cambia cómo se ve: la calificación, las estrellas y lo que se guarda no se tocan.
import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";
import { lineaDeEstrellas } from "../../components/closer/practica-ui";

const RAIZ = path.resolve(__dirname, "../..");
const leer = (r: string) => fs.readFileSync(path.join(RAIZ, r), "utf8");
const practica = leer("routes/nodo.$nodeId.practica.tsx");
const ui = leer("components/closer/practica-ui.tsx");
const victoria = leer("components/VictoryScreen.tsx");

describe("La frase bajo las estrellas dice lo que lograste", () => {
  const nuevo = { yaLoHabiaPasado: false, esReto: false, esElUltimo: false };
  it("con dos o tres estrellas, desbloqueaste el siguiente", () => {
    expect(lineaDeEstrellas(2, nuevo)).toBe("Dos estrellas: desbloqueaste el siguiente nodo.");
    expect(lineaDeEstrellas(3, nuevo)).toBe("Tres estrellas: lo dominaste y desbloqueaste el siguiente nodo.");
    expect(lineaDeEstrellas(2, { ...nuevo, esReto: true })).toBe("Dos estrellas: desbloqueaste el siguiente mundo.");
  });
  it("no dice «desbloqueaste» si ya lo habías pasado, ni en la certificación", () => {
    expect(lineaDeEstrellas(3, { ...nuevo, yaLoHabiaPasado: true })).toBe("Tres estrellas: lo dominaste.");
    expect(lineaDeEstrellas(2, { ...nuevo, esElUltimo: true })).toBe("Dos estrellas.");
  });
  it("con menos de dos, dice cuánto falta, y que las de antes se quedan", () => {
    expect(lineaDeEstrellas(1, nuevo)).toBe("Una estrella. Con dos desbloqueas el siguiente nodo.");
    expect(lineaDeEstrellas(0, { ...nuevo, yaLoHabiaPasado: true })).toBe("Sin estrellas esta vez. Las que ya tenías se quedan.");
  });
  it("la misma frase en el resultado y en la pantalla final; ya no dice «se abre el siguiente nodo»", () => {
    expect(practica.match(/lineaDeEstrellas\(stars, \{ yaLoHabiaPasado, esReto, esElUltimo: nodeId === NODO_CERTIFICACION \}\)/g)?.length).toBe(2);
    expect(practica).not.toContain("se abre el siguiente nodo");
    expect(practica).toContain("setYaLoHabiaPasado((doneRows ?? []).some((r) => r.node_id === nodeId));");
  });
});

describe("La calificación", () => {
  it("el número va solo y centrado dentro del anillo, y cuenta de 0 a la nota", () => {
    expect(ui).toContain("export function AnilloCalificacion");
    expect(ui).not.toContain("de 100</");
    expect(ui).toContain('position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center"');
    expect(ui).toContain("(1 - Math.pow(1 - k, 3))");
    expect(practica).toContain("<AnilloCalificacion calificacion={score} />");
  });
  it("las estrellas son la pieza con brillo, también en la pantalla final (sin rebote)", () => {
    expect(practica).toContain("<Estrella key={k} ganada={k < stars} tam={26} />");
    expect(victoria).toContain("<Estrella ganada={i < stars} tam={48} />");
    expect(victoria).not.toContain("closerBounce");
    expect(victoria).not.toContain("★");
  });
  it("«Consejo para lo que viene»: dos a la vista y el resto detrás de «Ver más»", () => {
    expect(practica).toContain("Consejo para lo que viene");
    expect(practica).not.toContain("Lo que viene después\n");
    expect(practica).toContain("const visibles = todos ? consejos : consejos.slice(0, 2);");
  });
  it("«Continuar» queda fijo abajo", () => {
    expect(practica).toContain('onClick={() => setStep("victory")} style={{ ...estiloBoton("principal"), maxWidth: 560, margin: "0 auto" }}');
  });
});

describe("Mientras se califica", () => {
  it("se ve qué se revisa y se relee la conversación", () => {
    expect(practica).toContain("<ListaRevision");
    expect(practica).toContain("<DialogoCompleto turnos={turnosConversacion} />");
    expect(practica).toContain("Revisando tu práctica");
  });
});
