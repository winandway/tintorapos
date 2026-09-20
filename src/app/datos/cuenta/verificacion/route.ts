import { pedirVerificacion } from "@/server/cuentas/verificacion";
import { ErrorApp } from "@/server/errores";
import { ruta } from "@/server/ruta";

/** Volver a mandar el correo de confirmación (el enlace vence o se pierde). */
export const POST = ruta({
  acceso: "cuenta",
  limite: { clave: (c) => `verificacion:${c.sesion?.usuario.id}`, max: 3, ventanaSeg: 3600 },
  manejar: async (c) => {
    const u = c.sesion!.usuario;
    if (!u.correo) throw new ErrorApp(400, "datos_invalidos");
    await pedirVerificacion(
      c.db,
      c.vars,
      { id: u.id, tintoreriaId: c.sesion!.tintoreria.id, nombre: u.nombre, correo: u.correo },
      c.idioma,
      c.ahora,
    );
    return { ok: true };
  },
});
