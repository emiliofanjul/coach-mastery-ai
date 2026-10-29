// Mensaje 106 (28-oct-2026). En el 105 el G42 falló las cuatro corridas: el
// juez reprobó la visita de trámite aunque él mismo escribió que el vendedor
// «siguió con opciones concretas». Su prueba era una doble negación («¿se fue
// con el pedido sin haber descubierto algo más y sin haberlo intentado de
// verdad?»): el juez contestaba la primera mitad. Y en el hueco, la salida a
// no_aplica venía al final, después de una pregunta que sin hueco reprueba.
// Ahora las dos reglas usan una sola prueba, en positivo y en orden, con la
// misma definición de «buscó de verdad», como el Cerebro: «si lo buscaste
// bien —con las herramientas, y siguiendo las respuestas vagas— y no
// apareció, … No es una falla».
import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { LARGO_REGLA_JUEZ, armarEntradaJuez } from "../../../supabase/functions/_shared/juez_pruebas";

const leer = (p: string) => readFileSync(join(process.cwd(), p), "utf8");
const cerebro = leer("docs/kb/cerebro_snapshot.md");
const reglas: any[] = JSON.parse(leer("docs/kb/reglas.json"));
const regla = (id: string) => reglas.find((r) => r.id === id);
const hueco = regla("discovery.hueco").resumen as string;
const tramite = regla("develop.visita_tramite").resumen as string;
const BUSCO = "Buscó de verdad si usó al menos una de las herramientas del hueco —leer el lugar (ver o preguntar qué otras líneas maneja y con quién), preguntar qué le piden que no tenga, o anclar en negocios como el suyo— y, cada vez que la respuesta fue vaga, siguió con opciones concretas o con otra herramienta. Una respuesta es vaga si no dice qué ni con quién («de todo un poco», «lo normal»); si lo dice, o dice que no hay, ya contestó: no pide seguir.";

describe("Primero el Cerebro", () => {
  it("si lo buscaste bien y no apareció, no es falla", () => {
    expect(cerebro).toContain("**Si no hay hueco** `CAMPO`: si lo buscaste bien —con las herramientas, y siguiendo las respuestas vagas— y no apareció");
    expect(cerebro).toContain("No es una falla: lo retomas en otra visita.");
  });
  it("las tres herramientas son las del Cerebro", () => {
    expect(cerebro).toContain("**1 · Lee el lugar**");
    expect(cerebro).toContain("**2 · Pregunta por lo que le piden**");
    expect(cerebro).toContain("**3 · Ancla en negocios como el suyo**");
  });
});

describe("Una sola definición de «buscó de verdad», en las dos reglas", () => {
  it("letra por letra en el hueco y en la visita de trámite", () => {
    expect(hueco).toContain(BUSCO);
    expect(tramite).toContain(BUSCO);
  });
  it("las citas siguen en el Cerebro", () => {
    expect(cerebro).toContain(regla("discovery.hueco").cita_cerebro);
    expect(cerebro).toContain(regla("develop.visita_tramite").cita_cerebro);
  });
});

describe("El hueco: la prueba en orden, con sus tres salidas", () => {
  it("(1) cumple, (2) no_aplica, (3) no_cumple, en ese orden", () => {
    const i1 = hueco.indexOf("(1) Al terminar la plática, ¿quedó al descubierto al menos un hueco concreto");
    const i2 = hueco.indexOf("(2) Si no apareció ninguno: ¿el vendedor buscó de verdad, o salió después de dos «no» seguidos? Entonces el criterio es no_aplica");
    const i3 = hueco.indexOf("(3) Solo si no apareció ninguno y el vendedor no buscó de verdad, es no_cumple.");
    expect(i1).toBeGreaterThan(0);
    expect(i2).toBeGreaterThan(i1);
    expect(i3).toBeGreaterThan(i2);
    expect(hueco.endsWith("es no_cumple.")).toBe(true);
  });
});

describe("La visita de trámite: en positivo, sin doble negación", () => {
  it("la pregunta es si buscó, y no encontrar no es la falla", () => {
    expect(tramite).toContain("LA PRUEBA: ¿el vendedor buscó de verdad algo más que el pedido?");
    expect(tramite).toContain("la falla es no buscar, no que no hubiera");
    expect(tramite).not.toContain("sin haber descubierto algo más y sin haberlo intentado");
  });
});

describe("El juez recibe la regla entera", () => {
  it("todas las reglas caben en lo que recibe el juez", () => {
    const largas = reglas.filter((r) => r.resumen.length > LARGO_REGLA_JUEZ).map((r) => r.id);
    expect(largas).toEqual([]);
  });
  it("el hueco llega completo, con su tercera salida", () => {
    const entrada = JSON.parse(armarEntradaJuez([{ id: "discovery.hueco", tipo: "criterio", regla: hueco, en_este_nodo: "", senalado: "" }], []));
    expect(entrada.acusaciones[0].regla).toBe(hueco);
  });
});
