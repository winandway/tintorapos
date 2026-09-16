import { z } from "zod";
import { verificarDosPasos } from "@/server/auth/dos-pasos";
import { ruta } from "@/server/ruta";

/** Al entrar: código de la app autenticadora o un código de respaldo. */
export const POST = ruta({
  acceso: "pendiente",
  cuerpo: z
    .object({
      codigo: z.string().trim().max(8).optional(),
      respaldo: z.string().trim().max(12).optional(),
    })
    .refine((v) => Boolean(v.codigo || v.respaldo), { message: "requerido", path: ["codigo"] }),
  limite: { clave: (c) => `dos-pasos-verificar:${c.sesion?.usuario.id}`, max: 6, ventanaSeg: 900 },
  manejar: async (c) => verificarDosPasos(c.db, c.vars.APP_SECRET, c.sesion!, c.cuerpo, c.ahora),
});
