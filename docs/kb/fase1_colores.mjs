// Mensaje 145 · Fase 1 del rediseño: un solo sistema de colores.
// Cambia cada color escrito a mano en las pantallas por su variable (var(--c-…)), definida una sola vez
// en src/styles.css. No cambia nada más: ni textos, ni lógica, ni tamaños.
// Uso (desde la raíz del proyecto): node docs/kb/fase1_colores.mjs
// Antes de tocar un archivo verifica su md5; si alguno no es el esperado, no toca NINGUNO y dice cuál.
import fs from "fs";
import crypto from "crypto";

const md5 = (s) => crypto.createHash("md5").update(s).digest("hex");
const manifest = JSON.parse(fs.readFileSync(new URL("./fase1_manifest.json", import.meta.url), "utf8"));

// 1) Colores sólidos → variable
const HEX = {
  FF6B2B: "primary", FF7A42: "primary-hover", FF7D47: "primary-hover",
  "08080F": "bg", "1E0A30": "bg-glow",
  "0B0B12": "surface", "0D0D18": "surface", "111118": "surface", "12121C": "surface", "14141C": "surface", "15151F": "surface",
  "1A1A26": "elevated", "1F1F2E": "elevated",
  "252535": "border", "3A3A52": "border-strong",
  F0F0F5: "text", C8C8D8: "text-soft", A0A0C0: "text-soft", "9090B0": "text-soft", "5A5A8A": "text-2",
  FFD166: "gold", FFB020: "gold",
  EF476F: "danger", FF5C5C: "danger", FF6B6B: "danger", E0322B: "danger", FF9C9C: "danger-soft",
  "06D6A0": "success", "86EFAC": "success-soft",
  "4DABF7": "client", "3B82F6": "client", "7DD3FC": "client-soft",
  B57BEE: "danger",
  "3A2A22": "disabled-bg", "7A6358": "disabled-text",
};
// 2) Colores con transparencia → misma variable con su transparencia
const RGB = {
  "255,107,43": "primary", "8,8,15": "bg", "240,240,245": "text",
  "6,214,160": "success", "239,71,111": "danger", "77,171,247": "client", "255,209,102": "gold",
  "26,26,38": "elevated", "59,130,246": "client", "120,180,255": "client", "160,200,255": "client",
  "34,197,94": "success", "255,180,180": "danger",
};

function convertir(txt) {
  txt = txt.replace(/#([0-9a-fA-F]{6})\b/g, (m, h) => {
    const k = HEX[h.toUpperCase()];
    return k ? `var(--c-${k})` : m;
  });
  txt = txt.replace(/rgba\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*,\s*([0-9.]+)\s*\)/g, (m, r, g, b, a) => {
    const k = RGB[`${r},${g},${b}`];
    return k ? `rgb(var(--c-${k}-rgb) / ${a})` : m;
  });
  return txt;
}

// 3) Cambios puntuales que una sustitución sola rompería o que pide la auditoría
const PUNTUALES = {
  // Un color + "55" al final ya no funciona con una variable: se escribe la transparencia de otra forma.
  "src/routes/nodo.$nodeId.practica.tsx": [
    ["${micBg}55", "color-mix(in srgb, ${micBg} 33%, transparent)"],
    ["${ORANGE}55", "color-mix(in srgb, ${ORANGE} 33%, transparent)"],
  ],
  // El confeti se dibuja en un canvas, que no entiende variables: sus colores se quedan escritos, ya con la paleta de Closer.
  "src/components/VictoryScreen.tsx": [
    ['const colors = ["var(--c-primary)", "var(--c-gold)", "var(--c-success)", "var(--c-danger)", "#ffffff"];',
     'const colors = ["#FF6B2B", "#F2C14E", "#FFFFFF", "#FFB088"]; // canvas: sin variables'],
  ],
  // La burbuja del coach tapaba los botones de entrar, crear cuenta y elegir modo (auditoría, Fase 1).
  "src/routes/login.tsx": [
    ['import { AuthCoachBubble } from "@/components/closer/AuthCoachBubble";\n', ""],
    ["      <AuthCoachBubble />\n", ""],
  ],
  "src/routes/signup.tsx": [
    ['import { AuthCoachBubble } from "@/components/closer/AuthCoachBubble";\n', ""],
    ["      <AuthCoachBubble />\n", ""],
  ],
  "src/routes/role.tsx": [
    ['import { AuthCoachBubble } from "@/components/closer/AuthCoachBubble";\n', ""],
    ["      <AuthCoachBubble />\n", ""],
  ],
};

// Verificar TODO antes de escribir nada
const malos = [];
for (const [ruta, { antes }] of Object.entries(manifest.archivos)) {
  if (!fs.existsSync(ruta)) { malos.push(`${ruta}: no existe`); continue; }
  const h = md5(fs.readFileSync(ruta, "utf8"));
  if (h !== antes && h !== manifest.archivos[ruta].despues) malos.push(`${ruta}: md5 ${h}, esperaba ${antes}`);
}
if (malos.length) {
  console.error("NO SE CAMBIÓ NADA. Estos archivos no están como se esperaba:\n" + malos.join("\n"));
  process.exit(1);
}

const salida = {};
for (const [ruta, { antes, despues }] of Object.entries(manifest.archivos)) {
  const orig = fs.readFileSync(ruta, "utf8");
  if (md5(orig) === despues) { salida[ruta] = orig; continue; } // ya estaba aplicado
  let txt = ruta === "src/styles.css" ? orig : convertir(orig);
  for (const [a, b] of PUNTUALES[ruta] ?? []) {
    if (txt.split(a).length !== 2) { console.error(`NO SE CAMBIÓ NADA. En ${ruta} no encontré exactamente una vez: ${a}`); process.exit(1); }
    txt = txt.replace(a, b);
  }
  if (ruta === "src/styles.css") txt = manifest.styles_css;
  if (md5(txt) !== despues) { console.error(`NO SE CAMBIÓ NADA. ${ruta} quedaría con md5 ${md5(txt)}, esperaba ${despues}`); process.exit(1); }
  salida[ruta] = txt;
}
for (const [ruta, txt] of Object.entries(salida)) fs.writeFileSync(ruta, txt);
console.log(`Listo: ${Object.keys(salida).length} archivos, todos con su md5 esperado.`);
