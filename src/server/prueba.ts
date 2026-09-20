import type { Sesion } from "@/server/auth/sesiones";

/**
 * La prueba gratis se acabó: se puede mirar y exportar, no seguir trabajando.
 * Vive aparte de `pagina.ts` porque lo usa también `ruta.ts`, y ese archivo no
 * puede arrastrar nada de «server-only».
 */
export function pruebaTerminada(t: Sesion["tintoreria"], ahora = Date.now()): boolean {
  return t.plan === "prueba" && t.pruebaHasta !== null && ahora > t.pruebaHasta;
}
