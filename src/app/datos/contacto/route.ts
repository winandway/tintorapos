import { z } from "zod";
import { esquemaCorreo } from "@/server/cuentas/validaciones";
import { guardarMensaje } from "@/server/contacto";
import { ruta } from "@/server/ruta";

/** Mensajes del formulario público. Se guardan siempre; el correo es un extra. */
export const POST = ruta({
  acceso: "publico",
  csrf: false,
  limite: { clave: (c) => `contacto:${c.ipHash}`, max: 5, ventanaSeg: 3600 },
  cuerpo: z.object({
    nombre: z.string().trim().min(2).max(80),
    correo: esquemaCorreo,
    asunto: z.string().trim().max(120).optional(),
    mensaje: z.string().trim().min(10).max(4000),
  }),
  manejar: async (c) => {
    await guardarMensaje(c.db, c.vars, c.cuerpo, c.idioma, c.ipHash, c.ahora);
    return { ok: true };
  },
});
