// Mensaje 151-C (7-nov-2026) · Lo que Emilio vio en su iPhone con la Fase 4 publicada:
// 1) Al escribir en el chat del coach, el iPhone hacía zoom (los campos de menos de 16 px lo provocan).
// 2) Al terminar la demostración, la franja bajaba y quedaba detrás de «Listo, ahora yo».
// 3) Al fallar una práctica y volver al mapa, el camino al siguiente nodo se encendía y se apagaba.
// 4) Al tocar para enviar, el micrófono pasaba de rojo a naranja un instante antes de apagarse.
// 5) Un «100» se veía amontonado dentro del anillo (Syne es ancha).
import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";

const RAIZ = path.resolve(__dirname, "../..");
const leer = (r: string) => fs.readFileSync(path.join(RAIZ, r), "utf8");
const practica = leer("routes/nodo.$nodeId.practica.tsx");
const ui = leer("components/closer/practica-ui.tsx");

describe("Detalles de la Fase 4 en el iPhone", () => {
  it("los campos para escribir miden 16 px: el iPhone no hace zoom", () => {
    expect(leer("components/closer/CoachBubble.tsx")).toContain("text-[16px]");
    expect(practica).toContain('color: "#fff", fontFamily: "\'DM Sans\', sans-serif", fontSize: 16, lineHeight: 1.4,');
  });
  it("«Listo, ahora yo» va en el lugar del micrófono, que siempre ocupa lo mismo; la franja no se mueve", () => {
    expect(practica).toContain('<div style={{ height: 96, width: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>');
    expect(practica).toContain('<button type="button" onClick={onListoDemo} style={estiloBoton("principal")}>Listo, ahora yo</button>');
    expect(practica).toContain('{phase === "i_do" && iDoDemoDone && inputMode === "text" && (');
    expect(practica).toContain('visibility: isIDo && iDoDemoDone ? "hidden" : "visible"');
  });
  it("el camino al siguiente nodo se anima solo si la práctica lo desbloqueó", () => {
    expect(practica).toContain('desbloqueoAhora: unlocks && existingProgress?.status !== "done",');
    expect(leer("routes/nodo.$nodeId.quiz.tsx")).toContain("desbloqueoAhora: !wasCompleted,");
    expect(leer("routes/mapa.tsx")).toContain('&& animSignal.desbloqueoAhora !== false && computeStatus(node) !== "locked";');
  });
  it("al enviar, el micrófono no parpadea en naranja", () => {
    expect(ui).toContain('if (anterior === "grabando" && estado === "te_toca") setRetener(true);');
    expect(ui).toContain("setTimeout(() => setRetener(false), 400)");
  });
  it("con tres cifras el número se achica para dejar aire dentro del anillo", () => {
    expect(ui).toContain("Math.round(calificacion) >= 100 ? 0.19 : 0.22");
  });
});
