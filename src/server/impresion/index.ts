/**
 * Reglas de impresión que comparten la pantalla de imprimir y la impresión
 * directa. La importante: el recibo del CLIENTE se reimprime libremente solo
 * en los primeros 15 minutos de la orden; después hace falta que un gerente lo
 * autorice (evita recibos duplicados para cobrar dos veces o retirar ropa).
 */
import type { Sesion } from "@/server/auth/sesiones";
import type { Orden } from "@/server/ordenes/consultas";

export const VENTANA_SIN_AUTORIZACION = 15 * 60_000;

export async function puedeImprimirRecibo(
  db: D1Database,
  s: Sesion,
  orden: Pick<Orden, "id" | "creadaEn">,
  ahora: number,
): Promise<boolean> {
  if (orden.creadaEn > ahora - VENTANA_SIN_AUTORIZACION) return true;
  const autorizada = await db
    .prepare(
      "select id from auditoria where tintoreria_id = ? and entidad_id = ? and accion = 'orden.reimpresion_recibo' and creado_en > ? limit 1",
    )
    .bind(s.tintoreria.id, orden.id, ahora - VENTANA_SIN_AUTORIZACION)
    .first();
  return Boolean(autorizada);
}
