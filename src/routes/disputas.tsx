// Las disputas de calificación, para el equipo de Closer (oct-2026).
//
// Cada vez que un vendedor toca "No estoy de acuerdo con mi calificación",
// la disputa queda guardada con si Closer concedió, en qué criterio, por qué
// y el contexto completo. Aquí se auditan: filtrar, marcar como revisada con
// una nota, y copiar las seleccionadas en un formato listo para analizarlas
// con Claude y convertir cada error del evaluador en un caso de la red.
// Solo para administradores de la plataforma (no para managers).
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { AppHeader } from "@/components/app/AppShell";
import { getStoredSupabaseSession } from "@/lib/browser-auth-session";
import { restGet, restGetMaybeSingle, restMutate } from "@/lib/supabase-rest";
import { armarReporteDisputas, filtrar, type Disputa, type Filtro } from "@/lib/disputas-reporte";

export const Route = createFileRoute("/disputas")({ component: DisputasPage });

function DisputasPage() {
  const navigate = useNavigate();
  const [estado, setEstado] = useState<"cargando" | "denegado" | "listo">("cargando");
  const [lista, setLista] = useState<Disputa[]>([]);
  const [filtro, setFiltro] = useState<Filtro>("concedidas");
  const [nodo, setNodo] = useState("");
  const [notas, setNotas] = useState<Record<string, string>>({});
  const [aviso, setAviso] = useState<string | null>(null);

  useEffect(() => {
    void (async () => {
      const session = getStoredSupabaseSession();
      if (!session?.userId) { navigate({ to: "/" }); return; }
      const admin = await restGetMaybeSingle<{ user_id: string }>(`platform_admins?select=user_id&user_id=eq.${session.userId}&limit=1`).catch(() => null);
      if (!admin) { setEstado("denegado"); return; }
      const filas = await restGet<Disputa>(
        "disputas?select=id,created_at,node_id,nota_original,mensaje_vendedor,respuesta_closer,concede,criterio_id,motivo,contexto,revisada,nota_revision&order=created_at.desc&limit=500",
      ).catch(() => [] as Disputa[]);
      setLista(filas ?? []);
      setEstado("listo");
    })();
  }, [navigate]);

  const nodos = useMemo(() => [...new Set(lista.map((d) => d.node_id).filter(Boolean) as string[])].sort(), [lista]);
  const visibles = useMemo(() => filtrar(lista, filtro, nodo), [lista, filtro, nodo]);

  async function marcarRevisada(d: Disputa) {
    const nota = (notas[d.id] ?? "").trim() || null;
    try {
      await restMutate(`disputas?id=eq.${d.id}`, { method: "PATCH", body: { revisada: true, nota_revision: nota, revisada_at: new Date().toISOString() } });
      setLista((xs) => xs.map((x) => (x.id === d.id ? { ...x, revisada: true, nota_revision: nota } : x)));
    } catch (err) {
      console.error("[disputas] no se pudo marcar:", err);
      setAviso("No se pudo guardar. Intenta de nuevo.");
    }
  }

  async function copiar() {
    try {
      await navigator.clipboard.writeText(armarReporteDisputas(visibles));
      setAviso(`Copiadas ${visibles.length}. Pégalas en la conversación con Claude.`);
    } catch {
      setAviso("No se pudo copiar.");
    }
  }

  if (estado === "denegado") {
    return (
      <div className="min-h-screen bg-[#08080F] text-white">
        <AppHeader title="Disputas" />
        <div className="mx-auto max-w-2xl p-6 font-['Syne'] text-2xl font-bold">Solo para el equipo de Closer</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#08080F] text-white">
      <AppHeader title="Disputas" />
      <div className="mx-auto max-w-4xl p-4 md:p-6">
        <h1 className="font-['Syne'] text-3xl font-bold mb-1">Disputas</h1>
        <p className="text-white/60 font-['DM_Sans'] mb-4">
          Cuando un vendedor no está de acuerdo con su calificación. Las concedidas son errores del evaluador: cada una es un caso para la red.
        </p>

        <div className="flex flex-wrap items-center gap-2 mb-4">
          {(["concedidas", "sin_revisar", "todas"] as Filtro[]).map((f) => (
            <button
              key={f}
              onClick={() => setFiltro(f)}
              className={`rounded-full px-3 py-1.5 text-sm border ${filtro === f ? "border-[#FF6B2B] bg-[#FF6B2B]/15" : "border-white/15"}`}
            >
              {f === "concedidas" ? "Concedidas" : f === "sin_revisar" ? "Sin revisar" : "Todas"}
            </button>
          ))}
          <select value={nodo} onChange={(e) => setNodo(e.target.value)} className="rounded-full bg-black/40 border border-white/15 px-3 py-1.5 text-sm">
            <option value="">Todos los nodos</option>
            {nodos.map((n) => <option key={n} value={n}>{n}</option>)}
          </select>
          <Button onClick={copiar} disabled={visibles.length === 0} className="ml-auto rounded-full bg-[#FF6B2B] text-black font-['Syne'] font-bold">
            Copiar {visibles.length} para Claude
          </Button>
        </div>
        {aviso && <div className="mb-3 text-sm text-white/70">{aviso}</div>}
        {estado === "cargando" && <div className="text-white/50">Cargando…</div>}
        {estado === "listo" && visibles.length === 0 && <div className="text-white/50">No hay disputas con este filtro.</div>}

        <div className="flex flex-col gap-3">
          {visibles.map((d) => (
            <div key={d.id} className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
              <div className="flex flex-wrap items-center gap-2 text-xs text-white/50 mb-2">
                <span className="font-bold text-white/80">Nodo {d.node_id ?? "?"}</span>
                <span>· {d.created_at.slice(0, 16).replace("T", " ")}</span>
                <span>· nota {d.nota_original ?? "?"}</span>
                <span className={`rounded-full px-2 py-0.5 ${d.concede === true ? "bg-[#FF6B2B]/20 text-[#FF6B2B]" : "bg-white/10"}`}>
                  {d.concede === true ? "Concedida" : d.concede === false ? "Sostenida" : "Sin dato"}
                </span>
                {d.criterio_id && <span>· {d.criterio_id}</span>}
                {d.revisada && <span className="text-emerald-400">· revisada</span>}
              </div>
              {d.motivo && <div className="text-sm mb-2"><span className="text-white/50">Motivo: </span>{d.motivo}</div>}
              <div className="text-sm mb-1"><span className="text-white/50">Vendedor: </span>{d.mensaje_vendedor}</div>
              <div className="text-sm text-white/80"><span className="text-white/50">Closer: </span>{d.respuesta_closer}</div>
              {d.revisada ? (
                d.nota_revision && <div className="mt-2 text-xs text-white/60">Nota: {d.nota_revision}</div>
              ) : (
                <div className="mt-3 flex gap-2">
                  <input
                    value={notas[d.id] ?? ""}
                    onChange={(e) => setNotas((n) => ({ ...n, [d.id]: e.target.value }))}
                    placeholder="Nota de revisión (opcional)"
                    className="flex-1 rounded-lg bg-black/40 border border-white/15 px-3 py-1.5 text-sm"
                  />
                  <Button variant="outline" onClick={() => marcarRevisada(d)} className="rounded-full border-white/15 text-white">
                    Marcar revisada
                  </Button>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
