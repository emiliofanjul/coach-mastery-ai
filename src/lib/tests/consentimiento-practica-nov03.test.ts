// Mensaje 125 (3-nov-2026) · Quien no tiene guardado que acepta la grabación
// (9 vendedores de DALFAN, y los managers que practican, que no pasan por el
// registro de vendedor) lo acepta una sola vez, antes de su práctica. Queda
// guardado por él mismo: no se marca a mano.
import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const practica = readFileSync(join(process.cwd(), "src/routes/nodo.$nodeId.practica.tsx"), "utf8");

describe("Consentimiento antes de practicar", () => {
  it("si no está guardado, la práctica no arranca y se pide", () => {
    const pide = practica.indexOf("if (seller.audio_consent !== true) {");
    expect(pide).toBeGreaterThan(0);
    expect(pide).toBeLessThan(practica.indexOf("setSellerData(seller);"));
    expect(practica).toContain("setPideConsentimiento({ sellerId: seller.id });");
  });
  it("una pantalla, un botón; se guarda y se comprueba antes de seguir", () => {
    expect(practica).toContain('"Acepto que se graben mis prácticas"');
    // Emilio (3-nov): la salida dice a dónde va, para que no parezca otra forma de practicar.
    expect(practica).toContain("Regresar al mapa");
    expect(practica).not.toMatch(/>\s*Ahora no\s*</);
    expect(practica).toContain("body: { audio_consent: true },");
    expect(practica).toContain('if (filas?.[0]?.audio_consent !== true) throw new Error("no quedó guardado");');
    // Mensaje 156: la preparación tampoco se ve mientras se pregunta el giro (cuentas personales).
    expect(practica).toContain("{phase === \"prep\" && !pideConsentimiento && !pideGiro && (");
  });
});
