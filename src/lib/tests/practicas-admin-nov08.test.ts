// Mensaje 162 (8-nov-2026, Emilio): «un panel… donde podamos tener las prácticas de todos los usuarios…
// con filtros para auditarlos y mejorar el producto». Solo para el equipo de Closer.
import { describe, it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";
import {
  FILTROS_INICIALES, atorados, fallasPresentes, filtrar, nodoQueCuesta, reporteDeLista, reporteDePractica, resumenPorNodo, vistaDePractica,
  type DetallePractica, type FilaPractica,
} from "@/lib/practicas-admin";

const leer = (r: string) => fs.readFileSync(path.join(process.cwd(), r), "utf8");

let n = 0;
const fila = (x: Partial<FilaPractica>): FilaPractica => ({
  id: `p${++n}`, created_at: `2026-11-0${(n % 8) + 1}T10:00:00Z`, node_id: "1.2", seller_id: "mama", vendedor: "Mamá",
  company_id: "c1", empresa: "DALFAN", personal: false, score: 40, stars: 0, intento: 1, fallas: [], criticas: 0, tiene_audio: false, ...x,
});

// Mamá: 5 intentos en el 1.2 sin pasar (el caso que encontró Emilio). Ana lo pasó al 2º. Luis, por su cuenta, al 1º del 1.3.
const filas: FilaPractica[] = [
  ...[1, 2, 3, 4, 5].map((i) => fila({ intento: i, score: 30 + i, fallas: i === 4 ? ["pitch_prematuro"] : ["sin_pregunta"], criticas: i === 4 ? 1 : 0 })),
  fila({ seller_id: "ana", vendedor: "Ana Pérez", intento: 1, score: 55, stars: 1, fallas: ["sin_pregunta"] }),
  fila({ seller_id: "ana", vendedor: "Ana Pérez", intento: 2, score: 82, stars: 2 }),
  fila({ seller_id: "luis", vendedor: "Luis", node_id: "1.3", personal: true, empresa: "Luis", intento: 1, score: 90, stars: 3 }),
];

describe("quién está atorado", () => {
  it("3 o más intentos sin pasar es atorado; quien ya lo pasó no", () => {
    const a = atorados(filas);
    expect(a.has("mama|1.2")).toBe(true);
    expect(a.has("ana|1.2")).toBe(false);
    expect(a.size).toBe(1);
  });
});

describe("el resumen por nodo", () => {
  const r = resumenPorNodo(filas);
  it("va en el orden del mapa y cuenta lo que importa", () => {
    expect(r.map((x) => x.node_id)).toEqual(["1.2", "1.3"]);
    const n12 = r[0];
    expect(n12).toMatchObject({ practicas: 7, vendedores: 2, pasaron: 1, atorados: 1, intentosParaPasar: 2 });
    expect(n12.fallas[0]).toEqual({ id: "sin_pregunta", n: 5 });
    expect(nodoQueCuesta(n12)).toBe(true);
    expect(nodoQueCuesta(r[1])).toBe(false);
  });
  it("si nadie lo pasó, no inventa un intento", () => {
    expect(resumenPorNodo(filas.filter((x) => x.seller_id === "mama"))[0].intentosParaPasar).toBeNull();
  });
});

describe("los filtros", () => {
  it("cada filtro recorta lo que dice", () => {
    expect(filtrar(filas, FILTROS_INICIALES)).toHaveLength(8);
    expect(filtrar(filas, { ...FILTROS_INICIALES, nodo: "1.3" })).toHaveLength(1);
    expect(filtrar(filas, { ...FILTROS_INICIALES, tipo: "personal" }).map((x) => x.seller_id)).toEqual(["luis"]);
    expect(filtrar(filas, { ...FILTROS_INICIALES, tipo: "equipos" })).toHaveLength(7);
    expect(filtrar(filas, { ...FILTROS_INICIALES, texto: "perez" })).toHaveLength(2); // sin acentos
    expect(filtrar(filas, { ...FILTROS_INICIALES, resultado: "pasaron" })).toHaveLength(2);
    expect(filtrar(filas, { ...FILTROS_INICIALES, resultado: "no_pasaron" })).toHaveLength(6);
    expect(filtrar(filas, { ...FILTROS_INICIALES, soloAtorados: true })).toHaveLength(5);
    expect(filtrar(filas, { ...FILTROS_INICIALES, conCritica: true })).toHaveLength(1);
    expect(filtrar(filas, { ...FILTROS_INICIALES, falla: "pitch_prematuro" })).toHaveLength(1);
  });
  it("las fallas del filtro van de la más repetida a la menos", () => {
    expect(fallasPresentes(filas)).toEqual([{ id: "sin_pregunta", n: 5 }, { id: "pitch_prematuro", n: 1 }]);
  });
});

describe("copiar para Claude", () => {
  it("la lista lleva el resumen por nodo y una línea por práctica", () => {
    const t = reporteDeLista(filas, "últimos 30 días");
    expect(t).toContain("PRÁCTICAS · 8 · últimos 30 días");
    expect(t).toContain("[1.2] 7 prácticas · 2 vendedores · pasaron 1 · atorados 1 · intento en que pasan 2");
    expect(t).toContain("Luis (por su cuenta)");
  });
  const d: DetallePractica = {
    id: "x", created_at: "2026-11-07T18:30:00Z", node_id: "1.2", nodo: "Abrir con un comentario", vendedor: "Mamá", empresa: "DALFAN",
    personal: false, audio_consent: true, audio_url: "a/b.webm", prompt_version: "v9", model: null,
    payload: {
      score: 30, stars: 0, cut_reason: "critical_failure",
      transcript: [
        { role: "user", text: "Buenas tardes, ¿qué producto se le vende mucho?" },
        { role: "agent", text: "Pues de todo un poco." },
        { role: "agent", text: "Gracias, terminamos.", fuera_de_la_venta: true },
        { role: "user", text: "   " },
      ],
      evaluation: {
        criterios_cumplidos: ["saludo"],
        fallas: [{ id: "pitch_prematuro", severidad: "critical", error: "Preguntó por su operación comercial.", cita: "¿qué producto se le vende mucho?" }],
        observations: [{ criterio_id: "comentario", severity: "major", mejora: "Abre con un comentario de su negocio.", ejemplo: "Qué bonito acomodó el mostrador." }],
        mision: "Abre con un comentario.",
      },
    },
  };
  it("una práctica lleva la conversación numerada, quién dijo qué y lo que decidió la calificación", () => {
    const v = vistaDePractica(d);
    expect(v.turnos.map((t) => t.quien)).toEqual(["Vendedor", "Cliente", "Closer"]);
    expect(v.termino).toBe("falla crítica");
    const t = reporteDePractica(d);
    expect(t).toContain("falla pitch_prematuro (critical): Preguntó por su operación comercial.");
    expect(t).toContain("observación comentario (major): mejora: Abre con un comentario de su negocio. · ejemplo: Qué bonito acomodó el mostrador.");
    expect(t).toContain("  1. V: Buenas tardes, ¿qué producto se le vende mucho?");
    expect(t).toContain("  3. Closer: Gracias, terminamos.");
    expect(t).not.toContain("a/b.webm"); // sin audio
  });
  it("no se rompe con una práctica vieja o incompleta", () => {
    const v = vistaDePractica({ ...d, payload: { evaluation: { fallas: "raro", observations: null } } });
    expect(v).toMatchObject({ turnos: [], fallas: [], observaciones: [], mision: null, termino: null });
  });
});

describe("la pantalla", () => {
  const p = leer("src/routes/practicas.tsx");
  it("solo el equipo de Closer: revisa platform_admins y lee por las funciones que revisan en la base", () => {
    expect(p).toContain("platform_admins?select=user_id&user_id=eq.${session.userId}&limit=1");
    expect(p).toContain("Solo para el equipo de Closer");
    expect(p).toContain('restMutate<FilaPractica>("rpc/admin_practicas"');
    expect(p).toContain('restMutate<any>("rpc/admin_practica"');
    expect(p).not.toMatch(/restGet[^(]*\(\s*[`"]seller_events/);
  });
  it("el audio se pide solo al abrir una práctica, y solo si el vendedor aceptó", () => {
    expect(p).toContain("if (d.audio_consent && d.audio_url) {");
    expect(p).toContain('createSignedStorageUrl("practice-audio", d.audio_url');
  });
});

describe("el consentimiento dice que el equipo de Closer puede revisarlas", () => {
  const frase = "El equipo de Closer puede revisarlas para mejorar la app.";
  it("en la bienvenida (equipo y por su cuenta) y antes de practicar", () => {
    const seller = leer("src/routes/onboarding.seller.tsx");
    const practica = leer("src/routes/nodo.$nodeId.practica.tsx");
    expect(seller.split(frase).length - 1).toBe(2);
    expect(practica.split(frase).length - 1).toBe(2);
  });
  it("a quien entrena por su cuenta no se le promete un manager antes de practicar", () => {
    const practica = leer("src/routes/nodo.$nodeId.practica.tsx");
    expect(practica).toContain('"Closer funciona con tu voz. Para practicar, tus prácticas se graban: así recibes tu calificación. El equipo de Closer puede revisarlas para mejorar la app."');
  });
});
