import { useMemo, useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import {
  dropMissingTopic,
  normalizeMissingData,
  saveBrainAnswer,
  type CompanyPitch,
  type MissingItem,
} from "@/lib/pitches";

/**
 * Los datos que le faltaron a Closer, agrupados en temas y contestables aquí
 * mismo. Al guardar: la respuesta entra al cerebro de la empresa y se ofrece
 * regenerar SOLO las secciones que ese dato desbloquea.
 */
export function MissingDataPanel({
  pitch,
  onRegenerateSections,
  onChanged,
}: {
  pitch: CompanyPitch;
  onRegenerateSections: (sectionKeys: string[]) => void;
  onChanged: () => void;
}) {
  const items = useMemo(() => normalizeMissingData(pitch.missing_data), [pitch.missing_data]);
  const [expanded, setExpanded] = useState(false);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState<string | null>(null);

  if (items.length === 0) return null;

  const altas = items.filter((i) => i.prioridad === "alta").slice(0, 3);
  const resto = items.filter((i) => !altas.includes(i));
  const visibles = expanded ? [...altas, ...resto] : altas.length > 0 ? altas : items.slice(0, 3);

  async function save(item: MissingItem) {
    const answer = (answers[item.brain_key] ?? "").trim();
    if (!answer) return;
    setSaving(item.brain_key);
    try {
      await saveBrainAnswer(pitch.company_id, item.brain_key, answer);
      await dropMissingTopic(pitch.id, pitch.missing_data, item);
      toast.success("Guardado en el cerebro de tu empresa.");
      onChanged();
      if (item.secciones_afectadas.length > 0) onRegenerateSections(item.secciones_afectadas);
    } catch (e: any) {
      toast.error(e?.message ?? "No se pudo guardar.");
    } finally {
      setSaving(null);
    }
  }

  return (
    <div className="mt-4 rounded-[14px] border border-[#FF6B2B]/30 bg-[#FF6B2B]/5 p-4">
      <div className="font-['Syne'] text-sm font-bold text-white">Para afinarlo, dime:</div>
      <p className="mt-0.5 text-[12px] text-white/50 font-['DM_Sans']">
        Contéstalo aquí. Se guarda en el cerebro de tu empresa y solo se regenera lo que
        ese dato desbloquea.
      </p>

      <div className="mt-3 space-y-3">
        {visibles.map((item) => {
          const n = item.secciones_afectadas.length;
          return (
            <div key={item.brain_key} className="rounded-[10px] border border-white/10 bg-black/30 p-3">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-['Syne'] text-[13px] font-bold text-white">{item.tema}</span>
                {item.prioridad === "alta" && (
                  <span className="rounded-[99px] bg-[#FF6B2B]/15 px-2 py-0.5 text-[10px] text-[#FF6B2B] font-['DM_Sans']">
                    alta
                  </span>
                )}
              </div>
              <p className="mt-1 text-[13px] text-white/75 font-['DM_Sans']">{item.pregunta}</p>
              <p className="mt-1 text-[12px] text-white/40 font-['DM_Sans']">
                Desbloquea: {item.desbloquea}
              </p>
              <textarea
                value={answers[item.brain_key] ?? ""}
                onChange={(e) =>
                  setAnswers((p) => ({ ...p, [item.brain_key]: e.target.value }))
                }
                rows={2}
                placeholder="Tu respuesta"
                className="mt-2 w-full resize-y rounded-[10px] border border-white/10 bg-black/40 p-2 text-[13px] text-white/90 font-['DM_Sans'] outline-none focus:border-[#FF6B2B]/50"
              />
              <div className="mt-2 flex items-center gap-2">
                <button
                  onClick={() => save(item)}
                  disabled={saving === item.brain_key || !(answers[item.brain_key] ?? "").trim()}
                  className="inline-flex items-center gap-1.5 rounded-[99px] bg-[#FF6B2B] px-3.5 py-1.5 text-[12px] font-['Syne'] font-bold text-black disabled:opacity-40"
                >
                  {saving === item.brain_key && <Loader2 className="h-3 w-3 animate-spin" />}
                  Guardar
                </button>
                <span className="text-[11px] text-white/40 font-['DM_Sans']">
                  {n === 0
                    ? "no regenera nada"
                    : n === 1
                      ? "regenera 1 sección"
                      : `regenera ${n} secciones`}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {resto.length > 0 && (
        <button
          onClick={() => setExpanded((v) => !v)}
          className="mt-3 text-[12px] text-[#FF6B2B] font-['DM_Sans']"
        >
          {expanded ? "Ver menos" : `Ver más (${resto.length})`}
        </button>
      )}
    </div>
  );
}
