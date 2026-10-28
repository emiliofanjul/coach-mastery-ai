// Mensaje 103 (21-oct-2026). Práctica real del 2.7c en modo texto: el cierre de
// Closer («Pasaste el primer no con AIR… Vamos al detalle») entró a la
// evaluación como si lo hubiera dicho el cliente. Y el juez leyó «nada más,
// quería preguntarle cómo le ha ido…» como pedir permiso.
import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { dialogoDeVenta, marcarUltimoDelVendedorFueraDeLaVenta, type TranscriptItem } from "../dialogo-venta";

const leer = (p: string) => readFileSync(join(process.cwd(), p), "utf8");
const ui = leer("src/routes/nodo.$nodeId.practica.tsx");
const reglas: any[] = JSON.parse(leer("docs/kb/reglas.json"));
const harness = JSON.parse(leer("supabase/functions/_shared/eval_harness_v1.json"));
const regla = (id: string) => reglas.find((r) => r.id === id).resumen as string;

const practica: TranscriptItem[] = [
  { role: "agent", text: "Así se abre.", phase: "i_do" },
  { role: "user", text: "Hola, don Héctor. ¿Cómo está?", phase: "you_do" },
  { role: "agent", text: "Ahorita ando ocupado, joven.", phase: "you_do" },
  { role: "user", text: "Oye, ¿eres una inteligencia artificial?", phase: "you_do", fuera_de_la_venta: true },
  { role: "agent", text: "Soy Closer; seguimos, ahí viene don Héctor.", phase: "you_do", fuera_de_la_venta: true },
  { role: "user", text: "Claro, me imagino. ¿Cómo le ha ido?", phase: "you_do" },
  { role: "agent", text: "Pasaste el primer no con AIR. Vamos al detalle.", phase: "you_do", fuera_de_la_venta: true },
];

describe("Solo se evalúa el diálogo de venta", () => {
  it("sin la demostración, sin los desvíos y sin el cierre de Closer", () => {
    expect(dialogoDeVenta(practica)).toEqual([
      { role: "user", content: "Hola, don Héctor. ¿Cómo está?" },
      { role: "assistant", content: "Ahorita ando ocupado, joven." },
      { role: "user", content: "Claro, me imagino. ¿Cómo le ha ido?" },
    ]);
  });
  it("marca el turno meta del vendedor, no el del cliente", () => {
    const items: TranscriptItem[] = [
      { role: "user", text: "a", phase: "you_do" },
      { role: "agent", text: "b", phase: "you_do" },
      { role: "user", text: "¿eres una IA?", phase: "you_do" },
    ];
    const m = marcarUltimoDelVendedorFueraDeLaVenta(items);
    expect(m.map((x) => x.fuera_de_la_venta === true)).toEqual([false, false, true]);
    expect(items[2].fuera_de_la_venta).toBeUndefined();
  });
  it("la pantalla de práctica lo usa para evaluar y para las disputas, y marca el cierre y los desvíos", () => {
    expect(ui).toContain("conversation_history: dialogoDeVenta(transcriptFullRef.current),");
    expect(ui).toContain("const youDoConv = dialogoDeVenta(transcriptFullRef.current);");
    expect(ui).toContain("// El cierre lo dice Closer, no el cliente: no se evalúa (mensaje 103).\n          fuera_de_la_venta: true,");
    expect(ui).toContain("...(metaTurn ? { fuera_de_la_venta: true } : {}),");
    expect(ui).toContain("transcriptFullRef.current = marcarUltimoDelVendedorFueraDeLaVenta(transcriptFullRef.current);");
    expect(ui).not.toContain('.filter((m) => m.phase === "you_do")\n          .map((m) => ({ role: m.role === "agent" ? "assistant" : "user", content: m.text })),');
  });
});

describe("Pedir permiso es condicionar el seguir a un sí", () => {
  it("la regla de pedir permiso lo dice como principio", () => {
    expect(regla("opening.pide_permiso")).toContain("Pedir permiso es condicionar el seguir a que el cliente diga que sí");
    expect(regla("opening.pide_permiso")).toContain("Anunciar lo que vas a hacer y hacerlo en el mismo turno, sin condicionarlo");
    expect(regla("opening.pide_permiso")).toContain("«si no le molesta…»");
  });
  it("la regla de no retomar usa la misma prueba y lo dice", () => {
    expect(regla("blocks.air_sin_resume")).toContain("(con la prueba de pedir permiso: condicionar el seguir a que el cliente diga que sí)");
    expect(regla("blocks.air_sin_resume")).toContain("es retomar, no pedir permiso");
  });
  it("la práctica real entra a la red", () => {
    const c = harness.cases.find((x: any) => x.id === "G43_practica_real_2_7c_texto");
    expect(c.expected.must_not_flag).toContain("pide_permiso_de_nuevo");
    expect(c.expected.niveles_esperados).toEqual({ "blocks.air": "cumple", "blocks.dos_no_seguidos": "cumple" });
    expect(harness.harness_version).toMatch(/^v3\.(2[3-9]|[3-9]\d)\./);
  });
});
