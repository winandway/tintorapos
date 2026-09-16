import { z } from "zod";
import { nuevoId } from "@/lib/codigos";
import { sentenciaAuditoria } from "@/server/auditoria";
import type { Sesion } from "@/server/auth/sesiones";
import { noEncontrado } from "@/server/errores";

export interface Prenda {
  id: string;
  nombreEs: string;
  nombreEn: string | null;
  orden: number;
  activo: boolean;
}

export interface Servicio extends Prenda {
  unidad: "pieza" | "libra";
  aplicaImpuesto: boolean;
  diasEntrega: number | null;
}

export interface Precio {
  servicioId: string;
  prendaId: string;
  precioCents: number;
}

export interface Catalogo {
  prendas: Prenda[];
  servicios: Servicio[];
  precios: Precio[];
}

export async function leerCatalogo(db: D1Database, tintoreriaId: string): Promise<Catalogo> {
  const [p, s, pr] = await db.batch([
    db
      .prepare(
        "select id, nombre_es, nombre_en, orden, activo from catalogo_prendas where tintoreria_id = ? order by orden, nombre_es",
      )
      .bind(tintoreriaId),
    db
      .prepare(
        "select id, nombre_es, nombre_en, unidad, aplica_impuesto, dias_entrega, orden, activo from catalogo_servicios where tintoreria_id = ? order by orden, nombre_es",
      )
      .bind(tintoreriaId),
    db
      .prepare("select servicio_id, prenda_id, precio_cents from precios where tintoreria_id = ?")
      .bind(tintoreriaId),
  ]);
  type FP = { id: string; nombre_es: string; nombre_en: string | null; orden: number; activo: number };
  type FS = FP & { unidad: "pieza" | "libra"; aplica_impuesto: number; dias_entrega: number | null };
  type FPr = { servicio_id: string; prenda_id: string; precio_cents: number };
  return {
    prendas: ((p?.results ?? []) as FP[]).map((r) => ({
      id: r.id,
      nombreEs: r.nombre_es,
      nombreEn: r.nombre_en,
      orden: r.orden,
      activo: r.activo === 1,
    })),
    servicios: ((s?.results ?? []) as FS[]).map((r) => ({
      id: r.id,
      nombreEs: r.nombre_es,
      nombreEn: r.nombre_en,
      orden: r.orden,
      activo: r.activo === 1,
      unidad: r.unidad,
      aplicaImpuesto: r.aplica_impuesto === 1,
      diasEntrega: r.dias_entrega,
    })),
    precios: ((pr?.results ?? []) as FPr[]).map((r) => ({
      servicioId: r.servicio_id,
      prendaId: r.prenda_id,
      precioCents: r.precio_cents,
    })),
  };
}

const nombreEn = z
  .string()
  .trim()
  .max(60)
  .transform((v) => (v === "" ? null : v))
  .nullable()
  .optional();

export const esquemaPrenda = z.object({
  nombreEs: z.string().trim().min(1).max(60),
  nombreEn,
  orden: z.number().int().min(0).max(9999).optional(),
  activo: z.boolean().optional(),
});

export const esquemaServicio = esquemaPrenda.extend({
  unidad: z.enum(["pieza", "libra"]),
  aplicaImpuesto: z.boolean(),
  diasEntrega: z.number().int().min(0).max(60).nullable().optional(),
});

function auditoria(
  db: D1Database,
  s: Sesion,
  accion: string,
  entidad: string,
  id: string,
  detalle: Record<string, unknown> = {},
  ahora = Date.now(),
) {
  return sentenciaAuditoria(
    db,
    {
      tintoreriaId: s.tintoreria.id,
      usuarioId: s.usuario.id,
      dispositivoId: s.dispositivoId,
      accion,
      entidad,
      entidadId: id,
      detalle,
    },
    ahora,
  );
}

async function siguienteOrden(
  db: D1Database,
  tabla: "catalogo_prendas" | "catalogo_servicios",
  tintoreriaId: string,
) {
  const sql =
    tabla === "catalogo_prendas"
      ? "select coalesce(max(orden), -1) + 1 as n from catalogo_prendas where tintoreria_id = ?"
      : "select coalesce(max(orden), -1) + 1 as n from catalogo_servicios where tintoreria_id = ?";
  return (await db.prepare(sql).bind(tintoreriaId).first<{ n: number }>())?.n ?? 0;
}

export async function crearPrenda(
  db: D1Database,
  s: Sesion,
  d: z.infer<typeof esquemaPrenda>,
  ahora = Date.now(),
) {
  const id = nuevoId();
  const orden = d.orden ?? (await siguienteOrden(db, "catalogo_prendas", s.tintoreria.id));
  await db.batch([
    db
      .prepare(
        "insert into catalogo_prendas (id, tintoreria_id, nombre_es, nombre_en, orden, activo, creado_en) values (?, ?, ?, ?, ?, ?, ?)",
      )
      .bind(id, s.tintoreria.id, d.nombreEs, d.nombreEn ?? null, orden, d.activo === false ? 0 : 1, ahora),
    auditoria(db, s, "catalogo.prenda_creada", "prenda", id, {}, ahora),
  ]);
  return id;
}

export async function editarPrenda(
  db: D1Database,
  s: Sesion,
  id: string,
  d: z.infer<typeof esquemaPrenda>,
  ahora = Date.now(),
) {
  const r = await db
    .prepare(
      "update catalogo_prendas set nombre_es = ?, nombre_en = ?, orden = coalesce(?, orden), activo = coalesce(?, activo) where id = ? and tintoreria_id = ?",
    )
    .bind(
      d.nombreEs,
      d.nombreEn ?? null,
      d.orden ?? null,
      d.activo === undefined ? null : d.activo ? 1 : 0,
      id,
      s.tintoreria.id,
    )
    .run();
  if (!r.meta.changes) throw noEncontrado();
  await auditoria(db, s, "catalogo.prenda_editada", "prenda", id, { activo: d.activo }, ahora).run();
}

export async function crearServicio(
  db: D1Database,
  s: Sesion,
  d: z.infer<typeof esquemaServicio>,
  ahora = Date.now(),
) {
  const id = nuevoId();
  const orden = d.orden ?? (await siguienteOrden(db, "catalogo_servicios", s.tintoreria.id));
  await db.batch([
    db
      .prepare(
        `insert into catalogo_servicios (id, tintoreria_id, nombre_es, nombre_en, unidad, aplica_impuesto, dias_entrega, orden, activo, creado_en)
         values (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      )
      .bind(
        id,
        s.tintoreria.id,
        d.nombreEs,
        d.nombreEn ?? null,
        d.unidad,
        d.aplicaImpuesto ? 1 : 0,
        d.diasEntrega ?? null,
        orden,
        d.activo === false ? 0 : 1,
        ahora,
      ),
    auditoria(db, s, "catalogo.servicio_creado", "servicio", id, {}, ahora),
  ]);
  return id;
}

export async function editarServicio(
  db: D1Database,
  s: Sesion,
  id: string,
  d: z.infer<typeof esquemaServicio>,
  ahora = Date.now(),
) {
  const r = await db
    .prepare(
      `update catalogo_servicios set nombre_es = ?, nombre_en = ?, unidad = ?, aplica_impuesto = ?, dias_entrega = ?,
         orden = coalesce(?, orden), activo = coalesce(?, activo)
       where id = ? and tintoreria_id = ?`,
    )
    .bind(
      d.nombreEs,
      d.nombreEn ?? null,
      d.unidad,
      d.aplicaImpuesto ? 1 : 0,
      d.diasEntrega ?? null,
      d.orden ?? null,
      d.activo === undefined ? null : d.activo ? 1 : 0,
      id,
      s.tintoreria.id,
    )
    .run();
  if (!r.meta.changes) throw noEncontrado();
  await auditoria(
    db,
    s,
    "catalogo.servicio_editado",
    "servicio",
    id,
    { activo: d.activo, impuesto: d.aplicaImpuesto },
    ahora,
  ).run();
}

export const esquemaPrecios = z.object({
  precios: z
    .array(
      z.object({
        servicioId: z.string().min(1).max(64),
        prendaId: z.string().max(64),
        precioCents: z.number().int().min(0).max(10_000_000).nullable(),
      }),
    )
    .min(1)
    .max(500),
});

/** Guarda precios en lote. null borra el precio (queda «a escribir en el mostrador»). */
export async function guardarPrecios(
  db: D1Database,
  s: Sesion,
  precios: z.infer<typeof esquemaPrecios>["precios"],
  ahora = Date.now(),
) {
  const cat = await leerCatalogo(db, s.tintoreria.id);
  const servicios = new Map(cat.servicios.map((x) => [x.id, x]));
  const prendas = new Set(cat.prendas.map((x) => x.id));
  const sentencias: D1PreparedStatement[] = [];
  for (const p of precios) {
    const servicio = servicios.get(p.servicioId);
    if (!servicio) throw noEncontrado();
    // Por libra el precio no depende de la prenda.
    const prendaId = servicio.unidad === "libra" ? "" : p.prendaId;
    if (servicio.unidad === "pieza" && !prendas.has(prendaId)) throw noEncontrado();
    if (p.precioCents === null) {
      sentencias.push(
        db
          .prepare("delete from precios where tintoreria_id = ? and servicio_id = ? and prenda_id = ?")
          .bind(s.tintoreria.id, p.servicioId, prendaId),
      );
    } else {
      sentencias.push(
        db
          .prepare(
            `insert into precios (tintoreria_id, servicio_id, prenda_id, precio_cents, actualizado_en) values (?, ?, ?, ?, ?)
             on conflict (tintoreria_id, servicio_id, prenda_id) do update set precio_cents = excluded.precio_cents, actualizado_en = excluded.actualizado_en`,
          )
          .bind(s.tintoreria.id, p.servicioId, prendaId, p.precioCents, ahora),
      );
    }
  }
  sentencias.push(
    auditoria(db, s, "catalogo.precios", "precios", s.tintoreria.id, { cantidad: precios.length }, ahora),
  );
  await db.batch(sentencias);
}
