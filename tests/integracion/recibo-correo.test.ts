import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/server/entorno", () => import("../ayuda/mock-entorno"));

import { POST as crearOrdenRuta } from "@/app/datos/ordenes/route";
import { GET as verOrdenRuta } from "@/app/datos/ordenes/[id]/route";
import { POST as reciboCorreo } from "@/app/datos/ordenes/[id]/recibo-correo/route";
import { GET as verAvisos } from "@/app/datos/avisos/route";
import { PUT as guardarPlantillas } from "@/app/datos/avisos/plantillas/route";
import { nuevoId } from "@/lib/codigos";
import { crearEntorno, type EntornoPrueba } from "../ayuda/entorno";
import { usarEntorno } from "../ayuda/mock-entorno";
import { enviados, TOKEN_CORREO_PRUEBA } from "../ayuda/msw";
import { Navegador } from "../ayuda/cliente-http";
import { escenarioAislamiento, type Escenario } from "../ayuda/escenario";

type Err = { error: { codigo: string } };
type OrdenVista = {
  orden: {
    cliente: { correo: string | null; aceptaCorreo: boolean };
    avisos: { tipo: string; canal: string; destino: string; estado: string; error: string | null }[];
  };
};

/**
 * CANDADO DEL RECIBO POR CORREO (21 sep 2026). Richard: «los mail no llegan o no
 * envía la factura digital al cliente». Causa: el único correo al crear la orden
 * era el aviso «recibida», que nace APAGADO y era una línea de texto. Ahora el
 * recibo digital sale solo, encendido de fábrica, con el nombre de la tienda
 * como remitente, y la orden dice si salió o por qué no.
 */
describe("recibo digital por correo", () => {
  let e: EntornoPrueba;
  let esc: Escenario;
  let dueno: Navegador;

  const nueva = (clienteId: string) => ({
    id: nuevoId(),
    cliente: { id: clienteId },
    prendas: [{ id: nuevoId(), prendaId: esc.a.ids.prendaId, servicioId: esc.a.ids.servicioId, cantidad: 1 }],
  });
  const cliente = (cambios: string) =>
    e.env.DB.prepare(`update clientes set ${cambios} where id = ?`).bind(esc.a.ids.clienteId!).run();

  beforeAll(async () => {
    e = await crearEntorno({ YADOMINIOS_TOKEN: TOKEN_CORREO_PRUEBA, EMAIL_FROM: "avisos@tintora.prueba" });
    usarEntorno(e);
    esc = await escenarioAislamiento(e);
    await cliente("nombre = 'Marta', idioma = 'es', acepta_correo = 1, correo = 'marta@correo.com'");
    await e.env.DB.prepare("update tintorerias set correo = 'tienda@lavanderia.com' where id = ?")
      .bind(esc.a.id)
      .run();
    dueno = new Navegador();
    dueno.cookies.set("tp_sesion", esc.a.sesionDueno);
  });
  beforeEach(() => {
    enviados.correo.length = 0;
    enviados.twilio.length = 0;
  });
  afterAll(() => e.cerrar());

  it("al crear la orden sale SOLO, sin tocar ningún ajuste, con el recibo completo", async () => {
    const o = await dueno.llamar<{ id: string; numero: number }>(crearOrdenRuta, {
      cuerpo: nueva(esc.a.ids.clienteId!),
    });
    expect(o.estado).toBe(200);
    await e.esperar();
    expect(enviados.correo).toHaveLength(1);
    const c = enviados.correo[0]!;
    expect(c.to).toEqual([{ address: "marta@correo.com" }]);
    // El cliente ve a SU lavandería, no a «Tintora POS», y le responde a ella.
    expect(c.from.name).toContain("Tintoreria A");
    expect(c.reply_to).toBe("tienda@lavanderia.com");
    expect(c.subject).toBe(`Tu recibo · Orden #${o.datos.numero} · ${c.from.name}`);
    // El recibo: número, total y el botón a SU orden. En HTML y también en texto.
    expect(c.html).toContain(`#${o.datos.numero}`);
    expect(c.html).toContain("TOTAL");
    expect(c.html).toMatch(/href="https?:\/\/[^"]+\/t\/[A-Z0-9]+"/);
    expect(c.text).toContain("TOTAL");
    // El aviso «recibida» sigue apagado: no salió ningún SMS.
    expect(enviados.twilio).toHaveLength(0);

    // Y la orden lo dice, a la vista.
    const vista = await dueno.llamar<OrdenVista>(verOrdenRuta, { params: { id: o.datos.id } });
    expect(vista.datos.orden.avisos[0]).toMatchObject({
      tipo: "recibida",
      canal: "correo",
      destino: "marta@correo.com",
      estado: "enviado",
    });
  });

  it("si el dueño lo apaga, deja de salir solo; a pedido sigue saliendo", async () => {
    const ajustes = await dueno.llamar<{ reciboCorreo: boolean }>(verAvisos);
    expect(ajustes.datos.reciboCorreo).toBe(true);
    await dueno.llamar(guardarPlantillas, { metodo: "PUT", cuerpo: { reciboCorreo: false } });
    expect((await dueno.llamar<{ reciboCorreo: boolean }>(verAvisos)).datos.reciboCorreo).toBe(false);

    const o = await dueno.llamar<{ id: string }>(crearOrdenRuta, { cuerpo: nueva(esc.a.ids.clienteId!) });
    await e.esperar();
    expect(enviados.correo).toHaveLength(0);

    const r = await dueno.llamar<{ estado: string }>(reciboCorreo, {
      params: { id: o.datos.id },
      cuerpo: {},
    });
    expect(r.datos.estado).toBe("enviado");
    expect(enviados.correo).toHaveLength(1);
    expect(enviados.correo[0]!.html).toContain("TOTAL");
    await dueno.llamar(guardarPlantillas, { metodo: "PUT", cuerpo: { reciboCorreo: true } });
  });

  it("solo, respeta al cliente que no aceptó correos; a pedido en el mostrador sí se le manda", async () => {
    await cliente("acepta_correo = 0");
    const o = await dueno.llamar<{ id: string }>(crearOrdenRuta, { cuerpo: nueva(esc.a.ids.clienteId!) });
    await e.esperar();
    expect(enviados.correo).toHaveLength(0);
    const r = await dueno.llamar<{ estado: string }>(reciboCorreo, {
      params: { id: o.datos.id },
      cuerpo: {},
    });
    expect(r.datos.estado).toBe("enviado");
    await cliente("acepta_correo = 1");
  });

  it("cliente sin correo: no sale nada, el botón lo explica y la orden lo dice", async () => {
    await cliente("correo = null");
    const o = await dueno.llamar<{ id: string }>(crearOrdenRuta, { cuerpo: nueva(esc.a.ids.clienteId!) });
    await e.esperar();
    expect(enviados.correo).toHaveLength(0);
    const r = await dueno.llamar<Err>(reciboCorreo, { params: { id: o.datos.id }, cuerpo: {} });
    expect(r.estado).toBe(400);
    expect(r.datos.error.codigo).toBe("cliente_sin_correo");
    const vista = await dueno.llamar<OrdenVista>(verOrdenRuta, { params: { id: o.datos.id } });
    expect(vista.datos.orden.cliente.correo).toBeNull();
    expect(vista.datos.orden.avisos).toEqual([]);
    await cliente("correo = 'marta@correo.com'");
  });

  it("si el correo rebota, no se queda callado: la orden dice que falló y por qué", async () => {
    await cliente("correo = 'rebota@correo.com'");
    const o = await dueno.llamar<{ id: string }>(crearOrdenRuta, { cuerpo: nueva(esc.a.ids.clienteId!) });
    await e.esperar();
    const vista = await dueno.llamar<OrdenVista>(verOrdenRuta, { params: { id: o.datos.id } });
    expect(vista.datos.orden.avisos[0]).toMatchObject({ estado: "fallido", destino: "rebota@correo.com" });
    expect(vista.datos.orden.avisos[0]!.error).toContain("rebote_permanente");
    await cliente("correo = 'marta@correo.com'");
  });

  it("el botón tiene tope: no sirve de cañón de correos", async () => {
    const o = await dueno.llamar<{ id: string }>(crearOrdenRuta, { cuerpo: nueva(esc.a.ids.clienteId!) });
    await e.esperar();
    let ultimo = 200;
    for (let i = 0; i < 6; i++)
      ultimo = (await dueno.llamar(reciboCorreo, { params: { id: o.datos.id }, cuerpo: {} })).estado;
    expect(ultimo).toBe(429);
  });
});
