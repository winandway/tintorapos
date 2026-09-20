import { z } from "zod";
import { iniciarDosPasos } from "@/server/auth/dos-pasos";
import { ruta } from "@/server/ruta";

/**
 * Prepara la verificación en dos pasos y devuelve el QR. Conserva el secreto
 * que ya se generó (para que un vaivén de la página no invalide lo escaneado);
 * con `regenerar: true` se hace uno nuevo a propósito.
 */
export const POST = ruta({
  acceso: "pendiente",
  cuerpo: z.object({ regenerar: z.boolean().optional() }).optional(),
  limite: { clave: (c) => `dos-pasos-iniciar:${c.sesion?.usuario.id}`, max: 10, ventanaSeg: 900 },
  manejar: async (c) =>
    iniciarDosPasos(c.db, c.vars.APP_SECRET, c.sesion!, { regenerar: c.cuerpo?.regenerar }),
});
