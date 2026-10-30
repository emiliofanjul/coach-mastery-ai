// Mensaje 110 (29-oct-2026) · Tanda 1: presentación e impulso.
// Decisiones de Emilio: en la práctica todo es imaginario —se califica cómo se
// usa la herramienta, no si el ejemplo es real—; la verdad se exige en la
// calle. Lo vago no es falla: es la herramienta desperdiciada (a medias). La
// avaricia es la brecha entre el valor percibido y lo que cuesta. Las balas se
// sueltan poco a poco; la falla es vaciarlas de jalón. Convicción no es
// garantía. Un primer pedido chico no es «que lo pruebe». Retomar lo que el
// cliente dijo de su proveedor no es atacarlo.
import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const leer = (p: string) => readFileSync(join(process.cwd(), p), "utf8");
const cerebro = leer("docs/kb/cerebro_snapshot.md");
const reglas: any[] = JSON.parse(leer("docs/kb/reglas.json"));
const nodos: any[] = JSON.parse(leer("docs/kb/nodos_snapshot.json"));
const tarjetas: any[] = JSON.parse(leer("docs/kb/cards_snapshot.json"));
const harness = JSON.parse(leer("supabase/functions/_shared/eval_harness_v1.json"));
const regla = (id: string) => reglas.find((r) => r.id === id);
const nodo = (id: string) => nodos.find((n) => n.id === id);
const caso = (id: string) => harness.cases.find((c: any) => c.id === id);
const TANDA = [
  "impulse.avaricia", "impulse.efecto_jones", "impulse.factores", "impulse.indiferencia", "impulse.indiferencia_teatral",
  "impulse.jones_vago", "impulse.miedo_perdida", "impulse.miedo_perdida_generico", "impulse.presion_directa", "impulse.ruega",
  "impulse.tren_del_si", "impulse.urgencia", "present.argumento_del_hueco", "present.ataca_proveedor", "present.bala_generica",
  "present.balas", "present.beneficio_no_caracteristica", "present.caracteristica_sin_traducir", "present.dos_mitades",
  "present.dosificacion_balas", "present.escalon_sin_motivo", "present.garantiza", "present.pide_que_pruebe",
  "present.pintar_imagenes", "present.plan_b", "present.precio_unico", "present.triple_desglose",
];

describe("Primero el Cerebro (v11)", () => {
  it("la práctica es imaginaria; la calle exige verdad", () => {
    expect(cerebro).toContain("**En la práctica de Closer todo es imaginario** `CAMPO`");
    expect(cerebro).toContain("Por eso en la práctica nunca se califica si algo es real: se califica si la herramienta se usó completa y concreta.");
    expect(cerebro).toContain("1. **Impulso falso está prohibido.**");
  });
  it("los factores como los explicó Emilio", () => {
    expect(cerebro).toContain("**Avaricia** `CAMPO`: es la brecha entre el valor percibido y lo que cuesta adquirirlo.");
    expect(cerebro).toContain("Aplica a lo que hoy está perdiendo y a lo que perdería si no decide ahora.");
    expect(cerebro).toContain("el movimiento genera la emoción y la razón le da el porqué");
    expect(cerebro).toContain("*\"Todo mundo lo lleva\"* sigue siendo Efecto Jones, pero desperdiciado.");
    expect(cerebro).toContain("Cada sí hace más fácil el siguiente");
  });
  it("balas, proveedor, probar y garantía", () => {
    expect(cerebro).toContain("**Cómo se sueltan** `CAMPO`: sistemáticamente, poco a poco, conforme haga falta subir el impulso.");
    expect(cerebro).toContain("contar que otros clientes te han comentado algo parecido, sin afirmar que tú lo viviste");
    expect(cerebro).toContain("Proponer con convicción una cantidad inicial chica no es esto");
    expect(cerebro).toContain("**La diferencia con garantizar** `CAMPO`");
  });
});

describe("Luego las reglas: cada una es una prueba que cita al Cerebro", () => {
  for (const id of TANDA) {
    it(id, () => {
      const r = regla(id);
      expect(r.resumen).toContain("LA PRUEBA");
      expect(cerebro).toContain(r.cita_cerebro);
      expect(r.resumen).not.toMatch(/verificable|inventad/i);
    });
  }
  it("lo imaginario se dice donde importa", () => {
    for (const id of ["impulse.avaricia", "impulse.efecto_jones", "impulse.factores", "impulse.miedo_perdida", "impulse.urgencia", "present.bala_generica", "present.balas"]) {
      expect(regla(id).resumen).toContain("En la práctica todo es imaginario: no se califica si es real, sino si es concreto.");
    }
  });
  it("lo vago está a medias, no es falla", () => {
    expect(regla("impulse.efecto_jones").resumen).toContain("sigue siendo Efecto Jones pero desperdiciado: a medias");
    expect(regla("impulse.jones_vago").resumen).toContain("Un Efecto Jones general que el cliente no cuestiona no es esta falla");
    expect(regla("impulse.jones_vago").severidad_sugerida).toBe("major");
  });
  it("la escasez inventada queda como regla de la calle y ningún guion la califica", () => {
    expect(regla("impulse.escasez_inventada").resumen).toContain("En la práctica de Closer NO se califica");
    const usan = nodos.filter((n) => (n.practice_script?.failure_criteria ?? []).some((f: any) => f.regla_id === "impulse.escasez_inventada")).map((n) => n.id);
    expect(usan).toEqual([]);
  });
});

describe("Los guiones ya no califican lo «inventado»", () => {
  const cambiados = ["2.8", "3.9", "3.9b", "4.2", "4.6", "4.8", "4.9", "4.10", "4.14", "4.15", "4.16", "5.6", "5.8", "5.10", "5.12", "5.15", "7.2", "7.4"];
  it("ningún criterio ni falla habla de verificable o inventado (salvo el hueco, que contradice lo que dijo el cliente)", () => {
    const malos: string[] = [];
    for (const id of cambiados) {
      const ps = nodo(id).practice_script;
      for (const c of [...ps.success_criteria, ...ps.failure_criteria]) {
        if (c.regla_id === "discovery.hueco_inventado") continue;
        if (/verificab|inventa|impulso_falso|jones_falso|cambio_inventado|rafaga/i.test(`${c.id} ${c.description}`)) malos.push(`${id}:${c.id}`);
      }
    }
    expect(malos).toEqual([]);
  });
  it("las fallas renombradas", () => {
    expect(nodo("4.9").practice_script.failure_criteria.map((f: any) => f.id)).toContain("jones_se_cae");
    expect(nodo("4.6").practice_script.failure_criteria.map((f: any) => f.id)).toEqual(expect.arrayContaining(["vacia_las_balas", "bala_inflada"]));
    expect(nodo("4.8").practice_script.failure_criteria.map((f: any) => f.id)).not.toContain("impulso_falso");
    expect(nodo("4.14").practice_script.failure_criteria.map((f: any) => f.id)).not.toContain("descuento_inventado");
    for (const id of ["5.8", "5.12", "5.15", "7.2", "7.4"]) expect(nodo(id).practice_script.failure_criteria.map((f: any) => f.id)).toContain("bala_se_cae");
  });
  it("el cliente simulado reacciona a lo vago y al teatro, no a lo «falso»", () => {
    expect(nodo("4.8").practice_script.phases.you_do.prompt).toContain("(C) si mete escasez o urgencia SIN RAZÓN CONCRETA");
    expect(nodo("4.9").practice_script.phases.you_do.prompt).toContain("si te contesta con algo concreto, lo aceptas");
    expect(nodo("4.6").practice_script.phases.you_do.prompt).not.toContain("TRES O MAS hechos seguidos");
  });
  it("la convicción del 4.15 no es garantía", () => {
    expect(nodo("4.15").practice_script.success_criteria[0].description).toContain("dice que esta seguro de que se va a mover, como lo que el cree, Y da la razon, sin prometerlo como un hecho");
  });
});

describe("La introducción a FUJPIG lo dice", () => {
  it("4.7: en la práctica se imagina; en la calle, lo que tienes", () => {
    const t = (o: number) => tarjetas.find((x) => x.node_id === "4.7" && x.card_order === o).body;
    expect(t(6)).toContain("En la practica de Closer todo es imaginario");
    expect(t(6)).not.toContain("En Closer eso cuenta como falla grave");
    expect(t(4)).toContain("Todo mundo lo lleva sigue siendo Efecto Jones, pero desperdiciado.");
  });
});

describe("La red del mundo 4", () => {
  it("los 14 casos nuevos (desde la v3.26.0)", () => {
    const nuevos = ["G46_jones_imaginado_concreto", "G47_jones_vago_a_medias", "G48_jones_se_cae", "G49_jones_sostenido", "G50_urgencia_con_razon", "G51_escasez_sin_razon", "G52_desglose_imaginado", "G53_escalon_sin_motivo", "G54_conviccion_sin_garantia", "G55_garantiza", "G56_que_lo_pruebe", "G57_balas_poco_a_poco", "G58_vacia_las_balas", "G59_promesa_sin_ancla"];
    for (const id of nuevos) expect(caso(id)).toBeDefined();
  });
  it("cada falla y criterio que piden existe en su nodo", () => {
    const malos: string[] = [];
    for (const c of harness.cases) {
      const ps = nodo(c.node_id)?.practice_script;
      if (!ps) continue;
      const fallas = new Set(ps.failure_criteria.map((f: any) => f.id));
      for (const f of [...(c.expected?.must_flag ?? [])]) if (!fallas.has(f)) malos.push(`${c.id}: ${f}`);
    }
    expect(malos).toEqual([]);
  });
  it("lo imaginado y concreto pasa; lo vago queda a medias; lo que se cae es falla", () => {
    expect(caso("G46_jones_imaginado_concreto").expected.niveles_esperados["impulse.efecto_jones"]).toBe("cumple");
    expect(caso("G47_jones_vago_a_medias").expected.niveles_esperados["impulse.efecto_jones"]).toBe("parcial");
    expect(caso("G48_jones_se_cae").expected.must_flag).toEqual(["jones_se_cae"]);
    expect(caso("G52_desglose_imaginado").expected.niveles_esperados["presentation.price_breakdown"]).toBe("cumple");
  });
});
