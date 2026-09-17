import { expect, test } from "@playwright/test";
import { es } from "../src/lib/i18n/diccionarios/es";
import { crearCuenta, hidratada, ipDePrueba, listo, NOMBRES } from "./ayuda";

/**
 * El día completo de una tintorería, de punta a punta y como lo haría una persona:
 * registro → dos pasos → precios → empleado → tablet → PIN → caja → orden con abono →
 * etiquetas → página del cliente → producción → entrega con cobro → cierre de caja → sin conexión →
 * cobro con «otro», anulado con PIN del gerente y vuelto a cobrar → entrega con tarjeta → reportes.
 */
test.describe.configure({ mode: "serial" });
test.use({ extraHTTPHeaders: { "x-forwarded-for": ipDePrueba() }, locale: "es-US" });

test("un día completo en la tintorería", async ({ page, context }) => {
  test.setTimeout(420_000);
  await test.step("registro y verificación en dos pasos obligatoria para el dueño", async () => {
    await crearCuenta(page);
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
    await modal.getByLabel(es.ajustes.empleados.nombre).fill(NOMBRES.cajero);
    await modal.getByLabel(es.ajustes.empleados.pin).fill("2468");
    await modal.getByRole("button", { name: es.comun.guardar }).click();
    await expect(modal).toBeHidden();
    await expect(page.getByText(NOMBRES.cajero)).toBeVisible();

    // Un gerente con PIN, para autorizar lo que un cajero no puede hacer solo.
    await page.getByRole("button", { name: `+ ${es.ajustes.empleados.agregar}` }).click();
    await modal.getByLabel(es.ajustes.empleados.nombre).fill(NOMBRES.gerente);
    await modal.getByLabel(es.ajustes.empleados.rol).selectOption("gerente");
    await modal.getByLabel(es.ajustes.empleados.pin).fill("8642");
    await modal.getByRole("button", { name: es.comun.guardar }).click();
    await expect(modal).toBeHidden();
    await expect(page.getByText(NOMBRES.gerente)).toBeVisible();
  });

  await test.step("conectar un celular escaneando el QR de la tablet", async () => {
    await page.goto("/app/ajustes/dispositivos");
    await listo(page);
    await page.getByLabel(es.ajustes.dispositivos.nombreCelular).fill(NOMBRES.celular);
    const respuesta = page.waitForResponse((r) => r.url().includes("/datos/dispositivos/enlace"));
    await page.getByRole("button", { name: es.ajustes.dispositivos.crearEnlace }).click();
    const { url } = (await (await respuesta).json()) as { url: string };
    await expect(page.getByTestId("qr-celular")).toBeVisible();

    // El celular del empleado: otro navegador, sin la sesión del dueño.
    const celular = await page.context().browser()!.newContext();
    const pantalla = await celular.newPage();
    await pantalla.goto(url);
    await expect(pantalla.getByRole("heading", { name: es.pin.titulo })).toBeVisible({ timeout: 60_000 });
    // El mismo enlace ya no sirve para un segundo teléfono.
    const otro = await page.context().browser()!.newContext();
    const segundo = await otro.newPage();
    await segundo.goto(url);
    await expect(segundo.getByRole("heading", { name: es.pin.titulo })).toBeHidden();
    await otro.close();
    await celular.close();
  });

  await test.step("registrar la tablet y entrar con PIN", async () => {
    await page.goto("/app/ajustes/dispositivos");
    await listo(page);
    await page.getByLabel(es.ajustes.dispositivos.nombre).fill(NOMBRES.tablet);
    await page.getByRole("button", { name: es.ajustes.dispositivos.registrarEste }).click();
    await page.getByRole("link", { name: es.ajustes.dispositivos.irPin }).click();
    await expect(page.getByRole("heading", { name: es.pin.titulo })).toBeVisible({ timeout: 60_000 });
    await hidratada(page);
    await page.getByRole("button").filter({ hasText: NOMBRES.cajero }).click();
    for (const n of "2468") await page.getByRole("button", { name: n, exact: true }).click();
    await page.getByRole("button", { name: es.pin.entrar, exact: true }).click();
    await expect(page).toHaveURL(/\/app$/, { timeout: 60_000 });
    await hidratada(page);
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
    await page.getByLabel(es.mostrador.buscarCliente).fill(NOMBRES.cliente);
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

    // Marcas de un toque en la última prenda: quedan en el recibo y protegen de reclamos.
    const marcas = page.getByTestId("marcas-prenda");
    await marcas.getByRole("button", { name: es.mostrador.listaDanos.botonRoto }).click();
    await marcas.getByRole("button", { name: es.mostrador.listaColores.azulOscuro }).click();

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
    await hidratada(page);
    await expect(page.getByTestId("etiqueta")).toHaveCount(3);
    await page.goto(`/app/ordenes/${ordenId}/imprimir?tipo=recibo&vista=1`);
    const recibo = page.getByTestId("recibo");
    await expect(recibo).toBeVisible();
    await expect(recibo).toContainText(es.mostrador.listaDanos.botonRoto);
    await expect(recibo).toContainText(es.mostrador.listaColores.azulOscuro);
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
    const candidata = page.getByRole("button").filter({ hasText: NOMBRES.cliente });
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
    await page.getByLabel(es.mostrador.buscarCliente).fill(NOMBRES.cliente);
    await page.getByRole("button").filter({ hasText: NOMBRES.cliente }).click();
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

  await test.step("pago parcial con «otro» y entrega cobrando el resto con tarjeta", async () => {
    const r = await page.request.get("/datos/ordenes?estado=abiertas");
    const { ordenes } = (await r.json()) as { ordenes: { id: string; numero: number; totalCents: number }[] };
    const orden = ordenes.find((o) => o.totalCents === 750)!;
    expect(orden, "la orden hecha sin conexión").toBeTruthy();

    await page.goto(`/app/ordenes/${orden.id}`);
    await listo(page);
    await page.getByRole("button", { name: es.ordenes.cobrarAbono }).click();
    const modal = page.getByRole("dialog");
    await modal.getByRole("radio", { name: es.caja.metodos.otro }).click();
    await modal.getByLabel(es.caja.monto).fill("2.50");
    await modal.getByRole("button", { name: es.ordenes.cobrar }).click();
    await expect(modal).toBeHidden();

    // El cajero anula ese pago: necesita el PIN del gerente.
    const pagoOtro = page.getByRole("listitem").filter({ hasText: es.caja.metodos.otro });
    await pagoOtro.getByRole("button", { name: es.comun.masOpciones }).click();
    await page.getByRole("menuitem", { name: es.ordenes.anularPago }).click();
    await page.getByRole("dialog").getByRole("button", { name: es.ordenes.anularPago }).click();
    const motivo = page.getByRole("dialog", { name: es.ordenes.motivo });
    await motivo.getByLabel(es.ordenes.motivo).fill("Monto equivocado");
    await motivo.getByRole("button", { name: es.comun.confirmar }).click();
    const autorizacion = page.getByRole("dialog", { name: es.pin.autorizacionTitulo });
    await autorizacion.getByRole("button").filter({ hasText: NOMBRES.gerente }).click();
    for (const n of "8642") await autorizacion.getByRole("button", { name: n, exact: true }).click();
    await autorizacion.getByRole("button", { name: es.pin.autorizar }).click();
    await expect(page.getByText(es.ordenes.anulado, { exact: true })).toBeVisible();

    // Se vuelve a cobrar bien.
    await page.getByRole("button", { name: es.ordenes.cobrarAbono }).click();
    await modal.getByRole("radio", { name: es.caja.metodos.otro }).click();
    await modal.getByLabel(es.caja.monto).fill("2.50");
    await modal.getByRole("button", { name: es.ordenes.cobrar }).click();
    await expect(modal).toBeHidden();

    await page.goto("/app/produccion");
    await listo(page);
    const escaner = page.getByLabel(es.produccion.escanearPlaceholder);
    await escaner.fill(String(orden.numero));
    await escaner.press("Enter");
    await page.getByRole("button", { name: es.produccion.lista, exact: true }).click();
    await expect(page.getByRole("button", { name: `${es.produccion.lista}: Pantalón` })).toHaveCount(0, {
      timeout: 30_000,
    });

    await page.goto("/app/entrega");
    await listo(page);
    const buscar = page.getByLabel(es.entrega.buscar);
    await buscar.fill(String(orden.numero));
    await buscar.press("Enter");
    await page.getByRole("radio", { name: es.caja.metodos.tarjeta_externa }).click();
    await page.getByLabel(es.mostrador.referencia).fill("4242");
    await page.getByRole("button", { name: "Cobrar $5.00 y entregar" }).click();
    await expect(page.getByText(`Orden #${orden.numero} entregada`)).toBeVisible({ timeout: 30_000 });
  });
  await test.step("el gerente ve en reportes lo cobrado por forma de pago, sin el pago anulado", async () => {
    await page.getByRole("button", { name: es.app.menuCuenta }).click();
    await page.getByRole("menuitem", { name: es.app.bloquear }).click();
    await expect(page.getByRole("heading", { name: es.pin.titulo })).toBeVisible({ timeout: 60_000 });
    await hidratada(page);
    await page.getByRole("button").filter({ hasText: NOMBRES.gerente }).click();
    for (const n of "8642") await page.getByRole("button", { name: n, exact: true }).click();
    await page.getByRole("button", { name: es.pin.entrar, exact: true }).click();
    await expect(page).toHaveURL(/\/app$/, { timeout: 60_000 });

    const r = await page.request.get("/datos/reportes?preset=7");
    expect(r.ok()).toBe(true);
    const rep = (await r.json()) as { cobradoCents: number; porMetodo: { metodo: string; cents: number }[] };
    expect(rep.cobradoCents).toBe(2500);
    const porMetodo = Object.fromEntries(rep.porMetodo.map((m) => [m.metodo, m.cents]));
    expect(porMetodo).toEqual({ efectivo: 1750, tarjeta_externa: 500, otro: 250 });

    await page.goto("/app/reportes");
    await listo(page);
    await expect(page.getByText("$25.00").first()).toBeVisible();
  });
});
