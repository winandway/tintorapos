/**
 * PIN de empleados y autorización de gerente.
 * - 5 PIN equivocados seguidos bloquean a ese usuario 15 minutos.
 * - Lo que un cajero no puede hacer (anular, descuento grande, reimprimir…) lo
 *   autoriza un gerente o el dueño con SU PIN, y queda su nombre en la auditoría.
 */
import { ErrorApp } from "@/server/errores";
import { puedeAutorizar, tienePermiso, type Permiso, type Rol } from "@/server/permisos";
import { verificarClave } from "./claves";
import type { Sesion } from "./sesiones";

export const PIN_MAX_INTENTOS = 5;
export const PIN_BLOQUEO_MS = 15 * 60_000;

export interface Autorizacion {
  usuarioId: string;
  pin: string;
}

interface FilaPin {
  id: string;
  rol: Rol;
  pin_hash: string | null;
  pin_intentos: number;
  pin_bloqueado_hasta: number | null;
  activo: number;
}

export type ResultadoPin =
  | { ok: true; rol: Rol }
  | { ok: false; motivo: "incorrecto"; restantes: number }
  | { ok: false; motivo: "bloqueado"; minutos: number }
  | { ok: false; motivo: "no_existe" };

export async function verificarPinUsuario(
  db: D1Database,
  tintoreriaId: string,
  usuarioId: string,
  pin: string,
  ahora = Date.now(),
): Promise<ResultadoPin> {
  const u = await db
    .prepare(
      "select id, rol, pin_hash, pin_intentos, pin_bloqueado_hasta, activo from usuarios where id = ? and tintoreria_id = ?",
    )
    .bind(usuarioId, tintoreriaId)
    .first<FilaPin>();
  if (!u || !u.activo || !u.pin_hash) {
    await verificarClave(pin, null);
    return { ok: false, motivo: "no_existe" };
  }
  if (u.pin_bloqueado_hasta && u.pin_bloqueado_hasta > ahora) {
    return { ok: false, motivo: "bloqueado", minutos: Math.ceil((u.pin_bloqueado_hasta - ahora) / 60_000) };
  }
  if (await verificarClave(pin, u.pin_hash)) {
    if (u.pin_intentos > 0 || u.pin_bloqueado_hasta) {
      await db
        .prepare(
          "update usuarios set pin_intentos = 0, pin_bloqueado_hasta = null where id = ? and tintoreria_id = ?",
        )
        .bind(u.id, tintoreriaId)
        .run();
    }
    return { ok: true, rol: u.rol };
  }
  const intentos = (u.pin_bloqueado_hasta && u.pin_bloqueado_hasta <= ahora ? 0 : u.pin_intentos) + 1;
  const bloquear = intentos >= PIN_MAX_INTENTOS;
  await db
    .prepare(
      "update usuarios set pin_intentos = ?, pin_bloqueado_hasta = ? where id = ? and tintoreria_id = ?",
    )
    .bind(bloquear ? 0 : intentos, bloquear ? ahora + PIN_BLOQUEO_MS : null, u.id, tintoreriaId)
    .run();
  if (bloquear) return { ok: false, motivo: "bloqueado", minutos: Math.ceil(PIN_BLOQUEO_MS / 60_000) };
  return { ok: false, motivo: "incorrecto", restantes: PIN_MAX_INTENTOS - intentos };
}

/**
 * Devuelve quién autorizó (null si el propio usuario ya tiene el permiso).
 * Lanza «requiere_autorizacion» si hace falta un PIN de gerente y no vino.
 */
export async function resolverAutorizacion(
  db: D1Database,
  sesion: Sesion,
  permiso: Permiso,
  autorizacion: Autorizacion | null | undefined,
  ahora = Date.now(),
): Promise<string | null> {
  if (tienePermiso(sesion.usuario.rol, permiso)) return null;
  if (!autorizacion) throw new ErrorApp(403, "requiere_autorizacion", { permiso });
  const r = await verificarPinUsuario(
    db,
    sesion.tintoreria.id,
    autorizacion.usuarioId,
    autorizacion.pin,
    ahora,
  );
  if (!r.ok && r.motivo === "bloqueado") throw new ErrorApp(429, "pin_bloqueado", { minutos: r.minutos });
  if (!r.ok || !puedeAutorizar(r.rol, permiso)) throw new ErrorApp(403, "autorizacion_invalida");
  return autorizacion.usuarioId;
}
