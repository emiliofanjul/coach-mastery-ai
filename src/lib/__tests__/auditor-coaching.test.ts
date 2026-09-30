// El auditor del feedback y la regla de lenguaje, probados ejecutándolos.
import { describe, it, expect } from "vitest";
import { aplicarAuditoria, textosDeEvaluacion, MISION_DE_RESPALDO, PROMPT_AUDITOR, extraerJson, fallaCerrada, armarEntradaAuditor } from "../../../supabase/functions/_shared/auditar_coaching";
import { primeraGroseria, contieneGroserias, groseriasDelVendedor, sanearGroseriasEvaluacion } from "../../../supabase/functions/_shared/lenguaje";

const evaluacion = () => ({
  observations: [{ criterio_id: "x", error: "e", mejora: "Pide permiso antes de presentar", ejemplo: "¿Le parece si le presento?" }],
  mision: "Di quién eres en las primeras dos frases.",
  siguiente_nivel: [
    { observacion: "Confirma con sus palabras", ejemplo: "¿Está abierto a ver opciones, verdad? [pausa para que confirme]", por_que: "p", regla_id: "discovery.escalera_capas" },
    { observacion: "Profundiza en el dolor", ejemplo: "¿Qué pasa cuando no encuentra el producto?", por_que: "p", regla_id: "discovery.escalera_capas" },
  ],
});

describe("los textos que se auditan", () => {
  it("saca mejora, ejemplo, misión y lo que viene después", () => {
    const ids = textosDeEvaluacion(evaluacion()).map((t) => t.id);
    expect(ids).toEqual(["obs0.mejora", "obs0.ejemplo", "mision", "sig0.observacion", "sig0.ejemplo", "sig1.observacion", "sig1.ejemplo"]);
  });
});

describe("aplicar los veredictos: corregir lo corregible, descartar lo demás", () => {
  it("el caso real del 3.6: el ejemplo que pide permiso se descarta, el bueno se queda", () => {
    const ev = evaluacion();
    const r = aplicarAuditoria(ev, [
      { id: "sig0.ejemplo", ok: false, viola: ["permiso"], corregido: null },
      { id: "sig1.ejemplo", ok: true },
    ]);
    expect(ev.siguiente_nivel).toHaveLength(1);
    expect(ev.siguiente_nivel[0].ejemplo).toMatch(/Qué pasa cuando no encuentra/);
    expect(r.descartados).toBe(1);
  });
  it("la misión que pone la historia breve en la introducción se corrige si el auditor da una versión", () => {
    const ev = evaluacion();
    aplicarAuditoria(ev, [{ id: "mision", ok: false, viola: ["orden"], corregido: "Abre con saludo e ice breaker; quién eres va después." }]);
    expect(ev.mision).toBe("Abre con saludo e ice breaker; quién eres va después.");
  });
  it("una misión que no se puede corregir cae en la de respaldo, nunca en una que viola", () => {
    const ev = evaluacion();
    aplicarAuditoria(ev, [{ id: "mision", ok: false, viola: ["orden"], corregido: null }]);
    expect(ev.mision).toBe(MISION_DE_RESPALDO);
  });
  it("un ejemplo de observación que viola se vacía, pero la observación se conserva", () => {
    const ev = evaluacion();
    aplicarAuditoria(ev, [{ id: "obs0.ejemplo", ok: false, viola: ["permiso"], corregido: null }]);
    expect(ev.observations).toHaveLength(1);
    expect(ev.observations[0].ejemplo).toBe("");
  });
  it("sin veredictos, nada cambia", () => {
    const ev = evaluacion();
    const antes = JSON.stringify(ev);
    aplicarAuditoria(ev, undefined);
    expect(JSON.stringify(ev)).toBe(antes);
  });
  it("el auditor sabe el orden de los seis pasos y las reglas universales", () => {
    expect(PROMPT_AUDITOR).toMatch(/1 Introducción[\s\S]*2 Historia breve[\s\S]*3 Descubrimiento[\s\S]*4 Presentación[\s\S]*5 Cierre[\s\S]*6 Consolidación/);
    expect(PROMPT_AUDITOR).toMatch(/nunca ofrecer muestras/);
    expect(PROMPT_AUDITOR).toMatch(/nunca pedir permiso/);
    expect(PROMPT_AUDITOR).toMatch(/un cierre siempre da alternativa/);
  });
});

describe("groserías", () => {
  it("detecta las comunes con límites de palabra", () => {
    expect(primeraGroseria("no mames, qué pinche calor")).toBe("no mames");
    expect(contieneGroserias("Está bien cabrón el pedido")).toBe(true);
    expect(contieneGroserias("¿Le parece el martes?")).toBe(false);
  });
  it("no confunde palabras que contienen una grosería", () => {
    expect(contieneGroserias("El computador está en la ferretería")).toBe(false);
    expect(contieneGroserias("La verguenza")).toBe(false);
  });
  it("saca las groserías del vendedor, no las del cliente", () => {
    const h = [{ role: "user", content: "qué pinche movimiento" }, { role: "assistant", content: "no manches, sí" }, { role: "user", content: "buenos días" }];
    expect(groseriasDelVendedor(h)).toEqual(["pinche"]);
  });
});

describe("sept-2026, segunda ronda: lo que se coló en el iPhone", () => {
  it("'Uf, qué mal pedo' es grosería", () => {
    expect(contieneGroserias("Uf, qué mal pedo")).toBe(true);
    expect(contieneGroserias("no hay pedo")).toBe(true);
  });
  it("ningún texto de la evaluación sale con groserías; el consejo sobre las del vendedor se conserva", () => {
    const ev: any = {
      observations: [{ error: "e", mejora: "m", ejemplo: "Uf, qué mal pedo, don Ramón" }],
      mision: "Dile qué pedo con su proveedor",
      siguiente_nivel: [
        { observacion: "Usaste \"pinche\". Las groserías no hacen falta…", ejemplo: "", por_que: "p", regla_id: "mindset.sin_groserias" },
        { observacion: "Profundiza", ejemplo: "No mames, ¿y luego?", por_que: "p", regla_id: "discovery.escalera_capas" },
      ],
    };
    sanearGroseriasEvaluacion(ev, MISION_DE_RESPALDO);
    expect(ev.observations[0].ejemplo).toBe("");
    expect(ev.mision).toBe(MISION_DE_RESPALDO);
    expect(ev.siguiente_nivel.map((x: any) => x.regla_id)).toEqual(["mindset.sin_groserias"]);
  });
  it("el auditor recibe la conversación para detectar hechos inventados", () => {
    const e = JSON.parse(armarEntradaAuditor({ paso: 1, fallas: [], reglas: [], textos: [], conversacion: [{ role: "user", content: "Buenos días" }, { role: "assistant", content: "¿Qué se le ofrece?" }] }));
    expect(e.conversacion).toEqual([{ quien: "vendedor", dijo: "Buenos días" }, { quien: "cliente", dijo: "¿Qué se le ofrece?" }]);
    expect(PROMPT_AUDITOR).toMatch(/tiene que aparecer en la "conversacion"/);
  });
  it("lee el JSON aunque venga con texto o cercas alrededor", () => {
    expect(extraerJson('Aquí va:\n```json\n{"veredictos":[]}\n```').veredictos).toEqual([]);
    expect(() => extraerJson("sin nada")).toThrow();
  });
  it("si el auditor no pudo correr, nada sin revisar llega al vendedor", () => {
    const ev: any = { observations: [{ error: "e", mejora: "m", ejemplo: "x" }], mision: "m", siguiente_nivel: [{ regla_id: "discovery.x" }] };
    fallaCerrada(ev);
    expect(ev.observations[0].ejemplo).toBe("");
    expect(ev.mision).toBe(MISION_DE_RESPALDO);
    expect(ev.siguiente_nivel).toEqual([]);
  });
});

