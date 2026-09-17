// Prueba de humo DESPUÉS de publicar: las rutas críticas tienen que responder 200
// y el canario /datos/salud tiene que decir ok. Si algo falla, es una EMERGENCIA.
// Uso: node scripts/humo-publicado.mjs https://tintorapos.sitios.dev
const base = (process.argv[2] ?? process.env.SITIO_URL ?? "").replace(/\/$/, "");
if (!base.startsWith("https://")) {
  console.error("Falta la dirección del sitio publicado (https://…).");
  process.exit(1);
}
const rutas = [
  "/",
  "/entrar",
  "/registro",
  "/docs",
  "/privacidad",
  "/terminos",
  "/llms.txt",
  "/manifest.webmanifest",
];
let fallos = 0;
for (const ruta of rutas) {
  const r = await fetch(base + ruta, { redirect: "manual" });
  const ok = r.status === 200;
  if (!ok) fallos++;
  console.info(`${ok ? "ok " : "MAL"} ${r.status} ${ruta}`);
}
const salud = await fetch(base + "/datos/salud");
const cuerpo = await salud.json().catch(() => ({}));
console.info(
  `${salud.status === 200 ? "ok " : "MAL"} ${salud.status} /datos/salud → ${JSON.stringify(cuerpo)}`,
);
if (salud.status !== 200) fallos++;
if (fallos) {
  console.error(`EMERGENCIA: ${fallos} comprobación(es) fallaron en ${base}`);
  process.exit(1);
}
console.info("Humo post-publicación: todo 200.");
