import { z } from "zod";
import { nuevoId } from "@/lib/codigos";
import { sentenciaAuditoria } from "@/server/auditoria";
import { resolverAutorizacion, type Autorizacion } from "@/server/auth/autorizacion";
import type { Sesion } from "@/server/auth/sesiones";
import { ErrorApp, noEncontrado } from "@/server/errores";
import { tienePermiso } from "@/server/permisos";

export const esquemaAutorizacion = z.object({
  usuarioId: z.string().min(1).max(64),
  pin: z.string().regex(/^\d{4,6}$/),
});

export interface Turno {
  id: string;
  sucursalId: string;
  estado: "abierto" | "cerrado";
  abiertoPor: string;
  abiertoPorNombre: string | null;
  abiertoEn: number;
  fondoCents: number;
  cerradoPor: string | null;
  cerradoEn: number | null;
  contadoCents: number | null;
  esperadoCents: number | null;
  diferenciaCents: number | null;
}

interface FilaTurno {
  id: string;
  sucursal_id: string;
  estado: "abierto" | "cerrado";
  abierto_por: string;
  abierto_por_nombre: string | null;
  abierto_en: number;
  fondo_cents: number;
  cerrado_por: string | null;
  cerrado_en: number | null;
  contado_cents: number | null;
  esperado_cents: number | null;
  diferencia_cents: number | null;
}

const aTurno = (f: FilaTurno): Turno => ({
  id: f.id,
  sucursalId: f.sucursal_id,
  estado: f.estado,
  abiertoPor: f.abierto_por,
  abiertoPorNombre: f.abierto_por_nombre,
  abiertoEn: f.abierto_en,
  fondoCents: f.fondo_cents,
  cerradoPor: f.cerrado_por,
  cerradoEn: f.cerrado_en,
  contadoCents: f.contado_cents,
  esperadoCents: f.esperado_cents,
  diferenciaCents: f.diferencia_cents,
});

const SELECT_TURNO = `select t.*, u.nombre as abierto_por_nombre from turnos_caja t
  left join usuarios u on u.id = t.abierto_por and u.tintoreria_id = t.tintoreria_id`;

export async function turnoAbierto(
  db: D1Database,
  tintoreriaId: string,
  sucursalId: string,
): Promise<Turno | null> {
  const f = await db
    .prepare(`${SELECT_TURNO} where t.tintoreria_id = ? and t.sucursal_id = ? and t.estado = 'abierto'`)
    .bind(tintoreriaId, sucursalId)
    .first<FilaTurno>();
  return f ? aTurno(f) : null;
}

export async function abrirTurno(
  db: D1Database,
  s: Sesion,
  fondoCents: number,
  ahora = Date.now(),
): Promise<string> {
  const id = nuevoId();
  try {
    await db.batch([
      db
        .prepare(
          "insert into turnos_caja (id, tintoreria_id, sucursal_id, dispositivo_id, abierto_por, abierto_en, fondo_cents) values (?, ?, ?, ?, ?, ?, ?)",
        )
        .bind(id, s.tintoreria.id, s.sucursalId, s.dispositivoId, s.usuario.id, ahora, fondoCents),
      sentenciaAuditoria(
        db,
        {
          tintoreriaId: s.tintoreria.id,
          usuarioId: s.usuario.id,
          dispositivoId: s.dispositivoId,
          accion: "caja.abierta",
          entidad: "turno",
          entidadId: id,
          detalle: { fondoCents },
        },
        ahora,
      ),
    ]);
  } catch (e) {
    if (e instanceof Error && /UNIQUE/i.test(e.message)) throw new ErrorApp(409, "turno_abierto");
    throw e;
  }
  return id;
}

export interface ResumenTurno {
  turno: Turno;
  ventasPorMetodo: Record<"efectivo" | "tarjeta_externa" | "otro", number>;
  pagosCantidad: number;
  anuladosCents: number;
  entradasCents: number;
  salidasCents: number;
  sinVenta: number;
  esperadoCents: number;
  movimientos: {
    id: string;
    tipo: string;
    montoCents: number;
    motivo: string;
    usuario: string | null;
    autorizadoPor: string | null;
    creadoEn: number;
  }[];
}

export async function resumenTurno(
  db: D1Database,
  tintoreriaId: string,
  turnoId: string,
): Promise<ResumenTurno> {
  const [t, pagos, movs] = await db.batch([
    db.prepare(`${SELECT_TURNO} where t.tintoreria_id = ? and t.id = ?`).bind(tintoreriaId, turnoId),
    db
      .prepare(
        `select metodo, coalesce(sum(case when anulado_en is null then monto_cents else 0 end), 0) as activo,
           coalesce(sum(case when anulado_en is not null then monto_cents else 0 end), 0) as anulado,
           sum(case when anulado_en is null then 1 else 0 end) as n
         from pagos where tintoreria_id = ? and turno_id = ? group by metodo`,
      )
      .bind(tintoreriaId, turnoId),
    db
      .prepare(
        `select m.id, m.tipo, m.monto_cents, m.motivo, m.creado_en, u.nombre as usuario, g.nombre as autorizado
         from movimientos_caja m
         left join usuarios u on u.id = m.usuario_id and u.tintoreria_id = m.tintoreria_id
         left join usuarios g on g.id = m.autorizado_por and g.tintoreria_id = m.tintoreria_id
         where m.tintoreria_id = ? and m.turno_id = ? order by m.creado_en`,
      )
      .bind(tintoreriaId, turnoId),
  ]);
  const fila = (t?.results as FilaTurno[] | undefined)?.[0];
  if (!fila) throw noEncontrado();
  const ventas = { efectivo: 0, tarjeta_externa: 0, otro: 0 };
  let anulados = 0;
  let cantidad = 0;
  for (const p of (pagos?.results ?? []) as {
    metodo: keyof typeof ventas;
    activo: number;
    anulado: number;
    n: number;
  }[]) {
    ventas[p.metodo] = p.activo;
    anulados += p.anulado;
    cantidad += p.n ?? 0;
  }
  const movimientos = (
    (movs?.results ?? []) as {
      id: string;
      tipo: string;
      monto_cents: number;
      motivo: string;
      creado_en: number;
      usuario: string | null;
      autorizado: string | null;
    }[]
  ).map((m) => ({
    id: m.id,
    tipo: m.tipo,
    montoCents: m.monto_cents,
    motivo: m.motivo,
    usuario: m.usuario,
    autorizadoPor: m.autorizado,
    creadoEn: m.creado_en,
  }));
  const entradas = movimientos.filter((m) => m.tipo === "entrada").reduce((a, m) => a + m.montoCents, 0);
  const salidas = movimientos.filter((m) => m.tipo === "salida").reduce((a, m) => a + m.montoCents, 0);
  return {
    turno: aTurno(fila),
    ventasPorMetodo: ventas,
    pagosCantidad: cantidad,
    anuladosCents: anulados,
    entradasCents: entradas,
    salidasCents: salidas,
    sinVenta: movimientos.filter((m) => m.tipo === "sin_venta").length,
    esperadoCents: fila.fondo_cents + ventas.efectivo + entradas - salidas,
    movimientos,
  };
}

export const esquemaMovimiento = z.object({
  tipo: z.enum(["entrada", "salida", "sin_venta"]),
  montoCents: z.number().int().min(0).max(100_000_000),
  motivo: z.string().trim().min(3).max(200),
  autorizacion: esquemaAutorizacion.optional(),
});

export async function registrarMovimiento(
  db: D1Database,
  s: Sesion,
  d: z.infer<typeof esquemaMovimiento>,
  ahora = Date.now(),
): Promise<string> {
  const turno = await turnoAbierto(db, s.tintoreria.id, s.sucursalId);
  if (!turno) throw new ErrorApp(409, "turno_cerrado");
  const autorizadoPor = await resolverAutorizacion(
    db,
    s,
    d.tipo === "sin_venta" ? "caja.sin_venta" : "caja.movimientos",
    d.autorizacion as Autorizacion | undefined,
    ahora,
  );
  if (d.tipo !== "sin_venta" && d.montoCents <= 0)
    throw new ErrorApp(400, "monto_invalido", {}, { montoCents: "invalido" });
  const id = nuevoId();
  const monto = d.tipo === "sin_venta" ? 0 : d.montoCents;
  await db.batch([
    db
      .prepare(
        "insert into movimientos_caja (id, tintoreria_id, turno_id, tipo, monto_cents, motivo, usuario_id, autorizado_por, creado_en) values (?, ?, ?, ?, ?, ?, ?, ?, ?)",
      )
      .bind(id, s.tintoreria.id, turno.id, d.tipo, monto, d.motivo, s.usuario.id, autorizadoPor, ahora),
    sentenciaAuditoria(
      db,
      {
        tintoreriaId: s.tintoreria.id,
        usuarioId: s.usuario.id,
        autorizadoPor,
        dispositivoId: s.dispositivoId,
        accion: `caja.${d.tipo}`,
        entidad: "turno",
        entidadId: turno.id,
        detalle: { montoCents: monto },
      },
      ahora,
    ),
  ]);
  return id;
}

/**
 * Cierre CIEGO: el cajero cuenta el efectivo sin ver lo que el sistema espera.
 * La diferencia queda registrada; solo quien puede ver diferencias la recibe.
 */
export async function cerrarTurno(
  db: D1Database,
  s: Sesion,
  contadoCents: number,
  notas: string | null,
  ahora = Date.now(),
): Promise<{ turnoId: string; esperadoCents?: number; diferenciaCents?: number }> {
  const turno = await turnoAbierto(db, s.tintoreria.id, s.sucursalId);
  if (!turno) throw new ErrorApp(409, "turno_cerrado");
  const r = await resumenTurno(db, s.tintoreria.id, turno.id);
  const diferencia = contadoCents - r.esperadoCents;
  await db.batch([
    db
      .prepare(
        `update turnos_caja set estado = 'cerrado', cerrado_por = ?, cerrado_en = ?, contado_cents = ?, esperado_cents = ?, diferencia_cents = ?, notas = ?
         where tintoreria_id = ? and id = ? and estado = 'abierto'`,
      )
      .bind(s.usuario.id, ahora, contadoCents, r.esperadoCents, diferencia, notas, s.tintoreria.id, turno.id),
    sentenciaAuditoria(
      db,
      {
        tintoreriaId: s.tintoreria.id,
        usuarioId: s.usuario.id,
        dispositivoId: s.dispositivoId,
        accion: "caja.cerrada",
        entidad: "turno",
        entidadId: turno.id,
        detalle: { contadoCents, esperadoCents: r.esperadoCents, diferenciaCents: diferencia },
      },
      ahora,
    ),
  ]);
  if (tienePermiso(s.usuario.rol, "caja.ver_diferencias")) {
    return { turnoId: turno.id, esperadoCents: r.esperadoCents, diferenciaCents: diferencia };
  }
  return { turnoId: turno.id };
}

export async function listarTurnos(db: D1Database, tintoreriaId: string, limite = 30): Promise<Turno[]> {
  const { results } = await db
    .prepare(`${SELECT_TURNO} where t.tintoreria_id = ? order by t.abierto_en desc limit ?`)
    .bind(tintoreriaId, Math.min(100, limite))
    .all<FilaTurno>();
  return results.map(aTurno);
}
