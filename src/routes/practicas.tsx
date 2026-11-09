// El panel «Prácticas», para el equipo de Closer (mensaje 162, nov-2026, Emilio).
//
// Todas las prácticas de todos los usuarios, con filtros, para auditarlas y mejorar Closer: en qué nodo se
// atoran, qué les dijo Closer, cómo los calificó y, si lo aceptaron, cómo se oyó. «Copiar para Claude»
// arma el texto para analizarlo en la conversación (sin audio).
// Solo para administradores de la plataforma: la base lo revisa en cada llamada (admin_practicas,
// admin_practica y la regla del audio), no esta pantalla.
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AppHeader } from "@/components/app/AppShell";
import { ReproductorPorTurnos } from "@/components/closer/reproductor-turnos";
import { getStoredSupabaseSession } from "@/lib/browser-auth-session";
import { createSignedStorageUrl, restGetMaybeSingle, restMutate } from "@/lib/supabase-rest";
import { turnosValidos } from "@/lib/voz/turnos-audio";
import {
  FILTROS_INICIALES, INTENTOS_ATORADO, atorados, fallasPresentes, filtrar, nodoQueCuesta, pasó, reporteDeLista, reporteDePractica, resumenPorNodo, vistaDePractica,
  type DetallePractica, type FilaPractica, type Filtros,
} from "@/lib/practicas-admin";

export const Route = createFileRoute("/practicas")({
  head: () => ({ meta: [
    { title: "Prácticas — Closer" },
    { name: "description", content: "Revisión de las prácticas de todos los usuarios, para el equipo de Closer." },
    { property: "og:title", content: "Prácticas — Closer" },
    { property: "og:description", content: "Revisión de las prácticas de todos los usuarios, para el equipo de Closer." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary" },
  ] }),
  component: PracticasPage,
});

const RANGOS = [7, 30, 90] as const;
const POR_PAGINA = 100;

function PracticasPage() {
  const navigate = useNavigate();
  const [estado, setEstado] = useState<"cargando" | "denegado" | "error" | "listo">("cargando");
  const [dias, setDias] = useState<(typeof RANGOS)[number]>(30);
  const [filas, setFilas] = useState<FilaPractica[]>([]);
  const [f, setF] = useState<Filtros>(FILTROS_INICIALES);
  const [mostrar, setMostrar] = useState(POR_PAGINA);
  const [aviso, setAviso] = useState<string | null>(null);

  useEffect(() => {
    let vivo = true;
    void (async () => {
      const session = getStoredSupabaseSession();
      if (!session?.userId) { navigate({ to: "/" }); return; }
      setEstado("cargando");
      const admin = await restGetMaybeSingle<{ user_id: string }>(`platform_admins?select=user_id&user_id=eq.${session.userId}&limit=1`).catch(() => null);
      if (!vivo) return;
      if (!admin) { setEstado("denegado"); return; }
      try {
        const hasta = new Date(Date.now() + 60_000);
        const desde = new Date(hasta.getTime() - dias * 86_400_000);
        const r = await restMutate<FilaPractica>("rpc/admin_practicas", {
          method: "POST",
          body: { _desde: desde.toISOString(), _hasta: hasta.toISOString(), _limite: 3000 },
          timeoutMs: 30_000,
        });
        if (!vivo) return;
        setFilas((r ?? []).map((x) => ({ ...x, fallas: Array.isArray(x.fallas) ? x.fallas : [] })));
        setEstado("listo");
      } catch (err) {
        console.error("[practicas] no cargó:", err);
        if (vivo) setEstado("error");
      }
    })();
    return () => { vivo = false; };
  }, [navigate, dias]);

  const nodos = useMemo(() => [...new Set(filas.map((x) => x.node_id).filter(Boolean) as string[])], [filas]);
  const resumen = useMemo(() => resumenPorNodo(filas), [filas]);
  const nodosOrdenados = useMemo(() => resumen.map((r) => r.node_id), [resumen]);
  const fallas = useMemo(() => fallasPresentes(filas), [filas]);
  const visibles = useMemo(() => filtrar(filas, f), [filas, f]);
  const atoradosEnLista = useMemo(() => atorados(filas), [filas]);
  const cambiar = (x: Partial<Filtros>) => { setF((v) => ({ ...v, ...x })); setMostrar(POR_PAGINA); setAviso(null); };

  const filtrosTexto = [
    `últimos ${dias} días`,
    f.nodo && `nodo ${f.nodo}`,
    f.tipo !== "todos" && (f.tipo === "personal" ? "por su cuenta" : "equipos"),
    f.texto && `«${f.texto}»`,
    f.resultado !== "todas" && (f.resultado === "pasaron" ? "pasaron" : "no pasaron"),
    f.soloAtorados && "atorados",
    f.conCritica && "con falla crítica",
    f.falla && `falla ${f.falla}`,
  ].filter(Boolean).join(" · ");

  async function copiarLista() {
    try {
      await navigator.clipboard.writeText(reporteDeLista(visibles, filtrosTexto));
      setAviso(`Copiadas ${visibles.length}. Pégalas en la conversación con Claude.`);
    } catch {
      setAviso("No se pudo copiar.");
    }
  }

  if (estado === "denegado") {
    return (
      <div className="min-h-screen bg-[var(--c-bg)] text-white">
        <AppHeader title="Prácticas" />
        <div className="mx-auto max-w-2xl p-6 font-['Syne'] text-2xl font-bold">Solo para el equipo de Closer</div>
      </div>
    );
  }

  const chip = (activo: boolean) => `rounded-full px-3 py-1.5 text-sm border ${activo ? "border-[var(--c-primary)] bg-[var(--c-primary)]/15" : "border-white/15"}`;
  const caja = "rounded-full bg-black/40 border border-white/15 px-3 py-1.5 text-sm";

  return (
    <div className="min-h-screen bg-[var(--c-bg)] text-white">
      <AppHeader title="Prácticas" />
      <div className="mx-auto max-w-5xl p-4 md:p-6">
        <h1 className="font-['Syne'] text-3xl font-bold mb-1">Prácticas</h1>
        <p className="text-white/60 font-['DM_Sans'] mb-4">
          Las prácticas de todos los usuarios. Pasa con 2 estrellas; desde 3 intentos sin pasar, está atorado.
        </p>

        <div className="flex flex-wrap items-center gap-2 mb-4">
          {RANGOS.map((d) => (
            <button key={d} onClick={() => { setDias(d); setMostrar(POR_PAGINA); }} className={chip(dias === d)}>{d} días</button>
          ))}
        </div>

        {estado === "cargando" && <div className="text-white/50">Cargando…</div>}
        {estado === "error" && <div className="text-red-300">No se pudieron cargar las prácticas. Recarga la página.</div>}

        {estado === "listo" && (
          <>
            <section className="mb-6">
              <h2 className="font-['Syne'] text-lg font-bold mb-2">Por nodo</h2>
              {resumen.length === 0 ? (
                <div className="text-white/50 text-sm">No hay prácticas en este rango.</div>
              ) : (
                <div className="overflow-x-auto rounded-2xl border border-white/10">
                  <table className="w-full text-sm font-['DM_Sans']">
                    <thead className="text-white/45 text-xs uppercase tracking-wide">
                      <tr className="text-left">
                        <th className="px-3 py-2">Nodo</th>
                        <th className="px-3 py-2 text-right">Prácticas</th>
                        <th className="px-3 py-2 text-right">Vendedores</th>
                        <th className="px-3 py-2 text-right">Pasaron</th>
                        <th className="px-3 py-2 text-right">Atorados</th>
                        <th className="px-3 py-2 text-right" title="De los que lo pasaron: en qué intento, en promedio">Pasan en el intento</th>
                        <th className="px-3 py-2 text-right">Nota prom.</th>
                        <th className="px-3 py-2">Fallas que más se repiten</th>
                      </tr>
                    </thead>
                    <tbody>
                      {resumen.map((r) => (
                        <tr
                          key={r.node_id}
                          onClick={() => cambiar({ nodo: f.nodo === r.node_id ? "" : r.node_id })}
                          className={`cursor-pointer border-t border-white/10 hover:bg-white/[0.04] ${f.nodo === r.node_id ? "bg-[var(--c-primary)]/10" : ""}`}
                        >
                          <td className={`px-3 py-2 font-bold ${nodoQueCuesta(r) ? "text-red-300" : ""}`}>{r.node_id}</td>
                          <td className="px-3 py-2 text-right">{r.practicas}</td>
                          <td className="px-3 py-2 text-right">{r.vendedores}</td>
                          <td className="px-3 py-2 text-right">{r.pasaron}</td>
                          <td className={`px-3 py-2 text-right ${r.atorados > 0 ? "text-red-300 font-bold" : ""}`}>{r.atorados}</td>
                          <td className={`px-3 py-2 text-right ${(r.intentosParaPasar ?? 0) > INTENTOS_ATORADO ? "text-red-300 font-bold" : ""}`}>{r.intentosParaPasar ?? "—"}</td>
                          <td className="px-3 py-2 text-right">{r.promedio ?? "—"}</td>
                          <td className="px-3 py-2 text-xs text-white/60">{r.fallas.map((x) => `${x.id} ×${x.n}`).join(" · ") || "—"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>

            <div className="flex flex-wrap items-center gap-2 mb-2">
              <select value={f.nodo} onChange={(e) => cambiar({ nodo: e.target.value })} className={caja} aria-label="Nodo">
                <option value="">Todos los nodos</option>
                {(nodosOrdenados.length ? nodosOrdenados : nodos).map((n) => <option key={n} value={n}>{n}</option>)}
              </select>
              <select value={f.tipo} onChange={(e) => cambiar({ tipo: e.target.value as Filtros["tipo"] })} className={caja} aria-label="Tipo de cuenta">
                <option value="todos">Equipos y por su cuenta</option>
                <option value="equipos">Solo equipos</option>
                <option value="personal">Solo por su cuenta</option>
              </select>
              <select value={f.resultado} onChange={(e) => cambiar({ resultado: e.target.value as Filtros["resultado"] })} className={caja} aria-label="Resultado">
                <option value="todas">Pasaron y no pasaron</option>
                <option value="no_pasaron">No pasaron</option>
                <option value="pasaron">Pasaron</option>
              </select>
              <select value={f.falla} onChange={(e) => cambiar({ falla: e.target.value })} className={caja} aria-label="Falla">
                <option value="">Cualquier falla</option>
                {fallas.map((x) => <option key={x.id} value={x.id}>{x.id} ({x.n})</option>)}
              </select>
              <input
                value={f.texto}
                onChange={(e) => cambiar({ texto: e.target.value })}
                placeholder="Vendedor o empresa"
                className={`${caja} min-w-[180px] flex-1`}
              />
            </div>
            <div className="flex flex-wrap items-center gap-2 mb-4">
              <button onClick={() => cambiar({ soloAtorados: !f.soloAtorados })} className={chip(f.soloAtorados)}>Atorados</button>
              <button onClick={() => cambiar({ conCritica: !f.conCritica })} className={chip(f.conCritica)}>Con falla crítica</button>
              {JSON.stringify(f) !== JSON.stringify(FILTROS_INICIALES) && (
                <button onClick={() => cambiar(FILTROS_INICIALES)} className="px-2 py-1.5 text-sm text-white/60 underline">Quitar filtros</button>
              )}
              <Button onClick={copiarLista} disabled={visibles.length === 0} className="ml-auto rounded-full bg-[var(--c-primary)] text-black font-['Syne'] font-bold">
                Copiar {visibles.length} para Claude
              </Button>
            </div>
            {aviso && <div className="mb-3 text-sm text-white/70">{aviso}</div>}
            <div className="mb-2 text-xs text-white/45">
              {visibles.length} de {filas.length} prácticas{filas.length >= 3000 ? " (se muestran las 3000 más recientes: acorta el rango)" : ""}
            </div>
            {visibles.length === 0 && <div className="text-white/50">No hay prácticas con estos filtros.</div>}

            <div className="flex flex-col gap-2">
              {visibles.slice(0, mostrar).map((x) => (
                <ItemPractica key={x.id} fila={x} atorado={atoradosEnLista.has(`${x.seller_id}|${x.node_id ?? ""}`)} />
              ))}
            </div>
            {visibles.length > mostrar && (
              <div className="mt-4 flex justify-center">
                <Button variant="outline" onClick={() => setMostrar((n) => n + POR_PAGINA)} className="rounded-full border-white/15 text-white">
                  Ver {Math.min(POR_PAGINA, visibles.length - mostrar)} más
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function ItemPractica({ fila, atorado }: { fila: FilaPractica; atorado: boolean }) {
  const [abierta, setAbierta] = useState(false);
  const [detalle, setDetalle] = useState<DetallePractica | null | "error">(null);
  const [audio, setAudio] = useState<string | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);

  async function abrir() {
    const ahora = !abierta;
    setAbierta(ahora);
    if (!ahora || detalle) return;
    try {
      const d = (await restMutate<any>("rpc/admin_practica", { method: "POST", body: { _id: fila.id } })) as unknown as DetallePractica | null;
      if (!d) throw new Error("sin detalle");
      setDetalle(d);
      // El audio solo se pide al abrir la práctica, y solo si el vendedor aceptó que se grabara.
      if (d.audio_consent && d.audio_url) {
        if (d.audio_url.startsWith("http")) setAudio(d.audio_url);
        else {
          try {
            setAudio(await createSignedStorageUrl("practice-audio", d.audio_url, { accessToken: getStoredSupabaseSession()?.accessToken, expiresIn: 3600 }));
          } catch (err) {
            console.warn("[practicas] audio:", err);
            setAudio("__error__");
          }
        }
      }
    } catch (err) {
      console.error("[practicas] detalle:", err);
      setDetalle("error");
    }
  }

  async function copiar() {
    if (!detalle || detalle === "error") return;
    try {
      await navigator.clipboard.writeText(reporteDePractica(detalle));
      setAviso("Copiada. Pégala en la conversación con Claude.");
    } catch {
      setAviso("No se pudo copiar.");
    }
  }

  const stars = fila.stars ?? 0;
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] overflow-hidden">
      <button onClick={() => void abrir()} className="w-full text-left p-3 md:p-4 flex items-center gap-3 hover:bg-white/[0.02]">
        <div className="min-w-0 flex-1 font-['DM_Sans']">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <span className="font-bold">{fila.node_id ?? "?"}</span>
            <span className="truncate text-white/85">{fila.vendedor ?? "Sin nombre"}</span>
            <span className="text-xs text-white/45">{fila.personal ? "por su cuenta" : fila.empresa ?? "equipo"}</span>
          </div>
          <div className="mt-1 flex flex-wrap items-center gap-1.5 text-xs text-white/50">
            <span>{fila.created_at.slice(0, 16).replace("T", " ")}</span>
            <span>· intento {fila.intento}</span>
            {atorado && <span className="rounded-full bg-red-500/15 px-2 py-0.5 text-red-300">atorado</span>}
            {fila.criticas > 0 && <span className="rounded-full bg-red-500/15 px-2 py-0.5 text-red-300">falla crítica</span>}
            {fila.fallas.slice(0, 3).map((x) => <span key={x} className="rounded-full bg-white/10 px-2 py-0.5">{x}</span>)}
            {fila.tiene_audio && <span>· con audio</span>}
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <div className={`font-['Syne'] font-bold text-lg ${pasó(fila) ? "" : "text-white/60"}`}>{fila.score ?? "—"}</div>
          <div className="flex">
            {[1, 2, 3].map((i) => (
              <Star key={i} className={`h-3.5 w-3.5 ${i <= stars ? "text-[var(--c-primary)] fill-[var(--c-primary)]" : "text-white/20"}`} />
            ))}
          </div>
        </div>
      </button>

      {abierta && (
        <div className="border-t border-white/10 p-3 md:p-4 text-sm font-['DM_Sans']">
          {detalle === null && <div className="text-white/50 text-xs">Cargando…</div>}
          {detalle === "error" && <div className="text-red-300 text-xs">No se pudo cargar esta práctica.</div>}
          {detalle && detalle !== "error" && <Detalle d={detalle} audio={audio} onCopiar={copiar} aviso={aviso} />}
        </div>
      )}
    </div>
  );
}

function Detalle({ d, audio, onCopiar, aviso }: { d: DetallePractica; audio: string | null; onCopiar: () => void; aviso: string | null }) {
  const v = vistaDePractica(d);
  const titulo = "text-xs uppercase tracking-widest text-white/40 mb-1";
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-2 text-xs text-white/50">
        <span>{d.nodo ?? d.node_id}</span>
        {v.termino && <span>· terminó: {v.termino}</span>}
        {d.prompt_version && <span>· evaluador {d.prompt_version}</span>}
        <Button onClick={onCopiar} variant="outline" className="ml-auto h-8 rounded-full border-white/15 text-white text-xs">Copiar para Claude</Button>
      </div>
      {aviso && <div className="text-xs text-white/70">{aviso}</div>}

      {d.audio_url && (
        <div>
          <div className={titulo}>Audio</div>
          {!d.audio_consent ? (
            <div className="text-white/50 text-xs">Este vendedor no aceptó que se grabaran sus prácticas.</div>
          ) : audio === "__error__" ? (
            <div className="text-red-300 text-xs">No se pudo cargar el audio.</div>
          ) : audio ? (
            <ReproductorPorTurnos src={audio} turnos={turnosValidos(d.payload?.evaluation?.audio_turnos)} />
          ) : (
            <div className="text-white/50 text-xs">Cargando audio…</div>
          )}
        </div>
      )}

      {v.fallas.length > 0 && (
        <div>
          <div className={titulo}>Fallas</div>
          <div className="flex flex-col gap-2">
            {v.fallas.map((x, i) => (
              <div key={`${x.id}-${i}`} className="rounded-xl border border-red-500/20 bg-red-500/[0.06] p-3 text-xs">
                <div className="mb-1 font-bold text-red-300">{x.id}{x.severidad ? ` · ${x.severidad}` : ""}</div>
                {x.error && <div className="text-white/80">{x.error}</div>}
                {x.cita && <div className="mt-1 italic text-white/60">«{x.cita}»</div>}
                {x.mejora && <div className="mt-1 text-white/80"><b className="text-[var(--c-primary)]">Mejora:</b> {x.mejora}</div>}
              </div>
            ))}
          </div>
        </div>
      )}

      {v.observaciones.length > 0 && (
        <div>
          <div className={titulo}>Lo que le dijo Closer</div>
          <div className="flex flex-col gap-2">
            {v.observaciones.map((o, i) => (
              <div key={i} className="rounded-xl border border-white/10 bg-black/20 p-3 text-xs">
                <div className="mb-1 font-bold text-white/70">{o.criterio}{o.severidad ? ` · ${o.severidad}` : ""}</div>
                {o.error && <div className="mb-1 text-white/80"><b className="text-red-300">Qué pasó:</b> {o.error}</div>}
                {o.mejora && <div className="mb-1 text-white/80"><b className="text-[var(--c-primary)]">Mejora:</b> {o.mejora}</div>}
                {o.ejemplo && <div className="italic text-white/70">Ejemplo: {o.ejemplo}</div>}
              </div>
            ))}
          </div>
        </div>
      )}

      {v.mision && (
        <div>
          <div className={titulo}>Misión</div>
          <div className="rounded-xl border border-[var(--c-primary)]/20 bg-[var(--c-primary)]/10 p-3 text-xs text-white/80">{v.mision}</div>
        </div>
      )}

      {v.cumplidos.length > 0 && (
        <div>
          <div className={titulo}>Criterios cumplidos</div>
          <div className="flex flex-wrap gap-1.5">
            {v.cumplidos.map((c) => <span key={c} className="rounded-full border border-green-500/20 bg-green-500/10 px-2 py-0.5 text-xs text-green-300">{c}</span>)}
          </div>
        </div>
      )}

      <div>
        <div className={titulo}>Conversación ({v.turnos.length} turnos)</div>
        {v.turnos.length === 0 ? (
          <div className="text-white/50 text-xs">Esta práctica no guardó la conversación.</div>
        ) : (
          <ol className="flex flex-col gap-2">
            {v.turnos.map((t) => (
              <li key={t.n} className={`rounded-lg px-3 py-2 ${t.quien === "Vendedor" ? "bg-[var(--c-primary)]/10" : "bg-white/[0.05]"}`}>
                <div className="mb-0.5 text-[11px] font-bold uppercase tracking-wide text-white/45">Turno {t.n} · {t.quien}</div>
                <div className="whitespace-pre-wrap break-words text-white/85">{t.texto}</div>
              </li>
            ))}
          </ol>
        )}
      </div>
    </div>
  );
}
