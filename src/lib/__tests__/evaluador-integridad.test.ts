// Integridad del evaluador.
//
// La vara con la que se califica a un vendedor NO puede venir del cliente.
// closer-voice debe resolver el practice_script por node_id contra
// v_nodes_resueltos y rechazar evaluate/replica sin node_id. Y el cliente
// debe mandarlo. Si alguien "simplifica" cualquiera de las dos mitades,
// este test rompe el build.

import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const fn = readFileSync(join(process.cwd(), "supabase/functions/closer-voice/index.ts"), "utf8");
const route = readFileSync(join(process.cwd(), "src/routes/nodo.$nodeId.practica.tsx"), "utf8");

describe("closer-voice: el servidor es la autoridad sobre el guion", () => {
  it("resuelve el practice_script por node_id contra la vista resuelta", () => {
    expect(fn).toMatch(/from\("v_nodes_resueltos"\)/);
    expect(fn).toMatch(/practice_script_resuelto/);
  });

  it("rechaza evaluate y replica cuando el guion no viene del servidor", () => {
    expect(fn).toMatch(/phase === "evaluate" \|\| phase === "replica"/);
    expect(fn).toMatch(/script_source !== "server"/);
    expect(fn).toMatch(/node_id_required/);
  });

  it("nunca usa el practice_script del cuerpo para calificar", () => {
    // El body se destructura como practice_script_body; la variable que
    // consume el resto del archivo se decide en el bloque de resolución.
    expect(fn).toMatch(/practice_script: practice_script_body/);
  });
});

describe("cliente de práctica: manda node_id en cada llamada que califica", () => {
  it("evaluate y replica llevan node_id", () => {
    expect(route).toMatch(/phase: "evaluate" as const,\s*node_id: nodeId/);
    expect(route).toMatch(/phase: "replica",\s*node_id: nodeId/);
  });

  it("las fases del Actor también llevan node_id", () => {
    expect(route).toMatch(/phase: claudePhaseRef\.current,\s*node_id: nodeId/);
  });
});
