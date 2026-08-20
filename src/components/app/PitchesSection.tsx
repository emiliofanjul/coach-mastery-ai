import { useEffect, useState } from "react";
import { FileText, Sparkles, Loader2, AlertTriangle, ChevronDown } from "lucide-react";
import { toast } from "sonner";
import { useServerFn } from "@tanstack/react-start";
import { Button } from "@/components/ui/button";
import { generatePitchSection } from "@/lib/pitch-generator.functions";
import {
  CHANNELS,
  CLIENT_TYPES,
  PITCH_STEPS,
  activatePitch,
  fetchCompanyPitches,
  fetchPitchSections,
  statusLabel,
  type Channel,
  type ClientType,
  type CompanyPitch,
  type PitchSection,
} from "@/lib/pitches";

export function PitchesSection({
  companyId,
  userId,
}: {
  companyId: string;
  userId: string;
}) {
  const runGenerateSection = useServerFn(generatePitchSection);
  const [pitches, setPitches] = useState<CompanyPitch[]>([]);
  const [loading, setLoading] = useState(true);
  const [channel, setChannel] = useState<Record<ClientType, Channel>>({
    nuevo: "presencial",
    recurrente: "presencial",
    autoconsumo: "presencial",
    distribuidor: "presencial",
  });
  const [busy, setBusy] = useState<ClientType | null>(null);
  const [generating, setGenerating] = useState<string | null>(null);
  const [sections, setSections] = useState<Record<string, PitchSection[]>>({});
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [progress, setProgress] = useState<{ done: number; label: string } | null>(null);


  useEffect(() => {
    let cancelled = false;
    fetchCompanyPitches(companyId)
      .then(async (rows) => {
        if (cancelled) return;
        setPitches(rows);
        const all = await Promise.all(
          rows.map(async (p) => [p.id, await fetchPitchSections(p.id)] as const),
        );
        if (!cancelled) {
          setSections(Object.fromEntries(all.map(([id, s]) => [id, s.filter((x) => x.content)])));
        }
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

  async function handleGenerate(pitchId: string) {
    setGenerating(pitchId);
    setProgress({ done: 0, label: PITCH_STEPS[0]?.label ?? "" });
    try {
      for (let i = 0; i < PITCH_STEPS.length; i++) {
        const stepSpec = PITCH_STEPS[i]!;
        setProgress({ done: i, label: stepSpec.label });
        const res: any = await runGenerateSection({ data: { pitchId, step: i + 1 } });
        if (!res?.ok) {
          const detail =
            res?.failed_validations?.join(" · ") ?? res?.detail ?? res?.error ?? "Error desconocido";
          toast.error(`Closer se atoró en "${stepSpec.label}": ${detail}`);
          break;
        }
        const rows = await fetchPitchSections(pitchId);
        setSections((prev) => ({ ...prev, [pitchId]: rows.filter((x) => x.content) }));
        setProgress({ done: i + 1, label: stepSpec.label });
      }
      const fresh = await fetchCompanyPitches(companyId);
      setPitches(fresh);
    } catch (e: any) {
      toast.error(e?.message ?? "No se pudo generar el pitch.");
    } finally {
      setGenerating(null);
      setProgress(null);
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
                        onClick={() => handleGenerate(pitch.id)}
                        disabled={generating !== null}
                        className="ml-auto rounded-[99px] bg-[#FF6B2B] hover:bg-[#ff7a42] text-black font-['Syne'] font-bold disabled:opacity-60"
                      >
                        {generating === pitch.id ? (
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        ) : (
                          <Sparkles className="h-4 w-4 mr-2" />
                        )}
                        {generating === pitch.id
                          ? `Escribiendo… (${Math.min((progress?.done ?? 0) + 1, PITCH_STEPS.length)} de ${PITCH_STEPS.length})`
                          : (sections[pitch.id]?.length ?? 0) > 0
                            ? "Regenerar con Closer"
                            : "Generar con Closer"}
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

                {pitch && generating === pitch.id && (
                  <div className="mt-3 rounded-[14px] border border-[#FF6B2B]/30 bg-[#FF6B2B]/5 p-3 text-xs text-white/70 font-['DM_Sans']">
                    Escribiendo la sección «{progress?.label ?? PITCH_STEPS[0]?.label}»…{" "}
                    ({Math.min((progress?.done ?? 0) + 1, PITCH_STEPS.length)} de {PITCH_STEPS.length})
                    <div className="mt-2 h-1 w-full overflow-hidden rounded-[99px] bg-white/10">
                      <div
                        className="h-full bg-[#FF6B2B] transition-all"
                        style={{
                          width: `${((progress?.done ?? 0) / PITCH_STEPS.length) * 100}%`,
                        }}
                      />
                    </div>
                  </div>
                )}

                {pitch && (sections[pitch.id]?.length ?? 0) > 0 && (
                  <div className="mt-4 space-y-2">
                    {sections[pitch.id]!.map((s) => {
                      const label =
                        PITCH_STEPS.find((x) => x.key === s.section_key)?.label ?? s.section_key;
                      const open = expanded[s.id] === true;
                      return (
                        <div
                          key={s.id}
                          className="rounded-[14px] border border-white/10 bg-white/[0.02] p-3"
                        >
                          <div className="flex items-center gap-2">
                            <span className="font-['Syne'] font-bold text-white text-sm">
                              {s.step}. {label}
                            </span>
                            {s.section_kind === "municion" && (
                              <span className="rounded-[99px] bg-white/10 px-2 py-0.5 text-[10px] text-white/60 font-['DM_Sans']">
                                munición
                              </span>
                            )}
                          </div>
                          {s.rationale_short && (
                            <p className="mt-1 text-[11px] text-[#FF6B2B] font-['DM_Sans']">
                              {s.rationale_short}
                            </p>
                          )}
                          {s.warning && (
                            <div className="mt-2 flex gap-2 rounded-[10px] border border-yellow-500/30 bg-yellow-500/10 p-2 text-[11px] text-yellow-200 font-['DM_Sans']">
                              <AlertTriangle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                              <span>{s.warning}</span>
                            </div>
                          )}
                          <p className="mt-2 whitespace-pre-wrap text-sm text-white/80 font-['DM_Sans']">
                            {s.content}
                          </p>
                          {(s.rationale_long || (s.alternatives?.length ?? 0) > 0) && (
                            <button
                              onClick={() =>
                                setExpanded((prev) => ({ ...prev, [s.id]: !open }))
                              }
                              className="mt-2 inline-flex items-center gap-1 text-[11px] text-white/50 font-['DM_Sans'] hover:text-white"
                            >
                              <ChevronDown
                                className={`h-3.5 w-3.5 transition-transform ${open ? "rotate-180" : ""}`}
                              />
                              {open ? "Ocultar" : "Leer más"}
                            </button>
                          )}
                          {open && (
                            <div className="mt-2 space-y-3">
                              {s.rationale_long && (
                                <p className="whitespace-pre-wrap text-xs text-white/60 font-['DM_Sans']">
                                  {s.rationale_long}
                                </p>
                              )}
                              {(s.alternatives ?? []).map((a) => (
                                <div
                                  key={a.rank}
                                  className="rounded-[10px] border border-white/10 bg-black/30 p-2.5"
                                >
                                  <div className="text-[11px] font-['Syne'] font-bold text-white">
                                    #{a.rank} · {a.label}
                                  </div>
                                  <p className="mt-1 whitespace-pre-wrap text-xs text-white/70 font-['DM_Sans']">
                                    {a.content}
                                  </p>
                                  {a.why_ranked && (
                                    <p className="mt-1 text-[11px] text-white/40 font-['DM_Sans']">
                                      {a.why_ranked}
                                    </p>
                                  )}
                                </div>
                              ))}
                              {(s.skill_ids?.length ?? 0) > 0 && (
                                <div className="flex flex-wrap gap-1">
                                  {s.skill_ids!.map((id) => (
                                    <span
                                      key={id}
                                      className="rounded-[99px] bg-white/5 px-2 py-0.5 text-[10px] text-white/40 font-['DM_Sans']"
                                    >
                                      {id}
                                    </span>
                                  ))}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}

                    {(pitch.missing_data?.length ?? 0) > 0 && (
                      <div className="rounded-[14px] border border-[#FF6B2B]/30 bg-[#FF6B2B]/5 p-3">
                        <div className="font-['Syne'] font-bold text-white text-sm">
                          Para afinarlo, dime:
                        </div>
                        <ul className="mt-2 list-disc space-y-1 pl-4 text-xs text-white/70 font-['DM_Sans']">
                          {pitch.missing_data!.map((q, i) => (
                            <li key={i}>{q}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}
              </div>

            );
          })}
        </div>
      )}
    </section>
  );
}
