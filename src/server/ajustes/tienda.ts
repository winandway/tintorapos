import { z } from "zod";
import { zonaValida } from "@/lib/fechas";
import { resolverUnidadPeso, SERVICIO_POR_PESO, UNIDADES_PESO, type UnidadPeso } from "@/lib/peso";
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
  /**
   * Cuándo cobra la tienda. `entrega` es lo tradicional y lo que viene puesto:
   * el cliente paga cuando recoge la ropa. `recepcion` es para las tiendas que
   * cobran por adelantado en el mostrador.
   */
  politicaCobro: z.enum(["entrega", "recepcion"]).default("entrega"),
  /**
   * En qué se pesa la ropa: libras o kilos. Si no viene, se queda la que había
   * (de fábrica sale del país: libras en EE.UU. y Puerto Rico, kilos en el resto).
   */
  unidadPeso: z.enum(UNIDADES_PESO).optional(),
});

export type DatosTienda = z.infer<typeof esquemaTienda>;
/** La tienda como sale de la base: ahí la unidad de peso siempre está resuelta. */
export type TiendaLeida = DatosTienda & { unidadPeso: UnidadPeso };

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

/** Preferencias que no tienen columna propia (ver `preferencias_tienda`). */
export const CLAVE_POLITICA_COBRO = "politica_cobro";
export const CLAVE_UNIDAD_PESO = "unidad_peso";

async function leerPreferencia(db: D1Database, tintoreriaId: string, clave: string): Promise<string | null> {
  const f = await db
    .prepare("select valor from preferencias_tienda where tintoreria_id = ? and clave = ?")
    .bind(tintoreriaId, clave)
    .first<{ valor: string }>();
  return f?.valor ?? null;
}

/** Solo la política de cobro (la pantalla del mostrador no necesita el resto). */
export async function politicaCobro(
  db: D1Database,
  tintoreriaId: string,
): Promise<DatosTienda["politicaCobro"]> {
  return (await leerPreferencia(db, tintoreriaId, CLAVE_POLITICA_COBRO)) === "recepcion"
    ? "recepcion"
    : "entrega";
}

/** Solo la unidad de peso (para las pantallas que no necesitan el resto). */
export async function unidadPeso(db: D1Database, tintoreriaId: string): Promise<UnidadPeso> {
  const f = await db
    .prepare(
      `select t.pais, p.valor from tintorerias t
       left join preferencias_tienda p on p.tintoreria_id = t.id and p.clave = ?
       where t.id = ?`,
    )
    .bind(CLAVE_UNIDAD_PESO, tintoreriaId)
    .first<{ pais: string; valor: string | null }>();
  return resolverUnidadPeso(f?.valor, f?.pais);
}

export async function leerTienda(db: D1Database, tintoreriaId: string): Promise<TiendaLeida> {
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
  const politica = await leerPreferencia(db, tintoreriaId, CLAVE_POLITICA_COBRO);
  const peso = await leerPreferencia(db, tintoreriaId, CLAVE_UNIDAD_PESO);
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
    politicaCobro: politica === "recepcion" ? "recepcion" : "entrega",
    unidadPeso: resolverUnidadPeso(peso, f.pais),
  };
}

export async function guardarTienda(
  db: D1Database,
  s: Sesion,
  datos: DatosTienda,
  ahora = Date.now(),
): Promise<void> {
  const antes = await leerTienda(db, s.tintoreria.id);
  // Sin unidad en lo que llega, se queda la que había: nunca se cambia sola.
  datos = { ...datos, unidadPeso: datos.unidadPeso ?? antes.unidadPeso };
  const peso = datos.unidadPeso ?? antes.unidadPeso;
  const cambios = (Object.keys(datos) as (keyof DatosTienda)[]).filter(
    (k) => (datos[k] ?? null) !== (antes[k] ?? null),
  );
  if (!cambios.length) return;
  const preferencia = (clave: string, valor: string) =>
    db
      .prepare(
        `insert into preferencias_tienda (tintoreria_id, clave, valor, actualizado_en) values (?, ?, ?, ?)
         on conflict (tintoreria_id, clave) do update set valor = excluded.valor, actualizado_en = excluded.actualizado_en`,
      )
      .bind(s.tintoreria.id, clave, valor, ahora);
  await db.batch([
    preferencia(CLAVE_UNIDAD_PESO, peso),
    // El servicio de fábrica cambia de nombre con la unidad («Lavado por libra» ↔
    // «Lavado por kilo»), pero SOLO si el dueño no le puso su propio nombre.
    ...(peso !== antes.unidadPeso
      ? [
          db
            .prepare(
              `update catalogo_servicios set nombre_es = ?, nombre_en = ?
               where tintoreria_id = ? and unidad = 'libra' and nombre_es = ? and ifnull(nombre_en, '') = ?`,
            )
            .bind(
              SERVICIO_POR_PESO[peso].es,
              SERVICIO_POR_PESO[peso].en,
              s.tintoreria.id,
              SERVICIO_POR_PESO[antes.unidadPeso].es,
              SERVICIO_POR_PESO[antes.unidadPeso].en,
            ),
        ]
      : []),
    // La política de cobro y la unidad de peso viven en `preferencias_tienda`: el
    // schema se aplica en cada publicación y no admite columnas nuevas.
    preferencia(CLAVE_POLITICA_COBRO, datos.politicaCobro),
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
