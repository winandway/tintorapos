import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";

vi.mock("@/server/entorno", () => import("../ayuda/mock-entorno"));

import { GET as resumen } from "@/app/datos/admin/resumen/route";
import { GET as listarTiendas } from "@/app/datos/admin/tintorerias/route";
import { PUT as cambiarTienda } from "@/app/datos/admin/tintorerias/[id]/route";
import { GET as listarTickets } from "@/app/datos/admin/tickets/route";
import {
  GET as verTicketRuta,
  POST as responderRuta,
  PUT as estadoRuta,
} from "@/app/datos/admin/tickets/[id]/route";
import { POST as contacto } from "@/app/datos/contacto/route";
import { crearEntorno, type EntornoPrueba } from "../ayuda/entorno";
import { usarEntorno } from "../ayuda/mock-entorno";
import { Navegador } from "../ayuda/cliente-http";
import { enviados as enviadosMsw, TOKEN_CORREO_PRUEBA } from "../ayuda/msw";
import { crearTintoreria, crearUsuario, sesionPara } from "../ayuda/fabrica";

type Err = { error: { codigo: string } };

/**
 * CANDADO DEL PANEL DE WINDOCE: ve TODAS las tintorerías, así que la puerta es
 * lo más importante de este archivo — solo entra un correo de `CORREOS_ADMIN`
 * con sesión de cuenta y el segundo paso pasado.
 */
describe("panel de Windoce y billetes de soporte", () => {
  let e: EntornoPrueba;
  const jefe = new Navegador();
  const duena = new Navegador();
  let tintoreriaId = "";
  // Ojo: `enviadosMsw.correo` lo comparten todos los archivos de prueba. Aquí se
  // mira solo lo que salió DESPUÉS de cada marca, nunca se vacía la lista: si se
  // vacía, otro archivo que corra a la vez se queda sin sus correos y falla sin
  // motivo (pasó el 20 de septiembre de 2026).
  let marca = 0;
  const desdeAqui = () => {
    marca = enviadosMsw.correo.length;
  };
  const correos = () =>
    enviadosMsw.correo.slice(marca).map((c) => ({ to: c.to[0]!.address, subject: c.subject }));

  beforeAll(async () => {
    e = await crearEntorno({
      YADOMINIOS_TOKEN: TOKEN_CORREO_PRUEBA,
      EMAIL_FROM: "avisos@tintora.prueba",
      CORREOS_ADMIN: "go@windoce.com",
    });
    usarEntorno(e);
    const t = await crearTintoreria(e.env.DB, "Tintorería de un cliente");
    tintoreriaId = t.id;
    duena.cookies.set("tp_sesion", await sesionPara(e.env.DB, t.id, t.duenoId, { dosPasos: true }));

    const w = await crearTintoreria(e.env.DB, "Soporte Windoce");
    const soporte = await crearUsuario(e.env.DB, w.id, "dueno", {
      correo: "go@windoce.com",
      nombre: "Soporte Windoce",
    });
    jefe.cookies.set("tp_sesion", await sesionPara(e.env.DB, w.id, soporte, { dosPasos: true }));
  }, 120_000);
  afterAll(() => e.cerrar());

  it("la dueña de una tintorería NO entra al panel (candado)", async () => {
    for (const llamada of [
      duena.llamar<Err>(resumen),
      duena.llamar<Err>(listarTiendas),
      duena.llamar<Err>(listarTickets),
    ]) {
      const r = await llamada;
      expect(r.estado).toBe(403);
      expect(r.datos.error.codigo).toBe("sin_permiso");
    }
    const intento = await duena.llamar<Err>(cambiarTienda, {
      metodo: "PUT",
      params: { id: tintoreriaId },
      cuerpo: { plan: "pagado" },
    });
    expect(intento.estado).toBe(403);
  });

  it("el panel cuenta las cuentas, el uso y el dinero de todas", async () => {
    const r = await jefe.llamar<{
      cuentas: { total: number; enPrueba: number; pagando: number };
      uso: { usuarios: number };
      soporte: { ticketsAbiertos: number };
    }>(resumen);
    expect(r.estado).toBe(200);
    expect(r.datos.cuentas.total).toBeGreaterThanOrEqual(2);
    expect(r.datos.uso.usuarios).toBeGreaterThanOrEqual(2);
  });

  it("activar el plan de quien paga quita el bloqueo de la prueba", async () => {
    await e.env.DB.prepare("update tintorerias set plan = 'prueba', prueba_hasta = ? where id = ?")
      .bind(Date.now() - 86_400_000, tintoreriaId)
      .run();
    const r = await jefe.llamar(cambiarTienda, {
      metodo: "PUT",
      params: { id: tintoreriaId },
      cuerpo: { plan: "pagado" },
    });
    expect(r.estado).toBe(200);
    const t = await e.env.DB.prepare("select plan, prueba_hasta from tintorerias where id = ?")
      .bind(tintoreriaId)
      .first<{ plan: string; prueba_hasta: number | null }>();
    expect(t).toEqual({ plan: "pagado", prueba_hasta: null });

    const lista = await jefe.llamar<{ tintorerias: { id: string; plan: string }[] }>(listarTiendas);
    expect(lista.datos.tintorerias.find((x) => x.id === tintoreriaId)?.plan).toBe("pagado");
  });

  it("un mensaje del sitio abre un billete, avisa a soporte y la respuesta le llega al cliente", async () => {
    desdeAqui();
    const abrir = await new Navegador().llamar(contacto, {
      cuerpo: {
        nombre: "Dueña que pregunta",
        correo: "duena@tintoreriaquepregunta.com",
        asunto: "¿Sirve para dos tiendas?",
        mensaje: "Tengo dos locales y quiero saber si puedo verlos por separado.",
      },
    });
    expect(abrir.estado).toBe(200);
    expect(correos().some((c) => c.to === "go@windoce.com" && c.subject.includes("billete"))).toBe(true);

    const lista = await jefe.llamar<{ tickets: { id: string; numero: number; estado: string }[] }>(
      listarTickets,
      { ruta: "/datos/admin/tickets?estado=abierto" },
    );
    const ticket = lista.datos.tickets[0]!;
    expect(ticket.estado).toBe("abierto");

    desdeAqui();
    const respuesta = await jefe.llamar<{ enviado: boolean }>(responderRuta, {
      params: { id: ticket.id },
      cuerpo: { mensaje: "Sí: cada tienda lleva sus órdenes y sus reportes por separado." },
    });
    expect(respuesta.estado).toBe(200);
    expect(respuesta.datos.enviado).toBe(true);
    expect(correos()[0]!.to).toBe("duena@tintoreriaquepregunta.com");

    const detalle = await jefe.llamar<{
      ticket: { estado: string; mensajes: { de: string; enviadoEn: number | null }[] };
    }>(verTicketRuta, { params: { id: ticket.id } });
    expect(detalle.datos.ticket.estado).toBe("respondido");
    expect(detalle.datos.ticket.mensajes.map((m) => m.de)).toEqual(["cliente", "soporte"]);
    expect(detalle.datos.ticket.mensajes[1]!.enviadoEn).not.toBeNull();

    const cerrado = await jefe.llamar(estadoRuta, {
      metodo: "PUT",
      params: { id: ticket.id },
      cuerpo: { estado: "cerrado" },
    });
    expect(cerrado.estado).toBe(200);
  });
});
