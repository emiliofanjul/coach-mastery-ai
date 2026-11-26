// Mensaje 180 (25-nov-2026) · Te pasaste del alcance.
// Si en una práctica del paso 1 al 5 el vendedor hace algo de un paso posterior que no es una falla
// del nodo, la pantalla le dice, tranquila: «Aquí solo practicamos «…». Pedir el pedido es del paso
// 5, el cierre: lo vemos más adelante en el mapa, y ahí aprendes cómo se hace. Esto no te bajó la nota.» Opción A de Emilio: sin
// bajar la nota y sin calificar eso extra. Además, «Lo que buscamos» se ve mientras se califica.
import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  hayAlcanceQueRevisar, armarEntradaAlcance, moldesDesde, loQuePideElNodo, alcanceDeRespuesta,
  citaDelVendedor, yaEsFalla, textoDelAlcance, PROMPT_ALCANCE, HERRAMIENTA_ALCANCE,
} from "../../../supabase/functions/_shared/alcance";
import { avisoDeAlcance } from "../alcance-practica";

const leer = (p: string) => readFileSync(join(process.cwd(), p), "utf8");
const datos = leer("docs/kb/doctrina_176_datos.sql");
const guia = [...datos.matchAll(/^ {2}\(\$t\$([a-z_0-9]+)\$t\$, (\d+), \$t\$([\s\S]*?)\$t\$, \$t\$([\s\S]*?)\$t\$\)/gm)]
  .map((m) => ({ clave: m[1], orden: Number(m[2]), titulo: m[3], texto: m[4] }));
const nodos: any[] = JSON.parse(leer("docs/kb/nodos_snapshot.json"));

const conversacion = [
  { role: "user", content: "Buenas tardes, soy Emilio, de Aceites y Lubricantes Dalfán. Ando visitando talleres de la zona." },
  { role: "assistant", content: "Ah, órale. ¿Y qué se le ofrece?" },
  { role: "user", content: "Quería ofrecerle nuestro producto. ¿Le dejo diez cubetas de una vez?" },
];
const fallaPitch = [{ error: "Ofreciste producto en la introducción.", cita: "Quería ofrecerle nuestro producto." }];
const respuesta = (input: Record<string, unknown>) => ({ content: [{ type: "tool_use", name: "alcance", input }] });

describe("en qué nodos se revisa", () => {
  it("del paso 1 al 5; ni el 6 (no hay paso después) ni el mundo 7 (la línea completa)", () => {
    expect([1, 2, 3, 4, 5].every((p) => hayAlcanceQueRevisar(p))).toBe(true);
    expect(hayAlcanceQueRevisar(6)).toBe(false);
    expect(hayAlcanceQueRevisar(null)).toBe(false);
    expect(hayAlcanceQueRevisar(0)).toBe(false);
  });
});

describe("lo que recibe el revisor", () => {
  it("el molde de su paso y de los posteriores, de la misma guía con que se escriben los ejemplos", () => {
    expect(guia).toHaveLength(11);
    const m = moldesDesde(guia, 2);
    expect(m).toContain("## Paso 2 · Historia breve");
    expect(m).toContain("## Paso 5 · Cierre");
    expect(m).not.toContain("## Paso 1 · Introducción");
    expect(m).not.toContain("Los factores de impulso");
  });
  it("lo que pide el nodo, lo ya calificado como falla y la conversación numerada como la lee el juez", () => {
    const g = nodos.find((n) => n.id === "2.1").practice_script;
    const e = JSON.parse(armarEntradaAlcance({ paso: 2, nodo: "La primera frase", pide: loQuePideElNodo(g), moldes: moldesDesde(guia, 2), fallas: fallaPitch, conversacion }));
    expect(e.paso_del_nodo).toBe(2);
    expect(e.nombre_del_paso).toBe("la historia breve");
    expect(e.lo_que_pide_este_nodo.length).toBeGreaterThan(0);
    expect(e.ya_calificado_como_falla[0].cita).toBe("Quería ofrecerle nuestro producto.");
    expect(e.conversacion[2]).toEqual({ turno: 3, quien: "vendedor", dijo: conversacion[2].content });
  });
  it("el revisor no califica ni juzga: solo dice de qué paso es, y no cuenta lo ya calificado", () => {
    expect(PROMPT_ALCANCE).toContain("tú no calificas nada");
    expect(PROMPT_ALCANCE).toContain("No cuentes lo que ya se calificó como falla");
    expect(PROMPT_ALCANCE).toContain("No juzgues si estuvo bien o mal");
    expect(PROMPT_ALCANCE).toContain("ni lo que el vendedor le dice a Closer o a la app fuera de la venta");
    expect(HERRAMIENTA_ALCANCE.input_schema.required).toEqual(["se_paso"]);
  });
});

describe("el código revisa lo que contesta", () => {
  const bien = { se_paso: true, paso: 5, que_hizo: "pedir el pedido", cita: "¿Le dejo diez cubetas de una vez?", turno: 3 };
  it("si cuadra, sale el aviso con su texto", () => {
    const a = alcanceDeRespuesta(respuesta(bien), 2, conversacion, fallaPitch);
    expect(a).toEqual({ paso: 5, que: "pedir el pedido", cita: "¿Le dejo diez cubetas de una vez?", turno: 3, texto: "Pedir el pedido es del paso 5, el cierre: lo vemos más adelante en el mapa, y ahí aprendes cómo se hace. Esto no te bajó la nota." });
  });
  it("no sale si dice que no se pasó", () => {
    expect(alcanceDeRespuesta(respuesta({ se_paso: false }), 2, conversacion, [])).toBeNull();
  });
  it("no sale si el paso no es posterior al del nodo", () => {
    expect(alcanceDeRespuesta(respuesta({ ...bien, paso: 2 }), 2, conversacion, [])).toBeNull();
    expect(alcanceDeRespuesta(respuesta({ ...bien, paso: 1 }), 2, conversacion, [])).toBeNull();
    expect(alcanceDeRespuesta(respuesta({ ...bien, paso: 7 }), 2, conversacion, [])).toBeNull();
  });
  it("no sale en el 6 ni en el 7", () => {
    expect(alcanceDeRespuesta(respuesta(bien), 6, conversacion, [])).toBeNull();
    expect(alcanceDeRespuesta(respuesta(bien), null as unknown as number, conversacion, [])).toBeNull();
  });
  it("no sale si la cita no es del vendedor o no está en ese turno", () => {
    expect(alcanceDeRespuesta(respuesta({ ...bien, cita: "¿Y qué se le ofrece?", turno: 2 }), 2, conversacion, [])).toBeNull();
    expect(alcanceDeRespuesta(respuesta({ ...bien, turno: 1 }), 2, conversacion, [])).toBeNull();
    expect(alcanceDeRespuesta(respuesta({ ...bien, cita: "Le hago un descuento del veinte por ciento" }), 2, conversacion, [])).toBeNull();
    expect(citaDelVendedor("le dejo diez cubetas", 3, conversacion)).toBe(true);
  });
  it("no sale si es lo que ya se calificó como falla: eso ya tiene su explicación", () => {
    const comoLaFalla = { ...bien, paso: 4, que_hizo: "hablar del producto", cita: "Quería ofrecerle nuestro producto." };
    expect(alcanceDeRespuesta(respuesta(comoLaFalla), 2, conversacion, fallaPitch)).toBeNull();
    expect(yaEsFalla("ofrecerle nuestro producto", fallaPitch)).toBe(true);
    expect(yaEsFalla("¿Le dejo diez cubetas de una vez?", fallaPitch)).toBe(false);
  });
  it("no sale si falta lo que hizo o la respuesta viene rota", () => {
    expect(alcanceDeRespuesta(respuesta({ ...bien, que_hizo: "" }), 2, conversacion, [])).toBeNull();
    expect(alcanceDeRespuesta({ content: [] }, 2, conversacion, [])).toBeNull();
    expect(alcanceDeRespuesta(null, 2, conversacion, [])).toBeNull();
  });
  it("nombra cada paso como en la línea recta", () => {
    expect(textoDelAlcance(3, "preguntar por su operación")).toBe("Preguntar por su operación es del paso 3, el descubrimiento: lo vemos más adelante en el mapa, y ahí aprendes cómo se hace. Esto no te bajó la nota.");
    expect(textoDelAlcance(4, "hablar del producto")).toContain("del paso 4, la presentación:");
  });
});

describe("en closer-voice", () => {
  const cv = leer("supabase/functions/closer-voice/index.ts");
  it("corre después del porqué y antes de las estrellas, como llamada aparte y sin tocar la nota", () => {
    const i = cv.indexOf("sin porqué (fail-open)");
    const j = cv.indexOf('}, "alcance", {');
    const k = cv.indexOf("// Estrellas a partir del score YA topado.");
    expect(i).toBeGreaterThan(0);
    expect(j).toBeGreaterThan(i);
    expect(k).toBeGreaterThan(j);
    const bloque = cv.slice(j - 2000, k);
    expect(bloque).not.toMatch(/evaluation\.score\s*=/);
    expect(bloque).not.toMatch(/flags_detected/);
    expect(bloque).toContain("sin aviso de alcance (fail-open)");
    expect(bloque).toContain("tool_choice: { type: \"tool\", name: HERRAMIENTA_ALCANCE.name }");
    expect(bloque).toContain("moldesDesde(guiaPartes, pasoAlcance)");
    expect(bloque).toContain("hayAlcanceQueRevisar(pasoAlcance) && moldesAlcance");
  });
});

describe("en la pantalla", () => {
  const ui = leer("src/routes/nodo.$nodeId.practica.tsx");
  it("el aviso lleva el nombre del nodo", () => {
    const ev = { alcance: { texto: textoDelAlcance(5, "pedir el pedido"), cita: "¿Le dejo diez cubetas?" } };
    expect(avisoDeAlcance(ev, "La primera frase")).toEqual({
      texto: "Aquí solo practicamos «La primera frase». Pedir el pedido es del paso 5, el cierre: lo vemos más adelante en el mapa, y ahí aprendes cómo se hace. Esto no te bajó la nota.",
      cita: "¿Le dejo diez cubetas?",
    });
    expect(avisoDeAlcance(ev, "")?.texto.startsWith("Aquí solo practicamos este paso.")).toBe(true);
    expect(avisoDeAlcance({}, "La primera frase")).toBeNull();
    expect(avisoDeAlcance(null, "x")).toBeNull();
  });
  it("va después de «Tu avance», con su cita", () => {
    const a = ui.indexOf(">Tu avance<");
    const b = ui.indexOf(">Fuera de esta práctica<");
    expect(a).toBeGreaterThan(0);
    expect(b).toBeGreaterThan(a);
    expect(ui).toContain("Lo que dijiste: «{alcance.cita}»");
    expect(ui).toContain('nodeName={infoMapa?.nombre_corto || nodeData?.name || ""}');
  });
  it("mientras califica, se lee «Lo que buscamos» de metas_practica", () => {
    expect(ui).toContain("metas_practica?select=lo_que_buscamos,como_sabes&node_id=eq.");
    const espera = ui.slice(ui.indexOf(">Revisando tu práctica<"));
    expect(espera.indexOf("{metaEspera.lo_que_buscamos}")).toBeGreaterThan(0);
    expect(espera.indexOf("{metaEspera.lo_que_buscamos}")).toBeLessThan(espera.indexOf("<ListaRevision"));
  });
});
