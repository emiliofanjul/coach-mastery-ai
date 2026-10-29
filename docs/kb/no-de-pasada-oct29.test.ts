// Mensaje 108 (29-oct-2026). En una corrida del G29 el juez quitó
// insiste_tras_dos: tomó «Uy, sí, joven. Ahorita no tengo tiempo, ando con tres
// carros» como respuesta (empieza con «sí») y no como el primer «no». La
// definición decía que contestar no es un «no», pero no decía qué pasa con
// una respuesta que contesta de pasada y rechaza seguir. Ahora lo dice, igual
// en el Cerebro, en las dos reglas y en el evaluador.
import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const leer = (p: string) => readFileSync(join(process.cwd(), p), "utf8");
const cerebro = leer("docs/kb/cerebro_snapshot.md");
const reglas: any[] = JSON.parse(leer("docs/kb/reglas.json"));
const voz = leer("supabase/functions/closer-voice/index.ts");
const red = leer("supabase/functions/harness-runner/index.ts");
const regla = (id: string) => reglas.find((r) => r.id === id);

describe("Primero el Cerebro", () => {
  it("contestar de pasada y rechazar seguir es un «no»", () => {
    expect(cerebro).toContain("Una respuesta, aunque sea vaga o corta, no es un «no»: no rechazó nada, y lo que toca es seguir. Pero si en la misma respuesta contesta algo de pasada y rechaza seguir, sí es un «no»: cuenta lo que la respuesta hace con lo que el vendedor intentaba, no cómo empieza.");
  });
});

describe("Luego las reglas: las dos con la misma prueba de un «no»", () => {
  const frase = "Si contesta, aunque sea vago o corto, no es un «no». Si contesta algo de pasada pero en la misma respuesta rechaza seguir, sí es un «no»: cuenta lo que la respuesta hace, no cómo empieza.";
  it("flow.dos_no_seguidos y blocks.insistir_tras_dos_no", () => {
    expect(regla("flow.dos_no_seguidos").resumen).toContain(frase);
    expect(regla("blocks.insistir_tras_dos_no").resumen).toContain(frase);
    for (const id of ["flow.dos_no_seguidos", "blocks.insistir_tras_dos_no"]) expect(cerebro).toContain(regla(id).cita_cerebro);
  });
});

describe("El evaluador dice lo mismo", () => {
  it("en las reglas de los no y en el hecho cliente_antes", () => {
    expect(voz).toContain("una respuesta vaga o corta, una duda o una objeción NO son un «no»; pero si en la misma respuesta contesta algo de pasada y rechaza seguir, SÍ es un «no»: cuenta lo que la respuesta hace, no cómo empieza.");
    expect(voz).toContain('"rechaza" (rechaza lo que el vendedor intentaba en ese momento, aunque traiga excusa o conteste algo de pasada)');
    expect(voz).toContain('const PROMPT_VERSION = "v2.9.6"');
  });
});

describe("La red enseña qué faltaba", () => {
  it("la falta de cada criterio llega con 300 caracteres, no 60", () => {
    expect(red).toContain("(falta: ${String(d.falta).slice(0, 300)})");
    expect(red).not.toContain("slice(0, 60)");
  });
});
