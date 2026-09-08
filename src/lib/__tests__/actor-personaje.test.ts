// El Actor nunca actúa como vendedor, y Closer se firma como Closer.
//
// Sept-2026: en una práctica de voz el usuario le habló al sistema ("aquí ya
// tuviste que haber cortado") y el Actor, sin instrucción para ese caso,
// respondió como VENDEDOR ("esas sí las puedo surtir, ¿cuántas cubetas anda
// necesitando?"). Y el mensaje de cierre de Closer apareció firmado como
// "Cliente". Estas pruebas fijan las dos reglas.

import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const fn = readFileSync(join(process.cwd(), "supabase/functions/closer-voice/index.ts"), "utf8");
const ui = readFileSync(join(process.cwd(), "src/routes/nodo.$nodeId.practica.tsx"), "utf8");

describe("Actor: el meta-comentario no entra al diálogo", () => {
  it("tiene la puerta (c): el usuario le habla al sistema", () => {
    expect(fn).toMatch(/\(c\) Si el usuario LE HABLA AL SISTEMA/);
  });

  it("aplica el desvío con regreso, los tres movimientos", () => {
    expect(fn).toMatch(/EL DESVÍO CON REGRESO/);
    expect(fn).toMatch(/1\. Contestas en UNA frase/);
    expect(fn).toMatch(/2\. Regresas TÚ/);
    expect(fn).toMatch(/3\. Devuelves la palabra retomando la ÚLTIMA FRASE VIVA/);
  });

  it("regresar no es pedir permiso", () => {
    expect(fn).toMatch(/Nunca preguntas si pueden seguir/);
    expect(fn).toMatch(/es pedir permiso — justo lo que la doctrina prohíbe/);
  });
});

describe("Actor: al salir del personaje es Closer, nunca el vendedor", () => {
  it("lo declara explícitamente", () => {
    expect(fn).toMatch(/CUANDO SALES DEL PERSONAJE, ERES CLOSER — NUNCA EL VENDEDOR/);
    expect(fn).toMatch(/no ofreces producto, no propones surtir, no preguntas cuánto necesita, no cierras/);
  });

  it("si demuestra una técnica, la demuestra bien ejecutada", () => {
    expect(fn).toMatch(/Close With Action y alternativa/);
    expect(fn).toMatch(/Closer no puede violar en la práctica lo que califica en el drill/);
  });
});

describe("Transcript: Closer se firma como Closer", () => {
  it("existe la etiqueta por fase", () => {
    expect(ui).toMatch(/function etiquetaAsistente\(/);
    expect(ui).toMatch(/"Closer" \| "Cliente"/);
  });

  it("el mensaje de cierre del guion se reconoce como Closer", () => {
    expect(ui).toMatch(/phases\?\.closing/);
    expect(ui).toMatch(/closerMsgsRef\.current = new Set/);
  });

  it("ningún render firma al asistente como Cliente a secas", () => {
    // Fuera del i_do, la etiqueta debe pasar por etiquetaAsistente.
    const aSecas = ui.match(/isAgent \? "Cliente" : "Tú"/g) ?? [];
    expect(aSecas).toEqual([]);
  });
});
