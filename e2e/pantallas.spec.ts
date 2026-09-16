import { mkdirSync } from "node:fs";
import { expect, test, type Page } from "@playwright/test";
import { es } from "../src/lib/i18n/diccionarios/es";
import { crearCuenta, ipDePrueba, listo } from "./ayuda";

/**
 * Revisión visual de TODAS las pantallas (celular y escritorio): nada se sale de
 * la pantalla a lo ancho, no hay errores en la consola, y queda una captura de
 * cada una en test-results/pantallas para mirarla.
 */
test.use({ extraHTTPHeaders: { "x-forwarded-for": ipDePrueba() } });

async function revisar(page: Page, ruta: string, nombre: string, carpeta: string, errores: string[]) {
  errores.length = 0;
  await page.goto(ruta);
  await listo(page);
  await page.waitForTimeout(400);
  const ancho = await page.evaluate(() => ({
    documento: document.documentElement.scrollWidth,
    ventana: document.documentElement.clientWidth,
  }));
  expect(ancho.documento, `${ruta} se sale de la pantalla a lo ancho`).toBeLessThanOrEqual(ancho.ventana + 1);
  await page.screenshot({ path: `${carpeta}/${nombre}.png`, fullPage: true });
  expect(errores, `errores de consola en ${ruta}`).toEqual([]);
}

test("todas las pantallas se ven bien y sin errores", async ({ page }, info) => {
  test.setTimeout(420_000);
  const carpeta = `test-results/pantallas/${info.project.name}`;
  mkdirSync(carpeta, { recursive: true });
  const errores: string[] = [];
  page.on("console", (m) => {
    if (m.type() === "error") errores.push(m.text());
  });
  page.on("pageerror", (e) => errores.push(e.message));

  for (const [ruta, nombre] of [
    ["/", "portada"],
    ["/docs", "docs"],
    ["/docs/caja", "docs-guia"],
    ["/privacidad", "privacidad"],
    ["/registro", "registro"],
    ["/entrar", "entrar"],
    ["/no-existe", "404"],
  ] as const) {
    if (ruta === "/no-existe") {
      await page.goto(ruta);
      await page.screenshot({ path: `${carpeta}/${nombre}.png`, fullPage: true });
      errores.length = 0;
      continue;
    }
    await revisar(page, ruta, nombre, carpeta, errores);
  }

  await crearCuenta(page, "Lavandería Pantallas");

  // Datos mínimos para que las pantallas no estén vacías: un precio, un cliente y una orden.
  await page.goto("/app/ajustes/precios");
  await listo(page);
  await page.getByRole("textbox", { name: /^Camisa/ }).fill("4.25");
  await page.getByRole("button", { name: es.ajustes.precios.guardarPrecios }).click();
  await page.goto("/app/mostrador");
  await listo(page);
  await page.getByLabel(es.mostrador.buscarCliente).fill("Cliente Pantallas");
  await page.getByRole("button", { name: /^\+/ }).first().click();
  const modal = page.getByRole("dialog");
  await modal.getByLabel(es.clientes.telefono).fill("3055550177");
  await modal.getByRole("button", { name: es.comun.guardar }).click();
  await expect(modal).toBeHidden();
  const prendas = page.getByRole("region", { name: es.mostrador.pasoPrendas });
  await prendas.getByRole("button", { name: /^Camisa/ }).click();
  await page.screenshot({ path: `${carpeta}/app-mostrador-con-orden.png`, fullPage: true });
  await page
    .getByRole("complementary", { name: es.mostrador.pasoCobro })
    .getByRole("button")
    .filter({ hasText: es.mostrador.confirmar })
    .click();
  await expect(page.getByTestId("orden-creada")).toBeVisible({ timeout: 60_000 });
  const ordenId = (await page.getByRole("link", { name: es.mostrador.verOrden }).getAttribute("href"))!
    .split("/")
    .pop()!;
  const { orden } = (await (await page.request.get(`/datos/ordenes/${ordenId}`)).json()) as {
    orden: { codigoPublico: string; cliente: { id: string } };
  };

  for (const [ruta, nombre] of [
    ["/app", "app-inicio"],
    ["/app/mostrador", "app-mostrador"],
    ["/app/ordenes", "app-ordenes"],
    [`/app/ordenes/${ordenId}`, "app-orden"],
    ["/app/produccion", "app-produccion"],
    ["/app/entrega", "app-entrega"],
    ["/app/clientes", "app-clientes"],
    [`/app/clientes/${orden.cliente.id}`, "app-cliente"],
    ["/app/caja", "app-caja"],
    ["/app/reportes", "app-reportes"],
    ["/app/pendientes", "app-pendientes"],
    ["/app/ajustes", "ajustes"],
    ["/app/ajustes/tienda", "ajustes-tienda"],
    ["/app/ajustes/precios", "ajustes-precios"],
    ["/app/ajustes/empleados", "ajustes-empleados"],
    ["/app/ajustes/dispositivos", "ajustes-dispositivos"],
    ["/app/ajustes/avisos", "ajustes-avisos"],
    ["/app/ajustes/seguridad", "ajustes-seguridad"],
    ["/app/ajustes/datos", "ajustes-datos"],
    [`/app/ordenes/${ordenId}/imprimir?tipo=recibo&vista=1`, "imprimir-recibo"],
    [`/app/ordenes/${ordenId}/imprimir?tipo=etiquetas&vista=1`, "imprimir-etiquetas"],
    [`/t/${orden.codigoPublico}`, "pagina-cliente"],
  ] as const) {
    await revisar(page, ruta, nombre, carpeta, errores);
  }
});
