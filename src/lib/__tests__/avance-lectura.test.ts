// El avance de un nodo de solo lectura se guarda como la base lo acepta (oct-2026).
import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
const nodo = readFileSync(join(process.cwd(), "src/routes/nodo.$nodeId.tsx"), "utf8");
const esquema = readFileSync(join(process.cwd(), "docs/kb/esquema_vivo.sql"), "utf8");

describe("cerrar un nodo de lectura", () => {
  it("la base no acepta estrellas vacías en node_progress", () => {
    expect(esquema).toMatch(/stars integer NOT NULL DEFAULT 0/);
  });
  it("por eso el guardado no manda stars ni la empresa: lo cierra el servidor (mensaje 170)", () => {
    expect(nodo).not.toMatch(/stars: null/);
    expect(nodo).toContain('const r = await avanzarNodo(nodeId, { tipo: "lectura" });');
    expect(nodo).not.toContain('restMutate("node_progress"');
  });
  it("si no se guarda, el vendedor lo sabe y no lo manda al mapa", () => {
    expect(nodo).toMatch(/toast\.error\("No pudimos guardar tu avance\. Toca «Terminar» otra vez\."\);\s*return;/);
  });
});
