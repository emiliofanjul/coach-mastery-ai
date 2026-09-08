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

  it("contesta en una frase y devuelve la palabra AL VENDEDOR, no al cliente", () => {
    expect(fn).toMatch(/1\. Contestas en UNA frase/);
    expect(fn).toMatch(/2\. Le devuelves la palabra AL VENDEDOR/);
    expect(fn).toMatch(/"Sigue tú:"/);
  });

  it("en el turno meta el cliente NO habla (evita inversión y repetición)", () => {
    expect(fn).toMatch(/EN ESTE TURNO EL CLIENTE NO HABLA/);
    expect(fn).toMatch(/no repitas tu turno anterior/);
  });

  it("marca el turno con meta_turn y el cliente lo saca del historial del Actor", () => {
    expect(fn).toMatch(/"meta_turn": true/);
    expect(fn).toMatch(/meta_turn\?: boolean/);
    expect(ui).toMatch(/const metaTurn: boolean = data\?\.meta_turn === true/);
    expect(ui).toMatch(/if \(!metaTurn\) \{\s*conversationHistoryRef\.current = \[/);
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
