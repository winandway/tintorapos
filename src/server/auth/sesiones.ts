/**
 * Sesiones guardadas en el SERVIDOR. La cookie solo lleva un token aleatorio de
 * 256 bits; en la base se guarda su SHA-256. Cerrar sesión borra la fila: la
 * cookie robada deja de servir en el acto.
 */
import { sha256Hex, tokenSecreto } from "@/lib/codigos";
import type { Idioma } from "@/lib/i18n/idiomas";
import { esPermiso, type Permiso, type Rol } from "@/server/permisos";

export const DURACION = {
  cuentaMax: 7 * 24 * 3600_000,
  cuentaInactividad: 24 * 3600_000,
  pinMax: 14 * 3600_000,
  pinInactividad: 2 * 3600_000,
  pendienteDosPasos: 15 * 60_000,
  dispositivo: 400 * 24 * 3600_000,
} as const;

export interface TintoreriaSesion {
  id: string;
  nombre: string;
  zonaHoraria: string;
  moneda: string;
  idioma: Idioma;
  pais: string;
  impuestoBps: number;
  recargoUrgenteBps: number;
  descuentoMaxBps: number;
  diasEntrega: number;
  bloqueoInactividadMin: number;
  plan: string;
  pruebaHasta: number | null;
  estado: "activa" | "suspendida";
}

export interface UsuarioSesion {
  id: string;
  nombre: string;
  rol: Rol;
  correo: string | null;
  totpActivo: boolean;
  debeCambiarClave: boolean;
  /** Palomitas a la medida de esta persona. Si es null, mandan las de su rol. */
  permisos: Permiso[] | null;
}

export interface Sesion {
  idHash: string;
  tipo: "cuenta" | "pin";
  segundoFactorOk: boolean;
  dispositivoId: string | null;
  sucursalId: string;
  usuario: UsuarioSesion;
  tintoreria: TintoreriaSesion;
}

/** El dueño SIEMPRE necesita dos pasos; los demás, si lo activaron. */
export function necesitaDosPasos(s: Pick<Sesion, "tipo" | "usuario">): boolean {
  return s.tipo === "cuenta" && (s.usuario.rol === "dueno" || s.usuario.totpActivo);
}

/** El JSON de la tabla, filtrado al catálogo: si trae basura, se ignora. */
function leerPermisos(texto: string | null): Permiso[] | null {
  if (!texto) return null;
  try {
    const lista = JSON.parse(texto) as unknown;
    if (!Array.isArray(lista)) return null;
    return lista.filter(esPermiso);
  } catch {
    return null;
  }
}

export async function crearSesion(
  db: D1Database,
  datos: {
    tintoreriaId: string;
    usuarioId: string;
    tipo: "cuenta" | "pin";
    dispositivoId?: string | null;
    segundoFactorOk: boolean;
    agente?: string | null;
  },
  ahora = Date.now(),
): Promise<string> {
  const token = tokenSecreto();
  const max = datos.tipo === "pin" ? DURACION.pinMax : DURACION.cuentaMax;
  await db
    .prepare(
      `insert into sesiones (id_hash, tintoreria_id, usuario_id, dispositivo_id, tipo, segundo_factor_ok,
         creada_en, ultima_actividad_en, expira_en, agente)
       values (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    )
    .bind(
      await sha256Hex(token),
      datos.tintoreriaId,
      datos.usuarioId,
      datos.dispositivoId ?? null,
      datos.tipo,
      datos.segundoFactorOk ? 1 : 0,
      ahora,
      ahora,
      ahora + max,
      (datos.agente ?? "").slice(0, 200) || null,
    )
    .run();
  return token;
}

interface FilaSesion {
  id_hash: string;
  tipo: "cuenta" | "pin";
  segundo_factor_ok: number;
  dispositivo_id: string | null;
  creada_en: number;
  ultima_actividad_en: number;
  expira_en: number;
  u_id: string;
  u_nombre: string;
  u_rol: Rol;
  u_correo: string | null;
  u_totp: number;
  u_cambiar: number;
  u_activo: number;
  u_permisos: string | null;
  t_id: string;
  t_nombre: string;
  t_zona: string;
  t_moneda: string;
  t_idioma: Idioma;
  t_pais: string;
  t_impuesto: number;
  t_recargo: number;
  t_descuento: number;
  t_dias: number;
  t_bloqueo: number;
  t_plan: string;
  t_prueba: number | null;
  t_estado: "activa" | "suspendida";
  d_revocado: number | null;
  d_sucursal: string | null;
  sucursal_principal: string | null;
}

export async function leerSesion(
  db: D1Database,
  token: string | undefined,
  ahora = Date.now(),
): Promise<Sesion | null> {
  if (!token || token.length < 20 || token.length > 100) return null;
  const idHash = await sha256Hex(token);
  const f = await db
    .prepare(
      `select s.id_hash, s.tipo, s.segundo_factor_ok, s.dispositivo_id, s.creada_en, s.ultima_actividad_en, s.expira_en,
         u.id as u_id, u.nombre as u_nombre, u.rol as u_rol, u.correo as u_correo, u.totp_activo as u_totp,
         u.debe_cambiar_clave as u_cambiar, u.activo as u_activo,
         t.id as t_id, t.nombre as t_nombre, t.zona_horaria as t_zona, t.moneda as t_moneda, t.idioma as t_idioma,
         t.pais as t_pais, t.impuesto_bps as t_impuesto, t.recargo_urgente_bps as t_recargo,
         t.descuento_max_bps as t_descuento, t.dias_entrega as t_dias, t.bloqueo_inactividad_min as t_bloqueo,
         t.plan as t_plan, t.prueba_hasta as t_prueba, t.estado as t_estado,
         d.revocado_en as d_revocado, d.sucursal_id as d_sucursal, pu.permisos as u_permisos,
         (select id from sucursales where tintoreria_id = s.tintoreria_id and activa = 1 order by creada_en limit 1) as sucursal_principal
       from sesiones s
       join usuarios u on u.id = s.usuario_id and u.tintoreria_id = s.tintoreria_id
       join tintorerias t on t.id = s.tintoreria_id
       left join dispositivos d on d.id = s.dispositivo_id and d.tintoreria_id = s.tintoreria_id
       left join permisos_usuario pu on pu.usuario_id = u.id and pu.tintoreria_id = s.tintoreria_id
       where s.id_hash = ?`,
    )
    .bind(idHash)
    .first<FilaSesion>();
  if (!f) return null;

  const inactividad = f.tipo === "pin" ? DURACION.pinInactividad : DURACION.cuentaInactividad;
  const pendiente = f.segundo_factor_ok === 0 && ahora - f.creada_en > DURACION.pendienteDosPasos;
  const revocado = f.dispositivo_id !== null && (f.d_revocado !== null || f.d_sucursal === null);
  if (
    ahora >= f.expira_en ||
    ahora - f.ultima_actividad_en > inactividad ||
    !f.u_activo ||
    revocado ||
    pendiente
  ) {
    await db
      .prepare("delete from sesiones /* token secreto: sesión vencida */ where id_hash = ?")
      .bind(idHash)
      .run();
    return null;
  }
  if (ahora - f.ultima_actividad_en > 60_000) {
    await db
      .prepare("update sesiones /* token secreto: actividad */ set ultima_actividad_en = ? where id_hash = ?")
      .bind(ahora, idHash)
      .run();
  }
  return {
    idHash,
    tipo: f.tipo,
    segundoFactorOk: f.segundo_factor_ok === 1,
    dispositivoId: f.dispositivo_id,
    sucursalId: f.d_sucursal ?? f.sucursal_principal ?? "",
    usuario: {
      id: f.u_id,
      nombre: f.u_nombre,
      rol: f.u_rol,
      correo: f.u_correo,
      totpActivo: f.u_totp === 1,
      debeCambiarClave: f.u_cambiar === 1,
      permisos: leerPermisos(f.u_permisos),
    },
    tintoreria: {
      id: f.t_id,
      nombre: f.t_nombre,
      zonaHoraria: f.t_zona,
      moneda: f.t_moneda,
      idioma: f.t_idioma,
      pais: f.t_pais,
      impuestoBps: f.t_impuesto,
      recargoUrgenteBps: f.t_recargo,
      descuentoMaxBps: f.t_descuento,
      diasEntrega: f.t_dias,
      bloqueoInactividadMin: f.t_bloqueo,
      plan: f.t_plan,
      pruebaHasta: f.t_prueba,
      estado: f.t_estado,
    },
  };
}

export async function marcarDosPasosOk(db: D1Database, s: Sesion): Promise<void> {
  await db
    .prepare("update sesiones set segundo_factor_ok = 1 where id_hash = ? and tintoreria_id = ?")
    .bind(s.idHash, s.tintoreria.id)
    .run();
}

export async function cerrarSesion(db: D1Database, token: string | undefined): Promise<void> {
  if (!token) return;
  await db
    .prepare("delete from sesiones /* token secreto: cerrar sesión */ where id_hash = ?")
    .bind(await sha256Hex(token))
    .run();
}

/** Cierra todas las sesiones de un usuario (al cambiar la clave o desactivarlo). */
export async function cerrarSesionesUsuario(
  db: D1Database,
  tintoreriaId: string,
  usuarioId: string,
  exceptoIdHash?: string,
): Promise<void> {
  await db
    .prepare("delete from sesiones where tintoreria_id = ? and usuario_id = ? and id_hash != ?")
    .bind(tintoreriaId, usuarioId, exceptoIdHash ?? "")
    .run();
}

export async function limpiarSesionesVencidas(db: D1Database, ahora = Date.now()): Promise<number> {
  const r = await db
    .prepare("delete from sesiones /* sistema: todas las tintorerías */ where expira_en <= ?")
    .bind(ahora)
    .run();
  return r.meta.changes ?? 0;
}

export interface DispositivoLeido {
  id: string;
  tintoreriaId: string;
  sucursalId: string;
  nombre: string;
  tintoreriaNombre: string;
  bloqueoInactividadMin: number;
}

export async function leerDispositivo(
  db: D1Database,
  token: string | undefined,
  ahora = Date.now(),
): Promise<DispositivoLeido | null> {
  if (!token || token.length < 20 || token.length > 100) return null;
  const f = await db
    .prepare(
      `select d.id, d.tintoreria_id, d.sucursal_id, d.nombre, d.ultimo_uso_en, t.nombre as t_nombre,
         t.bloqueo_inactividad_min as t_bloqueo
       from dispositivos d join tintorerias t on t.id = d.tintoreria_id
       where d.token_hash = ? and d.revocado_en is null`,
    )
    .bind(await sha256Hex(token))
    .first<{
      id: string;
      tintoreria_id: string;
      sucursal_id: string;
      nombre: string;
      ultimo_uso_en: number | null;
      t_nombre: string;
      t_bloqueo: number;
    }>();
  if (!f) return null;
  if (!f.ultimo_uso_en || ahora - f.ultimo_uso_en > 3600_000) {
    await db
      .prepare("update dispositivos set ultimo_uso_en = ? where id = ? and tintoreria_id = ?")
      .bind(ahora, f.id, f.tintoreria_id)
      .run();
  }
  return {
    id: f.id,
    tintoreriaId: f.tintoreria_id,
    sucursalId: f.sucursal_id,
    nombre: f.nombre,
    tintoreriaNombre: f.t_nombre,
    bloqueoInactividadMin: f.t_bloqueo,
  };
}
