import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";

vi.mock("@/server/entorno", () => import("../ayuda/mock-entorno"));
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn(), replace: vi.fn() }),
  usePathname: () => "/app/ordenes",
  useSearchParams: () => new URLSearchParams(),
}));

import { randomUUID } from "node:crypto";
import { DetalleOrden } from "@/components/ordenes/detalle-orden";
import { ListaOrdenes } from "@/components/ordenes/lista-ordenes";
import { abrirTurno } from "@/server/caja";
import { registrarPago } from "@/server/pagos";
import { permisosDe } from "@/server/permisos";
import { crearEntorno, type EntornoPrueba } from "../ayuda/entorno";
import { crearDispositivo, crearUsuario, sesionPara } from "../ayuda/fabrica";
import { usarEntorno } from "../ayuda/mock-entorno";
import { d, escenarioPantallas, montar } from "../ayuda/pantallas";
import { instalarPuente, type Puente } from "../ayuda/puente-ui";

const dor = d.ordenes;

describe("órdenes: lista y detalle (contra el servidor real)", () => {
  let e: EntornoPrueba;
  let esc: Awaited<ReturnType<typeof escenarioPantallas>>;
  let puente: Puente;
  let cookiesCajero: Record<string, string>;
  beforeAll(async () => {
    e = await crearEntorno();
    usarEntorno(e);
    esc = await escenarioPantallas(e.env.DB);
    await abrirTurno(e.env.DB, esc.sesion, 1000);
    const t = { id: esc.tintoreriaId, sucursalId: esc.sucursalId, duenoId: esc.usuarioId };
    const dispositivo = await crearDispositivo(e.env.DB, t);
    const cajero = await crearUsuario(e.env.DB, esc.tintoreriaId, "cajero", {
      pin: "1357",
      nombre: "Caja Uno",
    });
    await crearUsuario(e.env.DB, esc.tintoreriaId, "gerente", { pin: "8642", nombre: "Gerente Uno" });
    const tokenCajero = await sesionPara(e.env.DB, esc.tintoreriaId, cajero, {
      tipo: "pin",
      dispositivoId: dispositivo.id,
    });
    cookiesCajero = { tp_sesion: tokenCajero, tp_disp: dispositivo.token };
    puente = instalarPuente({ tp_sesion: esc.token });
  }, 120_000);
  afterAll(async () => {
    puente.cerrar();
    await e.cerrar();
  });

  it("la lista filtra por estado y busca por nombre", async () => {
    const u = userEvent.setup();
    const orden = await esc.nuevaOrden();
    montar(<ListaOrdenes moneda="USD" zona="America/New_York" montos />);
    expect(await screen.findByText(String(orden.numero))).toBeInTheDocument();
    await u.click(screen.getByRole("tab", { name: dor.filtros.entregada }));
    await waitFor(() => expect(screen.queryByText(String(orden.numero))).toBeNull());
    await u.click(screen.getByRole("tab", { name: dor.filtros.abiertas }));
    await u.type(screen.getByLabelText(dor.buscar), "Pantallas");
    expect(await screen.findByText(String(orden.numero))).toBeInTheDocument();
  });

  it("el dueño cobra, anula un pago, agrega y borra una foto, reimprime y anula la orden con motivo", async () => {
    const u = userEvent.setup();
    const abrir = vi.spyOn(window, "open").mockReturnValue(null);
    const orden = await esc.nuevaOrden();
    montar(
      <DetalleOrden id={orden.id} moneda="USD" zona="America/New_York" permisos={permisosDe("dueno")} />,
    );
    expect(await screen.findByText(`#${orden.numero}`, { exact: false })).toBeInTheDocument();

    await u.click(screen.getByRole("button", { name: dor.cobrarAbono }));
    let modal = await screen.findByRole("dialog");
    await u.click(within(modal).getByRole("radio", { name: d.caja.metodos.tarjeta_externa }));
    await u.type(within(modal).getByLabelText(d.caja.monto), "4");
    await u.type(within(modal).getByLabelText(d.mostrador.referencia), "9876");
    await u.click(within(modal).getByRole("button", { name: dor.cobrar }));
    expect(await screen.findByText((t) => t.includes("9876"))).toBeInTheDocument();

    // Anular el pago: menú de 3 puntos → confirmación → motivo.
    const pago = screen.getByText((t) => t.includes("9876")).closest("li")!;
    await u.click(within(pago).getByRole("button", { name: d.comun.masOpciones }));
    await u.click(await screen.findByRole("menuitem", { name: dor.anularPago }));
    modal = await screen.findByRole("dialog");
    await u.click(within(modal).getByRole("button", { name: dor.anularPago }));
    modal = await screen.findByRole("dialog", { name: dor.motivo });
    await u.type(within(modal).getByLabelText(dor.motivo), "Cobro duplicado");
    await u.click(within(modal).getByRole("button", { name: d.comun.confirmar }));
    expect(await screen.findByText(dor.anulado)).toBeInTheDocument();

    // Foto de evidencia y su borrado.
    const png = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 13, 73, 72, 68, 82]);
    const entrada = document.querySelector('input[type="file"]') as HTMLInputElement;
    await u.upload(entrada, new File([png], "mancha.png", { type: "image/png" }));
    const foto = await waitFor(() => {
      const img = document.querySelector('img[src^="/media/fotos/"]');
      expect(img).not.toBeNull();
      return img!;
    });
    const tarjetaFoto = foto.closest("div.relative") as HTMLElement;
    await u.click(within(tarjetaFoto).getByRole("button", { name: d.comun.masOpciones }));
    await u.click(await screen.findByRole("menuitem", { name: dor.borrarFoto }));
    await u.click(within(await screen.findByRole("dialog")).getByRole("button", { name: dor.borrarFoto }));
    await waitFor(() => expect(document.querySelector('img[src^="/media/fotos/"]')).toBeNull());

    // Imprimir: etiquetas directo, recibo con registro de reimpresión.
    await u.click(screen.getByRole("button", { name: dor.imprimir }));
    await u.click(await screen.findByRole("menuitem", { name: `${dor.imprimir}: ${dor.recibo}` }));
    await waitFor(() =>
      expect(abrir).toHaveBeenCalledWith(expect.stringContaining("tipo=recibo"), "_blank", "noopener"),
    );

    // Anular la orden.
    await u.click(screen.getByRole("button", { name: dor.imprimir }));
    await u.click(await screen.findByRole("menuitem", { name: dor.anular }));
    await u.click(within(await screen.findByRole("dialog")).getByRole("button", { name: dor.anular }));
    modal = await screen.findByRole("dialog", { name: dor.motivo });
    await u.type(within(modal).getByLabelText(dor.motivo), "El cliente se arrepintió");
    await u.click(within(modal).getByRole("button", { name: d.comun.confirmar }));
    expect(await screen.findByText("El cliente se arrepintió")).toBeInTheDocument();
  }, 60_000);

  it("un cajero necesita el PIN de un gerente para anular: PIN malo avisa, PIN bueno autoriza", async () => {
    const u = userEvent.setup();
    const orden = await esc.nuevaOrden();
    await registrarPago(e.env.DB, esc.sesion, orden.id, {
      id: randomUUID(),
      metodo: "efectivo",
      montoCents: 300,
    });
    puente.cookies.clear();
    for (const [k, v] of Object.entries(cookiesCajero)) puente.cookies.set(k, v);
    puente.cookies.set("tp_csrf", "csrf-de-prueba-0123456789");

    montar(
      <DetalleOrden id={orden.id} moneda="USD" zona="America/New_York" permisos={permisosDe("cajero")} />,
    );
    await screen.findByText(`#${orden.numero}`, { exact: false });
    const pago = screen.getByText(d.caja.metodos.efectivo).closest("li")!;
    await u.click(within(pago).getByRole("button", { name: d.comun.masOpciones }));
    await u.click(await screen.findByRole("menuitem", { name: dor.anularPago }));
    await u.click(within(await screen.findByRole("dialog")).getByRole("button", { name: dor.anularPago }));
    const motivo = await screen.findByRole("dialog", { name: dor.motivo });
    await u.type(within(motivo).getByLabelText(dor.motivo), "Se equivocó de monto");
    await u.click(within(motivo).getByRole("button", { name: d.comun.confirmar }));

    const aut = await screen.findByRole("dialog", { name: d.pin.autorizacionTitulo });
    await u.click(await within(aut).findByRole("button", { name: "Gerente Uno" }));
    for (const n of "1111") await u.click(within(aut).getByRole("button", { name: n }));
    await u.click(within(aut).getByRole("button", { name: d.pin.autorizar }));
    expect(await within(aut).findByRole("alert")).toBeInTheDocument();
    for (let i = 0; i < 4; i++) await u.click(within(aut).getByRole("button", { name: d.pin.borrar }));
    for (const n of "8642") await u.click(within(aut).getByRole("button", { name: n }));
    await u.click(within(aut).getByRole("button", { name: d.pin.autorizar }));
    expect(await screen.findByText(dor.anulado)).toBeInTheDocument();
    const fila = await e.env.DB.prepare("select anulado_por, autorizado_por from pagos where orden_id = ?")
      .bind(orden.id)
      .first<{ anulado_por: string; autorizado_por: string | null }>();
    expect(fila?.anulado_por).toBeTruthy();
    puente.cookies.clear();
    puente.cookies.set("tp_sesion", esc.token);
    puente.cookies.set("tp_csrf", "csrf-de-prueba-0123456789");
  }, 60_000);
});
