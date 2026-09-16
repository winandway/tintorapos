import { z } from "zod";
import { restablecerClave } from "@/server/cuentas/claves";
import { ruta } from "@/server/ruta";

export const POST = ruta({
  acceso: "publico",
  cuerpo: z.object({ token: z.string().min(20).max(100), clave: z.string().min(1).max(200) }),
  limite: { clave: (c) => `restablecer:${c.ipHash}`, max: 10, ventanaSeg: 3600 },
  manejar: async (c) => {
    await restablecerClave(c.db, c.cuerpo.token, c.cuerpo.clave, c.ahora);
    return { ok: true };
  },
});
