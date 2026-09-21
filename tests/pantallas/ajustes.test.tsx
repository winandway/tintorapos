import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";

vi.mock("@/server/entorno", () => import("../ayuda/mock-entorno"));
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn(), replace: vi.fn() }),
  usePathname: () => "/app/ajustes",
  useSearchParams: () => new URLSearchParams(),
}));

import { AjustesAvisos } from "@/components/ajustes/ajustes-avisos";
import { AjustesDatos } from "@/components/ajustes/ajustes-datos";
import { AjustesSeguridad } from "@/components/ajustes/ajustes-seguridad";
import { EditorPrecios } from "@/components/ajustes/editor-precios";
import { FormTienda } from "@/components/ajustes/form-tienda";
import { GestionDispositivos } from "@/components/ajustes/gestion-dispositivos";
import { permisosDe } from "@/server/permisos";
import { GestionEmpleados } from "@/components/ajustes/gestion-empleados";
import { variablesDe } from "@/server/entorno";
import { crearRespaldo } from "@/server/respaldos";
import { crearEntorno, type EntornoPrueba } from "../ayuda/entorno";
import { usarEntorno } from "../ayuda/mock-entorno";
import { d, escenarioPantallas, montar } from "../ayuda/pantallas";
import { instalarPuente, type Puente } from "../ayuda/puente-ui";

const ZONA = "America/New_York";
const dajustes = d.ajustes;

describe("ajustes (contra el servidor real)", () => {
  let e: EntornoPrueba;
  let esc: Awaited<ReturnType<typeof escenarioPantallas>>;
  let puente: Puente;
  beforeAll(async () => {
    e = await crearEntorno();
    usarEntorno(e);
    esc = await escenarioPantallas(e.env.DB);
    puente = instalarPuente({ tp_sesion: esc.token });
  }, 120_000);
  afterAll(async () => {
    puente.cerrar();
    await e.cerrar();
  });

  const menuDe = async (u: ReturnType<typeof userEvent.setup>, fila: HTMLElement, opcion: string) => {
    await u.click(within(fila).getByRole("button", { name: d.comun.masOpciones }));
    await u.click(await screen.findByRole("menuitem", { name: opcion }));
  };

  it("tu tienda: guarda nombre, teléfono e impuesto", async () => {
    const u = userEvent.setup();
    montar(<FormTienda />);
    const nombre = await screen.findByLabelText(dajustes.tienda.nombre);
    await u.clear(nombre);
    await u.type(nombre, "Tintorería Renombrada");
    await u.type(
      screen.getByLabelText((n: string) => n.startsWith(dajustes.tienda.telefono)),
      "3055550000",
    );
    const impuesto = screen.getByLabelText((n: string) => n.startsWith(dajustes.tienda.impuesto));
    await u.clear(impuesto);
    await u.type(impuesto, "8.25");
    await u.click(screen.getByRole("button", { name: d.comun.guardar }));
    await waitFor(async () => {
      const t = await e.env.DB.prepare("select nombre, impuesto_bps from tintorerias where id = ?")
        .bind(esc.tintoreriaId)
        .first<{ nombre: string; impuesto_bps: number }>();
      expect(t).toEqual({ nombre: "Tintorería Renombrada", impuesto_bps: 825 });
    });
  });

  it("prendas y precios: pone un precio, agrega un servicio y oculta una prenda", async () => {
    const u = userEvent.setup();
    montar(<EditorPrecios moneda="USD" unidadPeso="lb" />);
    const blusa = await screen.findByRole("textbox", { name: /^Blusa/ });
    await u.type(blusa, "6.5");
    expect(screen.getByText("1 precios sin guardar")).toBeInTheDocument();
    await u.click(screen.getByRole("button", { name: dajustes.precios.guardarPrecios }));
    await waitFor(() => expect(screen.queryByText("1 precios sin guardar")).toBeNull());

    await u.click(screen.getByRole("button", { name: `+ ${dajustes.precios.agregarServicio}` }));
    const modal = await screen.findByRole("dialog");
    await u.type(within(modal).getByLabelText(dajustes.precios.nombreEs), "Teñido");
    await u.type(
      within(modal).getByLabelText((n: string) => n.startsWith(dajustes.precios.nombreEn)),
      "Dyeing",
    );
    await u.click(within(modal).getByRole("button", { name: d.comun.guardar }));
    expect(await screen.findByRole("tab", { name: "Teñido" })).toBeInTheDocument();

    await u.click(screen.getByRole("tab", { name: "Lavado en seco" }));
    const filaFalda = (await screen.findByRole("textbox", { name: /^Falda/ })).closest("li")!;
    await menuDe(u, filaFalda, dajustes.precios.desactivar);
    await u.click(
      within(await screen.findByRole("dialog")).getByRole("button", { name: dajustes.precios.desactivar }),
    );
    await waitFor(async () => {
      const f = await e.env.DB.prepare(
        "select activo from catalogo_prendas where tintoreria_id = ? and nombre_es = 'Falda'",
      )
        .bind(esc.tintoreriaId)
        .first<{ activo: number }>();
      expect(f?.activo).toBe(0);
    });
  });

  it("empleados: agrega con PIN y desactiva", async () => {
    const u = userEvent.setup();
    montar(
      <GestionEmpleados miRol="dueno" miId={esc.usuarioId} misPermisos={permisosDe("dueno")} zona={ZONA} />,
    );
    await u.click(await screen.findByRole("button", { name: `+ ${dajustes.empleados.agregar}` }));
    const modal = await screen.findByRole("dialog");
    await u.type(within(modal).getByLabelText(dajustes.empleados.nombre), "Planta Uno");
    await u.selectOptions(within(modal).getByLabelText(dajustes.empleados.rol), "planta");
    await u.type(within(modal).getByLabelText(dajustes.empleados.pin, { selector: "input" }), "7394");
    await u.click(within(modal).getByRole("button", { name: d.comun.guardar }));
    const fila = (await screen.findByText("Planta Uno")).closest("li")!;
    await menuDe(u, fila, dajustes.empleados.desactivar);
    await u.click(
      within(await screen.findByRole("dialog")).getByRole("button", { name: dajustes.empleados.desactivar }),
    );
    expect(await within(fila).findByText(dajustes.empleados.inactivo)).toBeInTheDocument();
  });

  it("dispositivos: registra este dispositivo y lo desactiva", async () => {
    const u = userEvent.setup();
    montar(<GestionDispositivos puedeRegistrar zona={ZONA} esteId={null} />);
    await u.type(await screen.findByLabelText(dajustes.dispositivos.nombre), "Tablet de prueba");
    await u.click(screen.getByRole("button", { name: dajustes.dispositivos.registrarEste }));
    expect(await screen.findByText(dajustes.dispositivos.registrado)).toBeInTheDocument();
    const fila = (await screen.findByText("Tablet de prueba")).closest("li")!;
    await menuDe(u, fila, dajustes.dispositivos.desactivar);
    await u.click(
      within(await screen.findByRole("dialog")).getByRole("button", {
        name: dajustes.dispositivos.desactivar,
      }),
    );
    expect(await within(fila).findByText(dajustes.dispositivos.revocado)).toBeInTheDocument();
  });

  it("avisos: activa «orden lista», cambia el texto y manda una prueba (sin SMS configurado queda omitida)", async () => {
    const u = userEvent.setup();
    montar(<AjustesAvisos tienda="Tintorería Renombrada" zona={ZONA} />);
    const tarjeta = (await screen.findByRole("heading", { name: d.avisos.tipos.lista.titulo })).closest(
      "div.rounded-3xl, section, div",
    )!.parentElement!.parentElement!;
    const casilla = within(tarjeta).getByRole("checkbox", { name: d.avisos.activo });
    if (!(casilla as HTMLInputElement).checked) await u.click(casilla);
    const texto = within(tarjeta).getByLabelText((n: string) => n.startsWith(d.avisos.textoEs));
    await u.clear(texto);
    await u.type(texto, "Hola {{nombre}}, tu orden #{{numero}} ya está lista.");
    await u.click(screen.getByRole("button", { name: d.comun.guardar }));
    await waitFor(async () => {
      const t = await e.env.DB.prepare("select plantillas from tintorerias where id = ?")
        .bind(esc.tintoreriaId)
        .first<{ plantillas: string }>();
      expect(t?.plantillas).toContain("ya está lista");
    });
    await u.type(screen.getByLabelText(d.avisos.destino), "3055550000");
    await u.click(screen.getByRole("button", { name: d.avisos.enviar }));
    expect(await screen.findByText((t) => t.startsWith(d.avisos.resultado.omitido))).toBeInTheDocument();
  });

  it("seguridad y datos: actividad registrada, enlaces de exportación y respaldos", async () => {
    await crearRespaldo(e.env, variablesDe(e.env), esc.tintoreriaId);
    const u = userEvent.setup();
    const { unmount } = montar(<AjustesSeguridad cuenta totpActivo={false} verActividad zona={ZONA} />);
    expect(await screen.findByText(d.seguridad.inactiva)).toBeInTheDocument();
    expect(
      await screen.findByText((t) => t.includes(d.seguridad.acciones["cuenta.registrada"])),
    ).toBeInTheDocument();
    unmount();

    montar(<AjustesDatos zona={ZONA} />);
    expect(screen.getByRole("link", { name: (n: string) => n.includes(d.datos.todoJson) })).toHaveAttribute(
      "href",
      "/datos/exportar?formato=json",
    );
    expect(await screen.findByText((t) => t.includes("registros"))).toBeInTheDocument();
    expect(u).toBeTruthy();
  });
});
