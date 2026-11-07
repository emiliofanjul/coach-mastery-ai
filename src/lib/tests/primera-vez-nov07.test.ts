// Mensaje 155 (7-nov-2026) · El globo del mapa dice qué tipo de nodo es y cuándo llega la práctica con voz.
// Emilio: quien descarga Closer para practicar con su voz y se topa con tarjetas y un quiz puede irse
// pensando que no era lo que esperaba. Se le dice desde el primer momento, con el mapa real.
import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";
import { textoGuiaMapa } from "@/lib/guia-mapa";

const snap: { id: string; node_type: string }[] = JSON.parse(
  fs.readFileSync(path.resolve(__dirname, "../../../docs/kb/nodos_snapshot.json"), "utf8"),
);
const mapa = snap.map((n) => ({ node_type: n.node_type, minutos_estimados: n.id === "1.0" ? 3 : 4 }));

describe("El globo «Empieza aquí»", () => {
  it("en el primer nodo de hoy (1.0, teoría): dice que es teoría y que la voz llega en el tercero (1.2)", () => {
    expect(snap[0].id).toBe("1.0");
    expect(textoGuiaMapa(mapa, 0, true)).toBe(
      "Tu primer nodo es de teoría: tarjetas y un quiz. Toma 3 minutos. Tu primera práctica con voz es el tercer nodo.",
    );
  });
  it("un nodo con práctica lo dice", () => {
    expect(textoGuiaMapa([{ node_type: "skill_drill", minutos_estimados: 5 }], 0, false)).toBe(
      "Este nodo termina con una práctica con voz. Toma 5 minutos.",
    );
  });
  it("si la práctica es el que sigue, o está más lejos, lo dice sin ordinales raros", () => {
    const t = (tipos: string[], i: number, nuevo: boolean) =>
      textoGuiaMapa(tipos.map((node_type) => ({ node_type, minutos_estimados: null })), i, nuevo);
    expect(t(["knowledge", "skill_drill"], 0, false)).toBe("Este nodo es de teoría: tarjetas y un quiz. Tu siguiente práctica con voz es el siguiente nodo.");
    expect(t(["skill_drill", "knowledge", "knowledge", "knowledge", "boss"], 1, false)).toBe("Este nodo es de teoría: tarjetas y un quiz. Tu siguiente práctica con voz llega en 3 nodos.");
    expect(t(["knowledge"], 0, true)).toBe("Tu primer nodo es de teoría: tarjetas y un quiz.");
  });
  it("el mapa pide node_type para poder decirlo", () => {
    const m = fs.readFileSync(path.resolve(__dirname, "../../routes/mapa.tsx"), "utf8");
    expect(m).toContain("nombre_corto,minutos_estimados,node_type&order=order_index.asc");
    expect(m).toContain("texto={textoGuiaMapa(orderedNodes, activeIdx, Object.keys(progress).length === 0)}");
  });
});
