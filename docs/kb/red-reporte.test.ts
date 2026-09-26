// El reporte de la red, probado ejecutándolo.
import { describe, it, expect } from "vitest";
import { armarReporte, type Caso, type Resultado } from "../red-reporte";

const caso = (id: string, node_id = "1.2"): Caso => ({ id, node_id, mundo: Number(node_id.split(".")[0]), descripcion: "" });
const r = (status: Resultado["status"], score: number | null, reasons: string[] = [], veredictos: string[] = []): Resultado =>
  ({ status, score, reasons, veredictos });

describe("armarReporte", () => {
  it("todo verde y estable lo dice en una línea", () => {
    const t = armarReporte("v", [caso("G01")], 3, { G01: [r("pass", 100), r("pass", 100), r("pass", 100)] }, [1]);
    expect(t).toMatch(/Todo en verde y estable/);
    expect(t).not.toMatch(/FALLAS|INESTABLES/);
  });
  it("una falla trae sus razones y lo que decidió el evaluador", () => {
    const t = armarReporte("v", [caso("G26", "1.6")], 1,
      { G26: [r("fail", 93, ["score 93 outside range [60, 90]"], ["ice_breaker:parcial", "personalizacion:e2"])] }, [1]);
    expect(t).toMatch(/FALLAS\nG26 \[1\.6\] 93 — score 93 outside range/);
    expect(t).toMatch(/decidió: ice_breaker:parcial personalizacion:e2/);
  });
  it("un caso cuya nota cambia aparece como inestable, con los veredictos de cada corrida", () => {
    const t = armarReporte("v", [caso("G10")], 3, {
      G10: [r("pass", 100, [], ["estructura_apertura:cumple"]), r("pass", 53, [], ["estructura_apertura:parcial"]), r("pass", 53, [], ["estructura_apertura:parcial"])],
    }, [1]);
    expect(t).toMatch(/INESTABLES[\s\S]*G10 \[1\.2\] 100·53·53/);
    expect(t).toMatch(/c1: estructura_apertura:cumple/);
    expect(t).toMatch(/c2: estructura_apertura:parcial/);
  });
  it("cuenta aprobados, fallas, omitidos y errores por corrida", () => {
    const t = armarReporte("v", [caso("A"), caso("B"), caso("C")], 1,
      { A: [r("pass", 90)], B: [r("skipped", null)], C: [r("error", null, ["HTTP 500"])] }, [1]);
    expect(t).toMatch(/corrida 1: 1 ✓ · 0 ✗ · 1 omitidos · 1 errores/);
  });
});
