// Fallas espejo (oct-2026, decisión de Emilio). Una falla que es el reverso de
// un criterio del mismo nodo se sigue detectando y mostrando —el vendedor ve
// qué hizo, el cliente IA y el revisor del feedback la siguen conociendo—,
// pero no resta aparte: el criterio ya lo cobró. Antes el evaluador a veces la
// cobraba y a veces no ("no castigues dos veces"), y la misma conversación
// sacaba notas distintas. Las critical nunca son espejo: siempre topan.
import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { calcularScore, fallasDe, explicarNota, esEspejo } from "../../../supabase/functions/_shared/puntuacion";

const leer = (p: string) => readFileSync(join(process.cwd(), p), "utf8");
const nodos: any[] = JSON.parse(leer("docs/kb/nodos_snapshot.json"));
const schema = JSON.parse(leer("supabase/functions/_shared/practice_script_schema_v1.json"));

const CRIT = [{ id: "rrr", weight: 1 }];
const FALLAS = [
  { id: "ignora_estado", severity: "major", description: "Sigue igual.", espejo_de: "rrr" },
  { id: "monologo", severity: "minor", description: "Habla de más." },
  { id: "pitch", severity: "critical", description: "Presenta producto.", espejo_de: "rrr" },
];

describe("la nota", () => {
  it("una falla espejo no resta: la misma conversación saca la misma nota la marque o no el evaluador", () => {
    const v = [{ criterio_id: "rrr", nivel: "parcial", falta: "no ajustó el ritmo" }];
    const sin = calcularScore({ veredictos: v, successCriteria: CRIT, flags: [], failureCriteria: FALLAS });
    const con = calcularScore({ veredictos: v, successCriteria: CRIT, flags: ["ignora_estado"], failureCriteria: FALLAS });
    expect(sin.score).toBe(50);
    expect(con.score).toBe(50);
    expect(con.restas).toEqual([]);
  });
  it("una falla normal sí resta", () => {
    const r = calcularScore({ veredictos: [{ criterio_id: "rrr", nivel: "cumple" }], successCriteria: CRIT, flags: ["monologo"], failureCriteria: FALLAS });
    expect(r.score).toBe(85);
  });
  it("una critical marcada como espejo sigue siendo candado: deja la nota en 30", () => {
    expect(esEspejo(FALLAS[2])).toBe(false);
    const r = calcularScore({ veredictos: [{ criterio_id: "rrr", nivel: "cumple" }], successCriteria: CRIT, flags: ["pitch"], failureCriteria: FALLAS });
    expect(r.score).toBe(30);
  });
});

describe("lo que ve el vendedor", () => {
  it("la falla espejo sale explicada, sin decir que restó puntos", () => {
    const [f] = fallasDe(["ignora_estado"], FALLAS, [{ id: "ignora_estado", cita: "bueno, le platico de lo nuestro", error: "No reconociste su prisa." }]);
    expect(f.espejo_de).toBe("rrr");
    expect(f.efecto).toContain("no resta aparte");
    expect(f.cita).toContain("le platico");
  });
  it("la explicación de la nota lo dice", () => {
    const r = calcularScore({ veredictos: [{ criterio_id: "rrr", nivel: "no_cumple" }], successCriteria: CRIT, flags: ["ignora_estado"], failureCriteria: FALLAS });
    const txt = explicarNota({
      score: r.score,
      desglose: { base: r.base, criterios: r.desglose, restas: r.restas, topado: r.topado, criticos: r.criticos },
      fallas: fallasDe(["ignora_estado"], FALLAS, []),
    })!;
    expect(txt).toContain("No restaron aparte");
    expect(txt).toContain("ignora_estado → rrr");
  });
});

describe("el evaluador", () => {
  const voz = leer("supabase/functions/closer-voice/index.ts");
  it("sabe que las espejo y las critical se marcan siempre", () => {
    expect(voz).toContain('DOS TIPOS DE FALLA QUE SE MARCAN SIEMPRE');
    expect(voz).toContain('Las critical: son un candado del nodo');
  });
});

describe("los guiones", () => {
  it("el schema acepta espejo_de (sin esto la práctica se rechaza por 'error de configuración')", () => {
    expect(schema.properties.failure_criteria.items.properties.espejo_de.type).toBe("string");
  });
  it("cada espejo apunta a un criterio de éxito de su propio nodo y nunca es critical", () => {
    const malos: string[] = [];
    for (const n of nodos) {
      const ps = n.practice_script ?? {};
      const exito = new Set((ps.success_criteria ?? []).map((c: any) => c.id));
      for (const f of ps.failure_criteria ?? []) {
        if (!f.espejo_de) continue;
        if (!exito.has(f.espejo_de)) malos.push(`${n.id}/${f.id} → ${f.espejo_de} no existe`);
        if (f.severity === "critical") malos.push(`${n.id}/${f.id} es critical`);
      }
    }
    expect(malos).toEqual([]);
  });
  it("son los 14 pares acordados (13 de nodos normales + el 2.2), y ningún jefe todavía", () => {
    const pares = nodos.flatMap((n) => (n.practice_script?.failure_criteria ?? [])
      .filter((f: any) => f.espejo_de).map((f: any) => `${n.id}/${f.id}`));
    expect(pares.sort()).toEqual([
      "1.4/se_encoge", "2.2/turno_sin_pregunta", "2.8/no_se_adelanta", "3.1/ignora_estado",
      "3.2/ignora_pistas", "3.2/pregunta_generica_en_capa2", "3.3/conversacion_desconectada",
      "4.10/se_derrumba", "4.12/cierra_con_afirmacion", "4.3/explica_sin_pintar", "4.3/imagen_generica",
      "4.3/presentacion_generica", "5.6/no_repite", "6.2/proximos_pasos_vagos",
    ].sort());
    const jefes = new Set(nodos.filter((n) => n.node_type === "boss").map((n) => n.id));
    expect(pares.filter((p) => jefes.has(p.split("/")[0]))).toEqual([]);
  });
});
