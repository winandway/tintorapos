/**
 * Fábrica de datos para pruebas: crea tintorerías, usuarios, sesiones y
 * dispositivos directamente en la base local de pruebas.
 */
import { nuevoId, sha256Hex, tokenSecreto } from "@/lib/codigos";
import { hashClave } from "@/server/auth/claves";
import { crearSesion } from "@/server/auth/sesiones";
import type { Rol } from "@/server/permisos";

export interface TintoreriaPrueba {
  id: string;
  sucursalId: string;
  duenoId: string;
}

export async function crearTintoreria(
  db: D1Database,
  nombre = "Tintorería de prueba",
): Promise<TintoreriaPrueba> {
  const ahora = Date.now();
  const id = nuevoId();
  const sucursalId = nuevoId();
  const duenoId = nuevoId();
  await db.batch([
    db
      .prepare(
        "insert into tintorerias (id, nombre, zona_horaria, impuesto_bps, creada_en, actualizada_en) values (?, ?, 'America/New_York', 825, ?, ?)",
      )
      .bind(id, nombre, ahora, ahora),
    db
      .prepare("insert into sucursales (id, tintoreria_id, nombre, creada_en) values (?, ?, 'Principal', ?)")
      .bind(sucursalId, id, ahora),
    db
      .prepare(
        "insert into usuarios (id, tintoreria_id, nombre, rol, correo, creado_en, actualizado_en) values (?, ?, 'Dueño', 'dueno', ?, ?, ?)",
      )
      .bind(duenoId, id, `dueno-${id.slice(0, 8)}@ejemplo.com`, ahora, ahora),
  ]);
  return { id, sucursalId, duenoId };
}

export async function crearUsuario(
  db: D1Database,
  tintoreriaId: string,
  rol: Rol,
  opciones: { pin?: string; clave?: string; correo?: string; nombre?: string } = {},
): Promise<string> {
  const ahora = Date.now();
  const id = nuevoId();
  await db
    .prepare(
      "insert into usuarios (id, tintoreria_id, nombre, rol, correo, clave_hash, pin_hash, creado_en, actualizado_en) values (?, ?, ?, ?, ?, ?, ?, ?, ?)",
    )
    .bind(
      id,
      tintoreriaId,
      opciones.nombre ?? `Empleado ${rol}`,
      rol,
      opciones.correo ?? null,
      opciones.clave ? await hashClave(opciones.clave) : null,
      opciones.pin ? await hashClave(opciones.pin) : null,
      ahora,
      ahora,
    )
    .run();
  return id;
}

export async function sesionPara(
  db: D1Database,
  tintoreriaId: string,
  usuarioId: string,
  opciones: { tipo?: "cuenta" | "pin"; dosPasos?: boolean; dispositivoId?: string } = {},
): Promise<string> {
  return crearSesion(db, {
    tintoreriaId,
    usuarioId,
    tipo: opciones.tipo ?? "cuenta",
    segundoFactorOk: opciones.dosPasos ?? true,
    dispositivoId: opciones.dispositivoId ?? null,
  });
}

export async function crearDispositivo(
  db: D1Database,
  t: TintoreriaPrueba,
): Promise<{ id: string; token: string }> {
  const token = tokenSecreto();
  const id = nuevoId();
  await db
    .prepare(
      "insert into dispositivos (id, tintoreria_id, sucursal_id, nombre, token_hash, creado_por, creado_en) values (?, ?, ?, 'Mostrador', ?, ?, ?)",
    )
    .bind(id, t.id, t.sucursalId, await sha256Hex(token), t.duenoId, Date.now())
    .run();
  return { id, token };
}
