/**
 * Una pregunta del giro, con el diseño de la bienvenida (mensaje 157). La usan las pantallas «justo a
 * tiempo» antes de un nodo y la página «Tu negocio». Las preguntas y sus reglas son las del manager
 * (onboarding-questions.ts); los textos, los de quien vende él mismo (giro-personal.ts).
 */
import { useState, type ReactNode } from "react";
import { Casilla, estiloTitulo, estiloTexto } from "@/components/closer/bienvenida-ui";
import { campoVisible, detalleDe, libreDe, marcado, type Campo, type CampoOpciones, type Respuestas } from "@/lib/onboarding-questions";
import { TEXTO_PERSONAL, preguntaPorId } from "@/lib/giro-personal";

const comoLista = (v: unknown): string[] => (Array.isArray(v) ? (v as string[]) : typeof v === "string" && v ? [v] : []);
const fuente = "'DM Sans', sans-serif";

/** Lo contestado en una línea, sin las etiquetas de la pregunta: «Productos · Aceites para motor». */
export function resumenDe(id: string, r: Respuestas): string {
  const partes: string[] = [];
  for (const c of preguntaPorId(id).campos) {
    if (!campoVisible(c, r)) continue;
    const v = c.tipo === "texto" ? (typeof r[c.id] === "string" ? (r[c.id] as string).trim() : "") : marcado(c, r).join(", ");
    if (v) partes.push(v);
  }
  const libre = r[libreDe(id)];
  if (typeof libre === "string" && libre.trim()) partes.push(libre.trim());
  return partes.join(" · ");
}

export function PreguntaGiro({
  id,
  r,
  setR,
  propuestas,
  conTitulo = true,
  compacta = false,
}: {
  id: string;
  r: Respuestas;
  setR: (f: (x: Respuestas) => Respuestas) => void;
  /** Para las que propone Closer (objeciones, reglas): undefined = no aplica; null = preparándolas. */
  propuestas?: string[] | null;
  conTitulo?: boolean;
  /** Dentro de una tarjeta («Tu negocio»): el título más chico. */
  compacta?: boolean;
}) {
  const p = preguntaPorId(id);
  const t = TEXTO_PERSONAL[id];
  const pon = (k: string, v: string | string[]) => setR((x) => ({ ...x, [k]: v }));
  const libreId = libreDe(id);
  const [verLibre, setVerLibre] = useState(typeof r[libreId] === "string" && (r[libreId] as string).length > 0);

  return (
    <div>
      {conTitulo && (
        <>
          <h1 style={{ ...estiloTitulo, fontSize: compacta ? 21 : "clamp(24px, 3.4dvh, 28px)" }}>{t.titulo}</h1>
          {t.sub && <p style={{ ...estiloTexto, fontSize: 16, color: "var(--c-text-2)", marginTop: 10 }}>{t.sub}</p>}
        </>
      )}
      {propuestas === null ? (
        <p aria-live="polite" style={{ ...estiloTexto, fontSize: 15, color: "var(--c-text-2)", marginTop: 24 }}>Closer está preparando las de tu giro…</p>
      ) : (
        <div style={{ marginTop: conTitulo ? 24 : 0, display: "flex", flexDirection: "column", gap: 20 }}>
          {p.campos.map((c) =>
            campoVisible(c, r) ? <CampoGiro key={c.id} campo={c} r={r} pon={pon} opciones={c.tipo === "opciones" && propuestas ? unir(propuestas, comoLista(r[c.id])) : undefined} /> : null,
          )}
        </div>
      )}
      <div style={{ marginTop: 18 }}>
        {verLibre ? (
          <Etiquetado etiqueta={p.propuestaPorCloser ? "Agrega lo que falte, con tus palabras" : "¿Algo más que Closer deba saber?"}>
            <AreaTexto valor={typeof r[libreId] === "string" ? (r[libreId] as string) : ""} onCambiar={(v) => pon(libreId, v)} placeholder="Escríbelo como se lo dirías a un compañero." />
          </Etiquetado>
        ) : (
          <button type="button" onClick={() => setVerLibre(true)} style={{ width: "100%", minHeight: 44, borderRadius: 12, border: "1px dashed var(--c-border-strong)", background: "transparent", color: "var(--c-text-soft)", fontFamily: fuente, fontSize: 14, fontWeight: 600, cursor: "pointer" }}>
            + Agregar algo con tus palabras
          </button>
        )}
      </div>
      <p style={{ margin: "16px 0 0", fontFamily: fuente, fontSize: 14, lineHeight: 1.45, color: "var(--c-text-2)" }}>{t.porQue}</p>
    </div>
  );
}

/** Lo propuesto más lo que ya había marcado (si editas después, no se pierde lo tuyo). */
function unir(a: string[], b: string[]): string[] {
  return Array.from(new Set([...a, ...b]));
}

function CampoGiro({ campo, r, pon, opciones }: { campo: Campo; r: Respuestas; pon: (k: string, v: string | string[]) => void; opciones?: string[] }) {
  if (campo.tipo === "texto") {
    return (
      <Etiquetado etiqueta={campo.etiqueta ? `${campo.etiqueta}${campo.opcional ? " (opcional)" : ""}` : undefined}>
        <AreaTexto valor={typeof r[campo.id] === "string" ? (r[campo.id] as string) : ""} onCambiar={(v) => pon(campo.id, v)} placeholder={campo.placeholder} />
      </Etiquetado>
    );
  }
  return <Opciones campo={campo} opciones={opciones ?? campo.opciones} r={r} pon={pon} />;
}

function Opciones({ campo, opciones, r, pon }: { campo: CampoOpciones; opciones: string[]; r: Respuestas; pon: (k: string, v: string | string[]) => void }) {
  const elegidas = comoLista(r[campo.id]);
  const tocar = (o: string) => {
    if (!campo.multiple) return pon(campo.id, [o]);
    if (elegidas.includes(o)) return pon(campo.id, elegidas.filter((x) => x !== o));
    if (campo.max && elegidas.length >= campo.max) return;
    pon(campo.id, [...elegidas, o]);
  };
  // En fila solo si son pocas, cortas y sin dato extra (el «¿a cuántos días?» del crédito va debajo de la opción).
  const cortas = !campo.multiple && !campo.detalle && opciones.length <= 3 && opciones.every((o) => o.length <= 16);
  const etiqueta = campo.etiqueta ? `${campo.etiqueta}${campo.multiple ? " · todas las que apliquen" : ""}` : undefined;
  return (
    <Etiquetado etiqueta={etiqueta}>
      {cortas ? (
        <div role="radiogroup" style={{ display: "grid", gridTemplateColumns: `repeat(${opciones.length}, 1fr)`, gap: 8 }}>
          {opciones.map((o) => {
            const sel = elegidas.includes(o);
            return (
              <button key={o} type="button" role="radio" aria-checked={sel} onClick={() => tocar(o)} style={{ minHeight: 48, padding: "0 8px", borderRadius: 14, cursor: "pointer", fontFamily: fuente, fontSize: 15, fontWeight: 600, color: sel ? "var(--c-primary)" : "var(--c-text)", background: sel ? "rgb(var(--c-primary-rgb) / 0.07)" : "var(--c-surface)", border: `1.5px solid ${sel ? "var(--c-primary)" : "var(--c-border)"}`, WebkitTapHighlightColor: "transparent" }}>
                {o}
              </button>
            );
          })}
        </div>
      ) : (
        <div role={campo.multiple ? "group" : "radiogroup"} style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {opciones.map((o) => (
            <div key={o}>
              <Casilla marcada={elegidas.includes(o)} onCambiar={() => tocar(o)} redonda={!campo.multiple}>
                <span style={{ fontSize: 16, color: "var(--c-text)" }}>{o}</span>
              </Casilla>
              {elegidas.includes(o) && campo.detalle?.[o] && (
                <input
                  aria-label={`${o}: ${campo.detalle[o]}`}
                  value={typeof r[detalleDe(campo.id, o)] === "string" ? (r[detalleDe(campo.id, o)] as string) : ""}
                  onChange={(e) => pon(detalleDe(campo.id, o), e.target.value)}
                  placeholder={campo.detalle[o]}
                  style={{ ...estiloCampo, height: 48, marginTop: 6, marginLeft: 34, width: "calc(100% - 34px)" }}
                />
              )}
            </div>
          ))}
        </div>
      )}
    </Etiquetado>
  );
}

const estiloCampo: React.CSSProperties = {
  width: "100%",
  boxSizing: "border-box",
  padding: "12px 16px",
  borderRadius: "var(--r-campo)",
  border: "1.5px solid var(--c-border)",
  background: "var(--c-surface)",
  color: "var(--c-text)",
  fontFamily: fuente,
  fontSize: 16, // iOS: con menos de 16 px el iPhone hace zoom
  lineHeight: 1.45,
  outline: "none",
};

function AreaTexto({ valor, onCambiar, placeholder }: { valor: string; onCambiar: (v: string) => void; placeholder?: string }) {
  return (
    <textarea
      value={valor}
      onChange={(e) => onCambiar(e.target.value)}
      placeholder={placeholder}
      rows={3}
      maxLength={800}
      style={{ ...estiloCampo, resize: "none" }}
      onFocus={(e) => (e.currentTarget.style.borderColor = "var(--c-primary)")}
      onBlur={(e) => (e.currentTarget.style.borderColor = "var(--c-border)")}
    />
  );
}

function Etiquetado({ etiqueta, children }: { etiqueta?: string; children: ReactNode }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      {etiqueta && <span style={{ fontFamily: fuente, fontSize: 15, fontWeight: 600, color: "var(--c-text)" }}>{etiqueta}</span>}
      {children}
    </div>
  );
}
