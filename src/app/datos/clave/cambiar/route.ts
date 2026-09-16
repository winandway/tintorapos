import { z } from "zod";
import { cambiarClave } from "@/server/cuentas/claves";
import { ruta } from "@/server/ruta";

export const POST = ruta({
  acceso: "cuenta",
  permitirCambioClave: true,
  cuerpo: z.object({ actual: z.string().min(1).max(200), nueva: z.string().min(1).max(200) }),
  limite: { clave: (c) => `clave-cambiar:${c.sesion?.usuario.id}`, max: 10, ventanaSeg: 900 },
  manejar: async (c) => {
    await cambiarClave(c.db, c.sesion!, c.cuerpo.actual, c.cuerpo.nueva, c.ahora);
    return { ok: true };
  },
});
