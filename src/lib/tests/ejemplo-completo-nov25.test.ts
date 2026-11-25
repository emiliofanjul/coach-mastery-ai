// Mensaje 178 (25-nov-2026) · Un ejemplo es el turno completo que diría el vendedor.
// En la prueba del 177 (2.1), el ejemplo de «curriculum» quitó «los mejores» pero terminó sin
// pregunta: «Soy Emilio, de Aceites y Lubricantes Dalfán. Ando visitando talleres de la zona y
// quise conocer el suyo.» La vara lo dejó pasar porque trataba todo texto como una pieza. Es lo
// que reclamó Emilio en su disputa del 25-nov: «si respondo así, me va a marcar que no terminé
// en pregunta».
import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { pasarPorLaVara, PROMPT_VARA, type RevisionVara } from "../../../supabase/functions/_shared/vara_ejemplos";
import { bloqueParaEscribir } from "../../../supabase/functions/_shared/guia";

const leer = (p: string) => readFileSync(join(process.cwd(), p), "utf8");
const nodos: any[] = JSON.parse(leer("docs/kb/nodos_snapshot.json"));
const reglas: any[] = JSON.parse(leer("docs/kb/reglas.json"));
const guion = (() => {
  const g = JSON.parse(JSON.stringify(nodos.find((n) => n.id === "2.1").practice_script));
  for (const f of g.failure_criteria) {
    const r = reglas.find((x) => x.id === f.regla_id);
    if (r) { f.regla_resumen = r.resumen; f.contexto_nodo = f.description; }
  }
  return g;
})();

describe("el ejemplo se mide como turno completo; la mejora y la misión, como piezas", () => {
  it("lo dice la vara", () => {
    expect(PROMPT_VARA).toContain("Un EJEMPLO es el turno completo que el vendedor diría, aunque solo corrija una parte");
    expect(PROMPT_VARA).toContain("Una MEJORA o una MISIÓN son piezas, no el turno completo");
    expect(PROMPT_VARA).not.toContain("un texto no lo comete por no traerlo todo");
  });
  it("y lo dice la guía a quien escribe", () => {
    expect(bloqueParaEscribir([{ clave: "x", orden: 0, titulo: "X", texto: "y" }])).toContain("Un ejemplo es el turno completo que diría el vendedor, aunque solo corrija una parte");
  });
  it("el ejemplo de «curriculum» sin pregunta sale corregido, con su pregunta", async () => {
    const sinPregunta = "Soy Emilio, de Aceites y Lubricantes Dalfán. Ando visitando talleres de la zona y quise conocer el suyo.";
    const conPregunta = `${sinPregunta} ¿Cuánto tiempo lleva con el taller?`;
    const ev: any = { observations: [], evidencia_flags: [{ id: "curriculum", cita: "los mejores", error: "x", mejora: "Di el nombre de tu empresa sin adornos.", ejemplo: sinPregunta }], mision: "" };
    const llamar = async (entrada: string) => JSON.parse(entrada).textos.map((t: any): RevisionVara =>
      t.tipo === "ejemplo" && !t.texto.trim().endsWith("?")
        ? { id: t.id, frase: t.texto, respuesta: "El turno termina sin pregunta.", conducta: "reprueba", falla: "sin_gancho", corregido: conPregunta }
        : { id: t.id, frase: "", respuesta: "No comete ninguna.", conducta: "pasa" });
    const juez = async (entrada: string): Promise<any[]> => {
      const e = JSON.parse(entrada); const u = e.conversacion[e.conversacion.length - 1];
      const c = String(u.dijo).trim().endsWith("?") ? "pasa" : "reprueba";
      return [{ id: e.acusaciones[0].id, tipo: "falla", conducta: c, razon: c, citas: [{ turno: u.turno, quien: u.quien, dijo: u.dijo }] }];
    };
    const conversacion = [
      { role: "user", content: "Hola, buenas tardes. Qué bonito tiene su local." },
      { role: "assistant", content: "Gracias. ¿Y usted quién es?" },
      { role: "user", content: "Yo soy Emilio, de Aceites y Lubricantes Dalfán, los mejores. Y quería ofrecerle nuestro producto." },
    ];
    const r = await pasarPorLaVara({ ev, guion, paso: 2, conversacion, llamar, juez, reglas });
    expect(r).toMatchObject({ confirmados: 1, corregidos: 1 });
    expect(ev.evidencia_flags[0].ejemplo).toBe(conPregunta);
    // La mejora es una pieza: no se le exige pregunta.
    expect(ev.evidencia_flags[0].mejora).toBe("Di el nombre de tu empresa sin adornos.");
  });
});
