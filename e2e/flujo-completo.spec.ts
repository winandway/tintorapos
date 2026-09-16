import { expect, test } from "@playwright/test";
import { es } from "../src/lib/i18n/diccionarios/es";
import { codigoTotp, correoDePrueba, ipDePrueba, listo } from "./ayuda";

/**
 * El día completo de una tintorería, de punta a punta y como lo haría una persona:
 * registro → dos pasos → precios → empleado → tablet → PIN → caja → orden con abono →
 * etiquetas → página del cliente → producción → entrega con cobro → cierre de caja → sin conexión.
 */
test.describe.configure({ mode: "serial" });
test.use({ extraHTTPHeaders: { "x-forwarded-for": ipDePrueba() }, locale: "es-US" });

test("un día completo en la tintorería", async ({ page, context }) => {
  test.setTimeout(420_000);
  const correo = correoDePrueba();
  const clave = `Clave-segura-${Date.now()}`;

  await test.step("registro", async () => {
    await page.goto("/registro");
    await page.getByLabel(es.acceso.negocio).fill("Tintorería de prueba E2E");
    await page.getByLabel(es.acceso.tuNombre).fill("Dueña de prueba");
    await page.getByLabel(es.acceso.correo).fill(correo);
    await page.getByLabel(es.acceso.clave, { exact: true }).fill(clave);
    await page.getByRole("checkbox").check();
    await page.getByRole("button", { name: es.acceso.crearCuenta }).click();
    await expect(page).toHaveURL(/\/entrar\/activar-dos-pasos/, { timeout: 60_000 });
  });

  await test.step("verificación en dos pasos obligatoria para el dueño", async () => {
    await page.getByRole("button", { name: es.acceso.empezar }).click();
    const secreto = (await page.getByTestId("secreto-totp").textContent()) ?? "";
    expect(secreto.replace(/\s/g, "")).toMatch(/^[A-Z2-7]{16,}$/);
    await page.getByLabel(es.acceso.codigo).fill(codigoTotp(secreto));
    await page.getByRole("button", { name: es.acceso.confirmarCodigo }).click();
    await expect(page.getByTestId("codigos-respaldo").locator("li")).toHaveCount(10);
    await page.getByRole("checkbox", { name: es.acceso.yaGuarde }).check();
    await page.getByRole("button", { name: es.acceso.irAlPanel }).click();
    await expect(page).toHaveURL(/\/app$/, { timeout: 60_000 });
  });

  await test.step("precios", async () => {
    await page.goto("/app/ajustes/precios");
    await listo(page);
    await page.getByRole("textbox", { name: /^Camisa/ }).fill("5.00");
    await page.getByRole("textbox", { name: /^Pantalón/ }).fill("7.50");
    const guardar = page.getByRole("button", { name: es.ajustes.precios.guardarPrecios });
    await guardar.click();
    await expect(guardar).toBeDisabled();
  });

  await test.step("empleado con PIN", async () => {
    await page.goto("/app/ajustes/empleados");
    await listo(page);
    await page.getByRole("button", { name: `+ ${es.ajustes.empleados.agregar}` }).click();
    const modal = page.getByRole("dialog");
    await modal.getByLabel(es.ajustes.empleados.nombre).fill("Cajero E2E");
    await modal.getByLabel(es.ajustes.empleados.pin).fill("2468");
    await modal.getByRole("button", { name: es.comun.guardar }).click();
    await expect(modal).toBeHidden();
    await expect(page.getByText("Cajero E2E")).toBeVisible();
  });

  await test.step("registrar la tablet y entrar con PIN", async () => {
    await page.goto("/app/ajustes/dispositivos");
    await listo(page);
    await page.getByLabel(es.ajustes.dispositivos.nombre).fill("Tablet E2E");
    await page.getByRole("button", { name: es.ajustes.dispositivos.registrarEste }).click();
    await page.getByRole("link", { name: es.ajustes.dispositivos.irPin }).click();
    await expect(page.getByRole("heading", { name: es.pin.titulo })).toBeVisible({ timeout: 60_000 });
    await page.getByRole("button", { name: /Cajero E2E/ }).click();
    for (const n of "2468") await page.getByRole("button", { name: n, exact: true }).click();
    await page.getByRole("button", { name: es.pin.entrar, exact: true }).click();
    await expect(page).toHaveURL(/\/app$/, { timeout: 60_000 });
  });

  await test.step("abrir la caja", async () => {
    await page.goto("/app/caja");
    await listo(page);
    await page.getByLabel(es.caja.fondo).fill("100");
    await page.getByRole("button", { name: es.caja.abrir }).click();
    await expect(page.getByText(es.caja.abierta, { exact: true })).toBeVisible();
  });

  let numero = "";
  let ordenId = "";
  await test.step("nueva orden con abono en efectivo", async () => {
    await page.goto("/app/mostrador");
    await listo(page);
    await page.getByLabel(es.mostrador.buscarCliente).fill("Cliente E2E");
    await page.getByRole("button", { name: /^\+/ }).first().click();
    const modal = page.getByRole("dialog");
    await modal.getByLabel(es.clientes.telefono).fill("3055550142");
    await modal.getByRole("button", { name: es.comun.guardar }).click();
    await expect(modal).toBeHidden();

    const prendas = page.getByRole("region", { name: es.mostrador.pasoPrendas });
    await prendas.getByRole("button", { name: /^Camisa/ }).click();
    await prendas.getByRole("button", { name: /^Camisa/ }).click();
    await prendas.getByRole("button", { name: /^Pantalón/ }).click();
    await expect(page.getByTestId("total-orden")).toHaveText("$17.50");

    const cobro = page.getByRole("complementary", { name: es.mostrador.pasoCobro });
    await cobro.getByRole("radio", { name: es.mostrador.abono }).click();
    await cobro.getByLabel(es.mostrador.montoAbono).fill("5");
    await cobro.getByLabel(es.mostrador.recibido).fill("10");
    await expect(cobro.getByText("$5.00").first()).toBeVisible();
    await cobro.getByRole("button").filter({ hasText: es.mostrador.confirmar }).click();
    await expect(page.getByTestId("orden-creada")).toBeVisible({ timeout: 60_000 });

    const enlace = await page.getByRole("link", { name: es.mostrador.verOrden }).getAttribute("href");
    ordenId = enlace!.split("/").pop()!;
  });

  await test.step("etiquetas: una por prenda, y recibo", async () => {
    await page.goto(`/app/ordenes/${ordenId}/imprimir?tipo=etiquetas&vista=1`);
    await expect(page.getByTestId("etiqueta")).toHaveCount(3);
    await page.goto(`/app/ordenes/${ordenId}/imprimir?tipo=recibo&vista=1`);
    const recibo = page.getByTestId("recibo");
    await expect(recibo).toBeVisible();
    numero = /#(\d+)/.exec((await recibo.textContent()) ?? "")?.[1] ?? "";
    expect(Number(numero)).toBeGreaterThanOrEqual(1001);
  });

  await test.step("la página del cliente muestra el estado", async () => {
    const r = await page.request.get(`/datos/ordenes/${ordenId}`);
    expect(r.ok()).toBe(true);
    const { orden } = (await r.json()) as { orden: { codigoPublico: string } };
    const publica = await context.newPage();
    await publica.goto(`/t/${orden.codigoPublico}`);
    await expect(publica.getByTestId("estado-publico")).toBeVisible();
    await publica.close();
  });

  await test.step("producción: toda la orden lista", async () => {
    await page.goto("/app/produccion");
    await listo(page);
    const escaner = page.getByLabel(es.produccion.escanearPlaceholder);
    await escaner.fill(numero);
    await escaner.press("Enter");
    await expect(page.getByRole("button", { name: `${es.produccion.lista}: Camisa` })).toHaveCount(2);
    await page.getByRole("button", { name: es.produccion.lista, exact: true }).click();
    await expect(page.getByRole("button", { name: `${es.produccion.lista}: Camisa` })).toHaveCount(0, {
      timeout: 30_000,
    });
  });

  await test.step("entrega con cobro del saldo", async () => {
    await page.goto("/app/entrega");
    await listo(page);
    const buscar = page.getByLabel(es.entrega.buscar);
    await buscar.fill(numero);
    await buscar.press("Enter");
    const candidata = page.getByRole("button", { name: /Cliente E2E/ });
    if (await candidata.isVisible().catch(() => false)) await candidata.click();
    await page.getByRole("button", { name: /\$12\.50/ }).click();
    await expect(page.getByText(`Orden #${numero} entregada`)).toBeVisible({ timeout: 30_000 });
  });

  await test.step("cierre de caja a ciegas", async () => {
    await page.goto("/app/caja");
    await listo(page);
    await page.getByRole("button", { name: es.caja.cerrar }).click();
    const modal = page.getByRole("dialog");
    await expect(modal.getByText("117.50")).toHaveCount(0);
    await modal.getByLabel(es.caja.contado).fill("117.50");
    await modal.getByRole("button", { name: es.caja.cerrar }).click();
    await expect(page.getByText(es.caja.cerradaOk)).toBeVisible();
  });

  await test.step("sin conexión: la orden se guarda en la tablet y se sube sola al volver", async () => {
    await page.goto("/app/mostrador");
    await listo(page);
    await page.getByLabel(es.mostrador.buscarCliente).fill("Cliente E2E");
    await page.getByRole("button", { name: /Cliente E2E/ }).click();
    const prendas = page.getByRole("region", { name: es.mostrador.pasoPrendas });
    await prendas.getByRole("button", { name: /^Pantalón/ }).click();
    await expect(page.getByTestId("total-orden")).toHaveText("$7.50");

    await context.setOffline(true);
    const cobro = page.getByRole("complementary", { name: es.mostrador.pasoCobro });
    await cobro.getByRole("button").filter({ hasText: es.mostrador.confirmar }).click();
    await expect(page.getByTestId("orden-en-cola")).toBeVisible();
    // Las etiquetas se generan en el dispositivo (ocultas hasta imprimir).
    await expect(page.locator(".etiquetas-locales > *")).toHaveCount(1);

    await context.setOffline(false);
    await expect
      .poll(
        async () => {
          const r = await page.request.get("/datos/ordenes?estado=abiertas");
          const { ordenes } = (await r.json()) as { ordenes: { totalCents: number }[] };
          return ordenes.some((o) => o.totalCents === 750);
        },
        { timeout: 60_000, intervals: [1_000] },
      )
      .toBe(true);
  });
});
