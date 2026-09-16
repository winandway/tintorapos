import { cookieSalir } from "@/server/auth/cookies-sesion";
import { cerrarSesion } from "@/server/auth/sesiones";
import { sentenciaAuditoria } from "@/server/auditoria";
import { COOKIE_SESION } from "@/server/cookies";
import { ruta } from "@/server/ruta";

/**
 * Cerrar sesión DE VERDAD: borra la sesión en el servidor y la cookie.
 * El dispositivo registrado (si lo hay) se queda: la tablet vuelve a la pantalla de PIN.
 */
export const POST = ruta({
  acceso: "publico",
  manejar: async (c) => {
    if (c.sesion) {
      await sentenciaAuditoria(
        c.db,
        {
          tintoreriaId: c.sesion.tintoreria.id,
          usuarioId: c.sesion.usuario.id,
          dispositivoId: c.sesion.dispositivoId,
          accion: "sesion.salir",
          detalle: { tipo: c.sesion.tipo },
        },
        c.ahora,
      ).run();
    }
    await cerrarSesion(c.db, c.cookies[COOKIE_SESION]);
    c.ponerCookie(cookieSalir());
    return { ok: true, dispositivo: Boolean(c.cookies.tp_disp) };
  },
});
