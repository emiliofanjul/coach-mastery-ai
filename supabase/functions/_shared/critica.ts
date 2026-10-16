// Verificación en código de una falla crítica que marca el Director (16-oct-2026).
//
// El clasificador del Director cortaba el 2.7c después del segundo bloqueo,
// antes de que el vendedor contestara, por una "falla crítica" que no existía
// (leyó "no, pero nada más, quería preguntarle" como discutir el bloqueo).
// Ahora el clasificador tiene que decir CUÁL falla y con QUÉ frase literal del
// vendedor; el código solo corta si esa falla es crítica en el nodo y si la
// frase de verdad la dijo el vendedor. Sin eso, no corta.

const normalizar = (s: string) =>
  s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9ñ ]+/g, " ").replace(/\s+/g, " ").trim();

export interface VerificacionCritica { valida: boolean; motivo: string | null }

export function verificarCritica(args: {
  falla_critica_id: unknown;
  cita: unknown;
  criticas: string[];
  conversacion: { role?: string; content?: unknown }[];
}): VerificacionCritica {
  const id = typeof args.falla_critica_id === "string" ? args.falla_critica_id.trim() : "";
  if (!id || !args.criticas.includes(id)) return { valida: false, motivo: "falla_no_critica" };
  const cita = typeof args.cita === "string" ? normalizar(args.cita) : "";
  if (cita.split(" ").filter(Boolean).length < 2) return { valida: false, motivo: "sin_cita" };
  const dicho = args.conversacion
    .filter((m) => m?.role === "user")
    .map((m) => normalizar(String(m?.content ?? "")));
  if (!dicho.some((t) => t.includes(cita))) return { valida: false, motivo: "cita_no_es_del_vendedor" };
  return { valida: true, motivo: null };
}
