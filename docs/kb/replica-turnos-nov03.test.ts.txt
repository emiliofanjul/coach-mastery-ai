import { describe, it, expect } from "vitest";
import { readFileSync } from "fs";
import { resolve } from "path";
import { vistaDeDisputa, type Disputa } from "../disputas-reporte";

// Mensaje 130 (3-nov-2026). En la disputa repetida del 3.10, Closer dijo «ya
// te contó el dolor completo en turno 5», y el juez y la página de disputas
// llaman a ese mismo mensaje turno 10. Ahora los tres numeran igual.

const raiz = resolve(__dirname, "../../..");
const voz = readFileSync(resolve(raiz, "supabase/functions/closer-voice/index.ts"), "utf8");

// La función real, copiada del archivo, para ejecutarla sin Deno.
const fuente = voz.slice(voz.indexOf("export function transcriptNumerado"), voz.indexOf("function buildReplicaSystemPrompt("));
const transcriptNumerado = new Function(
  fuente.replace("export function", "return function").replace(/: unknown/g, "").replace(/: \{ turno: number; quien: string; dijo: string \}\[\]/, "").replace(/\(t: any, i: number\)/, "(t, i)"),
)() as (c: unknown) => { turno: number; quien: string; dijo: string }[];

describe("la respuesta a la disputa numera los turnos como el juez y la página", () => {
  const conv = Array.from({ length: 14 }, (_, i) => ({ role: i % 2 === 0 ? "user" : "assistant", content: `m${i + 1}` }));

  it("1 = el primer mensaje, contando vendedor y cliente", () => {
    const t = transcriptNumerado(conv);
    expect(t[0]).toEqual({ turno: 1, quien: "vendedor", dijo: "m1" });
    expect(t[9]).toEqual({ turno: 10, quien: "cliente", dijo: "m10" });
  });

  it("coincide con la página de disputas", () => {
    const d = { contexto: { conversacion: conv } } as unknown as Disputa;
    const pagina = vistaDeDisputa(d).turnos;
    const replica = transcriptNumerado(conv);
    expect(replica.map((t) => t.turno)).toEqual(pagina.map((t) => t.n));
    expect(replica.map((t) => t.quien)).toEqual(pagina.map((t) => (t.quien === "Vendedor" ? "vendedor" : "cliente")));
  });

  it("el prompt de la respuesta usa la conversación numerada y pide usar ese número", () => {
    expect(voz).toContain("${JSON.stringify(transcriptNumerado(conversation_history), null, 2)}");
    expect(voz).toContain("Cuando digas «turno N», usa SIEMPRE este número");
  });

  it("la red reporta cuántas fallas espejo se quitaron", () => {
    const red = readFileSync(resolve(raiz, "supabase/functions/harness-runner/index.ts"), "utf8");
    expect(red).toContain("espejos_quitados: Number(parsed?.auditoria?.fallas_espejo_quitadas ?? 0)");
  });
});
