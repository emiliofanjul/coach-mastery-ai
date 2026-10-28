// Mensaje 104 (Emilio, 21 y 28-oct-2026): «2 no's and a go» en toda la visita;
// en el cierre son tres. Qué es un «no», escrito como prueba y no con ejemplos.
// El hueco que no existía es no_aplica. Insistir tras dos no se califica en los
// bosses. Y el examen final 7.4 ya no premia atravesar un segundo bloqueo.
import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const leer = (p: string) => readFileSync(join(process.cwd(), p), "utf8");
const cerebro = leer("docs/kb/cerebro_snapshot.md");
const reglas: any[] = JSON.parse(leer("docs/kb/reglas.json"));
const nodos: any[] = JSON.parse(leer("docs/kb/nodos_snapshot.json"));
const harness = JSON.parse(leer("supabase/functions/_shared/eval_harness_v1.json"));
const voz = leer("supabase/functions/closer-voice/index.ts");
const red = leer("supabase/functions/harness-runner/index.ts");
const regla = (id: string) => reglas.find((r) => r.id === id);
const nodo = (id: string) => nodos.find((n) => n.id === id);
const falla = (n: string, f: string) => nodo(n).practice_script.failure_criteria.find((x: any) => x.id === f);
const caso = (id: string) => harness.cases.find((c: any) => c.id === id);

describe("Primero el Cerebro", () => {
  it("dos no seguidos en toda la visita, menos en el cierre", () => {
    expect(cerebro).toContain("en cualquier momento de la visita, menos en el cierre, dos «no» seguidos son la señal de que hoy no es el día");
    expect(cerebro).toContain("Al buscar el hueco es igual: si dos intentos seguidos se topan con un «no», dejas de buscar y lo retomas en otra visita.");
    expect(cerebro).toContain("En el cierre la regla es otra: son tres (ver La Regla de los No).");
    expect(cerebro).toContain("- **Esta regla es del cierre.** En cualquier otro momento de la visita son **dos** no seguidos");
  });
  it("qué es un «no», como principio", () => {
    expect(cerebro).toContain("**Qué es un «no»** `CAMPO`: una respuesta que rechaza lo que el vendedor estaba intentando en ese momento");
    expect(cerebro).toContain("Una respuesta, aunque sea vaga o corta, no es un «no»");
    expect(cerebro).toContain("Una duda, una condición o una objeción tampoco es un «no»");
  });
  it("si no hay hueco, no es falla", () => {
    expect(cerebro).toContain("**Si no hay hueco** `CAMPO`");
  });
  it("las citas de la puerta siguen ahí", () => {
    expect(cerebro).toContain(regla("blocks.dos_no_seguidos").cita_cerebro);
    expect(cerebro).toContain(regla("blocks.insistir_tras_dos_no").cita_cerebro);
  });
});

describe("Luego las reglas", () => {
  it("la regla general trae la prueba de un «no» y cita al Cerebro", () => {
    const r = regla("flow.dos_no_seguidos");
    expect(r).toMatchObject({ paso: 0, tipo: "principio", canal: "universal", procedencia: "CAMPO" });
    expect(r.resumen).toContain("LA PRUEBA DE UN «NO»: ¿la respuesta del cliente rechaza lo que el vendedor estaba intentando en ese momento");
    expect(r.resumen).toContain("En el cierre son tres: la Regla de los No.");
    expect(cerebro).toContain(r.cita_cerebro);
  });
  it("las dos reglas de los tres no dicen que son solo del cierre", () => {
    expect(regla("objection.regla_de_los_no").resumen).toContain("Solo en el cierre");
    expect(regla("objections.regla_de_los_no").resumen).toContain("Esta regla es del cierre");
  });
  it("el hueco que no existía es no_aplica, y dejar de buscar tras dos no no es trámite", () => {
    expect(regla("discovery.hueco").resumen).toContain("el criterio es no_aplica: hoy no había nada que descubrir");
    expect(regla("develop.visita_tramite").resumen).toContain("Dejar de buscar después de dos «no» seguidos no es trámite");
  });
  it("insistir tras dos no es major en general y critical en el 2.7c, que es lo que enseña", () => {
    expect(regla("blocks.insistir_tras_dos_no").severidad_sugerida).toBe("major");
    expect(falla("2.7c", "insiste_tras_dos")).toMatchObject({ severity: "critical", severity_override: { default: "major" } });
  });
});

describe("Los bosses con bloqueo de entrada califican insistir tras dos no", () => {
  for (const id of ["2.10", "3.10", "5.15", "7.0", "7.4"]) {
    it(id, () => {
      expect(falla(id, "insiste_tras_dos")).toMatchObject({ regla_id: "blocks.insistir_tras_dos_no", severity: "major" });
    });
  }
});

describe("El 7.4 ya no premia atravesar un segundo bloqueo", () => {
  const ps = nodo("7.4").practice_script;
  it("el cliente no repite el bloqueo: suelta una objeción que deja por dónde seguir", () => {
    expect(ps.phases.you_do.prompt).toContain("NO repites el bloqueo: dos no seguidos en la puerta y el vendedor debería irse.");
    expect(JSON.stringify(ps)).not.toMatch(/bloqueo doble|BLOQUEO DOBLE|dos bloqueos/);
  });
  it("versiones", () => {
    expect(["2.7c", "2.10", "3.10", "5.15", "7.0", "7.4"].map((id) => nodo(id).practice_script.version)).toEqual(["1.0.5", "2.1.4", "1.0.2", "1.1.1", "1.1.2", "1.0.2"]);
  });
});

describe("El evaluador y el cliente simulado", () => {
  it("el evaluador: dos fuera del cierre, tres en el cierre, y qué es un «no»", () => {
    expect(voz).toContain("en cualquier momento de la visita, menos en el cierre, DOS «no» seguidos son la señal de salir");
    expect(voz).toContain("una respuesta vaga o corta, una duda o una objeción NO son un «no»");
    expect(voz).toContain("(b) el vendedor salió bien al llegar a una racha de «no» (dos seguidos, o tres en el cierre: ver abajo);");
    expect(voz).not.toContain("si el cliente dio tres \"no\" CONSECUTIVOS");
  });
  it("el cliente simulado: fuera del cierre no da un segundo «no» seguido, salvo que su guion lo pida", () => {
    expect(voz).toContain("fuera del cierre, si el vendedor maneja bien tu primer «no»");
    expect(voz).toContain("NO le des un segundo «no» seguido");
    expect(voz).toContain("salvo que tu guion pida otro «no»");
  });
});

describe("La red", () => {
  it("G29: tu práctica de septiembre siguió después del segundo no → insistir", () => {
    expect(caso("G29_regla_de_los_no").expected.must_flag).toEqual(["insiste_tras_dos"]);
  });
  it("G44: salir al segundo no es lo correcto", () => {
    expect(caso("G44_sale_al_segundo_no").expected.must_not_flag).toContain("insiste_tras_dos");
  });
  it("G42: lo buscó bien y no había hueco → no_aplica, y la red ya distingue no_aplica de cumple", () => {
    expect(caso("G42_intenta_de_verdad_sin_hueco").expected.niveles_esperados).toEqual({ "discovery.hueco": "no_aplica" });
    expect(red).toContain('d?.nivel === "no_aplica" ? "no_aplica" : nivelDe(Number(d.credito ?? 0))');
    expect(red).toContain('const ok = real === esperado || (esperado === "cumple" && real === "no_aplica");');
  });
});
