// Comprueba las variables de .dev.vars (o del entorno) antes de arrancar.
// Uso: npm run check:env   ·   npm run check:env -- --produccion
import { readFileSync, existsSync } from "node:fs";

const produccion = process.argv.includes("--produccion");
const fuente = { ...process.env };
if (existsSync(".dev.vars")) {
  for (const linea of readFileSync(".dev.vars", "utf8").split("\n")) {
    const m = linea.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m) fuente[m[1]] = m[2];
  }
}
const obligatorias = ["APP_SECRET", "APP_URL"];
const produccionObligatorias = ["RELOJ_SECRETO", "BACKUP_KEY"];
const errores = [];
for (const k of obligatorias) if (!fuente[k]) errores.push(`Falta ${k}`);
if (fuente.APP_SECRET && fuente.APP_SECRET.length < 32)
  errores.push("APP_SECRET debe tener al menos 32 caracteres");
if (fuente.BACKUP_KEY && Buffer.from(fuente.BACKUP_KEY, "base64").length !== 32)
  errores.push("BACKUP_KEY debe ser 32 bytes en base64");
if (produccion)
  for (const k of produccionObligatorias) if (!fuente[k]) errores.push(`Falta ${k} (producción)`);
if (errores.length) {
  console.error("Variables de entorno con problemas:\n- " + errores.join("\n- "));
  process.exit(1);
}
console.log("Variables de entorno: ok");
