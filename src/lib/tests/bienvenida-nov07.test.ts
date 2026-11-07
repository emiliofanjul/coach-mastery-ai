// Mensaje 154 (7-nov-2026) · La bienvenida y las primeras veces, rehechas.
// Emilio auditó el primer tutorial y el del micrófono: hablaban de un mapa de 10 mundos, «57 etapas»,
// un video que no existía, compromisos e insignias que no hay. Pidió KISS y que se vea profesional.
// Esta prueba cuida que no regrese lo falso y que cada primera vez enseñe en el momento.
import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";

const leer = (p: string) => fs.readFileSync(path.resolve(__dirname, "../../..", p), "utf8");
const seller = leer("src/routes/onboarding.seller.tsx");
const asi = leer("src/routes/onboarding.map-intro.tsx");
const piezas = leer("src/components/closer/bienvenida-ui.tsx");
const mapa = leer("src/routes/mapa.tsx");
const guia = leer("src/components/closer/GuiaMapa.tsx");
const practica = leer("src/routes/nodo.$nodeId.practica.tsx");
const shell = leer("src/components/app/AppShell.tsx");
const emoji = /\p{Extended_Pictographic}/u;

describe("La bienvenida (cuatro pantallas)", () => {
  it("dice lo que Closer hace de verdad", () => {
    // Mensaje 155: palabras directas. Antes decía «Aquí no vienes a leer», y lo primero que hace es leer.
    // y la primera pantalla, que ven todos, dice por qué Closer es distinto (Emilio, 7-nov).
    expect(seller).toContain("Entrena con un sistema de ventas que ha generado millones.");
    expect(seller).not.toContain("Aquí no vienes a leer");
    expect(seller).not.toContain("desde tu teléfono"); // Closer también se usa en la computadora
    for (const t of ["Un sistema completo", "Práctica de verdad", "Una calificación que no adivina", "Tu manager te acompaña"]) expect(seller).toContain(t);
    expect(seller).toContain("Ver cómo funciona");
  });
  it("las preguntas: barra de avance, regresar y opciones con íconos dibujados, sin emojis", () => {
    expect(seller).toContain("<EncabezadoPreguntas paso={step} total={3}");
    expect(seller).toContain("<IconoNivel nivel={opt.nivel}");
    expect(emoji.test(seller)).toBe(false);
    expect(emoji.test(piezas)).toBe(false);
    expect(piezas).toContain('role="radio"');
    expect(piezas).toContain('role="checkbox"');
  });
  it("el nombre se escribe a 16 px o más (el iPhone no hace zoom)", () => {
    expect(seller).toMatch(/aria-label="Tu nombre"[\s\S]{0,900}fontSize: 18/);
  });
  it("en pantallas bajitas (375×568) el botón principal se queda pegado abajo, siempre visible (155-B)", () => {
    expect(seller).toMatch(/const ESTILO_ABAJO: React\.CSSProperties = \{\s*position: "sticky",\s*bottom: 0,/);
    expect(asi).toMatch(/<div style=\{\{ position: "sticky", bottom: 0,/);
  });
  it("sin el menú flotante mientras se responde la bienvenida", () => {
    expect(shell).toContain('!pathname.startsWith("/onboarding")');
  });
});

describe("«Así funciona» (tres pantallas)", () => {
  it("sin el recorrido viejo: ni mundos inventados, ni video, ni compromisos, ni insignias", () => {
    for (const t of ["57 etapas", "COMMITMENTS", "Rookie", "VideoStep", "declaration", "Vendedor Elite", "WORLDS"]) {
      expect(asi).not.toContain(t);
    }
    expect(emoji.test(asi)).toBe(false);
  });
  it("aprende, practica, mejora; y termina en el mapa", () => {
    for (const t of ["Por qué funciona", "1 · Aprende", "2 · Practica", "3 · Mejora", "Tu camino", "Saltar", "Ir a mi mapa"]) expect(asi).toContain(t);
    expect(asi).toContain("Nunca te califica algo que no te ha enseñado.");
    // Mensaje 155: dice antes que se empieza con teoría y cuándo llega la primera práctica con voz.
    expect(asi).toContain("En el tercero haces tu primera práctica con voz");
    expect(asi).toContain('navigate({ to: "/mapa" })');
  });
  it("no guarda nada: la bienvenida ya marcó onboarding_completed", () => {
    expect(asi).not.toMatch(/\.update\(|\.insert\(/);
    expect(seller).toContain("onboarding_completed: true");
  });
});

describe("La primera vez en el mapa", () => {
  it("un solo globo «Empieza aquí» sobre el nodo que toca, en lugar del recorrido de 5 pasos", () => {
    expect(fs.existsSync(path.resolve(__dirname, "../../components/closer/MapTutorial.tsx"))).toBe(false);
    expect(mapa).not.toContain("MapTutorial");
    expect(mapa).toContain("<GuiaMapa");
    expect(guia).toContain("Empieza aquí");
    expect(guia).toContain("[data-active-node]");
    expect(mapa).toContain("map_tutorial_completed: true");
  });
});

describe("La primera práctica con voz", () => {
  it("sin pantalla de tutorial: tres pistas bajo el micrófono, una vez", () => {
    expect(practica).not.toContain("showVoiceTutorial");
    expect(practica).not.toContain("Entendido, a practicar");
    expect(practica).toContain("<PistaPrimeraVez texto={pista} />");
    expect(practica).toContain("Habla con calma. Cuando termines, toca otra vez para enviar.");
    expect(practica).toContain("Escúchalo. Cuando termine, te toca a ti.");
    expect(practica).toContain('window.localStorage.setItem("closer_voice_tutorial_seen", "true")');
  });
  it("la pista solo se va cuando el cliente de verdad contestó", () => {
    expect(practica).toMatch(/if \(clienteYaHablo\.current\) \{\s*setPasoGuia\(3\);/);
  });
});
