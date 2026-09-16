import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";

vi.mock("@/server/entorno", () => import("../ayuda/mock-entorno"));

import { PantallaCaja } from "@/components/caja/pantalla-caja";
import { crearEntorno, type EntornoPrueba } from "../ayuda/entorno";
import { usarEntorno } from "../ayuda/mock-entorno";
import { d, escenarioPantallas, montar } from "../ayuda/pantallas";
import { instalarPuente, type Puente } from "../ayuda/puente-ui";

describe("pantalla de caja (contra el servidor real)", () => {
  let e: EntornoPrueba;
  let puente: Puente;
  beforeAll(async () => {
    e = await crearEntorno();
    usarEntorno(e);
    const esc = await escenarioPantallas(e.env.DB);
    puente = instalarPuente({ tp_sesion: esc.token });
  }, 120_000);
  afterAll(async () => {
    puente.cerrar();
    await e.cerrar();
  });

  it("abre con fondo, registra entrada, salida y cajón sin venta, y cierra a ciegas mostrando la diferencia", async () => {
    const u = userEvent.setup();
    montar(<PantallaCaja moneda="USD" zona="America/New_York" verDiferencias />);
    await u.type(await screen.findByLabelText(d.caja.fondo), "100");
    await u.click(screen.getByRole("button", { name: d.caja.abrir }));
    await screen.findByText(d.caja.abierta, { exact: true });

    for (const [boton, monto, motivo] of [
      [`+ ${d.caja.entrada}`, "20", "Cambio del banco"],
      [`− ${d.caja.salida}`, "5", "Bolsas"],
    ] as const) {
      await u.click(screen.getByRole("button", { name: boton }));
      const modal = await screen.findByRole("dialog");
      await u.type(within(modal).getByLabelText(d.caja.monto), monto);
      await u.type(within(modal).getByLabelText(d.caja.motivo), motivo);
      await u.click(within(modal).getByRole("button", { name: d.caja.registrar }));
      await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
      await screen.findByText((texto) => texto.includes(motivo));
    }
    await u.click(screen.getByRole("button", { name: d.caja.sinVenta }));
    const cajon = await screen.findByRole("dialog");
    await u.type(within(cajon).getByLabelText(d.caja.motivo), "Revisar billete");
    await u.click(within(cajon).getByRole("button", { name: d.caja.registrar }));
    await screen.findByText(/Revisar billete/);

    await u.click(screen.getByRole("button", { name: d.caja.cerrar }));
    const cierre = await screen.findByRole("dialog");
    expect(within(cierre).queryByText("$115.00")).toBeNull();
    await u.type(within(cierre).getByLabelText(d.caja.contado), "113");
    await u.click(within(cierre).getByRole("button", { name: d.caja.cerrar }));
    await screen.findByText(d.caja.cerradaOk);
    await screen.findByText("Faltan $2.00");
    expect(puente.pedidos.filter((p) => p.estado >= 400)).toEqual([]);
  });
});
