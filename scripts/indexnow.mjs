// Avisa a los buscadores que usan IndexNow (Bing, Yandex, Seznam, Naver…) de todas las
// direcciones del sitemap publicado. La clave es pública a propósito: vive en
// https://tintorapos.com/7d7a8f4478842317bb5efdfeeb52e753.txt y solo prueba que el dominio es nuestro.
// Uso: node scripts/indexnow.mjs   (después de publicar)
const SITIO = "https://tintorapos.com";
const CLAVE = "7d7a8f4478842317bb5efdfeeb52e753";
const xml = await (await fetch(`${SITIO}/sitemap.xml`)).text();
const urls = [...new Set([...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]))];
if (!urls.length || urls.some((u) => !u.startsWith(SITIO))) {
  console.error("El sitemap publicado no trae direcciones de", SITIO);
  process.exit(1);
}
const r = await fetch("https://api.indexnow.org/indexnow", {
  method: "POST",
  headers: { "content-type": "application/json; charset=utf-8" },
  body: JSON.stringify({
    host: new URL(SITIO).host,
    key: CLAVE,
    keyLocation: `${SITIO}/${CLAVE}.txt`,
    urlList: urls,
  }),
});
console.info(`IndexNow: ${r.status} (${urls.length} direcciones)`);
if (r.status >= 400) process.exit(1);
