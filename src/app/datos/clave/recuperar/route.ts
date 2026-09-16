import { z } from "zod";
import { verificarTurnstile } from "@/server/auth/turnstile";
import { solicitarRecuperacion } from "@/server/cuentas/claves";
import { esquemaCorreo } from "@/server/cuentas/validaciones";
import { ErrorApp } from "@/server/errores";
import { limitar } from "@/server/limites";
import { ruta } from "@/server/ruta";

export const POST = ruta({
  acceso: "publico",
  cuerpo: z.object({ correo: esquemaCorreo }),
  limite: { clave: (c) => `recuperar:ip:${c.ipHash}`, max: 10, ventanaSeg: 3600 },
  manejar: async (c) => {
    const t = await verificarTurnstile(c.vars.TURNSTILE_SECRET_KEY, c.req.headers.get("x-turnstile"), c.ip);
    if (t === "rechazado") throw new ErrorApp(400, "turnstile");
    const porCorreo = await limitar(c.db, `recuperar:correo:${c.cuerpo.correo}`, 3, 3600, c.ahora);
    if (porCorreo.permitido) {
      await solicitarRecuperacion(c.db, c.env, c.vars, c.cuerpo.correo, c.idioma, c.ahora);
    }
    // Misma respuesta siempre: no revela si el correo tiene cuenta.
    return { ok: true };
  },
});
