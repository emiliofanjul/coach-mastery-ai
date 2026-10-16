// Las reglas de los bloqueos se escriben como PRUEBA, igual que el pitch
// prematuro, y el Director y el evaluador aplican esa misma prueba (Emilio,
// 16-oct-2026: "no queremos estar parchando, queremos arreglarlo de raíz").
// Además, el Director solo corta por una falla crítica que puede demostrar con
// una frase literal del vendedor, y lo registra.
import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { verificarCritica } from "../../../supabase/functions/_shared/critica";

const leer = (p: string) => readFileSync(join(process.cwd(), p), "utf8");
const director = leer("supabase/functions/director/index.ts");
const nodos: any[] = JSON.parse(leer("docs/kb/nodos_snapshot.json"));
const reglas: any[] = JSON.parse(leer("docs/kb/reglas.json"));
const harness = JSON.parse(leer("supabase/functions/_shared/eval_harness_v1.json"));
const regla = (id: string) => reglas.find((r) => r.id === id);
const falla = (n: string, f: string) => nodos.find((x) => x.id === n).practice_script.failure_criteria.find((x: any) => x.id === f);

describe("Las reglas de los bloqueos son pruebas, no listas", () => {
  for (const id of ["opening.pide_permiso", "opening.se_disculpa", "blocks.discute_bloqueo", "blocks.air_sin_resume", "blocks.air_sin_aceptar", "blocks.se_rinde_al_bloqueo", "blocks.insistir_tras_dos_no"]) {
    it(id, () => expect(regla(id)?.resumen).toMatch(/LA PRUEBA:/));
  }
  it("pedir permiso es dar la opción de decir que no a seguir", () => {
    expect(regla("opening.pide_permiso").resumen).toContain("¿la frase le da al cliente la opción de decir que no a seguir la plática?");
  });
  it("discutir es tratar de cambiar el no del cliente", () => {
    expect(regla("blocks.discute_bloqueo").resumen).toContain("¿el vendedor trata de cambiar el no del cliente");
  });
});

describe("Cada falla, ligada a la regla que la define", () => {
  it("rendirse al primer bloqueo tiene su regla del Mundo 2 (antes usaba una del Mundo 3)", () => {
    for (const [n, f] of [["2.7", "se_disculpa_o_se_va"], ["2.7c", "se_va_al_primero"], ["2.10", "se_disculpa_o_se_va"]]) {
      expect(falla(n, f)).toMatchObject({ regla_id: "blocks.se_rinde_al_bloqueo", severity: "critical" });
      expect(falla(n, f).severity_override).toBeUndefined();
    }
  });
  it("disculparse tiene su regla, separada de pedir permiso", () => {
    for (const n of ["1.4", "1.6"]) expect(falla(n, "se_disculpa").regla_id).toBe("opening.se_disculpa");
    expect(falla("2.7c", "se_va_con_disculpa").regla_id).toBe("opening.se_disculpa");
  });
  it("no reconocer lo que dijo el cliente tiene su regla, separada de no retomar", () => {
    expect(falla("2.7", "ignora_sin_aceptar").regla_id).toBe("blocks.air_sin_aceptar");
    expect(falla("2.9", "avanza_atropellando").regla_id).toBe("blocks.air_sin_aceptar");
  });
});

describe("El Director aplica la prueba y demuestra la falla", () => {
  const conversacion = [
    { role: "user", content: "Hola, don Héctor. Buen día. ¿Cómo está?" },
    { role: "assistant", content: "Ahorita ando muy ocupado. No me interesa nada, gracias." },
    { role: "user", content: "Claro, claro, claro. Me imagino. Oiga, no, pero nada más, este, eh, quería preguntarle cómo le ha ido en la semana." },
    { role: "assistant", content: "Pues bien, pero de verdad ahorita no puedo, ando a tope." },
  ];
  const criticas = ["insiste_tras_dos", "discute_el_bloqueo", "se_va_al_primero"];
  it("verificarCritica: id crítico y frase literal del vendedor", () => {
    expect(verificarCritica({ falla_critica_id: "discute_el_bloqueo", cita: "no, pero nada mas, este", criticas, conversacion }).valida).toBe(true);
    expect(verificarCritica({ falla_critica_id: "pide_permiso_de_nuevo", cita: "no, pero nada más", criticas, conversacion }).motivo).toBe("falla_no_critica");
    expect(verificarCritica({ falla_critica_id: "insiste_tras_dos", cita: null, criticas, conversacion }).motivo).toBe("sin_cita");
    expect(verificarCritica({ falla_critica_id: "insiste_tras_dos", cita: "de verdad ahorita no puedo", criticas, conversacion }).motivo).toBe("cita_no_es_del_vendedor");
  });
  it("el Director aplica LA PRUEBA de la regla, no listas de palabras", () => {
    expect(director).toContain('const DIRECTOR_VERSION = "v2.6.0-sonnet";');
    expect(director).toContain('Si la regla trae "LA PRUEBA", esa prueba ES el alcance de la falla');
    expect(director).not.toContain('"no, pero", "nada más"');
    expect(director).toContain("if (cls.falla_critica === true && verificacion?.valida) {");
    expect(director).toContain("falla_critica_descartada: row.falla_critica_descartada ?? null,");
  });
  it("la red tiene las dos prácticas reales", () => {
    for (const id of ["G37_de_volada_no_es_permiso", "G38_no_pero_nada_mas_no_es_discutir"]) expect(harness.cases.some((c: any) => c.id === id)).toBe(true);
  });
});
