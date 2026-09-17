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

/** Un enlace para conectar un celular dura poco y se usa UNA sola vez. */
export const ENLACE_DISPOSITIVO_MIN = 10;

/**
 * Crea el enlace que se muestra como QR en la tablet. El celular lo escanea con
 * su cámara, queda registrado como dispositivo de la tienda y entra con su PIN.
 * El enlace se guarda cifrado (hash): en la base no queda nada que sirva solo.
 */
export async function crearEnlaceDispositivo(
  db: D1Database,
  s: Sesion,
  nombre: string,
  ahora = Date.now(),
): Promise<{ token: string; expiraEn: number }> {
  const token = tokenSecreto();
  const expiraEn = ahora + ENLACE_DISPOSITIVO_MIN * 60_000;
  await db.batch([
    db.prepare("delete from enlaces_dispositivo where expira_en <= ?").bind(ahora),
    db
      .prepare(
        `insert into enlaces_dispositivo (hash, tintoreria_id, sucursal_id, nombre, creado_por, creado_en, expira_en)
         values (?, ?, ?, ?, ?, ?, ?)`,
      )
      .bind(await sha256Hex(token), s.tintoreria.id, s.sucursalId, nombre, s.usuario.id, ahora, expiraEn),
    sentenciaAuditoria(
      db,
      {
        tintoreriaId: s.tintoreria.id,
        usuarioId: s.usuario.id,
        accion: "dispositivo.enlace_creado",
        entidad: "dispositivo",
        detalle: { nombre },
      },
      ahora,
    ),
  ]);
  return { token, expiraEn };
}

/**
 * El celular abre el enlace: si sirve, queda registrado como dispositivo y se
 * devuelve su token para la cookie. Si ya se usó o venció, devuelve null (y no
 * dice cuál de las dos cosas: eso no se le cuenta a quien no debería estar ahí).
 */
export async function usarEnlaceDispositivo(
  db: D1Database,
  token: string,
  agente: string | null,
  ahora = Date.now(),
): Promise<{ tokenDispositivo: string } | null> {
  const hash = await sha256Hex(token);
  const fila = await db
    .prepare(
      `select tintoreria_id, sucursal_id, nombre, creado_por from enlaces_dispositivo
       where hash = ? and usado_en is null and expira_en > ?`,
    )
    .bind(hash, ahora)
    .first<{ tintoreria_id: string; sucursal_id: string; nombre: string; creado_por: string }>();
  if (!fila) return null;
  const id = nuevoId();
  const tokenDispositivo = tokenSecreto();
  // Primero se marca usado (sin el dispositivo, que todavía no existe): así dos
  // teléfonos que abran el mismo enlace a la vez no registran dos dispositivos.
  const r = await db
    .prepare("update enlaces_dispositivo set usado_en = ? where hash = ? and usado_en is null")
    .bind(ahora, hash)
    .run();
  // Si otro lo usó primero, el update no cambia nada: no se registra el dispositivo.
  if ((r.meta.changes ?? 0) === 0) return null;
  await db.batch([
    db
      .prepare(
        `insert into dispositivos (id, tintoreria_id, sucursal_id, nombre, token_hash, agente, creado_por, creado_en, ultimo_uso_en)
         values (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      )
      .bind(
        id,
        fila.tintoreria_id,
        fila.sucursal_id,
        fila.nombre,
        await sha256Hex(tokenDispositivo),
        (agente ?? "").slice(0, 200),
        fila.creado_por,
        ahora,
        ahora,
      ),
    db.prepare("update enlaces_dispositivo set dispositivo_id = ? where hash = ?").bind(id, hash),
    sentenciaAuditoria(
      db,
      {
        tintoreriaId: fila.tintoreria_id,
        usuarioId: fila.creado_por,
        accion: "dispositivo.registrado",
        entidad: "dispositivo",
        entidadId: id,
        detalle: { por: "enlace" },
      },
      ahora,
    ),
  ]);
  return { tokenDispositivo };
}
