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
