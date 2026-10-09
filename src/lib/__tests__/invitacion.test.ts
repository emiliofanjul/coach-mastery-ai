// Invitar al equipo por WhatsApp o por correo, con una liga que trae el código
// ya puesto (oct-2026). Antes había un botón de correo que no enviaba nada.
import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import {
  ligaDeInvitacion,
  mensajeDeInvitacion,
  ligaWhatsApp,
  ligaCorreo,
  codigoDeLiga,
  ASUNTO_CORREO,
} from "../invitacion";

describe("la liga y el mensaje", () => {
  const liga = ligaDeInvitacion("https://closerapp.ai/", "AB12-CD34");
  it("la liga abre /unirme con el código", () => {
    expect(liga).toBe("https://closerapp.ai/unirme?codigo=AB12-CD34");
  });
  it("el mensaje dice de qué equipo es, trae la liga y el código, sin huecos", () => {
    const m = mensajeDeInvitacion("DALFAN", liga, "AB12-CD34", "2026-10-16T12:00:00Z");
    expect(m).toContain("el equipo de DALFAN");
    expect(m).toContain(liga);
    expect(m).toContain("AB12-CD34");
    expect(m).toMatch(/vence el \d+ de octubre/);
    expect(mensajeDeInvitacion("", liga, "AB12-CD34")).not.toMatch(/undefined|null|de \./);
  });
  it("WhatsApp y correo llevan el texto completo, bien codificado", () => {
    const m = mensajeDeInvitacion("DALFAN", liga, "AB12-CD34");
    expect(decodeURIComponent(ligaWhatsApp(m).split("text=")[1]!)).toBe(m);
    const correo = ligaCorreo(ASUNTO_CORREO, m);
    expect(correo.startsWith("mailto:?subject=")).toBe(true);
    expect(decodeURIComponent(correo.split("body=")[1]!)).toBe(m);
  });
});

describe("el código que trae la liga", () => {
  it("acepta códigos normales y los pasa a mayúsculas", () => {
    expect(codigoDeLiga(" ab12-cd34 ")).toBe("AB12-CD34");
  });
  it("rechaza basura o texto que no es un código", () => {
    for (const x of ["", "ab", "<script>", "a b c d", 42, null, "x".repeat(40)])
      expect(codigoDeLiga(x)).toBeNull();
  });
});

describe("las pantallas", () => {
  const leer = (p: string) => readFileSync(p, "utf8");
  it("el onboarding y Mi Empresa comparten la invitación por WhatsApp y correo", () => {
    expect(leer("src/routes/onboarding.manager.tsx")).toContain("<CompartirInvitacion");
    expect(leer("src/routes/mi-empresa.tsx")).toContain("<CompartirInvitacion");
    const c = leer("src/components/app/CompartirInvitacion.tsx");
    expect(c).toContain("Compartir por WhatsApp");
    expect(c).toContain("Enviar por correo");
  });
  it("la liga deja el código puesto al crear la cuenta", () => {
    expect(leer("src/routes/unirme.tsx")).toContain("setPendingInviteCode(c)");
    expect(leer("src/routes/signup.tsx")).toContain("getPendingInviteCode()");
  });
});
