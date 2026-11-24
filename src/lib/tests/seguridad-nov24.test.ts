// Mensaje 170 (24-nov-2026) · Seguridad: lo que da avance, certificación o acceso
// lo decide el servidor, no el teléfono. La revisión de seguridad de Lovable
// encontró que cualquiera con sesión podía marcarse nodos como hechos, certificarse,
// adivinar códigos de invitación sin límite (en apply_invite_code y
// join_company_with_code) y subir cualquier archivo como audio.
import { describe, it, expect } from "vitest";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { tipoDeAudio, MAX_AUDIO_BYTES } from "../../../supabase/functions/_shared/tipo_audio";

const leer = (p: string) => readFileSync(join(process.cwd(), p), "utf8");
const sql = leer("docs/kb/seguridad_170.sql");
const regresar = leer("docs/kb/seguridad_170_regresar.sql");

function archivos(dir: string): string[] {
  return readdirSync(join(process.cwd(), dir)).flatMap((n) => {
    const p = join(dir, n);
    if (statSync(join(process.cwd(), p)).isDirectory()) return n === "tests" || n === "__tests__" ? [] : archivos(p);
    return /\.(ts|tsx)$/.test(n) ? [p] : [];
  });
}

describe("la app ya no escribe su propio avance", () => {
  const app = archivos("src").filter((p) => !p.includes("integrations/supabase/types.ts"));
  it("nadie en src escribe node_progress, ni la certificación, ni el nodo actual", () => {
    for (const p of app) {
      const s = leer(p);
      expect(s, p).not.toMatch(/restMutate\(\s*["`]node_progress/);
      expect(s, p).not.toMatch(/from\("node_progress"\)\s*\.(insert|update|upsert|delete)/);
      expect(s, p).not.toContain("certified_at: new Date()");
      expect(s, p).not.toMatch(/body: \{ current_node:/);
    }
  });
  it("las tres pantallas avanzan con avanzar_nodo y su prueba", () => {
    expect(leer("src/routes/nodo.$nodeId.tsx")).toContain('avanzarNodo(nodeId, { tipo: "lectura" })');
    expect(leer("src/routes/nodo.$nodeId.quiz.tsx")).toContain('avanzarNodo(nodeId, { tipo: "quiz", respuestas:');
    expect(leer("src/routes/nodo.$nodeId.practica.tsx")).toContain('avanzarNodo(nodeId, { tipo: "practica", practice_session_id: practiceSessionId })');
    expect(leer("src/lib/avanzar-nodo.ts")).toContain('restMutate<ResultadoAvance>("rpc/avanzar_nodo"');
  });
  it("si el servidor no deja avanzar, el vendedor lo sabe y no se pierde nada", () => {
    for (const p of ["src/routes/nodo.$nodeId.quiz.tsx", "src/routes/nodo.$nodeId.practica.tsx", "src/routes/nodo.$nodeId.tsx"]) {
      expect(leer(p), p).toContain("toast.error(textoDeRechazo(r.reason));");
    }
  });
});

describe("avanzar_nodo: el servidor revisa la prueba", () => {
  it("lectura sin quiz ni práctica; quiz contra las correctas de la base; práctica con su calificación guardada", () => {
    expect(sql).toContain("IF _tiene_quiz OR _tiene_practica THEN RETURN jsonb_build_object('ok', false, 'reason', 'no_es_de_lectura'); END IF;");
    expect(sql).toContain("SELECT array_agg(q.correct_option::text ORDER BY q.question_order) INTO _correctas");
    expect(sql).toContain("IF _respuestas IS DISTINCT FROM _correctas THEN");
    expect(sql).toContain("FROM public.evaluaciones_practica WHERE practice_session_id = _ps_id;");
    expect(sql).toContain("IF _ps_seller IS NULL OR _ps_seller <> _seller_id THEN");
    expect(sql).toContain("IF _ps_node IS DISTINCT FROM _node_id THEN");
  });
  it("las estrellas son las de puntuacion.ts", () => {
    const ts = leer("supabase/functions/_shared/puntuacion.ts");
    expect(ts).toContain("return score >= 85 ? 3 : score >= 60 ? 2 : score >= 30 ? 1 : 0;");
    expect(sql).toContain("_stars := CASE WHEN _score >= 85 THEN 3 WHEN _score >= 60 THEN 2 WHEN _score >= 30 THEN 1 ELSE 0 END;");
  });
  it("solo el nodo que le toca, como el mapa (el admin de la plataforma prueba cualquiera)", () => {
    expect(sql).toContain("ORDER BY n.world_id, n.order_index LIMIT 1;");
    expect(sql).toContain("AND NOT public.es_admin_plataforma() THEN");
    expect(leer("src/routes/mapa.tsx")).toContain("a.world_id !== b.world_id");
  });
  it("la certificación es la del examen final", () => {
    expect(leer("src/lib/certificacion.ts")).toContain('export const NODO_CERTIFICACION = "7.4";');
    expect(sql).toContain("_node_id = '7.4' AND _score >= 85");
  });
});

describe("lo que la app ya no puede tocar", () => {
  it("node_progress y practice_sessions: solo lectura para vendedor y gerente", () => {
    for (const p of ['DROP POLICY "seller writes own progress"', 'DROP POLICY "seller updates own progress"', 'DROP POLICY "managers all node_progress"',
      'DROP POLICY "seller updates own sessions"', 'DROP POLICY "managers all sessions"']) expect(sql).toContain(p);
    expect(sql).toContain("REVOKE INSERT, UPDATE, DELETE ON public.node_progress FROM anon, authenticated;");
  });
  it("sellers: certificación, XP, racha, última práctica y nivel", () => {
    for (const c of ["certified_at", "xp_total", "streak_days", "last_practice_date", "current_level"]) {
      expect(sql).toContain(`OR NEW.${c} IS DISTINCT FROM OLD.${c}`);
    }
  });
  it("y el onboarding sigue pudiendo guardar lo suyo", () => {
    const onb = leer("src/routes/onboarding.seller.tsx");
    for (const c of ["full_name", "experience_level", "main_challenge", "audio_consent", "onboarding_completed"]) {
      expect(onb).toContain(c);
      expect(sql).not.toContain(`OR NEW.${c} IS DISTINCT FROM`);
    }
  });
});

describe("invitaciones", () => {
  it("el sufijo sale de un azar criptográfico, sin sesgo", () => {
    expect(sql).toContain("b := decode(replace(gen_random_uuid()::text, '-', ''), 'hex');");
    expect(sql).toContain("IF v < 248 AND length(s) < 6 THEN");
    const funcion = sql.slice(sql.indexOf("FUNCTION public._gen_invite_suffix()"), sql.indexOf("FUNCTION public.apply_invite_code"));
    expect(funcion).not.toContain("random()");
  });
  it("apply y join tienen el mismo límite que validate, y registran cada intento", () => {
    for (const f of ["apply_invite_code", "join_company_with_code"]) {
      const ini = sql.indexOf(`FUNCTION public.${f}(`);
      const cuerpo = sql.slice(ini, sql.indexOf("$function$;", ini));
      expect(cuerpo, f).toContain("IF _recent_fails >= 10 THEN RETURN jsonb_build_object('ok', false, 'reason', 'rate_limited'); END IF;");
      expect(cuerpo, f).toContain("'not_found');");
      expect(cuerpo, f).toContain("VALUES (_uid, left(_code, 40), 'valid');");
    }
  });
  it("apply no cambia de empresa a quien ya tiene una, ni le reinicia los créditos", () => {
    expect(sql).toContain("RETURN jsonb_build_object('ok', false, 'reason', 'already_in_company');");
    expect(leer("src/routes/mi-perfil.tsx")).toContain('case "rate_limited":');
  });
});

describe("audios", () => {
  const fn = leer("supabase/functions/save-practice-event/index.ts");
  it("el almacén solo acepta audio y ya no se sube directo", () => {
    expect(sql).toContain("SET allowed_mime_types = ARRAY['audio/wav','audio/x-wav','audio/webm','audio/mp4','audio/x-m4a','audio/ogg','audio/mpeg']");
    expect(sql).toContain('DROP POLICY "practice_audio_insert_own" ON storage.objects;');
    expect(sql).toContain('DROP POLICY "practice_audio_update_own" ON storage.objects;');
  });
  it("la función revisa el tamaño antes de leer y el tipo por sus bytes", () => {
    expect(fn).toContain("if (audio.size > MAX_AUDIO_BYTES)");
    expect(fn).toContain("const detectado = tipoDeAudio(bytes);");
    expect(fn).toContain("contentType: detectado.tipo,");
    expect(fn).not.toContain('contentType: audio.type || "audio/webm"');
  });
});

describe("tipoDeAudio reconoce el audio por sus bytes", () => {
  const de = (...partes: (string | number[])[]) =>
    new Uint8Array(partes.flatMap((p) => (typeof p === "string" ? [...p].map((c) => c.charCodeAt(0)) : p)));
  it("los formatos que graba la app", () => {
    expect(tipoDeAudio(de("RIFF", [0, 0, 0, 0], "WAVEfmt "))).toEqual({ tipo: "audio/wav", ext: "wav" });
    expect(tipoDeAudio(de([0x1a, 0x45, 0xdf, 0xa3, 1, 2]))).toEqual({ tipo: "audio/webm", ext: "webm" });
    expect(tipoDeAudio(de([0, 0, 0, 0x20], "ftypM4A "))).toEqual({ tipo: "audio/mp4", ext: "m4a" });
  });
  it("lo que no es audio, no", () => {
    expect(tipoDeAudio(de("MZ", [0x90, 0, 3, 0]))).toBeNull(); // un programa de Windows
    expect(tipoDeAudio(de("%PDF-1.7"))).toBeNull();
    expect(tipoDeAudio(de("<html>"))).toBeNull();
    expect(tipoDeAudio(new Uint8Array())).toBeNull();
    expect(tipoDeAudio(de("RIFF", [0, 0, 0, 0], "AVI "))).toBeNull();
  });
  it("el tope es el del almacén: 50 MiB", () => {
    expect(MAX_AUDIO_BYTES).toBe(52_428_800);
  });
});

describe("closer-voice califica con el nodo de la práctica guardada", () => {
  it("no con el que diga el cuerpo", () => {
    const cv = leer("supabase/functions/closer-voice/index.ts");
    expect(cv).toContain("body.node_id = (practica as { node_id?: string | null }).node_id ?? null;");
  });
});

describe("se puede regresar", () => {
  it("el SQL de regreso deja las políticas, funciones y el almacén como estaban", () => {
    for (const p of ['CREATE POLICY "seller writes own progress"', 'CREATE POLICY "seller updates own progress"', 'CREATE POLICY "managers all node_progress"',
      'CREATE POLICY "seller updates own sessions"', 'CREATE POLICY "managers all sessions"', 'CREATE POLICY "practice_audio_insert_own"',
      'CREATE POLICY "practice_audio_update_own"', "DROP FUNCTION public.avanzar_nodo(text, jsonb);",
      "SET allowed_mime_types = NULL", "s := s || substr(chars, 1 + floor(random() * length(chars))::int, 1);"]) expect(regresar).toContain(p);
  });
});
