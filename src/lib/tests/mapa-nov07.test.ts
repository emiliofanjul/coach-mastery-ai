// Mensaje 147 (7-nov-2026) · Fase 3 del rediseño: el mapa.
// Lo que Emilio aprobó en la maqueta: camino con curvas, naranja liso donde ya pasaste (con un resplandor
// muy sutil), candado en lo que falta, todos los nodos del mismo tamaño (el siguiente destaca por su color
// y su anillo que parpadea), play blanco sobre naranja con volumen, nombres cortos, «Reto final» en lugar
// de «BOSS», un solo tono para todos los mundos (cambiar de color por mundo altera la marca), el coach
// como botón discreto en el encabezado, «¿Cómo funciona?» en el menú, «Sigue aquí · N min» al fondo,
// y los nodos completados se pueden volver a practicar (la app guarda siempre la mejor calificación).
// Después (7-nov): lo completado lleva un relleno naranja tenue, y cada nodo se nombra por la técnica que enseña.
import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";

const RAIZ = path.resolve(__dirname, "../..");
const leer = (r: string) => fs.readFileSync(path.join(RAIZ, r), "utf8");
const mapa = leer("routes/mapa.tsx");
const piezas = leer("components/closer/piezas.tsx");
const shell = leer("components/app/AppShell.tsx");
const coach = leer("components/closer/CoachBubble.tsx");
const css = leer("styles.css");
const nodos: Array<{ id: string; name: string; node_type: string }> = JSON.parse(
  fs.readFileSync(path.join(RAIZ, "../docs/kb/nodos_snapshot.json"), "utf8"),
);

describe("Los nodos", () => {
  it("todos miden igual; el siguiente destaca por su color y su anillo, no por su tamaño", () => {
    expect(mapa).toContain("const NODE_SIZE = 52;");
    expect(mapa).toMatch(/animation: "respira 2\.4s ease-in-out infinite"/);
    expect(mapa).toContain("width: size + 12");
  });
  it("lo que falta lleva candado; lo terminado, palomita blanca y borde naranja", () => {
    expect(mapa).toMatch(/if \(bloqueado\) icon = <Lock/);
    expect(mapa).toContain('<Check size={22} color="var(--c-text)"');
    expect(mapa).toContain('circulo.borderColor = isBoss ? "var(--c-gold)" : "var(--c-primary)"');
  });
  it("lo recorrido queda pintado: relleno naranja tenue (dorado en los retos), muy distinto del play macizo", () => {
    expect(mapa).toContain("linear-gradient(180deg, rgb(${rgb} / 0.34) 0%, rgb(${rgb} / 0.12) 100%), var(--c-bg)");
  });
  it("el play es blanco sobre naranja con volumen, y sus colores viven en styles.css", () => {
    expect(piezas).toContain("export const estiloBotonPlay");
    expect(piezas).toContain("export function IconoPlay");
    expect(css).toContain("--c-play-centro: #F4601F");
  });
  it("bajo cada nodo va su nombre corto", () => {
    expect(mapa).toContain("const nombre = node.nombre_corto || node.name;");
    expect(mapa).toContain("nombre_corto,minutos_estimados");
  });
  it("el nombre claro (la técnica que enseña) se usa en todo el mapa: bajo el nodo, en su ventana y en «Sigue aquí»", () => {
    expect(mapa).toContain("{nodoActivo.nombre_corto || nodoActivo.name}");
    expect(mapa.match(/<SheetTitle style=\{titulo\}>\{node\.nombre_corto \|\| node\.name\}<\/SheetTitle>/g)?.length).toBe(3);
  });
  it("nada rebota ni vibra", () => {
    for (const k of ["checkBounce", "starPop", "nodeShake", "nodeScaleIn", "pulseOrange", "pulseGold", "nextNodeGlow"]) {
      expect(mapa).not.toContain(k);
    }
  });
});

describe("El camino y los mundos", () => {
  it("curvas suaves: naranja liso donde ya pasaste, con un resplandor muy sutil", () => {
    expect(mapa).toMatch(/const path = `M \$\{x1\} \$\{y1\} C/);
    expect(mapa).toContain('stroke="rgb(var(--c-primary-rgb) / 0.07)"');
  });
  it("todos los mundos con el mismo tono: el color de cada mundo ya no se usa", () => {
    expect(mapa).not.toContain("world.color");
    expect(mapa).not.toContain("world.icon");
  });
});

describe("Reto final", () => {
  it("el mapa dice «Reto final», nunca «BOSS»", () => {
    expect(mapa).toContain("Reto final");
    expect(mapa).not.toMatch(/>\s*BOSS\s*</);
    expect(mapa).not.toContain("Entrar al Boss");
  });
  it("los nombres de los retos ya no dicen «Examen:» ni «Boss Final:»", () => {
    expect(nodos.filter((n) => /^(Examen|Boss Final):/i.test(n.name)).map((n) => n.id)).toEqual([]);
  });
  it("los nombres llevan sus acentos y el 1.5 es «El Rompe Hielo»", () => {
    const n = (id: string) => nodos.find((x) => x.id === id)!.name;
    expect(n("1.0")).toBe("La Línea Recta");
    expect(n("1.5")).toBe("El Rompe Hielo");
    expect(n("4.2")).toBe("Beneficio, No Característica");
    expect(n("7.4")).toBe("El Certificado");
  });
});

describe("El encabezado, el coach y «Sigue aquí»", () => {
  it("el coach es un botón discreto en el encabezado, no una burbuja naranja flotante", () => {
    expect(coach).not.toContain("fixed bottom-5 right-5");
    expect(coach).toContain('"bg-[var(--c-surface)] text-[var(--c-text-soft)]"');
    expect(coach).not.toContain("glow-orange");
    expect(mapa).toContain('rightExtras={<CoachBubble context="mapa" sellerId={seller?.id} />}');
  });
  it("«¿Cómo funciona?» vive en el menú", () => {
    expect(mapa).not.toContain("¿Cómo funciona?");
    expect(shell).toContain("Cómo funciona el mapa");
    expect(mapa).toContain('window.addEventListener("closer:tutorial-mapa", abrir)');
  });
  it("«Sigue aquí» lleva al nodo que sigue y dice cuánto toma", () => {
    expect(mapa).toContain("`Sigue aquí · ${nodoActivo.minutos_estimados} min`");
  });
});

describe("Volver a practicar", () => {
  it("un nodo completado se abre para practicarlo otra vez o repasar sus tarjetas", () => {
    expect(mapa).toContain("Practicar otra vez");
    expect(mapa).toContain("Repasar las tarjetas");
    expect(mapa).toContain("Practicarlo otra vez no te las quita.");
  });
});
