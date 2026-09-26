// La red de seguridad del evaluador, corrida desde la app.
//
// Antes, correr la red pasaba por Lovable, y una sola petición con todos los
// casos chocaba con el límite de 150 s. Aquí cada caso es su propia petición
// (seis a la vez), así que no hay límite total, y se puede repetir cada caso
// varias veces para medir si la nota cambia entre corridas. El botón "Copiar
// reporte" deja en el portapapeles solo lo que hace falta revisar.
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { AppHeader } from "@/components/app/AppShell";
import { getStoredSupabaseSession } from "@/lib/browser-auth-session";
import { restGetMaybeSingle } from "@/lib/supabase-rest";
import { armarReporte, type Caso, type Resultado } from "@/lib/red-reporte";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;
const SUPABASE_ANON = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string;
const RUNNER_URL = `${SUPABASE_URL}/functions/v1/harness-runner`;
const CONCURRENCIA = 6;

export const Route = createFileRoute("/red")({ component: RedPage });


async function llamar(token: string, body: unknown): Promise<any> {
  const r = await fetch(RUNNER_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}`, apikey: SUPABASE_ANON },
    body: JSON.stringify(body),
  });
  const texto = await r.text();
  let json: any = null;
  try { json = JSON.parse(texto); } catch { /* respuesta no JSON */ }
  if (!r.ok) throw new Error(`HTTP ${r.status}: ${(json?.error ?? texto).toString().slice(0, 160)}`);
  return json;
}

function RedPage() {
  const navigate = useNavigate();
  const [estado, setEstado] = useState<"cargando" | "denegado" | "listo" | "corriendo">("cargando");
  const [token, setToken] = useState("");
  const [version, setVersion] = useState("");
  const [casos, setCasos] = useState<Caso[]>([]);
  const [mundos, setMundos] = useState<number[]>([]);
  const [corridas, setCorridas] = useState(3);
  const [res, setRes] = useState<Record<string, Resultado[]>>({});
  const [hechos, setHechos] = useState(0);
  const [total, setTotal] = useState(0);
  const [aviso, setAviso] = useState("");

  useEffect(() => {
    (async () => {
      const session = getStoredSupabaseSession();
      if (!session) { navigate({ to: "/login" }); return; }
      const perfil = await restGetMaybeSingle<{ role: string }>(`profiles?select=role&id=eq.${session.userId}&limit=1`);
      if (!perfil || perfil.role !== "manager") { setEstado("denegado"); return; }
      setToken(session.accessToken);
      try {
        const lista = await llamar(session.accessToken, { listar: true });
        setVersion(lista.version ?? "");
        setCasos(lista.casos ?? []);
        setMundos([...new Set<number>((lista.casos ?? []).map((c: Caso) => c.mundo))].sort());
        setEstado("listo");
      } catch (e) {
        setAviso(e instanceof Error ? e.message : String(e));
        setEstado("listo");
      }
    })();
  }, [navigate]);

  const mundosDisponibles = useMemo(() => [...new Set(casos.map((c) => c.mundo))].sort(), [casos]);
  const elegidos = useMemo(() => casos.filter((c) => mundos.includes(c.mundo)), [casos, mundos]);

  async function correr() {
    setEstado("corriendo");
    setAviso("");
    const tareas = elegidos.flatMap((c) => Array.from({ length: corridas }, (_, k) => ({ c, k })));
    const acumulado: Record<string, Resultado[]> = {};
    for (const c of elegidos) acumulado[c.id] = new Array(corridas);
    setRes({ ...acumulado });
    setHechos(0);
    setTotal(tareas.length);
    let siguiente = 0;
    let listos = 0;
    const trabajador = async () => {
      while (siguiente < tareas.length) {
        const { c, k } = tareas[siguiente++];
        let r: Resultado;
        try {
          const out = await llamar(token, { case_ids: [c.id] });
          const x = out?.results?.[0] ?? {};
          r = { status: x.status ?? "error", score: typeof x.score === "number" ? x.score : null, reasons: x.reasons ?? [], veredictos: x.veredictos ?? [] };
        } catch (e) {
          r = { status: "error", score: null, reasons: [e instanceof Error ? e.message : String(e)], veredictos: [] };
        }
        acumulado[c.id][k] = r;
        listos += 1;
        setHechos(listos);
        setRes({ ...acumulado });
      }
    };
    await Promise.all(Array.from({ length: Math.min(CONCURRENCIA, tareas.length) }, trabajador));
    setEstado("listo");
  }

  async function copiar() {
    const texto = armarReporte(version, elegidos, corridas, res, mundos);
    try { await navigator.clipboard.writeText(texto); setAviso("Reporte copiado. Pégalo en la conversación."); }
    catch { setAviso("No pude copiar al portapapeles; selecciona el texto de abajo."); }
  }

  if (estado === "denegado") {
    return (
      <div className="min-h-screen bg-[#08080F] text-white flex flex-col items-center justify-center px-6 gap-4 text-center">
        <div className="font-['Syne'] text-2xl font-bold">Solo para managers</div>
        <Button onClick={() => navigate({ to: "/mapa" })} className="bg-[#FF6B2B] hover:bg-[#ff7a42] rounded-[99px]">Ir al mapa</Button>
      </div>
    );
  }

  const color = (s?: string) => (s === "pass" ? "#3DDC84" : s === "fail" || s === "error" ? "#FF5C5C" : "rgba(255,255,255,0.35)");
  const hayResultados = Object.keys(res).length > 0;

  return (
    <div className="min-h-screen bg-[#08080F] text-white pb-16">
      <AppHeader title="Red de seguridad" subtitle={`${elegidos.length} casos · ${version}`} />
      <div className="px-4 flex flex-col gap-4 max-w-3xl mx-auto">
        <div className="flex flex-wrap gap-2 items-center font-['DM_Sans'] text-sm">
          <span className="text-white/60">Mundos:</span>
          {mundosDisponibles.map((m) => (
            <button key={m} disabled={estado === "corriendo"}
              onClick={() => setMundos((xs) => (xs.includes(m) ? xs.filter((x) => x !== m) : [...xs, m].sort()))}
              className="px-3 py-1 rounded-full border"
              style={{ borderColor: mundos.includes(m) ? "#FF6B2B" : "rgba(255,255,255,0.2)", color: mundos.includes(m) ? "#FF6B2B" : "rgba(255,255,255,0.6)" }}>
              {m}
            </button>
          ))}
          <span className="text-white/60 ml-3">Corridas:</span>
          {[1, 3].map((n) => (
            <button key={n} disabled={estado === "corriendo"} onClick={() => setCorridas(n)}
              className="px-3 py-1 rounded-full border"
              style={{ borderColor: corridas === n ? "#FF6B2B" : "rgba(255,255,255,0.2)", color: corridas === n ? "#FF6B2B" : "rgba(255,255,255,0.6)" }}>
              {n}
            </button>
          ))}
        </div>

        <div className="flex gap-3">
          <Button onClick={correr} disabled={estado !== "listo" || elegidos.length === 0}
            className="bg-[#FF6B2B] hover:bg-[#ff7a42] rounded-[99px]">
            {estado === "corriendo" ? `Corriendo… ${hechos} de ${total}` : "Correr la red"}
          </Button>
          <Button onClick={copiar} disabled={!hayResultados || estado === "corriendo"} variant="outline" className="rounded-[99px]">
            Copiar reporte
          </Button>
        </div>
        {aviso && <div className="text-sm text-white/70 font-['DM_Sans']">{aviso}</div>}

        {hayResultados && (
          <div className="flex flex-col gap-1 font-['DM_Sans'] text-sm">
            {elegidos.map((c) => {
              const rs = res[c.id] ?? [];
              const notas = rs.map((r) => r?.score);
              const inestable = notas.filter((x) => typeof x === "number").length > 1 && new Set(notas.filter((x) => typeof x === "number")).size > 1;
              const ult = [...rs].reverse().find((r) => r && (r.status === "fail" || r.status === "error"));
              return (
                <div key={c.id} className="rounded-xl px-3 py-2" style={{ background: "rgba(255,255,255,0.04)" }}>
                  <div className="flex items-center gap-2">
                    {rs.map((r, k) => (
                      <span key={k} title={r?.status} className="inline-block w-2.5 h-2.5 rounded-full" style={{ background: color(r?.status) }} />
                    ))}
                    <span className="font-semibold">{c.id}</span>
                    <span className="text-white/40">[{c.node_id}]</span>
                    <span className="ml-auto text-white/70">{notas.map((x) => x ?? "—").join(" · ")}</span>
                    {inestable && <span className="text-[#FFB020] text-xs">inestable</span>}
                  </div>
                  {ult && <div className="text-xs text-[#FF9C9C] mt-1">{ult.reasons.join(" | ")}</div>}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
