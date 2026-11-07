// Mensaje 145 (6-nov-2026) · Fase 1 del rediseño: un solo sistema de colores.
// Antes, cada pantalla escribía sus colores a mano (unos 880, en 38 archivos) y convivían dos paletas:
// la del archivo de estilos y la de las pantallas, con un gris morado que nadie había decidido.
// Ahora todos los colores viven en src/styles.css (--c-…) y las pantallas usan var(--c-…).
// Esta prueba impide que vuelva a pasar: una pantalla nueva que escriba un color a mano, falla.
import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";

const RAIZ = path.resolve(__dirname, "../..");
const css = fs.readFileSync(path.join(RAIZ, "styles.css"), "utf8");

function archivos(dir: string): string[] {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) return /tests|integrations|__tests__/.test(e.name) ? [] : archivos(p);
    return /\.(tsx|ts)$/.test(e.name) && !/routeTree/.test(e.name) ? [p] : [];
  });
}

// Lo único que puede seguir escrito a mano, y por qué.
const PERMITIDOS: Record<string, string[]> = {
  "*": ["#FFFFFF", "#FFF"], // el blanco no es de la paleta
  "routes/login.tsx": ["#4285F4", "#EA4335", "#FBBC05", "#34A853"], // logo de Google
  "components/app/CompartirInvitacion.tsx": ["#25D366"], // WhatsApp
  "components/VictoryScreen.tsx": ["#FF6B2B", "#F2C14E", "#FFB088"], // el confeti se dibuja en un canvas, que no lee variables
  "routes/red.tsx": ["*"], // pantalla interna de la red de pruebas
  "lib/error-page.ts": ["*"], // página de error del servidor, fuera de la app
  "components/ui/chart.tsx": ["*"], // componente base de la librería
};

describe("Colores: una sola paleta (mensaje 145)", () => {
  it("la paleta vive en styles.css, azul marino y naranja, sin el gris morado", () => {
    for (const v of ["--c-bg:", "--c-surface:", "--c-elevated:", "--c-text:", "--c-text-2:", "--c-primary: #FF6B2B", "--c-client:", "--c-danger:", "--c-success:", "--c-gold:"]) {
      expect(css).toContain(v);
    }
    expect(css).toContain("--background: var(--c-bg)");
    expect(css.toUpperCase()).not.toContain("#5A5A8A");
  });

  it("ninguna pantalla escribe colores a mano", () => {
    const malos: string[] = [];
    for (const f of archivos(RAIZ)) {
      const rel = path.relative(RAIZ, f).split(path.sep).join("/");
      const ok = [...PERMITIDOS["*"], ...(PERMITIDOS[rel] ?? [])];
      if (ok.includes("*")) continue;
      const txt = fs.readFileSync(f, "utf8");
      for (const m of txt.matchAll(/#[0-9a-fA-F]{6}\b|#[0-9a-fA-F]{3}\b(?![0-9a-fA-F])/g)) {
        if (!ok.includes(m[0].toUpperCase())) malos.push(`${rel}: ${m[0]}`);
      }
      for (const m of txt.matchAll(/rgba\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/g)) {
        const neutro = (m[1] === m[2] && m[2] === m[3] && (m[1] === "255" || m[1] === "0"));
        if (!neutro) malos.push(`${rel}: ${m[0]})`);
      }
    }
    expect(malos).toEqual([]);
  });

  it("la burbuja del coach ya no tapa los botones de entrar, crear cuenta y elegir modo", () => {
    for (const r of ["routes/login.tsx", "routes/signup.tsx", "routes/role.tsx"]) {
      expect(fs.readFileSync(path.join(RAIZ, r), "utf8")).not.toContain("AuthCoachBubble");
    }
  });
});
