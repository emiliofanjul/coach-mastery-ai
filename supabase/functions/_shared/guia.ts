// LA GUÍA DEL VENDEDOR, PARA QUIEN ESCRIBE FRASES (mensaje 177, 25-nov-2026).
//
// El caso (2.1, 25-nov): los cinco ejemplos que Closer le dio a Emilio terminaban
// la historia breve con «¿usted cómo le hace con los aceites?», que es justo la
// falla grave del nodo. Quien escribía los ejemplos no sabía qué tiene que tener
// una frase del paso 2, y escribía la pregunta que le salía natural: la del paso 3.
// Emilio: «no es cuestión de parcharlo, tenemos que resolver el problema de fondo
// real. Para que igual funcione la creación de pitch y para que funcione el
// vendedor por teléfono y por whatsapp que desarrollemos después».
//
// La guía (tabla guia_del_vendedor, mensaje 176, doc «El molde de cada paso»
// aprobado por Emilio) es la fuente única de cómo suena una frase bien dicha en
// cada paso. Este archivo la arma para quien escribe: el coach de la pantalla de
// resultados, las respuestas de las disputas, y lo que venga (Pitch Builder,
// agentes por teléfono o WhatsApp). Escribir con la guía no basta: lo que sale
// pasa además por la misma vara (vara_ejemplos.ts). Sin imports: Deno y Node.

export interface ParteGuia { clave: string; orden: number; titulo: string; texto: string }

const str = (x: unknown) => (typeof x === "string" ? x.trim() : "");

/** Las partes válidas, en su orden. */
export function partesValidas(partes: unknown): ParteGuia[] {
  return (Array.isArray(partes) ? partes : [])
    .filter((p: any) => str(p?.clave) && str(p?.titulo) && str(p?.texto))
    .map((p: any) => ({ clave: str(p.clave), orden: Number(p.orden) || 0, titulo: str(p.titulo), texto: str(p.texto) }))
    .sort((a, b) => a.orden - b.orden);
}

/** La guía completa, como texto para un prompt. Vacío si no hay guía. */
export function textoDeGuia(partes: unknown): string {
  const ps = partesValidas(partes);
  if (ps.length === 0) return "";
  return ps.map((p) => `## ${p.titulo}\n${p.texto}`).join("\n\n");
}

/** El molde del paso donde se diría una frase, con «En cualquier paso». Paso null (mundo 7): los seis. */
export function moldeDelPaso(partes: unknown, paso: number | null): string {
  const ps = partesValidas(partes);
  const quiero = (c: string) => c === "en_cualquier_paso" || (paso === null ? /^paso_[1-6]$/.test(c) : c === `paso_${paso}`);
  return ps.filter((p) => quiero(p.clave)).map((p) => `## ${p.titulo}\n${p.texto}`).join("\n\n");
}

/** El bloque para quien escribe frases: cómo usar la guía, y la guía. Vacío si no hay guía. */
export function bloqueParaEscribir(partes: unknown): string {
  const guia = textoDeGuia(partes);
  if (!guia) return "";
  return `CÓMO SUENA UNA FRASE BIEN DICHA — LA GUÍA DEL VENDEDOR (doctrina de Closer)
Esto es para ESCRIBIR, no para calificar: no cambia ningún veredicto, ninguna falla ni la nota.
Toda frase que le propongas DECIR al vendedor (un ejemplo, una frase entre comillas en una mejora, la misión, o lo que le sugieras en una respuesta) se escribe con esta guía:
1. Ubica en qué paso de la línea recta se diría esa frase, según el momento de la conversación que corrige. Su molde manda: lo que tiene que tener, lo que no puede tener y cómo termina el turno.
2. Cumple también «En cualquier paso».
3. Si el cliente bloqueó, objetó o dio una señal, sigue «Cuando el cliente…». Los factores de impulso se usan donde la guía dice, y siempre con verdad.
4. Antes de escribirla, revisa que no cometa ninguna falla de este nodo ni del molde. Una frase que corrige una falla no puede cometer otra.
5. No es una frase para copiar: es una forma de decirlo. Usa las palabras y el contexto de esta conversación.

${guia}`;
}
