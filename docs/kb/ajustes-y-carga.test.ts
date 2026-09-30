// Voz nueva, texto a decisión del manager, y mensajes de carga reales (sept-2026).
import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const ui = readFileSync(join(process.cwd(), "src/routes/nodo.$nodeId.practica.tsx"), "utf8");
const equipo = readFileSync(join(process.cwd(), "src/routes/equipo.index.tsx"), "utf8");
const tts = readFileSync(join(process.cwd(), "supabase/functions/closer-tts/index.ts"), "utf8");
const nodos = JSON.parse(readFileSync(join(process.cwd(), "docs/kb/nodos_snapshot.json"), "utf8"));

// La función vive en la pantalla; se extrae y se ejecuta tal cual.
const src = ui.slice(ui.indexOf("export function mensajesDeAnalisis"), ui.indexOf("\n}\n", ui.indexOf("export function mensajesDeAnalisis")) + 2)
  .replace("export function", "function").replace(/: any|: Record<string, string>|: string\[\]/g, "");
const mensajesDeAnalisis = new Function(`${src}; return mensajesDeAnalisis;`)() as (ps: any, n: Record<string, string>) => string[];

describe("mensajes de carga: solo lo que este nodo mide", () => {
  const n12 = nodos.find((n: any) => n.id === "1.2");
  const ps = typeof n12.practice_script === "string" ? JSON.parse(n12.practice_script) : n12.practice_script;
  const nombres: Record<string, string> = {};
  for (const c of ps.success_criteria) nombres[c.regla_id] = `criterio ${c.id}`;

  it("nombra cada criterio del nodo y termina con el auditor", () => {
    const m = mensajesDeAnalisis(ps, nombres);
    expect(m[0]).toBe("Leyendo tu conversación…");
    expect(m.at(-1)).toBe("Revisando tus consejos contra la doctrina…");
    expect(m.length).toBe(ps.success_criteria.filter((c: any) => !c.requires_audio).length + 3);
  });
  it("un nodo de introducción nunca dice 'presentación' ni 'descubrimiento'", () => {
    expect(mensajesDeAnalisis(ps, nombres).join(" ")).not.toMatch(/presentaci|descubrim/i);
  });
  it("no da vueltas: se queda en el último mensaje", () => {
    expect(ui).toMatch(/setMsgIdx\(\(p\) => Math\.min\(p \+ 1, mensajes\.length - 1\)\);/);
    expect(ui).not.toMatch(/ANALYSIS_MESSAGES/);
  });
});

describe("texto: decisión del manager", () => {
  it("la práctica lee el ajuste de la empresa y esconde el botón si no se permite", () => {
    expect(ui).toMatch(/companies\?select=name,company_sales_brain,permite_texto/);
    expect(ui).toMatch(/onToggleMode=\{permiteTexto \? \(\) => setInputMode/);
    expect(ui).toMatch(/\{onToggleMode && <ModeToggle/);
  });
  it("el manager lo cambia desde su panel", () => {
    expect(equipo).toMatch(/aria-label="Permitir práctica por texto"/);
    expect(equipo).toMatch(/body: \{ permite_texto: nuevo \}/);
  });
});

describe("la voz", () => {
  it("Martín Álvarez con Eleven v4 Turbo, y respaldo si el modelo falla", () => {
    expect(tts).toMatch(/const DEFAULT_VOICE_ID = "Wl3O9lmFSMgGFTTwuS6f";/);
    expect(tts).toMatch(/const DEFAULT_MODEL_ID = "eleven_v4_turbo";/);
    expect(tts).toMatch(/ttsRes = await generar\(RESPALDO_MODEL_ID\);/);
  });
});
