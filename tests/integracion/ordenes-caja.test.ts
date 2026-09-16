import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";

vi.mock("@/server/entorno", () => import("../ayuda/mock-entorno"));

import { GET as listar, POST as crear } from "@/app/datos/ordenes/route";
import { GET as ver } from "@/app/datos/ordenes/[id]/route";
import { POST as estado } from "@/app/datos/ordenes/[id]/estado/route";
import { POST as entregar } from "@/app/datos/ordenes/[id]/entregar/route";
import { POST as anular } from "@/app/datos/ordenes/[id]/anular/route";
import { POST as abandonar } from "@/app/datos/ordenes/[id]/abandonar/route";
import { POST as reimprimir } from "@/app/datos/ordenes/[id]/reimpresion/route";
import { POST as pagar } from "@/app/datos/ordenes/[id]/pagos/route";
import { POST as anularPago } from "@/app/datos/pagos/[id]/anular/route";
import { GET as escanear } from "@/app/datos/escaneo/route";
import { GET as caja, POST as abrirCaja } from "@/app/datos/caja/route";
import { POST as movimiento } from "@/app/datos/caja/movimientos/route";
import { POST as cerrarCaja } from "@/app/datos/caja/cerrar/route";
import { GET as turnos } from "@/app/datos/caja/turnos/route";
import { nuevoId } from "@/lib/codigos";
import { estadoDeOrden } from "@/server/ordenes/estados";
import type { Orden, OrdenLista } from "@/server/ordenes/consultas";
import { crearEntorno, type EntornoPrueba } from "../ayuda/entorno";
import { usarEntorno } from "../ayuda/mock-entorno";
import { Navegador } from "../ayuda/cliente-http";
import {
  crearDispositivo,
  crearTintoreria,
  crearUsuario,
  sesionPara,
  type TintoreriaPrueba,
} from "../ayuda/fabrica";

type Err = { error: { codigo: string; mensaje: string; campos?: Record<string, string> } };

describe("órdenes, pagos y caja (candado de dinero)", () => {
  let e: EntornoPrueba;
  let t: TintoreriaPrueba;
  let cajero: Navegador;
  let gerente: Navegador;
  let planta: Navegador;
  let gerenteId: string;
  const cat: Record<string, string> = {};
  let clienteId: string;

  beforeAll(async () => {
    e = await crearEntorno();
    usarEntorno(e);
    const db = e.env.DB;
    t = await crearTintoreria(db);
    const disp = await crearDispositivo(db, t);
    const ahora = Date.now();
    cat.camisa = nuevoId();
    cat.traje = nuevoId();
    cat.seco = nuevoId();
    cat.libra = nuevoId();
    cat.arreglo = nuevoId();
    clienteId = nuevoId();
    await db.batch([
      db
        .prepare(
          "insert into catalogo_prendas (id, tintoreria_id, nombre_es, nombre_en, creado_en) values (?, ?, 'Camisa', 'Shirt', ?)",
        )
        .bind(cat.camisa, t.id, ahora),
      db
        .prepare(
          "insert into catalogo_prendas (id, tintoreria_id, nombre_es, nombre_en, creado_en) values (?, ?, 'Traje', 'Suit', ?)",
        )
        .bind(cat.traje, t.id, ahora),
      db
        .prepare(
          "insert into catalogo_servicios (id, tintoreria_id, nombre_es, unidad, aplica_impuesto, creado_en) values (?, ?, 'Lavado en seco', 'pieza', 1, ?)",
        )
        .bind(cat.seco, t.id, ahora),
      db
        .prepare(
          "insert into catalogo_servicios (id, tintoreria_id, nombre_es, unidad, aplica_impuesto, dias_entrega, creado_en) values (?, ?, 'Por libra', 'libra', 0, 1, ?)",
        )
        .bind(cat.libra, t.id, ahora),
      db
        .prepare(
          "insert into catalogo_servicios (id, tintoreria_id, nombre_es, unidad, aplica_impuesto, activo, creado_en) values (?, ?, 'Viejo', 'pieza', 1, 0, ?)",
        )
        .bind(cat.arreglo, t.id, ahora),
      db
        .prepare(
          "insert into precios (tintoreria_id, servicio_id, prenda_id, precio_cents, actualizado_en) values (?, ?, ?, 399, ?)",
        )
        .bind(t.id, cat.seco, cat.camisa, ahora),
      db
        .prepare(
          "insert into precios (tintoreria_id, servicio_id, prenda_id, precio_cents, actualizado_en) values (?, ?, '', 175, ?)",
        )
        .bind(t.id, cat.libra, ahora),
      db
        .prepare(
          "insert into clientes (id, tintoreria_id, nombre, idioma, creado_en, actualizado_en) values (?, ?, 'Ana', 'es', ?, ?)",
        )
        .bind(clienteId, t.id, ahora, ahora),
    ]);
    const cajeroId = await crearUsuario(db, t.id, "cajero", { pin: "5820" });
    gerenteId = await crearUsuario(db, t.id, "gerente", { pin: "6931", nombre: "Gerente" });
    const plantaId = await crearUsuario(db, t.id, "planta", { pin: "3917" });
    cajero = new Navegador();
    cajero.cookies.set(
      "tp_sesion",
      await sesionPara(db, t.id, cajeroId, { tipo: "pin", dispositivoId: disp.id }),
    );
    gerente = new Navegador();
    gerente.cookies.set(
      "tp_sesion",
      await sesionPara(db, t.id, gerenteId, { tipo: "pin", dispositivoId: disp.id }),
    );
    planta = new Navegador();
    planta.cookies.set(
      "tp_sesion",
      await sesionPara(db, t.id, plantaId, { tipo: "pin", dispositivoId: disp.id }),
    );
  });
  afterAll(() => e.cerrar());

  const camisa = () => ({ id: nuevoId(), prendaId: cat.camisa, servicioId: cat.seco, cantidad: 1 });

  it("estado de la orden se deriva de sus piezas", () => {
    expect(estadoDeOrden([])).toBe("recibida");
    expect(estadoDeOrden(["recibida", "recibida"])).toBe("recibida");
    expect(estadoDeOrden(["recibida", "en_proceso"])).toBe("en_proceso");
    expect(estadoDeOrden(["lista", "recibida"])).toBe("en_proceso");
    expect(estadoDeOrden(["lista", "anulada"])).toBe("lista");
  });

  it("efectivo sin caja abierta no se cobra; con caja sí", async () => {
    const sinCaja = await cajero.llamar<Err>(crear, {
      cuerpo: {
        id: nuevoId(),
        cliente: { id: clienteId },
        prendas: [camisa()],
        pago: { id: nuevoId(), metodo: "efectivo", montoCents: 100 },
      },
    });
    expect(sinCaja.datos.error.codigo).toBe("turno_cerrado");
    expect((await cajero.llamar<{ turno: null }>(caja)).datos.turno).toBeNull();
    expect((await cajero.llamar(abrirCaja, { cuerpo: { fondoCents: 10_000 } })).estado).toBe(200);
    expect(
      ((await cajero.llamar<Err>(abrirCaja, { cuerpo: { fondoCents: 1 } })).datos as Err).error.codigo,
    ).toBe("turno_abierto");
  });

  let ordenId: string;
  let codigoPublico: string;
  let prendaIds: string[];

  it("crea una orden con camisas, libras, cliente nuevo, urgente y abono; es idempotente", async () => {
    ordenId = nuevoId();
    const piezas = [
      camisa(),
      camisa(),
      { id: nuevoId(), servicioId: cat.libra, cantidad: 12.5, notas: "Ropa de cama" },
    ];
    prendaIds = piezas.map((p) => p.id);
    const cuerpo = {
      id: ordenId,
      cliente: {
        nuevo: { id: nuevoId(), nombre: "Luis", telefono: "7865550101", idioma: "en", aceptaSms: true },
      },
      prendas: piezas,
      urgente: true,
      pago: { id: nuevoId(), metodo: "efectivo", montoCents: 1000 },
      notas: "Mancha de café en una camisa",
    };
    const r = await cajero.llamar<{
      id: string;
      numero: number;
      codigoPublico: string;
      totales: Record<string, number>;
      repetida: boolean;
    }>(crear, { cuerpo });
    expect(r.estado).toBe(200);
    // 2 × 3.99 + 12.5 lb × 1.75 = 7.98 + 21.88 = 29.86; urgente +50 % = 14.93 → 44.79
    expect(r.datos.totales).toMatchObject({ subtotalCents: 2986, recargoCents: 1493, descuentoCents: 0 });
    // Impuesto solo sobre las camisas: 798 × 4479/2986 = 1197 → 8.25 % = 99
    expect(r.datos.totales.impuestoCents).toBe(99);
    expect(r.datos.totales.totalCents).toBe(4578);
    expect(r.datos.numero).toBe(1001);
    codigoPublico = r.datos.codigoPublico;

    const otraVez = await cajero.llamar<{ numero: number; repetida: boolean }>(crear, { cuerpo });
    expect(otraVez.datos).toMatchObject({ numero: 1001, repetida: true });
    const conteo = await e.env.DB.prepare("select count(*) as n from pagos where tintoreria_id = ?")
      .bind(t.id)
      .first<{ n: number }>();
    expect(conteo?.n).toBe(1);

    const o = (await cajero.llamar<{ orden: Orden }>(ver, { params: { id: ordenId } })).datos.orden;
    expect(o).toMatchObject({
      estado: "recibida",
      pagadoCents: 1000,
      saldoCents: 3578,
      urgente: true,
      cliente: { nombre: "Luis", idioma: "en" },
    });
    expect(o.prendas).toHaveLength(3);
    expect(new Set(o.prendas.map((p) => p.codigoEtiqueta)).size).toBe(3);
    expect(o.historial[0]).toMatchObject({ estadoAnterior: null, estadoNuevo: "recibida" });

    // La siguiente orden sigue la numeración.
    const r2 = await cajero.llamar<{ numero: number }>(crear, {
      cuerpo: { id: nuevoId(), cliente: { id: clienteId }, prendas: [camisa()] },
    });
    expect(r2.datos.numero).toBe(1002);
  });

  it("valida precios, cantidades y servicios", async () => {
    const base = { id: nuevoId(), cliente: { id: clienteId } };
    const sinPrecio = await cajero.llamar<Err>(crear, {
      cuerpo: {
        ...base,
        prendas: [{ id: nuevoId(), prendaId: cat.traje, servicioId: cat.seco, cantidad: 1 }],
      },
    });
    expect(sinPrecio.datos.error.mensaje).toContain("Traje");
    const conManual = await cajero.llamar(crear, {
      cuerpo: {
        ...base,
        prendas: [
          { id: nuevoId(), prendaId: cat.traje, servicioId: cat.seco, cantidad: 1, precioUnitCents: 1500 },
        ],
      },
    });
    expect(conManual.estado).toBe(200);
    const dosPiezas = await cajero.llamar<Err>(crear, {
      cuerpo: { id: nuevoId(), cliente: { id: clienteId }, prendas: [{ ...camisa(), cantidad: 2 }] },
    });
    expect(dosPiezas.estado).toBe(400);
    const inactivo = await cajero.llamar(crear, {
      cuerpo: {
        id: nuevoId(),
        cliente: { id: clienteId },
        prendas: [{ ...camisa(), servicioId: cat.arreglo }],
      },
    });
    expect(inactivo.estado).toBe(404);
    const sinPrenda = await cajero.llamar(crear, {
      cuerpo: {
        id: nuevoId(),
        cliente: { id: clienteId },
        prendas: [{ id: nuevoId(), servicioId: cat.seco, cantidad: 1 }],
      },
    });
    expect(sinPrenda.estado).toBe(400);
    const pagoDeMas = await cajero.llamar<Err>(crear, {
      cuerpo: {
        id: nuevoId(),
        cliente: { id: clienteId },
        prendas: [camisa()],
        pago: { id: nuevoId(), metodo: "otro", montoCents: 99_999 },
      },
    });
    expect(pagoDeMas.datos.error.codigo).toBe("pago_excede");
    const clienteAjeno = await cajero.llamar(crear, {
      cuerpo: { id: nuevoId(), cliente: { id: nuevoId() }, prendas: [camisa()] },
    });
    expect(clienteAjeno.estado).toBe(404);
  });

  it("descuento grande o precio menor al de la lista piden PIN de gerente", async () => {
    const cuerpo = (extra: object) => ({
      id: nuevoId(),
      cliente: { id: clienteId },
      prendas: Array.from({ length: 10 }, camisa),
      ...extra,
    });
    const grande = await cajero.llamar<Err>(crear, {
      cuerpo: cuerpo({ descuento: { tipo: "porcentaje", bps: 2000 } }),
    });
    expect(grande.datos.error.codigo).toBe("requiere_autorizacion");
    const chico = await cajero.llamar(crear, {
      cuerpo: cuerpo({ descuento: { tipo: "porcentaje", bps: 500 } }),
    });
    expect(chico.estado).toBe(200);
    const autorizado = await cajero.llamar<{ id: string }>(crear, {
      cuerpo: cuerpo({
        descuento: { tipo: "monto", cents: 1000 },
        descuentoMotivo: "Cliente frecuente",
        autorizacion: { usuarioId: gerenteId, pin: "6931" },
      }),
    });
    expect(autorizado.estado).toBe(200);
    const fila = await e.env.DB.prepare("select autorizado_por, descuento_motivo from ordenes where id = ?")
      .bind(autorizado.datos.id)
      .first();
    expect(fila).toEqual({ autorizado_por: gerenteId, descuento_motivo: "Cliente frecuente" });
    const rebaja = await cajero.llamar<Err>(crear, {
      cuerpo: { id: nuevoId(), cliente: { id: clienteId }, prendas: [{ ...camisa(), precioUnitCents: 100 }] },
    });
    expect(rebaja.datos.error.codigo).toBe("requiere_autorizacion");
    const pinMalo = await cajero.llamar<Err>(crear, {
      cuerpo: {
        id: nuevoId(),
        cliente: { id: clienteId },
        prendas: [{ ...camisa(), precioUnitCents: 100 }],
        autorizacion: { usuarioId: gerenteId, pin: "0000" },
      },
    });
    expect(pinMalo.datos.error.codigo).toBe("autorizacion_invalida");
  });

  it("escanear: por código de ticket, de etiqueta o número", async () => {
    const o = (await cajero.llamar<{ orden: Orden }>(ver, { params: { id: ordenId } })).datos.orden;
    expect(
      (
        await planta.llamar(escanear, {
          ruta: `/datos/escaneo?codigo=${encodeURIComponent(`https://x.com/t/${codigoPublico}`)}`,
        })
      ).datos,
    ).toEqual({ ordenId, prendaId: null });
    expect(
      (await planta.llamar(escanear, { ruta: `/datos/escaneo?codigo=${o.prendas[1]!.codigoEtiqueta}` }))
        .datos,
    ).toEqual({ ordenId, prendaId: o.prendas[1]!.id });
    expect((await planta.llamar(escanear, { ruta: "/datos/escaneo?codigo=%231001" })).datos).toEqual({
      ordenId,
      prendaId: null,
    });
    expect((await planta.llamar(escanear, { ruta: "/datos/escaneo?codigo=nada" })).estado).toBe(404);
    expect((await planta.llamar(escanear, { ruta: "/datos/escaneo?codigo=99999" })).estado).toBe(404);
  });

  it("producción mueve piezas con ubicación; la orden queda lista cuando todas lo están; planta no ve montos", async () => {
    const r1 = await planta.llamar<{ estadoNuevo: string; quedoLista: boolean }>(estado, {
      params: { id: ordenId },
      cuerpo: { estado: "en_proceso", prendaIds: [prendaIds[0]] },
    });
    expect(r1.datos).toMatchObject({ estadoNuevo: "en_proceso", quedoLista: false });
    const r2 = await planta.llamar<{ estadoNuevo: string; quedoLista: boolean }>(estado, {
      params: { id: ordenId },
      cuerpo: { estado: "lista", ubicacion: "B-12" },
    });
    expect(r2.datos).toMatchObject({ estadoNuevo: "lista", quedoLista: true });
    const vista = (await planta.llamar<{ orden: Orden }>(ver, { params: { id: ordenId } })).datos.orden;
    expect(vista.totalCents).toBe(0);
    expect(vista.pagos).toEqual([]);
    expect(vista.prendas.every((p) => p.ubicacion === "B-12" && p.estado === "lista")).toBe(true);
    const listaPlanta = await planta.llamar<{ ordenes: OrdenLista[] }>(listar);
    expect(listaPlanta.datos.ordenes.every((o) => o.totalCents === 0)).toBe(true);
    expect(
      (
        await planta.llamar(estado, {
          params: { id: ordenId },
          cuerpo: { estado: "lista", prendaIds: ["no-existe"] },
        })
      ).estado,
    ).toBe(404);
    expect(
      (await planta.llamar(estado, { params: { id: ordenId }, cuerpo: { estado: "recibida" } })).estado,
    ).toBe(400);
    expect(
      (
        await planta.llamar(pagar, {
          params: { id: ordenId },
          cuerpo: { id: nuevoId(), metodo: "efectivo", montoCents: 1 },
        })
      ).estado,
    ).toBe(403);
  });

  it("entregar exige saldo en cero; cobra lo pendiente en el mismo paso; pagos idempotentes", async () => {
    const debe = await cajero.llamar<Err>(entregar, { params: { id: ordenId }, cuerpo: {} });
    expect(debe.datos.error.mensaje).toContain("35.78");
    const abonoId = nuevoId();
    expect(
      (
        await cajero.llamar(pagar, {
          params: { id: ordenId },
          cuerpo: { id: abonoId, metodo: "tarjeta_externa", montoCents: 578, referencia: "4242" },
        })
      ).estado,
    ).toBe(200);
    expect(
      (
        await cajero.llamar<{ repetido: boolean }>(pagar, {
          params: { id: ordenId },
          cuerpo: { id: abonoId, metodo: "tarjeta_externa", montoCents: 578 },
        })
      ).datos.repetido,
    ).toBe(true);
    expect(
      (
        await cajero.llamar(pagar, {
          params: { id: ordenId },
          cuerpo: { id: abonoId, metodo: "tarjeta_externa", montoCents: 1 },
        })
      ).estado,
    ).toBe(409);
    const deMas = await cajero.llamar<Err>(entregar, {
      params: { id: ordenId },
      cuerpo: { pago: { id: nuevoId(), metodo: "efectivo", montoCents: 5000 } },
    });
    expect(deMas.datos.error.codigo).toBe("pago_excede");
    const ok = await cajero.llamar(entregar, {
      params: { id: ordenId },
      cuerpo: { pago: { id: nuevoId(), metodo: "efectivo", montoCents: 3000 } },
    });
    expect(ok.estado).toBe(200);
    const o = (await cajero.llamar<{ orden: Orden }>(ver, { params: { id: ordenId } })).datos.orden;
    expect(o).toMatchObject({ estado: "entregada", saldoCents: 0, pagadoCents: 4578 });
    expect((await cajero.llamar(entregar, { params: { id: ordenId }, cuerpo: {} })).estado).toBe(409);
    expect(
      (
        await cajero.llamar(pagar, {
          params: { id: ordenId },
          cuerpo: { id: nuevoId(), metodo: "otro", montoCents: 1 },
        })
      ).estado,
    ).toBe(400);
  });

  it("forzar entrega de piezas no listas y anular con reembolso requieren lo suyo", async () => {
    const id = nuevoId();
    await cajero.llamar(crear, {
      cuerpo: {
        id,
        cliente: { id: clienteId },
        prendas: [camisa()],
        pago: { id: nuevoId(), metodo: "efectivo", montoCents: 432 },
      },
    });
    expect(
      ((await cajero.llamar<Err>(entregar, { params: { id }, cuerpo: {} })).datos as Err).error.codigo,
    ).toBe("estado_invalido");
    const id2 = nuevoId();
    await cajero.llamar(crear, { cuerpo: { id: id2, cliente: { id: clienteId }, prendas: [camisa()] } });
    expect(
      (
        await cajero.llamar(entregar, {
          params: { id: id2 },
          cuerpo: { forzar: true, pago: { id: nuevoId(), metodo: "otro", montoCents: 432 } },
        })
      ).estado,
    ).toBe(200);

    expect(
      (
        (await cajero.llamar<Err>(anular, { params: { id }, cuerpo: { motivo: "Cliente se arrepintió" } }))
          .datos as Err
      ).error.codigo,
    ).toBe("requiere_autorizacion");
    const r = await cajero.llamar<{ reembolsoCents: number }>(anular, {
      params: { id },
      cuerpo: { motivo: "Cliente se arrepintió", autorizacion: { usuarioId: gerenteId, pin: "6931" } },
    });
    expect(r.datos.reembolsoCents).toBe(432);
    const o = (await cajero.llamar<{ orden: Orden }>(ver, { params: { id } })).datos.orden;
    expect(o).toMatchObject({ estado: "anulada", pagadoCents: 0 });
    expect(o.pagos.every((p) => p.anuladoEn)).toBe(true);
    expect((await gerente.llamar(anular, { params: { id }, cuerpo: { motivo: "otra vez" } })).estado).toBe(
      409,
    );
    expect(
      (await gerente.llamar(anular, { params: { id: nuevoId() }, cuerpo: { motivo: "no existe" } })).estado,
    ).toBe(404);
  });

  it("anular un pago y reimprimir recibo piden gerente; etiquetas no; abandonar solo tras los días de la tienda", async () => {
    const id = nuevoId();
    const pagoId = nuevoId();
    await cajero.llamar(crear, {
      cuerpo: {
        id,
        cliente: { id: clienteId },
        prendas: [camisa()],
        pago: { id: pagoId, metodo: "efectivo", montoCents: 200 },
      },
    });
    expect(
      (
        (
          await cajero.llamar<Err>(anularPago, {
            params: { id: pagoId },
            cuerpo: { motivo: "Error de cobro" },
          })
        ).datos as Err
      ).error.codigo,
    ).toBe("requiere_autorizacion");
    expect(
      (await gerente.llamar(anularPago, { params: { id: pagoId }, cuerpo: { motivo: "Error de cobro" } }))
        .estado,
    ).toBe(200);
    expect(
      (await gerente.llamar(anularPago, { params: { id: pagoId }, cuerpo: { motivo: "Error de cobro" } }))
        .estado,
    ).toBe(409);
    expect(
      (await gerente.llamar(anularPago, { params: { id: nuevoId() }, cuerpo: { motivo: "no existe" } }))
        .estado,
    ).toBe(404);
    expect((await cajero.llamar<{ orden: Orden }>(ver, { params: { id } })).datos.orden.pagadoCents).toBe(0);

    expect(
      ((await cajero.llamar<Err>(reimprimir, { params: { id }, cuerpo: { tipo: "recibo" } })).datos as Err)
        .error.codigo,
    ).toBe("requiere_autorizacion");
    expect((await cajero.llamar(reimprimir, { params: { id }, cuerpo: { tipo: "etiquetas" } })).estado).toBe(
      200,
    );
    expect(
      (
        await cajero.llamar(reimprimir, {
          params: { id },
          cuerpo: { tipo: "recibo", autorizacion: { usuarioId: gerenteId, pin: "6931" } },
        })
      ).estado,
    ).toBe(200);
    expect(
      (await cajero.llamar(reimprimir, { params: { id: nuevoId() }, cuerpo: { tipo: "etiquetas" } })).estado,
    ).toBe(404);

    await planta.llamar(estado, { params: { id }, cuerpo: { estado: "lista" } });
    expect((await gerente.llamar(abandonar, { params: { id }, cuerpo: {} })).estado).toBe(409);
    await e.env.DB.prepare("update ordenes set lista_en = ? where id = ?")
      .bind(Date.now() - 100 * 24 * 3600_000, id)
      .run();
    expect(
      ((await cajero.llamar<Err>(abandonar, { params: { id }, cuerpo: {} })).datos as Err).error.codigo,
    ).toBe("requiere_autorizacion");
    expect((await gerente.llamar(abandonar, { params: { id }, cuerpo: {} })).estado).toBe(200);
    expect((await gerente.llamar(abandonar, { params: { id: nuevoId() }, cuerpo: {} })).estado).toBe(404);
    expect((await planta.llamar(estado, { params: { id }, cuerpo: { estado: "lista" } })).estado).toBe(409);
  });

  it("lista de órdenes: abiertas, atrasadas, por número, teléfono o nombre", async () => {
    const atrasada = nuevoId();
    await cajero.llamar(crear, {
      cuerpo: {
        id: atrasada,
        cliente: { id: clienteId },
        prendas: [camisa()],
        fechaPromesa: Date.now() - 3600_000,
      },
    });
    const atrasadas = await cajero.llamar<{ ordenes: OrdenLista[] }>(listar, {
      ruta: "/datos/ordenes?estado=atrasadas",
    });
    expect(atrasadas.datos.ordenes.map((o) => o.id)).toEqual([atrasada]);
    expect(atrasadas.datos.ordenes[0]!.atrasada).toBe(true);
    const porNumero = await cajero.llamar<{ ordenes: OrdenLista[] }>(listar, {
      ruta: "/datos/ordenes?estado=todas&q=%231001",
    });
    expect(porNumero.datos.ordenes.map((o) => o.numero)).toEqual([1001]);
    const porTel = await cajero.llamar<{ ordenes: OrdenLista[] }>(listar, {
      ruta: "/datos/ordenes?estado=todas&q=786-555-0101",
    });
    expect(porTel.datos.ordenes.map((o) => o.cliente)).toEqual(["Luis"]);
    const porNombre = await cajero.llamar<{ ordenes: OrdenLista[] }>(listar, {
      ruta: "/datos/ordenes?estado=entregada&q=ana",
    });
    expect(porNombre.datos.ordenes.length).toBeGreaterThan(0);
    const hoy = new Date().toISOString().slice(0, 10);
    const rango = await cajero.llamar<{ ordenes: OrdenLista[] }>(listar, {
      ruta: `/datos/ordenes?estado=todas&desde=2000-01-01&hasta=2999-12-31&antes=${Date.now() + 1000}`,
    });
    expect(rango.datos.ordenes.length).toBeGreaterThan(3);
    expect(hoy).toMatch(/^\d{4}/);
    const raro = await cajero.llamar<{ ordenes: OrdenLista[] }>(listar, {
      ruta: "/datos/ordenes?estado=inventado",
    });
    expect(raro.estado).toBe(200);
  });

  it("caja: movimientos con autorización y cierre ciego (el cajero no ve el esperado)", async () => {
    const resumen = await gerente.llamar<{
      turno: { esperadoCents: number; ventasPorMetodo: Record<string, number> };
    }>(caja);
    // Fondo 100.00 + efectivo activo: 10.00 + 30.00 (orden 1001) + 2.00 anulado → no cuenta; 4.32 anulado → no cuenta
    expect(resumen.datos.turno.ventasPorMetodo.efectivo).toBe(4000);
    expect(resumen.datos.turno.esperadoCents).toBe(14_000);
    const vistaCajero = await cajero.llamar<{ turno: Record<string, unknown> }>(caja);
    expect(vistaCajero.datos.turno.esperadoCents).toBeUndefined();

    expect(
      (
        (
          await cajero.llamar<Err>(movimiento, {
            cuerpo: { tipo: "salida", montoCents: 1500, motivo: "Compra de perchas" },
          })
        ).datos as Err
      ).error.codigo,
    ).toBe("requiere_autorizacion");
    expect(
      (
        await cajero.llamar(movimiento, {
          cuerpo: {
            tipo: "salida",
            montoCents: 1500,
            motivo: "Compra de perchas",
            autorizacion: { usuarioId: gerenteId, pin: "6931" },
          },
        })
      ).estado,
    ).toBe(200);
    expect(
      (
        await gerente.llamar(movimiento, {
          cuerpo: { tipo: "entrada", montoCents: 500, motivo: "Cambio del banco" },
        })
      ).estado,
    ).toBe(200);
    expect(
      (
        await gerente.llamar(movimiento, {
          cuerpo: { tipo: "sin_venta", montoCents: 0, motivo: "Dar cambio" },
        })
      ).estado,
    ).toBe(200);
    expect(
      (await gerente.llamar(movimiento, { cuerpo: { tipo: "entrada", montoCents: 0, motivo: "Nada" } }))
        .estado,
    ).toBe(400);

    const cierreCajero = await cajero.llamar<Record<string, unknown>>(cerrarCaja, {
      cuerpo: { contadoCents: 12_900, notas: "Faltó una moneda" },
    });
    expect(cierreCajero.estado).toBe(200);
    expect(cierreCajero.datos.esperadoCents).toBeUndefined();
    expect(cierreCajero.datos.diferenciaCents).toBeUndefined();
    expect((await cajero.llamar<Err>(cerrarCaja, { cuerpo: { contadoCents: 1 } })).datos.error.codigo).toBe(
      "turno_cerrado",
    );
    expect(
      (await cajero.llamar<Err>(movimiento, { cuerpo: { tipo: "entrada", montoCents: 1, motivo: "Tarde" } }))
        .datos.error.codigo,
    ).toBe("turno_cerrado");

    const historial = await gerente.llamar<{
      turnos: { esperadoCents: number; diferenciaCents: number; contadoCents: number }[];
    }>(turnos);
    // Esperado: 140.00 - 15.00 + 5.00 = 130.00; contado 129.00 → faltan 1.00
    expect(historial.datos.turnos[0]).toMatchObject({
      esperadoCents: 13_000,
      contadoCents: 12_900,
      diferenciaCents: -100,
    });
    expect((await cajero.llamar(turnos)).estado).toBe(403);

    // El gerente sí ve la diferencia al cerrar.
    await gerente.llamar(abrirCaja, { cuerpo: { fondoCents: 0 } });
    const cierreGerente = await gerente.llamar<Record<string, number>>(cerrarCaja, {
      cuerpo: { contadoCents: 0 },
    });
    expect(cierreGerente.datos).toMatchObject({ esperadoCents: 0, diferenciaCents: 0 });
  });
});
