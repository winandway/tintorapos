import { z } from "zod";
import { fechaLocal } from "@/lib/fechas";
import { sentenciaAuditoria } from "@/server/auditoria";
import { resolverAutorizacion, type Autorizacion } from "@/server/auth/autorizacion";
import type { Sesion } from "@/server/auth/sesiones";
import { esquemaAutorizacion, turnoAbierto } from "@/server/caja";
import { ErrorApp, noEncontrado } from "@/server/errores";

export const METODOS = ["efectivo", "tarjeta_externa", "otro"] as const;
export type Metodo = (typeof METODOS)[number];

export const esquemaPago = z.object({
  id: z.uuid(),
  metodo: z.enum(METODOS),
  montoCents: z.number().int().min(1).max(100_000_000),
  referencia: z
    .string()
    .trim()
    .max(80)
    .transform((v) => (v === "" ? null : v))
    .nullable()
    .optional(),
});

export type DatosPago = z.infer<typeof esquemaPago>;

export function esErrorLimitePago(e: unknown): boolean {
  return e instanceof Error && /CHECK constraint failed/i.test(e.message);
}

/**
 * Sentencias para registrar un pago dentro de otra operación (crear orden,
 * entregar). El CHECK de la tabla ordenes impide cobrar de más aunque haya dos
 * pagos simultáneos: la transacción entera se cae.
 */
export async function sentenciasPago(
  db: D1Database,
  s: Sesion,
  ordenId: string,
  p: DatosPago,
  ahora: number,
  origen: "en_linea" | "sin_conexion" = "en_linea",
): Promise<D1PreparedStatement[]> {
  const turno = await turnoAbierto(db, s.tintoreria.id, s.sucursalId);
  if (p.metodo === "efectivo" && !turno) throw new ErrorApp(409, "turno_cerrado");
  return [
    db
      .prepare(
        `insert into pagos (id, tintoreria_id, orden_id, turno_id, metodo, monto_cents, referencia, usuario_id, dispositivo_id, origen, fecha_local, creado_en)
         values (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      )
      .bind(
        p.id,
        s.tintoreria.id,
        ordenId,
        turno?.id ?? null,
        p.metodo,
        p.montoCents,
        p.referencia ?? null,
        s.usuario.id,
        s.dispositivoId,
        origen,
        fechaLocal(ahora, s.tintoreria.zonaHoraria),
        ahora,
      ),
    db
      .prepare(
        "update ordenes set pagado_cents = pagado_cents + ?, actualizada_en = ? where tintoreria_id = ? and id = ?",
      )
      .bind(p.montoCents, ahora, s.tintoreria.id, ordenId),
    sentenciaAuditoria(
      db,
      {
        tintoreriaId: s.tintoreria.id,
        usuarioId: s.usuario.id,
        dispositivoId: s.dispositivoId,
        accion: "pago.registrado",
        entidad: "orden",
        entidadId: ordenId,
        detalle: { pagoId: p.id, metodo: p.metodo, montoCents: p.montoCents, origen },
      },
      ahora,
    ),
  ];
}

async function pagoExistente(db: D1Database, tintoreriaId: string, id: string) {
  return db
    .prepare("select id, orden_id, monto_cents, anulado_en from pagos where tintoreria_id = ? and id = ?")
    .bind(tintoreriaId, id)
    .first<{ id: string; orden_id: string; monto_cents: number; anulado_en: number | null }>();
}

/** Registra un pago o abono. Idempotente: reintentar con el mismo id no cobra dos veces. */
export async function registrarPago(
  db: D1Database,
  s: Sesion,
  ordenId: string,
  p: DatosPago,
  ahora = Date.now(),
  origen: "en_linea" | "sin_conexion" = "en_linea",
): Promise<{ id: string; repetido: boolean }> {
  const previo = await pagoExistente(db, s.tintoreria.id, p.id);
  if (previo) {
    if (previo.orden_id !== ordenId || previo.monto_cents !== p.montoCents)
      throw new ErrorApp(409, "conflicto");
    return { id: p.id, repetido: true };
  }
  const o = await db
    .prepare("select estado, total_cents, pagado_cents from ordenes where tintoreria_id = ? and id = ?")
    .bind(s.tintoreria.id, ordenId)
    .first<{ estado: string; total_cents: number; pagado_cents: number }>();
  if (!o) throw noEncontrado();
  if (o.estado === "anulada") throw new ErrorApp(409, "orden_cerrada");
  if (o.pagado_cents + p.montoCents > o.total_cents)
    throw new ErrorApp(400, "pago_excede", {}, { montoCents: "pago_excede" });
  try {
    await db.batch(await sentenciasPago(db, s, ordenId, p, ahora, origen));
  } catch (e) {
    if (esErrorLimitePago(e)) throw new ErrorApp(400, "pago_excede", {}, { montoCents: "pago_excede" });
    if (e instanceof Error && /UNIQUE|PRIMARY/i.test(e.message)) {
      // Solo es «repetido» si el pago existe en ESTA tintorería; si el id lo tiene otra, es un conflicto.
      if (await pagoExistente(db, s.tintoreria.id, p.id)) return { id: p.id, repetido: true };
      throw new ErrorApp(409, "conflicto");
    }
    throw e;
  }
  return { id: p.id, repetido: false };
}

export const esquemaAnularPago = z.object({
  motivo: z.string().trim().min(3).max(200),
  autorizacion: esquemaAutorizacion.optional(),
});

export async function anularPago(
  db: D1Database,
  s: Sesion,
  pagoId: string,
  motivo: string,
  autorizacion: Autorizacion | undefined,
  ahora = Date.now(),
): Promise<void> {
  const p = await pagoExistente(db, s.tintoreria.id, pagoId);
  if (!p) throw noEncontrado();
  if (p.anulado_en) throw new ErrorApp(409, "no_aplica");
  const autorizadoPor = await resolverAutorizacion(db, s, "pagos.anular", autorizacion, ahora);
  await db.batch([
    db
      .prepare(
        "update pagos set anulado_en = ?, anulado_por = ?, autorizado_por = ?, anulado_motivo = ? where tintoreria_id = ? and id = ? and anulado_en is null",
      )
      .bind(ahora, s.usuario.id, autorizadoPor, motivo, s.tintoreria.id, pagoId),
    db
      .prepare(
        "update ordenes set pagado_cents = pagado_cents - ?, actualizada_en = ? where tintoreria_id = ? and id = ?",
      )
      .bind(p.monto_cents, ahora, s.tintoreria.id, p.orden_id),
    sentenciaAuditoria(
      db,
      {
        tintoreriaId: s.tintoreria.id,
        usuarioId: s.usuario.id,
        autorizadoPor,
        dispositivoId: s.dispositivoId,
        accion: "pago.anulado",
        entidad: "orden",
        entidadId: p.orden_id,
        detalle: { pagoId, montoCents: p.monto_cents, motivo },
      },
      ahora,
    ),
  ]);
}
