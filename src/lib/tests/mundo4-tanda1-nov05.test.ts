import { describe, it, expect } from "vitest";
import { readFileSync } from "fs";
import { resolve } from "path";

// Mensaje 134 (Emilio, 5-nov-2026): el mundo 4 se liga a la doctrina, paso por paso.
// · Las balas salen de tres lugares: producto, servicio y precio (tú y tu empresa entran en servicio).
// · Presentar un hueco es la misma balanza: qué valor le sumas o qué costo le bajas, con esas balas,
//   escogidas para su caso. «Un proveedor menos» solo es bala cuando aplica.
// · Asumir: se dan opciones y el cliente escoge; nada de «se la traigo el jueves» ni de «¿cómo lo ve?».
// · Nunca se califica lo que no se ha enseñado: el tren del sí (4.12) va antes de asumir (4.11).
// · Nada de consignación. P de FUJPIG = Poder de sugestión.

const kb = (f: string) => readFileSync(resolve(__dirname, "../../../docs/kb", f), "utf8");
const cerebro = kb("cerebro_snapshot.md");
const reglas: any[] = JSON.parse(kb("reglas.json"));
const tarjetas: any[] = JSON.parse(kb("cards_snapshot.json"));
const quizzes: any[] = JSON.parse(kb("quizzes_snapshot.json"));
const regla = (id: string) => reglas.find((r) => r.id === id).resumen as string;
const t = (n: string, o: number) => tarjetas.find((x) => x.node_id === n && x.card_order === o);
const mundo4 = tarjetas.filter((x) => /^4\./.test(x.node_id));
const texto = (x: any) => `${x.title ?? ""} ${x.body ?? ""} ${x.flip_back_text ?? ""}`;

describe("las balas: producto, servicio y precio", () => {
  it("el Cerebro, la regla y la tarjeta del 4.5 lo dicen igual", () => {
    expect(cerebro).toContain("- **El servicio** — tú y tu empresa");
    expect(cerebro).not.toContain("- **Ti / tu empresa**");
    expect(cerebro).toContain("Con cada bala mueves la balanza: subes el valor o bajas el costo.");
    expect(regla("present.balas")).toContain("sobre el producto, el servicio (tú, tu empresa y cómo se lo haces llegar) o el precio");
    expect(t("4.5", 3).title).toBe("De dónde salen: producto, servicio y precio");
    expect(t("4.5", 3).body).toContain("SERVICIO — tú, tu empresa y cómo se lo haces llegar");
  });
});

describe("presentar un hueco: la misma balanza", () => {
  it("el Cerebro ya no trae una lista aparte de razones", () => {
    const hueco = cerebro.slice(cerebro.indexOf("## 4.3 Presentar un hueco"), cerebro.indexOf("## 4.4 Convicción sin garantía"));
    expect(hueco).toContain("Es la balanza de siempre: qué valor le sumas o qué costo le bajas.");
    expect(hueco).not.toContain("**Complementariedad**");
    expect(hueco).toContain("es una bala de servicio solo cuando aplica");
    expect(hueco).toContain("Muchos negocios tienen dos o tres proveedores para el mismo producto, a propósito");
    expect(hueco).toContain("La consolidación NO es un argumento universal");
  });
  it("la regla y las tarjetas del 4.15 lo aplican", () => {
    expect(regla("present.argumento_del_hueco")).toContain("«Un proveedor menos» solo vale si el cliente dejó ver que le pesa tratar con tantos proveedores");
    expect(regla("present.consolidacion_falsa")).toContain("LA PRUEBA:");
    const n415 = tarjetas.filter((x) => x.node_id === "4.15").map(texto).join(" ");
    expect(n415).not.toMatch(/Lo que vendes es un proveedor menos|es lo [uú]nico que tienes que [eé]l no/i);
    expect(t("4.15", 3).body).toContain("Para un hueco usas las mismas balas de siempre: producto, servicio y precio.");
  });
});

describe("asumir es dar opciones; el cliente escoge", () => {
  it("4.11: el ejemplo da a escoger y ya no enseña a arreglar la presión", () => {
    expect(t("4.11", 2).body).toContain("¿Se la traigo el jueves o el viernes");
    expect(t("4.11", 2).body).not.toContain("Se la traigo el jueves que ando por acá");
    expect(t("4.11", 3).body).toContain("Si le das opciones y él escoge, asumiste bien.");
    expect(texto(t("4.11", 3))).not.toMatch(/c[oó]mo lo ve/i);
  });
  it("ningún ejemplo del mundo 4 promete garantías", () => {
    expect(mundo4.map(texto).join(" ")).not.toMatch(/garantizad[oa]/i);
  });
});

describe("FUJPIG y la balanza", () => {
  it("P = Poder de sugestión, con el tren del sí y asumir", () => {
    expect(t("4.7", 2).body).toContain("P — POWER OF SUGGESTION / Poder de sugestión");
    expect(t("4.7", 5).body).toContain("PODER DE SUGESTIÓN.");
    expect(regla("impulse.factores")).toContain("poder de sugestión (el tren del sí y asumir)");
  });
  it("nada de consignación", () => {
    expect(mundo4.map(texto).join(" ")).not.toMatch(/consignaci/i);
  });
  it("SW3 se explica donde se usa", () => {
    expect(t("4.10", 2).body).toContain("SW3: Some Will, Some Won't, So What.");
  });
  it("las balas: unas tres antes del precio, y el jefe del mundo 4 es el cuarto", () => {
    expect(t("4.6", 1).body).toContain("En la presentación, unas tres antes del precio es lo normal");
    expect(t("4.16", 1).title).toBe("Reto final del Mundo 4.");
  });
});

describe("las lecciones del mundo 4 tienen su quiz", () => {
  it("4.5 y 4.13: tres preguntas cada uno, con regla que existe", () => {
    for (const n of ["4.5", "4.13"]) {
      const qs = quizzes.filter((q) => q.node_id === n);
      expect(qs).toHaveLength(3);
      for (const q of qs) expect(reglas.some((r) => r.id === q.regla_id)).toBe(true);
    }
  });
});

describe("ortografía del mundo 4", () => {
  it("sin los errores de dedo que había", () => {
    const todo = mundo4.map(texto).join(" ");
    for (const malo of ["La negocios", "buena movimiento", "el de la unidades", "servería", " áncla ", "numero", "dejeme", "Que bueno que lo tenga"]) {
      expect(todo).not.toContain(malo);
    }
  });
});
