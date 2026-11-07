// Mensaje 148 (7-nov-2026) · Limpieza de textos.
// El mundo 3 se había escrito sin acentos ni «¿»; los lemas de los mundos, igual. El coach mostraba los
// asteriscos de sus negritas tal cual y llamaba a los nodos por un nombre distinto al del mapa.
// Y las tarjetas de los retos finales decían «El cuarto Boss.» (el 3.10 es el tercero, y ya no se dice «Boss»).
import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";
import { armarAvance } from "../avance-coach";

const RAIZ = path.resolve(__dirname, "../..");
const leer = (r: string) => fs.readFileSync(path.join(RAIZ, r), "utf8");
const tarjetas: Array<{ node_id: string; title: string | null; body: string }> = JSON.parse(leer("../docs/kb/cards_snapshot.json"));
const preguntas: Array<Record<string, string | null>> = JSON.parse(leer("../docs/kb/quizzes_snapshot.json"));

// Palabras que en estos textos siempre llevan acento (no tienen otro uso sin él).
const SIN_ACENTO = /(?<![\wáéíóúñ])(aqui|tambien|despues|diagnostico|informacion|conversacion|presentacion|relacion|solucion|facil|rapido|ultima|linea|lineas|todavia|numero|telefono|catalogo|ningun|ensena|dueno|senal|anos|exito)(?![\wáéíóúñ])/i;

describe("Ortografía del contenido", () => {
  it("ninguna tarjeta ni pregunta trae palabras sin su acento", () => {
    const malas = tarjetas.filter((t) => SIN_ACENTO.test(`${t.title ?? ""} ${t.body}`)).map((t) => t.node_id);
    const malasQ = preguntas
      .filter((q) => SIN_ACENTO.test(Object.values(q).filter((v) => typeof v === "string").join(" ")))
      .map((q) => q.node_id);
    expect([...malas, ...malasQ]).toEqual([]);
  });
  it("las preguntas del mundo 3 abren con «¿»", () => {
    const t = (id: string, o: number) => tarjetas.find((x: any) => x.node_id === id && x.card_order === o)!;
    expect(t("3.0", 1).body).toContain("¿Le crees? ¿Te las tomas?");
    expect(t("3.2", 4).body).toContain('"¿cuánto le subieron este año?"');
  });
  it("las tarjetas de los retos finales ya no dicen «Boss» y el 3.10 es el del Mundo 3", () => {
    expect(tarjetas.filter((t) => /\bboss\b/i.test(`${t.title ?? ""} ${t.body}`)).map((t) => t.node_id)).toEqual([]);
    expect(tarjetas.find((t: any) => t.node_id === "3.10" && t.card_order === 1)!.title).toBe("Reto final del Mundo 3.");
  });
  it("el botón para entrar a un reto final dice «Entrar al reto», no «examen»", () => {
    const nodo = leer("routes/nodo.$nodeId.tsx");
    expect(nodo).toContain('return { label: "Entrar al reto" }');
    expect(nodo).not.toContain("Entrar al examen");
  });
});

describe("El coach", () => {
  it("convierte **negritas** en negritas de verdad, sin HTML", () => {
    const coach = leer("components/closer/CoachBubble.tsx");
    expect(coach).toContain("export function TextoCoach");
    expect(coach).toContain('m.role === "assistant" ? <TextoCoach texto={m.content} /> : m.content');
    expect(coach).not.toContain("dangerouslySetInnerHTML");
  });
  it("llama a los nodos como el mapa (su nombre claro) y a los retos «reto final»", () => {
    const a = armarAvance(
      [{ id: 1, name: "La Introducción" }],
      [
        { id: "1.5", world_id: 1, name: "El Rompe Hielo", nombre_corto: "Romper el hielo", order_index: 5 },
        { id: "1.6", world_id: 1, name: "La Primera Impresión", nombre_corto: "La llegada completa", order_index: 6, is_boss: true },
      ],
      [{ node_id: "1.5", status: "done", stars: 3 }],
    );
    expect(a.texto).toContain("✓ 1.5 Romper el hielo ★★★");
    expect(a.texto).toContain("▶ 1.6 La llegada completa (reto final)");
    expect(a.texto).toContain("Le toca: nodo 1.6 «La llegada completa»");
    expect(a.texto).not.toContain("(boss)");
    expect(leer("lib/coach-chat.functions.ts")).toContain('select("id, world_id, name, nombre_corto, order_index, is_boss")');
  });
});
