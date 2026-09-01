import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, ArrowRight, Loader2, RefreshCw, Check } from "lucide-react";
import { toast } from "sonner";
import { Link } from "@tanstack/react-router";
import {
  PITCH_STEPS,
  applyAlternative,
  fetchSkillRefs,
  type CompanyPitch,
  type PitchSection,
  type SkillRef,
} from "@/lib/pitches";

type Tab = "porque" | "tecnicas" | "opciones";

export function PitchViewer({
  pitch,
  sections,
  role,
  onRegenerateSection,
  regeneratingStep,
  onSectionsChanged,
}: {
  pitch: CompanyPitch;
  sections: PitchSection[];
  role: "manager" | "seller";
  onRegenerateSection?: (step: number) => void;
  regeneratingStep?: number | null;
  onSectionsChanged?: () => void;
}) {
  // Capa 4: el vendedor arranca en modo vendedor; el manager, en modo detalle.
  const [sellerMode, setSellerMode] = useState(role === "seller");
  const [openTab, setOpenTab] = useState<Record<string, Tab | null>>({});
  const [readMore, setReadMore] = useState<Record<string, boolean>>({});
  const [activeStep, setActiveStep] = useState(sections[0]?.step ?? 1);
  const [skills, setSkills] = useState<Record<string, SkillRef>>({});
  const [applying, setApplying] = useState<string | null>(null);

  const allSkillIds = useMemo(
    () => sections.flatMap((s) => s.skill_ids ?? []),
    [sections],
  );

  useEffect(() => {
    let cancelled = false;
    fetchSkillRefs(allSkillIds)
      .then((m) => !cancelled && setSkills(m))
      .catch((e) => console.error("[pitch] skills", e));
    return () => {
      cancelled = true;
    };
  }, [allSkillIds.join(",")]);

  useEffect(() => {
    const obs = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0];
        if (visible) {
          const step = Number((visible.target as HTMLElement).dataset["step"]);
          if (step) setActiveStep(step);
        }
      },
      { rootMargin: "-20% 0px -60% 0px" },
    );
    document.querySelectorAll("[data-pitch-step]").forEach((el) => obs.observe(el));
    return () => obs.disconnect();
  }, [sections.length]);

  async function chooseAlternative(section: PitchSection, content: string) {
    setApplying(section.id);
    try {
      await applyAlternative(section.id, content);
      toast.success("Opción aplicada al pitch.");
      onSectionsChanged?.();
    } catch (e: any) {
      toast.error(e?.message ?? "No se pudo aplicar la opción.");
    } finally {
      setApplying(null);
    }
  }

  return (
    <div>
      {/* Interruptor modo vendedor */}
      <div className="mb-4 flex items-center justify-end gap-2">
        <span className="text-[11px] text-white/40 font-['DM_Sans']">Modo vendedor</span>
        <button
          onClick={() => setSellerMode((v) => !v)}
          aria-pressed={sellerMode}
          aria-label="Modo vendedor"
          className={[
            "relative h-6 w-11 rounded-[99px] transition-colors",
            sellerMode ? "bg-[#FF6B2B]" : "bg-white/15",
          ].join(" ")}
        >
          <span
            className={[
              "absolute top-0.5 h-5 w-5 rounded-full bg-white transition-all",
              sellerMode ? "left-[22px]" : "left-0.5",
            ].join(" ")}
          />
        </button>
      </div>

      {/* Capa 1: barra de la línea recta */}
      <div className="sticky top-0 z-10 -mx-1 mb-4 flex gap-1 bg-[#08080F]/90 px-1 py-2 backdrop-blur">
        {PITCH_STEPS.map((s) => (
          <div
            key={s.key}
            title={s.label}
            className={[
              "h-1 flex-1 rounded-[99px] transition-colors",
              s.step === activeStep ? "bg-[#FF6B2B]" : "bg-white/12",
            ].join(" ")}
          />
        ))}
      </div>

      <div className="space-y-3">
        {sections.map((s) => {
          const spec = PITCH_STEPS.find((x) => x.key === s.section_key);
          const label = spec?.label ?? s.section_key;
          const tab = openTab[s.id] ?? null;
          const alts = s.alternatives ?? [];
          const ids = s.skill_ids ?? [];
          return (
            <article
              key={s.id}
              data-pitch-step
              data-step={s.step}
              className="rounded-[14px] border border-white/10 bg-white/[0.03] p-4"
            >
              <header className="flex flex-wrap items-center gap-2">
                <span className="text-[12px] font-['Syne'] font-bold uppercase tracking-wide text-white/60">
                  {s.step}. {label}
                </span>
                {s.section_kind === "municion" && (
                  <span className="rounded-[99px] bg-amber-500/15 px-2 py-0.5 text-[10px] text-amber-300 font-['DM_Sans']">
                    munición, no guion
                  </span>
                )}
                {s.warning && (
                  <span className="inline-flex items-center gap-1 rounded-[99px] bg-red-500/15 px-2 py-0.5 text-[10px] text-red-300 font-['DM_Sans']">
                    <AlertTriangle className="h-3 w-3" /> restricción
                  </span>
                )}
                {s.edited_by_manager && (
                  <span className="rounded-[99px] bg-white/10 px-2 py-0.5 text-[10px] text-white/50 font-['DM_Sans']">
                    editado por tu equipo
                  </span>
                )}
                {!sellerMode && role === "manager" && onRegenerateSection && (
                  <button
                    onClick={() => onRegenerateSection(s.step)}
                    disabled={regeneratingStep != null}
                    className="ml-auto inline-flex items-center gap-1 rounded-[99px] border border-white/10 px-2.5 py-1 text-[11px] text-white/60 font-['DM_Sans'] hover:text-white disabled:opacity-50"
                  >
                    {regeneratingStep === s.step ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : (
                      <RefreshCw className="h-3 w-3" />
                    )}
                    Regenerar
                  </button>
                )}
              </header>

              <p
                className={[
                  "mt-2 whitespace-pre-wrap text-white/90 font-['DM_Sans']",
                  sellerMode ? "text-[18px] leading-[1.75]" : "text-[16px] leading-[1.7]",
                ].join(" ")}
              >
                {s.content}
              </p>

              {!sellerMode && (
                <>
                  {/* Capa 2: indicadores */}
                  <div className="mt-3 flex flex-wrap items-center gap-x-2 gap-y-1 text-[13px] text-white/45 font-['DM_Sans']">
                    {s.rationale_short && (
                      <Indicator
                        active={tab === "porque"}
                        onClick={() =>
                          setOpenTab((p) => ({ ...p, [s.id]: tab === "porque" ? null : "porque" }))
                        }
                      >
                        Por qué
                      </Indicator>
                    )}
                    {ids.length > 0 && (
                      <>
                        <span>·</span>
                        <Indicator
                          active={tab === "tecnicas"}
                          onClick={() =>
                            setOpenTab((p) => ({
                              ...p,
                              [s.id]: tab === "tecnicas" ? null : "tecnicas",
                            }))
                          }
                        >
                          {ids.length} técnicas
                        </Indicator>
                      </>
                    )}
                    {alts.length > 0 && (
                      <>
                        <span>·</span>
                        <Indicator
                          active={tab === "opciones"}
                          onClick={() =>
                            setOpenTab((p) => ({
                              ...p,
                              [s.id]: tab === "opciones" ? null : "opciones",
                            }))
                          }
                        >
                          {alts.length} opciones
                        </Indicator>
                      </>
                    )}
                  </div>

                  {/* Capa 3: el detalle */}
                  {tab === "porque" && (
                    <div className="mt-3 rounded-[10px] border border-white/10 bg-black/30 p-3">
                      <p className="text-[13px] text-white/75 font-['DM_Sans']">
                        {s.rationale_short}
                      </p>
                      {s.rationale_long && (
                        <>
                          {readMore[s.id] && (
                            <p className="mt-2 whitespace-pre-wrap text-[13px] leading-relaxed text-white/60 font-['DM_Sans']">
                              {s.rationale_long}
                            </p>
                          )}
                          <button
                            onClick={() => setReadMore((p) => ({ ...p, [s.id]: !p[s.id] }))}
                            className="mt-2 text-[12px] text-[#FF6B2B] font-['DM_Sans']"
                          >
                            {readMore[s.id] ? "Menos" : "Leer más"}
                          </button>
                        </>
                      )}
                    </div>
                  )}

                  {tab === "tecnicas" && (
                    <div className="mt-3 space-y-1.5 rounded-[10px] border border-white/10 bg-black/30 p-3">
                      {ids.map((id) => {
                        const sk = skills[id];
                        const text = sk
                          ? `${sk.name} · ${sk.code} · Mundo ${sk.world_id_introduced}`
                          : id;
                        return sk?.node_id ? (
                          <Link
                            key={id}
                            to="/nodo/$nodeId"
                            params={{ nodeId: sk.node_id }}
                            className="flex items-center gap-1.5 text-[13px] text-white/75 font-['DM_Sans'] hover:text-[#FF6B2B]"
                          >
                            {text}
                            <ArrowRight className="h-3 w-3" />
                          </Link>
                        ) : (
                          <div key={id} className="text-[13px] text-white/55 font-['DM_Sans']">
                            {text}
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {tab === "opciones" && (
                    <div className="mt-3 space-y-2">
                      {alts.map((a) => {
                        const inUse = (s.content ?? "").trim() === a.content.trim();
                        return (
                          <div
                            key={a.rank}
                            className="rounded-[10px] border border-white/10 bg-black/30 p-3"
                          >
                            <div className="flex items-center gap-2">
                              <span className="text-[12px] font-['Syne'] font-bold text-white">
                                #{a.rank} · {a.label}
                              </span>
                              {(inUse || (a.rank === 1 && !s.edited_by_manager)) && (
                                <span className="inline-flex items-center gap-1 rounded-[99px] bg-[#FF6B2B]/15 px-2 py-0.5 text-[10px] text-[#FF6B2B] font-['DM_Sans']">
                                  <Check className="h-3 w-3" /> en uso
                                </span>
                              )}
                            </div>
                            <p className="mt-1 whitespace-pre-wrap text-[13px] text-white/75 font-['DM_Sans']">
                              {a.content}
                            </p>
                            {a.why_ranked && (
                              <p className="mt-1 text-[12px] text-white/40 font-['DM_Sans']">
                                {a.why_ranked}
                              </p>
                            )}
                            {role === "manager" && !inUse && (
                              <button
                                onClick={() => chooseAlternative(s, a.content)}
                                disabled={applying === s.id}
                                className="mt-2 rounded-[99px] border border-[#FF6B2B]/50 px-3 py-1 text-[12px] text-[#FF6B2B] font-['DM_Sans'] disabled:opacity-50"
                              >
                                {applying === s.id ? "Aplicando…" : "Usar esta"}
                              </button>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {s.warning && (
                    <div className="mt-3 flex gap-2 rounded-[10px] border border-red-500/30 bg-red-500/10 p-2 text-[12px] text-red-200 font-['DM_Sans']">
                      <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                      <span>{s.warning}</span>
                    </div>
                  )}
                </>
              )}
            </article>
          );
        })}
      </div>

      {!sellerMode && (pitch.missing_data?.length ?? 0) > 0 && (
        <div className="mt-4 rounded-[14px] border border-[#FF6B2B]/30 bg-[#FF6B2B]/5 p-3">
          <div className="font-['Syne'] font-bold text-white text-sm">Para afinarlo, dime:</div>
          <ul className="mt-2 list-disc space-y-1 pl-4 text-xs text-white/70 font-['DM_Sans']">
            {pitch.missing_data!.map((q, i) => (
              <li key={i}>{q}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function Indicator({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={active ? "text-[#FF6B2B]" : "hover:text-white transition-colors"}
    >
      {children}
    </button>
  );
}
