import { describe, it, expect } from "vitest";
import { readFileSync } from "fs";
import { resolve } from "path";

// Mensaje 137 (Emilio, 5-nov-2026): las prácticas del mundo 5 ligadas a la doctrina.
// · Aguantar el silencio es lo correcto, pero no garantiza el sí: si el cliente pone una objeción
//   después, no es castigo, es una objeción (5.13 y 5.14). La 5.14 ya no castiga el silencio.
// · FFF se practica completo: los cinco pasos (5.8).
// · El cliente simulado no puede contradecir lo que se califica: la bala ya dicha y conectada sí cuenta,
//   y el cargador se vacía desde dos argumentos (5.10 y 5.12).
// · Nunca se califica lo que no se ha enseñado, ni dos veces lo mismo (5.3, 5.13).

const kb = (f: string) => readFileSync(resolve(__dirname, "../../../docs/kb", f), "utf8");
const nodos: any[] = JSON.parse(kb("nodos_snapshot.json"));
const red = JSON.parse(readFileSync(resolve(__dirname, "../../../supabase/functions/_shared/eval_harness_v1.json"), "utf8"));
const nodo = (id: string) => nodos.find((n) => n.id === id);
const ps = (id: string) => nodo(id).practice_script;
const fallas = (id: string) => ps(id).failure_criteria.map((f: any) => f.id);
const caso = (id: string) => red.cases.find((c: any) => c.id === id);

describe("el silencio después del cierre", () => {
  it("la 5.14 ya no castiga aguantar, y su cliente ya no usa el silencio para dudar", () => {
    expect(fallas("5.14")).not.toContain("silencio_despues_del_cierre");
    expect(ps("5.14").phases.you_do.prompt).not.toContain("SI DA EL CIERRE Y SE QUEDA CALLADO");
    expect(ps("5.14").phases.i_do.briefing).toContain("Y en cuanto lo digo, me callo.");
  });
  it("en la 5.13 y la 5.14 el «déjeme pensarlo» que llega después no es castigo: es una objeción", () => {
    expect(ps("5.13").phases.you_do.prompt).toContain("No es porque lo haya hecho mal: así eres hoy.");
    expect(ps("5.14").phases.you_do.prompt).toContain("No es porque lo haya hecho mal: asi eres hoy.");
    for (const n of ["5.13", "5.14"]) expect(fallas(n)).toContain("salta_la_bala");
    expect(caso("G113_objecion_despues_de_aguantar").expected.must_not_flag).toContain("llena_el_silencio");
  });
  it("la 5.13 ya no califica la consolidación (mundo 6)", () => {
    expect(fallas("5.13")).not.toContain("sobre_reaseguro");
    expect(ps("5.13").phases.you_do.prompt).not.toContain("Segunda ola");
  });
});

describe("FFF completo en la 5.8", () => {
  it("el ejemplo muestra los cinco pasos y se califica cerrar sin bala", () => {
    const demo = ps("5.8").phases.i_do.first_message;
    for (const paso of ["Entiendo:", "Sintió:", "Encontramos:", "Una bala:", "Cierro con acción:"]) expect(demo).toContain(paso);
    expect(fallas("5.8")).toContain("salta_la_bala");
    expect(JSON.stringify(ps("5.8"))).not.toMatch(/reencuadre/i);
    expect(caso("G112_fff_sin_bala").expected.must_flag).toEqual(["salta_la_bala"]);
  });
});

describe("el cliente simulado no contradice lo que se califica", () => {
  it("la bala ya dicha y conectada con la objeción sí cuenta (5.10 y 5.12)", () => {
    expect(ps("5.10").phases.you_do.prompt).toContain("o uno que ya dijo pero que ahora conecta con tu preocupacion");
    expect(ps("5.12").phases.you_do.prompt).toContain("Si la conecta con tu segunda objeción, sí cuenta.");
  });
  it("el cargador se vacía desde dos argumentos, como la falla", () => {
    for (const n of ["5.8", "5.12"]) {
      expect(ps(n).phases.you_do.prompt).not.toContain("3+");
      expect(ps(n).phases.you_do.prompt).toContain("dos o más argumentos");
    }
  });
  it("el ejemplo de la 5.12 ya no le pide al cliente que pruebe y compare", () => {
    expect(ps("5.12").phases.i_do.first_message).not.toMatch(/compare usted mismo/);
  });
});

describe("ni lo no enseñado ni dos veces lo mismo", () => {
  it("5.3 sin ignora_pistas", () => {
    expect(fallas("5.3")).not.toContain("ignora_pistas");
    expect(fallas("5.3")).toContain("sigue_presentando");
  });
  it("el jefe 5.15: la condición se pelea con asumir con presión, y cerrar con «¿le interesa?» es grave", () => {
    const f = ps("5.15").failure_criteria;
    expect(f.find((x: any) => x.id === "pelea_la_condicion").regla_id).toBe("close.asume_con_presion");
    expect(f.find((x: any) => x.id === "abre_puerta_al_no").severity).toBe("critical");
    expect(ps("5.15").phases.you_do.objective).not.toContain("desmonta su minimización");
    expect(ps("5.15").phases.you_do.prompt).not.toMatch(/7\.2\/7\.3|del 6\.3/);
  });
});

describe("la red cubre todas las prácticas del mundo 5", () => {
  it("cada práctica del mundo 5 tiene al menos un caso", () => {
    const practicas = nodos.filter((n) => n.world_id === 5 && n.practice_script).map((n) => n.id);
    for (const id of practicas) expect(red.cases.some((c: any) => c.node_id === id)).toBe(true);
  });
  it("los nombres llevan acento", () => {
    expect(nodo("5.2").name).toBe("Las Señales de Compra");
    expect(nodo("5.4").name).toBe("Objeción = Señal de Compra");
    expect(nodo("5.9").name).toBe("El Círculo de Cierre");
  });
});
