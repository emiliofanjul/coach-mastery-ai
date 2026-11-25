// Mensaje 179 (25-nov-2026) · El mismo ejemplo sin pregunta reprobó en un lugar y pasó en otro.
// En la prueba del 178 (2.1), «Soy Emilio, de Aceites y Lubricantes Dalfán. Ando visitando talleres
// de la zona y quise conocer el suyo.» salió dos veces: como ejemplo de una observación (la vara lo
// reprobó y lo corrigió) y como ejemplo de la falla «curriculum» (pasó). Dos arreglos:
//   · misma frase, misma vara: si un texto reprueba, sus copias exactas también;
//   · un ejemplo que termina sin pregunta (pasos 1 a 5) y pasó se revisa otra vez, con un aviso.
//     El aviso no es un veredicto: si en ese momento lo correcto es despedirse, pasa.
import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { pasarPorLaVara, ejemploSinPregunta, AVISO_SIN_PREGUNTA, PROMPT_VARA, type RevisionVara } from "../../../supabase/functions/_shared/vara_ejemplos";

const leer = (p: string) => readFileSync(join(process.cwd(), p), "utf8");
const nodos: any[] = JSON.parse(leer("docs/kb/nodos_snapshot.json"));
const reglas: any[] = JSON.parse(leer("docs/kb/reglas.json"));
const guionDe = (id: string) => {
  const g = JSON.parse(JSON.stringify(nodos.find((n) => n.id === id).practice_script));
  for (const f of g.failure_criteria) {
    const r = reglas.find((x) => x.id === f.regla_id);
    if (r) { f.regla_resumen = r.resumen; f.contexto_nodo = f.description; }
  }
  return g;
};
const sinPregunta = "Soy Emilio, de Aceites y Lubricantes Dalfán. Ando visitando talleres de la zona y quise conocer el suyo.";
const conPregunta = `${sinPregunta} ¿Cuánto tiempo lleva con él?`;
const conversacion = [
  { role: "user", content: "Hola, buenas tardes. Qué bonito tiene su local." },
  { role: "assistant", content: "Gracias. ¿Y usted quién es?" },
  { role: "user", content: "Yo soy Emilio, de Aceites y Lubricantes Dalfán, los mejores. Y quería ofrecerle nuestro producto." },
];
const juez = async (entrada: string): Promise<any[]> => {
  const e = JSON.parse(entrada); const u = e.conversacion[e.conversacion.length - 1];
  const c = String(u.dijo).trim().endsWith("?") ? "pasa" : "reprueba";
  return [{ id: e.acusaciones[0].id, tipo: "falla", conducta: c, razon: c, citas: [{ turno: u.turno, quien: u.quien, dijo: u.dijo }] }];
};
const reprueba = (id: string): RevisionVara => ({ id, frase: sinPregunta, respuesta: "El turno termina sin pregunta.", conducta: "reprueba", falla: "sin_gancho", corregido: conPregunta });
const pasa = (id: string): RevisionVara => ({ id, frase: "", respuesta: "No comete ninguna.", conducta: "pasa" });

describe("¿el ejemplo termina sin pregunta?", () => {
  it("del paso 2 al 5, el turno termina con ella; en el 1 basta con que traiga una", () => {
    expect(ejemploSinPregunta(sinPregunta, 2)).toBe(true);
    expect(ejemploSinPregunta(conPregunta, 2)).toBe(false);
    expect(ejemploSinPregunta("«¿Se lo dejo el jueves o el viernes?»", 5)).toBe(false);
    expect(ejemploSinPregunta("¡Buenas! ¿Siempre está así de movido? Se ve que no paran.", 1)).toBe(false);
    expect(ejemploSinPregunta("¡Buenas tardes, qué movimiento!", 1)).toBe(true);
  });
  it("en la consolidación y en el mundo 7 no se mira: ahí puede terminar sin pregunta", () => {
    expect(ejemploSinPregunta("Nos vemos el jueves, que le vaya muy bien.", 6)).toBe(false);
    expect(ejemploSinPregunta("Nos vemos el jueves, que le vaya muy bien.", null)).toBe(false);
  });
  it("el aviso no es un veredicto", () => {
    expect(AVISO_SIN_PREGUNTA).toContain("Si en ese momento lo correcto es despedirse o quedar de regresar, pasa.");
    expect(PROMPT_VARA).toContain("el aviso no es un veredicto, la prueba manda");
  });
});

describe("el caso del 2.1 de la prueba del 178", () => {
  it("misma frase, misma vara: la copia que pasó sale con la misma corrección", async () => {
    const ev: any = {
      observations: [{ criterio_id: "story.relevancia_cliente", error: "x", mejora: "Cierra con una pregunta.", ejemplo: sinPregunta }],
      evidencia_flags: [{ id: "curriculum", cita: "los mejores", error: "x", mejora: "Di el nombre de tu empresa sin adornos.", ejemplo: sinPregunta }],
      mision: "",
    };
    // La vara solo reprueba la de la observación, aunque le llegue el aviso a la otra.
    const llamar = async (entrada: string) => JSON.parse(entrada).textos.map((t: any) => (t.id === "obs0.ejemplo" && t.texto === sinPregunta ? reprueba(t.id) : pasa(t.id)));
    const r = await pasarPorLaVara({ ev, guion: guionDe("2.1"), paso: 2, conversacion, llamar, juez, reglas });
    expect(ev.observations[0].ejemplo).toBe(conPregunta);
    expect(ev.evidencia_flags[0].ejemplo).toBe(conPregunta);
    expect(r.corregidos).toBe(2);
  });
  it("con el aviso, el ejemplo sin pregunta se revisa otra vez y sale corregido", async () => {
    const ev: any = { observations: [], evidencia_flags: [{ id: "curriculum", cita: "los mejores", error: "x", mejora: "Di el nombre de tu empresa sin adornos.", ejemplo: sinPregunta }], mision: "" };
    const entradas: any[] = [];
    const llamar = async (entrada: string) => {
      const e = JSON.parse(entrada); entradas.push(e);
      return e.textos.map((t: any) => (t.aviso ? reprueba(t.id) : pasa(t.id)));
    };
    const r = await pasarPorLaVara({ ev, guion: guionDe("2.1"), paso: 2, conversacion, llamar, juez, reglas });
    expect(entradas.some((e) => e.textos[0].aviso === AVISO_SIN_PREGUNTA)).toBe(true);
    expect(ev.evidencia_flags[0].ejemplo).toBe(conPregunta);
    expect(r).toMatchObject({ confirmados: 1, corregidos: 1 });
  });
  it("si con el aviso la vara dice que pasa, se queda: el aviso no reprueba solo", async () => {
    const ev: any = { observations: [], evidencia_flags: [{ id: "curriculum", cita: "los mejores", error: "x", mejora: "Di el nombre sin adornos.", ejemplo: sinPregunta }], mision: "" };
    const llamar = async (entrada: string) => JSON.parse(entrada).textos.map((t: any) => pasa(t.id));
    const r = await pasarPorLaVara({ ev, guion: guionDe("2.1"), paso: 2, conversacion, llamar, juez, reglas });
    expect(ev.evidencia_flags[0].ejemplo).toBe(sinPregunta);
    expect(r).toMatchObject({ sospechosos: 0, corregidos: 0 });
  });
});
