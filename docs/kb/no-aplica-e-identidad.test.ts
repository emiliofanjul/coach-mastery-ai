// "No aplica", la identidad del vendedor y los recuerdos inventados (oct-2026).
import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { calcularScore } from "../../../supabase/functions/_shared/puntuacion";
import { vendedorSePresento, empresaDelCerebro, sanearRecuerdos } from "../../../supabase/functions/_shared/identidad";

const fn = readFileSync(join(process.cwd(), "supabase/functions/closer-voice/index.ts"), "utf8");

describe("'no_aplica': se califica solo lo que se pudo evaluar", () => {
  const criterios = [
    { id: "discovery.preguntas_capas", weight: 0.25 }, { id: "discovery.dolor_real", weight: 0.2 },
    { id: "blocks.air", weight: 0.15 }, { id: "mindset.rrr", weight: 0.15 }, { id: "story.historia_breve", weight: 0.1 },
  ];
  it("la práctica real del 3.10: salida correcta tras tres 'no' = 100, no 50", () => {
    const r = calcularScore({
      successCriteria: criterios, flags: [], failureCriteria: [],
      veredictos: [
        { criterio_id: "discovery.preguntas_capas", nivel: "no_aplica", falta: "Regla de los No" },
        { criterio_id: "discovery.dolor_real", nivel: "no_aplica", falta: "Regla de los No" },
        { criterio_id: "blocks.air", nivel: "cumple" }, { criterio_id: "mindset.rrr", nivel: "cumple" }, { criterio_id: "story.historia_breve", nivel: "cumple" },
      ],
    });
    expect(r.score).toBe(100);
    expect(r.cumplidos).toContain("discovery.preguntas_capas");
  });
  it("un 'no_aplica' no infla: si lo evaluable salió a medias, la nota lo dice", () => {
    const r = calcularScore({
      successCriteria: criterios, flags: [], failureCriteria: [],
      veredictos: [
        { criterio_id: "discovery.preguntas_capas", nivel: "no_aplica" }, { criterio_id: "discovery.dolor_real", nivel: "no_aplica" },
        { criterio_id: "blocks.air", nivel: "parcial" }, { criterio_id: "mindset.rrr", nivel: "cumple" }, { criterio_id: "story.historia_breve", nivel: "no_cumple" },
      ],
    });
    expect(r.score).toBe(Math.round(100 * (0.15 * 0.5 + 0.15) / 0.4));
  });
  it("si nada se pudo evaluar, no hay rúbrica (plan B)", () => {
    const r = calcularScore({ successCriteria: [{ id: "a", weight: 1 }], flags: [], failureCriteria: [], veredictos: [{ criterio_id: "a", nivel: "no_aplica" }] });
    expect(r.valido).toBe(false);
  });
  it("el evaluador sabe cuándo se usa y cuándo no", () => {
    expect(fn).toMatch(/- "no_aplica": la sesión NO PERMITIÓ demostrarlo/);
    expect(fn).toMatch(/Nunca lo uses para lo que el vendedor pudo hacer y no hizo\./);
  });
});

describe("presentarse se verifica en el texto", () => {
  it("las frases que confundieron al evaluador NO son presentarse", () => {
    expect(vendedorSePresento(["¡Buenos días Don Ramón! ¿Cómo está? Veo que andan a tope hoy."], "Luis", "Lubricantes del Golfo")).toBe(false);
    expect(vendedorSePresento(["Me da gusto verlo así de ocupado. Ando por la zona visitando algunos talleres y quise pasar a saludarlo."], "Luis", "Lubricantes del Golfo")).toBe(false);
    expect(vendedorSePresento(["Good morning sir, how are you today?"], "Luis", null)).toBe(false);
  });
  it("y estas sí lo son", () => {
    expect(vendedorSePresento(["Soy Luis, ando visitando talleres."], "Luis", null)).toBe(true);
    expect(vendedorSePresento(["Vengo de Lubricantes del Golfo."], null, null)).toBe(true);
    expect(vendedorSePresento(["Aquí Luis, de la zona."], "Luis Pérez", null)).toBe(true);
    expect(vendedorSePresento(["Le traigo saludos de Lubricantes del Golfo."], null, "Lubricantes del Golfo")).toBe(true);
  });
  it("lee el nombre de la empresa del cerebro", () => {
    expect(empresaDelCerebro("Lubricantes del Golfo: distribuidora de aceites")).toBe("Lubricantes del Golfo");
    expect(empresaDelCerebro("distribuidora de aceites sin nombre")).toBeNull();
  });
  it("el evaluador lo usa antes de calcular la nota", () => {
    expect(fn).toMatch(/v\?\.criterio_id === "opening\.curiosidad_abierta" && !seP && v\.nivel !== "cumple"/);
  });
});

describe("sin recuerdos inventados", () => {
  it("el consejo real de G26 se quita; los buenos se quedan", () => {
    const ev: any = {
      observations: [{ error: "e", mejora: "m", ejemplo: "¡Buenos días don Ramón! Oiga, la última vez que vine me comentó que esperaba un pedido." }],
      mision: "m",
      siguiente_nivel: [
        { observacion: "Con un cliente recurrente, el escalón 3 sería recordar algo de él", ejemplo: "", regla_id: "opening.especificidad" },
        { observacion: "Nombra algo concreto del lugar", ejemplo: "¿Le cayeron todos los clientes juntos?", regla_id: "opening.especificidad" },
      ],
    };
    sanearRecuerdos(ev, "respaldo");
    expect(ev.observations[0].ejemplo).toBe("");
    expect(ev.siguiente_nivel).toHaveLength(1);
    expect(ev.siguiente_nivel[0].ejemplo).toMatch(/clientes juntos/);
  });
});
