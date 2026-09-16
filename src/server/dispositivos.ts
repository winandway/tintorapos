import { nuevoId, sha256Hex, tokenSecreto } from "@/lib/codigos";
import { sentenciaAuditoria } from "@/server/auditoria";
import type { Sesion } from "@/server/auth/sesiones";
import { noEncontrado } from "@/server/errores";

export interface DispositivoVista {
  id: string;
  nombre: string;
  sucursal: string;
  creadoPor: string | null;
  creadoEn: number;
  ultimoUsoEn: number | null;
  revocadoEn: number | null;
}

export async function registrarDispositivo(
  db: D1Database,
  s: Sesion,
  nombre: string,
  agente: string | null,
  ahora = Date.now(),
): Promise<{ id: string; token: string }> {
  const id = nuevoId();
  const token = tokenSecreto();
  await db.batch([
    db
      .prepare(
        `insert into dispositivos (id, tintoreria_id, sucursal_id, nombre, token_hash, agente, creado_por, creado_en, ultimo_uso_en)
         values (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      )
      .bind(
        id,
        s.tintoreria.id,
        s.sucursalId,
        nombre,
        await sha256Hex(token),
        (agente ?? "").slice(0, 200),
        s.usuario.id,
        ahora,
        ahora,
      ),
    sentenciaAuditoria(
      db,
      {
        tintoreriaId: s.tintoreria.id,
        usuarioId: s.usuario.id,
        accion: "dispositivo.registrado",
        entidad: "dispositivo",
        entidadId: id,
      },
      ahora,
    ),
  ]);
  return { id, token };
}

export async function listarDispositivos(db: D1Database, tintoreriaId: string): Promise<DispositivoVista[]> {
  const { results } = await db
    .prepare(
      `select d.id, d.nombre, s.nombre as sucursal, u.nombre as creado_por, d.creado_en, d.ultimo_uso_en, d.revocado_en
       from dispositivos d
       join sucursales s on s.id = d.sucursal_id and s.tintoreria_id = d.tintoreria_id
       left join usuarios u on u.id = d.creado_por and u.tintoreria_id = d.tintoreria_id
       where d.tintoreria_id = ? order by d.revocado_en is not null, d.creado_en desc`,
    )
    .bind(tintoreriaId)
    .all<{
      id: string;
      nombre: string;
      sucursal: string;
      creado_por: string | null;
      creado_en: number;
      ultimo_uso_en: number | null;
      revocado_en: number | null;
    }>();
  return results.map((r) => ({
    id: r.id,
    nombre: r.nombre,
    sucursal: r.sucursal,
    creadoPor: r.creado_por,
    creadoEn: r.creado_en,
    ultimoUsoEn: r.ultimo_uso_en,
    revocadoEn: r.revocado_en,
  }));
}

/** Desactiva un dispositivo (tablet perdida o robada) y cierra en el acto sus sesiones. */
export async function revocarDispositivo(
  db: D1Database,
  s: Sesion,
  id: string,
  ahora = Date.now(),
): Promise<void> {
  const d = await db
    .prepare("select id, revocado_en from dispositivos where id = ? and tintoreria_id = ?")
    .bind(id, s.tintoreria.id)
    .first<{ id: string; revocado_en: number | null }>();
  if (!d) throw noEncontrado();
  if (d.revocado_en) return;
  await db.batch([
    db
      .prepare("update dispositivos set revocado_en = ?, revocado_por = ? where id = ? and tintoreria_id = ?")
      .bind(ahora, s.usuario.id, id, s.tintoreria.id),
    db
      .prepare("delete from sesiones where dispositivo_id = ? and tintoreria_id = ?")
      .bind(id, s.tintoreria.id),
    sentenciaAuditoria(
      db,
      {
        tintoreriaId: s.tintoreria.id,
        usuarioId: s.usuario.id,
        accion: "dispositivo.revocado",
        entidad: "dispositivo",
        entidadId: id,
      },
      ahora,
    ),
  ]);
}

export async function empleadosConPin(db: D1Database, tintoreriaId: string) {
  const { results } = await db
    .prepare(
      `select id, nombre, rol, (pin_bloqueado_hasta is not null and pin_bloqueado_hasta > ?) as bloqueado
       from usuarios where tintoreria_id = ? and activo = 1 and pin_hash is not null
       order by case rol when 'cajero' then 0 when 'planta' then 1 when 'repartidor' then 2 when 'gerente' then 3 else 4 end, nombre`,
    )
    .bind(Date.now(), tintoreriaId)
    .all<{ id: string; nombre: string; rol: string; bloqueado: number }>();
  return results.map((r) => ({ id: r.id, nombre: r.nombre, rol: r.rol, bloqueado: r.bloqueado === 1 }));
}
