import { z } from "zod";
import { zonaValida } from "@/lib/fechas";
import { sentenciaAuditoria } from "@/server/auditoria";
import type { Sesion } from "@/server/auth/sesiones";
import { esquemaMoneda } from "@/server/cuentas/validaciones";

const textoOpcional = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .transform((v) => (v === "" ? null : v))
    .nullable()
    .optional();

export const esquemaTienda = z.object({
  nombre: z.string().trim().min(2).max(80),
  telefono: textoOpcional(30),
  correo: z
    .union([z.literal(""), z.email().max(120)])
    .transform((v) => (v === "" ? null : v))
    .nullable()
    .optional(),
  direccion: textoOpcional(160),
  ciudad: textoOpcional(80),
  estadoRegion: textoOpcional(80),
  codigoPostal: textoOpcional(20),
  pais: z
    .string()
    .trim()
    .toUpperCase()
    .regex(/^[A-Z]{2}$/),
  zonaHoraria: z.string().max(64).refine(zonaValida, "zona"),
  moneda: esquemaMoneda,
  idioma: z.enum(["es", "en"]),
  impuestoBps: z.number().int().min(0).max(5000),
  recargoUrgenteBps: z.number().int().min(0).max(20000),
  descuentoMaxBps: z.number().int().min(0).max(10000),
  diasEntrega: z.number().int().min(0).max(60),
  diasRecordatorio: z.number().int().min(1).max(60),
  maxRecordatorios: z.number().int().min(0).max(10),
  diasAbandono: z.number().int().min(7).max(365),
  bloqueoInactividadMin: z.number().int().min(1).max(240),
});

export type DatosTienda = z.infer<typeof esquemaTienda>;

interface FilaTienda {
  nombre: string;
  telefono: string | null;
  correo: string | null;
  direccion: string | null;
  ciudad: string | null;
  estado_region: string | null;
  codigo_postal: string | null;
  pais: string;
  zona_horaria: string;
  moneda: string;
  idioma: "es" | "en";
  impuesto_bps: number;
  recargo_urgente_bps: number;
  descuento_max_bps: number;
  dias_entrega: number;
  dias_recordatorio: number;
  max_recordatorios: number;
  dias_abandono: number;
  bloqueo_inactividad_min: number;
}

export async function leerTienda(db: D1Database, tintoreriaId: string): Promise<DatosTienda> {
  const f = await db
    .prepare(
      `select nombre, telefono, correo, direccion, ciudad, estado_region, codigo_postal, pais, zona_horaria, moneda, idioma,
         impuesto_bps, recargo_urgente_bps, descuento_max_bps, dias_entrega, dias_recordatorio, max_recordatorios,
         dias_abandono, bloqueo_inactividad_min
       from tintorerias where id = ?`,
    )
    .bind(tintoreriaId)
    .first<FilaTienda>();
  if (!f) throw new Error("Tintorería inexistente");
  return {
    nombre: f.nombre,
    telefono: f.telefono,
    correo: f.correo,
    direccion: f.direccion,
    ciudad: f.ciudad,
    estadoRegion: f.estado_region,
    codigoPostal: f.codigo_postal,
    pais: f.pais,
    zonaHoraria: f.zona_horaria,
    moneda: f.moneda as DatosTienda["moneda"],
    idioma: f.idioma,
    impuestoBps: f.impuesto_bps,
    recargoUrgenteBps: f.recargo_urgente_bps,
    descuentoMaxBps: f.descuento_max_bps,
    diasEntrega: f.dias_entrega,
    diasRecordatorio: f.dias_recordatorio,
    maxRecordatorios: f.max_recordatorios,
    diasAbandono: f.dias_abandono,
    bloqueoInactividadMin: f.bloqueo_inactividad_min,
  };
}

export async function guardarTienda(
  db: D1Database,
  s: Sesion,
  datos: DatosTienda,
  ahora = Date.now(),
): Promise<void> {
  const antes = await leerTienda(db, s.tintoreria.id);
  const cambios = (Object.keys(datos) as (keyof DatosTienda)[]).filter(
    (k) => (datos[k] ?? null) !== (antes[k] ?? null),
  );
  if (!cambios.length) return;
  await db.batch([
    db
      .prepare(
        `update tintorerias set nombre = ?, telefono = ?, correo = ?, direccion = ?, ciudad = ?, estado_region = ?,
           codigo_postal = ?, pais = ?, zona_horaria = ?, moneda = ?, idioma = ?, impuesto_bps = ?, recargo_urgente_bps = ?,
           descuento_max_bps = ?, dias_entrega = ?, dias_recordatorio = ?, max_recordatorios = ?, dias_abandono = ?,
           bloqueo_inactividad_min = ?, actualizada_en = ?
         where id = ?`,
      )
      .bind(
        datos.nombre,
        datos.telefono ?? null,
        datos.correo ?? null,
        datos.direccion ?? null,
        datos.ciudad ?? null,
        datos.estadoRegion ?? null,
        datos.codigoPostal ?? null,
        datos.pais,
        datos.zonaHoraria,
        datos.moneda,
        datos.idioma,
        datos.impuestoBps,
        datos.recargoUrgenteBps,
        datos.descuentoMaxBps,
        datos.diasEntrega,
        datos.diasRecordatorio,
        datos.maxRecordatorios,
        datos.diasAbandono,
        datos.bloqueoInactividadMin,
        ahora,
        s.tintoreria.id,
      ),
    sentenciaAuditoria(
      db,
      {
        tintoreriaId: s.tintoreria.id,
        usuarioId: s.usuario.id,
        dispositivoId: s.dispositivoId,
        accion: "ajustes.tienda",
        detalle: {
          campos: cambios,
          ...(cambios.includes("impuestoBps")
            ? { impuestoAntes: antes.impuestoBps, impuestoDespues: datos.impuestoBps }
            : {}),
        },
      },
      ahora,
    ),
  ]);
}
