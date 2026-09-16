import { z } from "zod";
import { nuevoId } from "@/lib/codigos";
import { sentenciaAuditoria } from "@/server/auditoria";
import type { Sesion } from "@/server/auth/sesiones";
import { normalizarTelefono } from "@/server/cuentas/validaciones";
import { ErrorApp, noEncontrado } from "@/server/errores";

export const DIAS_PAPELERA = 30;

export const esquemaPreferencias = z
  .object({
    almidon: z.enum(["ninguno", "ligero", "medio", "fuerte"]).optional(),
    entrega: z.enum(["gancho", "doblado"]).optional(),
    sinBolsa: z.boolean().optional(),
  })
  .strict();

const opcionalTexto = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .transform((v) => (v === "" ? null : v))
    .nullable()
    .optional();

export const esquemaCliente = z.object({
  id: z.uuid().optional(),
  nombre: z.string().trim().min(1).max(60),
  apellido: opcionalTexto(60),
  telefono: opcionalTexto(30),
  correo: z
    .union([z.literal(""), z.email().max(120)])
    .transform((v) => (v === "" ? null : v.toLowerCase()))
    .nullable()
    .optional(),
  idioma: z.enum(["es", "en"]),
  preferencias: esquemaPreferencias.default({}),
  notas: opcionalTexto(500),
  aceptaSms: z.boolean().default(false),
  aceptaCorreo: z.boolean().default(false),
});

export type DatosCliente = z.infer<typeof esquemaCliente>;

export interface ClienteResumen {
  id: string;
  nombre: string;
  apellido: string | null;
  telefono: string | null;
  correo: string | null;
  idioma: "es" | "en";
  ordenesAbiertas: number;
  saldoCents: number;
  eliminadoEn: number | null;
}

export interface ClienteFicha extends ClienteResumen {
  preferencias: z.infer<typeof esquemaPreferencias>;
  notas: string | null;
  aceptaSms: boolean;
  aceptaSmsEn: number | null;
  aceptaCorreo: boolean;
  aceptaCorreoEn: number | null;
  smsBajaEn: number | null;
  creadoEn: number;
  totalGastadoCents: number;
  ordenes: {
    id: string;
    numero: number;
    estado: string;
    totalCents: number;
    pagadoCents: number;
    piezas: number;
    creadaEn: number;
    fechaPromesa: number;
  }[];
}

interface FilaCliente {
  id: string;
  nombre: string;
  apellido: string | null;
  telefono: string | null;
  correo: string | null;
  idioma: "es" | "en";
  abiertas: number;
  saldo: number;
  eliminado_en: number | null;
}

function aResumen(r: FilaCliente): ClienteResumen {
  return {
    id: r.id,
    nombre: r.nombre,
    apellido: r.apellido,
    telefono: r.telefono,
    correo: r.correo,
    idioma: r.idioma,
    ordenesAbiertas: r.abiertas ?? 0,
    saldoCents: r.saldo ?? 0,
    eliminadoEn: r.eliminado_en,
  };
}

const RESUMEN_SQL = `select c.id, c.nombre, c.apellido, c.telefono, c.correo, c.idioma, c.eliminado_en,
    (select count(*) from ordenes o where o.tintoreria_id = c.tintoreria_id and o.cliente_id = c.id and o.estado in ('recibida', 'en_proceso', 'lista')) as abiertas,
    (select coalesce(sum(max(o.total_cents - o.pagado_cents, 0)), 0) from ordenes o where o.tintoreria_id = c.tintoreria_id and o.cliente_id = c.id and o.estado in ('recibida', 'en_proceso', 'lista', 'entregada')) as saldo
  from clientes c`;

export async function buscarClientes(
  db: D1Database,
  tintoreriaId: string,
  consulta: string,
  opciones: { papelera?: boolean; limite?: number } = {},
): Promise<ClienteResumen[]> {
  const q = consulta.trim().slice(0, 60);
  const digitos = q.replace(/\D/g, "");
  const limite = Math.min(50, opciones.limite ?? 25);
  const papelera = opciones.papelera
    ? "c.eliminado_en is not null and c.anonimizado_en is null"
    : "c.eliminado_en is null";
  let r: D1Result<FilaCliente>;
  if (!q) {
    r = await db
      .prepare(
        `${RESUMEN_SQL} where c.tintoreria_id = ? and ${papelera} order by c.actualizado_en desc limit ?`,
      )
      .bind(tintoreriaId, limite)
      .all<FilaCliente>();
  } else if (digitos.length >= 3 && digitos.length >= q.replace(/[\s()+-]/g, "").length) {
    r = await db
      .prepare(
        `${RESUMEN_SQL} where c.tintoreria_id = ? and ${papelera} and c.telefono_digitos like ? order by c.actualizado_en desc limit ?`,
      )
      .bind(tintoreriaId, `%${digitos}%`, limite)
      .all<FilaCliente>();
  } else {
    const patron = `%${q.replace(/[%_]/g, "")}%`;
    r = await db
      .prepare(
        `${RESUMEN_SQL} where c.tintoreria_id = ? and ${papelera}
           and (c.nombre like ? or c.apellido like ? or (c.nombre || ' ' || coalesce(c.apellido, '')) like ? or c.correo like ?)
         order by c.actualizado_en desc limit ?`,
      )
      .bind(tintoreriaId, patron, patron, patron, patron, limite)
      .all<FilaCliente>();
  }
  return r.results.map(aResumen);
}

async function telefonoExistente(db: D1Database, tintoreriaId: string, digitos: string, exceptoId?: string) {
  return db
    .prepare(
      "select id, nombre from clientes where tintoreria_id = ? and telefono_digitos = ? and eliminado_en is null and id != ? limit 1",
    )
    .bind(tintoreriaId, digitos, exceptoId ?? "")
    .first<{ id: string; nombre: string }>();
}

function telefonoDe(texto: string | null | undefined, pais: string) {
  if (!texto) return null;
  const t = normalizarTelefono(texto, pais);
  if (!t) throw new ErrorApp(400, "datos_invalidos", {}, { telefono: "telefono" });
  return t;
}

export async function crearCliente(
  db: D1Database,
  s: Sesion,
  d: DatosCliente,
  ahora = Date.now(),
  opciones: { permitirRepetido?: boolean; origen?: "en_linea" | "sin_conexion" } = {},
): Promise<string> {
  const tel = telefonoDe(d.telefono, s.tintoreria.pais);
  if (tel && !opciones.permitirRepetido) {
    const existe = await telefonoExistente(db, s.tintoreria.id, tel.digitos);
    if (existe)
      throw new ErrorApp(
        409,
        "cliente_repetido",
        { nombre: existe.nombre, clienteId: existe.id },
        { telefono: "cliente_repetido" },
      );
  }
  const id = d.id ?? nuevoId();
  await db.batch([
    db
      .prepare(
        `insert into clientes (id, tintoreria_id, nombre, apellido, telefono, telefono_digitos, correo, idioma, preferencias, notas,
           acepta_sms, acepta_sms_en, acepta_correo, acepta_correo_en, creado_por, creado_en, actualizado_en)
         values (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      )
      .bind(
        id,
        s.tintoreria.id,
        d.nombre,
        d.apellido ?? null,
        tel?.e164 ?? null,
        tel?.digitos ?? null,
        d.correo ?? null,
        d.idioma,
        JSON.stringify(d.preferencias ?? {}),
        d.notas ?? null,
        d.aceptaSms && tel ? 1 : 0,
        d.aceptaSms && tel ? ahora : null,
        d.aceptaCorreo && d.correo ? 1 : 0,
        d.aceptaCorreo && d.correo ? ahora : null,
        s.usuario.id,
        ahora,
        ahora,
      ),
    sentenciaAuditoria(
      db,
      {
        tintoreriaId: s.tintoreria.id,
        usuarioId: s.usuario.id,
        dispositivoId: s.dispositivoId,
        accion: "cliente.creado",
        entidad: "cliente",
        entidadId: id,
        detalle: {
          aceptaSms: Boolean(d.aceptaSms && tel),
          aceptaCorreo: Boolean(d.aceptaCorreo && d.correo),
          origen: opciones.origen ?? "en_linea",
        },
      },
      ahora,
    ),
  ]);
  return id;
}

export async function verCliente(db: D1Database, tintoreriaId: string, id: string): Promise<ClienteFicha> {
  const f = await db
    .prepare(
      `select c.*, 
         (select count(*) from ordenes o where o.tintoreria_id = c.tintoreria_id and o.cliente_id = c.id and o.estado in ('recibida', 'en_proceso', 'lista')) as abiertas,
         (select coalesce(sum(max(o.total_cents - o.pagado_cents, 0)), 0) from ordenes o where o.tintoreria_id = c.tintoreria_id and o.cliente_id = c.id and o.estado in ('recibida', 'en_proceso', 'lista', 'entregada')) as saldo,
         (select coalesce(sum(o.pagado_cents), 0) from ordenes o where o.tintoreria_id = c.tintoreria_id and o.cliente_id = c.id) as gastado
       from clientes c where c.tintoreria_id = ? and c.id = ? and c.anonimizado_en is null`,
    )
    .bind(tintoreriaId, id)
    .first<FilaCliente & Record<string, unknown>>();
  if (!f) throw noEncontrado();
  const { results } = await db
    .prepare(
      `select o.id, o.numero, o.estado, o.total_cents, o.pagado_cents, o.creada_en, o.fecha_promesa,
         (select count(*) from orden_prendas p where p.tintoreria_id = o.tintoreria_id and p.orden_id = o.id) as piezas
       from ordenes o where o.tintoreria_id = ? and o.cliente_id = ? order by o.creada_en desc limit 50`,
    )
    .bind(tintoreriaId, id)
    .all<{
      id: string;
      numero: number;
      estado: string;
      total_cents: number;
      pagado_cents: number;
      creada_en: number;
      fecha_promesa: number;
      piezas: number;
    }>();
  let preferencias = {};
  try {
    preferencias = esquemaPreferencias.parse(JSON.parse(String(f.preferencias ?? "{}")));
  } catch {
    preferencias = {};
  }
  return {
    ...aResumen(f),
    preferencias,
    notas: (f.notas as string | null) ?? null,
    aceptaSms: f.acepta_sms === 1,
    aceptaSmsEn: (f.acepta_sms_en as number | null) ?? null,
    aceptaCorreo: f.acepta_correo === 1,
    aceptaCorreoEn: (f.acepta_correo_en as number | null) ?? null,
    smsBajaEn: (f.sms_baja_en as number | null) ?? null,
    creadoEn: f.creado_en as number,
    totalGastadoCents: (f.gastado as number) ?? 0,
    ordenes: results.map((o) => ({
      id: o.id,
      numero: o.numero,
      estado: o.estado,
      totalCents: o.total_cents,
      pagadoCents: o.pagado_cents,
      piezas: o.piezas,
      creadaEn: o.creada_en,
      fechaPromesa: o.fecha_promesa,
    })),
  };
}

export async function editarCliente(
  db: D1Database,
  s: Sesion,
  id: string,
  d: DatosCliente,
  ahora = Date.now(),
): Promise<void> {
  const actual = await db
    .prepare(
      "select acepta_sms, acepta_correo, sms_baja_en from clientes where tintoreria_id = ? and id = ? and eliminado_en is null",
    )
    .bind(s.tintoreria.id, id)
    .first<{ acepta_sms: number; acepta_correo: number; sms_baja_en: number | null }>();
  if (!actual) throw noEncontrado();
  const tel = telefonoDe(d.telefono, s.tintoreria.pais);
  if (tel) {
    const existe = await telefonoExistente(db, s.tintoreria.id, tel.digitos, id);
    if (existe)
      throw new ErrorApp(
        409,
        "cliente_repetido",
        { nombre: existe.nombre, clienteId: existe.id },
        { telefono: "cliente_repetido" },
      );
  }
  const sms = Boolean(d.aceptaSms && tel);
  const correo = Boolean(d.aceptaCorreo && d.correo);
  await db.batch([
    db
      .prepare(
        `update clientes set nombre = ?, apellido = ?, telefono = ?, telefono_digitos = ?, correo = ?, idioma = ?, preferencias = ?, notas = ?,
           acepta_sms = ?, acepta_sms_en = case when ? = 1 and acepta_sms = 0 then ? when ? = 0 then null else acepta_sms_en end,
           sms_baja_en = case when ? = 1 and acepta_sms = 0 then null else sms_baja_en end,
           acepta_correo = ?, acepta_correo_en = case when ? = 1 and acepta_correo = 0 then ? when ? = 0 then null else acepta_correo_en end,
           actualizado_en = ?
         where tintoreria_id = ? and id = ?`,
      )
      .bind(
        d.nombre,
        d.apellido ?? null,
        tel?.e164 ?? null,
        tel?.digitos ?? null,
        d.correo ?? null,
        d.idioma,
        JSON.stringify(d.preferencias ?? {}),
        d.notas ?? null,
        sms ? 1 : 0,
        sms ? 1 : 0,
        ahora,
        sms ? 1 : 0,
        sms ? 1 : 0,
        correo ? 1 : 0,
        correo ? 1 : 0,
        ahora,
        correo ? 1 : 0,
        ahora,
        s.tintoreria.id,
        id,
      ),
    sentenciaAuditoria(
      db,
      {
        tintoreriaId: s.tintoreria.id,
        usuarioId: s.usuario.id,
        dispositivoId: s.dispositivoId,
        accion: "cliente.editado",
        entidad: "cliente",
        entidadId: id,
        detalle: {
          ...(sms !== (actual.acepta_sms === 1) ? { aceptaSms: sms } : {}),
          ...(correo !== (actual.acepta_correo === 1) ? { aceptaCorreo: correo } : {}),
        },
      },
      ahora,
    ),
  ]);
}

/** Borrar = mandar a la papelera. A los 30 días el reloj borra sus datos personales. */
export async function eliminarCliente(
  db: D1Database,
  s: Sesion,
  id: string,
  ahora = Date.now(),
): Promise<void> {
  const r = await db
    .prepare(
      "update clientes set eliminado_en = ?, actualizado_en = ? where tintoreria_id = ? and id = ? and eliminado_en is null",
    )
    .bind(ahora, ahora, s.tintoreria.id, id)
    .run();
  if (!r.meta.changes) throw noEncontrado();
  await sentenciaAuditoria(
    db,
    {
      tintoreriaId: s.tintoreria.id,
      usuarioId: s.usuario.id,
      dispositivoId: s.dispositivoId,
      accion: "cliente.eliminado",
      entidad: "cliente",
      entidadId: id,
    },
    ahora,
  ).run();
}

export async function restaurarCliente(
  db: D1Database,
  s: Sesion,
  id: string,
  ahora = Date.now(),
): Promise<void> {
  const r = await db
    .prepare(
      "update clientes set eliminado_en = null, actualizado_en = ? where tintoreria_id = ? and id = ? and eliminado_en is not null and anonimizado_en is null",
    )
    .bind(ahora, s.tintoreria.id, id)
    .run();
  if (!r.meta.changes) throw noEncontrado();
  await sentenciaAuditoria(
    db,
    {
      tintoreriaId: s.tintoreria.id,
      usuarioId: s.usuario.id,
      dispositivoId: s.dispositivoId,
      accion: "cliente.restaurado",
      entidad: "cliente",
      entidadId: id,
    },
    ahora,
  ).run();
}

/** Reloj: borra los datos personales de los clientes que llevan 30 días en la papelera. */
export async function anonimizarClientesVencidos(db: D1Database, ahora = Date.now()): Promise<number> {
  const r = await db
    .prepare(
      `update clientes /* sistema: papelera vencida de todas las tintorerías */
       set nombre = '—', apellido = null, telefono = null, telefono_digitos = null, correo = null, notas = null,
           preferencias = '{}', acepta_sms = 0, acepta_sms_en = null, acepta_correo = 0, acepta_correo_en = null,
           anonimizado_en = ?
       where eliminado_en is not null and eliminado_en < ? and anonimizado_en is null`,
    )
    .bind(ahora, ahora - DIAS_PAPELERA * 24 * 3600_000)
    .run();
  return r.meta.changes ?? 0;
}
