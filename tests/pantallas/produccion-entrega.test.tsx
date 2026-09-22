import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/server/entorno", () => import("../ayuda/mock-entorno"));
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn(), replace: vi.fn() }),
  usePathname: () => "/app/produccion",
  useSearchParams: () => new URLSearchParams(),
}));

import { PantallaEntrega } from "@/components/entrega/pantalla-entrega";
import { PantallaProduccion } from "@/components/produccion/pantalla-produccion";
import { borrarTodo } from "@/lib/sin-conexion/almacen";
import { refrescarDatosSinConexion } from "@/lib/sin-conexion/cache";
import { sincronizar } from "@/lib/sin-conexion/cola";
import { abrirTurno, cerrarTurno } from "@/server/caja";
import { cambiarEstado } from "@/server/ordenes/estados";
import { crearEntorno, type EntornoPrueba } from "../ayuda/entorno";
import { crearDispositivo } from "../ayuda/fabrica";
import { usarEntorno } from "../ayuda/mock-entorno";
import { d, escenarioPantallas, montar } from "../ayuda/pantallas";
import { instalarPuente, type Puente } from "../ayuda/puente-ui";

const dp = d.produccion;
const de = d.entrega;
const ZONA = "America/New_York";

describe("producción y entrega (contra el servidor real)", () => {
  let e: EntornoPrueba;
  let esc: Awaited<ReturnType<typeof escenarioPantallas>>;
  let puente: Puente;
  const estadoDe = async (id: string) =>
    (await e.env.DB.prepare("select estado from ordenes where id = ?").bind(id).first<{ estado: string }>())!
      .estado;
  const escanear = async (u: ReturnType<typeof userEvent.setup>, placeholder: string, texto: string) => {
    const campo = screen.getByLabelText(placeholder);
    await u.clear(campo);
    await u.type(campo, `${texto}{Enter}`);
  };

  beforeAll(async () => {
    e = await crearEntorno();
    usarEntorno(e);
    esc = await escenarioPantallas(e.env.DB);
    await abrirTurno(e.env.DB, esc.sesion, 0);
    const dispositivo = await crearDispositivo(e.env.DB, {
      id: esc.tintoreriaId,
      sucursalId: esc.sucursalId,
      duenoId: esc.usuarioId,
    });
    puente = instalarPuente({ tp_sesion: esc.token, tp_disp: dispositivo.token });
  }, 120_000);
  beforeEach(async () => {
    puente.sinConexion(false);
    await borrarTodo();
  });
  afterAll(async () => {
    puente.cerrar();
    await e.cerrar();
  });

  it("producción: desde la columna, en proceso, pieza por pieza con ubicación y la orden completa", async () => {
    const u = userEvent.setup();
    const orden = await esc.nuevaOrden();
    montar(<PantallaProduccion zona={ZONA} />);
    const columna = (
      await screen.findByRole("heading", { name: (n: string) => n.startsWith(dp.columnas.recibida) })
    ).closest("section")!;
    await u.click(await within(columna).findByRole("button", { name: /Cliente Pantallas/ }));
    await u.click(await screen.findByRole("button", { name: dp.enProceso }));
    await waitFor(async () => expect(await estadoDe(orden.id)).toBe("en_proceso"));

    await u.type(screen.getByPlaceholderText(dp.ubicacionPlaceholder), "b-12");
    // Mientras se guarda el cambio anterior los botones están desactivados: se espera como lo haría una persona.
    const camisa = await screen.findByRole("button", { name: `${dp.lista}: Camisa` });
    await waitFor(() => expect(camisa).toBeEnabled());
    await u.click(camisa);
    await screen.findByText((t) => t.includes("📍B-12"));
    const todaLista = screen.getByRole("button", { name: dp.lista });
    await waitFor(() => expect(todaLista).toBeEnabled());
    await u.click(todaLista);
    await waitFor(async () => expect(await estadoDe(orden.id)).toBe("lista"));
  });

  it("producción: modo rápido por etiqueta, código que no existe y sin conexión con la copia local", async () => {
    const u = userEvent.setup();
    const orden = await esc.nuevaOrden();
    const pieza = await e.env.DB.prepare(
      "select codigo_etiqueta from orden_prendas where orden_id = ? limit 1",
    )
      .bind(orden.id)
      .first<{ codigo_etiqueta: string }>();
    montar(<PantallaProduccion zona={ZONA} />);
    await u.click(screen.getByRole("checkbox", { name: dp.modoRapido }));
    await escanear(u, dp.escanearPlaceholder, pieza!.codigo_etiqueta);
    await waitFor(async () => expect(await estadoDe(orden.id)).toBe("en_proceso"));

    await escanear(u, dp.escanearPlaceholder, "ZZZZZZZZ");
    expect(await screen.findByText(dp.noEncontrado)).toBeInTheDocument();

    const otra = await esc.nuevaOrden();
    await refrescarDatosSinConexion();
    puente.sinConexion(true);
    await u.click(screen.getByRole("checkbox", { name: dp.modoRapido }));
    await escanear(u, dp.escanearPlaceholder, String(otra.numero));
    await u.click(await screen.findByRole("button", { name: dp.lista }));
    expect(await estadoDe(otra.id)).toBe("recibida");
    puente.sinConexion(false);
    await sincronizar();
    expect(await estadoDe(otra.id)).toBe("lista");
  });

  it("entrega: elegir entre varias, cobrar el saldo con tarjeta y entregar; una incompleta se entrega igual", async () => {
    const u = userEvent.setup();
    const lista = await esc.nuevaOrden();
    await cambiarEstado(e.env.DB, esc.sesion, lista.id, { estado: "lista" });
    const incompleta = await esc.nuevaOrden();
    montar(<PantallaEntrega moneda="USD" zona={ZONA} />);

    await escanear(u, de.buscar, "no existe nadie así");
    expect(await screen.findByText(de.sinOrdenes)).toBeInTheDocument();

    await escanear(u, de.buscar, "Pantallas");
    expect(await screen.findByText(de.elegir)).toBeInTheDocument();
    await u.click(screen.getByRole("button", { name: (n: string) => n.startsWith(String(lista.numero)) }));
    await u.click(await screen.findByRole("radio", { name: d.caja.metodos.tarjeta_externa }));
    await u.type(screen.getByLabelText(d.mostrador.referencia), "5555");
    await u.click(screen.getByRole("button", { name: "Cobrar $12.50 y entregar" }));
    expect(await screen.findByText(`Orden #${lista.numero} entregada`)).toBeInTheDocument();
    expect(await estadoDe(lista.id)).toBe("entregada");

    await escanear(u, de.buscar, String(incompleta.numero));
    expect(await screen.findByText(de.noLista)).toBeInTheDocument();
    await u.click(screen.getByRole("button", { name: de.entregarIgual }));
    expect(await screen.findByText(`Orden #${incompleta.numero} entregada`)).toBeInTheDocument();
  });

  it("entrega sin conexión: busca en la copia local y entrega; lo dice en ámbar, no en verde; se sube al volver", async () => {
    const u = userEvent.setup();
    const orden = await esc.nuevaOrden();
    await cambiarEstado(e.env.DB, esc.sesion, orden.id, { estado: "lista" });
    await refrescarDatosSinConexion();
    montar(<PantallaEntrega moneda="USD" zona={ZONA} />);
    puente.sinConexion(true);
    await escanear(u, de.buscar, String(orden.numero));
    await u.click(await screen.findByRole("button", { name: "Cobrar $12.50 y entregar" }));
    // CANDADO B44: lo que no llegó al servidor no se da por hecho.
    expect(
      await screen.findByText((t) =>
        t.startsWith(`La orden #${orden.numero} quedó registrada como entregada en este equipo`),
      ),
    ).toBeInTheDocument();
    expect(screen.queryByText(`Orden #${orden.numero} entregada`)).not.toBeInTheDocument();
    expect(await estadoDe(orden.id)).toBe("lista");
    puente.sinConexion(false);
    await sincronizar();
    expect(await estadoDe(orden.id)).toBe("entregada");
  });

  it("entrega con efectivo y la caja cerrada: el botón no se apaga, abre la caja ahí mismo y entrega", async () => {
    const u = userEvent.setup();
    await cerrarTurno(e.env.DB, esc.sesion, 0, null);
    const orden = await esc.nuevaOrden();
    await cambiarEstado(e.env.DB, esc.sesion, orden.id, { estado: "lista" });
    montar(<PantallaEntrega moneda="USD" zona={ZONA} />);
    await escanear(u, de.buscar, String(orden.numero));
    expect(await screen.findByText(d.mostrador.cajaCerrada, { exact: false })).toBeInTheDocument();
    const boton = await screen.findByRole("button", { name: "Cobrar $12.50 y entregar" });
    expect(boton).toBeEnabled();
    await u.click(boton);
    const modal = await screen.findByRole("dialog");
    expect(within(modal).getByText(de.cajaCerradaTitulo)).toBeInTheDocument();
    await u.type(within(modal).getByLabelText(d.caja.fondo), "20");
    await u.click(within(modal).getByRole("button", { name: de.abrirYSeguir }));
    expect(await screen.findByText(`Orden #${orden.numero} entregada`)).toBeInTheDocument();
    expect(await estadoDe(orden.id)).toBe("entregada");
    const turno = await e.env.DB.prepare(
      "select fondo_cents from turnos_caja where tintoreria_id = ? and estado = 'abierto'",
    )
      .bind(esc.tintoreriaId)
      .first<{ fondo_cents: number }>();
    expect(turno?.fondo_cents).toBe(2000);
  });
});
