// Agrega una sección nueva a los dos diccionarios (es y en) sin editar a mano.
// Uso: node scripts/i18n-seccion.mjs <nombre>   (los archivos es/<nombre>.ts y en/<nombre>.ts deben existir)
import { readFileSync, writeFileSync } from "node:fs";

const nombre = process.argv[2];
if (!nombre || !/^[a-z][a-zA-Z]*$/.test(nombre)) {
  console.error("Uso: node scripts/i18n-seccion.mjs <nombre>");
  process.exit(1);
}
for (const idioma of ["es", "en"]) {
  const ruta = `src/lib/i18n/diccionarios/${idioma}.ts`;
  let s = readFileSync(ruta, "utf8");
  const imp = `import { ${nombre} } from "./${idioma}/${nombre}";`;
  if (!s.includes(imp)) {
    const ultimaImport = [...s.matchAll(/^import .*;$/gm)].pop();
    const i = (ultimaImport?.index ?? 0) + (ultimaImport?.[0].length ?? 0);
    s = s.slice(0, i) + "\n" + imp + s.slice(i);
  }
  const inicio = s.indexOf("export const ");
  const abre = s.indexOf("{", inicio);
  const cierra = s.indexOf("};", abre);
  if (inicio < 0 || abre < 0 || cierra < 0) throw new Error(`No encontré el objeto exportado en ${ruta}`);
  const claves = s
    .slice(abre + 1, cierra)
    .split(",")
    .map((x) => x.trim())
    .filter(Boolean);
  if (!claves.includes(nombre)) claves.push(nombre);
  s = `${s.slice(0, abre + 1)}\n${claves.map((c) => `  ${c},`).join("\n")}\n${s.slice(cierra)}`;
  writeFileSync(ruta, s);
}
console.info(`Sección «${nombre}» agregada a es y en.`);
