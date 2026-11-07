import { useState } from "react";
import { estiloBoton } from "@/components/closer/piezas";
import { EncabezadoPreguntas, FilaIcono, Casilla, estiloTitulo, estiloTexto, estiloEtiqueta } from "@/components/closer/bienvenida-ui";
import { PREGUNTAS, preguntaCompleta, respuestasEnTexto, cerebroDirecto, CLAVES_CEREBRO, type Respuestas } from "@/lib/onboarding-questions";
import { generateCompanyBrain } from "@/utils/onboarding.functions";
import { restMutate } from "@/lib/supabase-rest";

/**
 * «Tu cliente está por llegar» (mensaje 156, nov-2026, decisión de Emilio).
 *
 * Quien entrena por su cuenta no tiene un manager que cuente cómo es su negocio: practicaba con un
 * cliente genérico. Antes de su PRIMERA práctica con voz (no al registrarse: ahí todavía no le sirve y
 * se iría) se le piden las 3 preguntas del primer bloque del manager, con su porqué. Son obligatorias:
 * sin ellas la práctica no se parece a su trabajo, que es justo lo que promete Closer.
 *
 * Con las respuestas se arma el cerebro de su empresa igual que el del manager: lo comercial va directo
 * (cerebroDirecto, nada se inventa) y el modelo solo redacta el cliente típico y el tono. Si el modelo
 * falla, se guarda lo directo: la práctica nunca se bloquea por eso.
 */

/** Las 3 preguntas del bloque 1, dichas a quien vende él mismo (las del manager hablan de «tus vendedores»). */
export const PREGUNTAS_PERSONAL = [
  {
    base: PREGUNTAS[0], // p1_que_venden
    titulo: "¿Qué vendes?",
    sub: "Tus líneas principales. No hace falta el catálogo completo ni los precios.",
    porQue: "Tu cliente solo va a hablar de lo que tú vendes: Closer nunca inventa un producto que no manejas.",
  },
  {
    base: PREGUNTAS[1], // p2_clientes
    titulo: "¿Qué hacen tus clientes con lo que les vendes?",
    sub: "Marca todo lo que aplique.",
    porQue: "Así tu cliente tiene el negocio, las palabras y los problemas de los tuyos.",
  },
  {
    base: PREGUNTAS[2], // p3_monto
    titulo: "¿Cuánto te compra un cliente al mes?",
    sub: "Marca todos los rangos que tengas en tu cartera.",
    porQue: "Una compra grande se decide distinto que una chica. Vas a practicar con los tamaños que marques.",
  },
] as const;

/** ¿Ya hay un giro guardado? Basta con saber qué vende. */
export function tieneGiro(cerebro: unknown): boolean {
  let c: any = cerebro;
  if (typeof c === "string") {
    try { c = JSON.parse(c); } catch { return false; }
  }
  return typeof c?.PRODUCTOS_ACTIVOS === "string" && c.PRODUCTOS_ACTIVOS.trim().length > 0;
}

export function GiroPersonal({ companyId, onListo, onSalir }: { companyId: string | null; onListo: () => void; onSalir: () => void }) {
  const [paso, setPaso] = useState(0); // 0: por qué · 1-3: preguntas · 4: preparando
  const [r, setR] = useState<Respuestas>({});
  const [error, setError] = useState<string | null>(null);

  const pon = (id: string, v: string | string[]) => setR((x) => ({ ...x, [id]: v }));
  const alterna = (id: string, o: string) => {
    const actual = Array.isArray(r[id]) ? (r[id] as string[]) : [];
    pon(id, actual.includes(o) ? actual.filter((y) => y !== o) : [...actual, o]);
  };

  const guardar = async () => {
    setPaso(4);
    setError(null);
    const lineas = respuestasEnTexto(r).filter((l) => l.respuesta.trim());
    const directo = cerebroDirecto(r);
    let brain: Record<string, string> = {};
    for (const k of CLAVES_CEREBRO) brain[k] = typeof directo[k] === "string" ? directo[k] : "";
    try {
      const res = await generateCompanyBrain({
        data: { respuestas: lineas.map(({ pregunta, respuesta }) => ({ pregunta, respuesta })), directo, companyName: "su empresa", companyId },
      });
      brain = res.brain;
    } catch (e) {
      // Sin el cliente típico redactado, el cliente de práctica igual sale de lo que escribió.
      console.error("[giro] el modelo no respondió; se guarda lo directo:", e);
      brain.TONO_DETECTADO = brain.TONO_DETECTADO || "Profesional";
    }
    try {
      await restMutate("rpc/update_company_brain", { method: "POST", body: { _brain: brain } });
      await Promise.all(
        lineas.map((l) =>
          restMutate("rpc/save_onboarding_answer", {
            method: "POST",
            body: { _block_number: l.bloque, _question_id: l.id, _question_text: l.pregunta, _answer: l.respuesta },
          }).catch((e) => console.error("[giro] respuesta sin guardar (el cerebro sí quedó):", e)),
        ),
      );
      onListo();
    } catch (e) {
      console.error("[giro] no se guardó:", e);
      setError("No pudimos guardar tus respuestas. Revisa tu conexión e intenta otra vez.");
      setPaso(3);
    }
  };

  const q = paso >= 1 && paso <= 3 ? PREGUNTAS_PERSONAL[paso - 1] : null;
  const completa = q ? preguntaCompleta(q.base, r) : false;

  return (
    <div style={{ minHeight: "100dvh", boxSizing: "border-box", display: "flex", flexDirection: "column", padding: "max(20px, env(safe-area-inset-top)) var(--m-pantalla) 0", background: "var(--c-bg)", color: "var(--c-text)" }}>
      <div style={{ width: "100%", maxWidth: 560, margin: "0 auto", flex: 1, display: "flex", flexDirection: "column" }}>
        {paso === 0 && (
          <>
            <div style={{ height: 44, display: "flex", alignItems: "center" }}>
              <button type="button" onClick={onSalir} style={{ height: 44, padding: 0, border: "none", background: "transparent", color: "var(--c-text-2)", fontFamily: "'DM Sans', sans-serif", fontSize: 15, fontWeight: 600, cursor: "pointer" }}>
                Regresar al mapa
              </button>
            </div>
            <div style={{ ...estiloEtiqueta, marginTop: 20 }}>Antes de tu primera práctica</div>
            <h1 style={{ ...estiloTitulo, fontSize: "clamp(26px, 3.8dvh, 30px)", marginTop: 8 }}>Tu cliente está por llegar</h1>
            <p style={{ ...estiloTexto, marginTop: 14 }}>
              Para que se parezca a tus clientes de verdad, cuéntanos qué vendes y a quién. Así cada cliente de práctica tiene un negocio, unos productos y unos problemas como los de los tuyos.
            </p>
            <div style={{ marginTop: 28, display: "flex", flexDirection: "column", gap: 20 }}>
              <FilaIcono icono="puerta" titulo="Su negocio" texto="Del mismo giro que tus clientes." />
              <FilaIcono icono="libro" titulo="Tus productos" texto="Solo habla de lo que tú vendes." />
              <FilaIcono icono="meta" titulo="Su tamaño" texto="Compras chicas o grandes, como las tuyas." />
            </div>
            <p style={{ margin: "24px 0 0", fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: "var(--c-text-2)" }}>Son 3 preguntas. Toma un minuto, y solo se hace una vez.</p>
            <Abajo>
              <button type="button" onClick={() => setPaso(1)} style={estiloBoton("principal")}>Empezar</button>
            </Abajo>
          </>
        )}

        {q && (
          <>
            <EncabezadoPreguntas paso={paso} total={3} onRegresar={() => setPaso(paso - 1)} />
            <h1 style={{ ...estiloTitulo, fontSize: "clamp(24px, 3.4dvh, 28px)", marginTop: 32 }}>{q.titulo}</h1>
            <p style={{ ...estiloTexto, fontSize: 16, color: "var(--c-text-2)", marginTop: 10 }}>{q.sub}</p>
            <div style={{ marginTop: 24, display: "flex", flexDirection: "column", gap: 10 }}>
              {q.base.campos.map((c) =>
                c.tipo === "opciones" ? (
                  c.multiple ? (
                    <div key={c.id} style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                      {c.opciones.map((o) => (
                        <Casilla key={o} marcada={Array.isArray(r[c.id]) && (r[c.id] as string[]).includes(o)} onCambiar={() => alterna(c.id, o)}>
                          <span style={{ fontSize: 16, color: "var(--c-text)" }}>{o}</span>
                        </Casilla>
                      ))}
                    </div>
                  ) : (
                    <div key={c.id} role="radiogroup" style={{ display: "grid", gridTemplateColumns: `repeat(${c.opciones.length}, 1fr)`, gap: 8 }}>
                      {c.opciones.map((o) => {
                        const elegida = r[c.id] === o;
                        return (
                          <button
                            key={o}
                            type="button"
                            role="radio"
                            aria-checked={elegida}
                            onClick={() => pon(c.id, o)}
                            style={{ height: 48, borderRadius: 14, cursor: "pointer", fontFamily: "'DM Sans', sans-serif", fontSize: 15, fontWeight: 600, color: elegida ? "var(--c-primary)" : "var(--c-text)", background: elegida ? "rgb(var(--c-primary-rgb) / 0.07)" : "var(--c-surface)", border: `1.5px solid ${elegida ? "var(--c-primary)" : "var(--c-border)"}`, WebkitTapHighlightColor: "transparent" }}
                          >
                            {o}
                          </button>
                        );
                      })}
                    </div>
                  )
                ) : (
                  <label key={c.id} style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 8 }}>
                    {c.etiqueta && <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 15, fontWeight: 600 }}>{c.etiqueta}</span>}
                    <textarea
                      value={typeof r[c.id] === "string" ? (r[c.id] as string) : ""}
                      onChange={(e) => pon(c.id, e.target.value)}
                      placeholder={c.placeholder}
                      rows={3}
                      style={{ width: "100%", boxSizing: "border-box", padding: "14px 16px", borderRadius: "var(--r-campo)", border: "1.5px solid var(--c-border)", background: "var(--c-surface)", color: "var(--c-text)", fontFamily: "'DM Sans', sans-serif", fontSize: 16, lineHeight: 1.45, resize: "none", outline: "none" }}
                      onFocus={(e) => (e.currentTarget.style.borderColor = "var(--c-primary)")}
                      onBlur={(e) => (e.currentTarget.style.borderColor = "var(--c-border)")}
                    />
                  </label>
                ),
              )}
            </div>
            <p style={{ margin: "18px 0 0", fontFamily: "'DM Sans', sans-serif", fontSize: 14, lineHeight: 1.45, color: "var(--c-text-2)" }}>{q.porQue}</p>
            {error && <p role="alert" style={{ margin: "12px 0 0", fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: "var(--c-danger)" }}>{error}</p>}
            <Abajo>
              <button
                type="button"
                disabled={!completa}
                onClick={() => (paso < 3 ? setPaso(paso + 1) : void guardar())}
                style={estiloBoton("principal", !completa)}
              >
                {paso < 3 ? "Continuar" : "Listo, a practicar"}
              </button>
            </Abajo>
          </>
        )}

        {paso === 4 && (
          <div role="status" aria-live="polite" style={{ margin: "auto", textAlign: "center", fontFamily: "'DM Sans', sans-serif" }}>
            <div style={{ ...estiloTitulo, fontSize: 24 }}>Preparando a tu cliente…</div>
            <p style={{ ...estiloTexto, marginTop: 10, color: "var(--c-text-2)" }}>Con lo que nos contaste.</p>
          </div>
        )}
      </div>
    </div>
  );
}

/** El botón abajo, pegado y siempre visible (como en la bienvenida). */
function Abajo({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ position: "sticky", bottom: 0, zIndex: 2, marginTop: "auto", paddingTop: 20, paddingBottom: "calc(24px + env(safe-area-inset-bottom))", background: "linear-gradient(to top, var(--c-bg) 72%, rgb(var(--c-bg-rgb) / 0))" }}>
      {children}
    </div>
  );
}
