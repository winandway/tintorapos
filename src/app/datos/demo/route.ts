import { crearSesion } from "@/server/auth/sesiones";
import { cookieSesion } from "@/server/auth/cookies-sesion";
import { crearDemo, demosVivas, limpiarDemos, MAX_DEMOS_VIVAS } from "@/server/demo";
import { ErrorApp } from "@/server/errores";
import { ruta } from "@/server/ruta";

/**
 * Abre una demostración: crea una tintorería de mentira con un día de trabajo
 * dentro y deja a quien llegó adentro del sistema, sin registrarse. Se borra
 * sola a las 24 horas (el reloj la limpia).
 */
export const POST = ruta({
  acceso: "publico",
  limite: { clave: (c) => `demo:${c.ipHash}`, max: 5, ventanaSeg: 3600 },
  manejar: async (c) => {
    if ((await demosVivas(c.db)) >= MAX_DEMOS_VIVAS) {
      await limpiarDemos(c.env, c.ahora);
      if ((await demosVivas(c.db)) >= MAX_DEMOS_VIVAS) throw new ErrorApp(503, "demo_lleno");
    }
    const d = await crearDemo(c.db, c.idioma, c.ahora, {
      paisVisitante: c.req.headers.get("cf-ipcountry"),
    });
    const token = await crearSesion(
      c.db,
      {
        tintoreriaId: d.tintoreriaId,
        usuarioId: d.usuarioId,
        tipo: "cuenta",
        // El dueño del demo no tiene correo ni contraseña: no hay segundo paso
        // que activar, así que entra directo a las pantallas.
        segundoFactorOk: true,
        agente: c.req.headers.get("user-agent"),
      },
      c.ahora,
    );
    c.ponerCookie(cookieSesion(token, "cuenta"));
    return { ok: true, siguiente: "app" };
  },
});
