import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AppHeader } from "@/components/app/AppShell";
import { estiloBoton } from "@/components/closer/piezas";
import { estiloTexto, estiloEtiqueta } from "@/components/closer/bienvenida-ui";
import { PreguntaGiro, resumenDe } from "@/components/closer/preguntas-giro";
import { getStoredSupabaseSession } from "@/lib/browser-auth-session";
import { restGet, restGetMaybeSingle } from "@/lib/supabase-rest";
import { PUERTAS, TEXTO_PERSONAL, PROPUESTAS, completa, contestada, type Puerta } from "@/lib/giro-personal";
import { guardarGiro, proponerParaGiro } from "@/lib/giro-guardar";
import { preguntaPorId } from "@/lib/giro-personal";
import type { Respuestas } from "@/lib/onboarding-questions";

/**
 * «Tu negocio» (mensaje 157, Emilio): quien entrena por su cuenta ve todo lo que le ha contado a Closer y lo
 * edita. Es importante que sepa que ÉL le da forma a su cliente de práctica: entre más cuenta, más se parece
 * al suyo. Lo que Closer todavía no le pide aparece con el nodo antes del cual se lo va a pedir, y lo puede
 * contestar desde ya. Al guardar, su cliente cambia desde la siguiente práctica.
 */
export const Route = createFileRoute("/tu-negocio")({
  head: () => ({
    meta: [
      { title: "Tu negocio — Closer" },
      { name: "description", content: "Lo que le has contado a Closer de tu negocio, para que tu cliente de práctica se parezca al tuyo." },
      { property: "og:title", content: "Tu negocio — Closer" },
      { property: "og:description", content: "Lo que le has contado a Closer de tu negocio, para que tu cliente de práctica se parezca al tuyo." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: TuNegocio,
});

type Empresa = { id: string; is_personal: boolean | null; respuestas_giro: Respuestas | null; company_sales_brain: unknown };

function TuNegocio() {
  const navigate = useNavigate();
  const [empresa, setEmpresa] = useState<Empresa | null>(null);
  const [nombres, setNombres] = useState<Record<string, string>>({});
  const [editando, setEditando] = useState<string | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);

  const cargar = async () => {
    const s = getStoredSupabaseSession();
    if (!s) return navigate({ to: "/login", replace: true });
    const perfil = await restGetMaybeSingle<{ company_id: string | null }>(`profiles?select=company_id&id=eq.${encodeURIComponent(s.userId)}&limit=1`);
    if (!perfil?.company_id) return navigate({ to: "/mapa", replace: true });
    const [e, ns] = await Promise.all([
      restGetMaybeSingle<Empresa>(`companies?select=id,is_personal,respuestas_giro,company_sales_brain&id=eq.${perfil.company_id}&limit=1`),
      restGet<{ id: string; nombre_corto: string | null; name: string }>(`nodes?select=id,nombre_corto,name&id=in.(${PUERTAS.map((p) => `"${p.antesDe}"`).join(",")})`),
    ]);
    // Los equipos le cuentan su negocio a Closer en «Mi Empresa», con su manager.
    if (!e?.is_personal) return navigate({ to: "/mapa", replace: true });
    setEmpresa(e);
    setNombres(Object.fromEntries(ns.map((n) => [n.id, n.nombre_corto || n.name])));
  };
  useEffect(() => {
    void cargar().catch((err) => console.error("[tu-negocio] no cargó:", err));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  if (!empresa) return <main style={{ minHeight: "100dvh", background: "var(--c-bg)" }} />;
  const r = empresa.respuestas_giro ?? {};

  return (
    <main style={{ minHeight: "100dvh", background: "var(--c-bg)", color: "var(--c-text)" }}>
      <AppHeader title="Tu negocio" />
      <div style={{ maxWidth: 560, margin: "0 auto", padding: "4px var(--m-pantalla) calc(40px + env(safe-area-inset-bottom))" }}>
        <p style={{ ...estiloTexto, marginTop: 4 }}>
          Entre más le cuentes a Closer, más se parecen tus clientes de práctica a los tuyos. Cámbialo cuando quieras.
        </p>
        {aviso && (
          <p role="status" style={{ margin: "16px 0 0", padding: "12px 14px", borderRadius: 14, background: "rgb(var(--c-success-rgb) / 0.08)", border: "1px solid rgb(var(--c-success-rgb) / 0.35)", fontFamily: "'DM Sans', sans-serif", fontSize: 15, color: "var(--c-text)" }}>
            {aviso}
          </p>
        )}
        <div style={{ marginTop: 24, display: "flex", flexDirection: "column", gap: 14 }}>
          {PUERTAS.map((p) =>
            editando === p.id ? (
              <Editor
                key={p.id}
                puerta={p}
                empresa={empresa}
                onCancelar={() => setEditando(null)}
                onGuardado={async () => {
                  setEditando(null);
                  setAviso("Listo. Tu cliente de práctica ya usa esto desde tu siguiente práctica.");
                  await cargar();
                }}
              />
            ) : (
              <Seccion key={p.id} puerta={p} r={r} cerebro={empresa.company_sales_brain} nombreNodo={nombres[p.antesDe]} onEditar={() => { setAviso(null); setEditando(p.id); }} bloqueado={editando !== null} />
            ),
          )}
        </div>
      </div>
    </main>
  );
}

const TITULO_SECCION: Record<string, string> = {
  cliente: "Lo que vendes y a quién",
  cartera: "Tus clientes de siempre",
  oferta: "Lo que ofreces",
  precio: "Tu precio",
  objeciones: "Lo que te dicen",
};

function Seccion({ puerta, r, cerebro, nombreNodo, onEditar, bloqueado }: { puerta: Puerta; r: Respuestas; cerebro: unknown; nombreNodo?: string; onEditar: () => void; bloqueado: boolean }) {
  const hechas = puerta.preguntas.filter((q) => contestada(q, r, cerebro));
  const nada = hechas.length === 0;
  return (
    <section style={{ padding: 18, borderRadius: "var(--r-tarjeta)", background: "var(--c-surface)", border: "1px solid var(--c-border)", fontFamily: "'DM Sans', sans-serif" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
        <h2 style={{ margin: 0, fontFamily: "Syne, sans-serif", fontWeight: 700, fontSize: 18, letterSpacing: "-0.01em" }}>{TITULO_SECCION[puerta.id]}</h2>
        <button type="button" onClick={onEditar} disabled={bloqueado} style={{ height: 36, padding: "0 14px", flex: "none", borderRadius: 10, border: "none", background: "var(--c-elevated)", color: nada ? "var(--c-primary)" : "var(--c-text)", fontFamily: "'DM Sans', sans-serif", fontSize: 14, fontWeight: 600, cursor: bloqueado ? "default" : "pointer", opacity: bloqueado ? 0.5 : 1 }}>
          {nada ? "Contestar" : "Editar"}
        </button>
      </div>
      {nada ? (
        <p style={{ margin: "8px 0 0", fontSize: 14, lineHeight: 1.45, color: "var(--c-text-2)" }}>
          {puerta.id === "cliente" ? "Te lo pedimos antes de tu primera práctica." : `Te lo pedimos antes de «${nombreNodo ?? `el nodo ${puerta.antesDe}`}». Si quieres, contéstalo desde ya.`}
        </p>
      ) : (
        <dl style={{ margin: "12px 0 0", display: "flex", flexDirection: "column", gap: 10 }}>
          {puerta.preguntas.map((q) => {
            const linea = resumenDe(q, r);
            return (
              <div key={q}>
                <dt style={{ ...estiloEtiqueta, fontSize: 12 }}>{TEXTO_PERSONAL[q].titulo}</dt>
                <dd style={{ margin: "4px 0 0", fontSize: 15, lineHeight: 1.45, color: linea ? "var(--c-text-soft)" : "var(--c-text-2)" }}>
                  {linea || (contestada(q, r, cerebro) ? (q === "p9_restricciones" ? "Ninguna además de las de Closer." : "Lo contaste antes; edítalo para verlo aquí.") : "Todavía no.")}
                </dd>
              </div>
            );
          })}
        </dl>
      )}
    </section>
  );
}

function Editor({ puerta, empresa, onCancelar, onGuardado }: { puerta: Puerta; empresa: Empresa; onCancelar: () => void; onGuardado: () => void }) {
  const [r, setR] = useState<Respuestas>(empresa.respuestas_giro ?? {});
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [propuestas, setPropuestas] = useState<{ negativos: string[]; restricciones: string[] } | null>(null);
  const necesita = puerta.preguntas.some((q) => preguntaPorId(q).propuestaPorCloser);

  useEffect(() => {
    if (!necesita) return;
    const n = r[PROPUESTAS.negativos], rs = r[PROPUESTAS.restricciones];
    if (Array.isArray(n) && Array.isArray(rs)) return setPropuestas({ negativos: n as string[], restricciones: rs as string[] });
    void proponerParaGiro(r, empresa.id).then((p) => {
      setPropuestas(p);
      setR((x) => ({ ...x, [PROPUESTAS.negativos]: p.negativos, [PROPUESTAS.restricciones]: p.restricciones }));
    });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const listo = puerta.preguntas.every((q) => completa(q, r)) && !(necesita && !propuestas);
  const guardar = async () => {
    setGuardando(true);
    setError(null);
    try {
      await guardarGiro({ respuestas: r, vistasAhora: puerta.preguntas, cerebroAnterior: empresa.company_sales_brain, companyId: empresa.id });
      onGuardado();
    } catch (e) {
      console.error("[tu-negocio] no se guardó:", e);
      setError("No pudimos guardar. Revisa tu conexión e intenta otra vez.");
    } finally {
      setGuardando(false);
    }
  };

  return (
    <section style={{ padding: 18, borderRadius: "var(--r-tarjeta)", background: "var(--c-surface)", border: "1px solid var(--c-primary)" }}>
      <div style={{ display: "flex", flexDirection: "column", gap: 32 }}>
        {puerta.preguntas.map((q) => {
          const tipo = preguntaPorId(q).propuestaPorCloser;
          const ops = tipo === "negativos" ? propuestas?.negativos ?? null : tipo === "restricciones" ? propuestas?.restricciones ?? null : undefined;
          return <PreguntaGiro key={q} id={q} r={r} setR={setR} propuestas={ops} compacta />;
        })}
      </div>
      {error && <p role="alert" style={{ margin: "14px 0 0", fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: "var(--c-danger)" }}>{error}</p>}
      <div style={{ marginTop: 24, display: "flex", flexDirection: "column", gap: 8 }}>
        <button type="button" disabled={!listo || guardando} onClick={() => void guardar()} style={estiloBoton("principal", !listo || guardando)}>
          {guardando ? "Guardando…" : "Guardar"}
        </button>
        <button type="button" disabled={guardando} onClick={onCancelar} style={estiloBoton("texto")}>Cancelar</button>
      </div>
    </section>
  );
}
