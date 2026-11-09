import { useEffect, useRef, useState } from "react";
import { mmss, type TurnoAudio } from "@/lib/voz/turnos-audio";

// Reproductor por turnos (sept-2026). Lo usan la página del vendedor (manager) y el panel «Prácticas»
// del equipo de Closer (mensaje 162).
// La grabación de la práctica es un solo archivo con los turnos del vendedor,
// y cada turno trae dónde empieza, dónde termina y qué dijo. El manager ve la
// lista y, con un clic, escucha exactamente ese turno.
export function ReproductorPorTurnos({ src, turnos }: { src: string; turnos: TurnoAudio[] }) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const finRef = useRef<number | null>(null);
  const [activo, setActivo] = useState<number | null>(null);

  useEffect(() => {
    const a = audioRef.current;
    if (!a) return;
    const alAvanzar = () => {
      if (finRef.current !== null && a.currentTime >= finRef.current) {
        a.pause();
        finRef.current = null;
        setActivo(null);
      }
    };
    const alPausar = () => { if (finRef.current === null) setActivo(null); };
    a.addEventListener("timeupdate", alAvanzar);
    a.addEventListener("pause", alPausar);
    return () => {
      a.removeEventListener("timeupdate", alAvanzar);
      a.removeEventListener("pause", alPausar);
    };
  }, [src]);

  function escuchar(t: TurnoAudio) {
    const a = audioRef.current;
    if (!a) return;
    finRef.current = t.fin_seg;
    a.currentTime = t.inicio_seg;
    setActivo(t.turno);
    void a.play().catch(() => { finRef.current = null; setActivo(null); });
  }

  return (
    <div className="flex flex-col gap-2">
      <audio ref={audioRef} controls src={src} className="w-full" onPlay={() => { if (finRef.current === null) setActivo(null); }} />
      {turnos.length > 0 && (
        <div className="flex flex-col gap-1.5">
          <div className="text-[11px] text-white/40">Toca un turno para escuchar solo ese momento.</div>
          {turnos.map((t, i) => (
            <button
              key={`${t.turno}-${i}`}
              onClick={() => escuchar(t)}
              className={`text-left rounded-[10px] border px-3 py-2 flex items-start gap-2 transition-colors ${activo === t.turno ? "border-[var(--c-primary)] bg-[var(--c-primary)]/10" : "border-white/10 bg-black/20 hover:bg-white/[0.04]"}`}
            >
              <span className="text-[var(--c-primary)] text-xs mt-0.5">{activo === t.turno ? "❚❚" : "▶"}</span>
              <span className="min-w-0 flex-1">
                <span className="block text-[10px] uppercase tracking-widest text-white/40">
                  Turno {i + 1} · {mmss(t.inicio_seg)}–{mmss(t.fin_seg)}
                </span>
                <span className="block text-xs text-white/80 line-clamp-2">{t.texto ?? "(sin texto)"}</span>
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
