// Mensaje 149 (7-nov-2026) · Las descripciones de los nodos: la frase que se lee al tocar el nodo que sigue.
// Faltaban acentos en 44 de 75, y tres decían algo distinto de lo que el nodo enseña.
import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";

const filas: Array<{ tipo: string; id: string; texto: string | null }> = JSON.parse(
  fs.readFileSync(path.resolve(__dirname, "../../../docs/kb/textos_mundos_y_nodos.json"), "utf8"),
);
const nodo = (id: string) => filas.find((x) => x.tipo === "nodo" && x.id === id)!.texto ?? "";

const SIN_ACENTO = /(?<![\wáéíóúñ])(aqui|tambien|despues|diagnostico|conversacion|presentacion|relacion|solucion|objecion|decision|razon|senal|dias|anos|facil|dificil|esta armada|esta arriba|esta listo|esta construido|esta en duda|esta el limite)(?![\wáéíóúñ])/i;

describe("Las descripciones de los nodos", () => {
  it("las 75 están en la copia de referencia y ninguna trae palabras sin su acento", () => {
    const nodos = filas.filter((x) => x.tipo === "nodo");
    expect(nodos.length).toBe(75);
    expect(nodos.filter((x) => SIN_ACENTO.test(x.texto ?? "")).map((x) => x.id)).toEqual([]);
  });
  it("3.6: al que hoy no puede comprar lo dejas rápido y con la puerta abierta (rendirse es caro con un amarillo, no con un rojo)", () => {
    expect(nodo("3.6")).toContain("a irte rápido dejando la puerta abierta");
    expect(nodo("3.6")).not.toContain("rendirse es el error");
  });
  it("4.7: son seis factores de impulso (FUJPIG), no seis balas", () => {
    expect(nodo("4.7")).toContain("hay seis factores que lo mueven: FUJPIG");
  });
  it("6.4 dice «reto», no «examen»", () => {
    expect(nodo("6.4")).toContain("ese es exactamente el reto");
  });
});
