import { useEffect, useState } from "react";
import { estiloBoton } from "@/components/closer/piezas";
import { EncabezadoPreguntas, FilaIcono, estiloTitulo, estiloTexto, estiloEtiqueta } from "@/components/closer/bienvenida-ui";
import { PreguntaGiro } from "@/components/closer/preguntas-giro";
import { completa, PROPUESTAS, type Puerta } from "@/lib/giro-personal";
import { guardarGiro, proponerParaGiro } from "@/lib/giro-guardar";
import { preguntaPorId } from "@/lib/giro-personal";
import type { Respuestas } from "@/lib/onboarding-questions";

/**
 * «Justo a tiempo» (mensajes 156 y 157, decisión de Emilio).
 *
 * Quien entrena por su cuenta no tiene un manager que cuente cómo es su negocio. Cada dato se le pide antes
 * del primer nodo que lo necesita (las «puertas» de giro-personal.ts), con su porqué, y una sola vez. Son
 * obligatorias: sin ellas la práctica no se parece a su trabajo, que es justo lo que promete Closer.
 * Todo lo puede ver y editar después en «Tu negocio».
 */

/** ¿Ya hay un giro guardado? Basta con saber qué vende. (Se queda por compatibilidad con el 156.) */
export function tieneGiro(cerebro: unknown): boolean {
  let c: any = cerebro;
  if (typeof c === "string") {
    try { c = JSON.parse(c); } catch { return false; }
  }
  return typeof c?.PRODUCTOS_ACTIVOS === "string" && c.PRODUCTOS_ACTIVOS.trim().length > 0;
}

export function GiroPersonal({
  puerta,
  respuestas,
  cerebro,
  companyId,
  onListo,
  onSalir,
}: {
  puerta: Puerta;
  respuestas: Respuestas;
  cerebro: unknown;
  companyId: string | null;
  onListo: () => void;
  onSalir: () => void;
}) {
  const total = puerta.preguntas.length;
  const [paso, setPaso] = useState(0); // 0: por qué · 1..total: preguntas · total+1: preparando
  const [r, setR] = useState<Respuestas>(respuestas);
  const [error, setError] = useState<string | null>(null);
  const [propuestas, setPropuestas] = useState<{ negativos: string[]; restricciones: string[] } | null>(null);

  const id = paso >= 1 && paso <= total ? puerta.preguntas[paso - 1] : null;
  const propia = id ? preguntaPorId(id).propuestaPorCloser : undefined;

  // Las objeciones y las reglas las propone Closer para su giro (con lo que ya contó); él palomea.
  useEffect(() => {
    if (!propia || propuestas) return;
    const guardadas = { negativos: r[PROPUESTAS.negativos], restricciones: r[PROPUESTAS.restricciones] };
    if (Array.isArray(guardadas.negativos) && Array.isArray(guardadas.restricciones)) {
      setPropuestas({ negativos: guardadas.negativos as string[], restricciones: guardadas.restricciones as string[] });
      return;
    }
    let vivo = true;
    void proponerParaGiro(r, companyId).then((p) => {
      if (!vivo) return;
      setPropuestas(p);
      setR((x) => ({ ...x, [PROPUESTAS.negativos]: p.negativos, [PROPUESTAS.restricciones]: p.restricciones }));
    });
    return () => {
      vivo = false;
    };
  }, [propia]); // eslint-disable-line react-hooks/exhaustive-deps

  const guardar = async () => {
    setPaso(total + 1);
    setError(null);
    try {
      await guardarGiro({ respuestas: r, vistasAhora: puerta.preguntas, cerebroAnterior: cerebro, companyId });
      onListo();
    } catch (e) {
      console.error("[giro] no se guardó:", e);
      setError("No pudimos guardar tus respuestas. Revisa tu conexión e intenta otra vez.");
      setPaso(total);
    }
  };

  const listo = id ? completa(id, r) && !(propia && !propuestas) : false;
  const opciones = propia === "negativos" ? propuestas?.negativos ?? null : propia === "restricciones" ? propuestas?.restricciones ?? null : undefined;

  return (
    // Mensaje 160: vive dentro de la práctica, que ocupa la pantalla fija y no se desliza. Esta pantalla es su
    // propio espacio con scroll (antes no se podía bajar a las opciones de abajo en un teléfono).
    <div style={{ flex: 1, minHeight: 0, height: "100dvh", overflowY: "auto", WebkitOverflowScrolling: "touch", overscrollBehavior: "contain", background: "var(--c-bg)", color: "var(--c-text)" }}>
      <div style={{ minHeight: "100%", boxSizing: "border-box", width: "100%", maxWidth: 560, margin: "0 auto", padding: "max(20px, env(safe-area-inset-top)) var(--m-pantalla) 0", display: "flex", flexDirection: "column" }}>
        {paso === 0 && (
          <>
            <div style={{ height: 44, display: "flex", alignItems: "center" }}>
              <button type="button" onClick={onSalir} style={{ height: 44, padding: 0, border: "none", background: "transparent", color: "var(--c-text-2)", fontFamily: "'DM Sans', sans-serif", fontSize: 15, fontWeight: 600, cursor: "pointer" }}>
                Regresar al mapa
              </button>
            </div>
            <div style={{ ...estiloEtiqueta, marginTop: 20 }}>{puerta.id === "cliente" ? "Antes de tu primera práctica" : "Antes de esta práctica"}</div>
            <h1 style={{ ...estiloTitulo, fontSize: "clamp(26px, 3.8dvh, 30px)", marginTop: 8 }}>{puerta.titulo}</h1>
            <p style={{ ...estiloTexto, marginTop: 14 }}>{puerta.texto}</p>
            {puerta.id === "cliente" && (
              <div style={{ marginTop: 28, display: "flex", flexDirection: "column", gap: 20 }}>
                <FilaIcono icono="puerta" titulo="Su negocio" texto="Como el de tus clientes." />
                <FilaIcono icono="libro" titulo="Lo que te compra" texto="Solo lo que tú vendes." />
                <FilaIcono icono="microfono" titulo="Cómo te habla" texto="De tú o de usted, como los tuyos." />
              </div>
            )}
            <p style={{ margin: "24px 0 0", fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: "var(--c-text-2)" }}>
              {total === 1 ? "1 pregunta" : `${total} preguntas`} · menos de 1 minuto. Lo puedes cambiar en «Tu negocio».
            </p>
            <Abajo>
              <button type="button" onClick={() => setPaso(1)} style={estiloBoton("principal")}>Empezar</button>
            </Abajo>
          </>
        )}

        {id && (
          <>
            {total > 1 ? (
              <EncabezadoPreguntas paso={paso} total={total} onRegresar={() => setPaso(paso - 1)} />
            ) : (
              <div style={{ height: 44 }}>
                <button type="button" aria-label="Regresar" onClick={() => setPaso(0)} style={{ width: 44, height: 44, marginLeft: -10, border: "none", background: "transparent", color: "var(--c-text-soft)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="M15 5l-7 7 7 7" /></svg>
                </button>
              </div>
            )}
            <div key={id} style={{ marginTop: 32 }}>
              <PreguntaGiro id={id} r={r} setR={setR} propuestas={opciones} />
            </div>
            {error && <p role="alert" style={{ margin: "12px 0 0", fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: "var(--c-danger)" }}>{error}</p>}
            <Abajo>
              <button type="button" disabled={!listo} onClick={() => (paso < total ? setPaso(paso + 1) : void guardar())} style={estiloBoton("principal", !listo)}>
                {paso < total ? "Continuar" : "Listo, a practicar"}
              </button>
            </Abajo>
          </>
        )}

        {paso === total + 1 && (
          <div role="status" aria-live="polite" style={{ margin: "auto", textAlign: "center" }}>
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
