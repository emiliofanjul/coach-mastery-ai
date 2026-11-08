// Mensaje 160 (8-nov-2026, Emilio) · Al cliente nuevo no le sabes el nombre, como en la calle.
// Se asume que es quien decide (dueño o encargado de compras) para practicar el ciclo completo. Conseguir al
// que decide (un contacto, una cita) es otro cierre que todavía no se practica: queda en pendientes.
import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";
import { validarFicha, bloqueActor, bloqueEvaluador } from "../../../supabase/functions/_shared/ficha_cliente";
import { nombreVisible, lineaDelCliente } from "@/lib/cliente-practica";

const leer = (p: string) => fs.readFileSync(path.resolve(__dirname, "../../..", p), "utf8");
const practica = leer("src/routes/nodo.$nodeId.practica.tsx");
const nuevo = validarFicha({ nombre: "Don Martín", negocio: "refaccionaria" }, "nuevo");
const rec = validarFicha({ nombre: "Don Ramón", negocio: "taller" }, "recurrente");

describe("El cliente nuevo no tiene nombre para el vendedor", () => {
  it("en pantalla: «Cliente nuevo», una silueta y la línea que lo explica", () => {
    expect(nombreVisible(nuevo)).toBe("Cliente nuevo");
    expect(nombreVisible(rec)).toBe("Don Ramón");
    expect(lineaDelCliente(nuevo)).toBe("Es la primera vez que lo visitas y no sabes cómo se llama. Es quien decide la compra: el dueño o el encargado de compras.");
    expect(practica).toContain('sinNombre={cliente.tipo === "nuevo"}');
    expect(practica).toContain("{nombreVisible(fichaCliente)}");
    expect(practica).not.toMatch(/\{fichaCliente\.nombre\}/);
  });
  it("el cliente simulado: decide la compra, y dice su nombre solo si se lo preguntan", () => {
    const b = bloqueActor(nuevo);
    expect(b).toContain("Eres el dueño o el encargado de compras: tú decides qué se compra");
    expect(b).toContain("él tampoco sabe cómo te llamas. Si te pregunta tu nombre, se lo dices con naturalidad; si no, no lo menciones tú.");
  });
  it("el evaluador: no usar el nombre nunca es error; usarlo sin que se lo dijeran, sí", () => {
    const e = bloqueEvaluador(nuevo);
    expect(e).toContain("El vendedor NO sabe el nombre del cliente: no usarlo nunca es un error");
    expect(e).not.toContain("Don Martín");
    // El recurrente sí lo conoce.
    expect(bloqueEvaluador(rec)).toContain("Don Ramón");
  });
});

describe("La pantalla de los datos de su negocio se puede deslizar", () => {
  it("vive dentro de la práctica (pantalla fija): tiene su propio scroll", () => {
    const g = leer("src/components/closer/GiroPersonal.tsx");
    expect(g).toContain('overflowY: "auto"');
    expect(g).not.toContain('minHeight: "100dvh", boxSizing');
  });
});
