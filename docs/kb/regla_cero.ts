// Regla número cero de los nodos de apertura (mundo 1): el cliente JAMÁS
// pregunta qué vende el vendedor ni a qué viene. Disputa 1.5 (14-oct-2026):
// el cliente preguntó "¿Qué se le ofrece?" y después "¿De qué se trata?"; el
// vendedor contestó lo natural, "vengo por parte de Dalfan", y se le cobró
// como falla crítica algo que el nodo no enseña. El prompt ya lo prohibía con
// esas mismas palabras y el modelo lo hizo igual: aquí se garantiza en código.

const normalizar = (s: string) =>
  s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

const PROHIBIDAS: RegExp[] = [
  /que se le ofrece/,
  /que (le|les) (puedo|podemos) ofrecer/,
  /en que (le |les )?(puedo|podemos) (servir|ayudar)/,
  /en que le sirvo/,
  /que (es lo que )?(necesita|anda buscando|busca|trae|vende|ofrece)\b/,
  /a que (viene|vino)/,
  /de que se trata/,
];
// "¿Y usted quién es?" NO se quita: en el 1.2 que el cliente pregunte quién
// eres es el máximo de curiosidad_abierta. Lo prohibido es preguntar qué vende.

/** El nodo tiene la regla número cero en el prompt del cliente. */
export function tieneReglaCero(promptYouDo: unknown): boolean {
  return typeof promptYouDo === "string" && normalizar(promptYouDo).includes("regla numero cero");
}

/**
 * Quita del mensaje del cliente las preguntas prohibidas por la regla número
 * cero. Solo toca frases que son pregunta; el resto queda igual. Si no queda
 * nada, regresa una respuesta neutra.
 */
export function quitarPreguntasProhibidas(texto: string): { texto: string; quitadas: string[] } {
  const frases = texto.split(/(?<=[.!?…])\s+/);
  const quitadas: string[] = [];
  const quedan = frases.filter((f) => {
    const n = normalizar(f);
    const prohibida = n.includes("?") && PROHIBIDAS.some((re) => re.test(n));
    if (prohibida) quitadas.push(f);
    return !prohibida;
  });
  const limpio = quedan.join(" ").trim();
  return { texto: quitadas.length === 0 ? texto : limpio || "Ajá.", quitadas };
}
