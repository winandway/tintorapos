/**
 * Reproduce el recorrido completo (producción → entregar → página del cliente →
 * volver a escanear) en el motor de Safari (WebKit) con un iPhone emulado, contra
 * el sitio EN VIVO y con el demo público. No toca ninguna tienda real. Sirve para
 * comprobar, cuando alguien dice que «no pasa nada» en un iPhone, que cada paso
 * llega al servidor (CANDADOS B44).
 *
 *   npx playwright install webkit      # una sola vez
 *   node scripts/repro-webkit.mjs [carpeta-para-capturas]
 */
import { webkit, devices } from "@playwright/test";
const S = process.argv[2] ?? ".";
import { mkdirSync } from "node:fs";
mkdirSync(`${S}/webkit`, { recursive: true });
const b = await webkit.launch();
const ctx = await b.newContext({ ...devices["iPhone 13"], locale: "es-CO" });
const p = await ctx.newPage();
const red = [];
const consola = [];
p.on("response", (r) => {
  const u = new URL(r.url());
  if (u.pathname.startsWith("/datos"))
    red.push(`${r.request().method()} ${u.pathname}${u.search} → ${r.status()}`);
});
p.on("requestfailed", (r) => {
  const u = new URL(r.url());
  red.push(`${r.method()} ${u.pathname} → FALLÓ ${r.failure()?.errorText}`);
});
p.on("console", (m) => {
  if (m.type() === "error" || m.type() === "warning") consola.push(`${m.type()}: ${m.text().slice(0, 160)}`);
});
p.on("pageerror", (e) => consola.push(`pageerror: ${e.message}`));

const j = (u) =>
  p.evaluate(async (u) => {
    const r = await fetch(u, { headers: { accept: "application/json" } });
    return { status: r.status, body: await r.json().catch(() => null) };
  }, u);
const paso = (t) => console.log("\n== " + t);

paso("abrir demo");
await p.goto("https://tintorapos.com/es", { waitUntil: "networkidle" });
await p.getByRole("button", { name: "Abrir la demostración" }).first().click();
await p.waitForURL(/\/app/, { timeout: 60_000 });
await p.waitForLoadState("networkidle");
console.log(
  "url:",
  p.url(),
  "| SW:",
  await p.evaluate(() => Boolean(navigator.serviceWorker?.controller)),
  "| onLine:",
  await p.evaluate(() => navigator.onLine),
);

paso("producción: elegir una orden recibida y marcar LISTA desde la pantalla");
await p.goto("https://tintorapos.com/app/produccion", { waitUntil: "networkidle" });
const lista = await j("/datos/ordenes?estado=abiertas");
const recibida = lista.body.ordenes.find((o) => o.estado === "recibida");
console.log("orden elegida:", recibida.numero, recibida.estado);
await p
  .getByRole("button")
  .filter({ hasText: String(recibida.numero) })
  .first()
  .click();
await p.getByRole("button", { name: "Lista", exact: true }).click();
await p.waitForTimeout(3000);
await p.screenshot({ path: `${S}/webkit/1-produccion.png` });
let det = await j(`/datos/ordenes/${recibida.id}`);
console.log("servidor dice:", det.body.orden.estado, det.body.orden.prendas.map((x) => x.estado).join(","));
console.log(
  "tarjeta en pantalla:",
  await p
    .locator("section[aria-live]")
    .innerText()
    .then((t) => t.replace(/\s+/g, " ").slice(0, 160)),
);

paso("entregar: buscar por número y entregar (cobrando el saldo)");
await p.goto("https://tintorapos.com/app/entrega", { waitUntil: "networkidle" });
const campo = p.getByLabel("Recibo, celular, nombre o número");
await campo.fill(String(recibida.numero));
await campo.press("Enter");
const boton = p.getByRole("button", { name: /Cobrar .* y entregar|^Entregar$|Entregar igual/ });
await boton.waitFor({ timeout: 15_000 });
console.log("botón:", await boton.innerText(), "| habilitado:", await boton.isEnabled());
await boton.click();
await p.waitForTimeout(4000);
await p.screenshot({ path: `${S}/webkit/2-entrega.png` });
console.log(
  "mensaje:",
  await p
    .locator('[role="status"], [role="alert"]')
    .allInnerTexts()
    .then((t) => t.map((x) => x.replace(/\s+/g, " ")).join(" | ")),
);
det = await j(`/datos/ordenes/${recibida.id}`);
console.log(
  "servidor dice:",
  det.body.orden.estado,
  "| avisos cola pendientes:",
  await p.evaluate(
    () =>
      new Promise((res) => {
        const rq = indexedDB.open("tintora-pos");
        rq.onsuccess = () => {
          const db = rq.result;
          if (!db.objectStoreNames.contains("cola")) return res("sin cola");
          const g = db.transaction("cola").objectStore("cola").getAll();
          g.onsuccess = () => res(g.result.length);
        };
        rq.onerror = () => res("error idb");
      }),
  ),
);

paso("página del cliente (como la ve el celular del cliente)");
const codigo = det.body.orden.codigoPublico;
const cli = await ctx.newPage();
await cli.goto(`https://tintorapos.com/t/${codigo}`, { waitUntil: "networkidle" });
console.log(
  "estado público:",
  await cli.getByTestId("estado-publico").innerText(),
  "|",
  await cli.getByTestId("piezas-publico").innerText(),
);
await cli.screenshot({ path: `${S}/webkit/3-cliente.png`, fullPage: true });

paso("volver a escanear el recibo (URL del QR) en Entregar y en Producción");
await p.goto("https://tintorapos.com/app/entrega", { waitUntil: "networkidle" });
await p.getByLabel("Recibo, celular, nombre o número").fill(`https://tintorapos.com/t/${codigo}`);
await p.getByLabel("Recibo, celular, nombre o número").press("Enter");
await p.waitForTimeout(3000);
console.log(
  "entregar muestra:",
  await p
    .locator("#contenido")
    .innerText()
    .then((t) => t.replace(/\s+/g, " ").slice(0, 400)),
);
await p.screenshot({ path: `${S}/webkit/4-reescaneo-entrega.png` });
await p.goto("https://tintorapos.com/app/produccion", { waitUntil: "networkidle" });
await p.getByLabel("Código, QR o número de orden").fill(`https://tintorapos.com/t/${codigo}`);
await p.getByLabel("Código, QR o número de orden").press("Enter");
await p.waitForTimeout(3000);
console.log(
  "producción muestra:",
  await p
    .locator("section[aria-live]")
    .innerText()
    .then((t) => t.replace(/\s+/g, " ").slice(0, 300))
    .catch(() => "sin tarjeta"),
);
await p.screenshot({ path: `${S}/webkit/5-reescaneo-produccion.png` });

paso("red /datos");
console.log(red.join("\n"));
paso("consola");
console.log(consola.join("\n") || "(limpia)");
await b.close();
