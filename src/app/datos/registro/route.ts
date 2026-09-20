import { z } from "zod";
import { esIdioma } from "@/lib/i18n/idiomas";
import { crearSesion } from "@/server/auth/sesiones";
import { cookieSesion } from "@/server/auth/cookies-sesion";
import { verificarTurnstile } from "@/server/auth/turnstile";
import { registrarTintoreria } from "@/server/cuentas/registro";
import { pedirVerificacion } from "@/server/cuentas/verificacion";
import {
  esquemaCorreo,
  esquemaMoneda,
  esquemaNombre,
  esquemaPais,
  esquemaZona,
  exigirClave,
  exigirNombreSoporte,
} from "@/server/cuentas/validaciones";
import { ErrorApp } from "@/server/errores";
import { ruta } from "@/server/ruta";

const cuerpo = z.object({
  negocio: z.string().trim().min(2).max(80),
  nombre: esquemaNombre,
  correo: esquemaCorreo,
  clave: z.string().min(1).max(200),
  zonaHoraria: esquemaZona,
  idioma: z.string().refine(esIdioma),
  pais: esquemaPais,
  moneda: esquemaMoneda,
  telefono: z.string().trim().max(30).optional(),
  aceptaTerminos: z.literal(true, "acepta_terminos"),
});

/** Alta de una tintorería nueva con prueba gratis. Crea la sesión y pide activar dos pasos. */
export const POST = ruta({
  acceso: "publico",
  cuerpo,
  limite: { clave: (c) => `registro:${c.ipHash}`, max: 5, ventanaSeg: 3600 },
  manejar: async (c) => {
    const t = await verificarTurnstile(c.vars.TURNSTILE_SECRET_KEY, c.req.headers.get("x-turnstile"), c.ip);
    if (t === "rechazado") throw new ErrorApp(400, "turnstile");
    exigirClave(c.cuerpo.clave, c.cuerpo.correo);
    exigirNombreSoporte(c.cuerpo.nombre, c.cuerpo.correo);

    const r = await registrarTintoreria(
      c.db,
      {
        negocio: c.cuerpo.negocio,
        nombre: c.cuerpo.nombre,
        correo: c.cuerpo.correo,
        clave: c.cuerpo.clave,
        zonaHoraria: c.cuerpo.zonaHoraria,
        idioma: esIdioma(c.cuerpo.idioma) ? c.cuerpo.idioma : c.idioma,
        pais: c.cuerpo.pais,
        moneda: c.cuerpo.moneda,
        telefono: c.cuerpo.telefono || null,
      },
      c.ahora,
    );
    // El correo de bienvenida con el enlace de verificación sale después de
    // responder: si el proveedor tarda, el registro no se queda esperando.
    c.esperarLuego(
      pedirVerificacion(
        c.db,
        c.vars,
        {
          id: r.usuarioId,
          tintoreriaId: r.tintoreriaId,
          nombre: c.cuerpo.nombre,
          correo: c.cuerpo.correo,
        },
        esIdioma(c.cuerpo.idioma) ? c.cuerpo.idioma : c.idioma,
        c.ahora,
      ).catch((e) => console.error("[registro] no se pudo mandar la verificación:", e)),
    );

    const token = await crearSesion(
      c.db,
      {
        tintoreriaId: r.tintoreriaId,
        usuarioId: r.usuarioId,
        tipo: "cuenta",
        segundoFactorOk: false,
        agente: c.req.headers.get("user-agent"),
      },
      c.ahora,
    );
    c.ponerCookie(cookieSesion(token, "cuenta"));
    return { ok: true, siguiente: "dos_pasos_activar" };
  },
});
