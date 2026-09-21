/**
 * Comprueba las etiquetas para Zebra (ZPL) SIN tener una Zebra: manda el mismo
 * código que sale hacia la impresora al emulador público de Labelary, que lo
 * dibuja como lo haría la etiquetera, y lee el QR del dibujo.
 *
 *   node scripts/comprobar-zpl.mjs            # comprueba los tres tamaños
 *   node scripts/comprobar-zpl.mjs carpeta    # y deja ahí los PNG para mirarlos
 *
 * No va dentro de `npm run verify` a propósito: le pega a un servicio de afuera
 * y las pruebas nunca hacen eso. Se corre a mano al tocar
 * `src/lib/impresion/etiquetas.ts`. La etiqueta es de muestra: no viaja ningún
 * dato de un cliente. TSPL no tiene emulador público: ese se prueba con el botón
 * «Imprimir una etiqueta de prueba» en una etiquetera de verdad.
 */
import { build } from "esbuild";
import { mkdir, writeFile } from "node:fs/promises";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const sharp = require("sharp");
const jsQR = require("jsqr");
const salida = process.argv[2];

const paquete = await build({
  entryPoints: ["src/lib/impresion/etiquetas.ts"],
  bundle: true,
  write: false,
  format: "esm",
  platform: "node",
  logLevel: "error",
});
const codigo = Buffer.from(paquete.outputFiles[0].contents).toString("base64");
const { etiquetasZpl, TAMANOS_ETIQUETA } = await import(`data:text/javascript;base64,${codigo}`);

const QR = "https://tintorapos.com/e/MUESTRA00001";
const ETIQUETA = {
  numero: "#1004",
  pieza: "DOM · Pieza 1 de 3",
  prenda: "Pantalón",
  cliente: "Cliente de muestra",
  fecha: "22 sept · URGENTE",
  detalle: "Rosado · Rasgado",
  qr: QR,
};

let fallos = 0;
if (salida) await mkdir(salida, { recursive: true });
const esperar = (ms) => new Promise((r) => setTimeout(r, ms));
const dibujar = (tamano) =>
  fetch(`http://api.labelary.com/v1/printers/8dpmm/labels/${tamano}/0/`, {
    method: "POST",
    headers: { accept: "image/png", "content-type": "application/x-www-form-urlencoded" },
    body: etiquetasZpl([ETIQUETA], tamano),
  });

for (const tamano of Object.keys(TAMANOS_ETIQUETA)) {
  // El emulador gratis corta si se le llama muy seguido (429): se va despacio.
  await esperar(1500);
  let r = await dibujar(tamano);
  if (r.status === 429) {
    await esperar(5000);
    r = await dibujar(tamano);
  }
  if (!r.ok) {
    console.error(`✗ ${tamano}: el emulador respondió ${r.status}`);
    fallos++;
    continue;
  }
  const png = Buffer.from(await r.arrayBuffer());
  if (salida) await writeFile(`${salida}/zpl-${tamano}.png`, png);
  const { data, info } = await sharp(png)
    .resize({ width: 1200, kernel: "nearest" })
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  const leido = jsQR(new Uint8ClampedArray(data), info.width, info.height)?.data ?? null;
  if (leido === QR) console.info(`✓ ${tamano}: se dibuja y el QR se lee`);
  else {
    console.error(`✗ ${tamano}: el QR leyó «${leido}»`);
    fallos++;
  }
}
process.exit(fallos > 0 ? 1 : 0);
