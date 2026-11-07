/**
 * Guardar lo que contó quien entrena por su cuenta (mensaje 157).
 *
 * Igual que el onboarding del manager: lo comercial va DIRECTO de sus palabras (cerebroDirecto, nada se
 * inventa) y el modelo solo redacta el cliente típico y el tono (generateCompanyBrain). Si el modelo falla,
 * se guarda lo directo con el cliente típico que ya había: nunca se bloquea por eso. Respuestas y cerebro se
 * guardan juntos (guardar_giro), para poder mostrarlas y editarlas en «Tu negocio».
 */
import { cerebroDirecto, respuestasEnTexto, CLAVES_CEREBRO, type Respuestas } from "@/lib/onboarding-questions";
import { respuestasParaGuardar } from "@/lib/giro-personal";
import { generateCompanyBrain, proponerDelCampo } from "@/utils/onboarding.functions";
import { restMutate } from "@/lib/supabase-rest";
import { NEGATIVOS_DE_RESPALDO, RESTRICCIONES_DE_RESPALDO } from "@/lib/onboarding-questions";

export async function guardarGiro(opts: {
  respuestas: Respuestas;
  /** Las preguntas que se acaban de contestar (quedan como vistas). */
  vistasAhora: string[];
  cerebroAnterior: unknown;
  companyId: string | null;
}): Promise<Respuestas> {
  const r = respuestasParaGuardar(opts.respuestas, opts.vistasAhora);
  const lineas = respuestasEnTexto(r).filter((l) => l.respuesta.trim());
  const directo = cerebroDirecto(r);
  let anterior: Record<string, unknown> = {};
  try {
    anterior = typeof opts.cerebroAnterior === "string" ? JSON.parse(opts.cerebroAnterior) : ((opts.cerebroAnterior as any) ?? {});
  } catch { /* noop */ }

  let brain: Record<string, string> = {};
  for (const k of CLAVES_CEREBRO) {
    const d = typeof directo[k] === "string" ? directo[k] : "";
    // Lo que no sale de estas respuestas (p. ej. un cerebro de antes del 157) se conserva.
    brain[k] = d || (typeof anterior[k] === "string" ? (anterior[k] as string) : "");
  }
  try {
    const res = await generateCompanyBrain({
      data: { respuestas: lineas.map(({ pregunta, respuesta }) => ({ pregunta, respuesta })), directo, companyName: "su empresa", companyId: opts.companyId },
    });
    brain = { ...brain, CLIENTE_TIPICO: res.brain.CLIENTE_TIPICO || brain.CLIENTE_TIPICO, TONO_DETECTADO: res.brain.TONO_DETECTADO || brain.TONO_DETECTADO };
  } catch (e) {
    console.error("[giro] el modelo no respondió; se guarda lo directo:", e);
  }
  brain.TONO_DETECTADO = brain.TONO_DETECTADO || "Profesional";

  await restMutate("rpc/guardar_giro", { method: "POST", body: { _respuestas: r, _brain: brain } });
  // El historial de respuestas es secundario: si falla, lo guardado arriba ya vale.
  await Promise.all(
    lineas.map((l) =>
      restMutate("rpc/save_onboarding_answer", {
        method: "POST",
        body: { _block_number: l.bloque, _question_id: l.id, _question_text: l.pregunta, _answer: l.respuesta },
      }).catch((e) => console.error("[giro] historial sin guardar:", e)),
    ),
  );
  return r;
}

/** Lo que Closer propone para su giro (objeciones y reglas). Si falla, una lista de respaldo. */
export async function proponerParaGiro(respuestas: Respuestas, companyId: string | null): Promise<{ negativos: string[]; restricciones: string[] }> {
  try {
    const lineas = respuestasEnTexto(respuestas).filter((l) => l.respuesta.trim());
    const res = await proponerDelCampo({ data: { respuestas: lineas.map(({ pregunta, respuesta }) => ({ pregunta, respuesta })), companyName: "su empresa", companyId } });
    return {
      negativos: res.negativos.length ? res.negativos : NEGATIVOS_DE_RESPALDO,
      restricciones: res.restricciones.length ? res.restricciones : RESTRICCIONES_DE_RESPALDO,
    };
  } catch (e) {
    console.error("[giro] propuesta (respaldo):", e);
    return { negativos: NEGATIVOS_DE_RESPALDO, restricciones: RESTRICCIONES_DE_RESPALDO };
  }
}
