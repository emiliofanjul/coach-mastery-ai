// El onboarding del manager (oct-2026): 9 preguntas que salen de la doctrina,
// datos comerciales que no pasan por el modelo, y al final la radiografía de la
// empresa, que el manager confirma o corrige con sus palabras.
import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import {
  PREGUNTAS,
  TOTAL_PREGUNTAS,
  preguntaCompleta,
  cerebroDirecto,
  respuestasEnTexto,
  aplicarAjuste,
  SECCIONES_RADIOGRAFIA,
  libreDe,
  detalleDe,
  type Respuestas,
} from "../onboarding-questions";

const p = (id: string) => PREGUNTAS.find((x) => x.id === id)!;

const DALFAN: Respuestas = {
  p1_tipo: ["Productos"],
  p1_lineas: "aceites para motor, grasas, anticongelantes, líquido de frenos",
  p2_uso: ["Lo revenden", "Lo consumen en su operación"],
  p2_giros: "refaccionarias, talleres, flotillas",
  p3_rangos: ["Menos de $5,000", "$50,000 a $500,000"],
  p4_cartera: ["Mayormente clientes que ya nos compran"],
  p4_frecuencia: ["Cada 2 semanas"],
  p5_canal: ["En persona", "Por WhatsApp"],
  p5_trato: ["De usted"],
  p6_servicio: ["Entrega en la visita", "Años de experiencia en la zona"],
  [detalleDe("p6_servicio", "Años de experiencia en la zona")]: "14",
  p6_precio: ["Crédito"],
  [detalleDe("p6_precio", "Crédito")]: "30 días",
  p7_modo: ["Manejamos descuentos"],
  p7_descuentos: ["Por volumen", "Por pago de contado"],
  p7_cobro: ["Los dos"],
  p8_negativos: ["Ya tengo proveedor", "Todavía tengo, pásate la otra semana"],
  p8_competencia: "distribuidores locales",
  p9_restricciones: ["Dar precios o descuentos no autorizados"],
  [libreDe("p9_restricciones")]: "No prometer entrega el mismo día en rutas foráneas",
};

describe("las preguntas", () => {
  it("son 9, numeradas en orden, en 4 bloques", () => {
    expect(TOTAL_PREGUNTAS).toBe(9);
    expect(PREGUNTAS.map((x) => x.numero)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9]);
    expect(new Set(PREGUNTAS.map((x) => x.bloque))).toEqual(new Set([1, 2, 3, 4]));
  });
  it("cada una explica para qué la usa Closer, con una explicación de verdad", () => {
    for (const q of PREGUNTAS) expect(q.porQue.length, q.id).toBeGreaterThan(120);
  });
  it("no pide lo que la doctrina resuelve sola ni lo que cambia cada semana", () => {
    const todo = JSON.stringify(PREGUNTAS).toLowerCase();
    expect(todo).not.toMatch(/qui[eé]n decide/);
    expect(todo).not.toMatch(/precios? de lista|sku por sku|cat[aá]logo con precios/);
    expect(todo).not.toMatch(/cu[aá]nto dura/);
  });
  it("las dos del bloque 4 las propone Closer", () => {
    expect(PREGUNTAS.filter((x) => x.propuestaPorCloser).map((x) => x.id)).toEqual([
      "p8_negativos",
      "p9_restricciones",
    ]);
  });
});

describe("cuándo se puede avanzar", () => {
  it("sin líneas no se avanza; con ellas sí", () => {
    expect(preguntaCompleta(p("p1_que_venden"), { p1_tipo: ["Productos"] })).toBe(false);
    expect(
      preguntaCompleta(p("p1_que_venden"), {
        p1_tipo: ["Productos"],
        p1_lineas: "aceites y grasas",
      }),
    ).toBe(true);
  });
  it("los descuentos solo se exigen si dijo que maneja descuentos", () => {
    expect(
      preguntaCompleta(p("p7_precio"), {
        p7_modo: ["Precio fijo, sin descuentos"],
        p7_cobro: ["Contado"],
      }),
    ).toBe(true);
    expect(
      preguntaCompleta(p("p7_precio"), {
        p7_modo: ["Manejamos descuentos"],
        p7_cobro: ["Contado"],
      }),
    ).toBe(false);
    expect(
      preguntaCompleta(p("p7_precio"), {
        p7_modo: ["Manejamos descuentos"],
        p7_descuentos: ["Por volumen"],
        p7_cobro: ["Contado"],
      }),
    ).toBe(true);
  });
  it("lo que ofreces: basta con marcar algo en cualquiera de las tres secciones o escribirlo", () => {
    expect(preguntaCompleta(p("p6_ofrecen"), {})).toBe(false);
    expect(preguntaCompleta(p("p6_ofrecen"), { p6_precio: ["Crédito"] })).toBe(true);
    expect(
      preguntaCompleta(p("p6_ofrecen"), { [libreDe("p6_ofrecen")]: "Bodega propia en la ciudad" }),
    ).toBe(true);
  });
  it("las reglas de la empresa pueden quedar vacías", () => {
    expect(preguntaCompleta(p("p9_restricciones"), {})).toBe(true);
  });
});

describe("el cerebro de la empresa", () => {
  const c = cerebroDirecto(DALFAN);
  it("las líneas pasan tal cual: es la defensa contra productos inventados", () => {
    expect(c.PRODUCTOS_ACTIVOS).toContain(
      "aceites para motor, grasas, anticongelantes, líquido de frenos",
    );
  });
  it("lo que ofrece va por producto, servicio y precio, con sus detalles", () => {
    expect(c.ARGUMENTOS_DE_VALOR).toContain("Servicio: Años de experiencia en la zona (14)");
    expect(c.ARGUMENTOS_DE_VALOR).toContain("Precio: Crédito (30 días)");
    expect(c.ARGUMENTOS_DE_VALOR).not.toMatch(/Garant|Marca propia/);
  });
  it("las condiciones de precio son solo las que marcó", () => {
    expect(c.PROMOCIONES_Y_CONDICIONES).toContain("Por volumen");
    expect(c.PROMOCIONES_Y_CONDICIONES).toContain("Por pago de contado");
    expect(c.PROMOCIONES_Y_CONDICIONES).not.toMatch(/primer pedido|pronto pago/i);
  });
  it("si cambia a precio fijo, los descuentos que había marcado antes ya no cuentan", () => {
    const fijo = cerebroDirecto({ ...DALFAN, p7_modo: ["Precio fijo, sin descuentos"] });
    expect(fijo.PROMOCIONES_Y_CONDICIONES).toMatch(/^Precio fijo/);
    expect(fijo.PROMOCIONES_Y_CONDICIONES).not.toMatch(/volumen|contado\b.*descuento/i);
  });
  it("los dos ejes del cliente quedan escritos", () => {
    expect(c.TIPOS_DE_CLIENTE_QUE_ATIENDE).toContain("Lo revenden, Lo consumen en su operación");
    expect(c.TIPOS_DE_CLIENTE_QUE_ATIENDE).toContain("Mayormente clientes que ya nos compran");
    expect(c.FRECUENCIA_DE_VISITA).toBe("Cada 2 semanas");
  });
  it("objeciones, competencia y reglas, incluido lo que escribió con sus palabras", () => {
    expect(c.NEGATIVOS_COMUNES_DEL_TERRITORIO).toContain("Ya tengo proveedor");
    expect(c.COMPETENCIA_DIRECTA).toBe("distribuidores locales");
    expect(c.RESTRICCIONES).toContain("No prometer entrega el mismo día en rutas foráneas");
  });
  it("el texto libre llega también al resumen que lee el modelo", () => {
    const r9 = respuestasEnTexto(DALFAN).find((x) => x.id === "p9_restricciones")!;
    expect(r9.respuesta).toContain("Además: No prometer entrega el mismo día");
  });
  it("el modelo no reescribe lo comercial: las llaves comerciales salen de las respuestas", () => {
    const src = readFileSync("src/utils/onboarding.functions.ts", "utf8");
    expect(src).toMatch(/brain\[k\]\s*=\s*typeof data\.directo\[k\]/);
    expect(src).not.toMatch(/"PRESENTACIONES_Y_PRECIOS":\s*"string/);
  });
});

describe("la radiografía", () => {
  const src = readFileSync("src/routes/onboarding.manager.tsx", "utf8");
  const fn = readFileSync("src/utils/onboarding.functions.ts", "utf8");
  it("reemplaza a la vista previa del cliente IA (y sus frases viejas)", () => {
    expect(src).not.toContain("Así va a hablar tu cliente IA");
    expect(src).not.toContain("Tiene 3 minutos");
    expect(src).not.toContain("Cómo están manejando los productos");
    expect(src).toContain("La radiografía de");
    expect(src).toContain("¿Algo que corregir o agregar?");
  });
  it("tiene seis secciones fijas: empresa, clientes, equipo, oferta, calle y el cliente de práctica", () => {
    expect(SECCIONES_RADIOGRAFIA.map((s) => s.id)).toEqual([
      "empresa",
      "clientes",
      "equipo",
      "oferta",
      "calle",
      "cliente_tipico",
    ]);
  });
  it("habla de LOS clientes, en plural, y de algunas cosas de la calle, no de una lista cerrada", () => {
    const titulos = SECCIONES_RADIOGRAFIA.map((s) => s.titulo);
    expect(titulos).toContain("Los clientes con los que van a practicar");
    expect(titulos).toContain("Algunas cosas que se escuchan hoy en la calle");
    expect(fn).toMatch(/muchos perfiles distintos, no uno solo/);
    expect(src.replace(/\s+/g, " ")).toContain(
      "el sistema de ventas de Closer, aplicado a tu industria y a tu negocio",
    );
  });
  it("el modelo solo repite lo que dijo el manager, sin agregar datos ni opinar", () => {
    expect(fn).toContain("SOLO repite lo que está en las respuestas");
    expect(fn).toContain("no agregues ni un dato");
  });
  it("si cambia sus respuestas, la radiografía se vuelve a armar", () => {
    expect(src).toMatch(/brainDe === firma/);
  });
});

describe("el ajuste del manager", () => {
  const base = { PRODUCTOS_ACTIVOS: "aceites, grasas", CLIENTE_TIPICO: "Dueño de taller" };
  it("cambia solo llaves del cerebro, con texto", () => {
    const out = aplicarAjuste(
      base,
      {
        PRODUCTOS_ACTIVOS: "aceites, grasas, anticongelantes",
        INVENTADA: "x",
        CLIENTE_TIPICO: "",
        RESTRICCIONES: 5,
      },
      "También vendemos anticongelantes",
    );
    expect(out.PRODUCTOS_ACTIVOS).toBe("aceites, grasas, anticongelantes");
    expect(out.CLIENTE_TIPICO).toBe("Dueño de taller");
    expect(out).not.toHaveProperty("INVENTADA");
    expect(out).not.toHaveProperty("RESTRICCIONES");
  });
  it("guarda cada ajuste tal cual lo escribió, uno tras otro", () => {
    const uno = aplicarAjuste(base, {}, "También vendemos a gasolineras");
    const dos = aplicarAjuste(uno, {}, "A clientes nuevos no les damos crédito");
    expect(dos.AJUSTES_DEL_MANAGER).toBe(
      "También vendemos a gasolineras\nA clientes nuevos no les damos crédito",
    );
  });
});

describe("el código de invitación", () => {
  const src = readFileSync("src/routes/onboarding.manager.tsx", "utf8");
  it("si no se genera, la pantalla dice qué pasó", () => {
    expect(src).toContain("No pudimos generar el código");
  });
  it("ya no hay botón de invitación por correo que no envía nada", () => {
    expect(src).not.toMatch(/alert\(/);
    expect(src).not.toContain("Enviar invitación");
  });
});
