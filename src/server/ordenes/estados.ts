import { z } from "zod";
import { nuevoId } from "@/lib/codigos";
import { sentenciaAuditoria } from "@/server/auditoria";
import type { Sesion } from "@/server/auth/sesiones";
import { ErrorApp, noEncontrado } from "@/server/errores";
import type { Estado } from "./consultas";

export const esquemaCambioEstado = z.object({
  estado: z.enum(["recibida", "en_proceso", "lista"]),
  prendaIds: z.array(z.string().min(1).max(64)).max(200).optional(),
  ubicacion: z
    .string()
    .trim()
    .max(20)
    .transform((v) => (v === "" ? null : v))
    .nullable()
    .optional(),
});

const ORDEN_ESTADO: Record<string, number> = { recibida: 0, en_proceso: 1, lista: 2 };

/** Estado de la orden a partir de sus piezas: lista cuando TODAS están listas. */
export function estadoDeOrden(estadosPiezas: string[]): Estado {
  const vivas = estadosPiezas.filter((e) => e !== "anulada");
  if (!vivas.length) return "recibida";
  if (vivas.every((e) => e === "lista")) return "lista";
  if (vivas.some((e) => e === "en_proceso" || e === "lista")) return "en_proceso";
  return "recibida";
}

export interface ResultadoCambio {
  estadoAnterior: Estado;
  estadoNuevo: Estado;
  quedoLista: boolean;
  piezasCambiadas: number;
}

/**
 * Mueve piezas (o la orden completa) entre recibida → en proceso → lista, y
 * guarda el lugar en el rack. Se puede retroceder un paso para corregir.
 */
export async function cambiarEstado(
  db: D1Database,
  s: Sesion,
  ordenId: string,
  d: z.infer<typeof esquemaCambioEstado>,
  ahora = Date.now(),
): Promise<ResultadoCambio> {
  const o = await db
    .prepare("select estado from ordenes where tintoreria_id = ? and id = ?")
    .bind(s.tintoreria.id, ordenId)
    .first<{ estado: Estado }>();
  if (!o) throw noEncontrado();
  if (!(o.estado in ORDEN_ESTADO)) throw new ErrorApp(409, "orden_cerrada");
  const { results: piezas } = await db
    .prepare(
      "select id, estado from orden_prendas where tintoreria_id = ? and orden_id = ? and estado != 'anulada'",
    )
    .bind(s.tintoreria.id, ordenId)
    .all<{ id: string; estado: string }>();
  const objetivo = d.prendaIds?.length ? piezas.filter((p) => d.prendaIds!.includes(p.id)) : piezas;
  if (d.prendaIds?.length && objetivo.length !== new Set(d.prendaIds).size) throw noEncontrado();

  const sentencias: D1PreparedStatement[] = [];
  let cambiadas = 0;
  for (const p of objetivo) {
    const desde = ORDEN_ESTADO[p.estado] ?? 0;
    const hasta = ORDEN_ESTADO[d.estado] ?? 0;
    if (p.estado === d.estado && d.ubicacion === undefined) continue;
    if (hasta < desde - 1) throw new ErrorApp(400, "estado_invalido");
    cambiadas++;
    sentencias.push(
      db
        .prepare(
          "update orden_prendas set estado = ?, ubicacion = coalesce(?, ubicacion), actualizada_en = ? where tintoreria_id = ? and id = ?",
        )
        .bind(d.estado, d.ubicacion ?? null, ahora, s.tintoreria.id, p.id),
      db
        .prepare(
          "insert into orden_estados (id, tintoreria_id, orden_id, prenda_id, estado_anterior, estado_nuevo, ubicacion, usuario_id, dispositivo_id, creado_en) values (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
        )
        .bind(
          nuevoId(),
          s.tintoreria.id,
          ordenId,
          p.id,
          p.estado,
          d.estado,
          d.ubicacion ?? null,
          s.usuario.id,
          s.dispositivoId,
          ahora,
        ),
    );
  }
  const nuevosEstados = piezas.map((p) => (objetivo.some((x) => x.id === p.id) ? d.estado : p.estado));
  const estadoNuevo = estadoDeOrden(nuevosEstados);
  const quedoLista = estadoNuevo === "lista" && o.estado !== "lista";
  if (estadoNuevo !== o.estado) {
    sentencias.push(
      db
        .prepare(
          "update ordenes set estado = ?, lista_en = case when ? = 'lista' then ? else null end, actualizada_en = ? where tintoreria_id = ? and id = ?",
        )
        .bind(estadoNuevo, estadoNuevo, ahora, ahora, s.tintoreria.id, ordenId),
      sentenciaAuditoria(
        db,
        {
          tintoreriaId: s.tintoreria.id,
          usuarioId: s.usuario.id,
          dispositivoId: s.dispositivoId,
          accion: "orden.estado",
          entidad: "orden",
          entidadId: ordenId,
          detalle: { de: o.estado, a: estadoNuevo },
        },
        ahora,
      ),
    );
  } else if (sentencias.length) {
    sentencias.push(
      db
        .prepare("update ordenes set actualizada_en = ? where tintoreria_id = ? and id = ?")
        .bind(ahora, s.tintoreria.id, ordenId),
    );
  }
  if (sentencias.length) await db.batch(sentencias);
  return { estadoAnterior: o.estado, estadoNuevo, quedoLista, piezasCambiadas: cambiadas };
}
