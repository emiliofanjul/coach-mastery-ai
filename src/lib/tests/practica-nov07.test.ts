// Mensaje 151 (7-nov-2026) · Fase 4 del rediseño: la pantalla de práctica (antes de empezar, la demostración
// y la conversación). Lo que Emilio aprobó en la maqueta: el cliente al centro con sus iniciales, no Closer;
// Closer al centro solo cuando demuestra; el anillo se mueve con la voz de quien habla; lo que se dice va en
// una franja de altura fija; el micrófono es un ícono dibujado con tres estados; sin contador de turnos
// (la práctica puede terminar antes del máximo y no debe sentirse incompleta); y nada de emojis.
// Solo cambia cómo se ve: la voz, los turnos y la calificación no se tocan.
import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";
import { inicialesDe } from "../../components/closer/practica-ui";

const RAIZ = path.resolve(__dirname, "../..");
const leer = (r: string) => fs.readFileSync(path.join(RAIZ, r), "utf8");
const practica = leer("routes/nodo.$nodeId.practica.tsx");
const ui = leer("components/closer/practica-ui.tsx");
const piezas = leer("components/closer/piezas.tsx");

describe("La conversación", () => {
  it("el cliente va al centro con sus iniciales; Closer solo cuando demuestra", () => {
    expect(practica).toContain("{isIDo || !cliente ? (");
    expect(practica).toContain("<EscenarioCliente");
    expect(practica).toContain("cliente={fichaCliente}");
    expect(inicialesDe("Don Ramón")).toBe("DR");
    expect(inicialesDe("Doña Lupe Pérez")).toBe("DP");
    expect(inicialesDe("Memo")).toBe("M");
  });
  it("lo que se dice va en una franja fija que muestra las últimas palabras", () => {
    expect(ui).toContain("export function FranjaDialogo");
    expect(ui).toContain("height: 104,");
    expect(ui).toContain('justifyContent: "flex-end"');
  });
  it("el micrófono es un ícono dibujado, y el anillo de grabación sigue la voz de verdad", () => {
    expect(ui).toContain("export function IconoMicrofono");
    expect(ui).toContain("transform: `scale(${1 + Math.min(1, nivelVoz * 1.4) * 0.22})`");
  });
  it("sin contador de turnos ni letrero de fase", () => {
    expect(practica).not.toMatch(/Turno \$\{/);
    expect(practica).not.toContain("Tu turno — Hazlo solo.");
  });
  it("el escenario se encoge en pantallas bajas para que nada se encime", () => {
    expect(ui).toContain('const ESCENARIO = "min(196px, 25dvh)";');
  });
});

describe("Antes de empezar", () => {
  it("el nombre claro del nodo, la misión arriba y lo del micrófono en un renglón", () => {
    expect(practica).toContain("nodes?select=nombre_corto,minutos_estimados&id=eq.");
    expect(practica).toContain("const titulo = infoMapa?.nombre_corto || nodeData?.name");
    expect(practica).toContain("Micrófono listo · Sube el volumen · Busca silencio");
  });
});

describe("Sin emojis en la pantalla de práctica", () => {
  it("ni 🎤, ni ⌨️, ni 🔊, ni ➤", () => {
    for (const e of ["🎤", "⌨️", "🔊", "➤"]) expect(practica).not.toContain(e);
  });
  it("los botones son los de piezas.tsx, sin flechas «→»", () => {
    expect(practica).toMatch(/>\s*Listo, ahora yo\s*</);
    expect(practica).not.toContain("Listo, ahora yo →");
    expect(practica).not.toContain("Yo soy el vendedor →");
  });
});

describe("Las estrellas", () => {
  it("una ganada brilla poco, y es la misma pieza en el mapa y en su ventana", () => {
    expect(piezas).toContain("export function Estrella");
    expect(piezas).toContain("--c-estrella-rgb");
    expect(leer("routes/mapa.tsx")).toContain("<Estrella key={i} ganada={i < node.stars} tam={20} />");
  });
});
