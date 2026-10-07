// La sesión se mantiene viva sola (oct-2026).
//
// La llave de sesión dura una hora. La app lee esa llave directo del
// almacenamiento del navegador (sin el SDK, que se traba — ver
// supabase-rest.ts), pero NADIE la renovaba: el SDK, que es quien renueva,
// solo se enciende en las pantallas de entrar y salir. Resultado: a la hora de
// uso la app seguía abierta pero ya sin sesión. Lo primero que se rompía era
// el micrófono (la transcripción exige sesión); lo demás fallaba callado.
// Cerrar sesión y volver a entrar lo "arreglaba" por una hora.
//
// Aquí se renueva por nuestra cuenta, con el mismo canje que hace el SDK, y se
// guarda en el mismo lugar y formato, para que el SDK y la app vean lo mismo.

const URL_BASE = import.meta.env.VITE_SUPABASE_URL as string;
const LLAVE_PUBLICA = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string;

/** Se renueva cuando faltan menos de 5 minutos, no al caducar. */
export const MARGEN_RENOVAR_SEG = 300;
const ESPERA_MS = 8000;

export interface SesionCruda {
  access_token: string;
  refresh_token?: string;
  expires_at?: number;
  expires_in?: number;
  user?: { id?: string } | null;
  [k: string]: unknown;
}
type Almacen = Pick<Storage, "length" | "key" | "getItem" | "setItem">;

// ── Piezas puras ───────────────────────────────────────────────────────

export function debeRenovar(expiraEn: number | undefined, ahoraSeg: number, margen = MARGEN_RENOVAR_SEG): boolean {
  if (!expiraEn) return false; // sin fecha no hay cómo saber: se usa tal cual
  return expiraEn - ahoraSeg <= margen;
}

/** La sesión guardada, AUNQUE ya haya caducado (hace falta para renovarla). */
export function leerSesionCruda(almacen: Almacen): { llave: string; sesion: SesionCruda } | null {
  for (let i = 0; i < almacen.length; i++) {
    const llave = almacen.key(i);
    if (!llave || !llave.startsWith("sb-") || !llave.endsWith("-auth-token")) continue;
    try {
      let v: unknown = JSON.parse(almacen.getItem(llave) ?? "null");
      if (typeof v === "string") v = JSON.parse(v);
      const s = v as SesionCruda | null;
      if (s && typeof s === "object" && typeof s.access_token === "string" && s.user?.id) return { llave, sesion: s };
    } catch { /* se prueba la siguiente */ }
  }
  return null;
}

/** Lo que se guarda tras renovar: lo que devolvió el servidor, con fecha de caducidad. */
export function sesionRenovada(respuesta: SesionCruda, ahoraSeg: number): SesionCruda {
  const expira = respuesta.expires_at ?? ahoraSeg + (respuesta.expires_in ?? 3600);
  return { ...respuesta, expires_at: expira };
}

export type ResultadoRenovar =
  | { ok: true; sesion: SesionCruda }
  | { ok: false; motivo: "sin_sesion" | "rechazada" | "red" };

/**
 * Renueva la sesión guardada. `rechazada` = el servidor dijo que esa sesión ya
 * no vale (hay que volver a entrar). `red` = no se pudo preguntar (se reintenta).
 */
export async function renovarCon(almacen: Almacen, pedir: typeof fetch, ahoraSeg: () => number): Promise<ResultadoRenovar> {
  const g = leerSesionCruda(almacen);
  if (!g) return { ok: false, motivo: "sin_sesion" };
  // Otra pestaña (o el SDK) pudo haberla renovado ya.
  if (!debeRenovar(g.sesion.expires_at, ahoraSeg())) return { ok: true, sesion: g.sesion };
  if (!g.sesion.refresh_token) return { ok: false, motivo: "rechazada" };
  let r: Response;
  try {
    const control = new AbortController();
    const reloj = setTimeout(() => control.abort(), ESPERA_MS);
    try {
      r = await pedir(`${URL_BASE}/auth/v1/token?grant_type=refresh_token`, {
        method: "POST",
        headers: { "Content-Type": "application/json", apikey: LLAVE_PUBLICA },
        body: JSON.stringify({ refresh_token: g.sesion.refresh_token }),
        signal: control.signal,
      });
    } finally { clearTimeout(reloj); }
  } catch {
    return { ok: false, motivo: "red" };
  }
  if (!r.ok) {
    // Si mientras tanto alguien más la renovó, la nuestra fue rechazada por
    // usada: lo guardado ya es bueno.
    const otra = leerSesionCruda(almacen);
    if (otra && otra.sesion.access_token !== g.sesion.access_token && !debeRenovar(otra.sesion.expires_at, ahoraSeg(), 0)) {
      return { ok: true, sesion: otra.sesion };
    }
    return { ok: false, motivo: r.status >= 500 || r.status === 429 ? "red" : "rechazada" };
  }
  const cuerpo = (await r.json().catch(() => null)) as SesionCruda | null;
  if (!cuerpo?.access_token || !cuerpo.user?.id) return { ok: false, motivo: "red" };
  const nueva = sesionRenovada(cuerpo, ahoraSeg());
  almacen.setItem(g.llave, JSON.stringify(nueva));
  return { ok: true, sesion: nueva };
}

// ── Cuando la sesión ya no se puede renovar ────────────────────────────
//
// Decisión de Emilio (oct-2026): si la sesión de verdad terminó (dieron de baja
// al vendedor, cambió su contraseña, pasó demasiado tiempo), no se le deja
// dentro topándose con errores: se le saca limpio a la pantalla de entrada con
// un aviso. Solo ocurre cuando el SERVIDOR rechaza la renovación; una falla de
// internet nunca saca a nadie.

export const AVISO_SESION_TERMINADA = "Tu sesión terminó. Vuelve a entrar para seguir practicando.";
const MARCA_TERMINADA = "closer:sesionTerminada";

/** Pantallas donde no hay sesión que cuidar: de ahí no se saca a nadie. */
const RUTAS_PUBLICAS = ["/", "/login", "/signup", "/forgot-password", "/reset-password", "/role"];
export function esRutaPublica(ruta: string): boolean {
  const r = ruta.replace(/\/+$/, "") || "/";
  return RUTAS_PUBLICAS.includes(r);
}

type AlmacenBorrable = Almacen & Pick<Storage, "removeItem">;

/** Quita la sesión muerta del navegador. Devuelve cuántas llaves quitó. */
export function borrarSesionGuardada(almacen: AlmacenBorrable): number {
  const llaves: string[] = [];
  for (let i = 0; i < almacen.length; i++) {
    const k = almacen.key(i);
    if (k && k.startsWith("sb-") && k.endsWith("-auth-token")) llaves.push(k);
  }
  llaves.forEach((k) => almacen.removeItem(k));
  return llaves.length;
}

const oyentes = new Set<() => void>();
/** Avisa cuando la sesión terminó sin remedio. Devuelve cómo dejar de escuchar. */
export function alTerminarSesion(fn: () => void): () => void {
  oyentes.add(fn);
  return () => { oyentes.delete(fn); };
}

function terminarSesion() {
  try {
    borrarSesionGuardada(window.localStorage);
    window.sessionStorage.setItem(MARCA_TERMINADA, "1");
  } catch { /* noop */ }
  oyentes.forEach((fn) => { try { fn(); } catch { /* noop */ } });
}

/** Para la pantalla de entrada: ¿lo sacamos nosotros? Se lee una sola vez. */
export function tomarAvisoDeSesionTerminada(): string | null {
  if (typeof window === "undefined") return null;
  try {
    if (window.sessionStorage.getItem(MARCA_TERMINADA) !== "1") return null;
    window.sessionStorage.removeItem(MARCA_TERMINADA);
    return AVISO_SESION_TERMINADA;
  } catch { return null; }
}

// ── En el navegador ────────────────────────────────────────────────────

const ahora = () => Math.floor(Date.now() / 1000);
let enCurso: Promise<ResultadoRenovar> | null = null;

function renovar(): Promise<ResultadoRenovar> {
  if (!enCurso) {
    enCurso = renovarCon(window.localStorage, fetch, ahora)
      .then((r) => {
        if (!r.ok && r.motivo === "rechazada") terminarSesion();
        return r;
      })
      .finally(() => { enCurso = null; });
  }
  return enCurso;
}

/**
 * La sesión, garantizada vigente: si está por caducar o ya caducó, primero la
 * renueva. Devuelve null solo si de verdad no hay sesión que valga.
 */
export async function sesionFresca(opciones: { forzar?: boolean } = {}): Promise<{ userId: string; accessToken: string } | null> {
  if (typeof window === "undefined") return null;
  let g: ReturnType<typeof leerSesionCruda> = null;
  try { g = leerSesionCruda(window.localStorage); } catch { return null; }
  if (!g) return null;
  const vigente = (s: SesionCruda) => !debeRenovar(s.expires_at, ahora(), 0);
  if (!opciones.forzar && !debeRenovar(g.sesion.expires_at, ahora())) {
    return { userId: g.sesion.user!.id!, accessToken: g.sesion.access_token };
  }
  if (opciones.forzar) {
    // Forzar = el servidor rechazó la llave aunque parecía vigente.
    try { window.localStorage.setItem(g.llave, JSON.stringify({ ...g.sesion, expires_at: 1 })); } catch { /* noop */ }
  }
  const r = await renovar();
  if (r.ok) return { userId: r.sesion.user!.id!, accessToken: r.sesion.access_token };
  // Sin red pero con llave todavía vigente: se usa la que hay.
  if (r.motivo === "red" && !opciones.forzar && vigente(g.sesion)) {
    return { userId: g.sesion.user!.id!, accessToken: g.sesion.access_token };
  }
  return null;
}

/**
 * Se enciende una vez al abrir la app. Revisa cada minuto y cada vez que la
 * app vuelve al frente (en iPhone los relojes se detienen con la pantalla
 * apagada o la app en segundo plano: por eso no basta con el reloj).
 */
export function mantenerSesionViva(): () => void {
  if (typeof window === "undefined") return () => {};
  const revisar = () => { void sesionFresca(); };
  const alVolver = () => { if (document.visibilityState === "visible") revisar(); };
  revisar();
  const reloj = window.setInterval(revisar, 60_000);
  document.addEventListener("visibilitychange", alVolver);
  window.addEventListener("pageshow", revisar);
  window.addEventListener("online", revisar);
  return () => {
    window.clearInterval(reloj);
    document.removeEventListener("visibilitychange", alVolver);
    window.removeEventListener("pageshow", revisar);
    window.removeEventListener("online", revisar);
  };
}
