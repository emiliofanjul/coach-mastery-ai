import { createFileRoute, useParams } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AppHeader } from "@/components/app/AppShell";
import { PitchViewer } from "@/components/pitch/PitchViewer";
import { restGetMaybeSingle } from "@/lib/supabase-rest";
import {
  CHANNELS,
  pitchLabel,
  fetchPitchSections,
  type CompanyPitch,
  type PitchSection,
} from "@/lib/pitches";

export const Route = createFileRoute("/pitches/$pitchId")({
  head: () => ({
    meta: [
      { title: "Pitch — Closer" },
      {
        name: "description",
        content: "Detalle del pitch publicado por tu líder de equipo: pasos, guion y municiones.",
      },
      { property: "og:title", content: "Pitch — Closer" },
      {
        property: "og:description",
        content: "Detalle del pitch publicado por tu líder de equipo.",
      },
      { property: "og:type", content: "article" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: PitchDetailPage,
});

function PitchDetailPage() {
  const { pitchId } = useParams({ from: "/pitches/$pitchId" });
  const [loading, setLoading] = useState(true);
  const [pitch, setPitch] = useState<CompanyPitch | null>(null);
  const [sections, setSections] = useState<PitchSection[]>([]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const p = await restGetMaybeSingle<CompanyPitch>(
        `company_pitches?select=id,company_id,relationship,client_type,channel,status,version,published_at,updated_at,missing_data&id=eq.${pitchId}&status=eq.published&limit=1`,
      );
      const rows = p ? await fetchPitchSections(p.id) : [];
      if (cancelled) return;
      setPitch(p);
      setSections(rows.filter((r) => r.content));
      setLoading(false);
    })().catch((e) => {
      console.error("[pitch] load", e);
      if (!cancelled) setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [pitchId]);

  const type = pitch ? { label: pitchLabel(pitch) } : null;
  const ch = CHANNELS.find((c) => c.key === pitch?.channel);

  return (
    <div className="min-h-screen bg-[#08080F] text-white">
      <AppHeader title="Pitch" back={{ to: "/pitches", label: "Mis Pitches" }} />
      <div className="mx-auto w-full max-w-[560px] px-5 pt-2 pb-24">
        {loading ? (
          <div className="text-sm text-white/50 font-['DM_Sans']">Cargando pitch…</div>
        ) : !pitch ? (
          <div className="rounded-[14px] border border-dashed border-white/10 bg-white/[0.02] p-8 text-center text-sm text-white/60 font-['DM_Sans']">
            Este pitch no está publicado.
          </div>
        ) : (
          <>
            <h1 className="font-['Syne'] text-2xl font-black tracking-tight">
              {type?.label ?? pitch.client_type}
            </h1>
            <p className="mb-4 mt-0.5 text-xs text-white/50 font-['DM_Sans']">
              {ch?.label ?? pitch.channel} · v{pitch.version}
            </p>
            <PitchViewer pitch={pitch} sections={sections} role="seller" />
          </>
        )}
      </div>
    </div>
  );
}
