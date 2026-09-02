import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { FileText } from "lucide-react";
import { AppHeader } from "@/components/app/AppShell";
import { getStoredSupabaseSession } from "@/lib/browser-auth-session";
import { restGetMaybeSingle } from "@/lib/supabase-rest";
import {
  CLIENT_TYPES,
  RELATIONSHIPS,
  CHANNELS,
  fetchPublishedPitches,
  type ClientType,
  type CompanyPitch,
  type Relationship,
} from "@/lib/pitches";

const STORAGE_KEY = "closer:pitch-selection";

export const Route = createFileRoute("/pitches/")({
  head: () => ({
    meta: [
      { title: "Mis Pitches — Closer" },
      {
        name: "description",
        content:
          "Los pitches publicados por tu líder de equipo: el guion de tu empresa por tipo de cliente y canal.",
      },
      { property: "og:title", content: "Mis Pitches — Closer" },
      {
        property: "og:description",
        content: "El guion de tu empresa por tipo de cliente y canal, publicado por tu líder.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: PitchesPage,
});

function PitchesPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [pitches, setPitches] = useState<CompanyPitch[]>([]);
  const [rel, setRel] = useState<Relationship>("nuevo");
  const [use, setUse] = useState<ClientType>("revende");

  // Persistencia de la última selección del vendedor.
  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const saved = JSON.parse(raw) as { rel?: Relationship; use?: ClientType };
      if (saved.rel) setRel(saved.rel);
      if (saved.use) setUse(saved.use);
    } catch {
      /* selección no crítica */
    }
  }, []);

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ rel, use }));
    } catch {
      /* selección no crítica */
    }
  }, [rel, use]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const session = getStoredSupabaseSession();
      if (!session) {
        navigate({ to: "/login" });
        return;
      }
      const profile = await restGetMaybeSingle<{ company_id: string | null }>(
        `profiles?select=company_id&id=eq.${session.userId}&limit=1`,
      );
      const rows = profile?.company_id ? await fetchPublishedPitches(profile.company_id) : [];
      if (!cancelled) {
        setPitches(rows);
        setLoading(false);
      }
    })().catch((e) => {
      console.error("[pitches] load failed", e);
      if (!cancelled) setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [navigate]);

  return (
    <div className="min-h-screen bg-[#08080F] text-white">
      <AppHeader title="Mis Pitches" />
      <div className="mx-auto w-full max-w-[560px] px-5 pt-2 pb-24">
        <h1 className="font-['Syne'] text-3xl font-black tracking-tight mb-6">Mis Pitches</h1>

        {loading ? (
          <div className="text-sm text-white/50 font-['DM_Sans']">Cargando…</div>
        ) : pitches.length === 0 ? (
          <div className="rounded-[14px] border border-dashed border-white/10 bg-white/[0.02] p-8 text-center">
            <FileText className="mx-auto h-6 w-6 text-white/30" />
            <div className="mt-3 text-sm text-white/60 font-['DM_Sans']">
              Tu líder de equipo todavía no publica ningún pitch.
            </div>
          </div>
        ) : (
          <>
            <Selector
              label="¿Ya te compra?"
              options={RELATIONSHIPS.filter((r) => pitches.some((p) => p.relationship === r.key))}
              value={rel}
              onChange={(v: string) => setRel(v as Relationship)}
            />
            <Selector
              label="¿Qué hace con el producto?"
              options={CLIENT_TYPES.filter((t) =>
                pitches.some((p) => p.relationship === rel && p.client_type === t.key),
              )}
              value={use}
              onChange={(v) => setUse(v as ClientType)}
            />

            <div className="mt-5 grid grid-cols-1 gap-3">
              {(() => {
                const matches = pitches.filter(
                  (p) => p.relationship === rel && p.client_type === use,
                );
                if (matches.length === 0) {
                  return (
                    <div className="rounded-[14px] border border-dashed border-white/10 bg-white/[0.02] p-8 text-center text-sm text-white/60 font-['DM_Sans']">
                      Tu líder todavía no publica un pitch para esta combinación.
                    </div>
                  );
                }
                return matches.map((p) => {
                  const ch = CHANNELS.find((c) => c.key === p.channel);
                  return (
                    <Link
                      key={p.id}
                      to="/pitches/$pitchId"
                      params={{ pitchId: p.id }}
                      className="block rounded-[14px] border border-white/10 bg-white/[0.03] p-4 hover:border-[#FF6B2B]/50 transition-colors"
                    >
                      <div className="font-['Syne'] font-bold text-white">
                        {RELATIONSHIPS.find((r) => r.key === p.relationship)?.label ?? p.relationship}
                        {" · "}
                        {CLIENT_TYPES.find((t) => t.key === p.client_type)?.label ?? p.client_type}
                      </div>
                      <div className="mt-0.5 text-xs text-white/50 font-['DM_Sans']">
                        {ch?.label ?? p.channel} · v{p.version}
                      </div>
                    </Link>
                  );
                });
              })()}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function Selector({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: Array<{ key: string; label: string }>;
  value: string;
  onChange: (v: string) => void;
}) {
  if (options.length === 0) return null;
  return (
    <div className="mb-3">
      <div className="mb-1.5 text-[11px] uppercase tracking-wide text-white/40 font-['DM_Sans']">
        {label}
      </div>
      <div className="flex flex-wrap gap-1.5">
        {options.map((o) => (
          <button
            key={o.key}
            onClick={() => onChange(o.key)}
            className={[
              "rounded-[99px] px-3 py-1.5 text-xs font-['DM_Sans'] border transition-colors",
              value === o.key
                ? "border-[#FF6B2B] text-[#FF6B2B] bg-[#FF6B2B]/10"
                : "border-white/10 text-white/60 hover:text-white",
            ].join(" ")}
          >
            {o.label}
          </button>
        ))}
      </div>
    </div>
  );
}
