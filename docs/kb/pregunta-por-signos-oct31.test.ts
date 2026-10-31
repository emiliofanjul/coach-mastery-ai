// Mensaje 116 (31-oct-2026) · Cuando el texto trae signos, dónde va la pregunta se lee.
// G26: el evaluador anotó «ninguna» para «¡Buenos días Don Ramón! ¿Cómo está?
// Oiga, qué movido se ve el negocio hoy, veo que no paran.» y el juez subió la
// estructura a cumple. La pregunta va en medio: lo dicen los signos.
import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { preguntaPorSignos, corregirPreguntaPorSignos, criteriosPorHechoDePregunta, fallasPorHechoDePregunta } from "../../../supabase/functions/_shared/hechos_pregunta.ts";

const leer = (p: string) => readFileSync(join(process.cwd(), p), "utf8");
const voz = leer("supabase/functions/closer-voice/index.ts");
const harness = JSON.parse(leer("supabase/functions/_shared/eval_harness_v1.json"));
const nodos: any[] = JSON.parse(leer("docs/kb/nodos_snapshot.json"));
const historia = (id: string) => harness.cases.find((c: any) => c.id === id).transcript.map((t: any) => ({ role: t.role, content: t.text }));

describe("Leer la pregunta de los signos", () => {
  it("al final, en medio, o no se puede leer", () => {
    expect(preguntaPorSignos("¡Buenos días! Veo que no paran, ¿siempre está así?")).toBe("al_final");
    expect(preguntaPorSignos("¿Cómo le va?\" ")).toBe("al_final");
    expect(preguntaPorSignos("¿Siempre está así?!")).toBe("al_final");
    expect(preguntaPorSignos("¡Buenos días! ¿Cómo le va? Qué gusto saludarlo.")).toBe("en_medio");
    expect(preguntaPorSignos("¿Cómo está? ¡Qué gusto!")).toBe("en_medio");
    expect(preguntaPorSignos("buenos dias como esta")).toBeNull();
    expect(preguntaPorSignos("Buenos días. Qué movido.")).toBeNull();
  });
  it("G26: el «ninguna» del evaluador se corrige a en_medio, y la estructura queda en parcial", () => {
    const ev: any = {
      analisis_turnos: [{ turno: 1, pregunta: "ninguna" }],
      veredictos_criterios: [{ criterio_id: "opening.estructura_apertura", nivel: "cumple" }],
      flags_detected: [],
    };
    expect(corregirPreguntaPorSignos(ev, historia("G26_especifica_pero_plana"))).toBe(1);
    expect(ev.analisis_turnos[0].pregunta).toBe("en_medio");
    const ps = nodos.find((n) => n.id === "1.6").practice_script;
    expect(fallasPorHechoDePregunta(ev, ps)).toEqual([]);
    expect(criteriosPorHechoDePregunta(ev, ps)).toEqual(["opening.estructura_apertura"]);
    expect(ev.veredictos_criterios[0].nivel).toBe("parcial");
  });
  it("sin signos se queda lo que anotó el evaluador", () => {
    const ev: any = { analisis_turnos: [{ turno: 1, pregunta: "al_final" }] };
    expect(corregirPreguntaPorSignos(ev, [{ role: "user", content: "buenos dias como esta" }])).toBe(0);
    expect(ev.analisis_turnos[0].pregunta).toBe("al_final");
  });
  it("si los turnos no cuadran con la conversación, no toca nada", () => {
    const ev: any = { analisis_turnos: [{ turno: 1, pregunta: "ninguna" }, { turno: 2, pregunta: "ninguna" }] };
    expect(corregirPreguntaPorSignos(ev, [{ role: "user", content: "¿Cómo está? Bien." }])).toBe(0);
  });
  it("los mensajes seguidos del vendedor son un turno; el del cliente no cuenta", () => {
    const ev: any = { analisis_turnos: [{ turno: 1, pregunta: "ninguna" }, { turno: 2, pregunta: "ninguna" }] };
    const h = [
      { role: "user", content: "¡Buenos días!" }, { role: "user", content: "¿Cómo le va?" },
      { role: "assistant", content: "¿Qué vende?" },
      { role: "user", content: "Filtros. ¿Qué marca usa? Le pregunto porque cambió." },
    ];
    expect(corregirPreguntaPorSignos(ev, h)).toBe(2);
    expect(ev.analisis_turnos.map((t: any) => t.pregunta)).toEqual(["al_final", "en_medio"]);
  });
  it("closer-voice corrige el hecho antes de usarlo", () => {
    const i = voz.indexOf("const preguntasCorregidas = corregirPreguntaPorSignos(evaluation, fullHistory);");
    expect(i).toBeGreaterThan(0);
    expect(i).toBeLessThan(voz.indexOf("const fallasPorHecho = fallasPorHechoDePregunta(evaluation, practice_script);"));
  });
  it("en la red, cada apertura con signos lee lo mismo que espera su caso", () => {
    // Si un caso espera la estructura en cumple, su primer turno tiene que leer al_final (o no leerse).
    for (const c of harness.cases) {
      const nivel = c?.expected?.niveles_esperados?.["opening.estructura_apertura"];
      const primero = c.transcript?.find((t: any) => t.role === "user")?.text;
      if (!nivel || !primero || c.transcript[0].role !== "user") continue;
      const leido = preguntaPorSignos(primero);
      if (nivel === "cumple") expect([null, "al_final"], c.id).toContain(leido);
    }
  });
});
