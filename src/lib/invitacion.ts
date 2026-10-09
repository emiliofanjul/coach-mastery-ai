// La invitación al equipo (oct-2026, pedido de Emilio): el manager comparte por
// WhatsApp o por correo una invitación con una liga que lleva el código ya
// puesto. El vendedor entra desde un mensaje de su jefe, toca la liga y solo
// llena su nombre, correo y contraseña. Antes había un botón de "invitar por
// correo" que no enviaba nada.
//
// El correo sale desde la cuenta del propio manager (su app de correo): llega
// de alguien que el vendedor conoce, que es justo lo que da confianza.

/** Liga que abre Closer con el código ya puesto. */
export function ligaDeInvitacion(origen: string, codigo: string): string {
  return `${origen.replace(/\/+$/, "")}/unirme?codigo=${encodeURIComponent(codigo.trim())}`;
}

export function mensajeDeInvitacion(
  empresa: string,
  liga: string,
  codigo: string,
  vence?: string | null,
): string {
  const equipo = empresa.trim() ? `el equipo de ${empresa.trim()}` : "nuestro equipo";
  const venceTexto = vence
    ? ` (vence el ${new Date(vence).toLocaleDateString("es-MX", { day: "numeric", month: "long" })})`
    : "";
  return [
    `Te invito a Closer, la app donde ${equipo} va a practicar ventas.`,
    `Crea tu cuenta aquí: ${liga}`,
    `Si te lo pide, nuestro código de empresa es ${codigo.trim()}${venceTexto}.`,
  ].join("\n\n");
}

export const ASUNTO_CORREO = "Tu invitación a Closer";

export function ligaWhatsApp(texto: string): string {
  return `https://wa.me/?text=${encodeURIComponent(texto)}`;
}

export function ligaCorreo(asunto: string, cuerpo: string, para = ""): string {
  return `mailto:${encodeURIComponent(para.trim())}?subject=${encodeURIComponent(asunto)}&body=${encodeURIComponent(cuerpo)}`;
}

/** El código que trae la liga /unirme?codigo=… (solo letras, números y guiones). */
export function codigoDeLiga(valor: unknown): string | null {
  if (typeof valor !== "string") return null;
  const c = valor.trim().toUpperCase();
  return /^[A-Z0-9-]{4,24}$/.test(c) ? c : null;
}

/** El máximo de un código: prefijo de hasta 8 + guion + 6. Con holgura. */
export const LARGO_MAXIMO_CODIGO = 20;

export type ResultadoValidacion =
  { status: "valid"; companyName?: string } | { status: "invalid" | "locked"; message: string };

/**
 * Lo que ve el vendedor al escribir el código (oct-2026). Antes, cualquier
 * respuesta que no fuera "locked", "expired" o "used" decía "Código no válido",
 * y un error de la base decía "No pudimos validar el código" sin decir por qué:
 * así se escondió que la base no dejaba validar a quien aún no tiene cuenta.
 */
export function resultadoDeValidacion(
  data: { valid?: boolean; reason?: string; company_name?: string } | null,
  error: { message?: string; code?: string } | null,
): ResultadoValidacion {
  if (error || !data) {
    const detalle = error?.code || error?.message;
    return {
      status: "invalid",
      message: `No pudimos revisar el código${detalle ? ` (${detalle})` : ""}. Intenta de nuevo en un momento.`,
    };
  }
  if (data.valid) return { status: "valid", companyName: data.company_name };
  switch (data.reason) {
    case "not_found":
      return { status: "invalid", message: "No encontramos ese código. Revísalo con tu manager." };
    case "revoked":
      return {
        status: "invalid",
        message: "Este código ya no está activo. Pídele a tu manager la invitación nueva.",
      };
    case "expired":
      return {
        status: "invalid",
        message: "Este código ya venció. Pídele a tu manager uno nuevo.",
      };
    case "rate_limited":
      return {
        status: "locked",
        message: "Demasiados intentos. Espera unos minutos y vuelve a intentar.",
      };
    case "locked":
      return {
        status: "locked",
        message: "Este código está bloqueado temporalmente. Pídele a tu manager uno nuevo.",
      };
    default:
      return { status: "invalid", message: "Código no válido." };
  }
}
