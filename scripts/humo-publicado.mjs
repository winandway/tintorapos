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
  "/es",
  "/en",
  "/entrar",
  "/registro",
  "/en/signup",
  "/docs",
  "/es/docs",
  "/en/docs/getting-started",
  "/privacidad",
  "/en/privacy",
  "/terminos",
  "/llms.txt",
  "/sitemap.xml",
  "/robots.txt",
  "/manifest.webmanifest",
];
let fallos = 0;
for (const ruta of rutas) {
  const r = await fetch(base + ruta, { redirect: "manual" });
  const ok = r.status === 200;
  if (!ok) fallos++;
  console.info(`${ok ? "ok " : "MAL"} ${r.status} ${ruta}`);
}
// El sitemap tiene que traer solo direcciones del dominio canónico.
const sitemap = await (await fetch(base + "/sitemap.xml")).text();
if (!sitemap.includes("<loc>https://tintorapos.com") || sitemap.includes("sitios.dev")) {
  fallos++;
  console.info("MAL sitemap.xml: no trae direcciones de https://tintorapos.com");
}
// Canario: lo vital (base, almacén, variables) tumba el humo; lo que falta configurar se avisa.
const salud = await fetch(base + "/datos/salud");
const cuerpo = await salud.json().catch(() => ({}));
const vitales = ["base", "almacen", "variables"].filter((p) => cuerpo?.piezas?.[p]?.estado !== "ok");
const pendientes = Object.entries(cuerpo?.piezas ?? {})
  .filter(([, v]) => v.estado !== "ok")
  .map(([k, v]) => `${k}=${v.estado}`);
console.info(`${vitales.length ? "MAL" : "ok "} ${salud.status} /datos/salud`);
if (pendientes.length) console.info(`    avisos del canario: ${pendientes.join(", ")}`);
if (vitales.length) fallos++;
if (fallos) {
  console.error(`EMERGENCIA: ${fallos} comprobación(es) fallaron en ${base}`);
  process.exit(1);
}
console.info("Humo post-publicación: todo 200.");
