import { z } from "zod";
import { formatoDinero } from "@/lib/i18n";
import { sentenciaAuditoria } from "@/server/auditoria";
import { resolverAutorizacion, type Autorizacion } from "@/server/auth/autorizacion";
import type { Sesion } from "@/server/auth/sesiones";
import { esquemaAutorizacion } from "@/server/caja";
import { ErrorApp, noEncontrado } from "@/server/errores";
import { esErrorLimitePago, esquemaPago, sentenciasPago } from "@/server/pagos";
import { nuevoId } from "@/lib/codigos";

export const esquemaEntrega = z.object({
  pago: esquemaPago.nullable().optional(),
  /** Entregar aunque no todas las piezas estén marcadas como listas. */
  forzar: z.boolean().optional(),
});

export async function entregarOrden(
  db: D1Database,
  s: Sesion,
  ordenId: string,
  d: z.infer<typeof esquemaEntrega>,
  ahora = Date.now(),
  origen: "en_linea" | "sin_conexion" = "en_linea",
) {
  const o = await db
    .prepare("select estado, total_cents, pagado_cents from ordenes where tintoreria_id = ? and id = ?")
    .bind(s.tintoreria.id, ordenId)
    .first<{ estado: string; total_cents: number; pagado_cents: number }>();
  if (!o) throw noEncontrado();
  if (!["recibida", "en_proceso", "lista"].includes(o.estado)) throw new ErrorApp(409, "orden_cerrada");
  const cobro = d.pago?.montoCents ?? 0;
  const saldo = o.total_cents - o.pagado_cents - cobro;
  if (cobro > o.total_cents - o.pagado_cents)
    throw new ErrorApp(400, "pago_excede", {}, { "pago.montoCents": "pago_excede" });
  if (saldo > 0)
    throw new ErrorApp(409, "saldo_pendiente", {
      monto: formatoDinero(saldo, s.tintoreria.moneda, s.tintoreria.idioma),
    });
  if (o.estado !== "lista" && !d.forzar) throw new ErrorApp(409, "estado_invalido");

  const sentencias: D1PreparedStatement[] = [];
  if (d.pago) {
    const ya = await db
      .prepare("select id from pagos where tintoreria_id = ? and id = ?")
      .bind(s.tintoreria.id, d.pago.id)
      .first();
    if (!ya) sentencias.push(...(await sentenciasPago(db, s, ordenId, d.pago, ahora, origen)));
  }
  sentencias.push(
    db
      .prepare(
        "update orden_prendas set estado = 'entregada', actualizada_en = ? where tintoreria_id = ? and orden_id = ? and estado != 'anulada'",
      )
      .bind(ahora, s.tintoreria.id, ordenId),
    db
      .prepare(
        "update ordenes set estado = 'entregada', entregada_en = ?, entregada_por = ?, actualizada_en = ? where tintoreria_id = ? and id = ?",
      )
      .bind(ahora, s.usuario.id, ahora, s.tintoreria.id, ordenId),
    db
      .prepare(
        "insert into orden_estados (id, tintoreria_id, orden_id, estado_anterior, estado_nuevo, usuario_id, dispositivo_id, creado_en) values (?, ?, ?, ?, 'entregada', ?, ?, ?)",
      )
      .bind(nuevoId(), s.tintoreria.id, ordenId, o.estado, s.usuario.id, s.dispositivoId, ahora),
    sentenciaAuditoria(
      db,
      {
        tintoreriaId: s.tintoreria.id,
        usuarioId: s.usuario.id,
        dispositivoId: s.dispositivoId,
        accion: "orden.entregada",
        entidad: "orden",
        entidadId: ordenId,
        detalle: { cobradoCents: cobro, forzada: o.estado !== "lista" },
      },
      ahora,
    ),
  );
  try {
    await db.batch(sentencias);
  } catch (e) {
    if (esErrorLimitePago(e)) throw new ErrorApp(400, "pago_excede");
    throw e;
  }
}

export const esquemaAnulacion = z.object({
  motivo: z.string().trim().min(3).max(200),
  autorizacion: esquemaAutorizacion.optional(),
});

/** Anular una orden anula también sus pagos (el efectivo esperado de la caja baja). */
export async function anularOrden(
  db: D1Database,
  s: Sesion,
  ordenId: string,
  motivo: string,
  autorizacion: Autorizacion | undefined,
  ahora = Date.now(),
) {
  const o = await db
    .prepare("select estado, pagado_cents from ordenes where tintoreria_id = ? and id = ?")
    .bind(s.tintoreria.id, ordenId)
    .first<{ estado: string; pagado_cents: number }>();
  if (!o) throw noEncontrado();
  if (o.estado === "anulada" || o.estado === "entregada") throw new ErrorApp(409, "orden_cerrada");
  const autorizadoPor = await resolverAutorizacion(db, s, "ordenes.anular", autorizacion, ahora);
  await db.batch([
    db
      .prepare(
        "update pagos set anulado_en = ?, anulado_por = ?, autorizado_por = ?, anulado_motivo = ? where tintoreria_id = ? and orden_id = ? and anulado_en is null",
      )
      .bind(ahora, s.usuario.id, autorizadoPor, motivo, s.tintoreria.id, ordenId),
    db
      .prepare(
        "update orden_prendas set estado = 'anulada', actualizada_en = ? where tintoreria_id = ? and orden_id = ?",
      )
      .bind(ahora, s.tintoreria.id, ordenId),
    db
      .prepare(
        "update ordenes set estado = 'anulada', pagado_cents = 0, anulada_en = ?, anulada_por = ?, anulada_motivo = ?, autorizado_por = coalesce(?, autorizado_por), actualizada_en = ? where tintoreria_id = ? and id = ?",
      )
      .bind(ahora, s.usuario.id, motivo, autorizadoPor, ahora, s.tintoreria.id, ordenId),
    db
      .prepare(
        "insert into orden_estados (id, tintoreria_id, orden_id, estado_anterior, estado_nuevo, usuario_id, dispositivo_id, creado_en) values (?, ?, ?, ?, 'anulada', ?, ?, ?)",
      )
      .bind(nuevoId(), s.tintoreria.id, ordenId, o.estado, s.usuario.id, s.dispositivoId, ahora),
    sentenciaAuditoria(
      db,
      {
        tintoreriaId: s.tintoreria.id,
        usuarioId: s.usuario.id,
        autorizadoPor,
        dispositivoId: s.dispositivoId,
        accion: "orden.anulada",
        entidad: "orden",
        entidadId: ordenId,
        detalle: { motivo, reembolsoCents: o.pagado_cents },
      },
      ahora,
    ),
  ]);
  return { reembolsoCents: o.pagado_cents };
}

export async function marcarAbandonada(
  db: D1Database,
  s: Sesion,
  ordenId: string,
  autorizacion: Autorizacion | undefined,
  ahora = Date.now(),
) {
  const o = await db
    .prepare(
      "select o.estado, o.lista_en, t.dias_abandono from ordenes o join tintorerias t on t.id = o.tintoreria_id where o.tintoreria_id = ? and o.id = ?",
    )
    .bind(s.tintoreria.id, ordenId)
    .first<{ estado: string; lista_en: number | null; dias_abandono: number }>();
  if (!o) throw noEncontrado();
  if (o.estado !== "lista" || !o.lista_en || ahora - o.lista_en < o.dias_abandono * 24 * 3600_000)
    throw new ErrorApp(409, "no_aplica");
  const autorizadoPor = await resolverAutorizacion(db, s, "ordenes.abandonar", autorizacion, ahora);
  await db.batch([
    db
      .prepare(
        "update orden_prendas set estado = 'abandonada', actualizada_en = ? where tintoreria_id = ? and orden_id = ? and estado != 'anulada'",
      )
      .bind(ahora, s.tintoreria.id, ordenId),
    db
      .prepare(
        "update ordenes set estado = 'abandonada', actualizada_en = ? where tintoreria_id = ? and id = ?",
      )
      .bind(ahora, s.tintoreria.id, ordenId),
    db
      .prepare(
        "insert into orden_estados (id, tintoreria_id, orden_id, estado_anterior, estado_nuevo, usuario_id, dispositivo_id, creado_en) values (?, ?, ?, 'lista', 'abandonada', ?, ?, ?)",
      )
      .bind(nuevoId(), s.tintoreria.id, ordenId, s.usuario.id, s.dispositivoId, ahora),
    sentenciaAuditoria(
      db,
      {
        tintoreriaId: s.tintoreria.id,
        usuarioId: s.usuario.id,
        autorizadoPor,
        dispositivoId: s.dispositivoId,
        accion: "orden.abandonada",
        entidad: "orden",
        entidadId: ordenId,
      },
      ahora,
    ),
  ]);
}

export const esquemaReimpresion = z.object({
  tipo: z.enum(["recibo", "etiquetas"]),
  autorizacion: esquemaAutorizacion.optional(),
});

/** Reimprimir el recibo pide gerente (evita recibos de pagos que no existen); las etiquetas no. */
export async function registrarReimpresion(
  db: D1Database,
  s: Sesion,
  ordenId: string,
  tipo: "recibo" | "etiquetas",
  autorizacion: Autorizacion | undefined,
  ahora = Date.now(),
) {
  const o = await db
    .prepare("select id from ordenes where tintoreria_id = ? and id = ?")
    .bind(s.tintoreria.id, ordenId)
    .first();
  if (!o) throw noEncontrado();
  const autorizadoPor =
    tipo === "recibo" ? await resolverAutorizacion(db, s, "recibos.reimprimir", autorizacion, ahora) : null;
  await sentenciaAuditoria(
    db,
    {
      tintoreriaId: s.tintoreria.id,
      usuarioId: s.usuario.id,
      autorizadoPor,
      dispositivoId: s.dispositivoId,
      accion: `orden.reimpresion_${tipo}`,
      entidad: "orden",
      entidadId: ordenId,
    },
    ahora,
  ).run();
}
