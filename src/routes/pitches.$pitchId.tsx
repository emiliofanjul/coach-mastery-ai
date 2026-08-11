import { createFileRoute, useParams } from "@tanstack/react-router";
import { AppHeader } from "@/components/app/AppShell";

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

  return (
    <div className="min-h-screen bg-[#08080F] text-white">
      <AppHeader title="Pitch" back={{ to: "/pitches", label: "Mis Pitches" }} />
      <div className="mx-auto w-full max-w-[560px] px-5 pt-2 pb-24">
        <div className="rounded-[14px] border border-dashed border-white/10 bg-white/[0.02] p-8 text-center">
          <div className="text-xs uppercase tracking-wide text-white/40 font-['DM_Sans']">
            Próximamente
          </div>
          <div className="mt-2 text-sm text-white/60 font-['DM_Sans']">
            La lectura interactiva del pitch llega pronto.
          </div>
          <div className="mt-3 text-[11px] text-white/25 font-['DM_Sans'] break-all">{pitchId}</div>
        </div>
      </div>
    </div>
  );
}
