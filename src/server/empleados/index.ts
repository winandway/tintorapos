import { z } from "zod";
import { nuevoId } from "@/lib/codigos";
import { sentenciaAuditoria } from "@/server/auditoria";
import { hashClave, pinAceptable } from "@/server/auth/claves";
import { cerrarSesionesUsuario, type Sesion } from "@/server/auth/sesiones";
import { correoEnUso } from "@/server/cuentas/registro";
import { esquemaCorreo, exigirClave, exigirNombreSoporte } from "@/server/cuentas/validaciones";
import { ErrorApp, noEncontrado, sinPermiso } from "@/server/errores";
import { permisosAGuardar, puedeGestionarRol, ROLES, type Rol } from "@/server/permisos";

export interface Empleado {
  id: string;
  nombre: string;
  rol: Rol;
  /** Palomitas a la medida (null = las de su rol). */
  permisos: string[] | null;
  correo: string | null;
  tienePin: boolean;
  totpActivo: boolean;
  activo: boolean;
  ultimoIngresoEn: number | null;
  bloqueadoHasta: number | null;
}

function leerLista(texto: string | null): string[] | null {
  if (!texto) return null;
  try {
    const lista = JSON.parse(texto) as unknown;
    return Array.isArray(lista) ? lista.filter((x): x is string => typeof x === "string") : null;
  } catch {
    return null;
  }
}

export async function listarEmpleados(db: D1Database, tintoreriaId: string): Promise<Empleado[]> {
  const { results } = await db
    .prepare(
      `select u.id, u.nombre, u.rol, u.correo, u.pin_hash is not null as tiene_pin, u.totp_activo, u.activo,
         u.ultimo_ingreso_en, u.pin_bloqueado_hasta, p.permisos
       from usuarios u
       left join permisos_usuario p on p.usuario_id = u.id and p.tintoreria_id = u.tintoreria_id
       where u.tintoreria_id = ?
       order by u.activo desc, case u.rol when 'dueno' then 0 when 'gerente' then 1 when 'cajero' then 2 when 'planta' then 3 else 4 end, u.nombre`,
    )
    .bind(tintoreriaId)
    .all<{
      id: string;
      nombre: string;
      rol: Rol;
      correo: string | null;
      tiene_pin: number;
      totp_activo: number;
      activo: number;
      ultimo_ingreso_en: number | null;
      pin_bloqueado_hasta: number | null;
      permisos: string | null;
    }>();
  return results.map((r) => ({
    id: r.id,
    nombre: r.nombre,
    rol: r.rol,
    correo: r.correo,
    tienePin: r.tiene_pin === 1,
    totpActivo: r.totp_activo === 1,
    activo: r.activo === 1,
    permisos: leerLista(r.permisos),
    ultimoIngresoEn: r.ultimo_ingreso_en,
    bloqueadoHasta:
      r.pin_bloqueado_hasta && r.pin_bloqueado_hasta > Date.now() ? r.pin_bloqueado_hasta : null,
  }));
}

const opcional = <T extends z.ZodType>(t: T) => t.optional();

export const esquemaEmpleado = z.object({
  nombre: z.string().trim().min(1).max(60),
  rol: z.enum(ROLES),
  pin: opcional(z.string().regex(/^\d{4,6}$/, "pin_debil")),
  correo: opcional(z.union([z.literal(""), esquemaCorreo])),
  claveTemporal: opcional(z.string().max(200)),
  /** Palomitas a la medida. null (o sin mandar) = los permisos de su rol. */
  permisos: z.array(z.string().max(40)).max(60).nullable().optional(),
});

export type DatosEmpleado = z.infer<typeof esquemaEmpleado>;

function validar(actor: Sesion, d: DatosEmpleado, correoFinal: string | null) {
  if (!puedeGestionarRol(actor.usuario.rol, d.rol)) throw sinPermiso();
  if (d.pin !== undefined && !pinAceptable(d.pin))
    throw new ErrorApp(400, "pin_debil", {}, { pin: "pin_debil" });
  exigirNombreSoporte(d.nombre, correoFinal);
  if (correoFinal && d.rol !== "dueno" && d.rol !== "gerente") {
    // Solo dueños y gerentes entran con correo; el resto entra con PIN en la tablet.
    throw new ErrorApp(400, "datos_invalidos", {}, { correo: "invalido" });
  }
}

export async function crearEmpleado(
  db: D1Database,
  s: Sesion,
  d: DatosEmpleado,
  ahora = Date.now(),
): Promise<string> {
  const correo = d.correo ? d.correo : null;
  validar(s, d, correo);
  if (correo && (await correoEnUso(db, correo)))
    throw new ErrorApp(409, "correo_en_uso", {}, { correo: "correo_en_uso" });
  if (correo) {
    if (!d.claveTemporal) throw new ErrorApp(400, "datos_invalidos", {}, { claveTemporal: "requerido" });
    exigirClave(d.claveTemporal, correo);
  }
  if (!correo && !d.pin) throw new ErrorApp(400, "datos_invalidos", {}, { pin: "requerido" });
  const id = nuevoId();
  await db.batch([
    db
      .prepare(
        `insert into usuarios (id, tintoreria_id, nombre, rol, correo, clave_hash, debe_cambiar_clave, pin_hash, creado_en, actualizado_en)
         values (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      )
      .bind(
        id,
        s.tintoreria.id,
        d.nombre,
        d.rol,
        correo,
        correo && d.claveTemporal ? await hashClave(d.claveTemporal) : null,
        correo ? 1 : 0,
        d.pin ? await hashClave(d.pin) : null,
        ahora,
        ahora,
      ),
    ...sentenciasPermisos(db, s, id, d, ahora),
    sentenciaAuditoria(
      db,
      {
        tintoreriaId: s.tintoreria.id,
        usuarioId: s.usuario.id,
        dispositivoId: s.dispositivoId,
        accion: "empleado.creado",
        entidad: "usuario",
        entidadId: id,
        detalle: { rol: d.rol },
      },
      ahora,
    ),
  ]);
  return id;
}

/**
 * Las palomitas del empleado. Se recortan a lo que puede dar quien edita (nadie
 * reparte lo que no tiene) y, si quedan exactamente las del rol, no se guarda
 * nada: manda el rol.
 */
function sentenciasPermisos(
  db: D1Database,
  s: Sesion,
  usuarioId: string,
  d: DatosEmpleado,
  ahora: number,
): D1PreparedStatement[] {
  if (d.permisos === undefined) return [];
  const lista = permisosAGuardar(s.usuario, d.rol, d.permisos);
  if (!lista)
    return [
      db
        .prepare("delete from permisos_usuario where usuario_id = ? and tintoreria_id = ?")
        .bind(usuarioId, s.tintoreria.id),
    ];
  return [
    db
      .prepare(
        `insert into permisos_usuario (usuario_id, tintoreria_id, permisos, actualizado_en, actualizado_por)
         values (?, ?, ?, ?, ?)
         on conflict (usuario_id) do update set permisos = excluded.permisos,
           actualizado_en = excluded.actualizado_en, actualizado_por = excluded.actualizado_por`,
      )
      .bind(usuarioId, s.tintoreria.id, JSON.stringify(lista), ahora, s.usuario.id),
  ];
}

async function leer(db: D1Database, tintoreriaId: string, id: string) {
  const u = await db
    .prepare("select id, rol, correo, activo from usuarios where id = ? and tintoreria_id = ?")
    .bind(id, tintoreriaId)
    .first<{ id: string; rol: Rol; correo: string | null; activo: number }>();
  if (!u) throw noEncontrado();
  return u;
}

async function duenosActivos(db: D1Database, tintoreriaId: string) {
  return (
    (
      await db
        .prepare(
          "select count(*) as n from usuarios where tintoreria_id = ? and rol = 'dueno' and activo = 1",
        )
        .bind(tintoreriaId)
        .first<{ n: number }>()
    )?.n ?? 0
  );
}

export async function editarEmpleado(
  db: D1Database,
  s: Sesion,
  id: string,
  d: DatosEmpleado,
  ahora = Date.now(),
): Promise<void> {
  const u = await leer(db, s.tintoreria.id, id);
  if (!puedeGestionarRol(s.usuario.rol, u.rol)) throw sinPermiso();
  const correo = d.correo === undefined ? u.correo : d.correo || null;
  validar(s, d, correo);
  if (u.rol === "dueno" && d.rol !== "dueno" && u.activo && (await duenosActivos(db, s.tintoreria.id)) <= 1) {
    throw new ErrorApp(409, "ultimo_dueno");
  }
  if (correo && correo !== u.correo && (await correoEnUso(db, correo))) {
    throw new ErrorApp(409, "correo_en_uso", {}, { correo: "correo_en_uso" });
  }
  if (d.claveTemporal) exigirClave(d.claveTemporal, correo ?? undefined);
  if (correo && !u.correo && !d.claveTemporal)
    throw new ErrorApp(400, "datos_invalidos", {}, { claveTemporal: "requerido" });

  const sentencias: D1PreparedStatement[] = [
    db
      .prepare(
        "update usuarios set nombre = ?, rol = ?, correo = ?, actualizado_en = ? where id = ? and tintoreria_id = ?",
      )
      .bind(d.nombre, d.rol, correo, ahora, id, s.tintoreria.id),
  ];
  if (!correo) {
    sentencias.push(
      db
        .prepare(
          "update usuarios set clave_hash = null, debe_cambiar_clave = 0 where id = ? and tintoreria_id = ?",
        )
        .bind(id, s.tintoreria.id),
    );
  }
  if (d.pin) {
    sentencias.push(
      db
        .prepare(
          "update usuarios set pin_hash = ?, pin_intentos = 0, pin_bloqueado_hasta = null where id = ? and tintoreria_id = ?",
        )
        .bind(await hashClave(d.pin), id, s.tintoreria.id),
    );
  }
  if (d.claveTemporal && correo) {
    sentencias.push(
      db
        .prepare(
          "update usuarios set clave_hash = ?, debe_cambiar_clave = 1 where id = ? and tintoreria_id = ?",
        )
        .bind(await hashClave(d.claveTemporal), id, s.tintoreria.id),
    );
  }
  sentencias.push(...sentenciasPermisos(db, s, id, d, ahora));
  sentencias.push(
    sentenciaAuditoria(
      db,
      {
        tintoreriaId: s.tintoreria.id,
        usuarioId: s.usuario.id,
        dispositivoId: s.dispositivoId,
        accion: "empleado.editado",
        entidad: "usuario",
        entidadId: id,
        detalle: {
          rolAntes: u.rol,
          rolDespues: d.rol,
          pinCambiado: Boolean(d.pin),
          claveCambiada: Boolean(d.claveTemporal),
        },
      },
      ahora,
    ),
  );
  await db.batch(sentencias);
  if (d.claveTemporal || d.rol !== u.rol || correo !== u.correo) {
    await cerrarSesionesUsuario(db, s.tintoreria.id, id, id === s.usuario.id ? s.idHash : undefined);
  }
}

export async function cambiarEstadoEmpleado(
  db: D1Database,
  s: Sesion,
  id: string,
  activo: boolean,
  ahora = Date.now(),
): Promise<void> {
  const u = await leer(db, s.tintoreria.id, id);
  if (!puedeGestionarRol(s.usuario.rol, u.rol)) throw sinPermiso();
  if (!activo && id === s.usuario.id) throw new ErrorApp(409, "no_aplica");
  if (!activo && u.rol === "dueno" && (await duenosActivos(db, s.tintoreria.id)) <= 1)
    throw new ErrorApp(409, "ultimo_dueno");
  await db.batch([
    db
      .prepare("update usuarios set activo = ?, actualizado_en = ? where id = ? and tintoreria_id = ?")
      .bind(activo ? 1 : 0, ahora, id, s.tintoreria.id),
    sentenciaAuditoria(
      db,
      {
        tintoreriaId: s.tintoreria.id,
        usuarioId: s.usuario.id,
        dispositivoId: s.dispositivoId,
        accion: activo ? "empleado.activado" : "empleado.desactivado",
        entidad: "usuario",
        entidadId: id,
      },
      ahora,
    ),
  ]);
  if (!activo) await cerrarSesionesUsuario(db, s.tintoreria.id, id);
}
