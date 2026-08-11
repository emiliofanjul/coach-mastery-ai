import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { resolveBrandingUrl, uploadBrandingImage } from "@/lib/image-upload";

/**
 * Subida de imagen con vista previa. Redimensiona en el cliente y devuelve
 * la ruta guardable (bucket privado "branding") al padre.
 */
export function ImageUploader({
  value,
  kind,
  label,
  hint,
  shape = "circle",
  onChange,
}: {
  value: string | null;
  kind: "logo" | "avatar";
  label: string;
  hint?: string;
  shape?: "circle" | "square";
  onChange: (path: string) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void resolveBrandingUrl(value).then((url) => {
      if (!cancelled) setPreview(url);
    });
    return () => {
      cancelled = true;
    };
  }, [value]);

  async function handleFile(file: File | undefined) {
    if (!file) return;
    setBusy(true);
    try {
      const path = await uploadBrandingImage(file, kind);
      onChange(path);
      toast.success("Imagen subida.");
    } catch (e: any) {
      toast.error(e?.message ?? "No se pudo subir la imagen.");
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <div>
      <label className="block text-xs uppercase tracking-wide text-white/50 font-['DM_Sans'] mb-2">
        {label}
      </label>
      <div className="flex items-center gap-4">
        <div
          className={`h-20 w-20 shrink-0 overflow-hidden border border-white/10 bg-black/40 ${
            shape === "circle" ? "rounded-full" : "rounded-[14px]"
          }`}
        >
          {preview ? (
            <img src={preview} alt={label} className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-[0.65rem] text-white/30 font-['DM_Sans'] text-center px-2">
              Sin imagen
            </div>
          )}
        </div>
        <div className="flex-1">
          <button
            type="button"
            disabled={busy}
            onClick={() => inputRef.current?.click()}
            className="rounded-[99px] border border-[#FF6B2B]/40 bg-[#FF6B2B]/10 px-4 py-2 text-sm font-['Syne'] font-bold text-[#FF6B2B] hover:bg-[#FF6B2B]/20 disabled:opacity-50"
          >
            {busy ? "Subiendo…" : preview ? "Cambiar imagen" : "Subir imagen"}
          </button>
          {hint && (
            <div className="mt-2 text-[0.7rem] text-white/40 font-['DM_Sans']">{hint}</div>
          )}
        </div>
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => void handleFile(e.target.files?.[0])}
      />
    </div>
  );
}
