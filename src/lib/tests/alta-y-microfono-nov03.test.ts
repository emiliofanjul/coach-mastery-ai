// Mensaje 123 (3-nov-2026) · Lo que Emilio vio con vendedores reales.
// 1) El micrófono invita a tocarlo, sutil, cuando le toca hablar al vendedor.
// 2) Aceptar que se graben las prácticas es obligatorio para seguir.
// 3) Crear cuenta dice qué falta (un vendedor puso una contraseña corta y nadie
//    sabía por qué no avanzaba), y con Google también hay que aceptar los términos.
import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const leer = (p: string) => readFileSync(join(process.cwd(), p), "utf8");
const practica = leer("src/routes/nodo.$nodeId.practica.tsx");
const alta = leer("src/routes/signup.tsx");
const onboarding = leer("src/routes/onboarding.seller.tsx");

describe("El micrófono invita cuando te toca", () => {
  it("halo suave solo cuando le toca hablar, y respeta a quien no quiere animaciones", () => {
    expect(practica).toContain("const teTocaHablar = !isUserListening && !isAgentSpeaking && !isProcessing && !connectionError;");
    expect(practica).toContain("@keyframes practica-invita");
    expect(practica).toContain('teTocaHablar ? "practica-invita 2.4s ease-out infinite"');
    expect(practica).toContain("@media (prefers-reduced-motion: reduce)");
    expect(practica).toContain('"Te toca. Toca el micrófono para hablar"');
  });
});

describe("La grabación es obligatoria", () => {
  it("no se puede seguir sin aceptarla, y se dice por qué", () => {
    expect(onboarding).toContain("disabled={!value || !audioConsent}");
    expect(onboarding).toContain("sin grabar no se puede practicar");
    expect(onboarding).not.toContain("Puedes cambiar esto después.");
  });
});

describe("Crear cuenta dice qué falta", () => {
  it("lista lo que falta, en palabras, y la contraseña dice cuántos caracteres faltan", () => {
    expect(alta).toContain("Para crear tu cuenta te falta:");
    expect(alta).toContain("Tu contraseña es muy corta: te faltan ${8 - password.length} caracteres (mínimo 8).");
    expect(alta).toContain("const formValid = faltantes.length === 0;");
  });
  it("el botón ya no se apaga en silencio: al tocarlo, muestra lo que falta", () => {
    expect(alta).toContain("disabled={loading}");
    expect(alta).toContain("setIntento(true);");
  });
  it("con Google también hay que aceptar los términos", () => {
    expect(alta).toContain("Para continuar con Google, primero acepta los términos y condiciones.");
  });
});
