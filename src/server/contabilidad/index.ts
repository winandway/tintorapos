/**
 * Contabilidad de la tintorería. Lo que el dueño usa de verdad: lo que sale de
 * la caja (gastos), lo que le compra a sus proveedores, cuánto le queda de cada
 * insumo, quién le debe y cuánto quedó de ganancia.
 *
 * Regla de oro para que nada se cuente dos veces: **una compra a proveedor
 * escribe también su gasto**, con `compra_id`. La ganancia se calcula SIEMPRE
 * desde `gastos`, nunca sumando las dos tablas.
 */
import { z } from "zod";
import { nuevoId } from "@/lib/codigos";
import { sentenciaAuditoria } from "@/server/auditoria";
import type { Sesion } from "@/server/auth/sesiones";
import { ErrorApp, noEncontrado } from "@/server/errores";
import { reporteVentas } from "@/server/reportes";
import {
  CATEGORIAS_GASTO,
  esCategoriaGasto,
  grupoDe,
  GRUPOS_GASTO,
  INSUMOS_ESTANDAR,
  METODOS_GASTO,
  type GrupoGasto,
} from "./categorias";

const FECHA = /^\d{4}-\d{2}-\d{2}$/;
const esquemaFecha = z.string().regex(FECHA);
const opcional = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .transform((v) => (v === "" ? null : v))
    .nullable()
    .optional();

/**
 * CANDADO: un identificador que llega del navegador (proveedor, insumo,
 * empleado) tiene que ser de ESTA tintorería. Sin esto, alguien podría colgar
 * su gasto del proveedor de otra tienda y el dato de la otra aparecería en su
 * pantalla. Lo atrapó la prueba de aislamiento.
 */
async function exigirPropio(
  db: D1Database,
  tintoreriaId: string,
  tabla: "proveedores" | "insumos" | "usuarios",
  id: string | null | undefined,
): Promise<string | null> {
  if (!id) return null;
  const f = await db
    .prepare(`select id from ${tabla} where tintoreria_id = ? and id = ?`)
    .bind(tintoreriaId, id)
    .first();
  if (!f) throw noEncontrado();
  return id;
}

/* ------------------------------------------------------------------ */
/* Proveedores                                                         */
/* ------------------------------------------------------------------ */

export const esquemaProveedor = z.object({
  nombre: z.string().trim().min(2).max(80),
  telefono: opcional(30),
  correo: z
    .union([z.literal(""), z.email().max(120)])
    .transform((v) => (v === "" ? null : v.toLowerCase()))
    .nullable()
    .optional(),
  contacto: opcional(80),
  terminosDias: z.number().int().min(0).max(365).default(0),
  notas: opcional(500),
  activo: z.boolean().default(true),
});
export type DatosProveedor = z.infer<typeof esquemaProveedor>;

export interface Proveedor {
  id: string;
  nombre: string;
  telefono: string | null;
  correo: string | null;
  contacto: string | null;
  terminosDias: number;
  notas: string | null;
  activo: boolean;
  compradoCents: number;
  porPagarCents: number;
}

export async function listarProveedores(db: D1Database, tintoreriaId: string): Promise<Proveedor[]> {
  const { results } = await db
    .prepare(
      `select p.id, p.nombre, p.telefono, p.correo, p.contacto, p.terminos_dias, p.notas, p.activo,
         (select coalesce(sum(c.total_cents), 0) from compras c
            where c.tintoreria_id = p.tintoreria_id and c.proveedor_id = p.id and c.eliminado_en is null) as comprado,
         (select coalesce(sum(max(c.total_cents - c.pagado_cents, 0)), 0) from compras c
            where c.tintoreria_id = p.tintoreria_id and c.proveedor_id = p.id and c.eliminado_en is null) as por_pagar
       from proveedores p where p.tintoreria_id = ? and p.eliminado_en is null order by p.activo desc, p.nombre`,
    )
    .bind(tintoreriaId)
    .all<{
      id: string;
      nombre: string;
      telefono: string | null;
      correo: string | null;
      contacto: string | null;
      terminos_dias: number;
      notas: string | null;
      activo: number;
      comprado: number;
      por_pagar: number;
    }>();
  return results.map((r) => ({
    id: r.id,
    nombre: r.nombre,
    telefono: r.telefono,
    correo: r.correo,
    contacto: r.contacto,
    terminosDias: r.terminos_dias,
    notas: r.notas,
    activo: Boolean(r.activo),
    compradoCents: r.comprado ?? 0,
    porPagarCents: r.por_pagar ?? 0,
  }));
}

export async function guardarProveedor(
  db: D1Database,
  s: Sesion,
  id: string | null,
  d: DatosProveedor,
  ahora = Date.now(),
): Promise<string> {
  const t = s.tintoreria.id;
  if (id) {
    const ya = await db
      .prepare("select id from proveedores where tintoreria_id = ? and id = ? and eliminado_en is null")
      .bind(t, id)
      .first();
    if (!ya) throw noEncontrado();
    await db.batch([
      db
        .prepare(
          `update proveedores set nombre = ?, telefono = ?, correo = ?, contacto = ?, terminos_dias = ?,
             notas = ?, activo = ?, actualizado_en = ? where tintoreria_id = ? and id = ?`,
        )
        .bind(
          d.nombre,
          d.telefono ?? null,
          d.correo ?? null,
          d.contacto ?? null,
          d.terminosDias,
          d.notas ?? null,
          d.activo ? 1 : 0,
          ahora,
          t,
          id,
        ),
      sentenciaAuditoria(
        db,
        {
          tintoreriaId: t,
          usuarioId: s.usuario.id,
          accion: "contabilidad.proveedor_editado",
          entidad: "proveedor",
          entidadId: id,
        },
        ahora,
      ),
    ]);
    return id;
  }
  const nuevo = nuevoId();
  await db.batch([
    db
      .prepare(
        `insert into proveedores (id, tintoreria_id, nombre, telefono, correo, contacto, terminos_dias, notas, activo, creado_por, creado_en, actualizado_en)
         values (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      )
      .bind(
        nuevo,
        t,
        d.nombre,
        d.telefono ?? null,
        d.correo ?? null,
        d.contacto ?? null,
        d.terminosDias,
        d.notas ?? null,
        d.activo ? 1 : 0,
        s.usuario.id,
        ahora,
        ahora,
      ),
    sentenciaAuditoria(
      db,
      {
        tintoreriaId: t,
        usuarioId: s.usuario.id,
        accion: "contabilidad.proveedor_creado",
        entidad: "proveedor",
        entidadId: nuevo,
      },
      ahora,
    ),
  ]);
  return nuevo;
}

export async function eliminarProveedor(
  db: D1Database,
  s: Sesion,
  id: string,
  ahora = Date.now(),
): Promise<void> {
  const t = s.tintoreria.id;
  const r = await db
    .prepare(
      "update proveedores set eliminado_en = ?, activo = 0, actualizado_en = ? where tintoreria_id = ? and id = ? and eliminado_en is null",
    )
    .bind(ahora, ahora, t, id)
    .run();
  if (!r.meta.changes) throw noEncontrado();
  await sentenciaAuditoria(
    db,
    {
      tintoreriaId: t,
      usuarioId: s.usuario.id,
      accion: "contabilidad.proveedor_eliminado",
      entidad: "proveedor",
      entidadId: id,
    },
    ahora,
  ).run();
}

/* ------------------------------------------------------------------ */
/* Gastos                                                              */
/* ------------------------------------------------------------------ */

export const esquemaGasto = z.object({
  fecha: esquemaFecha,
  categoria: z.string().refine(esCategoriaGasto, "invalida"),
  proveedorId: z.string().max(64).nullable().optional(),
  empleadoId: z.string().max(64).nullable().optional(),
  descripcion: opcional(200),
  montoCents: z.number().int().positive().max(1_000_000_000),
  metodoPago: z.enum(METODOS_GASTO).default("efectivo"),
  referencia: opcional(60),
});
export type DatosGasto = z.infer<typeof esquemaGasto>;

export interface Gasto {
  id: string;
  fecha: string;
  categoria: string;
  grupo: GrupoGasto;
  proveedorId: string | null;
  proveedor: string | null;
  empleadoId: string | null;
  empleado: string | null;
  compraId: string | null;
  descripcion: string | null;
  montoCents: number;
  metodoPago: string;
  referencia: string | null;
  creadoEn: number;
}

export interface FiltroGastos {
  desde: string;
  hasta: string;
  categoria?: string;
  proveedorId?: string;
  limite?: number;
}

export async function listarGastos(
  db: D1Database,
  tintoreriaId: string,
  f: FiltroGastos,
): Promise<{ gastos: Gasto[]; totalCents: number }> {
  const condiciones = ["g.tintoreria_id = ?", "g.eliminado_en is null", "g.fecha_local between ? and ?"];
  const valores: (string | number)[] = [tintoreriaId, f.desde, f.hasta];
  if (f.categoria && esCategoriaGasto(f.categoria)) {
    condiciones.push("g.categoria = ?");
    valores.push(f.categoria);
  }
  if (f.proveedorId) {
    condiciones.push("g.proveedor_id = ?");
    valores.push(f.proveedorId);
  }
  const donde = condiciones.join(" and ");
  const [lista, total] = await db.batch([
    db
      .prepare(
        `select g.id, g.fecha_local, g.categoria, g.proveedor_id, g.empleado_id, g.compra_id, g.descripcion,
           g.monto_cents, g.metodo_pago, g.referencia, g.creado_en,
           p.nombre as proveedor, u.nombre as empleado
         from gastos g
         left join proveedores p on p.id = g.proveedor_id and p.tintoreria_id = g.tintoreria_id
         left join usuarios u on u.id = g.empleado_id and u.tintoreria_id = g.tintoreria_id
         where ${donde} order by g.fecha_local desc, g.creado_en desc limit ?`,
      )
      .bind(...valores, Math.min(500, f.limite ?? 200)),
    db
      .prepare(`select coalesce(sum(g.monto_cents), 0) as total from gastos g where ${donde}`)
      .bind(...valores),
  ]);
  const filas = (lista?.results ?? []) as {
    id: string;
    fecha_local: string;
    categoria: string;
    proveedor_id: string | null;
    empleado_id: string | null;
    compra_id: string | null;
    descripcion: string | null;
    monto_cents: number;
    metodo_pago: string;
    referencia: string | null;
    creado_en: number;
    proveedor: string | null;
    empleado: string | null;
  }[];
  return {
    gastos: filas.map((r) => ({
      id: r.id,
      fecha: r.fecha_local,
      categoria: r.categoria,
      grupo: grupoDe(r.categoria),
      proveedorId: r.proveedor_id,
      proveedor: r.proveedor,
      empleadoId: r.empleado_id,
      empleado: r.empleado,
      compraId: r.compra_id,
      descripcion: r.descripcion,
      montoCents: r.monto_cents,
      metodoPago: r.metodo_pago,
      referencia: r.referencia,
      creadoEn: r.creado_en,
    })),
    totalCents: ((total?.results ?? [])[0] as { total: number } | undefined)?.total ?? 0,
  };
}

export async function crearGasto(
  db: D1Database,
  s: Sesion,
  d: DatosGasto,
  ahora = Date.now(),
): Promise<string> {
  const proveedorId = await exigirPropio(db, s.tintoreria.id, "proveedores", d.proveedorId);
  const empleadoId = await exigirPropio(db, s.tintoreria.id, "usuarios", d.empleadoId);
  const id = nuevoId();
  await db.batch([
    db
      .prepare(
        `insert into gastos (id, tintoreria_id, sucursal_id, categoria, proveedor_id, empleado_id, descripcion,
           monto_cents, metodo_pago, referencia, fecha_local, creado_por, creado_en, actualizado_en)
         values (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      )
      .bind(
        id,
        s.tintoreria.id,
        s.sucursalId,
        d.categoria,
        proveedorId,
        empleadoId,
        d.descripcion ?? null,
        d.montoCents,
        d.metodoPago,
        d.referencia ?? null,
        d.fecha,
        s.usuario.id,
        ahora,
        ahora,
      ),
    sentenciaAuditoria(
      db,
      {
        tintoreriaId: s.tintoreria.id,
        usuarioId: s.usuario.id,
        accion: "contabilidad.gasto_creado",
        entidad: "gasto",
        entidadId: id,
        detalle: { categoria: d.categoria, montoCents: d.montoCents },
      },
      ahora,
    ),
  ]);
  return id;
}

export async function editarGasto(
  db: D1Database,
  s: Sesion,
  id: string,
  d: DatosGasto,
  ahora = Date.now(),
): Promise<void> {
  const ya = await db
    .prepare("select compra_id from gastos where tintoreria_id = ? and id = ? and eliminado_en is null")
    .bind(s.tintoreria.id, id)
    .first<{ compra_id: string | null }>();
  if (!ya) throw noEncontrado();
  // El gasto de una compra se cambia desde la compra: si no, los dos números
  // dejan de cuadrar y la ganancia miente.
  if (ya.compra_id) throw new ErrorApp(409, "gasto_de_compra");
  const proveedorId = await exigirPropio(db, s.tintoreria.id, "proveedores", d.proveedorId);
  const empleadoId = await exigirPropio(db, s.tintoreria.id, "usuarios", d.empleadoId);
  await db.batch([
    db
      .prepare(
        `update gastos set categoria = ?, proveedor_id = ?, empleado_id = ?, descripcion = ?, monto_cents = ?,
           metodo_pago = ?, referencia = ?, fecha_local = ?, actualizado_en = ?
         where tintoreria_id = ? and id = ?`,
      )
      .bind(
        d.categoria,
        proveedorId,
        empleadoId,
        d.descripcion ?? null,
        d.montoCents,
        d.metodoPago,
        d.referencia ?? null,
        d.fecha,
        ahora,
        s.tintoreria.id,
        id,
      ),
    sentenciaAuditoria(
      db,
      {
        tintoreriaId: s.tintoreria.id,
        usuarioId: s.usuario.id,
        accion: "contabilidad.gasto_editado",
        entidad: "gasto",
        entidadId: id,
        detalle: { montoCents: d.montoCents },
      },
      ahora,
    ),
  ]);
}

export async function eliminarGasto(
  db: D1Database,
  s: Sesion,
  id: string,
  ahora = Date.now(),
): Promise<void> {
  const ya = await db
    .prepare("select compra_id from gastos where tintoreria_id = ? and id = ? and eliminado_en is null")
    .bind(s.tintoreria.id, id)
    .first<{ compra_id: string | null }>();
  if (!ya) throw noEncontrado();
  if (ya.compra_id) throw new ErrorApp(409, "gasto_de_compra");
  await db.batch([
    db
      .prepare("update gastos set eliminado_en = ?, actualizado_en = ? where tintoreria_id = ? and id = ?")
      .bind(ahora, ahora, s.tintoreria.id, id),
    sentenciaAuditoria(
      db,
      {
        tintoreriaId: s.tintoreria.id,
        usuarioId: s.usuario.id,
        accion: "contabilidad.gasto_eliminado",
        entidad: "gasto",
        entidadId: id,
      },
      ahora,
    ),
  ]);
}

/* ------------------------------------------------------------------ */
/* Insumos                                                             */
/* ------------------------------------------------------------------ */

export const esquemaInsumo = z.object({
  nombre: z.string().trim().min(2).max(60),
  unidad: z.string().trim().min(1).max(20).default("unidad"),
  minimo: z.number().min(0).max(1_000_000).default(0),
  costoUnitCents: z.number().int().min(0).max(100_000_000).default(0),
  proveedorId: z.string().max(64).nullable().optional(),
  activo: z.boolean().default(true),
});
export type DatosInsumo = z.infer<typeof esquemaInsumo>;

export interface Insumo {
  id: string;
  nombre: string;
  unidad: string;
  existencia: number;
  minimo: number;
  costoUnitCents: number;
  proveedorId: string | null;
  proveedor: string | null;
  activo: boolean;
  bajo: boolean;
}

export async function listarInsumos(db: D1Database, tintoreriaId: string): Promise<Insumo[]> {
  const { results } = await db
    .prepare(
      `select i.id, i.nombre, i.unidad, i.existencia, i.minimo, i.costo_unit_cents, i.proveedor_id, i.activo,
         p.nombre as proveedor
       from insumos i
       left join proveedores p on p.id = i.proveedor_id and p.tintoreria_id = i.tintoreria_id
       where i.tintoreria_id = ? order by i.activo desc, i.orden, i.nombre`,
    )
    .bind(tintoreriaId)
    .all<{
      id: string;
      nombre: string;
      unidad: string;
      existencia: number;
      minimo: number;
      costo_unit_cents: number;
      proveedor_id: string | null;
      activo: number;
      proveedor: string | null;
    }>();
  return results.map((r) => ({
    id: r.id,
    nombre: r.nombre,
    unidad: r.unidad,
    existencia: r.existencia,
    minimo: r.minimo,
    costoUnitCents: r.costo_unit_cents,
    proveedorId: r.proveedor_id,
    proveedor: r.proveedor,
    activo: Boolean(r.activo),
    bajo: r.minimo > 0 && r.existencia <= r.minimo,
  }));
}

export async function guardarInsumo(
  db: D1Database,
  s: Sesion,
  id: string | null,
  d: DatosInsumo,
  ahora = Date.now(),
): Promise<string> {
  const t = s.tintoreria.id;
  const proveedorId = await exigirPropio(db, t, "proveedores", d.proveedorId);
  if (id) {
    const r = await db
      .prepare(
        `update insumos set nombre = ?, unidad = ?, minimo = ?, costo_unit_cents = ?, proveedor_id = ?,
           activo = ?, actualizado_en = ? where tintoreria_id = ? and id = ?`,
      )
      .bind(d.nombre, d.unidad, d.minimo, d.costoUnitCents, proveedorId, d.activo ? 1 : 0, ahora, t, id)
      .run();
    if (!r.meta.changes) throw noEncontrado();
    return id;
  }
  const nuevo = nuevoId();
  await db
    .prepare(
      `insert into insumos (id, tintoreria_id, nombre, unidad, existencia, minimo, costo_unit_cents, proveedor_id, activo, orden, creado_en, actualizado_en)
       values (?, ?, ?, ?, 0, ?, ?, ?, ?, 100, ?, ?)`,
    )
    .bind(
      nuevo,
      t,
      d.nombre,
      d.unidad,
      d.minimo,
      d.costoUnitCents,
      proveedorId,
      d.activo ? 1 : 0,
      ahora,
      ahora,
    )
    .run();
  return nuevo;
}

/** Suma o resta existencia a mano (se gastó, se dañó, se contó de nuevo). */
export async function moverInsumo(
  db: D1Database,
  s: Sesion,
  id: string,
  cantidad: number,
  motivo: string | null,
  tipo: "consumo" | "ajuste" = "ajuste",
  ahora = Date.now(),
): Promise<number> {
  const t = s.tintoreria.id;
  const f = await db
    .prepare("select existencia from insumos where tintoreria_id = ? and id = ?")
    .bind(t, id)
    .first<{ existencia: number }>();
  if (!f) throw noEncontrado();
  const despues = Math.round((f.existencia + cantidad) * 1000) / 1000;
  await db.batch([
    db
      .prepare("update insumos set existencia = ?, actualizado_en = ? where tintoreria_id = ? and id = ?")
      .bind(despues, ahora, t, id),
    db
      .prepare(
        `insert into movimientos_insumo (id, tintoreria_id, insumo_id, tipo, cantidad, existencia_despues, motivo, usuario_id, creado_en)
         values (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      )
      .bind(nuevoId(), t, id, tipo, cantidad, despues, motivo, s.usuario.id, ahora),
  ]);
  return despues;
}

/** Crea los insumos de siempre del oficio, en cero. No repite los que ya están. */
export async function crearInsumosEstandar(db: D1Database, s: Sesion, ahora = Date.now()): Promise<number> {
  const t = s.tintoreria.id;
  const { results } = await db
    .prepare("select nombre from insumos where tintoreria_id = ?")
    .bind(t)
    .all<{ nombre: string }>();
  const ya = new Set(results.map((r) => r.nombre.toLowerCase()));
  const idioma = s.tintoreria.idioma === "en" ? "en" : "es";
  const faltan = INSUMOS_ESTANDAR.filter((i) => !ya.has(i[idioma].toLowerCase()));
  if (!faltan.length) return 0;
  await db.batch(
    faltan.map((i, n) =>
      db
        .prepare(
          `insert into insumos (id, tintoreria_id, nombre, unidad, existencia, minimo, costo_unit_cents, activo, orden, creado_en, actualizado_en)
           values (?, ?, ?, ?, 0, 0, 0, 1, ?, ?, ?)`,
        )
        .bind(nuevoId(), t, i[idioma], i.unidad, n, ahora, ahora),
    ),
  );
  return faltan.length;
}

/* ------------------------------------------------------------------ */
/* Compras                                                             */
/* ------------------------------------------------------------------ */

export const esquemaCompra = z.object({
  proveedorId: z.string().max(64).nullable().optional(),
  numeroFactura: opcional(40),
  fecha: esquemaFecha,
  impuestoCents: z.number().int().min(0).max(1_000_000_000).default(0),
  pagadoCents: z.number().int().min(0).max(1_000_000_000).default(0),
  venceEn: z.number().int().positive().nullable().optional(),
  notas: opcional(300),
  lineas: z
    .array(
      z.object({
        insumoId: z.string().max(64).nullable().optional(),
        descripcion: z.string().trim().min(1).max(120),
        cantidad: z.number().positive().max(1_000_000),
        costoUnitCents: z.number().int().min(0).max(100_000_000),
      }),
    )
    .min(1)
    .max(100),
});
export type DatosCompra = z.infer<typeof esquemaCompra>;

export interface Compra {
  id: string;
  fecha: string;
  proveedorId: string | null;
  proveedor: string | null;
  numeroFactura: string | null;
  subtotalCents: number;
  impuestoCents: number;
  totalCents: number;
  pagadoCents: number;
  saldoCents: number;
  venceEn: number | null;
  notas: string | null;
  lineas?: {
    id: string;
    insumoId: string | null;
    descripcion: string;
    cantidad: number;
    costoUnitCents: number;
    totalCents: number;
  }[];
}

export async function crearCompra(
  db: D1Database,
  s: Sesion,
  d: DatosCompra,
  ahora = Date.now(),
): Promise<{ id: string; totalCents: number }> {
  const t = s.tintoreria.id;
  const proveedorId = await exigirPropio(db, t, "proveedores", d.proveedorId);
  for (const l of d.lineas) await exigirPropio(db, t, "insumos", l.insumoId);
  const lineas = d.lineas.map((l) => ({
    ...l,
    id: nuevoId(),
    totalCents: Math.round(l.cantidad * l.costoUnitCents),
  }));
  const subtotal = lineas.reduce((n, l) => n + l.totalCents, 0);
  const total = subtotal + d.impuestoCents;
  if (d.pagadoCents > total) throw new ErrorApp(400, "pago_excede");
  const compraId = nuevoId();
  const sentencias: D1PreparedStatement[] = [
    db
      .prepare(
        `insert into compras (id, tintoreria_id, sucursal_id, proveedor_id, numero_factura, fecha_local,
           subtotal_cents, impuesto_cents, total_cents, pagado_cents, vence_en, notas, creado_por, creado_en, actualizado_en)
         values (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      )
      .bind(
        compraId,
        t,
        s.sucursalId,
        proveedorId,
        d.numeroFactura ?? null,
        d.fecha,
        subtotal,
        d.impuestoCents,
        total,
        d.pagadoCents,
        d.venceEn ?? null,
        d.notas ?? null,
        s.usuario.id,
        ahora,
        ahora,
      ),
  ];
  for (const l of lineas) {
    sentencias.push(
      db
        .prepare(
          `insert into compra_lineas (id, tintoreria_id, compra_id, insumo_id, descripcion, cantidad, costo_unit_cents, total_cents, creada_en)
           values (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        )
        .bind(
          l.id,
          t,
          compraId,
          l.insumoId || null,
          l.descripcion,
          l.cantidad,
          l.costoUnitCents,
          l.totalCents,
          ahora,
        ),
    );
  }
  // El gasto de la compra: la ganancia se calcula de `gastos` y nada se
  // cuenta dos veces.
  sentencias.push(
    db
      .prepare(
        `insert into gastos (id, tintoreria_id, sucursal_id, categoria, proveedor_id, compra_id, descripcion,
           monto_cents, metodo_pago, referencia, fecha_local, creado_por, creado_en, actualizado_en)
         values (?, ?, ?, 'insumos', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      )
      .bind(
        nuevoId(),
        t,
        s.sucursalId,
        proveedorId,
        compraId,
        d.numeroFactura ? `Factura ${d.numeroFactura}` : null,
        total,
        d.pagadoCents >= total ? "efectivo" : "credito",
        d.numeroFactura ?? null,
        d.fecha,
        s.usuario.id,
        ahora,
        ahora,
      ),
    sentenciaAuditoria(
      db,
      {
        tintoreriaId: t,
        usuarioId: s.usuario.id,
        accion: "contabilidad.compra_creada",
        entidad: "compra",
        entidadId: compraId,
        detalle: { totalCents: total, lineas: lineas.length },
      },
      ahora,
    ),
  );
  await db.batch(sentencias);

  // La existencia sube DESPUÉS: cada insumo con su movimiento, para que se
  // pueda ver de dónde salió cada unidad.
  for (const l of lineas) {
    if (!l.insumoId) continue;
    const f = await db
      .prepare("select existencia from insumos where tintoreria_id = ? and id = ?")
      .bind(t, l.insumoId)
      .first<{ existencia: number }>();
    if (!f) continue;
    const despues = Math.round((f.existencia + l.cantidad) * 1000) / 1000;
    await db.batch([
      db
        .prepare(
          "update insumos set existencia = ?, costo_unit_cents = ?, actualizado_en = ? where tintoreria_id = ? and id = ?",
        )
        .bind(despues, l.costoUnitCents, ahora, t, l.insumoId),
      db
        .prepare(
          `insert into movimientos_insumo (id, tintoreria_id, insumo_id, tipo, cantidad, existencia_despues, motivo, compra_id, usuario_id, creado_en)
           values (?, ?, ?, 'compra', ?, ?, null, ?, ?, ?)`,
        )
        .bind(nuevoId(), t, l.insumoId, l.cantidad, despues, compraId, s.usuario.id, ahora),
    ]);
  }
  return { id: compraId, totalCents: total };
}

export async function listarCompras(
  db: D1Database,
  tintoreriaId: string,
  f: { desde: string; hasta: string; proveedorId?: string; soloPendientes?: boolean; limite?: number },
): Promise<{ compras: Compra[]; totalCents: number; porPagarCents: number }> {
  const condiciones = ["c.tintoreria_id = ?", "c.eliminado_en is null", "c.fecha_local between ? and ?"];
  const valores: (string | number)[] = [tintoreriaId, f.desde, f.hasta];
  if (f.proveedorId) {
    condiciones.push("c.proveedor_id = ?");
    valores.push(f.proveedorId);
  }
  if (f.soloPendientes) condiciones.push("c.pagado_cents < c.total_cents");
  const donde = condiciones.join(" and ");
  const [lista, totales] = await db.batch([
    db
      .prepare(
        `select c.id, c.fecha_local, c.proveedor_id, c.numero_factura, c.subtotal_cents, c.impuesto_cents,
           c.total_cents, c.pagado_cents, c.vence_en, c.notas, p.nombre as proveedor
         from compras c
         left join proveedores p on p.id = c.proveedor_id and p.tintoreria_id = c.tintoreria_id
         where ${donde} order by c.fecha_local desc, c.creado_en desc limit ?`,
      )
      .bind(...valores, Math.min(300, f.limite ?? 100)),
    db
      .prepare(
        `select coalesce(sum(c.total_cents), 0) as total,
           coalesce(sum(max(c.total_cents - c.pagado_cents, 0)), 0) as por_pagar
         from compras c where ${donde}`,
      )
      .bind(...valores),
  ]);
  const filas = (lista?.results ?? []) as {
    id: string;
    fecha_local: string;
    proveedor_id: string | null;
    numero_factura: string | null;
    subtotal_cents: number;
    impuesto_cents: number;
    total_cents: number;
    pagado_cents: number;
    vence_en: number | null;
    notas: string | null;
    proveedor: string | null;
  }[];
  const t = ((totales?.results ?? [])[0] as { total: number; por_pagar: number } | undefined) ?? {
    total: 0,
    por_pagar: 0,
  };
  return {
    compras: filas.map((r) => ({
      id: r.id,
      fecha: r.fecha_local,
      proveedorId: r.proveedor_id,
      proveedor: r.proveedor,
      numeroFactura: r.numero_factura,
      subtotalCents: r.subtotal_cents,
      impuestoCents: r.impuesto_cents,
      totalCents: r.total_cents,
      pagadoCents: r.pagado_cents,
      saldoCents: Math.max(r.total_cents - r.pagado_cents, 0),
      venceEn: r.vence_en,
      notas: r.notas,
    })),
    totalCents: t.total,
    porPagarCents: t.por_pagar,
  };
}

/** Abona a una compra a crédito. */
export async function pagarCompra(
  db: D1Database,
  s: Sesion,
  id: string,
  montoCents: number,
  ahora = Date.now(),
): Promise<number> {
  const t = s.tintoreria.id;
  const c = await db
    .prepare(
      "select total_cents, pagado_cents from compras where tintoreria_id = ? and id = ? and eliminado_en is null",
    )
    .bind(t, id)
    .first<{ total_cents: number; pagado_cents: number }>();
  if (!c) throw noEncontrado();
  if (montoCents <= 0) throw new ErrorApp(400, "monto_invalido");
  if (c.pagado_cents + montoCents > c.total_cents) throw new ErrorApp(400, "pago_excede");
  const pagado = c.pagado_cents + montoCents;
  await db.batch([
    db
      .prepare("update compras set pagado_cents = ?, actualizado_en = ? where tintoreria_id = ? and id = ?")
      .bind(pagado, ahora, t, id),
    sentenciaAuditoria(
      db,
      {
        tintoreriaId: t,
        usuarioId: s.usuario.id,
        accion: "contabilidad.compra_pagada",
        entidad: "compra",
        entidadId: id,
        detalle: { montoCents },
      },
      ahora,
    ),
  ]);
  return pagado;
}

/** Borra la compra, su gasto y devuelve la existencia que había sumado. */
export async function eliminarCompra(
  db: D1Database,
  s: Sesion,
  id: string,
  ahora = Date.now(),
): Promise<void> {
  const t = s.tintoreria.id;
  const c = await db
    .prepare("select id from compras where tintoreria_id = ? and id = ? and eliminado_en is null")
    .bind(t, id)
    .first();
  if (!c) throw noEncontrado();
  const { results } = await db
    .prepare("select insumo_id, cantidad from compra_lineas where tintoreria_id = ? and compra_id = ?")
    .bind(t, id)
    .all<{ insumo_id: string | null; cantidad: number }>();
  await db.batch([
    db
      .prepare("update compras set eliminado_en = ?, actualizado_en = ? where tintoreria_id = ? and id = ?")
      .bind(ahora, ahora, t, id),
    db
      .prepare(
        "update gastos set eliminado_en = ?, actualizado_en = ? where tintoreria_id = ? and compra_id = ?",
      )
      .bind(ahora, ahora, t, id),
    sentenciaAuditoria(
      db,
      {
        tintoreriaId: t,
        usuarioId: s.usuario.id,
        accion: "contabilidad.compra_eliminada",
        entidad: "compra",
        entidadId: id,
      },
      ahora,
    ),
  ]);
  for (const l of results) {
    if (!l.insumo_id) continue;
    await moverInsumo(db, s, l.insumo_id, -l.cantidad, "compra borrada", "ajuste", ahora);
  }
}

/* ------------------------------------------------------------------ */
/* Ganancia, impuestos y cuentas por cobrar                            */
/* ------------------------------------------------------------------ */

export interface Ganancia {
  desde: string;
  hasta: string;
  ventasCents: number;
  gastosCents: number;
  utilidadCents: number;
  margenBps: number;
  porGrupo: { grupo: GrupoGasto; cents: number; sobreVentaBps: number }[];
  porCategoria: { categoria: string; grupo: GrupoGasto; cents: number }[];
  porDia: { fecha: string; ventasCents: number; gastosCents: number }[];
  /** Los dos números que manda el oficio: gente y servicios sobre la venta. */
  genteBps: number;
  serviciosBps: number;
}

const bps = (parte: number, total: number) => (total > 0 ? Math.round((parte / total) * 10_000) : 0);

export async function ganancia(
  db: D1Database,
  tintoreriaId: string,
  desde: string,
  hasta: string,
): Promise<Ganancia> {
  const ventas = await reporteVentas(db, tintoreriaId, desde, hasta);
  const [porCategoria, porDia] = await db.batch([
    db
      .prepare(
        `select categoria, coalesce(sum(monto_cents), 0) as cents from gastos
         where tintoreria_id = ? and eliminado_en is null and fecha_local between ? and ?
         group by categoria order by cents desc`,
      )
      .bind(tintoreriaId, desde, hasta),
    db
      .prepare(
        `select fecha_local, coalesce(sum(monto_cents), 0) as cents from gastos
         where tintoreria_id = ? and eliminado_en is null and fecha_local between ? and ?
         group by fecha_local`,
      )
      .bind(tintoreriaId, desde, hasta),
  ]);
  const categorias = ((porCategoria?.results ?? []) as { categoria: string; cents: number }[]).map((r) => ({
    categoria: r.categoria,
    grupo: grupoDe(r.categoria),
    cents: r.cents,
  }));
  const gastosPorDia = new Map(
    ((porDia?.results ?? []) as { fecha_local: string; cents: number }[]).map((r) => [
      r.fecha_local,
      r.cents,
    ]),
  );
  const gastosCents = categorias.reduce((n, c) => n + c.cents, 0);
  const ventasCents = ventas.cobradoCents;
  const grupos = GRUPOS_GASTO.map((g) => ({
    grupo: g,
    cents: categorias.filter((c) => c.grupo === g).reduce((n, c) => n + c.cents, 0),
  }))
    .filter((g) => g.cents > 0)
    .map((g) => ({ ...g, sobreVentaBps: bps(g.cents, ventasCents) }));
  return {
    desde,
    hasta,
    ventasCents,
    gastosCents,
    utilidadCents: ventasCents - gastosCents,
    margenBps: bps(ventasCents - gastosCents, ventasCents),
    porGrupo: grupos,
    porCategoria: categorias,
    porDia: ventas.porDia.map((d) => ({
      fecha: d.fecha,
      ventasCents: d.cobradoCents,
      gastosCents: gastosPorDia.get(d.fecha) ?? 0,
    })),
    genteBps: bps(
      categorias.filter((c) => c.grupo === "gente").reduce((n, c) => n + c.cents, 0),
      ventasCents,
    ),
    serviciosBps: bps(
      categorias.filter((c) => c.grupo === "servicios").reduce((n, c) => n + c.cents, 0),
      ventasCents,
    ),
  };
}

export interface Impuestos {
  desde: string;
  hasta: string;
  gravadaCents: number;
  exentaCents: number;
  impuestoCents: number;
  compradoImpuestoCents: number;
  porMes: { mes: string; gravadaCents: number; exentaCents: number; impuestoCents: number }[];
}

export async function impuestos(
  db: D1Database,
  tintoreriaId: string,
  desde: string,
  hasta: string,
): Promise<Impuestos> {
  const [piezas, ordenes, compras, meses] = await db.batch([
    db
      .prepare(
        `select op.aplica_impuesto as gravada, coalesce(sum(op.total_cents), 0) as cents
         from orden_prendas op join ordenes o on o.id = op.orden_id and o.tintoreria_id = op.tintoreria_id
         where op.tintoreria_id = ? and o.estado <> 'anulada' and o.fecha_local between ? and ?
         group by op.aplica_impuesto`,
      )
      .bind(tintoreriaId, desde, hasta),
    db
      .prepare(
        `select coalesce(sum(impuesto_cents), 0) as cents from ordenes
         where tintoreria_id = ? and estado <> 'anulada' and fecha_local between ? and ?`,
      )
      .bind(tintoreriaId, desde, hasta),
    db
      .prepare(
        `select coalesce(sum(impuesto_cents), 0) as cents from compras
         where tintoreria_id = ? and eliminado_en is null and fecha_local between ? and ?`,
      )
      .bind(tintoreriaId, desde, hasta),
    db
      .prepare(
        `select substr(o.fecha_local, 1, 7) as mes,
           coalesce(sum(case when op.aplica_impuesto = 1 then op.total_cents else 0 end), 0) as gravada,
           coalesce(sum(case when op.aplica_impuesto = 0 then op.total_cents else 0 end), 0) as exenta,
           0 as impuesto
         from orden_prendas op join ordenes o on o.id = op.orden_id and o.tintoreria_id = op.tintoreria_id
         where op.tintoreria_id = ? and o.estado <> 'anulada' and o.fecha_local between ? and ?
         group by mes order by mes`,
      )
      .bind(tintoreriaId, desde, hasta),
  ]);
  const filas = (piezas?.results ?? []) as { gravada: number; cents: number }[];
  const impuestoPorMes = await db
    .prepare(
      `select substr(fecha_local, 1, 7) as mes, coalesce(sum(impuesto_cents), 0) as cents from ordenes
       where tintoreria_id = ? and estado <> 'anulada' and fecha_local between ? and ? group by mes`,
    )
    .bind(tintoreriaId, desde, hasta)
    .all<{ mes: string; cents: number }>();
  const porMesImpuesto = new Map(impuestoPorMes.results.map((r) => [r.mes, r.cents]));
  return {
    desde,
    hasta,
    gravadaCents: filas.find((f) => f.gravada === 1)?.cents ?? 0,
    exentaCents: filas.find((f) => f.gravada === 0)?.cents ?? 0,
    impuestoCents: ((ordenes?.results ?? [])[0] as { cents: number } | undefined)?.cents ?? 0,
    compradoImpuestoCents: ((compras?.results ?? [])[0] as { cents: number } | undefined)?.cents ?? 0,
    porMes: ((meses?.results ?? []) as { mes: string; gravada: number; exenta: number }[]).map((m) => ({
      mes: m.mes,
      gravadaCents: m.gravada,
      exentaCents: m.exenta,
      impuestoCents: porMesImpuesto.get(m.mes) ?? 0,
    })),
  };
}

export interface PorCobrar {
  totalCents: number;
  tramos: { hasta10: number; hasta30: number; hasta60: number; masDe60: number };
  clientes: {
    clienteId: string;
    nombre: string;
    telefono: string | null;
    saldoCents: number;
    ordenes: number;
    diasMasViejo: number;
  }[];
}

/** Quién debe, cuánto y desde cuándo. `hoy` es la fecha local de la tienda. */
export async function porCobrar(db: D1Database, tintoreriaId: string, hoy: string): Promise<PorCobrar> {
  const { results } = await db
    .prepare(
      `select o.cliente_id, c.nombre, c.apellido, c.telefono,
         coalesce(sum(o.total_cents - o.pagado_cents), 0) as saldo,
         count(*) as n,
         min(o.fecha_local) as mas_vieja,
         coalesce(sum(case when julianday(?1) - julianday(o.fecha_local) <= 10 then o.total_cents - o.pagado_cents else 0 end), 0) as t10,
         coalesce(sum(case when julianday(?1) - julianday(o.fecha_local) > 10 and julianday(?1) - julianday(o.fecha_local) <= 30 then o.total_cents - o.pagado_cents else 0 end), 0) as t30,
         coalesce(sum(case when julianday(?1) - julianday(o.fecha_local) > 30 and julianday(?1) - julianday(o.fecha_local) <= 60 then o.total_cents - o.pagado_cents else 0 end), 0) as t60,
         coalesce(sum(case when julianday(?1) - julianday(o.fecha_local) > 60 then o.total_cents - o.pagado_cents else 0 end), 0) as tmas
       from ordenes o join clientes c on c.id = o.cliente_id and c.tintoreria_id = o.tintoreria_id
       where o.tintoreria_id = ?2 and o.estado not in ('anulada') and o.total_cents > o.pagado_cents
       group by o.cliente_id order by saldo desc limit 200`,
    )
    .bind(hoy, tintoreriaId)
    .all<{
      cliente_id: string;
      nombre: string;
      apellido: string | null;
      telefono: string | null;
      saldo: number;
      n: number;
      mas_vieja: string;
      t10: number;
      t30: number;
      t60: number;
      tmas: number;
    }>();
  const dias = (fecha: string) =>
    Math.max(0, Math.round((Date.parse(`${hoy}T00:00:00Z`) - Date.parse(`${fecha}T00:00:00Z`)) / 86_400_000));
  return {
    totalCents: results.reduce((n, r) => n + r.saldo, 0),
    tramos: {
      hasta10: results.reduce((n, r) => n + r.t10, 0),
      hasta30: results.reduce((n, r) => n + r.t30, 0),
      hasta60: results.reduce((n, r) => n + r.t60, 0),
      masDe60: results.reduce((n, r) => n + r.tmas, 0),
    },
    clientes: results.map((r) => ({
      clienteId: r.cliente_id,
      nombre: [r.nombre, r.apellido].filter(Boolean).join(" "),
      telefono: r.telefono,
      saldoCents: r.saldo,
      ordenes: r.n,
      diasMasViejo: dias(r.mas_vieja),
    })),
  };
}

export { CATEGORIAS_GASTO, GRUPOS_GASTO, METODOS_GASTO, INSUMOS_ESTANDAR };
