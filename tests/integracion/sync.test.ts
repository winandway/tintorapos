import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";

vi.mock("@/server/entorno", () => import("../ayuda/mock-entorno"));

import { POST as sync } from "@/app/datos/sync/route";
import { GET as cache } from "@/app/datos/mostrador/cache/route";
import { codigoEtiqueta, codigoPublico, nuevoId } from "@/lib/codigos";
import { horaOperacion, type ResultadoOp } from "@/server/sync";
import { crearEntorno, type EntornoPrueba } from "../ayuda/entorno";
import { usarEntorno } from "../ayuda/mock-entorno";
import { Navegador } from "../ayuda/cliente-http";
import { escenarioAislamiento, type Escenario } from "../ayuda/escenario";
import { crearUsuario, sesionPara } from "../ayuda/fabrica";

type Respuesta = { resultados: ResultadoOp[]; detenido: boolean };

describe("modo sin conexión: sincronización", () => {
  let e: EntornoPrueba;
  let esc: Escenario;
  let cajero: Navegador;

  beforeAll(async () => {
    e = await crearEntorno();
    usarEntorno(e);
    esc = await escenarioAislamiento(e);
    cajero = new Navegador();
    cajero.cookies.set(
      "tp_sesion",
      await sesionPara(e.env.DB, esc.a.id, esc.a.ids.empleadoId!, {
        tipo: "pin",
        dispositivoId: esc.a.dispositivoId,
      }),
    );
  });
  afterAll(() => e.cerrar());

  it("hora de la operación: la del dispositivo si es creíble", () => {
    const ahora = Date.parse("2026-09-16T12:00:00Z");
    expect(horaOperacion(ahora - 3600_000, ahora)).toBe(ahora - 3600_000);
    expect(horaOperacion(ahora + 3600_000, ahora)).toBe(ahora);
    expect(horaOperacion(ahora - 8 * 86_400_000, ahora)).toBe(ahora);
    expect(horaOperacion(ahora + 60_000, ahora)).toBe(ahora);
  });

  it("orden con cliente nuevo, cobro en efectivo con la caja cerrada, producción y entrega: todo en orden e idempotente", async () => {
    await e.env.DB.prepare("update turnos_caja set estado = 'cerrado' where tintoreria_id = ?")
      .bind(esc.a.id)
      .run();
    const ordenId = nuevoId();
    const clienteId = nuevoId();
    const piezaId = nuevoId();
    const hace2h = Date.now() - 2 * 3600_000;
    const ops = [
      {
        id: nuevoId(),
        tipo: "crear_orden",
        creadoEn: hace2h,
        cuerpo: {
          id: ordenId,
          codigoPublico: codigoPublico(),
          cliente: {
            nuevo: { id: clienteId, nombre: "Cliente sin señal", telefono: "3125550199", idioma: "es" },
          },
          prendas: [
            {
              id: piezaId,
              codigoEtiqueta: codigoEtiqueta(),
              prendaId: esc.a.ids.prendaId,
              servicioId: esc.a.ids.servicioId,
              cantidad: 1,
            },
          ],
          pago: { id: nuevoId(), metodo: "efectivo", montoCents: 777 },
        },
      },
      {
        id: nuevoId(),
        tipo: "estado",
        ordenId,
        creadoEn: hace2h + 1000,
        cuerpo: { estado: "lista", ubicacion: "C-3" },
      },
      { id: nuevoId(), tipo: "entregar", ordenId, creadoEn: hace2h + 2000, cuerpo: {} },
    ];
    const r = await cajero.llamar<Respuesta>(sync, { cuerpo: { ops } });
    expect(r.estado).toBe(200);
    expect(r.datos.detenido).toBe(false);
    expect(r.datos.resultados.map((x) => x.ok)).toEqual([true, true, true]);
    const orden = await e.env.DB.prepare(
      "select estado, pagado_cents, origen, creada_en, cliente_id from ordenes where id = ?",
    )
      .bind(ordenId)
      .first<Record<string, unknown>>();
    expect(orden).toMatchObject({
      estado: "entregada",
      pagado_cents: 777,
      origen: "sin_conexion",
      creada_en: hace2h,
      cliente_id: clienteId,
    });
    // El cliente se creó aunque su teléfono ya existía (sin conexión no se pudo preguntar).
    expect(
      (
        await e.env.DB.prepare(
          "select count(*) as n from clientes where telefono_digitos = '3125550199' and tintoreria_id = ?",
        )
          .bind(esc.a.id)
          .first()
      )?.n,
    ).toBe(2);
    const pago = await e.env.DB.prepare("select turno_id, origen from pagos where orden_id = ?")
      .bind(ordenId)
      .first();
    expect(pago).toEqual({ turno_id: null, origen: "sin_conexion" });

    // Reintentar todo el lote no duplica nada.
    const otra = await cajero.llamar<Respuesta>(sync, { cuerpo: { ops } });
    expect(otra.datos.resultados).toEqual(r.datos.resultados);
    expect(
      (await e.env.DB.prepare("select count(*) as n from pagos where orden_id = ?").bind(ordenId).first())?.n,
    ).toBe(1);
  });

  it("errores de negocio quedan como resultado permanente y no frenan lo demás; lo que no se permite, no pasa", async () => {
    const planta = new Navegador();
    const plantaId = await crearUsuario(e.env.DB, esc.a.id, "planta", { pin: "3917" });
    planta.cookies.set(
      "tp_sesion",
      await sesionPara(e.env.DB, esc.a.id, plantaId, { tipo: "pin", dispositivoId: esc.a.dispositivoId }),
    );
    const r = await planta.llamar<Respuesta>(sync, {
      cuerpo: {
        ops: [
          {
            id: nuevoId(),
            tipo: "pago",
            ordenId: esc.a.ids.ordenId,
            creadoEn: Date.now(),
            cuerpo: { id: nuevoId(), metodo: "otro", montoCents: 1 },
          },
          {
            id: nuevoId(),
            tipo: "estado",
            ordenId: esc.a.ids.ordenId,
            creadoEn: Date.now(),
            cuerpo: { estado: "en_proceso" },
          },
          {
            id: nuevoId(),
            tipo: "estado",
            ordenId: "no-existe",
            creadoEn: Date.now(),
            cuerpo: { estado: "lista" },
          },
          {
            id: nuevoId(),
            tipo: "estado",
            ordenId: esc.a.ids.ordenId,
            creadoEn: Date.now(),
            cuerpo: { estado: "volando" },
          },
        ],
      },
    });
    const [pago, estado, noExiste, invalido] = r.datos.resultados;
    expect(pago).toMatchObject({ ok: false, codigo: "sin_permiso", permanente: true });
    expect(estado).toMatchObject({ ok: true });
    expect(noExiste).toMatchObject({ ok: false, codigo: "no_encontrado" });
    expect(invalido).toMatchObject({ ok: false, codigo: "datos_invalidos" });
  });

  it("datos para trabajar sin conexión: clientes y órdenes abiertas con sus piezas; planta sin teléfonos ni montos", async () => {
    const r = await cajero.llamar<{
      clientes: { nombre: string }[];
      ordenes: { id: string; total_cents: number }[];
      prendas: { orden_id: string; codigo_etiqueta: string }[];
    }>(cache);
    expect(r.datos.clientes.length).toBeGreaterThan(0);
    expect(r.datos.ordenes.map((o) => o.id)).toContain(esc.a.ids.ordenId);
    expect(r.datos.prendas.some((p) => p.orden_id === esc.a.ids.ordenId)).toBe(true);
    expect(JSON.stringify(r.datos)).not.toContain("marca-unica-bbbb");

    const planta = new Navegador();
    const plantaId = await crearUsuario(e.env.DB, esc.a.id, "planta", { pin: "3917" });
    planta.cookies.set(
      "tp_sesion",
      await sesionPara(e.env.DB, esc.a.id, plantaId, { tipo: "pin", dispositivoId: esc.a.dispositivoId }),
    );
    const p = await planta.llamar<{ clientes: unknown[]; ordenes: { total_cents: number }[] }>(cache);
    expect(p.datos.clientes).toEqual([]);
    expect(p.datos.ordenes.every((o) => o.total_cents === 0)).toBe(true);
  });
});
