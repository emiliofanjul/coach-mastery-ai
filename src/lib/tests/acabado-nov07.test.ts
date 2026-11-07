// Mensaje 146 (7-nov-2026) · Fase 2 del rediseño: el acabado.
// Emilio aprobó la maqueta: botones de esquina redondeada (no píldora), íconos dibujados (no emojis),
// barra de avance en segmentos, tarjetas a la medida de su contenido, y el quiz que dice cuántas
// acertaste y cuáles fallaste. Textos que él decidió: «manager», «Bienvenido de vuelta», «Iniciar sesión».
import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";

const RAIZ = path.resolve(__dirname, "../..");
const leer = (r: string) => fs.readFileSync(path.join(RAIZ, r), "utf8");
const css = leer("styles.css");
const piezas = leer("components/closer/piezas.tsx");
const role = leer("routes/role.tsx");
const login = leer("routes/login.tsx");
const signup = leer("routes/signup.tsx");
const nodo = leer("routes/nodo.$nodeId.tsx");
const quiz = leer("routes/nodo.$nodeId.quiz.tsx");
const retry = leer("components/RetryScreen.tsx");
const victoria = leer("components/VictoryScreen.tsx");

const EMOJI = /[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/u;

describe("Las medidas viven en styles.css", () => {
  it("botón 56 px con esquinas de 16, campo 52 con 14, tarjeta con 20", () => {
    for (const v of ["--h-boton: 56px", "--r-boton: 16px", "--h-campo: 52px", "--r-campo: 14px", "--r-tarjeta: 20px", "--m-pantalla: 20px"]) {
      expect(css).toContain(v);
    }
  });
  it("las piezas base usan esas medidas y no escriben otras", () => {
    expect(piezas).toContain('height: "var(--h-boton)"');
    expect(piezas).toContain('borderRadius: "var(--r-boton)"');
    for (const f of ["estiloBoton", "BarraSegmentos", "CuadroIcono", "EncabezadoPantalla"]) expect(piezas).toContain(`export function ${f}`);
  });
});

describe("Ya no hay botones de píldora en las pantallas del rediseño", () => {
  it("entrar, elegir modo, nodo, quiz, repetir y victoria usan el botón de Closer", () => {
    expect(login).toContain('estiloBoton("principal", off)');
    expect(login).toContain('googleBtn: React.CSSProperties = estiloBoton("secundario")');
    expect(role).toContain('estiloBoton("principal", !role)');
    expect(nodo).toContain('style={estiloBoton("principal")}');
    expect(quiz).toContain('estiloBoton("principal", !answered)');
    expect(retry).toContain('estiloBoton("principal")');
    expect(victoria).toContain('estiloBoton("principal")');
    for (const t of [role, nodo, quiz, retry, victoria]) expect(t).not.toMatch(/height: 52,\s*\n?\s*(marginTop: [^,]+,\s*)?borderRadius: 99/);
  });
});

describe("Elegir modo y entrar", () => {
  it("íconos dibujados en lugar de emojis, y los textos que decidió Emilio", () => {
    expect(role).not.toMatch(EMOJI);
    expect(role).toContain("Entrenar por mi cuenta");
    expect(role).toContain("Mi manager me compartió un código.");
    expect(role).toContain("Iniciar sesión");
    expect(login).toContain("Bienvenido de vuelta");
    expect(login).not.toMatch(/🙈|👁/);
    expect(signup).not.toMatch(/🚀|💼|🎯/);
  });
  it("los campos usan letra de 16 px (con menos, el iPhone hace zoom al tocarlos)", () => {
    expect(login).toMatch(/fontSize: 16,\s*fontFamily: "inherit"/);
  });
});

describe("Tarjetas del nodo", () => {
  it("miden lo que su contenido: sin la altura fija de 360 px", () => {
    expect(nodo).not.toContain("minHeight: 360");
    expect(nodo).toContain('gridArea: "1 / 1"');
  });
  it("al voltear, la cara de enfrente no se transparenta en iPhone (texto en espejo)", () => {
    expect((nodo.match(/WebkitBackfaceVisibility: "hidden"/g) ?? []).length).toBe(2);
  });
  it("barra de segmentos en lugar de puntitos; el botón no se esconde, dice qué falta", () => {
    expect(nodo).toContain("<BarraSegmentos colores={segmentosDeAvance(total, index)} />");
    expect(nodo).not.toContain("{/* Dots */}");
    expect(nodo).toContain("Primero descubre por qué");
    expect(nodo).not.toMatch(/💡|🔧/);
    expect(nodo).not.toMatch(/label: "[^"]*→"/);
  });
});

describe("Quiz", () => {
  it("cada segmento se pinta según contestó, y el botón se queda a la vista", () => {
    expect(quiz).toContain("<BarraSegmentos colores={segmentos} />");
    expect(quiz).toContain('position: "sticky"');
  });
  it("al no pasar, dice cuántas acertó y cuáles falló, y deja repasar las tarjetas", () => {
    expect(quiz).toContain("resumen={{ aciertos: correctCount, total, fallos }}");
    expect(quiz).toContain('secondaryButtonText="Repasar las tarjetas"');
    expect(retry).toContain("resumen.aciertos");
  });
});
