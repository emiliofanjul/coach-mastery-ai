// Subida de imágenes (logo de empresa / foto de perfil) al bucket privado
// "branding". Redimensionamos en el cliente antes de subir para no guardar
// fotos de 5 MB: máximo 512 px por lado, JPEG calidad 0.85.
//
// El bucket es privado, así que guardamos la RUTA (`<uid>/logo-...jpg`) en la
// base de datos y resolvemos una URL firmada al renderizar.

import { getStoredSupabaseSession } from "@/lib/browser-auth-session";
import { createSignedStorageUrl, functionAuthHeaders } from "@/lib/supabase-rest";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;
export const BRANDING_BUCKET = "branding";

export const MAX_UPLOAD_BYTES = 8 * 1024 * 1024; // 8 MB antes de redimensionar

/** Redimensiona la imagen a `max` px por lado y devuelve un JPEG. */
export async function resizeImage(file: File, max = 512): Promise<Blob> {
  const dataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("No se pudo leer la imagen."));
    reader.readAsDataURL(file);
  });

  const img = await new Promise<HTMLImageElement>((resolve, reject) => {
    const el = new Image();
    el.onload = () => resolve(el);
    el.onerror = () => reject(new Error("Archivo de imagen no válido."));
    el.src = dataUrl;
  });

  const scale = Math.min(1, max / Math.max(img.width, img.height));
  const w = Math.max(1, Math.round(img.width * scale));
  const h = Math.max(1, Math.round(img.height * scale));

  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("No se pudo procesar la imagen.");
  // Fondo blanco: los PNG con transparencia quedarían negros en JPEG.
  ctx.fillStyle = "#FFFFFF";
  ctx.fillRect(0, 0, w, h);
  ctx.drawImage(img, 0, 0, w, h);

  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, "image/jpeg", 0.85),
  );
  if (!blob) throw new Error("No se pudo procesar la imagen.");
  return blob;
}

/**
 * Sube la imagen al bucket privado y devuelve la ruta guardable en BD.
 * `kind` sirve solo para nombrar el archivo (logo / avatar).
 */
export async function uploadBrandingImage(
  file: File,
  kind: "logo" | "avatar",
): Promise<string> {
  if (!file.type.startsWith("image/")) {
    throw new Error("Selecciona un archivo de imagen.");
  }
  if (file.size > MAX_UPLOAD_BYTES) {
    throw new Error("La imagen pesa demasiado (máximo 8 MB).");
  }
  const session = getStoredSupabaseSession();
  if (!session) throw new Error("Tu sesión expiró. Inicia sesión de nuevo.");

  const blob = await resizeImage(file, kind === "logo" ? 512 : 384);
  const path = `${session.userId}/${kind}-${Date.now()}.jpg`;

  const res = await fetch(
    `${SUPABASE_URL}/storage/v1/object/${BRANDING_BUCKET}/${path}`,
    {
      method: "POST",
      headers: functionAuthHeaders(session.accessToken, {
        "Content-Type": "image/jpeg",
        "x-upsert": "true",
      }),
      body: blob,
    },
  );
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`No se pudo subir la imagen. ${body.slice(0, 120)}`);
  }
  return path;
}

/**
 * Convierte lo guardado en BD a una URL mostrable.
 * Acepta URLs http(s) heredadas y rutas del bucket privado.
 */
export async function resolveBrandingUrl(
  value: string | null | undefined,
): Promise<string | null> {
  const v = (value ?? "").trim();
  if (!v) return null;
  if (/^https?:\/\//i.test(v) || v.startsWith("data:")) return v;
  try {
    return await createSignedStorageUrl(BRANDING_BUCKET, v, { expiresIn: 60 * 60 * 6 });
  } catch (e) {
    console.error("[branding] signed url failed", e);
    return null;
  }
}
