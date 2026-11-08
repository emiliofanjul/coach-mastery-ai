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
const ui = leer("src/components/closer/practica-ui.tsx");
const alta = leer("src/routes/signup.tsx");
const onboarding = leer("src/routes/onboarding.seller.tsx");

describe("El micrófono invita cuando te toca", () => {
  it("halo suave solo cuando le toca hablar, y respeta a quien no quiere animaciones", () => {
    // Fase 4 (mensaje 151): el micrófono y su halo viven en practica-ui.tsx; la regla es la misma.
    expect(practica).toContain("const teTocaHablar = !isUserListening && !isAgentSpeaking && !isProcessing && !connectionError;");
    expect(practica).toContain('estado={isUserListening ? "grabando" : teTocaHablar ? "te_toca" : "apagado"}');
    expect(ui).toContain("@keyframes practicaInvita");
    expect(ui).toContain('className={toca ? "practica-mic-invita" : undefined}');
    expect(ui).toContain("@media (prefers-reduced-motion: reduce)");
    expect(practica).toContain('"Te toca. Toca para hablar"');
  });
});

describe("La grabación es obligatoria", () => {
  it("no se puede seguir sin aceptarla, y se dice por qué", () => {
    expect(onboarding).toContain("disabled={!value || !audioConsent}");
    // Mensaje 155: el mismo porqué, en palabras más directas.
    // Mensaje 159: el porqué, en palabras aún más simples (y el aviso si no la marca).
    expect(onboarding).toContain("Así puedo practicar con mi voz");
    expect(onboarding).toContain("sin grabación no se puede practicar con voz.");
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

describe("Mensaje 124: el consentimiento se guarda primero y se comprueba", () => {
  it("se guarda antes del mensaje de la IA, y si falla se avisa", () => {
    const guardar = onboarding.indexOf('const { error: guardarErr } = await supabase');
    expect(guardar).toBeGreaterThan(0);
    expect(guardar).toBeLessThan(onboarding.indexOf("const res = await generateSellerWelcome({"));
    expect(onboarding).toContain('setAiError("No pudimos guardar tus respuestas. Toca para reintentar.");');
    expect(onboarding.match(/audio_consent: audioConsent/g)?.length).toBe(1);
  });
});
