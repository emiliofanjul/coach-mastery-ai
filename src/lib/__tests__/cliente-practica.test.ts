// El perfil del cliente de cada práctica (oct-2026).
import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { resolverTipoCliente, lineaDelCliente } from "../cliente-practica";
import { validarFicha, fichaDePeticion, bloqueActor, bloqueEvaluador } from "../../../supabase/functions/_shared/ficha_cliente";

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
  it("la tarjeta aparece al empezar el turno y se va cuando el vendedor habla", () => {
    expect(ui).toMatch(/fichaCliente=\{currentPhase === "you_do" && !transcriptFull\.some/);
    expect(ui).toMatch(/\{LLAMADO_A_LA_ACCION\}/);
  });
  it("el manager elige con qué clientes practica su equipo", () => {
    expect(equipo).toMatch(/\["solo_nuevos", "Solo nuevos"\]/);
    expect(equipo).toMatch(/body: \{ tipos_cliente: valor \}/);
  });
});

