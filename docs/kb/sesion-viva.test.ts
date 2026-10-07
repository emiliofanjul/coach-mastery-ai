// La sesión se renueva sola (oct-2026). Antes caducaba a la hora y lo primero
// que se rompía era el micrófono; cerrar sesión y volver a entrar lo "arreglaba".
import { describe, it, expect, vi } from "vitest";
import { readFileSync } from "node:fs";
import { debeRenovar, leerSesionCruda, renovarCon, sesionRenovada, MARGEN_RENOVAR_SEG, esRutaPublica, borrarSesionGuardada } from "../sesion-viva";

function almacen(inicial: Record<string, string> = {}) {
  const m = new Map(Object.entries(inicial));
  return {
    get length() { return m.size; },
    key: (i: number) => [...m.keys()][i] ?? null,
    getItem: (k: string) => m.get(k) ?? null,
    setItem: (k: string, v: string) => { m.set(k, v); },
    removeItem: (k: string) => { m.delete(k); },
  };
}
const LLAVE = "sb-abc-auth-token";
const sesion = (expira: number, extra: object = {}) =>
  JSON.stringify({ access_token: "vieja", refresh_token: "r1", expires_at: expira, user: { id: "u1" }, ...extra });
const respuesta = (cuerpo: unknown, status = 200) =>
  vi.fn(async () => new Response(JSON.stringify(cuerpo), { status })) as unknown as typeof fetch;

describe("cuándo renovar", () => {
  it("con más de 5 minutos por delante, no", () => {
    expect(debeRenovar(1000 + MARGEN_RENOVAR_SEG + 1, 1000)).toBe(false);
  });
  it("a 5 minutos o menos, y ya caducada, sí", () => {
    expect(debeRenovar(1000 + MARGEN_RENOVAR_SEG, 1000)).toBe(true);
    expect(debeRenovar(500, 1000)).toBe(true);
  });
});

describe("leer la sesión guardada", () => {
  it("la encuentra AUNQUE ya haya caducado (hace falta para renovarla)", () => {
    const g = leerSesionCruda(almacen({ otra: "x", [LLAVE]: sesion(1) }));
    expect(g?.llave).toBe(LLAVE);
    expect(g?.sesion.refresh_token).toBe("r1");
  });
  it("sin sesión, o con basura, devuelve null sin tronar", () => {
    expect(leerSesionCruda(almacen())).toBeNull();
    expect(leerSesionCruda(almacen({ [LLAVE]: "{no es json" }))).toBeNull();
  });
});

describe("renovar", () => {
  it("vigente: no pregunta al servidor", async () => {
    const pedir = respuesta({});
    const r = await renovarCon(almacen({ [LLAVE]: sesion(10_000) }), pedir, () => 1000);
    expect(r.ok).toBe(true);
    expect(pedir).not.toHaveBeenCalled();
  });
  it("caducada: canjea, guarda la nueva en el mismo lugar y la devuelve", async () => {
    const a = almacen({ [LLAVE]: sesion(900) });
    const pedir = respuesta({ access_token: "nueva", refresh_token: "r2", expires_in: 3600, user: { id: "u1" } });
    const r = await renovarCon(a, pedir, () => 1000);
    expect(r).toMatchObject({ ok: true, sesion: { access_token: "nueva", expires_at: 4600 } });
    const guardada = JSON.parse(a.getItem(LLAVE)!);
    expect(guardada).toMatchObject({ access_token: "nueva", refresh_token: "r2", expires_at: 4600, user: { id: "u1" } });
    const [url, init] = (pedir as any).mock.calls[0];
    expect(url).toContain("/auth/v1/token?grant_type=refresh_token");
    expect(JSON.parse(init.body)).toEqual({ refresh_token: "r1" });
  });
  it("el servidor la rechaza: hay que volver a entrar, y NO se borra ni se inventa nada", async () => {
    const a = almacen({ [LLAVE]: sesion(900) });
    const r = await renovarCon(a, respuesta({ error: "invalid_grant" }, 400), () => 1000);
    expect(r).toEqual({ ok: false, motivo: "rechazada" });
    expect(JSON.parse(a.getItem(LLAVE)!).access_token).toBe("vieja");
  });
  it("sin internet o servidor caído: es pasajero, no se da por perdida la sesión", async () => {
    const sinRed = vi.fn(async () => { throw new TypeError("Load failed"); }) as unknown as typeof fetch;
    expect(await renovarCon(almacen({ [LLAVE]: sesion(900) }), sinRed, () => 1000)).toEqual({ ok: false, motivo: "red" });
    expect(await renovarCon(almacen({ [LLAVE]: sesion(900) }), respuesta({}, 503), () => 1000)).toEqual({ ok: false, motivo: "red" });
  });
  it("otra pestaña la renovó mientras tanto: se usa la suya", async () => {
    const a = almacen({ [LLAVE]: sesion(900) });
    const pedir = vi.fn(async () => {
      a.setItem(LLAVE, sesion(9000, { access_token: "de-otra-pestana" }));
      return new Response("{}", { status: 400 });
    }) as unknown as typeof fetch;
    const r = await renovarCon(a, pedir, () => 1000);
    expect(r).toMatchObject({ ok: true, sesion: { access_token: "de-otra-pestana" } });
  });
  it("respeta la fecha de caducidad que mande el servidor", () => {
    expect(sesionRenovada({ access_token: "x", expires_at: 777 }, 10).expires_at).toBe(777);
  });
});

describe("la app usa la sesión renovada", () => {
  const leer = (p: string) => readFileSync(p, "utf8");
  it("se enciende al abrir la app", () => {
    expect(leer("src/routes/__root.tsx")).toContain("useEffect(() => mantenerSesionViva(), [])");
  });
  it("lecturas, guardados y funciones piden la llave vigente", () => {
    const s = leer("src/lib/supabase-rest.ts");
    expect(s.match(/await llaveVigente\(/g)?.length).toBe(4);
  });
  it("la práctica no lee la llave cruda: micrófono, grabación y disputa van con sesión renovada", () => {
    const p = leer("src/routes/nodo.$nodeId.practica.tsx");
    expect(p).not.toMatch(/getStoredSupabaseSession\(\)\?\.accessToken/);
    expect(p).toContain("sesionFresca({ forzar: true })");
  });
});

describe("cuando la sesión ya no se puede renovar: salida limpia", () => {
  const leer = (p: string) => readFileSync(p, "utf8");
  it("de las pantallas de entrada no se saca a nadie; de las demás sí", () => {
    for (const r of ["/", "/login", "/login/", "/signup", "/forgot-password", "/reset-password", "/role"]) expect(esRutaPublica(r), r).toBe(true);
    for (const r of ["/mapa", "/nodo/3.9b/practica", "/equipo", "/mi-empresa", "/disputas", "/pitches"]) expect(esRutaPublica(r), r).toBe(false);
  });
  it("borra solo la sesión, no lo demás que guarde la app", () => {
    const a = almacen({ [LLAVE]: sesion(1), "closer:tema": "oscuro" });
    expect(borrarSesionGuardada(a)).toBe(1);
    expect(a.getItem(LLAVE)).toBeNull();
    expect(a.getItem("closer:tema")).toBe("oscuro");
  });
  it("solo el rechazo del servidor saca al vendedor; una falla de internet, nunca", () => {
    const s = leer("src/lib/sesion-viva.ts");
    expect(s).toMatch(/if \(!r\.ok && r\.motivo === "rechazada"\) terminarSesion\(\)/);
    expect(s.match(/terminarSesion\(\)/g)?.length).toBe(2); // la definición y ese único uso
  });
  it("la app lo lleva a la entrada y la entrada le dice por qué", () => {
    const raiz = leer("src/routes/__root.tsx");
    expect(raiz).toContain("alTerminarSesion(");
    expect(raiz).toContain('router.navigate({ to: "/login", replace: true })');
    const entrada = leer("src/routes/login.tsx");
    expect(entrada).toContain("tomarAvisoDeSesionTerminada()");
    expect(entrada).toContain("{aviso && !error && (");
  });
});
