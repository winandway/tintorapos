import { esAdmin } from "@/lib/soporte";
import { sinPermiso } from "@/server/errores";
import type { Sesion } from "@/server/auth/sesiones";
import type { Variables } from "@/env";

/**
 * CANDADO DEL PANEL DE WINDOCE: aquí se ven TODAS las tintorerías, así que la
 * puerta se comprueba en cada ruta. Solo entra una sesión de cuenta (no de PIN)
 * cuyo correo esté en `CORREOS_ADMIN`, y con el segundo paso ya pasado.
 */
export function exigirAdmin(c: { sesion: Sesion | null; vars: Variables }): void {
  const s = c.sesion;
  if (!s || s.tipo !== "cuenta" || !s.segundoFactorOk) throw sinPermiso();
  if (!esAdmin(c.vars, s.usuario.correo)) throw sinPermiso();
}
