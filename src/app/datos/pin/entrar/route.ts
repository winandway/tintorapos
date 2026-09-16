import { z } from "zod";
import { verificarPinUsuario } from "@/server/auth/autorizacion";
import { cookieSesion } from "@/server/auth/cookies-sesion";
import { cerrarSesion, crearSesion } from "@/server/auth/sesiones";
import { sentenciaAuditoria } from "@/server/auditoria";
import { COOKIE_SESION } from "@/server/cookies";
import { ErrorApp } from "@/server/errores";
import { ruta } from "@/server/ruta";

/** Un empleado entra en el dispositivo de la tienda con su PIN. */
export const POST = ruta({
  acceso: "dispositivo",
  cuerpo: z.object({ usuarioId: z.string().min(1).max(64), pin: z.string().regex(/^\d{4,6}$/) }),
  limite: { clave: (c) => `pin:${c.dispositivo?.id}`, max: 40, ventanaSeg: 900 },
  manejar: async (c) => {
    const disp = c.dispositivo!;
    const r = await verificarPinUsuario(c.db, disp.tintoreriaId, c.cuerpo.usuarioId, c.cuerpo.pin, c.ahora);
    if (!r.ok) {
      await sentenciaAuditoria(
        c.db,
        {
          tintoreriaId: disp.tintoreriaId,
          usuarioId: r.motivo === "no_existe" ? null : c.cuerpo.usuarioId,
          dispositivoId: disp.id,
          accion: "sesion.pin_fallido",
          detalle: { motivo: r.motivo },
        },
        c.ahora,
      ).run();
      if (r.motivo === "bloqueado") throw new ErrorApp(429, "pin_bloqueado", { minutos: r.minutos });
      if (r.motivo === "incorrecto") throw new ErrorApp(401, "pin_incorrecto", { restantes: r.restantes });
      throw new ErrorApp(401, "no_encontrado");
    }
    await cerrarSesion(c.db, c.cookies[COOKIE_SESION]);
    const token = await crearSesion(
      c.db,
      {
        tintoreriaId: disp.tintoreriaId,
        usuarioId: c.cuerpo.usuarioId,
        tipo: "pin",
        dispositivoId: disp.id,
        segundoFactorOk: true,
        agente: c.req.headers.get("user-agent"),
      },
      c.ahora,
    );
    await sentenciaAuditoria(
      c.db,
      {
        tintoreriaId: disp.tintoreriaId,
        usuarioId: c.cuerpo.usuarioId,
        dispositivoId: disp.id,
        accion: "sesion.entrar",
        detalle: { tipo: "pin" },
      },
      c.ahora,
    ).run();
    c.ponerCookie(cookieSesion(token, "pin"));
    return { ok: true };
  },
});
