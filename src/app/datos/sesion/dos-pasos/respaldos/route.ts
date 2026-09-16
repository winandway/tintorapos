import { z } from "zod";
import { regenerarRespaldos } from "@/server/auth/dos-pasos";
import { ruta } from "@/server/ruta";

export const POST = ruta({
  acceso: "cuenta",
  cuerpo: z.object({ codigo: z.string().trim().min(6).max(8) }),
  limite: { clave: (c) => `dos-pasos-respaldos:${c.sesion?.usuario.id}`, max: 6, ventanaSeg: 900 },
  manejar: async (c) => regenerarRespaldos(c.db, c.vars.APP_SECRET, c.sesion!, c.cuerpo.codigo, c.ahora),
});
