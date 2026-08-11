import { useEffect, useState } from "react";
import { FileText, Sparkles, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  CHANNELS,
  CLIENT_TYPES,
  PITCH_STEPS,
  activatePitch,
  fetchCompanyPitches,
  statusLabel,
  type Channel,
  type ClientType,
  type CompanyPitch,
} from "@/lib/pitches";

export function PitchesSection({
  companyId,
  userId,
}: {
  companyId: string;
  userId: string;
}) {
  const [pitches, setPitches] = useState<CompanyPitch[]>([]);
  const [loading, setLoading] = useState(true);
  const [channel, setChannel] = useState<Record<ClientType, Channel>>({
    nuevo: "presencial",
    recurrente: "presencial",
    autoconsumo: "presencial",
    distribuidor: "presencial",
  });
  const [busy, setBusy] = useState<ClientType | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetchCompanyPitches(companyId)
      .then((rows) => {
        if (!cancelled) setPitches(rows);
      })
      .catch((e) => console.error("[pitches] load", e))
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [companyId]);

  function pitchFor(type: ClientType, ch: Channel) {
    return pitches.find((p) => p.client_type === type && p.channel === ch) ?? null;
  }

  async function handleActivate(type: ClientType) {
    const ch = channel[type];
    setBusy(type);
    try {
      const created = await activatePitch({
        companyId,
        clientType: type,
        channel: ch,
        createdBy: userId,
      });
      setPitches((prev) => [...prev, created]);
      toast.success("Pitch creado en borrador con sus 6 pasos.");
    } catch (e: any) {
      toast.error(e?.message ?? "No se pudo activar el pitch.");
    } finally {
      setBusy(null);
    }
  }

  return (
    <section className="mb-6 rounded-[14px] border border-white/10 bg-white/[0.03] p-5">
      <div className="flex items-center gap-2 mb-1">
        <FileText className="h-4 w-4 text-[#FF6B2B]" />
        <h2 className="font-['Syne'] font-bold text-white text-lg">Pitches</h2>
      </div>
      <p className="mb-4 text-xs text-white/50 font-['DM_Sans']">
        El guion de tu empresa, por tipo de cliente. Actívalo aquí; tu equipo lo verá cuando lo publiques.
      </p>

      {loading ? (
        <div className="text-sm text-white/50 font-['DM_Sans']">Cargando pitches…</div>
      ) : (
        <div className="grid grid-cols-1 gap-3">
          {CLIENT_TYPES.map((t) => {
            const ch = channel[t.key];
            const pitch = pitchFor(t.key, ch);
            const anyActive = pitches.some((p) => p.client_type === t.key);
            return (
              <div
                key={t.key}
                className="rounded-[14px] border border-white/10 bg-black/30 p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="font-['Syne'] font-bold text-white">{t.label}</div>
                    <div className="mt-0.5 text-xs text-white/50 font-['DM_Sans']">{t.blurb}</div>
                  </div>
                  <span
                    className={[
                      "shrink-0 rounded-[99px] px-2.5 py-1 text-[11px] font-['DM_Sans']",
                      pitch?.status === "published"
                        ? "bg-[#FF6B2B]/15 text-[#FF6B2B]"
                        : pitch
                          ? "bg-white/10 text-white/70"
                          : "bg-white/5 text-white/40",
                    ].join(" ")}
                  >
                    {statusLabel(pitch?.status ?? null)}
                  </span>
                </div>

                {anyActive && (
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {CHANNELS.map((c) => (
                      <button
                        key={c.key}
                        onClick={() => setChannel((prev) => ({ ...prev, [t.key]: c.key }))}
                        className={[
                          "rounded-[99px] px-3 py-1.5 text-xs font-['DM_Sans'] border transition-colors",
                          ch === c.key
                            ? "border-[#FF6B2B] text-[#FF6B2B] bg-[#FF6B2B]/10"
                            : "border-white/10 text-white/60 hover:text-white",
                        ].join(" ")}
                      >
                        {c.label}
                      </button>
                    ))}
                  </div>
                )}

                <div className="mt-3 flex flex-wrap items-center gap-2">
                  {pitch ? (
                    <>
                      <span className="text-[11px] text-white/40 font-['DM_Sans']">
                        {PITCH_STEPS.length} pasos · v{pitch.version}
                      </span>
                      <Button
                        disabled
                        title="Disponible pronto"
                        className="ml-auto rounded-[99px] bg-white/5 text-white/40 font-['Syne'] font-bold hover:bg-white/5"
                      >
                        <Sparkles className="h-4 w-4 mr-2" />
                        Generar con Closer · Disponible pronto
                      </Button>
                    </>
                  ) : (
                    <Button
                      onClick={() => handleActivate(t.key)}
                      disabled={busy === t.key}
                      className="ml-auto rounded-[99px] bg-[#FF6B2B] hover:bg-[#ff7a42] text-black font-['Syne'] font-bold"
                    >
                      {busy === t.key ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : null}
                      Activar
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
