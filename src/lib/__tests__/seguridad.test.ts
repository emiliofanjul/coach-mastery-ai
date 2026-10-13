// Revisión de seguridad antes de lanzar (oct-2026). Lo que se cerró y no se
// debe volver a abrir.
import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";

const leer = (p: string) => readFileSync(p, "utf8");

describe("las funciones que gastan IA exigen sesión", () => {
  for (const f of ["closer-voice", "closer-tts", "director"]) {
    it(`${f}: revisa quién llama antes de hacer nada`, () => {
      const s = leer(`supabase/functions/${f}/index.ts`);
      expect(s).toContain('from "../_shared/quien_llama.ts"');
      const auth = s.indexOf("await quienLlama(req)");
      expect(auth).toBeGreaterThan(0);
      expect(s.indexOf("await req.json()")).toBeGreaterThan(auth);
      expect(s).toContain("if (!quien) return respuestaNoAutorizado(corsHeaders)");
    });
  }
  it("la empresa y el vendedor del consumo salen de la sesión, no de la petición", () => {
    for (const f of ["closer-voice", "closer-tts", "director"]) {
      const s = leer(`supabase/functions/${f}/index.ts`);
      expect(s).toMatch(
        /body\.company_id = quien\.companyId;\s*body\.seller_id = quien\.sellerId;/,
      );
    }
  });
  it("la llave pública no es la sesión de nadie: solo vale un usuario real o la llave de servicio", () => {
    const s = leer("supabase/functions/_shared/quien_llama.ts");
    expect(s).toContain("admin.auth.getUser(token)");
    expect(s).toContain('if (token === servicio || (req.headers.get("apikey") ?? "").trim() === servicio) return { tipo: "servicio" };');
  });
  it("la práctica manda la sesión del vendedor, no la llave pública", () => {
    const s = leer("src/routes/nodo.$nodeId.practica.tsx");
    expect(s).not.toContain("Authorization: `Bearer ${SUPABASE_ANON}`");
    expect(s).not.toContain("accessToken || SUPABASE_ANON");
  });
  it("si el servidor rechaza la sesión a media práctica, se renueva una vez y se reintenta", () => {
    const s = leer("src/routes/nodo.$nodeId.practica.tsx");
    expect(s).toMatch(/if \(res\.status !== 401\) return res;/);
    expect(s).toContain("sesionFresca({ forzar: true })");
    for (const url of ["TTS_URL", "DIRECTOR_URL", "VOICE_URL"]) {
      expect(s, url).not.toContain(`await fetch(${url}`);
    }
    expect(s).not.toContain("fetch(`${SUPABASE_URL}/functions/v1/closer-voice`");
  });
  it("las tarjetas del nodo usan la sesión renovada, no una copia guardada", () => {
    expect(leer("src/routes/nodo.$nodeId.tsx")).not.toContain(
      "accessToken: getStoredSupabaseSession()?.accessToken",
    );
  });
  it("la pantalla de la red de seguridad solo la abre el equipo de Closer", () => {
    const s = leer("src/routes/red.tsx");
    expect(s).toContain("platform_admins?select=user_id");
    expect(s).not.toContain('perfil.role !== "manager"');
  });
  it("la red de seguridad solo la corre el equipo de Closer, y entra al evaluador con la llave de servicio", () => {
    const s = leer("supabase/functions/harness-runner/index.ts");
    expect(s).toContain('.from("platform_admins")');
    expect(s).not.toContain('prof.role !== "manager"');
    expect(s).toContain('...encabezadosDeServicio(Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "", anonKey)');
  });
  it("la llave de servicio nueva (sb_secret_) va sola en apikey: si va en Authorization, el portero la rechaza", () => {
    const s = leer("supabase/functions/_shared/quien_llama.ts");
    expect(s).toMatch(/servicio\.startsWith\("sb_"\)\s*\?\s*\{ apikey: servicio \}\s*:\s*\{ apikey: publica, Authorization: `Bearer \$\{servicio\}` \}/);
  });
  it("la red reporta el status y el cuerpo cuando el evaluador ni siquiera corre", () => {
    expect(leer("supabase/functions/harness-runner/index.ts")).toContain("if (response.status >= 400 && !parsed.error) {");
  });
});

describe("las funciones de la app que llaman a Claude exigen sesión", () => {
  it("onboarding (3), coach y bienvenida del vendedor", () => {
    expect(
      leer("src/utils/onboarding.functions.ts").match(/\.middleware\(\[requireSupabaseAuth\]\)/g)
        ?.length,
    ).toBe(3);
    expect(leer("src/lib/coach-chat.functions.ts")).toContain(".middleware([requireSupabaseAuth])");
    expect(leer("src/utils/seller-onboarding.functions.ts")).toContain(
      ".middleware([requireSupabaseAuth])",
    );
  });
  it("el coach solo lee al vendedor de la sesión, aunque la petición traiga otro id", () => {
    const s = leer("src/lib/coach-chat.functions.ts");
    expect(s).toContain('.eq("profile_id", context.userId)');
    expect(s).not.toContain("loadCoachContext(data.sellerId)");
    expect(s).not.toContain("seller_id: data.sellerId");
  });
});
