import { z } from "zod";
import { codigoEtiqueta, codigoPublico, esCodigoValido, nuevoId } from "@/lib/codigos";
import { calcularTotales, cantidadValida, totalLinea, type Descuento, type Totales } from "@/lib/dinero";
import { fechaLocal, fechaPromesa } from "@/lib/fechas";
import { sentenciaAuditoria } from "@/server/auditoria";
import { resolverAutorizacion, type Autorizacion } from "@/server/auth/autorizacion";
import type { Sesion } from "@/server/auth/sesiones";
import { esquemaAutorizacion } from "@/server/caja";
import { leerCatalogo } from "@/server/catalogo";
import { crearCliente, esquemaCliente } from "@/server/clientes";
import { ErrorApp, noEncontrado } from "@/server/errores";
import { esErrorLimitePago, esquemaPago, sentenciasPago } from "@/server/pagos";
import { usuarioPuede } from "@/server/permisos";

export const esquemaLinea = z.object({
  id: z.uuid(),
  codigoEtiqueta: z
    .string()
    .refine((c) => esCodigoValido(c, 12), "invalido")
    .optional(),
  prendaId: z.string().max(64).nullable().optional(),
  servicioId: z.string().min(1).max(64),
  cantidad: z.number().positive().max(10_000),
  precioUnitCents: z.number().int().min(0).max(10_000_000).optional(),
  color: z.string().trim().max(40).optional(),
  marca: z.string().trim().max(40).optional(),
  notas: z.string().trim().max(300).optional(),
});

export const esquemaNuevaOrden = z.object({
  id: z.uuid(),
  codigoPublico: z
    .string()
    .refine((c) => esCodigoValido(c, 20), "invalido")
    .optional(),
  cliente: z.union([
    z.object({ id: z.string().min(1).max(64) }),
    z.object({ nuevo: esquemaCliente.extend({ id: z.uuid() }) }),
  ]),
  prendas: z.array(esquemaLinea).min(1).max(200),
  urgente: z.boolean().default(false),
  fechaPromesa: z.number().int().positive().optional(),
  descuento: z
    .union([
      z.object({ tipo: z.literal("monto"), cents: z.number().int().min(0).max(100_000_000) }),
      z.object({ tipo: z.literal("porcentaje"), bps: z.number().int().min(0).max(10_000) }),
    ])
    .nullable()
    .optional(),
  descuentoMotivo: z.string().trim().max(200).optional(),
  notas: z.string().trim().max(500).optional(),
  pago: esquemaPago.nullable().optional(),
  autorizacion: esquemaAutorizacion.optional(),
});

export type DatosNuevaOrden = z.infer<typeof esquemaNuevaOrden>;

export interface OrdenCreada {
  id: string;
  numero: number;
  codigoPublico: string;
  totales: Totales;
  repetida: boolean;
}

/** Crea la orden completa en UNA transacción: cliente nuevo, prendas, estado, pago y auditoría. */
export async function crearOrden(
  db: D1Database,
  s: Sesion,
  d: DatosNuevaOrden,
  ahora = Date.now(),
  origen: "en_linea" | "sin_conexion" = "en_linea",
): Promise<OrdenCreada> {
  const previa = await db
    .prepare(
      "select id, numero, codigo_publico, subtotal_cents, recargo_cents, descuento_cents, impuesto_cents, total_cents from ordenes where tintoreria_id = ? and id = ?",
    )
    .bind(s.tintoreria.id, d.id)
    .first<{
      id: string;
      numero: number;
      codigo_publico: string;
      subtotal_cents: number;
      recargo_cents: number;
      descuento_cents: number;
      impuesto_cents: number;
      total_cents: number;
    }>();
  if (previa) {
    return {
      id: previa.id,
      numero: previa.numero,
      codigoPublico: previa.codigo_publico,
      repetida: true,
      totales: {
        subtotalCents: previa.subtotal_cents,
        recargoCents: previa.recargo_cents,
        descuentoCents: previa.descuento_cents,
        impuestoCents: previa.impuesto_cents,
        totalCents: previa.total_cents,
        requiereAutorizacion: false,
      },
    };
  }

  const cat = await leerCatalogo(db, s.tintoreria.id);
  const servicios = new Map(cat.servicios.map((x) => [x.id, x]));
  const prendas = new Map(cat.prendas.map((x) => [x.id, x]));
  const precios = new Map(cat.precios.map((x) => [`${x.servicioId}|${x.prendaId}`, x.precioCents]));

  let precioManualMenor = false;
  let diasMax = 0;
  const lineas = d.prendas.map((l, posicion) => {
    const servicio = servicios.get(l.servicioId);
    if (!servicio || !servicio.activo) throw noEncontrado();
    const prenda = l.prendaId ? prendas.get(l.prendaId) : undefined;
    if (l.prendaId && !prenda) throw noEncontrado();
    if (servicio.unidad === "pieza" && !prenda)
      throw new ErrorApp(400, "datos_invalidos", {}, { [`prendas.${posicion}.prendaId`]: "requerido" });
    if (!cantidadValida(l.cantidad, servicio.unidad)) {
      throw new ErrorApp(400, "datos_invalidos", {}, { [`prendas.${posicion}.cantidad`]: "invalido" });
    }
    if (servicio.unidad === "pieza" && l.cantidad !== 1) {
      // Cada pieza física es su propia fila (con su etiqueta).
      throw new ErrorApp(400, "datos_invalidos", {}, { [`prendas.${posicion}.cantidad`]: "invalido" });
    }
    const catalogo = precios.get(`${servicio.id}|${servicio.unidad === "libra" ? "" : (prenda?.id ?? "")}`);
    let precio = l.precioUnitCents ?? catalogo;
    if (precio === undefined) {
      throw new ErrorApp(
        400,
        "precio_faltante",
        { prenda: prenda?.nombreEs ?? servicio.nombreEs },
        { [`prendas.${posicion}.precioUnitCents`]: "requerido" },
      );
    }
    if (catalogo !== undefined && l.precioUnitCents !== undefined && l.precioUnitCents < catalogo)
      precioManualMenor = true;
    precio = Math.trunc(precio);
    diasMax = Math.max(diasMax, servicio.diasEntrega ?? s.tintoreria.diasEntrega);
    return {
      id: l.id,
      codigo: l.codigoEtiqueta ?? codigoEtiqueta(),
      prendaId: prenda?.id ?? null,
      servicioId: servicio.id,
      prendaEs: prenda?.nombreEs ?? servicio.nombreEs,
      prendaEn: prenda?.nombreEn ?? servicio.nombreEn,
      servicioEs: servicio.nombreEs,
      servicioEn: servicio.nombreEn,
      unidad: servicio.unidad,
      cantidad: l.cantidad,
      precio,
      total: totalLinea({ precioUnitCents: precio, cantidad: l.cantidad }),
      aplicaImpuesto: servicio.aplicaImpuesto,
      color: l.color || null,
      marca: l.marca || null,
      notas: l.notas || null,
      posicion,
    };
  });

  const descuento: Descuento = d.descuento ?? null;
  const totales = calcularTotales(
    lineas.map((l) => ({
      precioUnitCents: l.precio,
      cantidad: l.cantidad,
      unidad: l.unidad,
      aplicaImpuesto: l.aplicaImpuesto,
    })),
    d.urgente,
    descuento,
    s.tintoreria,
  );

  // Autorizaciones: un solo PIN de gerente cubre lo que la orden necesite.
  let autorizadoPor: string | null = null;
  const autorizacion = d.autorizacion as Autorizacion | undefined;
  if (totales.requiereAutorizacion)
    autorizadoPor = await resolverAutorizacion(db, s, "ordenes.descuento_mayor", autorizacion, ahora);
  if (precioManualMenor && !usuarioPuede(s.usuario, "ordenes.precio_manual")) {
    autorizadoPor =
      (await resolverAutorizacion(db, s, "ordenes.precio_manual", autorizacion, ahora)) ?? autorizadoPor;
  }
  if (d.pago && d.pago.montoCents > totales.totalCents)
    throw new ErrorApp(400, "pago_excede", {}, { "pago.montoCents": "pago_excede" });

  const sentencias: D1PreparedStatement[] = [];
  let clienteId: string;
  if ("nuevo" in d.cliente) {
    const existe = await db
      .prepare("select id from clientes where tintoreria_id = ? and id = ?")
      .bind(s.tintoreria.id, d.cliente.nuevo.id)
      .first<{ id: string }>();
    clienteId = existe
      ? existe.id
      : await crearCliente(db, s, d.cliente.nuevo, ahora, {
          permitirRepetido: origen === "sin_conexion",
          origen,
        });
  } else {
    const c = await db
      .prepare("select id from clientes where tintoreria_id = ? and id = ? and eliminado_en is null")
      .bind(s.tintoreria.id, d.cliente.id)
      .first<{ id: string }>();
    if (!c) throw noEncontrado();
    clienteId = c.id;
  }

  const codigo = d.codigoPublico ?? codigoPublico();
  const promesa = d.fechaPromesa ?? fechaPromesa(ahora, s.tintoreria.zonaHoraria, diasMax, d.urgente);
  sentencias.push(
    db
      .prepare(
        `insert into ordenes (id, tintoreria_id, sucursal_id, numero, codigo_publico, cliente_id, estado, urgente, fecha_promesa, notas,
           subtotal_cents, recargo_cents, descuento_cents, descuento_motivo, impuesto_cents, total_cents, pagado_cents, impuesto_bps, recargo_bps,
           creada_por, autorizado_por, dispositivo_id, origen, fecha_local, creada_en, actualizada_en)
         values (?, ?, ?, (select proximo_numero from tintorerias where id = ?), ?, ?, 'recibida', ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      )
      .bind(
        d.id,
        s.tintoreria.id,
        s.sucursalId,
        s.tintoreria.id,
        codigo,
        clienteId,
        d.urgente ? 1 : 0,
        promesa,
        d.notas || null,
        totales.subtotalCents,
        totales.recargoCents,
        totales.descuentoCents,
        totales.descuentoCents > 0 ? d.descuentoMotivo || null : null,
        totales.impuestoCents,
        totales.totalCents,
        s.tintoreria.impuestoBps,
        d.urgente ? s.tintoreria.recargoUrgenteBps : 0,
        s.usuario.id,
        autorizadoPor,
        s.dispositivoId,
        origen,
        fechaLocal(ahora, s.tintoreria.zonaHoraria),
        ahora,
        ahora,
      ),
    db
      .prepare("update tintorerias set proximo_numero = proximo_numero + 1 where id = ?")
      .bind(s.tintoreria.id),
  );
  for (const l of lineas) {
    sentencias.push(
      db
        .prepare(
          `insert into orden_prendas (id, tintoreria_id, orden_id, prenda_id, servicio_id, prenda_es, prenda_en, servicio_es, servicio_en, unidad, cantidad,
             precio_unit_cents, total_cents, aplica_impuesto, color, marca, notas, codigo_etiqueta, estado, posicion, creada_en, actualizada_en)
           values (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'recibida', ?, ?, ?)`,
        )
        .bind(
          l.id,
          s.tintoreria.id,
          d.id,
          l.prendaId,
          l.servicioId,
          l.prendaEs,
          l.prendaEn,
          l.servicioEs,
          l.servicioEn,
          l.unidad,
          l.cantidad,
          l.precio,
          l.total,
          l.aplicaImpuesto ? 1 : 0,
          l.color,
          l.marca,
          l.notas,
          l.codigo,
          l.posicion,
          ahora,
          ahora,
        ),
    );
  }
  sentencias.push(
    db
      .prepare(
        "insert into orden_estados (id, tintoreria_id, orden_id, estado_anterior, estado_nuevo, usuario_id, dispositivo_id, creado_en) values (?, ?, ?, null, 'recibida', ?, ?, ?)",
      )
      .bind(nuevoId(), s.tintoreria.id, d.id, s.usuario.id, s.dispositivoId, ahora),
    sentenciaAuditoria(
      db,
      {
        tintoreriaId: s.tintoreria.id,
        usuarioId: s.usuario.id,
        autorizadoPor,
        dispositivoId: s.dispositivoId,
        accion: "orden.creada",
        entidad: "orden",
        entidadId: d.id,
        detalle: {
          piezas: lineas.length,
          totalCents: totales.totalCents,
          descuentoCents: totales.descuentoCents,
          urgente: d.urgente,
          origen,
        },
      },
      ahora,
    ),
  );
  if (d.pago) sentencias.push(...(await sentenciasPago(db, s, d.id, d.pago, ahora, origen)));

  try {
    await db.batch(sentencias);
  } catch (e) {
    if (esErrorLimitePago(e)) throw new ErrorApp(400, "pago_excede");
    if (e instanceof Error && /UNIQUE/i.test(e.message)) {
      // Otra petición con el mismo id ganó la carrera: se devuelve esa.
      const ya = await db
        .prepare("select id from ordenes where tintoreria_id = ? and id = ?")
        .bind(s.tintoreria.id, d.id)
        .first();
      if (ya) return crearOrden(db, s, d, ahora, origen);
      throw new ErrorApp(409, "codigo_repetido");
    }
    throw e;
  }
  const creada = await db
    .prepare("select numero from ordenes where tintoreria_id = ? and id = ?")
    .bind(s.tintoreria.id, d.id)
    .first<{ numero: number }>();
  return { id: d.id, numero: creada?.numero ?? 0, codigoPublico: codigo, totales, repetida: false };
}
