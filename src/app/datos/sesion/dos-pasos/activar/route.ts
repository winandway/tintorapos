import { z } from "zod";
import { activarDosPasos } from "@/server/auth/dos-pasos";
import { ruta } from "@/server/ruta";

/** Confirma el primer código y activa los dos pasos. Devuelve los códigos de respaldo UNA sola vez. */
export const POST = ruta({
  acceso: "pendiente",
  cuerpo: z.object({ codigo: z.string().trim().min(6).max(8) }),
  limite: { clave: (c) => `dos-pasos-activar:${c.sesion?.usuario.id}`, max: 10, ventanaSeg: 900 },
  manejar: async (c) => activarDosPasos(c.db, c.vars.APP_SECRET, c.sesion!, c.cuerpo.codigo, c.ahora),
});
