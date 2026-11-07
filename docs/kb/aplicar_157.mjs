// Mensaje 157 · «Tu negocio» y las preguntas justo a tiempo antes de cada nodo.
// Reemplaza 8 archivos y crea 4, con el contenido exacto que trae aplicar_157.json.
// Uso (desde la raíz del proyecto): node docs/kb/aplicar_157.mjs
// Antes de escribir NADA revisa el md5 de los 12 archivos: si uno solo no es el esperado
// (o un archivo nuevo ya existe con otro contenido), no toca ninguno y dice cuál.
import fs from "fs";
import path from "path";
import crypto from "crypto";

const md5 = (s) => crypto.createHash("md5").update(s).digest("hex");
const { archivos } = JSON.parse(fs.readFileSync(new URL("./aplicar_157.json", import.meta.url), "utf8"));

const malos = [];
for (const [ruta, { antes, despues, contenido }] of Object.entries(archivos)) {
  if (despues !== null && md5(contenido) !== despues) malos.push(`${ruta}: el contenido del manifiesto no coincide con su md5 (archivo dañado al subirlo)`);
  const existe = fs.existsSync(ruta);
  const h = existe ? md5(fs.readFileSync(ruta, "utf8")) : null;
  if (h === despues) continue; // ya aplicado (o ya borrado)
  if (antes === null ? existe : h !== antes) malos.push(`${ruta}: md5 ${h ?? "no existe"}, esperaba ${antes ?? "que no existiera"}`);
}
if (malos.length) {
  console.error("NO SE CAMBIÓ NADA. Estos archivos no están como se esperaba:\n" + malos.join("\n"));
  process.exit(1);
}
for (const [ruta, { despues, contenido }] of Object.entries(archivos)) {
  if (despues === null) { if (fs.existsSync(ruta)) fs.unlinkSync(ruta); continue; }
  fs.mkdirSync(path.dirname(ruta), { recursive: true });
  fs.writeFileSync(ruta, contenido);
}
const ok = Object.entries(archivos).every(([r, { despues }]) =>
  despues === null ? !fs.existsSync(r) : md5(fs.readFileSync(r, "utf8")) === despues);
console.log(ok ? `Listo: ${Object.keys(archivos).length} archivos, todos con su md5 esperado.` : "ALGO SALIÓ MAL al escribir: revisa los md5.");
