/* Tintora POS — service worker.
 * - Estáticos (/_next/static, íconos): primero caché (no cambian: llevan hash).
 * - Pantallas de la tienda (/app/...): primero red; sin conexión, la última copia.
 * - /datos y /media: nunca se guardan aquí (los datos viajan por la cola del dispositivo).
 */
const VERSION = "tintora-v1";
const ESTATICOS = `estaticos-${VERSION}`;
const PAGINAS = `paginas-${VERSION}`;
const PRECARGA = ["/app", "/app/mostrador", "/app/entrega", "/app/produccion", "/app/pin"];

self.addEventListener("install", (evento) => {
  self.skipWaiting();
  evento.waitUntil(
    caches.open(PAGINAS).then(async (cache) => {
      for (const url of PRECARGA) {
        try {
          const r = await fetch(url, { credentials: "include", redirect: "manual" });
          if (r.ok && r.type === "basic") await cache.put(url, r);
        } catch (_e) {
          /* sin conexión al instalar: se guarda en la próxima visita */
        }
      }
    }),
  );
});

self.addEventListener("activate", (evento) => {
  evento.waitUntil(
    caches
      .keys()
      .then((claves) => Promise.all(claves.filter((c) => !c.endsWith(VERSION)).map((c) => caches.delete(c))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("message", (evento) => {
  if (evento.data === "limpiar-paginas") evento.waitUntil(caches.delete(PAGINAS));
});

function paginaSinConexion() {
  return new Response(
    '<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Tintora POS</title><body style="font-family:system-ui;padding:32px;text-align:center;background:#f6f5fb;color:#16122b"><h1>Sin conexión · Offline</h1><p>Vuelve a intentar cuando regrese internet.<br>Try again when you\'re back online.</p><button onclick="location.reload()" style="padding:12px 20px;border-radius:12px;border:0;background:#3524a8;color:#fff;font-weight:700">Reintentar · Retry</button></body>',
    { status: 503, headers: { "content-type": "text/html; charset=utf-8" } },
  );
}

self.addEventListener("fetch", (evento) => {
  const pedido = evento.request;
  if (pedido.method !== "GET") return;
  const url = new URL(pedido.url);
  if (url.origin !== self.location.origin) return;
  if (url.pathname.startsWith("/datos/") || url.pathname.startsWith("/media/")) return;

  if (
    url.pathname.startsWith("/_next/static/") ||
    url.pathname.startsWith("/iconos/") ||
    url.pathname.startsWith("/marca/")
  ) {
    evento.respondWith(
      caches.open(ESTATICOS).then(async (cache) => {
        const guardado = await cache.match(pedido);
        if (guardado) return guardado;
        const r = await fetch(pedido);
        if (r.ok) cache.put(pedido, r.clone());
        return r;
      }),
    );
    return;
  }

  const esNavegacion = pedido.mode === "navigate" && url.pathname.startsWith("/app");
  if (!esNavegacion) return;
  evento.respondWith(
    (async () => {
      try {
        const r = await fetch(pedido);
        if (r.ok && !r.redirected && !url.pathname.includes("/imprimir")) {
          const cache = await caches.open(PAGINAS);
          cache.put(url.pathname, r.clone());
        }
        return r;
      } catch (_e) {
        const cache = await caches.open(PAGINAS);
        return (
          (await cache.match(url.pathname)) || (await cache.match("/app/mostrador")) || paginaSinConexion()
        );
      }
    })(),
  );
});
