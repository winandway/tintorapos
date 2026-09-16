/**
 * Auditoría de solo-agregar. Nunca guarda datos personales: solo identificadores,
 * montos y motivos. La base impide editarla o borrarla (triggers en schema.sql).
 */
import { nuevoId } from "@/lib/codigos";

export interface EntradaAuditoria {
  tintoreriaId: string;
  usuarioId: string | null;
  autorizadoPor?: string | null;
  dispositivoId?: string | null;
  accion: string;
  entidad?: string | null;
  entidadId?: string | null;
  detalle?: Record<string, unknown>;
}

export function sentenciaAuditoria(
  db: D1Database,
  e: EntradaAuditoria,
  ahora = Date.now(),
): D1PreparedStatement {
  return db
    .prepare(
      `insert into auditoria (id, tintoreria_id, usuario_id, autorizado_por, dispositivo_id, accion, entidad, entidad_id, detalle, creado_en)
       values (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    )
    .bind(
      nuevoId(),
      e.tintoreriaId,
      e.usuarioId,
      e.autorizadoPor ?? null,
      e.dispositivoId ?? null,
      e.accion,
      e.entidad ?? null,
      e.entidadId ?? null,
      JSON.stringify(e.detalle ?? {}),
      ahora,
    );
}

export async function auditar(db: D1Database, e: EntradaAuditoria): Promise<void> {
  await sentenciaAuditoria(db, e).run();
}

export interface FilaAuditoria {
  id: string;
  usuario_id: string | null;
  usuario_nombre: string | null;
  autorizado_por: string | null;
  autorizador_nombre: string | null;
  dispositivo_id: string | null;
  accion: string;
  entidad: string | null;
  entidad_id: string | null;
  detalle: string;
  creado_en: number;
}

export async function listarAuditoria(
  db: D1Database,
  tintoreriaId: string,
  opciones: { antesDe?: number; limite?: number; accion?: string } = {},
): Promise<FilaAuditoria[]> {
  const { results } = await db
    .prepare(
      `select a.id, a.usuario_id, u.nombre as usuario_nombre, a.autorizado_por, g.nombre as autorizador_nombre,
         a.dispositivo_id, a.accion, a.entidad, a.entidad_id, a.detalle, a.creado_en
       from auditoria a
       left join usuarios u on u.id = a.usuario_id and u.tintoreria_id = a.tintoreria_id
       left join usuarios g on g.id = a.autorizado_por and g.tintoreria_id = a.tintoreria_id
       where a.tintoreria_id = ? and a.creado_en < ? and (? = '' or a.accion = ?)
       order by a.creado_en desc limit ?`,
    )
    .bind(
      tintoreriaId,
      opciones.antesDe ?? Number.MAX_SAFE_INTEGER,
      opciones.accion ?? "",
      opciones.accion ?? "",
      Math.min(200, opciones.limite ?? 50),
    )
    .all<FilaAuditoria>();
  return results;
}
