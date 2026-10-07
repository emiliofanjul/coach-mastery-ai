// El perfil del cliente de cada práctica (oct-2026).
import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { resolverTipoCliente, lineaDelCliente } from "../cliente-practica";
import { validarFicha, fichaDePeticion, bloqueActor, bloqueEvaluador, respaldadoPorCatalogo, catalogoDelCerebro } from "../../../supabase/functions/_shared/ficha_cliente";

describe("qué cliente toca", () => {
  it("el manager manda sobre el nodo", () => {
    expect(resolverTipoCliente("recurrente", "solo_nuevos", 0.9)).toBe("nuevo");
    expect(resolverTipoCliente("nuevo", "solo_recurrentes", 0.1)).toBe("recurrente");
  });
  it("sin restricción, toca el que enseña mejor el nodo", () => {
    expect(resolverTipoCliente("recurrente", "ambos", 0.1)).toBe("recurrente");
    expect(resolverTipoCliente("nuevo", "ambos", 0.9)).toBe("nuevo");
  });
  it("si da igual, se alterna", () => {
    expect(resolverTipoCliente("cualquiera", "ambos", 0.2)).toBe("nuevo");
    expect(resolverTipoCliente("cualquiera", "ambos", 0.8)).toBe("recurrente");
  });
});

describe("la ficha", () => {
  it("nunca devuelve basura: lo que falta se completa", () => {
    expect(validarFicha({}, "nuevo")).toEqual({ tipo: "nuevo", nombre: "Don Ramón", negocio: "su negocio" });
    const r = validarFicha({ nombre: "Doña Elena", negocio: "farmacia", ya_te_compra: "genéricos" }, "recurrente");
    expect(r.ya_te_compra).toBe("genéricos");
    expect(r.ultima_visita).toBe("hace dos semanas");
  });
  it("un cliente nuevo no trae historial aunque el modelo lo invente", () => {
    expect(validarFicha({ nombre: "Don Luis", negocio: "taller", ya_te_compra: "aceite" }, "nuevo").ya_te_compra).toBeUndefined();
  });
  it("una ficha que llega rota se descarta", () => {
    expect(fichaDePeticion({ tipo: "otro" })).toBeNull();
    expect(fichaDePeticion(null)).toBeNull();
  });
  it("la tarjeta nunca revela el hueco", () => {
    const f = validarFicha({ nombre: "Don Ramón", negocio: "taller", ya_te_compra: "aceite de motor", ultima_visita: "hace dos semanas", le_compra_a_otro: "grasas" }, "recurrente");
    expect(lineaDelCliente(f)).toBe("Cliente recurrente: ya te compra aceite de motor. Tu última visita fue hace dos semanas.");
    expect(lineaDelCliente(f)).not.toMatch(/grasas/);
  });
});

describe("cada consumidor recibe la misma ficha", () => {
  const rec = validarFicha({ nombre: "Don Ramón", negocio: "taller", ya_te_compra: "aceite de motor", ultima_visita: "hace dos semanas", le_compra_a_otro: "grasas" }, "recurrente");
  it("el cliente simulado: recurrente, con el hueco que no menciona por su cuenta", () => {
    const b = bloqueActor(rec);
    expect(b).toMatch(/Eres cliente RECURRENTE de este vendedor: ya le compras aceite de motor/);
    expect(b).toMatch(/grasas se lo compras a OTRO proveedor\. No lo menciones por tu cuenta/);
  });
  it("sin ficha, el cliente simulado sigue siendo nuevo, como antes", () => {
    expect(bloqueActor(null)).toMatch(/Eres un cliente nuevo que el vendedor acaba de encontrar/);
  });
  it("el evaluador: recordar la ficha es legítimo; lo demás es inventado", () => {
    expect(bloqueEvaluador(rec)).toMatch(/Recordar un hecho de esta lista es legítimo y es el escalón 3/);
    expect(bloqueEvaluador(validarFicha({}, "nuevo"))).toMatch(/ningún consejo puede citar una visita anterior/);
  });
});

describe("todo conectado", () => {
  const fn = readFileSync(join(process.cwd(), "supabase/functions/closer-voice/index.ts"), "utf8");
  const ui = readFileSync(join(process.cwd(), "src/routes/nodo.$nodeId.practica.tsx"), "utf8");
  const equipo = readFileSync(join(process.cwd(), "src/routes/equipo.index.tsx"), "utf8");
  const auditor = readFileSync(join(process.cwd(), "supabase/functions/_shared/auditar_coaching.ts"), "utf8");
  it("el servidor crea la ficha, con respaldo si algo falla", () => {
    expect(fn).toMatch(/if \(\(body as any\)\.phase === "ficha_cliente"\) \{/);
    expect(fn).toMatch(/let ficha: FichaCliente = fichaDeRespaldo\(tipo\);/);
  });
  it("el cliente simulado ya no es 'nuevo' fijo: recibe la ficha", () => {
    expect(fn).toMatch(/\$\{bloqueActor\(ficha\)\}/);
    expect(fn).not.toMatch(/IMPORTANTE: Eres un cliente nuevo que el vendedor acaba de encontrar\.\nNO inventes/);
  });
  it("el evaluador y el auditor reciben la misma ficha", () => {
    expect(fn).toMatch(/\$\{bloqueEvaluador\(ficha\)\}/);
    expect(fn).toMatch(/ficha_cliente: bloqueEvaluador\(fichaDePeticion/);
    expect(auditor).toMatch(/en la "conversacion" o en la "ficha_cliente"/);
  });
  it("con un cliente recurrente, recordar su ficha no se borra", () => {
    expect(fn).toMatch(/if \(fichaDePeticion\(\(body as any\)\.ficha_cliente\)\?\.tipo !== "recurrente"\) \{/);
  });
  it("la pantalla pide la ficha, la manda en cada turno y en la evaluación, y la guarda", () => {
    expect(ui).toMatch(/phase: "ficha_cliente", tipo_cliente: tipo/);
    expect(ui.match(/ficha_cliente: fichaRef\.current/g)?.length).toBe(3);
  });
  it("la tarjeta es una ventana que se cierra con Continuar antes de poder hablar", () => {
    expect(ui).toMatch(/aria-label="Tu cliente"/);
    expect(ui).toMatch(/!showVoiceTutorial && !fichaVista && \(/);
    expect(ui).toMatch(/onClick=\{\(\) => setFichaVista\(true\)\}/);
    expect(ui).toMatch(/\{LLAMADO_A_LA_ACCION\}/);
  });
  it("si la ficha no llega, hay respaldo: la práctica nunca espera", () => {
    expect(ui).toMatch(/const respaldo = fichaRespaldoVisible\(tipo\);/);
  });
  it("el manager elige con qué clientes practica su equipo", () => {
    expect(equipo).toMatch(/\["solo_nuevos", "Solo nuevos"\]/);
    expect(equipo).toMatch(/body: \{ tipos_cliente: valor \}/);
  });
});

describe("la ficha solo usa productos que la empresa vende (oct-2026)", () => {
  const dalfan = "Lubricantes Repsol, Bardahl y Mexlub: aceite de motor, aceite de transmisión, grasas, anticongelantes";
  it("el caso real: DALFAN no vende filtros", () => {
    expect(respaldadoPorCatalogo("aceite y filtros", dalfan)).toBe(false);
    expect(respaldadoPorCatalogo("aceite de motor", dalfan)).toBe(true);
    expect(respaldadoPorCatalogo("grasa", dalfan)).toBe(true);
    expect(respaldadoPorCatalogo("Anticongelantes", dalfan)).toBe(true);
  });
  it("lo inventado se cambia por algo genérico, y el hueco inventado se quita", () => {
    const f = validarFicha({ nombre: "Don Ramón", negocio: "taller", ya_te_compra: "aceite y filtros", ultima_visita: "hace dos semanas", le_compra_a_otro: "bujías" }, "recurrente", dalfan);
    expect(f.ya_te_compra).toBe("sus productos de siempre");
    expect(f.le_compra_a_otro).toBeUndefined();
  });
  it("con catálogo vacío no se nombra ningún producto", () => {
    expect(validarFicha({ ya_te_compra: "aceite" }, "recurrente", "").ya_te_compra).toBe("sus productos de siempre");
  });
  it("lee el catálogo del cerebro como texto o lista", () => {
    expect(catalogoDelCerebro(JSON.stringify({ PRODUCTOS_ACTIVOS: "aceites; grasas" }))).toBe("aceites; grasas");
    expect(catalogoDelCerebro({ PRODUCTOS_ACTIVOS: ["aceites", "grasas"] })).toBe("aceites; grasas");
  });
  it("el servidor manda solo productos y cliente típico, y verifica", () => {
    const fn = readFileSync(join(process.cwd(), "supabase/functions/closer-voice/index.ts"), "utf8");
    expect(fn).toMatch(/validarFicha\(JSON\.parse\(t\.slice\(i, j \+ 1\)\), tipo, catalogo\)/);
  });
});

