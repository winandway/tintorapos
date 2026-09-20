import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/server/entorno", () => import("../ayuda/mock-entorno"));
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn(), replace: vi.fn() }),
  usePathname: () => "/app/mostrador",
  useSearchParams: () => new URLSearchParams(),
}));

import { Mostrador } from "@/components/mostrador/mostrador";
import { _reiniciarAlmacen, borrarTodo } from "@/lib/sin-conexion/almacen";
import { sincronizar } from "@/lib/sin-conexion/cola";
import { abrirTurno } from "@/server/caja";
import { crearEntorno, type EntornoPrueba } from "../ayuda/entorno";
import { usarEntorno } from "../ayuda/mock-entorno";
import { d, escenarioPantallas, montar } from "../ayuda/pantallas";
import { instalarPuente, type Puente } from "../ayuda/puente-ui";

const dm = d.mostrador;
const TIENDA = {
  moneda: "USD",
  zona: "America/New_York",
  pais: "US",
  diasEntrega: 2,
  politicaCobro: "entrega" as const,
  reglas: { impuestoBps: 0, recargoUrgenteBps: 5000, descuentoMaxBps: 1000 },
};

describe("mostrador: nueva orden (contra el servidor real)", () => {
  let e: EntornoPrueba;
  let puente: Puente;
  let esc: Awaited<ReturnType<typeof escenarioPantallas>>;
  beforeAll(async () => {
    e = await crearEntorno();
    usarEntorno(e);
    esc = await escenarioPantallas(e.env.DB);
    puente = instalarPuente({ tp_sesion: esc.token });
  }, 120_000);
  beforeEach(async () => {
    puente.sinConexion(false);
    await borrarTodo();
  });
  afterAll(async () => {
    puente.cerrar();
    _reiniciarAlmacen();
    await e.cerrar();
  });

  let celular = 3055550100;
  async function elegirClienteNuevo(u: ReturnType<typeof userEvent.setup>, nombre: string) {
    celular += 1;
    await u.type(screen.getByLabelText(dm.buscarCliente), nombre);
    await u.click(screen.getAllByRole("button", { name: /^\+/ })[0]!);
    const modal = await screen.findByRole("dialog");
    await u.type(within(modal).getByLabelText(d.clientes.telefono), String(celular));
    await u.click(within(modal).getByRole("checkbox", { name: /Acepta mensajes de texto/ }));
    await u.click(within(modal).getByRole("button", { name: d.comun.guardar }));
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
  }

  it("cliente nuevo, prendas por pieza y por libra, precio a mano, detalles, urgente, descuento y cobro con tarjeta", async () => {
    const u = userEvent.setup();
    montar(<Mostrador tienda={TIENDA} clienteInicial={null} />);
    expect(await screen.findByText(dm.elegirCliente)).toBeInTheDocument();
    await elegirClienteNuevo(u, "Ana Mostrador");

    const prendas = screen.getByRole("region", { name: dm.pasoPrendas });
    await u.click(await within(prendas).findByRole("button", { name: /^Camisa/ }));
    await u.click(within(prendas).getByRole("button", { name: /^Camisa/ }));
    await u.click(within(prendas).getByRole("button", { name: /^Pantalón/ }));
    expect(screen.getByTestId("total-orden")).toHaveTextContent("$17.50");

    // Prenda sin precio: se pide el precio en el momento.
    await u.click(within(prendas).getByRole("button", { name: /^Blusa/ }));
    const modalPrecio = await screen.findByRole("dialog");
    await u.type(within(modalPrecio).getByLabelText(dm.precioUnitario), "6");
    await u.click(within(modalPrecio).getByRole("button", { name: dm.aplicarPrecio }));
    expect(screen.getByTestId("total-orden")).toHaveTextContent("$23.50");

    // Por libra.
    await u.click(within(prendas).getByRole("tab", { name: "Lavado por libra" }));
    await u.type(within(prendas).getByLabelText(dm.libras), "4");
    await u.click(within(prendas).getByRole("button", { name: `+ ${dm.agregarLibras}` }));
    expect(screen.getByTestId("total-orden")).toHaveTextContent("$31.46");

    // Quitar una camisa y volver a sumarla desde la línea.
    const cobro = screen.getByRole("complementary", { name: dm.pasoCobro });
    const lineaCamisa = within(cobro)
      .getByRole("button", { name: /Camisa/ })
      .closest("li")!;
    await u.click(within(lineaCamisa).getByRole("button", { name: dm.quitarUna }));
    expect(screen.getByTestId("total-orden")).toHaveTextContent("$26.46");
    await u.click(within(lineaCamisa).getByRole("button", { name: "+" }));

    // Detalles de la pieza (manchas, color, marca) y una foto.
    await u.click(within(lineaCamisa).getByRole("button", { name: /Camisa/ }));
    const colores = within(lineaCamisa).getAllByLabelText(dm.color);
    await u.type(colores[0]!, "Azul");
    await u.type(within(lineaCamisa).getAllByLabelText(dm.marca)[0]!, "Oxford");
    await u.type(within(lineaCamisa).getAllByLabelText(dm.notasPrenda)[0]!, "Mancha en el cuello");
    const png = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 13, 73, 72, 68, 82]);
    const archivo = new File([png], "camisa.png", { type: "image/png" });
    await u.upload(lineaCamisa.querySelector('input[type="file"]') as HTMLInputElement, archivo);
    await within(lineaCamisa).findAllByText(`✓ ${dm.fotoLista}`);

    await u.click(within(cobro).getByRole("checkbox", { name: (n: string) => n.startsWith(dm.urgente) }));
    await u.type(within(cobro).getByLabelText(dm.descuento), "1");
    await u.type(within(cobro).getByLabelText(dm.motivoDescuento), "Cliente frecuente");
    await u.type(
      within(cobro).getByLabelText((n: string) => n.startsWith(dm.notasOrden)),
      "Sin almidón",
    );

    await u.click(within(cobro).getByRole("radio", { name: dm.pagoCompleto }));
    await u.click(within(cobro).getByRole("radio", { name: dm.tarjeta }));
    await u.type(
      within(cobro).getByLabelText((n: string) => n.startsWith(dm.referencia)),
      "4242",
    );
    await u.click(within(cobro).getByRole("button", { name: (n: string) => n.startsWith(dm.confirmar) }));

    await screen.findByTestId("orden-creada", undefined, { timeout: 15_000 });
    const orden = await e.env.DB.prepare(
      "select o.total_cents, o.pagado_cents, o.urgente, o.descuento_cents, (select count(*) from fotos f where f.orden_id = o.id) as fotos from ordenes o where o.tintoreria_id = ? order by o.creada_en desc limit 1",
    )
      .bind(esc.tintoreriaId)
      .first<{
        total_cents: number;
        pagado_cents: number;
        urgente: number;
        descuento_cents: number;
        fotos: number;
      }>();
    expect(orden).toMatchObject({ urgente: 1, descuento_cents: 100 });
    expect(orden!.pagado_cents).toBe(orden!.total_cents);

    await u.click(screen.getByRole("button", { name: `+ ${dm.nuevaOrden}` }));
    expect(await screen.findByText(dm.elegirCliente)).toBeInTheDocument();
  }, 60_000);

  it("efectivo con la caja cerrada avisa y no deja cobrar; con la caja abierta calcula el vuelto del abono", async () => {
    const u = userEvent.setup();
    const { unmount } = montar(<Mostrador tienda={TIENDA} clienteInicial={null} />);
    await elegirClienteNuevo(u, "Beto Efectivo");
    const prendas = screen.getByRole("region", { name: dm.pasoPrendas });
    await u.click(await within(prendas).findByRole("button", { name: /^Pantalón/ }));
    const cobro = screen.getByRole("complementary", { name: dm.pasoCobro });
    await u.click(within(cobro).getByRole("radio", { name: dm.abono }));
    expect(await within(cobro).findByText(dm.cajaCerrada, { exact: false })).toBeInTheDocument();
    expect(
      within(cobro).getByRole("button", { name: (n: string) => n.startsWith(dm.confirmar) }),
    ).toBeDisabled();
    unmount();

    await abrirTurno(e.env.DB, esc.sesion, 5000);
    await borrarTodo();
    montar(<Mostrador tienda={TIENDA} clienteInicial={null} />);
    await u.type(screen.getByLabelText(dm.buscarCliente), "Beto");
    await u.click(await screen.findByRole("button", { name: /Beto Efectivo/ }));
    const prendas2 = screen.getByRole("region", { name: dm.pasoPrendas });
    await u.click(await within(prendas2).findByRole("button", { name: /^Pantalón/ }));
    const cobro2 = screen.getByRole("complementary", { name: dm.pasoCobro });
    await u.click(within(cobro2).getByRole("radio", { name: dm.abono }));
    await u.type(await within(cobro2).findByLabelText(dm.montoAbono), "5");
    await u.type(within(cobro2).getByLabelText(dm.recibido), "20");
    expect(within(cobro2).getByText("$15.00")).toBeInTheDocument();
    await u.click(within(cobro2).getByRole("button", { name: (n: string) => n.startsWith(dm.confirmar) }));
    await screen.findByTestId("orden-creada", undefined, { timeout: 15_000 });
  }, 60_000);

  it("sin conexión guarda la orden en el dispositivo y se sube al volver; con descuento grande pide conexión", async () => {
    const u = userEvent.setup();
    montar(<Mostrador tienda={TIENDA} clienteInicial={null} />);
    await elegirClienteNuevo(u, "Carla Sin Internet");
    const prendas = screen.getByRole("region", { name: dm.pasoPrendas });
    await u.click(await within(prendas).findByRole("button", { name: /^Camisa/ }));
    const cobro = screen.getByRole("complementary", { name: dm.pasoCobro });

    puente.sinConexion(true);
    // Un descuento por encima del máximo necesita un gerente: sin internet no se puede.
    await u.type(within(cobro).getByLabelText(dm.descuento), "3");
    await u.click(within(cobro).getByRole("button", { name: (n: string) => n.startsWith(dm.confirmar) }));
    expect(await within(cobro).findByText(dm.necesitaConexion)).toBeInTheDocument();
    await u.clear(within(cobro).getByLabelText(dm.descuento));

    await u.click(within(cobro).getByRole("button", { name: (n: string) => n.startsWith(dm.confirmar) }));
    expect(await screen.findByTestId("orden-en-cola")).toBeInTheDocument();
    const antes = await e.env.DB.prepare("select count(*) as n from ordenes where tintoreria_id = ?")
      .bind(esc.tintoreriaId)
      .first<{ n: number }>();

    puente.sinConexion(false);
    await sincronizar();
    const despues = await e.env.DB.prepare("select count(*) as n from ordenes where tintoreria_id = ?")
      .bind(esc.tintoreriaId)
      .first<{ n: number }>();
    expect(despues!.n).toBe(antes!.n + 1);
  }, 60_000);

  it("las marcas de un toque (daño, mancha y color) quedan guardadas en la prenda de la orden", async () => {
    const u = userEvent.setup();
    montar(<Mostrador tienda={TIENDA} clienteInicial={null} />);
    await elegirClienteNuevo(u, "Rosa Marcas");
    const prendas = screen.getByRole("region", { name: dm.pasoPrendas });
    await u.click(await within(prendas).findByRole("button", { name: /^Camisa/ }));

    const marcas = await screen.findByTestId("marcas-prenda");
    await u.click(within(marcas).getByRole("button", { name: dm.listaDanos.botonRoto }));
    await u.click(within(marcas).getByRole("button", { name: dm.listaManchas.vino }));
    await u.click(within(marcas).getByRole("button", { name: dm.listaColores.azulOscuro }));

    // Una segunda camisa entra limpia: las marcas son de cada pieza, no del botón.
    await u.click(within(prendas).getByRole("button", { name: /^Camisa/ }));
    expect(within(screen.getByTestId("marcas-prenda")).getByText(dm.sinMarcas)).toBeInTheDocument();

    const cobro = screen.getByRole("complementary", { name: dm.pasoCobro });
    await u.click(within(cobro).getByRole("button", { name: (n: string) => n.startsWith(dm.confirmar) }));
    await screen.findByTestId("orden-creada", undefined, { timeout: 15_000 });

    const { results } = await e.env.DB.prepare(
      `select p.color, p.notas from orden_prendas p
       where p.tintoreria_id = ? and p.orden_id = (select id from ordenes where tintoreria_id = ? order by creada_en desc limit 1)
       order by p.posicion`,
    )
      .bind(esc.tintoreriaId, esc.tintoreriaId)
      .all<{ color: string | null; notas: string | null }>();
    expect(results).toHaveLength(2);
    expect(results[0]).toMatchObject({
      color: dm.listaColores.azulOscuro,
      notas: `${dm.listaDanos.botonRoto} · ${dm.listaManchas.vino}`,
    });
    expect(results[1]!.notas).toBeNull();
  }, 60_000);
});
