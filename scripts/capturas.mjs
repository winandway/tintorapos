/**
 * Capturas REALES de la app para la página de venta. Se toman de la tintorería
 * de trabajo LOCAL (`npm run demo:local`), nunca de datos de un cliente.
 *
 *   npm run demo:local                      # datos y cookie de sesión
 *   npm run dev                             # servidor en el puerto 3000
 *   node scripts/capturas.mjs http://localhost:3000 <tp_sesion> public/capturas
 *
 * Después se pasan a webp a la mitad del tamaño (salen en 2x):
 *   for f in public/capturas/*.png; do cwebp -q 82 -resize $(($(sips -g pixelWidth $f | awk 'NR==2{print $2}')/2)) 0 "$f" -o "${f%.png}.webp"; rm "$f"; done
 */
import { chromium } from "@playwright/test";
import { mkdir } from "node:fs/promises";

const [, , url, sesion, salida = "public/capturas"] = process.argv;
await mkdir(salida, { recursive: true });
const b = await chromium.launch();

async function tomar(nombre, { ancho = 1440, alto = 900, movil = false, antes }) {
  const ctx = await b.newContext({
    viewport: { width: ancho, height: alto },
    deviceScaleFactor: 2,
    locale: "es-US",
    ...(movil ? { isMobile: true, hasTouch: true } : {}),
  });
  await ctx.addCookies([
    { name: "tp_sesion", value: sesion, url },
    { name: "tp_csrf", value: "demo-local-0123456789", url },
  ]);
  const p = await ctx.newPage();
  p.setDefaultTimeout(60000);
  await antes(p);
  // El botoncito de desarrollo de Next no sale en las capturas del producto.
  await p
    .addStyleTag({ content: "nextjs-portal, #nextjs-portal { display: none !important; }" })
    .catch(() => {});
  await p.waitForTimeout(700);
  await p.screenshot({ path: `${salida}/${nombre}.png` });
  await ctx.close();
  console.info("ok", nombre);
}

const ir = (ruta) => async (p) => {
  await p.goto(`${url}${ruta}`, { waitUntil: "domcontentloaded", timeout: 120000 });
  await p.waitForLoadState("networkidle").catch(() => {});
};

await tomar("panel", { antes: ir("/app") });
await tomar("ordenes", { antes: ir("/app/ordenes") });
await tomar("produccion", { antes: ir("/app/produccion") });
await tomar("entrega", { antes: ir("/app/entrega") });
await tomar("caja", { antes: ir("/app/caja") });
await tomar("reportes", { antes: ir("/app/reportes") });

await tomar("mostrador", {
  antes: async (p) => {
    await ir("/app/mostrador")(p);
    await p.getByLabel("Busca por celular o nombre").fill("305");
    await p.getByText("Ana Martínez").click();
    for (const n of ["Camisa", "Camisa", "Pantalón", "Saco o blazer"]) {
      await p.getByRole("button").filter({ hasText: n }).first().click();
      await p.waitForTimeout(120);
    }
    const marcas = p.getByTestId("marcas-prenda");
    await marcas.getByRole("button", { name: "Botón roto" }).click();
    await marcas.getByRole("button", { name: "Vino", exact: true }).click();
    await marcas.getByRole("button", { name: "Azul oscuro" }).click();
  },
});

await tomar("produccion-celular", {
  ancho: 390,
  alto: 844,
  movil: true,
  antes: ir("/app/produccion"),
});

await tomar("mostrador-tablet", {
  ancho: 1024,
  alto: 768,
  antes: async (p) => {
    await ir("/app/mostrador")(p);
    await p.getByLabel("Busca por celular o nombre").fill("305");
    await p.getByText("Luis Gómez").click();
    for (const n of ["Camisa", "Vestido"]) {
      await p.getByRole("button").filter({ hasText: n }).first().click();
      await p.waitForTimeout(120);
    }
  },
});

// Página pública del cliente y etiquetas: se buscan en la base por la API.
const ctx = await b.newContext();
await ctx.addCookies([
  { name: "tp_sesion", value: sesion, url },
  { name: "tp_csrf", value: "demo-local-0123456789", url },
]);
const api = await ctx.newPage();
await api.goto(`${url}/app`, { waitUntil: "domcontentloaded" });
const { ordenes } = await api.evaluate(async () => {
  const r = await fetch("/datos/ordenes?estado=abiertas", { headers: { accept: "application/json" } });
  return r.json();
});
// La de más prendas: las capturas de etiquetas se ven vacías con una sola pieza.
const orden = [...ordenes].sort((a, b) => (b.piezas ?? 0) - (a.piezas ?? 0))[0];
const { orden: detalle } = await api.evaluate(async (id) => {
  const r = await fetch(`/datos/ordenes/${id}`, { headers: { accept: "application/json" } });
  return r.json();
}, orden.id);
await ctx.close();

await tomar("cliente-celular", {
  ancho: 390,
  alto: 844,
  movil: true,
  antes: ir(`/t/${detalle.codigoPublico}`),
});
await tomar("etiquetas", {
  ancho: 900,
  alto: 340,
  antes: async (p) => {
    await ir(`/app/ordenes/${orden.id}/imprimir?tipo=etiquetas&vista=1`)(p);
    // Solo el papel: la barra de la pantalla va en «etiquetas-pantalla».
    await p.addStyleTag({ content: ".no-imprimir { display: none !important; }" });
  },
});
await tomar("etiquetas-pantalla", {
  ancho: 900,
  alto: 420,
  antes: ir(`/app/ordenes/${orden.id}/imprimir?tipo=etiquetas&vista=1`),
});
await tomar("recibo", {
  ancho: 700,
  alto: 900,
  antes: ir(`/app/ordenes/${orden.id}/imprimir?tipo=recibo&vista=1`),
});
await tomar("orden", { antes: ir(`/app/ordenes/${orden.id}`) });

await b.close();
