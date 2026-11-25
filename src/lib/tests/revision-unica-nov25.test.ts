// Mensaje 177 (25-nov-2026) · Escribir con el molde, y la revisión única frase por frase.
// El caso (2.1, Emilio): los cinco ejemplos de la calificación terminaban la historia breve
// con «¿usted cómo le hace con los aceites?» —pitch prematuro, la falla grave del nodo— y la
// vara, que revisaba los 13 textos de un jalón, dejó pasar cinco. En la disputa, para
// corregirlo, Closer propuso una frase sin pregunta al final. Emilio aprobó: la guía del
// vendedor para todo el que escribe frases, y una sola revisión, frase por frase, con las
// pruebas de las reglas del paso.
import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { pasarPorLaVara, reglasParaLaVara, armarEntradaVara, fallasConPrueba, revisarRespuestaDeDisputa, quitarPropuesta, PROMPT_VARA, type RevisionVara } from "../../../supabase/functions/_shared/vara_ejemplos";
import { moldeDelPaso, bloqueParaEscribir, textoDeGuia } from "../../../supabase/functions/_shared/guia";

const leer = (p: string) => readFileSync(join(process.cwd(), p), "utf8");
const nodos: any[] = JSON.parse(leer("docs/kb/nodos_snapshot.json"));
const reglas: any[] = JSON.parse(leer("docs/kb/reglas.json"));
const guionDe = (id: string) => {
  const g = JSON.parse(JSON.stringify(nodos.find((n) => n.id === id).practice_script));
  // Como llega en vivo (v_nodes_resueltos): cada falla con su regla.
  for (const f of g.failure_criteria) {
    const r = reglas.find((x) => x.id === f.regla_id);
    if (r) { f.regla_resumen = r.resumen; f.contexto_nodo = f.description; }
  }
  return g;
};
// La guía, leída del mismo SQL que se aplicó en el 176.
const datos = leer("docs/kb/doctrina_176_datos.sql");
const guia = [...datos.matchAll(/^ {2}\(\$t\$([a-z_0-9]+)\$t\$, (\d+), \$t\$([\s\S]*?)\$t\$, \$t\$([\s\S]*?)\$t\$\)/gm)]
  .map((m) => ({ clave: m[1], orden: Number(m[2]), titulo: m[3], texto: m[4] }));

describe("la guía, para quien escribe", () => {
  it("son las 11 partes aprobadas", () => {
    expect(guia).toHaveLength(11);
    expect(textoDeGuia(guia)).toContain("## Paso 2 · Historia breve");
  });
  it("el molde del paso: «En cualquier paso» y su paso; en el mundo 7, los seis", () => {
    const m2 = moldeDelPaso(guia, 2);
    expect(m2).toContain("## En cualquier paso");
    expect(m2).toContain("Termina: con una pregunta sobre él o sobre cómo le va.");
    expect(m2).not.toContain("## Paso 3");
    const m7 = moldeDelPaso(guia, null);
    for (let p = 1; p <= 6; p++) expect(m7).toContain(`## Paso ${p} ·`);
  });
  it("escribir con la guía no cambia cómo se califica", () => {
    const b = bloqueParaEscribir(guia);
    expect(b).toContain("Esto es para ESCRIBIR, no para calificar: no cambia ningún veredicto, ninguna falla ni la nota.");
    expect(b).toContain("Una frase que corrige una falla no puede cometer otra.");
    expect(bloqueParaEscribir([])).toBe("");
  });
});

describe("la vara mide también con los errores del paso", () => {
  it("en el 2.1: los errores del paso 2 y de toda la conversación, sin repetir las fallas del nodo", () => {
    const g = guionDe("2.1");
    const rs = reglasParaLaVara(reglas, 2, g);
    const ids = rs.map((r) => r.id);
    const delNodo = new Set(g.failure_criteria.map((f: any) => f.regla_id));
    expect(ids.length).toBeGreaterThan(10);
    for (const r of rs) {
      const base = reglas.find((x) => x.id === r.id);
      expect(base.tipo, r.id).toBe("error");
      expect([0, 2], r.id).toContain(Number(base.paso));
      expect(r.regla, r.id).toContain("LA PRUEBA");
      expect(delNodo.has(r.id), r.id).toBe(false);
    }
    expect(ids).not.toContain("opening.pitch_prematuro");
  });
  it("en el mundo 7 (toda la línea), solo los de toda la conversación", () => {
    for (const r of reglasParaLaVara(reglas, null, guionDe("7.4"))) expect(Number(reglas.find((x) => x.id === r.id).paso)).toBe(0);
  });
  it("la entrada lleva las reglas del paso y el molde para corregir", () => {
    const e = JSON.parse(armarEntradaVara({ paso: 2, fallas: fallasConPrueba(guionDe("2.1")), reglas: reglasParaLaVara(reglas, 2, guionDe("2.1")), molde: moldeDelPaso(guia, 2), textos: [{ id: "x", tipo: "ejemplo", texto: "t" }] }));
    expect(e.reglas_del_paso.length).toBeGreaterThan(10);
    expect(e.molde_del_paso).toContain("## Paso 2 · Historia breve");
    expect(PROMPT_VARA).toContain("siga el molde del paso que recibes");
    expect(PROMPT_VARA).toContain("Citar lo que el vendedor dijo en la práctica");
  });
});

describe("el caso del 2.1, de punta a punta", () => {
  const conversacion = [
    { role: "user", content: "Hola, buenas tardes. ¿Cómo está? Oiga, eh, qué bonito tiene su local. ¿Cuánto tiempo lleva con él? ¿Usted es el dueño?" },
    { role: "assistant", content: "Pues mire, ya van como seis años. Si soy yo, aqui atiendo con mi hermano. Oiga y usted quien es, disculpe?" },
    { role: "user", content: "Muy bien. Me da mucho gusto. Eeeh, yo soy Emilio, de Aceites y Lubricantes Dalfán, los mejores. Y quería ofrecerle nuestro producto para ver cómo lo podemos ayudar." },
    { role: "assistant", content: "Ah mire, ahorita ando un poco ocupado la verdad. Tengo que atender el mostrador." },
  ];
  const malo = "Soy Emilio, de Aceites y Lubricantes Dalfán. Ando visitando talleres de la zona para conocer cómo trabajan. ¿Usted cómo le hace con los aceites?";
  const bueno = "Soy Emilio, de Aceites y Lubricantes Dalfán. Ando visitando talleres de la zona para conocer cómo trabajan. ¿Cuánto tiempo lleva con el taller?";
  const ev = () => ({
    observations: [
      { criterio_id: "story.brevedad", error: "x", mejora: "Quita todo lo que suene a venta.", ejemplo: malo },
      { criterio_id: "story.relevancia_cliente", error: "x", mejora: "Cierra con una pregunta.", ejemplo: malo },
    ],
    evidencia_flags: [{ id: "pitch_prematuro", cita: "Y quería ofrecerle", error: "x", mejora: "Guarda la oferta.", ejemplo: malo }],
    mision: "Practica tu historia breve en voz alta.",
  });
  // Una vara de mentira que aplica la prueba: una pregunta por los aceites en la historia breve reprueba.
  const entradas: any[] = [];
  const llamar = async (entrada: string) => {
    const e = JSON.parse(entrada);
    entradas.push(e);
    return e.textos.map((t: any): RevisionVara => /con los aceites/.test(t.texto)
      ? { id: t.id, frase: t.texto, respuesta: "Le pide su operación en el mismo turno de la historia breve.", conducta: "reprueba", falla: "pitch_prematuro", corregido: bueno }
      : { id: t.id, frase: "", respuesta: "No comete ninguna.", conducta: "pasa" });
  };
  const juez = async (entrada: string): Promise<any[]> => {
    const e = JSON.parse(entrada);
    const a = e.acusaciones[0];
    const ultimo = e.conversacion[e.conversacion.length - 1];
    const c = /con los aceites/.test(a.frase_que_cito_el_evaluador) ? "reprueba" : "pasa";
    return [{ id: a.id, tipo: "falla", conducta: c, razon: c, citas: [{ turno: ultimo.turno, quien: ultimo.quien, dijo: ultimo.dijo }] }];
  };

  it("cada ejemplo se revisa por separado, con las reglas del paso y el molde, y ninguno sale enseñando la falla", async () => {
    entradas.length = 0;
    const e: any = ev();
    const r = await pasarPorLaVara({ ev: e, guion: guionDe("2.1"), paso: 2, conversacion, llamar, juez, reglas, molde: moldeDelPaso(guia, 2) });
    expect(r.confirmados).toBe(3);
    expect(r.corregidos).toBe(3);
    for (const o of [...e.observations, ...e.evidencia_flags]) expect(o.ejemplo).toBe(bueno);
    const primerFiltro = entradas.filter((x) => x.textos[0].texto !== bueno);
    for (const x of primerFiltro) {
      expect(x.textos).toHaveLength(1);
      expect(x.reglas_del_paso.length).toBeGreaterThan(10);
      expect(x.molde_del_paso).toContain("Paso 2 · Historia breve");
    }
  });

  it("la disputa: una frase propuesta que no pasa sale corregida", async () => {
    const msg = `Tienes razón en eso. En el paso 2 solo di quién eres. Ejemplo: «${malo}» Registro tu punto.`;
    const r = await revisarRespuestaDeDisputa({ mensaje: msg, guion: guionDe("2.1"), paso: 2, conversacion, reglas, molde: moldeDelPaso(guia, 2), llamar, juez });
    expect(r.quedo).toBe("corregido");
    expect(r.mensaje).toBe(bueno);
  });

  it("si no se puede corregir, se quita la propuesta y lo demás se queda (con la cita de lo que dijo el vendedor)", async () => {
    const sinPregunta = "Soy Emilio, de Dalfán. Ando visitando talleres de la zona.";
    const msg = `Tienes razón: te confundí. En el turno 3 dijiste «quería ofrecerle nuestro producto». En el paso 2 solo di quién eres. Ejemplo: «${sinPregunta}» Y ya. Registro tu punto — estos casos se revisan para mejorar el entrenamiento.`;
    const llamarSinCorregir = async (entrada: string) => JSON.parse(entrada).textos.map((t: any): RevisionVara => ({ id: t.id, frase: sinPregunta, respuesta: "Termina sin pregunta.", conducta: "reprueba", falla: "sin_gancho" }));
    const juezReprueba = async (entrada: string): Promise<any[]> => {
      const e = JSON.parse(entrada); const u = e.conversacion[e.conversacion.length - 1];
      return [{ id: e.acusaciones[0].id, tipo: "falla", conducta: "reprueba", razon: "sin pregunta", citas: [{ turno: u.turno, quien: u.quien, dijo: u.dijo }] }];
    };
    const r = await revisarRespuestaDeDisputa({ mensaje: msg, guion: guionDe("2.1"), paso: 2, conversacion, reglas, molde: moldeDelPaso(guia, 2), llamar: llamarSinCorregir, juez: juezReprueba });
    expect(r.quedo).toBe("propuesta_quitada");
    expect(r.mensaje).not.toContain("Ando visitando talleres de la zona.");
    expect(r.mensaje).toContain("En el turno 3 dijiste «quería ofrecerle nuestro producto».");
    expect(r.mensaje).toContain("Registro tu punto");
  });

  it("si la vara no corre, la respuesta de la disputa sale como está", async () => {
    const r = await revisarRespuestaDeDisputa({ mensaje: "Hola.", guion: guionDe("2.1"), paso: 2, conversacion, reglas, llamar: async () => null, juez });
    expect(r).toMatchObject({ mensaje: "Hola.", quedo: "sin_vara" });
  });

  it("quitarPropuesta no toca el mensaje si no encuentra la frase", () => {
    expect(quitarPropuesta("Nada que ver aquí.", "Soy Emilio, de Dalfán.")).toBe("Nada que ver aquí.");
  });
});

describe("closer-voice: todo el que escribe usa la guía, y todo pasa por la misma puerta", () => {
  const cv = leer("supabase/functions/closer-voice/index.ts");
  it("la guía activa se lee en la calificación y en las disputas", () => {
    expect(cv).toContain('.from("guia_del_vendedor").select("clave, orden, titulo, texto").eq("activa", true).order("orden")');
    expect(cv).toContain('if (phase === "evaluate" || phase === "replica") {');
  });
  it("el evaluador y la disputa escriben con la guía", () => {
    expect(cv).toContain("[cached(EVALUATE_STATIC_PROMPT), cached(guiaParaEscribir), plain(variable)]");
    expect(cv).toContain("fichaDePeticion((body as any).ficha_cliente), bloqueParaEscribir(guiaPartes))");
    expect(cv).toContain("Array.isArray(conversation_history) ? conversation_history : [], bloqueParaEscribir(guiaPartes)))]");
  });
  it("la vara de la calificación mide con las reglas del paso y corrige con el molde", () => {
    expect(cv).toContain("reglas: reglasBase,\n          molde: moldeDelPaso(guiaPartes, pasoNodo ?? pasoPorMundo(node_id)),");
  });
  it("la respuesta de la disputa pasa por la vara antes del recordatorio de la falla grave", () => {
    const i = cv.indexOf("const r = await revisarRespuestaDeDisputa({");
    expect(i).toBeGreaterThan(0);
    expect(i).toBeLessThan(cv.indexOf("const recordatorio = recordatorioFallaCritica({"));
  });
  it("lo igual para todos los textos va cacheado; el texto, aparte", () => {
    expect(cv).toContain('{ type: "text", text: JSON.stringify(fijo), cache_control: { type: "ephemeral" } },');
  });
});
