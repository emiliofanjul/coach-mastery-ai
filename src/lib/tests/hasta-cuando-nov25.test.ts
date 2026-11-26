// Mensaje 176 (25-nov-2026) · Hasta cuándo es pitch prematuro, y la guía del vendedor.
// El caso: en el 2.1, los cinco ejemplos de Closer terminaban la historia breve con
// «¿usted cómo le hace con los aceites?» —pitch prematuro, la falla grave del nodo— y la
// revisión los dejó pasar; la falla del 2.1 decía solo «mete producto», más corta que su
// regla. Y el 2.8 pide justo una pregunta de su negocio después del motivo de la visita.
// Emilio: ofrecer en la introducción o la historia breve es pitch prematuro; preguntar por
// su operación también, mientras no sabe quién eres y por qué pasaste, o en el mismo turno
// de la historia breve; ya que te presentaste y te contestó, es descubrimiento.
import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { recordatorioFallaCritica, explicacionParaElVendedor } from "../../../supabase/functions/_shared/replica_revisada";

const leer = (p: string) => readFileSync(join(process.cwd(), p), "utf8");
const cerebro = leer("docs/kb/cerebro_snapshot.md");
const regla = JSON.parse(leer("docs/kb/reglas.json")).find((r: any) => r.id === "opening.pitch_prematuro");
const nodos: any[] = JSON.parse(leer("docs/kb/nodos_snapshot.json"));
const ps = (id: string) => nodos.find((n) => n.id === id).practice_script;
const pitch = (id: string) => ps(id).failure_criteria.find((f: any) => f.id === "pitch_prematuro");
const red = JSON.parse(leer("supabase/functions/_shared/eval_harness_v1.json"));
// Mensaje 176-C: el SQL va en dos archivos (Lovable): la estructura de la guía y los datos.
const sql = leer("docs/kb/doctrina_176_estructura.sql") + leer("docs/kb/doctrina_176_datos.sql");

describe("una sola versión de la regla: Cerebro, regla y guiones", () => {
  it("el Cerebro dice cuándo empiezan las preguntas de su negocio", () => {
    expect(cerebro).toContain("**Cuándo empiezan las preguntas de su negocio** `CAMPO`");
    expect(cerebro).toContain("Ya que te contestó, empiezan las preguntas de su negocio");
    expect(cerebro).toContain(regla.cita_cerebro);
  });
  it("la prueba de la regla dice hasta cuándo, con la excepción de la mala experiencia", () => {
    expect(regla.resumen).toContain("Si la respuesta es sí y es antes de tiempo, es pitch prematuro");
    expect(regla.resumen).toContain("o en el mismo turno de tu historia breve, donde la pregunta va sobre él o sobre cómo le va");
    expect(regla.resumen).toContain("Ya que te presentaste y el cliente te contestó, preguntar por su operación es descubrimiento y no es esto.");
    expect(regla.resumen).toContain("Tampoco cuando el cliente sacó una mala experiencia al llegar");
  });
  it("las fallas del mundo 2 ya no achican la regla", () => {
    for (const id of ["2.1", "2.2", "2.5", "2.8", "2.9", "2.10"]) expect(pitch(id).description, id).toContain("operación comercial");
    for (const id of ["2.2", "2.5", "2.9", "2.10"]) expect(pitch(id).description, id).toContain("Ya que se presentó y el cliente le contestó, preguntar por su negocio es descubrimiento y no es esta falla.");
    expect(pitch("2.1").description).toContain("en el mismo turno de su historia breve");
    expect(pitch("2.8").description).toContain("La pregunta que regresa al diagnóstico después del motivo concreto de su visita no es esta falla");
    expect(pitch("2.10").description).toContain("aquí SÍ se dice quién eres y por qué estás.");
    expect([ps("2.1").version, ps("2.2").version, ps("2.5").version, ps("2.8").version, ps("2.9").version, ps("2.10").version])
      .toEqual(["2.0.3", "2.0.3", "2.0.1", "3.0.2", "2.0.2", "2.1.7"]); // el 2.10 subió en el 182
  });
  it("la red lo prueba en los dos sentidos", () => {
    expect(["v3.48.0", "v3.50.0"]).toContain(red.harness_version);
    const g124 = red.cases.find((c: any) => c.id === "G124_operacion_en_la_historia_breve");
    expect(g124.expected.must_flag).toEqual(["pitch_prematuro"]);
    expect(g124.transcript[2].text).toContain("¿Usted cómo le hace con los aceites?");
    const g125 = red.cases.find((c: any) => c.id === "G125_operacion_despues_de_presentarse");
    expect(g125.expected.must_not_flag).toContain("pitch_prematuro");
    expect(red.cases.find((c: any) => c.id === "P2_8_perfecto").expected.must_not_flag).toContain("pitch_prematuro");
    expect(leer("docs/kb/eval_harness_v1.json")).toBe(leer("supabase/functions/_shared/eval_harness_v1.json"));
  });
});

describe("la guía del vendedor (doc aprobado: «El molde de cada paso»)", () => {
  it("11 partes: en cualquier paso, los seis moldes, cuando el cliente… y los factores", () => {
    const claves = [...sql.matchAll(/^ {2}\(\$t\$([a-z_0-9]+)\$t\$, (\d+), /gm)].map((m) => m[1]);
    expect(claves).toEqual(["en_cualquier_paso", "paso_1", "paso_2", "paso_3", "paso_4", "paso_5", "paso_6", "cuando_bloqueos", "cuando_objeciones", "cuando_senales", "factores"]);
  });
  it("el molde del paso 2 dice lo mismo que la regla", () => {
    expect(sql).toContain("- Termina: con una pregunta sobre él o sobre cómo le va. Ya que te contestó, empiezan las preguntas de su negocio: eso ya es descubrimiento.");
  });
  it("solo se lee, y el SQL va sin BEGIN/COMMIT", () => {
    expect(sql).toContain("REVOKE INSERT, UPDATE, DELETE, TRUNCATE ON public.guia_del_vendedor FROM anon, authenticated;");
    expect(sql).toContain("GRANT SELECT ON public.guia_del_vendedor TO authenticated;");
    expect(sql).not.toMatch(/^\s*(BEGIN|COMMIT);/m);
  });
});

describe("en las disputas ya no sale el texto de la prueba", () => {
  // Así llega la falla en vivo: la descripción resuelta trae la regla completa.
  const resuelta = [{ id: "pitch_prematuro", description: `${regla.resumen} — En este nodo: ${pitch("2.1").description}` }];
  const conversacion = [
    { role: "user", content: "Hola, buenas tardes." },
    { role: "assistant", content: "¿Y usted quién es?" },
    { role: "user", content: "Yo soy Emilio, de Aceites y Lubricantes Dalfán, los mejores. Y quería ofrecerle nuestro producto para ver cómo lo podemos ayudar." },
  ];
  const critica = {
    id: "pitch_prematuro", severidad: "critical", cita: "Y quería ofrecerle nuestro producto para ver cómo lo podemos ayudar.",
    error: "Metiste oferta de producto en la presentación: la historia breve dice quién eres, no qué vendes",
    porque: { mecanismo: "La atención en tres tercios", texto: "x", va_en: "el paso 3 si es preguntar por su negocio, o el paso 4 si es ofrecer tu producto", va_despues: "Ahí ya sabe quién eres y por qué pasaste." },
  };
  it("va lo que el vendedor vio en su pantalla: el error y dónde sí va", () => {
    const r = recordatorioFallaCritica({ evaluacion: { fallas: [critica] }, conversacion, concedidas: [], mensaje: "Tienes razón en eso.", fallasDelNodo: resuelta });
    expect(r).toContain("En el turno 3 dijiste «Y quería ofrecerle nuestro producto");
    expect(r).toContain("Metiste oferta de producto en la presentación");
    expect(r).toContain("Esto va más adelante: en el paso 3 si es preguntar por su negocio");
    expect(r).not.toContain("LA PRUEBA");
    expect(r).not.toContain("— En este nodo:");
  });
  it("una calificación vieja, sin error ni porqué, tampoco pega la prueba", () => {
    const e = explicacionParaElVendedor({ id: "pitch_prematuro" }, resuelta);
    expect(e).toBe("");
    expect(explicacionParaElVendedor({ id: "pitch_prematuro" }, [{ id: "pitch_prematuro", description: "Mete producto." }])).toBe(" Mete producto.");
  });
});
