// Mensaje 114 (31-oct-2026) · Lo que cuesta cada llamada tiene que quedar guardado.
// Desde el 29-oct llm_calls no tenía registros y nadie se enteró: el insert
// devolvía su error y el código no lo miraba. Y la red mandaba
// session_id = «harness-<uuid>», que no cabe en la columna uuid.
import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const leer = (p: string) => readFileSync(join(process.cwd(), p), "utf8");
const voz = leer("supabase/functions/closer-voice/index.ts");
const red = leer("supabase/functions/harness-runner/index.ts");

describe("El registro de llm_calls no falla en silencio", () => {
  it("closer-voice revisa el error que devuelve el insert", () => {
    expect(voz).toContain('const { error } = await admin.from("llm_calls").insert({');
    expect(voz).toContain('if (error) console.error("[closer-voice] llm_calls insert failed:"');
  });
  it("la red manda un uuid real y lo devuelve por caso", () => {
    expect(red).not.toContain("harness-${");
    expect(red).toContain("const sessionId = crypto.randomUUID();");
    expect(red).toContain("session_id: sessionId,");
    expect(red).toContain("session_ids?: string[];");
  });
});

describe("El registro que no se espera no se pierde", () => {
  it("las llamadas sueltas a logLlmCall van con waitUntil", () => {
    expect(voz).toContain("rt.waitUntil(p)");
    expect(voz.match(/^\s+logLlmCall\(\{/gm)).toBeNull();
    expect(voz.match(/enSegundoPlano\(logLlmCall\(\{/g)?.length).toBe(3);
  });
});

describe("Mensaje 115: todas las llamadas al modelo quedan guardadas", () => {
  it("solo hay dos fetch a la API: la llamada principal y llamarModelo, que guarda lo que costó", () => {
    expect(voz.match(/fetch\("https:\/\/api\.anthropic\.com/g)?.length).toBe(2);
    const i = voz.indexOf("async function llamarModelo(");
    expect(voz.slice(i, i + 1500)).toContain("enSegundoPlano(logLlmCall({");
  });
  it("el juez, el auditor, la ficha y la reescritura pasan por llamarModelo con su fase", () => {
    expect(voz).toContain('}, "juez", quien));');
    expect(voz).toContain('}, "auditor", quien));');
    expect(voz).toContain('400, 0.9, "ficha_cliente", {');
    expect(voz).toContain('"reescritura",');
  });
});
